"use client";

import React, { useState } from "react";
import DashboardTable from "./DashboardTable";
import GlassCard from "@/components/ui/GlassCard";
import CreateAgentForm from "./CreateAgentForm/CreateAgentForm";
import { Prisma } from "@prisma/client";

// ✅ On définit les types pour que ESLint soit satisfait
type AgentWithAgency = Prisma.AgentGetPayload<{
  include: { agency: true };
}>;

interface AgencyOption {
  id: string;
  name: string;
}

interface Props {
  initialAgents: AgentWithAgency[];
  physicalAgencies: AgencyOption[]; // Remplacement de any[]
  availableAgencies: AgencyOption[]; // Remplacement de any[]
}

export default function DashboardClientWrapper({
  initialAgents,
  physicalAgencies,
  availableAgencies,
}: Props) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // ✅ On précise le type ici aussi au lieu de any
  const [selectedAgent, setSelectedAgent] = useState<AgentWithAgency | null>(
    null
  );

  const handleEditAgent = (agent: AgentWithAgency) => {
    setSelectedAgent(agent);
    setIsEditModalOpen(true);
  };

  return (
    <>
      {/* MIDDLE SECTION : Les 3 Colonnes (55%) */}
      <div className="flex-[1.5] min-h-0 grid grid-cols-3 gap-6">
        <DashboardTable
          title="Sites Agents"
          data={initialAgents}
          type="agent"
          onEdit={handleEditAgent}
        />
        <DashboardTable
          title="Sites Agences Physiques"
          data={physicalAgencies}
          type="agency-physical"
        />
        <DashboardTable
          title="Sites Agences En Ligne"
          data={[]}
          type="agency-online"
          isEmpty={true}
        />
      </div>

      {/* BOTTOM GRAPH (28%) */}
      <div className="h-[28%]">
        <GlassCard className="h-full p-6 flex flex-col bg-black/10">
          <h2 className="text-lg font-light mb-4">Fréquentation globale</h2>
          <div className="flex-1 flex items-center justify-center border border-white/5 rounded-2xl bg-white/5 italic text-sm opacity-40">
            Graphique dynamique en attente de données...
          </div>
        </GlassCard>
      </div>

      {/* MODALE D'ÉDITION */}
      {isEditModalOpen && (
        // ✅ Correction Tailwind : z-100 au lieu de z-[100]
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-200">
            <CreateAgentForm
              onClose={() => setIsEditModalOpen(false)}
              agentToEdit={selectedAgent}
              availableAgencies={availableAgencies}
            />
          </div>
        </div>
      )}
    </>
  );
}
