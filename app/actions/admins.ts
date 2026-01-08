"use server";

import prisma from "@/lib/prisma";
import { AdminRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

// Initialisation de Resend
// Si la clé n'est pas présente, cela ne plantera pas l'appli mais les mails ne partiront pas (utile en dev sans clé)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
// Remplacez par votre vrai domaine vérifié sur Resend (ex: 'ne-pas-repondre@barth-platform.com')
// En mode test gratuit sur Resend, utilisez 'onboarding@resend.dev'
const SENDER_EMAIL =
  "Barth Platform <onboarding@paulbroussouloux-barthimmobilier.fr>";

// --- UTILITAIRES ---

// Fonction pour récupérer les emails de l'équipe (sauf celui concerné par l'action)
async function getTeamEmails(excludeEmail: string) {
  const admins = await prisma.admin.findMany({
    select: { email: true },
  });
  // On filtre pour ne pas envoyer la notif à la personne concernée ni aux doublons
  return admins.map((a) => a.email).filter((e) => e !== excludeEmail);
}

// --- ACTIONS ---

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
    const email = (formData.get("email") as string).trim().toLowerCase();
    const firstname = formData.get("firstname") as string;
    const lastname = formData.get("lastname") as string;
    const role = formData.get("role") as AdminRole;

    if (!email) return { success: false, error: "Email requis" };

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) return { success: false, error: "Cet email est déjà admin." };

    // A. Création en BDD
    await prisma.admin.create({
      data: {
        email,
        firstname,
        lastname,
        role: role || "ADMIN",
      },
    });

    if (resend) {
      // B. Mail de bienvenue au NOUVEL admin (Toujours)
      await resend.emails.send({
        from: SENDER_EMAIL,
        to: email,
        subject: "Accès administrateur accordé - Barth Platform",
        html: `<p>Bienvenue ${firstname}, votre accès est actif.</p>`,
      });

      // C. Logique de notification équipe / Super Admin
      const allAdmins = await prisma.admin.findMany({
        select: { email: true, role: true },
      });

      // On définit les destinataires :
      // - Le Super Admin (toujours)
      // - Les autres (seulement si notifyTeam est vrai)
      const recipients = allAdmins
        .filter((admin) => {
          if (admin.email === email) return false; // Ne pas s'envoyer à soi-même
          if (admin.role === "SUPER_ADMIN") return true; // Toujours le Super Admin
          return notifyTeam; // Les autres seulement si case cochée
        })
        .map((admin) => admin.email);

      if (recipients.length > 0) {
        await resend.emails.send({
          from: SENDER_EMAIL,
          to: recipients,
          subject: "[Sécurité] Nouvel administrateur ajouté",
          html: `<p>L'administrateur <strong>${firstname} ${lastname}</strong> (${email}) a été ajouté.</p>`,
        });
      }
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erreur serveur." };
  }
}

// 3. Supprimer un admin
export async function deleteAdmin(
  adminId: string,
  adminEmail: string,
  notifyTeam: boolean
) {
  try {
    await prisma.admin.delete({ where: { id: adminId } });

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
          html: `<p>L'accès de <strong>${adminEmail}</strong> a été révoqué.</p>`,
        });
      }
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erreur serveur." };
  }
}
