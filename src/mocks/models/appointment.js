import { Model, belongsTo } from "miragejs";

export const Appointment = Model.extend({
  doctor: belongsTo(),
  patient: belongsTo(),
});
