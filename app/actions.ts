"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function checkAgentDuplication(
  firstname: string,
  lastname: string
) {
  try {
    const existing = await prisma.agent.findFirst({
      where: {
        firstname: { equals: firstname, mode: "insensitive" }, // Insensitive = ignore majuscules
        lastname: { equals: lastname, mode: "insensitive" },
      },
    });
    return !!existing; // Renvoie true si trouvé (donc doublon), false si c'est libre
  } catch (error) {
    console.error("Erreur vérification doublon:", error);
    return false; // Dans le doute, on laisse passer (la sécurité finale bloquera)
  }
}

export async function createAgent(formData: FormData) {
  // 1. Récupération des champs standards
  const firstname = formData.get("firstname") as string;
  const lastname = formData.get("lastname") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const photo = formData.get("photo") as string;
  const bio = formData.get("bio") as string;

  // 2. Récupération des NOUVEAUX champs (Secteurs & Réseaux)
  const city = formData.get("city") as string; // Secteur principal
  const secondarySector = formData.get("secondarySector") as string; // Secteur secondaire

  const instagram = formData.get("instagram") as string;
  const linkedin = formData.get("linkedin") as string;
  const tiktok = formData.get("tiktok") as string;

  // 3. Validation Serveur
  // On rend le secteur secondaire obligatoire comme demandé
  if (
    !firstname ||
    !lastname ||
    !email ||
    !phone ||
    !bio ||
    !city ||
    !secondarySector ||
    !photo
  ) {
    return {
      success: false,
      error:
        "Tous les champs obligatoires (y compris les 2 secteurs) doivent être remplis.",
    };
  }

  // 4. Génération du sous-domaine unique
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

  // 5. Création en base de données avec les nouveaux champs
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
        secondarySector, // Nouveau
        instagram, // Nouveau
        linkedin, // Nouveau
        tiktok, // Nouveau
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

    if (error.code === "P2002") {
      return {
        success: false,
        error:
          "Un autre agent utilise déjà cet email ou ce nom. Ajoute un chiffre au nom si nécessaire.",
      };
    }

    return { success: false, error: "Erreur technique lors de la création." };
  }
}

// ... garde ta fonction deleteAgent en dessous, elle ne change pas
export async function deleteAgent(agentId: string) {
  // ... ton code existant ...
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
