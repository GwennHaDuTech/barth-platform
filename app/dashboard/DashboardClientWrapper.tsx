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

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      const { raw }: { raw: AnalyticsData[] } = await res.json();

      const now = new Date();

      // --- 1. LOGIQUE GRAPHIQUE INTELLIGENTE ---

      const getGraphStartDate = () => {
        if (graphPeriod === "24h")
          return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (graphPeriod === "7 jours")
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (graphPeriod === "1 mois")
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return new Date(0);
      };

      const startDate = getGraphStartDate();
      const is24hMode = graphPeriod === "24h";

      // On utilise un Map pour grouper les données
      // Clé = Timestamp (heure ou jour) -> Valeur = Visites
      const aggregatedData = new Map<string, number>();

      raw.forEach((entry) => {
        // ✅ CORRECTION 1 : On ignore strictement les données "global" fantômes
        if (entry.agentId === "global" || entry.agencyId === "global") return;

        const entryDate = new Date(entry.date);

        if (entryDate >= startDate) {
          let key;

          if (is24hMode) {
            // ✅ CORRECTION 2 : Mode 24h -> On groupe par HEURE
            // On arrondit à l'heure pile (ex: 14:00, 15:00)
            const dateHour = new Date(entryDate);
            dateHour.setMinutes(0, 0, 0);
            key = dateHour.toISOString();
          } else {
            // Mode Jours -> On groupe par JOUR (YYYY-MM-DD)
            key = entry.date.split("T")[0];
          }

          const currentTotal = aggregatedData.get(key) || 0;
          aggregatedData.set(key, currentTotal + entry.visits);
        }
      });

      // Transformation en tableau trié pour Recharts
      const chartStats = Array.from(aggregatedData.entries())
        .sort((a, b) => (a[0] > b[0] ? 1 : -1)) // Tri chronologique
        .map(([key, visits]) => {
          const date = new Date(key);
          let nameLabel;

          if (is24hMode) {
            // Format Heure pour le 24h (ex: "14h")
            nameLabel = date.getHours() + "h";
          } else {
            // Format Jour pour le reste (ex: "Lun. 12")
            nameLabel = new Intl.DateTimeFormat("fr-FR", {
              weekday: "short",
              day: "numeric",
            }).format(date);
          }

          return {
            name: nameLabel,
            visits: visits,
          };
        });

      // Si le tableau est vide (0 visites), on met un point à 0 pour éviter le graph vide
      if (chartStats.length === 0) {
        setGraphData([
          { name: is24hMode ? "Maintenant" : "Aujourd'hui", visits: 0 },
        ]);
      } else {
        setGraphData(chartStats);
      }

      // --- 2. LOGIQUE TABLEAUX (Inchangée et fiable) ---
      const getLimit = (days: number) =>
        new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

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
  }, [initialAgents, physicalAgencies, graphPeriod]);

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
  }, [refreshStats]);

  return (
    <>
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
