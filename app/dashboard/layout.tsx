import React from "react";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "sonner";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const ALLOWED_EMAILS = [
    "paul@barth.fr",
    "associe@barth.fr",
    "paulbroussouloux.pro@gmail.com",
    "theoonun@gmail.com",
  ];
  const userEmail = user?.emailAddresses[0]?.emailAddress?.toLowerCase();

  if (!user || !userEmail || !ALLOWED_EMAILS.includes(userEmail)) {
    redirect("/");
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-barth-dark">
      {/* --- COUCHE 0 : FOND --- */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/background.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <Toaster position="bottom-right" theme="dark" richColors />

      {/* --- COUCHE 20 : SIDEBAR GAUCHE --- */}
      <div className="relative z-20 h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* --- COUCHE 10 : CONTENU PRINCIPAL --- */}
      <main className="relative z-10 flex-1 h-full overflow-hidden">
        {/* On laisse juste les children (la page gère le reste) */}
        <div className="h-full w-full overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
