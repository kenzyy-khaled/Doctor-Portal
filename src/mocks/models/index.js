import { User } from "./user";
import { Specialty } from "./specialty";
import { Doctor } from "./doctor";
import { Patient } from "./patient";
import { Appointment } from "./appointment";
import { Review } from "./review";
import { WorkingSchedule } from "./workingSchedule";
import { Leave } from "./leave";

export const models = {
  user: User,
  specialty: Specialty,
  doctor: Doctor,
  patient: Patient,
  appointment: Appointment,
  review: Review,
  workingSchedule: WorkingSchedule,
  leave: Leave,
};
