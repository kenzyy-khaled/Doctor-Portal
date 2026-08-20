import { patientFactory } from "./patient.factory";
import { doctorFactory } from "./doctor.factory";
import { appointmentFactory } from "./appointment.factory";

export const factories = {
  patient: patientFactory,
  doctor: doctorFactory,
  appointment: appointmentFactory,
};
