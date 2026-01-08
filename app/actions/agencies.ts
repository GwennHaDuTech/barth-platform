"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
// ✅ IMPORT DES LOGS
import { logActivity } from "@/app/actions/logs";

// --- SCHEMA VALIDATION ---
const AgencySchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  city: z.string().min(2, "La ville est requise"),
  zipCode: z.string().min(4, "Code postal invalide"),
  address: z.string().min(5, "L'adresse est requise"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional().or(z.literal("")),
  photo: z.string().optional().or(z.literal("")),
  managerId: z.string().optional().or(z.literal("")),
});

export async function createAgency(formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name") as string,
      city: formData.get("city") as string,
      zipCode: formData.get("zipCode") as string,
      address: formData.get("address") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || "",
      photo: (formData.get("photo") as string) || "",
      managerId: (formData.get("managerId") as string) || "",
    };

    const validated = AgencySchema.safeParse(rawData);

    if (!validated.success) {
      await logActivity(
        "CREATE",
        "AGENCY",
        `Tentative création agence ${rawData.name || "Inconnue"}`,
        "FAILURE",
        "Données invalides"
      );
      return {
        success: false,
        error: "Données invalides (champs manquants ou format incorrect).",
      };
    }

    const data = validated.data;
    const existing = await prisma.agency.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      await logActivity(
        "CREATE",
        "AGENCY",
        `Tentative création agence ${data.name}`,
        "FAILURE",
        "Email déjà utilisé"
      );
      return {
        success: false,
        error: "Cet email est déjà utilisé par une autre agence.",
      };
    }

    // Création de l'agence
    await prisma.agency.create({
      data: {
        name: data.name,
        city: data.city,
        zipCode: data.zipCode,
        address: data.address,
        email: data.email,
        phone: data.phone || null,
        photo: data.photo || "https://placehold.co/600x400?text=Agence",
        manager: data.managerId
          ? { connect: { id: data.managerId } }
          : undefined,
      },
    });

    // 🟢 LOG SUCCÈS
    await logActivity(
      "CREATE",
      "AGENCY",
      `Création agence : ${data.name} (${data.city})`,
      "SUCCESS"
    );

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Erreur createAgency:", error);

    // 🔴 LOG ERREUR TECHNIQUE
    await logActivity(
      "CREATE",
      "AGENCY",
      `Erreur technique création agence`,
      "FAILURE",
      errorMessage
    );
    return { success: false, error: "Erreur technique lors de la création." };
  }
}

export async function deleteAgency(agencyId: string) {
  try {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { name: true },
    });

    await prisma.agency.delete({
      where: { id: agencyId },
    });

    // 🟢 LOG SUCCÈS
    await logActivity(
      "DELETE",
      "AGENCY",
      `Suppression agence : ${agency?.name || agencyId}`,
      "SUCCESS"
    );

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: unknown) {
    console.error("Erreur lors de la suppression de l'agence:", error);

    // 🔴 LOG ERREUR
    await logActivity(
      "DELETE",
      "AGENCY",
      `Echec suppression agence ID ${agencyId}`,
      "FAILURE",
      "Contient probablement des agents"
    );
    return { success: false, error: "Impossible de supprimer l'agence." };
  }
}
