"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createAgent(formData: FormData) {
  // 1. Récupération des champs
  const firstname = formData.get("firstname") as string;
  const lastname = formData.get("lastname") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const city = formData.get("city") as string;
  const bio = formData.get("bio") as string;
  const photo = formData.get("photo") as string;

  // 2. Validation (Côté Serveur)
  if (!firstname || !lastname || !email || !phone || !bio || !city || !photo) {
    return { success: false, error: "Tous les champs sont obligatoires." };
  }

  // 3. Génération du sous-domaine unique
  const cleanString = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const baseSlug = `${cleanString(firstname)}.${cleanString(lastname)}`;
  let uniqueSubdomain = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.agent.findUnique({
      where: { subdomain: uniqueSubdomain },
    });
    if (!existing) break;
    uniqueSubdomain = `${baseSlug}${counter}`;
    counter++;
  }

  // 4. Création en base de données
  try {
    await prisma.agent.create({
      data: {
        firstname,
        lastname,
        name: `${firstname} ${lastname}`,
        subdomain: uniqueSubdomain,
        email,
        phone,
        city,
        bio,
        photo,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error = e as any;
    console.error("Erreur création agent:", error);

    // GESTION DU DOUBLON (Code Prisma P2002)
    if (error.code === "P2002") {
      return {
        success: false,
        error:
          "Un autre agent utilise déjà cet email ou ce nom. Merci d'ajouter un chiffre à ton nom pour qu'il soit unique.",
      };
    }

    return { success: false, error: "Erreur technique lors de la création." };
  }
}

export async function deleteAgent(agentId: string) {
  try {
    await prisma.agent.delete({
      where: { id: agentId },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erreur suppression:", error);
    return { success: false, error: "Impossible de supprimer cet agent." };
  }
}
