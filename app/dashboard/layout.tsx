// app/dashboard/layout.tsx
import React from "react";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSideBar";
import { Toaster } from "sonner";
import { currentUser } from "@clerk/nextjs/server"; // Import Clerk
import { redirect } from "next/navigation"; // Import Redirection

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🛡️ SÉCURITÉ ADMIN
  const user = await currentUser();
  const ALLOWED_EMAILS = [
    "paul@barth.fr",
    "associe@barth.fr",
    "paulbroussouloux.pro@gmail.com",
    "theoonun@gmail.com",
  ];

  const userEmail = user?.emailAddresses[0]?.emailAddress?.toLowerCase();

  // Si pas autorisé, on redirige vers l'accueil AVANT de rendre le reste
  if (!user || !userEmail || !ALLOWED_EMAILS.includes(userEmail)) {
    redirect("/");
  }

  // ✅ SI AUTORISÉ, ON REND TON DESIGN ACTUEL
  return (
    <div
      className="min-h-screen flex text-white bg-barth-dark bg-cover bg-center bg-no-repeat bg-blend-overlay bg-black/70"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <Toaster
        position="bottom-right"
        theme="dark"
        expand={false}
        richColors
        toastOptions={{
          style: {
            background: "rgba(15, 15, 15, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(212, 175, 55, 0.3)",
            color: "#fff",
            borderRadius: "16px",
          },
          className: "font-sans",
        }}
      />

      {/* 1. Sidebar Gauche */}
      <Sidebar />

      {/* 2. Contenu Principal Central */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto h-full flex flex-col">{children}</div>
      </main>

      {/* 3. Sidebar Droite */}
      <RightSidebar />
    </div>
  );
}
