import { useEffect, useState } from "react";
import { getDoctorProfile, updateDoctorProfile, updateMyAvailability } from "../api";
import { useAuth } from "../auth/useAuth";
import { Avatar, Button, ErrorState, Field, LoadingState, PageHead, Toast, uiStyles } from "../components/ui/UI";
import styles from "./Settings.module.scss";


const WEEK_DAYS = [
  { key: "sunday", label: "Sunday", dayOfWeek: 0 },
  { key: "monday", label: "Monday", dayOfWeek: 1 },
  { key: "tuesday", label: "Tuesday", dayOfWeek: 2 },
  { key: "wednesday", label: "Wednesday", dayOfWeek: 3 },
  { key: "thursday", label: "Thursday", dayOfWeek: 4 },
  { key: "friday", label: "Friday", dayOfWeek: 5 },
  { key: "saturday", label: "Saturday", dayOfWeek: 6 },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ProfileTab({ profile, onSaved }) {
  const [form, setForm] = useState({
    fullName: profile.fullName || "",
    email: profile.email || "",
    phone: profile.phone || "",
    clinicName: profile.clinicName || "",
    qualifications: profile.qualifications || "",
    licenseNumber: profile.licenseNumber || "",
    experienceYears: profile.experienceYears ?? "",
    gender: profile.gender || "unspecified",
    bloodGroup: profile.bloodGroup || "",
    dateOfBirth: profile.dateOfBirth || "",
    address: profile.address || "",
    bio: profile.bio || "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required";
    if (form.email && !EMAIL_RE.test(form.email.trim())) nextErrors.email = "Enter a valid email address";
    if (form.experienceYears !== "" && Number(form.experienceYears) < 0) {
      nextErrors.experienceYears = "Must be zero or more";
    }
    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateDoctorProfile({
        ...form,
        experienceYears: form.experienceYears === "" ? undefined : Number(form.experienceYears),
      });
      onSaved(response.data.data);
    } catch (error) {
      const data = error.response?.data;
      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setSubmitError(data?.message || "Couldn't save your profile.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={uiStyles.card}>
      <div className={styles.profileHeader}>
        <Avatar name={profile.fullName} className={styles.avatar} />
        <div>
          <div className={styles.avatarName}>{profile.fullName}</div>
          <div className={styles.avatarMeta}>
            {profile.specialty?.name} · {profile.clinicName}
          </div>
        </div>
      </div>

      {submitError && (
        <p className={uiStyles.errorText} style={{ padding: "0 22px", marginTop: 12 }}>
          {submitError}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <Field label="Full name" error={errors.fullName}>
            <input
              className={`${uiStyles.control} ${errors.fullName ? uiStyles.controlError : ""}`}
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <input
              type="email"
              className={`${uiStyles.control} ${errors.email ? uiStyles.controlError : ""}`}
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </Field>

          <Field label="Phone">
            <input
              className={uiStyles.control}
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </Field>

          <Field label="Clinic name">
            <input
              className={uiStyles.control}
              value={form.clinicName}
              onChange={(event) => updateField("clinicName", event.target.value)}
            />
          </Field>

          <Field label="Qualifications">
            <input
              className={uiStyles.control}
              value={form.qualifications}
              onChange={(event) => updateField("qualifications", event.target.value)}
            />
          </Field>

          <Field label="License number">
            <input
              className={uiStyles.control}
              value={form.licenseNumber}
              onChange={(event) => updateField("licenseNumber", event.target.value)}
            />
          </Field>

          <Field label="Years of experience" error={errors.experienceYears}>
            <input
              type="number"
              min="0"
              className={`${uiStyles.control} ${errors.experienceYears ? uiStyles.controlError : ""}`}
              value={form.experienceYears}
              onChange={(event) => updateField("experienceYears", event.target.value)}
            />
          </Field>

          <Field label="Date of birth">
            <input
              type="date"
              className={uiStyles.control}
              value={form.dateOfBirth || ""}
              onChange={(event) => updateField("dateOfBirth", event.target.value)}
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

          <Field label="Blood group">
            <input
              className={uiStyles.control}
              value={form.bloodGroup}
              onChange={(event) => updateField("bloodGroup", event.target.value)}
            />
          </Field>

          <div className={styles.formGridFull}>
            <Field label="Clinic address">
              <input
                className={uiStyles.control}
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
              />
            </Field>
          </div>

          <div className={styles.formGridFull}>
            <Field label="Bio">
              <textarea
                rows={3}
                className={uiStyles.control}
                value={form.bio}
                onChange={(event) => updateField("bio", event.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className={styles.footer}>
          <Button type="submit" loading={isSaving}>
            Save profile
          </Button>
        </div>
      </form>
    </div>
  );
}

function AvailabilityTab({ profile, onSaved }) {
  const initialWeek = WEEK_DAYS.map((day) => {
    const existing = profile.availableDays?.find((item) => item.dayOfWeek === day.dayOfWeek);
    return {
      dayOfWeek: day.dayOfWeek,
      from: existing?.from || "12:00",
      to: existing?.to || "21:00",
      isOff: existing?.isOff ?? day.dayOfWeek === 5,
    };
  });

  const [week, setWeek] = useState(initialWeek);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  function updateDay(dayOfWeek, patch) {
    setWeek((prev) => prev.map((item) => (item.dayOfWeek === dayOfWeek ? { ...item, ...patch } : item)));
  }

  async function handleSave() {
    setError("");
    setIsSaving(true);
    try {
      const response = await updateMyAvailability({ week });
      onSaved(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save your availability.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={uiStyles.card}>
      {error && (
        <p className={uiStyles.errorText} style={{ padding: "16px 22px 0" }}>
          {error}
        </p>
      )}

      {WEEK_DAYS.map((day) => {
        const value = week.find((item) => item.dayOfWeek === day.dayOfWeek);
        return (
          <div className={styles.dayRow} key={day.key}>
            <span className={styles.dayLabel}>{day.label}</span>

            <input
              type="time"
              className={uiStyles.control}
              value={value.from}
              disabled={value.isOff}
              onChange={(event) => updateDay(day.dayOfWeek, { from: event.target.value })}
            />

            <input
              type="time"
              className={uiStyles.control}
              value={value.to}
              disabled={value.isOff}
              onChange={(event) => updateDay(day.dayOfWeek, { to: event.target.value })}
            />

            <label className={styles.dayOffLabel}>
              <input
                type="checkbox"
                checked={value.isOff}
                onChange={(event) => updateDay(day.dayOfWeek, { isOff: event.target.checked })}
              />
              Day off
            </label>
          </div>
        );
      })}

      <div className={styles.footer}>
        <Button onClick={handleSave} loading={isSaving}>
          Save availability
        </Button>
      </div>
    </div>
  );
}

function Settings() {
  const { user } = useAuth();
  const [state, setState] = useState("loading");
  const [profile, setProfile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [tab, setTab] = useState("profile");
  const [toast, setToast] = useState(null);

  async function load() {
    setState("loading");
    try {
      const response = await getDoctorProfile();
      setProfile(response.data.data);
      setState("success");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Couldn't load your settings.");
      setState("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleSaved(updated) {
    setProfile(updated);
    setToast({ message: "Changes saved." });
  }

  return (
    <div>
      <PageHead title="Settings" subtitle={`Signed in as ${user?.email}`} />

      {state === "loading" && <LoadingState label="Loading your settings…" />}
      {state === "error" && <ErrorState message={errorMessage} onRetry={load} />}

      {state === "success" && profile && (
        <>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${tab === "profile" ? styles.tabActive : ""}`}
              onClick={() => setTab("profile")}
            >
              Profile
            </button>
            <button
              type="button"
              className={`${styles.tab} ${tab === "availability" ? styles.tabActive : ""}`}
              onClick={() => setTab("availability")}
            >
              Availability
            </button>
          </div>

          {tab === "profile" && <ProfileTab profile={profile} onSaved={handleSaved} />}
          {tab === "availability" && <AvailabilityTab profile={profile} onSaved={handleSaved} />}
        </>
      )}

      <Toast message={toast?.message} variant={toast?.variant} onClose={() => setToast(null)} />
    </div>
  );
}

export default Settings;
