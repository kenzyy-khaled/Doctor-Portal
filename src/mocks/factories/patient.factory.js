import { Factory } from "miragejs";

const FIRST_NAMES = ["Mariam", "Hassan", "Yara", "Ali", "Dina", "Mostafa", "Hana", "Ziad"];
const LAST_NAMES = ["Farouk", "Nabil", "Adel", "Samir", "Fouad", "Lotfy", "Hegazy", "Shawky"];

export const patientFactory = Factory.extend({
  fullName(i) {
    return `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`;
  },
  email(i) {
    return `patient.${i + 1}@preclinic.test`;
  },
  phone(i) {
    return `010${String(2000000 + i).padStart(8, "0")}`;
  },
  gender(i) {
    return i % 2 === 0 ? "female" : "male";
  },
  dateOfBirth() {
    return "1994-05-12";
  },
});
