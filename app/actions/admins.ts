"use server";

import prisma from "@/lib/prisma";
import { AdminRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

// 1. Récupérer tous les admins
export async function getAdmins() {
  try {
    return await prisma.admin.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Erreur getAdmins:", error);
    return [];
  }
}

// 2. Ajouter un admin
export async function createAdmin(formData: FormData, notifyTeam: boolean) {
  try {
    const email = formData.get("email") as string;
    const firstname = formData.get("firstname") as string;
    const lastname = formData.get("lastname") as string;
    const role = formData.get("role") as AdminRole;

    if (!email) return { success: false, error: "Email requis" };

    // Vérifier doublon
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) return { success: false, error: "Cet email est déjà admin." };

    await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        firstname,
        lastname,
        role: role || "ADMIN",
      },
    });

    if (notifyTeam) {
      // TODO: Connecter ici Resend ou SendGrid
      console.log(
        `[EMAIL SIMULATION] Envoi d'un mail à l'équipe : "Nouvel admin ajouté : ${email}"`
      );
    }

    revalidatePath("/dashboard"); // Rafraîchir les données
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erreur serveur lors de la création." };
  }
}

// 3. Supprimer un admin
export async function deleteAdmin(
  adminId: string,
  adminEmail: string,
  notifyTeam: boolean
) {
  try {
    await prisma.admin.delete({
      where: { id: adminId },
    });

    if (notifyTeam) {
      // TODO: Connecter ici Resend ou SendGrid
      console.log(
        `[EMAIL SIMULATION] Envoi d'un mail à l'équipe : "Admin supprimé : ${adminEmail}"`
      );
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erreur lors de la suppression." };
  }
}
