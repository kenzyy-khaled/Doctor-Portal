import styles from "./ui.module.scss";

const BADGE_COLOR_BY_STATUS = {
  scheduled: "badgeGray",
  confirmed: "badgeBlue",
  checked_in: "badgePurple",
  checked_out: "badgeGreen",
  cancelled: "badgeRed",
  rescheduled: "badgeYellow",
  working: "badgeGreen",
  on_leave: "badgeYellow",
  off: "badgeGray",
};

export function PageHead({ title, subtitle, action }) {
  return (
    <div className={styles.pageHead}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({ variant = "primary", size = "md", loading, children, className = "", ...rest }) {
  const variantClass =
    {
      primary: styles.btnPrimary,
      secondary: styles.btnSecondary,
      danger: styles.btnDanger,
      ghost: styles.btnGhost,
    }[variant] || styles.btnPrimary;

  return (
    <button
      className={`${styles.btn} ${variantClass} ${size === "sm" ? styles.btnSm : ""} ${className}`}
      disabled={rest.disabled || loading}
      {...rest}
    >
      {loading && <span className={`${styles.spinner} ${styles.spinnerSm}`} aria-hidden="true" />}
      {children}
    </button>
  );
}


export function Avatar({ name = "User", className = "" }) {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "U";

  return (
    <div className={`${styles.avatar} ${className}`} aria-label={name} title={name}>
      {initials}
    </div>
  );
}

export function Badge({ status, children }) {
  const colorClass = styles[BADGE_COLOR_BY_STATUS[status]] || styles.badgeGray;
  return <span className={`${styles.badge} ${colorClass}`}>{children ?? status}</span>;
}

export function StatCard({ icon, label, value, changePercent }) {
  const isUp = typeof changePercent === "number" && changePercent >= 0;
  return (
    <div className={styles.statCard}>
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{label}</span>
        {icon && <span className={styles.statIcon}>{icon}</span>}
      </div>
      <span className={styles.statValue}>{value}</span>
      {typeof changePercent === "number" && (
        <span className={`${styles.statChange} ${isUp ? styles.statUp : styles.statDown}`}>
          {isUp ? "▲" : "▼"} {Math.abs(changePercent)}% vs last week
        </span>
      )}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className={styles.stateBox}>
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.stateText}>{label}</span>
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div className={styles.stateBox}>
      <span className={styles.stateIcon}>⚠️</span>
      <span className={styles.stateTitle}>{title}</span>
      {message && <span className={styles.stateText}>{message}</span>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", message, action }) {
  return (
    <div className={styles.stateBox}>
      <span className={styles.stateIcon}>🗂️</span>
      <span className={styles.stateTitle}>{title}</span>
      {message && <span className={styles.stateText}>{message}</span>}
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
      <span className={styles.errorText}>{error || ""}</span>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  return (
    <div className={styles.pagination}>
      <span>
        Page {page} of {totalPages}
      </span>
      <div className={styles.pageBtns}>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function Toast({ message, variant = "default", onClose }) {
  if (!message) return null;
  return (
    <div className={`${styles.toast} ${variant === "error" ? styles.toastError : ""}`} onClick={onClose}>
      {message}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- shared style-module export, not a component
export { styles as uiStyles };
