import React from "react";
import prisma from "@/lib/prisma";
import GlassCard from "@/components/ui/GlassCard";
import DashboardClientWrapper from "./DashboardClientWrapper";
import { Prisma } from "@prisma/client";
// ✅ Type utilisé pour typer proprement la constante agents
type AgentWithAgency = Prisma.AgentGetPayload<{
  include: { agency: true };
}>;

// ✅ Interface pour typer proprement les agences
interface AgencyOption {
  id: string;
  name: string;
}

export default async function DashboardPage() {
  // 1. Récupération typée des agents (L'erreur 'unused' disparaît ici)
  const agents: AgentWithAgency[] = await prisma.agent.findMany({
    include: { agency: true },
  });

  const agencies: AgencyOption[] = await prisma.agency.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // 2. Remplacement du 'any[]' par le type AgencyOption
  const physicalAgencies: AgencyOption[] = [];

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
              {agents.length}
            </span>
          </GlassCard>
          <GlassCard className="flex flex-col justify-center p-4">
            <span className="text-gray-400 text-[10px] uppercase tracking-widest font-medium">
              Visites 24h
            </span>
            <span className="text-2xl font-light text-barth-gold">1,284</span>
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

        {/* MIDDLE & BOTTOM SECTION */}
        <DashboardClientWrapper
          initialAgents={agents}
          physicalAgencies={physicalAgencies}
          availableAgencies={agencies}
        />
      </div>
    </div>
  );
}
