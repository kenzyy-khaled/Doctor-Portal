import { useCallback, useEffect, useRef, useState } from "react";
import { createPatient, getPatients, updatePatient } from "../api";
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Modal,
  PageHead,
  Pagination,
  Toast,
  uiStyles,
} from "../components/ui/UI";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  gender: "unspecified",
  dateOfBirth: "",
  address: "",
};

function validate(values) {
  const errors = {};
  if (!values.fullName.trim()) {
    errors.fullName = "Full name is required";
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }
  if (values.phone && !/^[0-9+\-\s]{7,15}$/.test(values.phone.trim())) {
    errors.phone = "Enter a valid phone number";
  }
  return errors;
}

function PatientModal({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(initial ? { ...EMPTY_FORM, ...initial } : EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
        address: form.address.trim(),
      };

      const response = isEdit ? await updatePatient(initial.id, payload) : await createPatient(payload);
      onSaved(response.data.data, isEdit);
    } catch (error) {
      const data = error.response?.data;
      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setSubmitError(data?.message || "Couldn't save this patient.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit patient" : "Add patient"} onClose={onClose}>
      {submitError && (
        <p className={uiStyles.errorText} style={{ marginBottom: 10 }}>
          {submitError}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <Field label="Full name" error={errors.fullName}>
          <input
            type="text"
            className={`${uiStyles.control} ${errors.fullName ? uiStyles.controlError : ""}`}
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
          />
        </Field>

        <Field label="Email (optional)" error={errors.email}>
          <input
            type="email"
            className={`${uiStyles.control} ${errors.email ? uiStyles.controlError : ""}`}
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </Field>

        <Field label="Phone (optional)" error={errors.phone}>
          <input
            type="text"
            className={`${uiStyles.control} ${errors.phone ? uiStyles.controlError : ""}`}
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />
        </Field>

        <Field label="Gender">
          <select
            className={uiStyles.control}
            value={form.gender}
            onChange={(event) => updateField("gender", event.target.value)}
          >
            <option value="unspecified">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>

        <Field label="Date of birth (optional)">
          <input
            type="date"
            className={uiStyles.control}
            value={form.dateOfBirth || ""}
            onChange={(event) => updateField("dateOfBirth", event.target.value)}
          />
        </Field>

        <Field label="Address (optional)">
          <input
            type="text"
            className={uiStyles.control}
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
          />
        </Field>

        <div className={uiStyles.modalActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Save changes" : "Add patient"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Patients() {
  const [state, setState] = useState("loading");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [gender, setGender] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); 
  const [toast, setToast] = useState(null);

  const load = useCallback(
    async (query = "") => {
      setState("loading");
      try {
        const response = await getPatients({ q: query || undefined, gender: gender || undefined, page, limit: 10 });
        setItems(response.data.data);
        setMeta(response.data.meta);
        setState("success");
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Couldn't load patients.");
        setState("error");
      }
    },
    [gender, page],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const searchTimerRef = useRef(null);
  const debouncedSearch = useCallback(
    (value) => {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        setPage(1);
        load(value);
      }, 350);
    },
    [load],
  );

  useEffect(() => () => clearTimeout(searchTimerRef.current), []);

  function handleSaved(patient, isEdit) {
    setModal(null);
    setToast({ message: isEdit ? "Patient updated." : "Patient added." });
    load();
  }

  return (
    <div>
      <PageHead
        title="Patients"
        subtitle={meta ? `${meta.totalPatients ?? meta.total} patients in total` : "Manage your patient records."}
        action={<Button onClick={() => setModal("create")}>+ Add patient</Button>}
      />

      <div className={uiStyles.toolbar}>
        <input
          className={uiStyles.searchInput}
          placeholder="Search by name, phone, email, or address…"
          onChange={(event) => debouncedSearch(event.target.value)}
        />
        <select
          className={uiStyles.select}
          value={gender}
          onChange={(event) => {
            setPage(1);
            setGender(event.target.value);
          }}
        >
          <option value="">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="unspecified">Unspecified</option>
        </select>
      </div>

      <div className={uiStyles.card}>
        {state === "loading" && <LoadingState label="Loading patients…" />}
        {state === "error" && <ErrorState message={errorMessage} onRetry={() => load()} />}

        {state === "success" && items.length === 0 && (
          <EmptyState title="No patients found" message="Try a different search, or add a new patient." />
        )}

        {state === "success" && items.length > 0 && (
          <>
            <div className={uiStyles.tableWrap}>
              <table className={uiStyles.table}>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Contact</th>
                    <th>Gender</th>
                    <th>Age</th>
                    <th>Last visit</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <div className={uiStyles.avatarRow}>
                          <Avatar name={patient.fullName} />
                          <div className={uiStyles.avatarName}>{patient.fullName}</div>
                        </div>
                      </td>
                      <td>
                        <div>{patient.email || "—"}</div>
                        <div className={uiStyles.avatarSub}>{patient.phone || "—"}</div>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>{patient.gender}</td>
                      <td>{patient.age ?? "—"}</td>
                      <td>{patient.lastAppointmentLabel || "No visits yet"}</td>
                      <td>
                        <Button size="sm" variant="secondary" onClick={() => setModal(patient)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={meta?.page || 1} totalPages={meta?.totalPages || 1} onChange={setPage} />
          </>
        )}
      </div>

      {modal && (
        <PatientModal
          initial={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      <Toast message={toast?.message} variant={toast?.variant} onClose={() => setToast(null)} />
    </div>
  );
}

export default Patients;
