import { Factory } from "miragejs";
import { todayISO } from "../utils/dates";

export const appointmentFactory = Factory.extend({
  date: todayISO(),
  time: "12:00",
  duration: 30,
  status: "scheduled",
  mode: "in_person",
  visitType: "General Visit",
  queueNumber: 1,
  type: "consultation",
  notes: "",
});
