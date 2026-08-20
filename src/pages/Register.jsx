import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDepartments, register } from "../api";
import styles from "./Auth.module.scss";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_FORM = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  departmentId: "",
  bio: "",
  address: "",
  lat: "",
  lng: "",
  acceptedTerms: false,
};

function validate(values) {
  const errors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Full name is required";
  } else if (values.fullName.trim().length < 3) {
    errors.fullName = "Full name must be at least 3 characters";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!values.password) {
    errors.password = "Password is required";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match";
  }

  if (!values.departmentId) {
    errors.departmentId = "Please select a specialty";
  }

  if (values.bio && values.bio.trim().length < 10) {
    errors.bio = "Tell patients a little more (10+ characters)";
  }

  if (values.lat && Number.isNaN(Number(values.lat))) {
    errors.lat = "Latitude must be a number";
  }

  if (values.lng && Number.isNaN(Number(values.lng))) {
    errors.lng = "Longitude must be a number";
  }

  if (!values.acceptedTerms) {
    errors.acceptedTerms = "You must agree to the Terms of Service";
  }

  return errors;
}

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [departmentsState, setDepartmentsState] = useState("loading"); // loading | success | error

  useEffect(() => {
    let cancelled = false;

    async function loadDepartments() {
      setDepartmentsState("loading");
      try {
        const response = await getDepartments();
        if (!cancelled) {
          setDepartments(response.data.data ?? []);
          setDepartmentsState("success");
        }
      } catch {
        if (!cancelled) {
          setDepartmentsState("error");
        }
      }
    }

    loadDepartments();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({ ...prev, [name]: nextValue }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setSubmitError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          lat: String(position.coords.latitude.toFixed(6)),
          lng: String(position.coords.longitude.toFixed(6)),
        }));
      },
      () => {
        setSubmitError("Couldn't detect your location. You can enter it manually or skip it.");
      },
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstErrorField = document.getElementById(Object.keys(errors)[0]);
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        bio: form.bio.trim(),
        address: form.address.trim(),
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined,
        departmentId: Number(form.departmentId),
        acceptedTerms: form.acceptedTerms,
        role: "doctor",
      });

      const { user } = response.data.data;
      navigate("/login", {
        replace: true,
        state: {
          registered: true,
          email: user?.email || form.email.trim().toLowerCase(),
        },
      });
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;

      if ((status === 422 || status === 409) && data?.errors) {
        setFieldErrors(data.errors);
      } else if (status === 409) {
        setSubmitError(data?.message || "This email is already registered.");
      } else if (!error.response) {
        setSubmitError("Network error — check your connection and try again.");
      } else {
        setSubmitError(data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.brand}>
        <div className={styles.brandTop}>
          <span className={styles.brandLogo}>Preclinic</span>
          Preclinic
        </div>

        <div className={styles.brandMid}>
          <h2>Join the network doctors trust.</h2>
          <p>
            Create your profile in minutes and start managing your appointments,
            patients and schedule from a single, focused dashboard.
          </p>

          <div className={styles.brandStats}>
            <div className={styles.brandStat}>
              <strong>10</strong>
              <span>Specialties supported</span>
            </div>
            <div className={styles.brandStat}>
              <strong>3 min</strong>
              <span>Average setup time</span>
            </div>
          </div>
        </div>

        <div className={styles.brandFooter}>© {new Date().getFullYear()} Preclinic. All rights reserved.</div>
      </section>

      <section className={styles.formSide}>
        <div className={`${styles.card} ${styles.cardWide}`}>
          <div className={styles.mobileLogo}>
            <span className={styles.mobileLogoBadge}>PC</span>
            Preclinic
          </div>

          <h1 className={styles.title}>Create your doctor account</h1>
          <p className={styles.subtitle}>
            Already registered? <Link to="/login">Sign in</Link>
          </p>

          {submitError && (
            <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
              {submitError}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="fullName">
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Dr. Sara Youssef"
                  className={`${styles.control} ${fieldErrors.fullName ? styles.controlError : ""}`}
                  value={form.fullName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span className={styles.errorText}>{fieldErrors.fullName || ""}</span>
              </div>
            </div>

            <div className={`${styles.row} ${styles.two}`}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`${styles.control} ${fieldErrors.email ? styles.controlError : ""}`}
                  value={form.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span className={styles.errorText}>{fieldErrors.email || ""}</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="departmentId">
                  Specialty
                </label>
                <select
                  id="departmentId"
                  name="departmentId"
                  className={`${styles.control} ${fieldErrors.departmentId ? styles.controlError : ""}`}
                  value={form.departmentId}
                  onChange={handleChange}
                  disabled={isLoading || departmentsState === "loading"}
                >
                  <option value="">
                    {departmentsState === "loading" ? "Loading specialties…" : "Select a specialty"}
                  </option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                <span className={styles.errorText}>
                  {fieldErrors.departmentId ||
                    (departmentsState === "error" ? "Couldn't load specialties — try refreshing." : "")}
                </span>
              </div>
            </div>

            <div className={`${styles.row} ${styles.two}`}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="password">
                  Password
                </label>
                <div className={styles.passwordWrap}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    className={`${styles.control} ${fieldErrors.password ? styles.controlError : ""}`}
                    value={form.password}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <span className={styles.errorText}>{fieldErrors.password || ""}</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className={`${styles.control} ${fieldErrors.confirmPassword ? styles.controlError : ""}`}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span className={styles.errorText}>{fieldErrors.confirmPassword || ""}</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="bio">
                Bio <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                placeholder="A short introduction patients will see on your profile…"
                className={`${styles.control} ${fieldErrors.bio ? styles.controlError : ""}`}
                value={form.bio}
                onChange={handleChange}
                disabled={isLoading}
              />
              <span className={styles.errorText}>{fieldErrors.bio || ""}</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="address">
                Clinic address <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                placeholder="Street, city"
                className={styles.control}
                value={form.address}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className={`${styles.row} ${styles.two}`}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="lat">
                  Latitude <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  id="lat"
                  name="lat"
                  type="text"
                  inputMode="decimal"
                  placeholder="30.0444"
                  className={`${styles.control} ${fieldErrors.lat ? styles.controlError : ""}`}
                  value={form.lat}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span className={styles.errorText}>{fieldErrors.lat || ""}</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="lng">
                  Longitude <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  id="lng"
                  name="lng"
                  type="text"
                  inputMode="decimal"
                  placeholder="31.2357"
                  className={`${styles.control} ${fieldErrors.lng ? styles.controlError : ""}`}
                  value={form.lng}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span className={styles.errorText}>{fieldErrors.lng || ""}</span>
              </div>
            </div>

            <button type="button" className={styles.link} style={{ textAlign: "left" }} onClick={detectLocation}>
              Use my current location
            </button>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                name="acceptedTerms"
                checked={form.acceptedTerms}
                onChange={handleChange}
                disabled={isLoading}
              />
              I agree to the Terms of Service and Privacy Policy
            </label>
            <span className={styles.errorText}>{fieldErrors.acceptedTerms || ""}</span>

            <button className={styles.submit} type="submit" disabled={isLoading}>
              {isLoading && <span className={styles.spinner} aria-hidden="true" />}
              {isLoading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Register;
