import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { Avatar } from "../ui/UI";
import styles from "./Sidebar.module.scss";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Patients", to: "/patients" },
  { label: "Appointments", to: "/appointments" },
  { label: "Settings", to: "/settings" },
];

function Sidebar({ isMobileOpen, onCloseMobile }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <aside
        className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarOpen : ""} flex h-screen shrink-0 flex-col`}
      >
        <div className={`${styles.brand} px-5 py-5`}>
          <span className={styles.brandMark}>PC</span>
          <span className="text-[15px] font-semibold text-white">Preclinic</span>
        </div>

        <div className={styles.navSection}>Menu</div>

        <nav className="flex-1 overflow-y-auto px-3 pb-2">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `${styles.link} ${isActive ? styles.active : ""} flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors`
                  }
                >
                  <span className={styles.linkLabel}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={`${styles.footer} px-4 py-4`}>
          <div className="mb-2 flex items-center gap-2 px-2">
            <Avatar name={user?.name} />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">{user?.name || "Doctor"}</p>
              <p className="truncate text-[11px] text-gray-400">{user?.email}</p>
            </div>
          </div>
          <button
            className={`${styles.logoutBtn} w-full rounded-lg px-3 py-2 text-left text-sm transition-colors`}
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      {isMobileOpen && (
        <div className={styles.scrim} onClick={onCloseMobile} aria-hidden="true" />
      )}
    </>
  );
}

export default Sidebar;
