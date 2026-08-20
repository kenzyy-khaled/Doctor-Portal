import { Model, belongsTo } from "miragejs";

export const Leave = Model.extend({
  doctor: belongsTo(),
});
