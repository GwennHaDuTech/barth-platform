import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const now = new Date();

  // On définit les points de départ
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // On récupère toutes les stats depuis 30 jours (pour couvrir toutes les périodes)
  const allRawStats = await prisma.analytics.findMany({
    where: { date: { gte: monthAgo } },
    orderBy: { date: "asc" },
  });

  // Fonction pour filtrer et sommer
  const sumVisits = (id: string, isAgent: boolean, since: Date) => {
    return allRawStats
      .filter(
        (s) =>
          (isAgent ? s.agentId === id : s.agencyId === id) &&
          new Date(s.date) >= since
      )
      .reduce((acc, curr) => acc + curr.visits, 0);
  };

  // On construit la réponse
  return NextResponse.json({
    raw: allRawStats, // Pour le graphique (historique)
    aggregates: {
      // On calculera cela dynamiquement côté client ou ici pour chaque agent/agence
    },
  });
}
