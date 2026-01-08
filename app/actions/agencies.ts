"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteAgency(id: string) {
  try {
    // Suppression de l'agence
    await prisma.agency.delete({
      where: { id },
    });

    // On rafraîchit le dashboard pour faire disparaître la ligne
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/agencies");

    return { success: true };
  } catch (error) {
    console.error("Erreur suppression agence:", error);
    // On retourne un message d'erreur générique pour le client
    return {
      success: false,
      error:
        "Impossible de supprimer l'agence (elle contient peut-être encore des agents ?)",
    };
  }
}
