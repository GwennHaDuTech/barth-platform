import React from "react";
import prisma from "@/lib/prisma";
import GlassCard from "@/components/ui/GlassCard";
import DashboardClientWrapper from "./DashboardClientWrapper";
import { Prisma } from "@prisma/client";

// Type pour les agents avec leur agence rattachée
type AgentWithAgency = Prisma.AgentGetPayload<{
  include: { agency: true };
}>;

// Interface pour les agences (utilisée pour les deux autres colonnes)
interface AgencyItem {
  id: string;
  name: string;
  // Ajoute d'autres champs ici si tu veux afficher plus d'infos (ex: ville, slug...)
}

export default async function DashboardPage() {
  // 1. Récupération des agents et agences
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

  // 2. LOGIQUE ANALYTICS RÉELLE (7 derniers jours)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const stats = await prisma.analytics.findMany({
    where: {
      date: { gte: sevenDaysAgo },
    },
    orderBy: { date: "asc" },
  });

  // 3. CALCUL DU KPI VISITES 24H (Somme des visites du jour le plus récent)
  const visitsLast24h = stats.length > 0 ? stats[stats.length - 1].visits : 0;

  // 4. FORMATAGE POUR RECHARTS
  const chartData = stats.map((s) => ({
    name: s.date.toLocaleDateString("fr-FR", { weekday: "short" }),
    visits: s.visits,
  }));

  // Fallback si pas de données pour éviter un graph vide
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
    <div className="relative h-screen overflow-hidden bg-transparent text-white p-6">
      <div className="flex flex-col h-full gap-6">
        {/* TOP KPI (12%) */}
        <div className="grid grid-cols-4 gap-4 h-[12%]">
          <GlassCard className="flex flex-col justify-center p-4 hover:bg-white/10 transition-colors">
            <span className="text-gray-400 text-[10px] uppercase tracking-widest font-medium">
              Total Sites
            </span>
            <span className="text-2xl font-light text-barth-gold">
              {agents.length + physicalAgencies.length}
            </span>
          </GlassCard>

          <GlassCard className="flex flex-col justify-center p-4">
            <span className="text-gray-400 text-[10px] uppercase tracking-widest font-medium">
              Visites 24h
            </span>
            <span className="text-2xl font-light text-barth-gold">
              {visitsLast24h.toLocaleString()}
            </span>
          </GlassCard>

          <GlassCard className="flex flex-col justify-center p-4">
            <span className="text-gray-400 text-[10px] uppercase tracking-widest font-medium">
              Taux Rebond
            </span>
            <span className="text-2xl font-light text-barth-gold">24%</span>
          </GlassCard>

          <GlassCard className="flex flex-col justify-center p-4 border-barth-gold/20">
            <span className="text-gray-400 text-[10px] uppercase tracking-widest font-medium">
              Statut
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-light text-green-500/80">
                Opérationnel
              </span>
            </div>
          </GlassCard>
        </div>

        {/* PASSAGE DES DONNÉES AU WRAPPER */}
        <DashboardClientWrapper
          initialAgents={agents}
          physicalAgencies={physicalAgencies}
          availableAgencies={allAgencies}
          realTimeStats={finalChartData} // ✅ On envoie les vraies stats
        />
      </div>
    </div>
  );
}
