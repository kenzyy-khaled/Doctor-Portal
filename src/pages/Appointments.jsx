import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelAppointment,
  checkInAppointment,
  completeAppointment,
  confirmAppointment,
  createDoctorAppointment,
  getDoctorAppointments,
  getDoctorSlots,
  getPatients,
  rescheduleAppointment,
} from "../api";
import { useAuth } from "../auth/useAuth";
import {
  Avatar,
  Badge,
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
import styles from "./Appointments.module.scss";

function todayISO() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked in" },
  { value: "checked_out", label: "Checked out" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
];

const MODE_OPTIONS = [
  { value: "", label: "All modes" },
  { value: "in_person", label: "In-person" },
  { value: "online", label: "Online" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "oldest", label: "Oldest first" },
  { value: "patient", label: "Patient name" },
];

function ActionButtons({ appointment, onAction, busyId }) {
  const isBusy = busyId === appointment.id;
  const buttons = [];

  if (appointment.status === "scheduled") {
    buttons.push({ key: "confirm", label: "Confirm", variant: "secondary" });
  }
  if (["scheduled", "confirmed"].includes(appointment.status)) {
    buttons.push({ key: "check-in", label: "Check in", variant: "secondary" });
  }
  if (["scheduled", "confirmed", "checked_in"].includes(appointment.status)) {
    buttons.push({ key: "complete", label: "Complete", variant: "primary" });
    buttons.push({ key: "reschedule", label: "Reschedule", variant: "ghost" });
  }
  if (!["cancelled", "checked_out"].includes(appointment.status)) {
    buttons.push({ key: "cancel", label: "Cancel", variant: "danger" });
  }

  return (
    <div className={styles.actionsCell}>
      {buttons.map((button) => (
        <Button
          key={button.key}
          size="sm"
          variant={button.variant}
          loading={isBusy}
          disabled={busyId !== null && !isBusy}
          onClick={() => onAction(appointment, button.key)}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
}

function SlotPicker({ doctorId, date, value, onChange }) {
  const [slots, setSlots] = useState([]);
  const [state, setState] = useState("idle");

  useEffect(() => {
    if (!doctorId || !date) return;
    let cancelled = false;
    setState("loading");

    getDoctorSlots(doctorId, { date })
      .then((response) => {
        if (!cancelled) {
          setSlots(response.data.data.slots || []);
          setState("success");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [doctorId, date]);

  if (state === "loading") return <LoadingState label="Loading available times…" />;
  if (state === "error") return <p className={uiStyles.errorText}>Couldn't load slots for this date.</p>;
  if (state === "success" && slots.length === 0) {
    return <p className={uiStyles.errorText}>The doctor isn't working on this date.</p>;
  }

  return (
    <div className={styles.slotGrid}>
      {slots.map((slot) => (
        <button
          type="button"
          key={slot.time}
          disabled={!slot.available}
          className={`${styles.slot} ${value === slot.time ? styles.slotActive : ""} ${
            !slot.available ? styles.slotDisabled : ""
          }`}
          onClick={() => onChange(slot.time)}
        >
          {slot.time}
        </button>
      ))}
    </div>
  );
}

function BookingModal({ doctorId, onClose, onCreated }) {
  const [patients, setPatients] = useState([]);
  const [patientsState, setPatientsState] = useState("loading");
  const [form, setForm] = useState({
    patientId: "",
    date: todayISO(),
    time: "",
    mode: "in_person",
    visitType: "General Visit",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getPatients({ limit: 100 })
      .then((response) => {
        setPatients(response.data.data);
        setPatientsState("success");
      })
      .catch(() => setPatientsState("error"));
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    const nextErrors = {};
    if (!form.patientId) nextErrors.patientId = "Select a patient";
    if (!form.date) nextErrors.date = "Select a date";
    if (!form.time) nextErrors.time = "Select a time slot";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createDoctorAppointment({
        patientId: Number(form.patientId),
        date: form.date,
        time: form.time,
        mode: form.mode,
        visitType: form.visitType,
        notes: form.notes,
      });
      onCreated(response.data.data);
    } catch (error) {
      const data = error.response?.data;
      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setSubmitError(data?.message || "Couldn't create the appointment.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="New appointment" onClose={onClose}>
      {submitError && (
        <p className={uiStyles.errorText} style={{ marginBottom: 10 }}>
          {submitError}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <Field label="Patient" error={errors.patientId}>
          <select
            className={`${uiStyles.control} ${errors.patientId ? uiStyles.controlError : ""}`}
            value={form.patientId}
            onChange={(event) => updateField("patientId", event.target.value)}
            disabled={patientsState === "loading"}
          >
            <option value="">
              {patientsState === "loading" ? "Loading patients…" : "Select a patient"}
            </option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.fullName}
              </option>
            ))}
          </select>
        </Field>

        <div className={styles.row2}>
          <Field label="Date" error={errors.date}>
            <input
              type="date"
              className={`${uiStyles.control} ${errors.date ? uiStyles.controlError : ""}`}
              value={form.date}
              min={todayISO()}
              onChange={(event) => updateField("date", event.target.value)}
            />
          </Field>

          <Field label="Mode">
            <select
              className={uiStyles.control}
              value={form.mode}
              onChange={(event) => updateField("mode", event.target.value)}
            >
              <option value="in_person">In-person</option>
              <option value="online">Online</option>
            </select>
          </Field>
        </div>

        <Field label="Time slot" error={errors.time}>
          <SlotPicker
            doctorId={doctorId}
            date={form.date}
            value={form.time}
            onChange={(time) => updateField("time", time)}
          />
        </Field>

        <Field label="Visit type">
          <input
            type="text"
            className={uiStyles.control}
            value={form.visitType}
            onChange={(event) => updateField("visitType", event.target.value)}
          />
        </Field>

        <Field label="Notes (optional)">
          <textarea
            rows={2}
            className={uiStyles.control}
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
          />
        </Field>

        <div className={uiStyles.modalActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Book appointment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RescheduleModal({ appointment, doctorId, onClose, onDone }) {
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!time) {
      setError("Select a new time slot");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await rescheduleAppointment(appointment.id, { date, time });
      onDone(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't reschedule this appointment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Reschedule — ${appointment.patient?.fullName}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="New date">
          <input
            type="date"
            className={uiStyles.control}
            value={date}
            min={todayISO()}
            onChange={(event) => {
              setDate(event.target.value);
              setTime("");
            }}
          />
        </Field>

        <Field label="New time" error={error}>
          <SlotPicker doctorId={doctorId} date={date} value={time} onChange={setTime} />
        </Field>

        <div className={uiStyles.modalActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save new time
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CancelConfirmModal({ appointment, isSubmitting, onClose, onConfirm }) {
  return (
    <Modal title="Cancel appointment?" onClose={onClose}>
      <p className={uiStyles.errorText} style={{ color: "#475467", marginBottom: 18 }}>
        This will cancel the appointment with{" "}
        <strong>{appointment.patient?.fullName}</strong> on {appointment.dateTimeLabel}. The
        patient will need to be notified separately. This action can't be undone.
      </p>

      <div className={uiStyles.modalActions}>
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Keep appointment
        </Button>
        <Button type="button" variant="danger" loading={isSubmitting} onClick={onConfirm}>
          Yes, cancel it
        </Button>
      </div>
    </Modal>
  );
}

function Appointments() {
  const { user } = useAuth();
  const [state, setState] = useState("loading");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [filters, setFilters] = useState({ q: "", status: "", mode: "", sortBy: "recent" });
  const [page, setPage] = useState(1);
  const [showBooking, setShowBooking] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState(null);
  const [cancellingAppointment, setCancellingAppointment] = useState(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await getDoctorAppointments({
        q: filters.q || undefined,
        status: filters.status || undefined,
        mode: filters.mode || undefined,
        sortBy: filters.sortBy,
        page,
        limit: 10,
      });
      setItems(response.data.data);
      setMeta(response.data.meta);
      setState("success");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Couldn't load appointments.");
      setState("error");
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const searchTimerRef = useRef(null);
  const debouncedSearch = useCallback((value) => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      setFilters((prev) => ({ ...prev, q: value }));
    }, 350);
  }, []);

  useEffect(() => () => clearTimeout(searchTimerRef.current), []);

  async function handleAction(appointment, actionKey) {
    if (actionKey === "reschedule") {
      setReschedulingAppointment(appointment);
      return;
    }

    // Cancelling is a destructive, user-facing change — never mutate it
    // silently. Ask for confirmation first, then run the request from there.
    if (actionKey === "cancel") {
      setCancellingAppointment(appointment);
      return;
    }

    setBusyId(appointment.id);
    try {
      const actionMap = {
        confirm: confirmAppointment,
        "check-in": checkInAppointment,
        complete: completeAppointment,
      };
      const response = await actionMap[actionKey](appointment.id);
      setItems((prev) => prev.map((item) => (item.id === appointment.id ? response.data.data : item)));
      setToast({ message: "Appointment updated." });
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Action failed.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmCancel() {
    const appointment = cancellingAppointment;
    if (!appointment) return;

    setBusyId(appointment.id);
    try {
      const response = await cancelAppointment(appointment.id);
      setItems((prev) => prev.map((item) => (item.id === appointment.id ? response.data.data : item)));
      setToast({ message: "Appointment cancelled." });
      setCancellingAppointment(null);
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Couldn't cancel this appointment.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  function handleCreated() {
    setShowBooking(false);
    setToast({ message: "Appointment booked." });
    load();
  }

  function handleRescheduled(updated) {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setReschedulingAppointment(null);
    setToast({ message: "Appointment rescheduled." });
  }

  return (
    <div>
      <PageHead
        title="Appointments"
        subtitle="Manage today's schedule and upcoming bookings."
        action={<Button onClick={() => setShowBooking(true)}>+ New appointment</Button>}
      />

      <div className={uiStyles.toolbar}>
        <input
          className={uiStyles.searchInput}
          placeholder="Search by patient name, phone, or notes…"
          onChange={(event) => debouncedSearch(event.target.value)}
        />
        <select
          className={uiStyles.select}
          value={filters.status}
          onChange={(event) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, status: event.target.value }));
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className={uiStyles.select}
          value={filters.mode}
          onChange={(event) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, mode: event.target.value }));
          }}
        >
          {MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className={uiStyles.select}
          value={filters.sortBy}
          onChange={(event) => setFilters((prev) => ({ ...prev, sortBy: event.target.value }))}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={uiStyles.card}>
        {state === "loading" && <LoadingState label="Loading appointments…" />}
        {state === "error" && <ErrorState message={errorMessage} onRetry={load} />}

        {state === "success" && items.length === 0 && (
          <EmptyState
            title="No appointments found"
            message="Try adjusting your filters, or book a new appointment."
          />
        )}

        {state === "success" && items.length > 0 && (
          <>
            <div className={uiStyles.tableWrap}>
              <table className={uiStyles.table}>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date &amp; time</th>
                    <th>Visit</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>
                        <div className={uiStyles.avatarRow}>
                          <Avatar name={appointment.patient?.fullName} />
                          <div>
                            <div className={uiStyles.avatarName}>{appointment.patient?.fullName}</div>
                            <div className={uiStyles.avatarSub}>{appointment.patient?.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td>{appointment.dateTimeLabel}</td>
                      <td>{appointment.visitType}</td>
                      <td>{appointment.modeLabel}</td>
                      <td>
                        <Badge status={appointment.status}>{appointment.statusLabel}</Badge>
                      </td>
                      <td>
                        <ActionButtons appointment={appointment} onAction={handleAction} busyId={busyId} />
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

      {showBooking && (
        <BookingModal doctorId={user?.doctorId} onClose={() => setShowBooking(false)} onCreated={handleCreated} />
      )}

      {reschedulingAppointment && (
        <RescheduleModal
          appointment={reschedulingAppointment}
          doctorId={user?.doctorId}
          onClose={() => setReschedulingAppointment(null)}
          onDone={handleRescheduled}
        />
      )}

      {cancellingAppointment && (
        <CancelConfirmModal
          appointment={cancellingAppointment}
          isSubmitting={busyId === cancellingAppointment.id}
          onClose={() => setCancellingAppointment(null)}
          onConfirm={handleConfirmCancel}
        />
      )}

      <Toast message={toast?.message} variant={toast?.variant} onClose={() => setToast(null)} />
    </div>
  );
}

export default Appointments;
