// app/dashboard/layout.tsx
import React from "react";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSideBar";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 👇 C'EST CETTE LIGNE QUI CHANGE TOUT 👇
    <div
      className="min-h-screen flex text-white bg-barth-dark bg-cover bg-center bg-no-repeat bg-blend-overlay bg-black/70"
      style={{ backgroundImage: "url('/background.jpg')" }} // <--- On force l'image ici pour tester
    >
      {" "}
      {/* On configure le Toaster pour ton design sombre */}
      {/* <Toaster position="bottom-right" theme="dark" richColors closeButton /> */}
      <Toaster
        position="bottom-right"
        theme="dark"
        expand={false} // Garde les toasts empilés de façon élégante
        richColors
        toastOptions={{
          style: {
            background: "rgba(15, 15, 15, 0.95)", // Ton noir profond avec légère transparence
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(212, 175, 55, 0.3)", // Bordure Barth Gold subtile
            color: "#fff",
            borderRadius: "16px",
          },
          className: "font-sans",
        }}
      />
      {/* 1. Sidebar Gauche (Navigation) */}
      <Sidebar />
      {/* 2. Contenu Principal Central */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto h-full flex flex-col">{children}</div>
      </main>
      {/* 3. Sidebar Droite (Notifications) */}
      <RightSidebar />
    </div>
  );
}
