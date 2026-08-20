import { Model, hasMany } from "miragejs";

export const Specialty = Model.extend({
  doctors: hasMany(),
});
