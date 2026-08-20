import { Model, belongsTo } from "miragejs";

export const Review = Model.extend({
  doctor: belongsTo(),
  patient: belongsTo(),
});
