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
  // 1. Récupération des agents (Colonne 1)
  const agents: AgentWithAgency[] = await prisma.agent.findMany({
    include: { agency: true },
    orderBy: { lastname: "asc" },
  });

  // 2. Récupération de toutes les agences (Colonne 2 et Sélecteur Formulaire)
  const allAgencies = await prisma.agency.findMany({
    orderBy: { name: "asc" },
  });

  // On sépare les données pour la clarté, même si ici on passe tout à la colonne physique
  // Plus tard, tu pourras filtrer si tu as un champ 'type' dans ta table Agency
  const physicalAgencies: AgencyItem[] = allAgencies.map((agency) => ({
    id: agency.id,
    name: agency.name,
  }));

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
        {/* On passe allAgencies pour le formulaire et physicalAgencies pour le tableau 2 */}
        <DashboardClientWrapper
          initialAgents={agents}
          physicalAgencies={physicalAgencies}
          availableAgencies={allAgencies}
        />
      </div>
    </div>
  );
}
