"use server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- 1. SCHÉMA DE VALIDATION (Mis à jour) ---
const AgentFormSchema = z.object({
  firstname: z.string().min(2, "Le prénom est requis"),
  lastname: z.string().min(2, "Le nom est requis"),
  email: z.string(),
  phone: z.string().min(10, "Téléphone invalide"),
  photo: z.string().min(1, "La photo est requise"),
  city: z.string().min(2, "Ville requise"),

  // ✅ AJOUT : L'agence est maintenant requise ou du moins validée
  agencyId: z.string().min(1, "Veuillez sélectionner une agence"),

  // Champs optionnels
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
      // ✅ AJOUT : Récupération de l'ID de l'agence
      agencyId: formData.get("agencyId"),
    };

    const validated = AgentFormSchema.safeParse(rawData);

    if (!validated.success) {
      console.error("Erreur validation:", validated.error.flatten());
      return {
        success: false,
        error: "Données invalides. Vérifiez les champs.",
      };
    }

    const data = validated.data;

    // Génération du Slug
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
        // ✅ AJOUT : Liaison avec l'agence
        agencyId: data.agencyId,
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Erreur createAgent:", error);
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
      // ✅ AJOUT
      agencyId: formData.get("agencyId"),
    };

    const validated = AgentFormSchema.safeParse(rawData);

    if (!validated.success) {
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
        // ✅ AJOUT : Mise à jour de l'agence
        agencyId: validated.data.agencyId,
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Erreur Update:", error);
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
  } catch (error) {
    console.error("Erreur vérification doublon:", error);
    return false;
  }
}

// --- 5. SUPPRESSION ---
export async function deleteAgent(agentId: string) {
  try {
    await prisma.agent.delete({
      where: { id: agentId },
    });
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Erreur suppression:", error);
    return { success: false, error: "Impossible de supprimer cet agent." };
  }
}

// --- 6. RÉCUPÉRATION DES AGENCES (Nouveau pour le Select) ---
export async function getAgencies() {
  try {
    const agencies = await prisma.agency.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return agencies;
  } catch (error) {
    console.error("Erreur getAgencies:", error);
    return [];
  }
}

// --- 7. GESTION DES AGENCES ---

const AgencySchema = z.object({
  name: z.string().min(2, "Le nom de la ville est requis"),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  photo: z.string().min(1, "La photo de l'agence est requise"),
  managerId: z.string().optional().or(z.literal("")),
});
export async function createAgency(formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name"),
      address: formData.get("address"),
      phone: formData.get("phone"),
      photo: formData.get("photo"),
      managerId: formData.get("managerId"),
    };

    const validated = AgencySchema.safeParse(rawData);

    if (!validated.success) {
      return { success: false, error: "Données invalides." };
    }

    const data = validated.data;

    // Création de l'agence
    await prisma.agency.create({
      data: {
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
        photo: data.photo,
        // Si un manager est sélectionné, on connecte la relation
        manager: data.managerId
          ? { connect: { id: data.managerId } }
          : undefined,
      },
    });

    revalidatePath("/dashboard/agencies"); // On rafraîchit la future page
    revalidatePath("/dashboard/users"); // On rafraîchit aussi la liste des agents (pour le dropdown)
    return { success: true };
  } catch (error) {
    console.error("Erreur createAgency:", error);
    return { success: false, error: "Impossible de créer l'agence." };
  }
}

export async function deleteAgency(id: string) {
  try {
    await prisma.agency.delete({
      where: { id },
    });
    revalidatePath("/dashboard/agencies");
    return { success: true };
  } catch (error) {
    console.error("Erreur deleteAgency:", error);
    return { success: false, error: "Impossible de supprimer l'agence." };
  }
}
