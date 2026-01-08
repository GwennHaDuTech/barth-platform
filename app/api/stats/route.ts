import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // On récupère toutes les entrées analytics du jour
  const stats = await prisma.analytics.findMany({
    where: { date: today },
  });

  return NextResponse.json(stats);
}
