"use server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
// ✅ IMPORT DES LOGS
import { logActivity } from "@/app/actions/logs";

// --- 1. SCHÉMA DE VALIDATION ---
const AgentFormSchema = z.object({
  firstname: z.string().min(2, "Le prénom est requis"),
  lastname: z.string().min(2, "Le nom est requis"),
  email: z.string(),
  phone: z.string().min(10, "Téléphone invalide"),
  photo: z.string().min(1, "La photo est requise"),
  city: z.string().min(2, "Ville requise"),
  agencyId: z.string().min(1, "Veuillez sélectionner une agence"),
  zipCode: z.string().optional().or(z.literal("")),
  cityPhoto: z.string().optional().or(z.literal("")),
  secondarySector: z.string().optional().or(z.literal("")),
  instagram: z.string().optional().or(z.literal("")),
  linkedin: z.string().optional().or(z.literal("")),
  tiktok: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
});

// --- 2. CRÉATION D'AGENT ---
export async function createAgent(formData: FormData) {
  try {
    const rawData = {
      firstname: formData.get("firstname"),
      lastname: formData.get("lastname"),
      email: formData.get("email") || "",
      phone: formData.get("phone"),
      photo: formData.get("photo"),
      city: formData.get("city"),
      zipCode: formData.get("zipCode"),
      cityPhoto: formData.get("cityPhotoUrl"),
      secondarySector: formData.get("secondarySector"),
      instagram: formData.get("instagram"),
      linkedin: formData.get("linkedin"),
      tiktok: formData.get("tiktok"),
      bio: formData.get("bio"),
      agencyId: formData.get("agencyId"),
    };

    const validated = AgentFormSchema.safeParse(rawData);

    if (!validated.success) {
      console.error("Erreur validation:", validated.error.flatten());
      await logActivity(
        "CREATE",
        "AGENT",
        `Echec création agent ${rawData.lastname}`,
        "FAILURE",
        "Validation invalide"
      );
      return {
        success: false,
        error: "Données invalides. Vérifiez les champs.",
      };
    }

    const data = validated.data;

    let slug = `${data.firstname}-${data.lastname}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const existingSlug = await prisma.agent.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.floor(Math.random() * 10000)}`;
    }

    await prisma.agent.create({
      data: {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        phone: data.phone,
        photo: data.photo,
        city: data.city,
        zipCode: data.zipCode || null,
        cityPhoto: data.cityPhoto || null,
        secondarySector: data.secondarySector || null,
        instagram: data.instagram || null,
        linkedin: data.linkedin || null,
        tiktok: data.tiktok || null,
        bio: data.bio || null,
        slug: slug,
        agencyId: data.agencyId,
      },
    });

    // 🟢 LOG SUCCÈS
    await logActivity(
      "CREATE",
      "AGENT",
      `Nouveau site agent : ${data.firstname} ${data.lastname}`,
      "SUCCESS"
    );

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: unknown) {
    console.error("Erreur createAgent:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    // 🔴 LOG ERREUR
    await logActivity(
      "CREATE",
      "AGENT",
      `Erreur création agent`,
      "FAILURE",
      errorMessage
    );

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { success: false, error: "Cet email ou ce nom existe déjà." };
      }
    }
    return { success: false, error: "Erreur technique lors de la création." };
  }
}

// --- 3. MISE À JOUR D'AGENT ---
export async function updateAgent(id: string, formData: FormData) {
  try {
    const rawData = {
      firstname: formData.get("firstname"),
      lastname: formData.get("lastname"),
      email: formData.get("email") || "",
      phone: formData.get("phone"),
      photo: formData.get("photo"),
      city: formData.get("city"),
      zipCode: formData.get("zipCode"),
      cityPhoto: formData.get("cityPhotoUrl"),
      secondarySector: formData.get("secondarySector"),
      instagram: formData.get("instagram"),
      linkedin: formData.get("linkedin"),
      tiktok: formData.get("tiktok"),
      bio: formData.get("bio"),
      agencyId: formData.get("agencyId"),
    };

    const validated = AgentFormSchema.safeParse(rawData);

    if (!validated.success) {
      await logActivity(
        "UPDATE",
        "AGENT",
        `Echec modif agent ID ${id}`,
        "FAILURE",
        "Validation invalide"
      );
      return {
        success: false,
        error: "Données invalides pour la mise à jour.",
      };
    }

    await prisma.agent.update({
      where: { id },
      data: {
        firstname: validated.data.firstname,
        lastname: validated.data.lastname,
        email: validated.data.email,
        phone: validated.data.phone,
        photo: validated.data.photo as string,
        city: validated.data.city,
        zipCode: validated.data.zipCode || null,
        cityPhoto: validated.data.cityPhoto || null,
        secondarySector: validated.data.secondarySector || null,
        instagram: validated.data.instagram || null,
        linkedin: validated.data.linkedin || null,
        tiktok: validated.data.tiktok || null,
        bio: validated.data.bio || null,
        agencyId: validated.data.agencyId,
      },
    });

    // 🟢 LOG SUCCÈS
    await logActivity(
      "UPDATE",
      "AGENT",
      `Mise à jour site agent : ${validated.data.firstname} ${validated.data.lastname}`,
      "SUCCESS"
    );

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Erreur Update:", error);

    // 🔴 LOG ERREUR
    await logActivity(
      "UPDATE",
      "AGENT",
      `Erreur modif agent ID ${id}`,
      "FAILURE",
      errorMessage
    );
    return { success: false, error: "Impossible de mettre à jour l'agent." };
  }
}

// --- 4. VÉRIFICATION DOUBLON ---
export async function checkAgentDuplication(
  firstname: string,
  lastname: string
) {
  try {
    const existing = await prisma.agent.findFirst({
      where: {
        firstname: { equals: firstname, mode: "insensitive" },
        lastname: { equals: lastname, mode: "insensitive" },
      },
    });
    return !!existing;
  } catch (error: unknown) {
    console.error("Erreur vérification doublon:", error);
    return false;
  }
}

// --- 5. SUPPRESSION ---
export async function deleteAgent(agentId: string) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { lastname: true },
    });

    await prisma.agent.delete({
      where: { id: agentId },
    });

    // 🟢 LOG SUCCÈS
    await logActivity(
      "DELETE",
      "AGENT",
      `Suppression site agent : ${agent?.lastname || agentId}`,
      "SUCCESS"
    );

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Erreur suppression:", error);

    // 🔴 LOG ERREUR
    await logActivity(
      "DELETE",
      "AGENT",
      `Echec suppression agent ID ${agentId}`,
      "FAILURE",
      errorMessage
    );
    return { success: false, error: "Impossible de supprimer cet agent." };
  }
}

// --- 6. RÉCUPÉRATION DES AGENCES ---
export async function getAgencies() {
  try {
    const agencies = await prisma.agency.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return agencies;
  } catch (error: unknown) {
    console.error("Erreur getAgencies:", error);
    return [];
  }
}
export async function trackVisit(data: {
  agentId?: string;
  agencyId?: string;
}) {
  if (!data.agentId && !data.agencyId) return { success: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0); // On normalise la date à minuit pour regrouper par jour

  try {
    // 1. On cherche s'il existe déjà une ligne pour aujourd'hui
    const existingEntry = await prisma.analytics.findFirst({
      where: {
        date: today,
        agentId: data.agentId ?? null,
        agencyId: data.agencyId ?? null,
      },
    });

    if (existingEntry) {
      // 2. Si oui, on incrémente
      await prisma.analytics.update({
        where: { id: existingEntry.id },
        data: { visits: { increment: 1 } },
      });
    } else {
      // 3. Sinon, on crée la ligne
      await prisma.analytics.create({
        data: {
          date: today,
          visits: 1,
          agentId: data.agentId ?? null,
          agencyId: data.agencyId ?? null,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur tracking visite:", error);
    return { success: false, error };
  }
}
