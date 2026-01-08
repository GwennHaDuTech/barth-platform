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

interface GraphData {
  name: string;
  visits: number;
}

interface Props {
  period: string;
  data: GraphData[];
}

export default function DashboardGraph({ period, data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs italic">
        Aucune donnée disponible pour la période : {period}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-50">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          // ✅ CORRECTION MAJEURE ICI :
          // bottom: 45 -> Laisse beaucoup de place pour le texte en bas
          // left: -20 -> Colle le graph à gauche (car on cache l'axe Y)
          // right: 10 -> Laisse un peu d'air à droite
          margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
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
            // ✅ CORRECTION SUPPLEMENTAIRE :
            // height={60} : Force l'axe à prendre de la hauteur
            height={60}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            dy={10} // Descend le texte un peu pour l'aérer
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            domain={[0, "auto"]}
            allowDecimals={false}
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
            formatter={(value: number | string | undefined) => [
              `${value ?? 0} Visites`,
              "",
            ]}
          />
          <Area
            type="monotone"
            dataKey="visits"
            stroke="#bf9b30"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorVisits)"
            animationDuration={1000}
            activeDot={{ r: 6, fill: "#bf9b30", stroke: "#000" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
