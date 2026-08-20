import { addDays, todayISO } from "../utils/dates";
import {
  DOCTORS,
  PATIENT_PASSWORD,
  PATIENTS,
  SPECIALTIES,
} from "../data/catalog";

export { DEMO_ACCOUNTS } from "../data/catalog";

const WEEKDAY_HOURS = { from: "12:00", to: "21:00" };
const FRIDAY = 5;
const BLOOD_GROUPS = ["O +ve", "A +ve", "B +ve", "AB +ve", "O -ve"];
const GENDERS = ["male", "female", "male", "male", "female", "male", "female", "male", "female", "male"];
const CLINIC_ADDRESSES = [
  "Downtown Medical Clinic, Cairo",
  "Nile Skin Center, Zamalek",
  "Little Stars Pediatrics, Maadi",
  "Movement Orthopedic Clinic, Nasr City",
  "Clear Vision Eye Center, Heliopolis",
  "Cairo ENT Clinic, Dokki",
  "Harmony Women's Clinic, New Cairo",
  "MindCare Neurology, Mohandessin",
  "Bright Smile Dental, Garden City",
  "Family Care Clinic, 6th of October",
];


function doctorProfileExtras(item, index) {
  const year = 1976 + (index % 18);
  return {
    code: `DT${2001 + index}`,
    qualifications: item.qualifications ?? `${item.title}`,
    licenseNumber: `MLS${88850000 + index}`,
    gender: GENDERS[index % GENDERS.length],
    dateOfBirth: `${year}-0${(index % 8) + 1}-${String(10 + index).padStart(2, "0")}`,
    bloodGroup: BLOOD_GROUPS[index % BLOOD_GROUPS.length],
    address: CLINIC_ADDRESSES[index % CLINIC_ADDRESSES.length],
    lat: Number((30.0444 + index * 0.012).toFixed(4)),
    lng: Number((31.2357 + index * 0.011).toFixed(4)),
    education: [
      {
        institution: "Cairo University Faculty of Medicine",
        degree: "MBBS",
        from: `${year + 18}-09-01`,
        to: `${year + 24}-06-30`,
      },
      {
        institution: "Ain Shams University",
        degree: item.title,
        from: `${year + 24}-09-01`,
        to: `${year + 27}-06-30`,
      },
    ],
    awards: [
      {
        title: "Top Doctor Award",
        year: 2023,
        description: "Recognized for outstanding outpatient care.",
      },
    ],
    certifications: [
      {
        name: "Board Certification",
        year: 2015 + (index % 5),
        description: "Certified specialist in the doctor's department.",
      },
    ],
  };
}

function createWeekSchedule(server, doctor, extraOffDays = []) {
  for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek += 1) {
    const isOff = dayOfWeek === FRIDAY || extraOffDays.includes(dayOfWeek);
    server.create("workingSchedule", {
      doctor,
      dayOfWeek,
      from: WEEKDAY_HOURS.from,
      to: WEEKDAY_HOURS.to,
      isOff,
    });
  }
}

function seedSpecialties(server) {
  return SPECIALTIES.map((item) => server.create("specialty", item));
}

function seedDoctors(server, specialties) {
  return DOCTORS.map((item, index) => {
    const user = server.create("user", {
      fullName: item.fullName,
      email: item.email,
      password: item.password,
      role: "doctor",
    });

    const specialty = specialties.find((entry) => entry.slug === item.specialtySlug);

    const doctor = server.create("doctor", {
      user,
      specialty,
      fullName: item.fullName,
      title: item.title,
      bio: item.bio,
      clinicName: item.clinicName,
      phone: item.phone,
      photoUrl: null,
      experienceYears: item.experienceYears,
      consultationFee: item.consultationFee,
      rating: item.rating,
      reviewsCount: item.reviewsCount,
      workingHours: WEEKDAY_HOURS,
      ...doctorProfileExtras(item, index),
    });

    user.update({ doctor });
    createWeekSchedule(server, doctor, item.extraOffDays ?? []);

    if (item.leave) {
      server.create("leave", {
        doctor,
        fromDate: addDays(todayISO(), item.leave.fromOffset),
        toDate: addDays(todayISO(), item.leave.toOffset),
        reason: item.leave.reason,
      });
    }

    return doctor;
  });
}

function seedPatients(server) {
  return PATIENTS.map((item) => {
    const user = server.create("user", {
      fullName: item.fullName,
      email: item.email,
      password: PATIENT_PASSWORD,
      role: "patient",
    });

    const patient = server.create("patient", {
      user,
      ...item,
      photoUrl: null,
    });

    user.update({ patient });
    return patient;
  });
}

function createAppointment(server, attrs) {
  return server.create("appointment", {
    duration: 30,
    type: "consultation",
    visitType: "General Visit",
    mode: "in_person",
    notes: "",
    ...attrs,
  });
}

function seedAhmedToday(server, doctors, patients) {
  const ahmed = doctors[0];
  const today = todayISO();
  const plan = [
    { time: "12:00", status: "checked_out", patient: 0, mode: "in_person", notes: "Follow-up ECG" },
    { time: "12:30", status: "checked_out", patient: 1, mode: "in_person", notes: "Blood pressure check" },
    { time: "13:00", status: "checked_out", patient: 2, mode: "online", notes: "Medication review" },
    { time: "13:30", status: "confirmed", patient: 3, mode: "in_person", notes: "Chest pain assessment" },
    { time: "14:00", status: "scheduled", patient: 4, mode: "in_person", notes: "First visit" },
    { time: "14:30", status: "scheduled", patient: 5, mode: "online", notes: "Hypertension follow-up" },
    { time: "15:00", status: "checked_in", patient: 6, mode: "in_person", notes: "Post-discharge visit" },
    { time: "16:00", status: "cancelled", patient: 7, mode: "in_person", notes: "Patient requested cancel" },
    { time: "16:30", status: "scheduled", patient: 8, mode: "in_person", notes: "Routine checkup" },
    { time: "17:00", status: "confirmed", patient: 9, mode: "online", notes: "Cholesterol review" },
  ];

  plan.forEach((item, index) => {
    createAppointment(server, {
      doctor: ahmed,
      patient: patients[item.patient],
      date: today,
      time: item.time,
      status: item.status,
      mode: item.mode,
      queueNumber: index + 1,
      notes: item.notes,
    });
  });
}

function seedHistory(server, doctors, patients) {
  const statuses = ["checked_out", "checked_out", "confirmed", "cancelled", "scheduled", "checked_in", "rescheduled"];
  const times = ["12:00", "12:30", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  const modes = ["in_person", "online"];

  doctors.forEach((doctor, doctorIndex) => {
    for (let dayOffset = -7; dayOffset <= 6; dayOffset += 1) {
      if (dayOffset === 0 && doctorIndex === 0) {
        continue;
      }

      const date = addDays(todayISO(), dayOffset);
      const count = 2 + ((doctorIndex + Math.abs(dayOffset)) % 4);

      for (let index = 0; index < count; index += 1) {
        const patient = patients[(doctorIndex * 3 + index + Math.abs(dayOffset)) % patients.length];
        let status = statuses[(doctorIndex + index + Math.abs(dayOffset)) % statuses.length];
        if (dayOffset < 0 && ["scheduled", "checked_in", "confirmed"].includes(status)) {
          status = "checked_out";
        }

        createAppointment(server, {
          doctor,
          patient,
          date,
          time: times[index % times.length],
          status,
          mode: modes[(doctorIndex + index) % modes.length],
          queueNumber: index + 1,
        });
      }
    }
  });
}

function seedReviews(server, doctors, patients) {
  const comments = [
    "Very professional and clear explanation.",
    "Clinic was organized and the wait was reasonable.",
    "Helpful doctor, I will book again.",
    "Good follow-up and practical advice.",
    "Kind, calm, and detailed.",
    "The appointment started a bit late but the care was excellent.",
  ];

  doctors.forEach((doctor, doctorIndex) => {
    const count = 4 + (doctorIndex % 4);
    for (let index = 0; index < count; index += 1) {
      server.create("review", {
        doctor,
        patient: patients[(doctorIndex + index) % patients.length],
        rating: 4 + ((doctorIndex + index) % 2),
        comment: comments[(doctorIndex + index) % comments.length],
        date: addDays(todayISO(), -((index + 1) * 3)),
      });
    }
  });
}

export function seedDatabase(server) {
  const specialties = seedSpecialties(server);
  const doctors = seedDoctors(server, specialties);
  const patients = seedPatients(server);

  seedAhmedToday(server, doctors, patients);
  seedHistory(server, doctors, patients);
  seedReviews(server, doctors, patients);

  return { specialties, doctors, patients };
}
