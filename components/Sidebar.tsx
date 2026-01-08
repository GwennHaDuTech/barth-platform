"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// ✅ AJOUT DE L'ICÔNE ACTIVITY
import { Home, Users, Building2, Settings, Activity } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import styles from "./Sidebar.module.css";
import AdminPanel from "@/components/AdminPanel";

const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path !== "/dashboard" && pathname?.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {isAdminPanelOpen && (
        <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />
      )}

      <div className={styles.sidebarContainer}>
        <aside className={styles.sidebar}>
          {/* --- HEADER --- */}
          <div className={styles.header}>
            <button
              onClick={handleLogout}
              className={styles.logoutBtn}
              title="Se déconnecter"
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className={styles.initials}>
                  {user?.firstName ? user.firstName[0].toUpperCase() : "A"}
                </span>
              )}
            </button>

            <div className={styles.headerText}>
              <p className="text-sm font-bold text-white leading-none">
                {user?.firstName || "Admin"}
              </p>
              <p className="text-xs text-barth-gold leading-none mt-1">
                Déconnexion
              </p>
            </div>
          </div>

          <div className={styles.separator} />

          {/* --- NAVIGATION --- */}
          <nav className={styles.nav}>
            <Link
              href="/dashboard"
              className={`${styles.navLink} ${
                isActive("/dashboard") ? styles.active : ""
              }`}
            >
              <span className={styles.navIcon}>
                <Home size={22} />
              </span>
              <span className={styles.linkText}>Accueil</span>
            </Link>

            <Link
              href="/dashboard/users"
              className={`${styles.navLink} ${
                isActive("/dashboard/users") ? styles.active : ""
              }`}
            >
              <span className={styles.navIcon}>
                <Users size={22} />
              </span>
              <span className={styles.linkText}>Agents</span>
            </Link>

            <Link
              href="/dashboard/agencies"
              className={`${styles.navLink} ${
                isActive("/dashboard/agencies") ? styles.active : ""
              }`}
            >
              <span className={styles.navIcon}>
                <Building2 size={22} />
              </span>
              <span className={styles.linkText}>Agences</span>
            </Link>

            {/* ✅ NOUVEAU LIEN ACTIVITÉS */}
            <Link
              href="/dashboard/logs"
              className={`${styles.navLink} ${
                isActive("/dashboard/logs") ? styles.active : ""
              }`}
            >
              <span className={styles.navIcon}>
                <Activity size={22} />
              </span>
              <span className={styles.linkText}>Activités</span>
            </Link>

            {/* BOUTON RÉGLAGES */}
            <button
              onClick={() => setIsAdminPanelOpen(true)}
              className={`${styles.navLink} w-full text-left`}
            >
              <span className={styles.navIcon}>
                <Settings size={22} />
              </span>
              <span className={styles.linkText}>Réglages</span>
            </button>
          </nav>

          {/* --- FOOTER --- */}
          <div className={styles.footerLogo}>
            <div className="text-[0.5rem] uppercase tracking-widest text-barth-gold">
              BTH
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};
export default Sidebar;
