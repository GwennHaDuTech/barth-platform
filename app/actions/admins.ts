"use server";

import prisma from "@/lib/prisma";
import { AdminRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
// ✅ IMPORT DES LOGS
import { logActivity } from "@/app/actions/logs";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const SENDER_EMAIL =
  "Barth Platform <onboarding@paulbroussouloux-barthimmobilier.fr>";

// --- UTILITAIRES ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getTeamEmails(excludeEmail: string) {
  const admins = await prisma.admin.findMany({ select: { email: true } });
  return admins.map((a) => a.email).filter((e) => e !== excludeEmail);
}

// --- ACTIONS ---

export async function getAdmins() {
  try {
    return await prisma.admin.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error) {
    console.error("Erreur getAdmins:", error);
    return [];
  }
}

export async function createAdmin(formData: FormData, notifyTeam: boolean) {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const firstname = formData.get("firstname") as string;
  const lastname = formData.get("lastname") as string;
  const role = formData.get("role") as AdminRole;

  try {
    // const loginUrl = "https://barth-platform.vercel.app"; // Utilisé dans le template HTML
    const dashboardUrl = "https://barth-platform.vercel.app/dashboard";

    if (!email) {
      await logActivity(
        "CREATE",
        "ADMIN",
        `Tentative ajout admin sans email`,
        "FAILURE",
        "Email requis"
      );
      return { success: false, error: "Email requis" };
    }

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      await logActivity(
        "CREATE",
        "ADMIN",
        `Tentative ajout doublon ${email}`,
        "FAILURE",
        "Email déjà utilisé"
      );
      return { success: false, error: "Cet email est déjà admin." };
    }

    // A. Création en BDD
    await prisma.admin.create({
      data: { email, firstname, lastname, role: role || "ADMIN" },
    });

    // 🟢 LOG SUCCÈS
    await logActivity(
      "CREATE",
      "ADMIN",
      `Ajout admin : ${firstname} ${lastname} (${role})`,
      "SUCCESS"
    );

    if (resend) {
      // B. Mail de bienvenue
      await resend.emails.send({
        from: SENDER_EMAIL,
        to: email,
        subject: "Accès administrateur accordé - Barth Platform",
        // Remplace par ton HTML Dark Premium complet ici
        html: `<p>Bienvenue ${firstname}</p>`,
      });

      // C. Notification équipe
      const allAdmins = await prisma.admin.findMany({
        select: { email: true, role: true },
      });
      const recipients = allAdmins
        .filter(
          (a) => a.email !== email && (a.role === "SUPER_ADMIN" || notifyTeam)
        )
        .map((a) => a.email);

      if (recipients.length > 0) {
        await resend.emails.send({
          from: SENDER_EMAIL,
          to: recipients,
          subject: "[Sécurité] Nouvel administrateur ajouté",
          // Remplace par ton HTML Dark Premium complet ici
          html: `<p>Nouvel admin ajouté : ${firstname} ${lastname} <a href="${dashboardUrl}">Voir</a></p>`,
        });
      }
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    console.error(error);

    // 🔴 LOG ERREUR TECHNIQUE
    await logActivity(
      "CREATE",
      "ADMIN",
      `Erreur ajout admin ${email}`,
      "FAILURE",
      errorMessage
    );
    return { success: false, error: "Erreur serveur." };
  }
}

export async function deleteAdmin(
  adminId: string,
  adminEmail: string,
  notifyTeam: boolean
) {
  try {
    await prisma.admin.delete({ where: { id: adminId } });

    // 🟢 LOG SUCCÈS
    await logActivity(
      "DELETE",
      "ADMIN",
      `Suppression admin : ${adminEmail}`,
      "SUCCESS"
    );

    // const dashboardUrl = "https://barth-platform.vercel.app/dashboard"; // Utilisé dans le HTML

    if (resend) {
      const allAdmins = await prisma.admin.findMany({
        select: { email: true, role: true },
      });

      const recipients = allAdmins
        .filter((admin) => {
          if (admin.role === "SUPER_ADMIN") return true;
          return notifyTeam;
        })
        .map((admin) => admin.email);

      if (recipients.length > 0) {
        await resend.emails.send({
          from: SENDER_EMAIL,
          to: recipients,
          subject: "[Sécurité] Administrateur supprimé",
          // Remplace par ton HTML Dark Premium complet ici
          html: `<p>Admin supprimé : ${adminEmail}</p>`,
        });
      }
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    console.error(error);

    // 🔴 LOG ERREUR
    await logActivity(
      "DELETE",
      "ADMIN",
      `Erreur suppression admin ${adminEmail}`,
      "FAILURE",
      errorMessage
    );
    return { success: false, error: "Erreur serveur." };
  }
}
