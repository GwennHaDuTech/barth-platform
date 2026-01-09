import React from "react";
import Sidebar from "../../components/Sidebar";

import { Toaster } from "sonner";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { checkAdminAccess } from "../../app/actions/auth";
import { MonitorX } from "lucide-react";
import Image from "next/image";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress?.toLowerCase();

  // 1. Vérification basique Clerk
  if (!user || !userEmail) {
    redirect("/");
  }

  // 2. Vérification Base de Données
  const isAdmin = await checkAdminAccess(userEmail);

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <>
      {/* =======================================================
          1. ÉCRAN MOBILE (Visible SEULEMENT < 1024px)
          On utilise lg:hidden pour le cacher sur les grands écrans
      ======================================================== */}
      <div className="flex lg:hidden flex-col items-center justify-center min-h-screen bg-[#0a0a0a] px-8 text-center z-50 fixed inset-0">
        {/* Logo (Optionnel) */}
        <div className="mb-8 relative w-32 h-12 opacity-80">
          <Image
            src="/logo.png" // Assure-toi que logo.png est dans le dossier public
            alt="Barth Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="bg-white/5 p-6 rounded-full border border-white/10 mb-6">
          <MonitorX size={48} className="text-red-400" />
        </div>

        <h2 className="text-2xl font-medium text-white mb-4">
          Résolution non supportée
        </h2>

        <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
          {`Pour garantir une gestion optimale des données, le Dashboard Admin
          n'est pas accessible sur mobile.`}
          <br />
          <br />
          Veuillez vous connecter depuis un{" "}
          <span className="text-[#d4af37] font-bold">ordinateur</span> ou une{" "}
          <span className="text-[#d4af37] font-bold">tablette</span> (paysage).
        </p>
      </div>

      {/* =======================================================
          2. DASHBOARD DESKTOP (Visible SEULEMENT >= 1024px)
          On utilise hidden lg:flex pour l'afficher sur grand écran
      ======================================================== */}
      <div className="hidden lg:flex relative h-screen w-full overflow-hidden bg-barth-dark">
        {/* --- Background Image (Identique à ton code original) --- */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url('/background.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <Toaster position="bottom-right" theme="dark" richColors />

        {/* --- Sidebar (Gestion du "Push" via Flexbox) --- */}
        {/* On enlève la div wrapper relative inutile car Sidebar gère son sticky */}
        <Sidebar />

        {/* --- Contenu Principal --- */}
        <main className="relative z-10 flex-1 h-full overflow-hidden">
          <div className="h-full w-full overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
