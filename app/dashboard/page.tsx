import React from "react";
import prisma from "@/lib/prisma";
import GlassCard from "@/components/ui/GlassCard";
import DashboardClientWrapper from "./DashboardClientWrapper";
import { Prisma } from "@prisma/client";
import { Info } from "lucide-react";

type AgentWithAgency = Prisma.AgentGetPayload<{
  include: { agency: true };
}>;

interface AgencyItem {
  id: string;
  name: string;
}

export default async function DashboardPage() {
  const agents: AgentWithAgency[] = await prisma.agent.findMany({
    include: { agency: true },
    orderBy: { lastname: "asc" },
  });

  const allAgencies = await prisma.agency.findMany({
    orderBy: { name: "asc" },
  });

  const physicalAgencies: AgencyItem[] = allAgencies.map((agency) => ({
    id: agency.id,
    name: agency.name,
  }));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const stats = await prisma.analytics.findMany({
    where: { date: { gte: sevenDaysAgo } },
    orderBy: { date: "asc" },
  });

  const visitsLast24h = stats.length > 0 ? stats[stats.length - 1].visits : 0;

  const chartData = stats.map((s) => ({
    name: s.date.toLocaleDateString("fr-FR", { weekday: "short" }),
    visits: s.visits,
  }));

  const finalChartData =
    chartData.length > 0
      ? chartData
      : [
          { name: "Lun", visits: 0 },
          { name: "Mar", visits: 0 },
          { name: "Mer", visits: 0 },
          { name: "Jeu", visits: 0 },
          { name: "Ven", visits: 0 },
          { name: "Sam", visits: 0 },
          { name: "Dim", visits: 0 },
        ];

  return (
    // ✅ CHANGEMENT : Suppression de h-screen et overflow-hidden sur le conteneur principal
    // On laisse le scroll se faire naturellement si besoin, ou géré par le layout parent
    <div className="relative min-h-full bg-transparent text-white p-4 lg:p-6 flex flex-col gap-4 lg:gap-6">
      {/* TOP KPI : Grille Responsive (1 col -> 2 cols -> 4 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <GlassCard className="flex flex-col justify-center p-4">
          <span className="text-gray-400 text-[10px] uppercase tracking-widest font-medium truncate">
            Total Sites
          </span>
          <span className="text-2xl font-light text-barth-gold mt-1">
            {agents.length + physicalAgencies.length}
          </span>
        </GlassCard>

        {/* KPI 2 */}
        <GlassCard className="flex flex-col justify-center p-4">
          <span className="text-gray-400 text-[10px] uppercase tracking-widest font-medium truncate">
            Visites 24h
          </span>
          <span className="text-2xl font-light text-barth-gold mt-1">
            {visitsLast24h.toLocaleString()}
          </span>
        </GlassCard>

        {/* KPI 3 - Tooltip Fix */}
        <GlassCard className="flex flex-col justify-center p-4 relative z-20 overflow-visible">
          <div className="flex items-center gap-2 mb-1 relative z-50">
            <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest truncate">
              Taux de Rebond
            </h3>
            <div className="group relative flex items-center">
              <Info
                size={12}
                className="text-gray-500 cursor-help hover:text-white transition-colors"
              />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 p-4 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 scale-95 group-hover:scale-100 origin-top">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-[#1a1a1a]" />
                <p className="text-xs text-gray-300 leading-relaxed text-center">
                  Pourcentage de visiteurs qui quittent le site après une seule
                  page.
                </p>
              </div>
            </div>
          </div>
          <span className="text-2xl font-light text-barth-gold">24%</span>
        </GlassCard>

        {/* KPI 4 */}
        <GlassCard className="flex flex-col justify-center p-4 border-barth-gold/20">
          <span className="text-gray-400 text-[10px] uppercase tracking-widest font-medium truncate">
            Statut
          </span>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-light text-green-500/80">
              Opérationnel
            </span>
          </div>
        </GlassCard>
      </div>

      {/* WRAPPER CLIENT (Tableaux + Graph) */}
      <DashboardClientWrapper
        initialAgents={agents}
        physicalAgencies={physicalAgencies}
        availableAgencies={allAgencies}
        realTimeStats={finalChartData}
      />
    </div>
  );
}
