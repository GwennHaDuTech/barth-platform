import React from "react";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "sonner";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
// ✅ Import de la vérification BDD
import { checkAdminAccess } from "../../app/actions/auth";

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

  // 2. Vérification Base de Données (Remplace le tableau ALLOWED_EMAILS)
  const isAdmin = await checkAdminAccess(userEmail);

  if (!isAdmin) {
    // Redirection si l'email n'est pas dans la table Admin
    redirect("/");
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-barth-dark">
      {/* ... Le reste de ton layout reste strictement identique ... */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/background.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <Toaster position="bottom-right" theme="dark" richColors />

      <div className="relative z-20 h-full shrink-0">
        <Sidebar />
      </div>

      <main className="relative z-10 flex-1 h-full overflow-hidden">
        <div className="h-full w-full overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
