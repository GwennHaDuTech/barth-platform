import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ Indispensable pour que les stats soient toujours à jour (pas de cache)
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();

    // On remonte 30 jours en arrière
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // On récupère toutes les stats depuis 30 jours
    const allRawStats = await prisma.analytics.findMany({
      where: { date: { gte: monthAgo } },
      orderBy: { date: "asc" },
    });

    // On renvoie la structure attendue par le Wrapper
    return NextResponse.json({
      raw: allRawStats,
      aggregates: {},
    });
  } catch (error) {
    console.error("Erreur API Stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
