import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import styles from "./MainLayout.module.scss";

function MainLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes. Adjusting state
  // during render (rather than in an effect) avoids an extra commit.
  const [lastPathname, setLastPathname] = useState(location.pathname);
  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname);
    setIsMobileNavOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isMobileOpen={isMobileNavOpen} onCloseMobile={() => setIsMobileNavOpen(false)} />

      {/* min-w-0 keeps this panel free to shrink instead of forcing the
          whole layout wider than the viewport whenever a page (e.g. the
          appointments table) has wide content. */}
      <div className={`${styles.desktopContent} flex min-w-0 flex-1 flex-col`}>
        <header className={`${styles.mobileBar} flex items-center gap-3 px-4 py-3 lg:hidden`}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <span aria-hidden="true">☰</span>
          </button>
          <span className={styles.mobileBrand}>Preclinic</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
