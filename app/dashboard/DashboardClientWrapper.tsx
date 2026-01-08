"use client";

import React, { useState, useEffect } from "react"; // ✅ Ajout de useEffect ici
import DashboardTable from "./DashboardTable";
import GlassCard from "@/components/ui/GlassCard";
import CreateAgentForm from "./CreateAgentForm/CreateAgentForm";
import CreateAgencyForm from "./agencies/CreateAgencyForm";
import { Prisma } from "@prisma/client";
import DashboardGraph from "./DashboardGraph";

type AgentWithAgency = Prisma.AgentGetPayload<{
  include: { agency: true };
}>;

interface AgencyOption {
  id: string;
  name: string;
}

// Interface pour typer les données analytics venant de l'API
interface AnalyticsData {
  agentId: string;
  agencyId: string;
  visits: number;
}

interface Props {
  initialAgents: AgentWithAgency[];
  physicalAgencies: AgencyOption[];
  availableAgencies: AgencyOption[];
  realTimeStats: { name: string; visits: number }[];
}

export default function DashboardClientWrapper({
  initialAgents,
  physicalAgencies,
  availableAgencies,
  realTimeStats, // ✅ Utilisation directe du nom realTimeStats
}: Props) {
  // États pour les modales
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState<AgentWithAgency | null>(
    null
  );

  // ✅ siteVisits stockera les données live
  const [siteVisits, setSiteVisits] = useState<Record<string, number>>({});

  // State pour la période du graphique
  const [graphPeriod, setGraphPeriod] = useState("7 jours");
  const graphPeriods = ["24h", "7 jours", "1 mois", "Tout"];

  // Handlers pour ouvrir les formulaires
  const handleEditAgent = (agent: AgentWithAgency) => {
    setSelectedAgent(agent?.id ? agent : null);
    setIsAgentModalOpen(true);
  };

  const handleAddAgency = () => {
    setIsAgencyModalOpen(true);
  };

  // ✅ Correction du typage 'any' et de la logique de rafraîchissement
  const refreshStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data: AnalyticsData[] = await res.json();

      const visitsMap: Record<string, number> = {};
      data.forEach((s) => {
        // Si c'est global, on ne le met pas dans la map des lignes individuelles
        const id = s.agentId !== "global" ? s.agentId : s.agencyId;
        if (id !== "global") {
          visitsMap[id] = s.visits;
        }
      });

      setSiteVisits(visitsMap);
    } catch (e) {
      console.error("Erreur refresh stats", e);
    }
  };

  // ✅ Gestion propre du cycle de vie de l'intervalle
  useEffect(() => {
    let isMounted = true;
    const fetchAndSetStats = async () => {
      if (!isMounted) return;
      await refreshStats();
    };
    // Premier appel au montage
    fetchAndSetStats();
    // Rafraîchissement toutes les 5 secondes
    const interval = setInterval(() => {
      fetchAndSetStats();
    }, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* MIDDLE SECTION : Les 3 Colonnes */}
      <div className="flex-[1.5] min-h-0 grid grid-cols-3 gap-6">
        <DashboardTable
          title="Sites Agents"
          data={initialAgents}
          type="agent"
          onEdit={handleEditAgent}
          liveVisits={siteVisits}
        />
        <DashboardTable
          title="Sites Agences Physiques"
          data={physicalAgencies}
          type="agency-physical"
          onEdit={handleAddAgency}
          liveVisits={siteVisits}
        />
        <DashboardTable
          title="Sites Agences En Ligne"
          data={[]}
          type="agency-online"
          isEmpty={true}
        />
      </div>

      {/* BOTTOM GRAPH */}
      <div className="h-[28%]">
        <GlassCard className="h-full p-6 flex flex-col bg-black/20 border-white/10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl font-light tracking-tight text-white">
                Performance Globale
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-medium text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                  +12.5% vs semaine dernière
                </span>
              </div>
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              {graphPeriods.map((p) => (
                <button
                  key={p}
                  onClick={() => setGraphPeriod(p)}
                  className={`px-4 py-1.5 rounded-lg text-xs transition-all ${
                    graphPeriod === p
                      ? "bg-barth-gold text-white shadow-lg shadow-barth-gold/20"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {/* ✅ Correction de la variable passée ici */}
            <DashboardGraph period={graphPeriod} data={realTimeStats} />
          </div>
        </GlassCard>
      </div>

      {/* MODALES */}
      {isAgentModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-200">
            <CreateAgentForm
              onClose={() => setIsAgentModalOpen(false)}
              agentToEdit={selectedAgent}
              availableAgencies={availableAgencies}
            />
          </div>
        </div>
      )}

      {isAgencyModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-200">
            <CreateAgencyForm
              onClose={() => setIsAgencyModalOpen(false)}
              availableAgents={initialAgents}
            />
          </div>
        </div>
      )}
    </>
  );
}
