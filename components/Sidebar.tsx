"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  Users,
  Building2,
  Settings,
  Activity,
  LogOut,
} from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import styles from "./Sidebar.module.css";

// ✅ 1. IMPORT DU COMPOSANT ADMIN PANEL
// Assure-toi que ce fichier existe bien dans components/AdminPanel.tsx
import AdminPanel from "@/components/AdminPanel";

const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();

  // ✅ 2. GESTION DE L'ÉTAT D'OUVERTURE DU PANNEAU
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
    <div className={styles.sidebarContainer}>
      {/* ✅ 3. AFFICHAGE DE LA MODALE ADMIN SI OUVERTE */}
      {isAdminPanelOpen && (
        <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />
      )}

      {/* --- LOGO --- */}
      <div className={styles.brandLogo}>
        <Image
          src="/logo.png"
          alt="Barth Logo"
          width={120}
          height={40}
          className="object-contain"
          priority
        />
      </div>

      {/* --- MENU DE NAVIGATION --- */}
      <div className={styles.sidebar}>
        {/* Header User */}
        <div className={styles.header}>
          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
            title="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
          <div className={styles.headerText}>
            <span className="text-sm font-bold truncate block max-w-[120px]">
              {user?.fullName || "Utilisateur"}
            </span>
            <span className="text-[10px] text-gray-400">Déconnexion</span>
          </div>
        </div>

        {/* Liens */}
        <nav className={styles.nav}>
          <Link
            href="/dashboard"
            className={`${styles.navLink} ${
              isActive("/dashboard") ? styles.active : ""
            }`}
          >
            <div className={styles.navIcon}>
              <Home size={20} />
            </div>
            <span className={styles.linkText}>{`Vue d'ensemble`}</span>
          </Link>

          <Link
            href="/dashboard/users"
            className={`${styles.navLink} ${
              isActive("/dashboard/users") ? styles.active : ""
            }`}
          >
            <div className={styles.navIcon}>
              <Users size={20} />
            </div>
            <span className={styles.linkText}>Agents</span>
          </Link>

          <Link
            href="/dashboard/agencies"
            className={`${styles.navLink} ${
              isActive("/dashboard/agencies") ? styles.active : ""
            }`}
          >
            <div className={styles.navIcon}>
              <Building2 size={20} />
            </div>
            <span className={styles.linkText}>Agences</span>
          </Link>
          <Link
            href="/dashboard/logs"
            className={`${styles.navLink} ${
              isActive("/dashboard/logs") ? styles.active : ""
            }`}
          >
            <div className={styles.navIcon}>
              <Activity size={20} />
            </div>
            <span className={styles.linkText}>Logs Activité</span>
          </Link>
          <button
            onClick={() => setIsAdminPanelOpen(true)}
            className={`${styles.navLink} w-full text-left`}
          >
            <div className={styles.navIcon}>
              <Settings size={20} />
            </div>
            <span className={styles.linkText}>Panneau Admin</span>
          </button>
        </nav>

        {/* Footer User Avatar */}
        <div className="mt-auto flex items-center justify-center p-4">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10">
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt="Profile"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs">
                {user?.firstName?.[0]}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
