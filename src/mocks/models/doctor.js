import { Model, belongsTo, hasMany } from "miragejs";

export const Doctor = Model.extend({
  user: belongsTo(),
  specialty: belongsTo(),
  appointments: hasMany(),
  reviews: hasMany(),
  workingSchedules: hasMany(),
  leaves: hasMany(),
});
