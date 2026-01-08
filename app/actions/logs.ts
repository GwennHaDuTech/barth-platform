"use server";

import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

// --- TYPES ---
type ActionType = "CREATE" | "UPDATE" | "DELETE";
type EntityType = "AGENT" | "AGENCY" | "ADMIN" | "AUTH";
type LogStatus = "SUCCESS" | "FAILURE";

// --- 1. ÉCRIRE UN LOG ---
export async function logActivity(
  action: ActionType,
  entity: EntityType,
  details: string,
  status: LogStatus = "SUCCESS",
  errorMessage?: string
) {
  try {
    // Récupération de l'utilisateur connecté (L'auteur)
    const user = await currentUser();
    const authorName = user
      ? `${user.firstName} ${user.lastName}`
      : "Système / Inconnu";

    await prisma.activityLog.create({
      data: {
        action,
        entity,
        details,
        status,
        errorMessage,
        author: authorName,
      },
    });
  } catch (error) {
    // Si le log plante, on ne veut pas faire planter toute l'appli, on l'affiche juste en console
    console.error("CRITICAL: Impossible d'écrire le log d'activité", error);
  }
}

// --- 2. LIRE LES LOGS (Pagination) ---
export async function getLogs(page: number = 1, pageSize: number = 10) {
  try {
    const skip = (page - 1) * pageSize;

    // On lance les deux requêtes en parallèle (Données + Total)
    const [logs, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        take: pageSize,
        skip: skip,
        orderBy: { createdAt: "desc" }, // Les plus récents en premier
      }),
      prisma.activityLog.count(),
    ]);

    return {
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("Erreur récupération logs:", error);
    return { success: false, error: "Impossible de charger les logs" };
  }
}
