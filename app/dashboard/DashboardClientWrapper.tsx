"use client";

import React, { useState, useEffect, useCallback } from "react";
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

// Interface pour les 4 périodes (doit correspondre à celle de DashboardTable)
interface PeriodStats {
  "24h": number;
  "7 jours": number;
  "30 jours": number;
  Tout: number;
}

interface AnalyticsData {
  date: string;
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
  realTimeStats: initialGraphData,
}: Props) {
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentWithAgency | null>(
    null
  );

  const [siteVisits, setSiteVisits] = useState<Record<string, PeriodStats>>({});
  const [graphData, setGraphData] = useState(initialGraphData);
  const [graphPeriod, setGraphPeriod] = useState("7 jours");
  const graphPeriods = ["24h", "7 jours", "1 mois", "Tout"];

  const handleEditAgent = (agent: AgentWithAgency) => {
    setSelectedAgent(agent?.id ? agent : null);
    setIsAgentModalOpen(true);
  };

  const handleAddAgency = () => {
    setIsAgencyModalOpen(true);
  };

  // ✅ CORRECTION 1 : On utilise useCallback pour stabiliser la fonction
  // Cela permet de l'utiliser dans le useEffect sans déclencher de boucle infinie
  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      const { raw }: { raw: AnalyticsData[] } = await res.json();

      const now = new Date();
      const getLimit = (days: number) =>
        new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // 1. Graphique
      const chartStats = raw
        .filter((s) => s.agentId === "global")
        .map((s) => ({
          name: new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(
            new Date(s.date)
          ),
          visits: s.visits,
        }));
      if (chartStats.length > 0) setGraphData(chartStats);

      // 2. Tableaux
      const visitsMap: Record<string, PeriodStats> = {};
      const allSiteIds = [
        ...initialAgents.map((a) => a.id),
        ...physicalAgencies.map((a) => a.id),
      ];

      allSiteIds.forEach((id) => {
        const siteEntries = raw.filter(
          (s) => s.agentId === id || s.agencyId === id
        );

        visitsMap[id] = {
          "24h": siteEntries
            .filter((s) => new Date(s.date) >= getLimit(1))
            .reduce((acc, curr) => acc + curr.visits, 0),
          "7 jours": siteEntries
            .filter((s) => new Date(s.date) >= getLimit(7))
            .reduce((acc, curr) => acc + curr.visits, 0),
          "30 jours": siteEntries
            .filter((s) => new Date(s.date) >= getLimit(30))
            .reduce((acc, curr) => acc + curr.visits, 0),
          Tout: siteEntries.reduce((acc, curr) => acc + curr.visits, 0),
        };
      });

      setSiteVisits(visitsMap);
    } catch (e) {
      console.error("Erreur refresh stats", e);
    }
  }, [initialAgents, physicalAgencies]); // ✅ Dépendances du useCallback

  // ✅ CORRECTION 2 : Le useEffect est maintenant propre
  useEffect(() => {
    let isMounted = true;
    const fetchAndSetStats = async () => {
      if (!isMounted) return;
      await refreshStats();
    };

    fetchAndSetStats();
    const interval = setInterval(fetchAndSetStats, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshStats]); // ✅ refreshStats est maintenant une dépendance stable

  return (
    <>
      <div className="flex-[1.5] min-h-0 grid grid-cols-3 gap-6">
        <DashboardTable
          title="Sites Agents"
          data={initialAgents}
          type="agent"
          onEdit={handleEditAgent}
          liveVisits={siteVisits} // ✅ Plus besoin de 'as any', les types correspondent
        />
        <DashboardTable
          title="Sites Agences Physiques"
          data={physicalAgencies}
          type="agency-physical"
          onEdit={handleAddAgency}
          liveVisits={siteVisits} // ✅ Idem ici
        />
        <DashboardTable
          title="Sites Agences En Ligne"
          data={[]}
          type="agency-online"
          isEmpty={true}
        />
      </div>

      <div className="h-[28%]">
        <GlassCard className="h-full p-6 flex flex-col bg-black/20 border-white/10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl font-light tracking-tight text-white">
                Performance Globale
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-medium text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                  Live Analytics
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
            <DashboardGraph period={graphPeriod} data={graphData} />
          </div>
        </GlassCard>
      </div>

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
