import { Factory } from "miragejs";

export const doctorFactory = Factory.extend({
  title: "Consultant",
  bio: "Consultant physician providing outpatient care.",
  clinicName: "Preclinic Clinic",
  experienceYears: 8,
  consultationFee: 400,
  rating: 4.6,
  reviewsCount: 12,
  workingHours: { from: "12:00", to: "21:00" },
});
