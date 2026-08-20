import { Model, belongsTo, hasMany } from "miragejs";

export const Patient = Model.extend({
  user: belongsTo(),
  appointments: hasMany(),
  reviews: hasMany(),
});
