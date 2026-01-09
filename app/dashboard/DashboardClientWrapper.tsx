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
      const aggregatedData = new Map<string, number>();

      raw.forEach((entry) => {
        if (entry.agentId === "global" || entry.agencyId === "global") return;
        const entryDate = new Date(entry.date);
        if (entryDate >= startDate) {
          let key;
          if (is24hMode) {
            const dateHour = new Date(entryDate);
            dateHour.setMinutes(0, 0, 0);
            key = dateHour.toISOString();
          } else {
            key = entry.date.split("T")[0];
          }
          const currentTotal = aggregatedData.get(key) || 0;
          aggregatedData.set(key, currentTotal + entry.visits);
        }
      });

      const chartStats = Array.from(aggregatedData.entries())
        .sort((a, b) => (a[0] > b[0] ? 1 : -1))
        .map(([key, visits]) => {
          const date = new Date(key);

          // ✅ Correction 1 : Utilisation de 'const' au lieu de 'let'
          const nameLabel = is24hMode
            ? date.getHours() + "h"
            : new Intl.DateTimeFormat("fr-FR", {
                weekday: "short",
                day: "numeric",
              }).format(date);

          return { name: nameLabel, visits: visits };
        });

      if (chartStats.length === 0) {
        setGraphData([
          { name: is24hMode ? "Maintenant" : "Aujourd'hui", visits: 0 },
        ]);
      } else {
        setGraphData(chartStats);
      }

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

  // ✅ Correction 2 : useEffect propre avec fonction locale async
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (isMounted) {
        await refreshStats();
      }
    };

    fetchData(); // Appel initial
    const interval = setInterval(fetchData, 5000); // Appel périodique

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshStats]);

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 w-full">
      {/* Grille forcée 3 colonnes dès LG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 2xl:gap-6 min-h-100 flex-[1.5]">
        <DashboardTable
          title="Sites Agents"
          data={initialAgents}
          type="agent"
          onEdit={handleEditAgent}
          liveVisits={siteVisits}
        />
        <DashboardTable
          title="Agences Physiques"
          data={physicalAgencies}
          type="agency-physical"
          onEdit={handleAddAgency}
          liveVisits={siteVisits}
        />
        <DashboardTable
          title="Agences En Ligne"
          data={[]}
          type="agency-online"
          isEmpty={true}
        />
      </div>

      <div className="h-[350px] w-full shrink-0">
        <GlassCard className="h-full p-4 lg:p-6 flex flex-col bg-black/20 border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4">
            <div>
              <h2 className="text-lg lg:text-xl font-light tracking-tight text-white">
                Performance Globale
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] lg:text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                  Live Analytics
                </span>
              </div>
            </div>

            <div className="flex bg-white/5 p-1 rounded-lg border border-white/5 overflow-x-auto max-w-full">
              {graphPeriods.map((p) => (
                <button
                  key={p}
                  onClick={() => setGraphPeriod(p)}
                  className={`px-3 py-1 rounded-md text-[10px] lg:text-xs whitespace-nowrap transition-all ${
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

          {/* ✅ CORRECTION MAGIC : Le conteneur relative + absolute force le graph à s'afficher */}
          <div className="flex-1 w-full relative min-h-0">
            <div className="absolute inset-0">
              <DashboardGraph period={graphPeriod} data={graphData} />
            </div>
          </div>
        </GlassCard>
      </div>

      {isAgentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-200">
            <CreateAgencyForm
              onClose={() => setIsAgencyModalOpen(false)}
              availableAgents={initialAgents}
            />
          </div>
        </div>
      )}
    </div>
  );
}
