"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  name: string;
  visits: number;
}

// Données simulées pour les autres périodes
const dataSets: Record<string, DataPoint[]> = {
  "24h": [
    { name: "00h", visits: 40 },
    { name: "04h", visits: 20 },
    { name: "08h", visits: 150 },
    { name: "12h", visits: 400 },
    { name: "16h", visits: 320 },
    { name: "20h", visits: 500 },
  ],
  "1 mois": [
    { name: "Sem 1", visits: 2500 },
    { name: "Sem 2", visits: 3200 },
    { name: "Sem 3", visits: 2800 },
    { name: "Sem 4", visits: 4100 },
  ],
  Tout: [
    { name: "Jan", visits: 8000 },
    { name: "Fév", visits: 9500 },
    { name: "Mar", visits: 12000 },
  ],
};

interface DashboardGraphProps {
  period: string;
  data: DataPoint[]; // ✅ Les données réelles venant du serveur
}

export default function DashboardGraph({ period, data }: DashboardGraphProps) {
  // ✅ LOGIQUE DE SELECTION DES DONNÉES
  // Si on est sur "7 jours", on prend 'data' (les stats réelles),
  // sinon on prend dans 'dataSets' ou on replie sur 'data'.
  const displayData = period === "7 jours" ? data : dataSets[period] || data;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        {/* ✅ On utilise bien displayData ici */}
        <AreaChart
          data={displayData}
          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#bf9b30" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#bf9b30" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255,255,255,0.08)"
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(20, 20, 20, 0.9)",
              border: "1px solid rgba(191, 155, 48, 0.3)",
              borderRadius: "12px",
              fontSize: "13px",
              backdropFilter: "blur(8px)",
            }}
            itemStyle={{ color: "#bf9b30" }}
            cursor={{ stroke: "rgba(191, 155, 48, 0.2)", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="visits"
            stroke="#bf9b30"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorVisits)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
