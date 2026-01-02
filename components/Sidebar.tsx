// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Building2, Settings, LogOut } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs"; // Imports Clerk
import styles from "./Sidebar.module.css";

const Sidebar = () => {
  const pathname = usePathname();
  // Récupère les infos de l'utilisateur connecté et la fonction de déconnexion
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut({ redirectUrl: "/" }); // Redirige vers l'accueil après déconnexion
  };

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path !== "/dashboard" && pathname?.startsWith(path)) return true;
    return false;
  };

  return (
    <div className={styles.sidebarContainer}>
      <aside className={styles.sidebar}>
        {/* --- HEADER : LOGOUT + USER INFO --- */}
        <div className={styles.header}>
          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
            title="Se déconnecter"
          >
            {/* Si l'utilisateur a une image (avatar Google/Clerk), on l'affiche */}
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              // Sinon on affiche les initiales
              <span className={styles.initials}>
                {user?.firstName ? user.firstName[0].toUpperCase() : "A"}
              </span>
            )}
          </button>

          <div className={styles.headerText}>
            {/* Affiche le vrai prénom */}
            <p className="text-sm font-bold text-white leading-none">
              {user?.firstName || "Admin"}
            </p>
            <p className="text-xs text-barth-gold leading-none mt-1">
              Déconnexion
            </p>
          </div>
        </div>

        <div className={styles.separator} />

        {/* --- NAVIGATION (Reste identique) --- */}
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
            {/* Note: Building2 n'était pas importé dans ton snippet précédent, assure-toi de l'avoir */}
            <span className={styles.navIcon}>
              <Building2 size={22} />
            </span>
            <span className={styles.linkText}>Agences</span>
          </Link>

          <Link
            href="/dashboard/settings"
            className={`${styles.navLink} ${
              isActive("/dashboard/settings") ? styles.active : ""
            }`}
          >
            <span className={styles.navIcon}>
              <Settings size={22} />
            </span>
            <span className={styles.linkText}>Réglages</span>
          </Link>
        </nav>

        {/* --- FOOTER --- */}
        <div className={styles.footerLogo}>
          <div className="text-[0.5rem] uppercase tracking-widest text-barth-gold">
            BTH
          </div>
        </div>
      </aside>
    </div>
  );
};
export default Sidebar;
