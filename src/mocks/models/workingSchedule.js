import { Model, belongsTo } from "miragejs";

export const WorkingSchedule = Model.extend({
  doctor: belongsTo(),
});
