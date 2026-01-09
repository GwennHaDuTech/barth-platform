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
        Aucune donnée disponible pour : {period}
      </div>
    );
  }

  return (
    // ✅ On enlève les min-h ici, car c'est le parent (absolute inset-0) qui gère la taille maintenant
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        // Marges ajustées pour que tout rentre
        margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="rgba(255,255,255,0.05)"
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6b7280", fontSize: 10 }}
          dy={10}
          interval="preserveStartEnd"
          height={30}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6b7280", fontSize: 10 }}
          domain={[0, "auto"]}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a1a",
            borderColor: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#fff",
          }}
          itemStyle={{ color: "#d4af37" }}
          cursor={{ stroke: "rgba(212, 175, 55, 0.2)", strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="visits"
          stroke="#d4af37"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorVisits)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
