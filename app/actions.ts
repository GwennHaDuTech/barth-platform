"use server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- 1. SCHÉMA DE VALIDATION (Corrigé) ---
const AgentFormSchema = z.object({
  firstname: z.string().min(2, "Le prénom est requis"),
  lastname: z.string().min(2, "Le nom est requis"),
  // Email peut être vide string, mais on le gère comme string
  email: z.string(),
  phone: z.string().min(10, "Téléphone invalide"),

  // CORRECTION : Photo est requise dans ta BDD, donc requise ici aussi
  photo: z.string().min(1, "La photo est requise"),

  city: z.string().min(2, "Ville requise"),

  // Champs optionnels (nullable dans BDD)
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
      email: formData.get("email") || "", // Assure une string
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
        photo: data.photo, // Maintenant garanti string par Zod
        city: data.city,
        zipCode: data.zipCode || null, // Transforme undefined/"" en null pour Prisma
        cityPhoto: data.cityPhoto || null,
        secondarySector: data.secondarySector || null,
        instagram: data.instagram || null,
        linkedin: data.linkedin || null,
        tiktok: data.tiktok || null,
        bio: data.bio || null,
        slug: slug,
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Erreur createAgent:", error);

    // CORRECTION : On vérifie proprement si c'est une erreur Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 = Violation de contrainte unique (ex: email déjà pris)
      if (error.code === "P2002") {
        return { success: false, error: "Cet email ou ce nom existe déjà." };
      }
    }

    return { success: false, error: "Erreur technique lors de la création." };
  }
}

// ... Les autres fonctions (updateAgent, etc.) restent inchangées ou suivent la même logique
// Si tu as updateAgent en dessous, assure-toi d'appliquer la même logique pour "catch (error)"
// --- 3. MISE À JOUR D'AGENT (Fonctionnelle) ---
export async function updateAgent(id: string, formData: FormData) {
  try {
    // 1. On récupère les données
    const rawData = {
      firstname: formData.get("firstname"),
      lastname: formData.get("lastname"),
      email: formData.get("email") || "",
      phone: formData.get("phone"),
      photo: formData.get("photo"),
      city: formData.get("city"),
      zipCode: formData.get("zipCode"),
      cityPhoto: formData.get("cityPhotoUrl"), // Attention au mapping ici
      secondarySector: formData.get("secondarySector"),
      instagram: formData.get("instagram"),
      linkedin: formData.get("linkedin"),
      tiktok: formData.get("tiktok"),
      bio: formData.get("bio"),
    };

    // 2. Validation Zod
    const validated = AgentFormSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        error: "Données invalides pour la mise à jour.",
      };
    }

    // 3. Mise à jour en BDD (C'est ici qu'on utilise 'id', donc l'alerte disparaîtra)
    await prisma.agent.update({
      where: { id },
      data: {
        firstname: validated.data.firstname,
        lastname: validated.data.lastname,
        email: validated.data.email,
        phone: validated.data.phone,
        photo: validated.data.photo as string,
        city: validated.data.city,
        // Gestion des nullables pour Prisma
        zipCode: validated.data.zipCode || null,
        cityPhoto: validated.data.cityPhoto || null,
        secondarySector: validated.data.secondarySector || null,
        instagram: validated.data.instagram || null,
        linkedin: validated.data.linkedin || null,
        tiktok: validated.data.tiktok || null,
        bio: validated.data.bio || null,
        // Note : On ne met généralement pas à jour le slug pour ne pas casser le SEO
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Erreur Update:", error);
    return { success: false, error: "Impossible de mettre à jour l'agent." };
  }
}

export async function checkAgentDuplication(
  firstname: string,
  lastname: string
) {
  try {
    // Ici, on utilise bien 'firstname' et 'lastname' dans la requête
    const existing = await prisma.agent.findFirst({
      where: {
        firstname: { equals: firstname, mode: "insensitive" }, // insensible à la casse
        lastname: { equals: lastname, mode: "insensitive" },
      },
    });

    // Renvoie true si un agent existe, false sinon
    return !!existing;
  } catch (error) {
    console.error("Erreur vérification doublon:", error);
    return false;
  }
}
// --- 5. SUPPRESSION (Fonctionnelle) ---
export async function deleteAgent(agentId: string) {
  try {
    // On utilise 'agentId' ici pour cibler l'agent à supprimer
    await prisma.agent.delete({
      where: { id: agentId },
    });

    // On rafraîchit la liste pour voir la disparition immédiate
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Erreur suppression:", error);
    return { success: false, error: "Impossible de supprimer cet agent." };
  }
}
