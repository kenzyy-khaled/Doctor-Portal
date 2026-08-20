import { Model, belongsTo } from "miragejs";

export const User = Model.extend({
  doctor: belongsTo(),
  patient: belongsTo(),
});
