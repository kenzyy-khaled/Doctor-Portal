import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api";
import { DEMO_ACCOUNTS } from "../mocks/data/catalog";
import { useAuth } from "../auth/useAuth";
import styles from "./Auth.module.scss";


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values) {
  const errors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!values.password) {
    errors.password = "Password is required";
  }

  return errors;
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const redirectTo = location.state?.from?.pathname || "/dashboard";
  const justRegistered = Boolean(location.state?.registered);

  const [form, setForm] = useState({
    email: location.state?.email || "",
    password: "",
    rememberMe: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({ ...prev, [name]: nextValue }));

    
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function fillDemo(account) {
    setForm((prev) => ({ ...prev, email: account.email, password: account.password }));
    setFieldErrors({});
    setSubmitError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        rememberMe: form.rememberMe,
      });

      const { token, user } = response.data.data;
      signIn({ token, user });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 422 && data?.errors) {
        setFieldErrors(data.errors);
      } else if (status === 401) {
        setSubmitError(data?.message || "Invalid email or password.");
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
          <span className={styles.brandLogo}>PC</span>
          Preclinic
        </div>

        <div className={styles.brandMid}>
          <h2>Seamless healthcare access with smart, modern clinic</h2>
          <p>
            Experience efficient, secure, and user-friendly healthcare management designed for modern clinics and growing practices.
          </p>

          <div className={styles.brandStats}>
            <div className={styles.brandStat}>
              <strong>12k+</strong>
              <span>Appointments booked</span>
            </div>
            <div className={styles.brandStat}>
              <strong>500+</strong>
              <span>Doctors onboard</span>
            </div>
            <div className={styles.brandStat}>
              <strong>4.9★</strong>
              <span>Average rating</span>
            </div>
          </div>
        </div>

        <div className={styles.brandFooter}>© {new Date().getFullYear()} Preclinic. All rights reserved.</div>
      </section>

      <section className={styles.formSide}>
        <div className={styles.card}>
          <div className={styles.mobileLogo}>
            <span className={styles.mobileLogoBadge}>PC</span>
            Preclinic
          </div>

          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>
            Don&apos;t have an account yet?{" "}
            <Link to="/register">Register as a doctor</Link>
          </p>

          {justRegistered && (
            <div className={`${styles.banner} ${styles.bannerSuccess}`} role="status">
              Account created! Sign in with your new credentials to continue.
            </div>
          )}

          {submitError && (
            <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
              {submitError}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
              <div className={styles.rowBetween}>
                <label className={styles.label} htmlFor="password">
                  Password
                </label>
              </div>
              <div className={styles.passwordWrap}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
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

            <div className={styles.rowBetween}>
              <label className={styles.checkboxRow} style={{ alignItems: "center" }}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                Remember me
              </label>
            </div>

            <button className={styles.submit} type="submit" disabled={isLoading}>
              {isLoading && <span className={styles.spinner} aria-hidden="true" />}
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className={styles.demoBox}>
            <strong>Demo accounts</strong>
            {DEMO_ACCOUNTS.map((account) => (
              <div className={styles.demoRow} key={account.email}>
                <span>
                  {account.role}: {account.email}
                </span>
                <button type="button" className={styles.demoUse} onClick={() => fillDemo(account)}>
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;
