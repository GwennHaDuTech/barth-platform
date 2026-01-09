"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// ✅ 1. IMPORT OBLIGATOIRE POUR QUE <Image /> FONCTIONNE
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
// On enlève l'import AdminPanel s'il n'est pas utilisé dans ce snippet, sinon garde-le
// import AdminPanel from "@/components/AdminPanel";

const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  // const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false); // Décommente si tu utilises le panel

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
      {/* Si tu as un AdminPanel, décommente ceci :
         {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />}
      */}

      {/* --- LOGO --- */}
      <div className={styles.brandLogo}>
        {/* ✅ 2. CORRECTION SYNTAXE IMAGE */}
        <Image
          src="/logo.png" // Assure-toi que logo.avif est dans le dossier 'public'
          alt="Barth Logo"
          width={120}
          height={40}
          className="object-contain"
          priority // Charge l'image en priorité (LCP)
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
              {user?.fullName || "Admin"}
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
        </nav>

        {/* Footer User Avatar (Correction de l'erreur <img>) */}
        <div className="mt-auto flex items-center justify-center p-4">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10">
            {user?.imageUrl ? (
              // ✅ 3. UTILISATION DE <Image /> AU LIEU DE <img>
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
