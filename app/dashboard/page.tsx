import React from "react";
import prisma from "@/lib/prisma";
import GlassCard from "@/components/ui/GlassCard";
import DashboardInteractions from "@/components/DashboardInteractions";
import AgentListTable from "./AgentListTable"; // Import du nouveau composant

export default async function DashboardPage() {
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
  });

  const isProduction = process.env.NODE_ENV === "production";
  const domain = isProduction ? "barth-platform.vercel.app" : "localhost:3000";
  const protocol = isProduction ? "https" : "http";

  return (
    <div className="flex flex-col h-full gap-6">
      <DashboardInteractions />

      <div className="flex-1 flex gap-6 min-h-0">
        <GlassCard className="flex-[2] flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-light">Liste des sites crées</h2>
            <div className="text-sm px-4 py-2 rounded-full border border-barth-gold/30 text-barth-gold bg-barth-gold/10 cursor-pointer">
              trier par : Le plus de visite... ▼
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {agents.length === 0 ? (
              <div className="p-10 text-center italic opacity-30 text-white">
                Aucun site pour le moment.
              </div>
            ) : (
              <AgentListTable
                initialAgents={agents}
                domain={domain}
                protocol={protocol}
                isProduction={isProduction}
              />
            )}
          </div>
        </GlassCard>

        <GlassCard className="flex-1 flex items-center justify-center opacity-50 text-gray-500 font-light text-xl border-dashed">
          site agence physique
        </GlassCard>
        <GlassCard className="flex-1 flex items-center justify-center opacity-50 text-gray-500 font-light text-xl border-dashed">
          site agence en ligne
        </GlassCard>
      </div>

      <GlassCard className="h-64 flex flex-col p-6">
        <h2 className="text-xl font-light mb-4">Nombre de visite depuis</h2>
        <div className="flex-1 flex items-center justify-center text-gray-500 border border-white/5 rounded-2xl bg-white/5">
          Graphique en cours de construction...
        </div>
      </GlassCard>
    </div>
  );
}
