// app/dashboard/layout.tsx
import React from "react";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSideBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 👇 C'EST CETTE LIGNE QUI CHANGE TOUT 👇
    <div className="min-h-screen text-white flex bg-barth-dark bg-barth-bg bg-cover bg-center bg-no-repeat bg-blend-overlay bg-black/70">
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
