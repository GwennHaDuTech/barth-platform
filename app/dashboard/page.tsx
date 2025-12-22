// app/dashboard/page.tsx
import React from "react";
import prisma from "@/lib/prisma";
import GlassCard from "@/components/ui/GlassCard";
import Link from "next/link";
// import CreateAgentForm from './CreateAgentForm'; // Pour plus tard

export default async function DashboardPage() {
  // 1. CORRECTION : On a retiré la ligne "include" qui plantait
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
  });

  const isProduction = process.env.NODE_ENV === "production";
  const domain = isProduction ? "barth-platform.vercel.app" : "localhost:3000";
  const protocol = isProduction ? "https" : "http";

  return (
    <div className="flex flex-col h-full gap-6">
      {/* --- HAUT : LES ACTIONS --- */}
      <GlassCard className="flex flex-col md:flex-row items-center justify-between gap-8 !py-8">
        <h1 className="text-3xl font-light text-center md:text-left">
          Créer un site pour :
        </h1>

        <div className="flex gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-8 py-4 rounded-2xl bg-gradient-to-br from-barth-gold/80 to-barth-gold/40 text-barth-dark font-bold shadow-[0_0_20px_rgba(212,175,55,0.2)] transition hover:scale-[1.02]">
            un agent
          </button>
          <button className="flex-1 md:flex-none px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition">
            une agence physique
          </button>
          <button className="flex-1 md:flex-none px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition">
            une agence en ligne
          </button>
        </div>
      </GlassCard>

      {/* --- MILIEU : LISTE DES SITES --- */}
      <div className="flex-1 flex gap-6 min-h-0">
        <GlassCard className="flex-[2] flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-light">Liste des sites crées</h2>
            <div className="text-sm px-4 py-2 rounded-full border border-barth-gold/30 text-barth-gold bg-barth-gold/10">
              trier par : Le plus de visite... ▼
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase border-b border-white/10 text-barth-gold">
                <tr>
                  <th className="px-4 py-3 font-medium">site agent</th>
                  <th className="px-4 py-3 font-medium text-center">visites</th>
                  <th className="px-4 py-3 font-medium text-right">actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {agents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-4 text-center italic opacity-50"
                    >
                      Aucun site pour le moment.
                    </td>
                  </tr>
                ) : (
                  agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-4 font-medium text-white flex flex-col">
                        {agent.name}
                        <Link
                          href={
                            isProduction
                              ? `/sites/${agent.subdomain}`
                              : `${protocol}://${agent.subdomain}.${domain}`
                          }
                          target="_blank"
                          className="text-xs text-barth-gold/80 hover:text-barth-gold truncate w-48"
                        >
                          {agent.subdomain}.{domain} ↗
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-white">
                        {/* 2. CORRECTION : On met 0 pour l'instant (pas de random ici) */}
                        0
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="text-xs px-3 py-1 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Placeholders */}
        <GlassCard className="flex-1 flex items-center justify-center opacity-50 text-gray-500 font-light text-xl border-dashed">
          site agence physique
        </GlassCard>
        <GlassCard className="flex-1 flex items-center justify-center opacity-50 text-gray-500 font-light text-xl border-dashed">
          site agence en ligne
        </GlassCard>
      </div>

      {/* --- BAS : GRAPHIQUE (Décoratif) --- */}
      <GlassCard className="h-64 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-light">Nombre de visite depuis</h2>
          <div className="text-sm px-4 py-2 rounded-full border border-barth-gold/30 text-barth-gold bg-barth-gold/10">
            les 30 derniers jours ▼
          </div>
        </div>

        <div className="flex-1 relative flex items-end px-4 pb-4 pt-8">
          <div className="absolute inset-0 flex flex-col justify-between px-4 pb-8 pt-12 opacity-20 text-xs text-gray-400">
            <div className="border-b border-white/10 w-full">
              <span>40</span>
            </div>
            <div className="border-b border-white/10 w-full">
              <span>30</span>
            </div>
            <div className="border-b border-white/10 w-full">
              <span>20</span>
            </div>
            <div className="border-b border-white/10 w-full">
              <span>10</span>
            </div>
            <div className="border-b border-white/10 w-full">
              <span>0</span>
            </div>
          </div>

          <svg
            className="w-full h-full z-10"
            viewBox="0 0 500 150"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="goldGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,120 C50,110 100,100 150,105 C200,110 250,80 300,70 C350,60 400,65 450,60 L500,60 L500,150 L0,150 Z"
              fill="url(#goldGradient)"
            />
            <path
              d="M0,120 C50,110 100,100 150,105 C200,110 250,80 300,70 C350,60 400,65 450,60 L500,60"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute bottom-0 inset-x-0 flex justify-between px-8 text-sm text-gray-400">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mer</span>
            <span>Jeu</span>
            <span>Ven</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
