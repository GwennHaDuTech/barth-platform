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
  try {
    // ... tes vérifications d'authentification existantes ...

    const firstname = formData.get("firstname") as string;
    const lastname = formData.get("lastname") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const photo = formData.get("photo") as string;
    const city = formData.get("city") as string;

    // 👇 RÉCUPÉRATION DES NOUVEAUX CHAMPS
    const zipCode = formData.get("zipCode") as string;
    const cityPhoto = formData.get("cityPhotoUrl") as string; // Attention au nom "cityPhotoUrl" envoyé par le front
    // -----------------------------------

    const secondarySector = formData.get("secondarySector") as string;
    const instagram = formData.get("instagram") as string;
    const linkedin = formData.get("linkedin") as string;
    const tiktok = formData.get("tiktok") as string;
    const bio = formData.get("bio") as string;

    // Génération du slug (ex: paul-durand)
    const slug = `${firstname.toLowerCase()}-${lastname.toLowerCase()}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");

    // Création en base
    await prisma.agent.create({
      data: {
        firstname,
        lastname,
        email,
        phone,
        photo,
        city,

        // 👇 ENREGISTREMENT
        zipCode: zipCode || "",
        cityPhoto: cityPhoto || "",
        // ----------------

        secondarySector,
        instagram,
        linkedin,
        tiktok,
        bio,
        slug,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur createAgent:", error);
    return { success: false, error: "Impossible de créer l'agent." };
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
