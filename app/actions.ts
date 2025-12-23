"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createAgent(formData: FormData) {
  // 1. Récupération des champs séparés
  const firstname = formData.get("firstname") as string;
  const lastname = formData.get("lastname") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const city = formData.get("city") as string;
  const bio = formData.get("bio") as string;
  const photo = formData.get("photo") as string;

  // 2. Validation Serveur (Sécurité doublée)
  if (!firstname || !lastname || !email) {
    throw new Error("Les champs Prénom, Nom et Email sont obligatoires.");
  }

  // 3. Génération du sous-domaine unique
  // On nettoie les accents et caractères spéciaux
  const cleanString = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const baseSlug = `${cleanString(firstname)}.${cleanString(lastname)}`;
  let uniqueSubdomain = baseSlug;
  let counter = 1;

  // Boucle pour trouver un sous-domaine libre
  while (true) {
    const existing = await prisma.agent.findUnique({
      where: { subdomain: uniqueSubdomain },
    });

    if (!existing) break; // C'est libre !

    // Sinon on incrémente (jean.dupont1, jean.dupont2...)
    uniqueSubdomain = `${baseSlug}${counter}`;
    counter++;
  }

  // 4. Création en base
  try {
    await prisma.agent.create({
      data: {
        firstname,
        lastname,
        name: `${firstname} ${lastname}`, // On reconstitue le nom complet pour l'affichage
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
    // 👇 LE CODE MAGIQUE : On dit au Sheriff d'ignorer la ligne suivante
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error = e as any;

    console.error("Erreur création agent:", error);

    // Gestion de l'erreur "Email ou Sous-domaine déjà pris"
    if (error.code === "P2002") {
      throw new Error("Cet email est déjà utilisé par un autre agent.");
    }

    throw new Error("Erreur technique lors de la création.");
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
    throw new Error("Impossible de supprimer cet agent.");
  }
}
