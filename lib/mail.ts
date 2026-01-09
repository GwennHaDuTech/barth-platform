import { Resend } from "resend";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logActivity } from "@/app/actions/logs"; // Assure-toi que ce chemin est correct

// --- CONFIGURATION ---

// On initialise Resend avec la clé API
const resend = new Resend(process.env.RESEND_API_KEY);

// On récupère l'URL de base
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// --- TYPES & SCHEMAS ---

interface SendAgentNotificationProps {
  email: string;
  firstname: string;
  lastname: string;
  slug: string;
  type: "CREATE" | "UPDATE";
}

const AgentFormSchema = z.object({
  firstname: z.string().min(2, "Le prénom est requis"),
  lastname: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Email invalide"),
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

// --- FONCTIONS ---

// 1. ENVOI EMAIL
export async function sendAgentNotification({
  email,
  firstname,
  lastname,
  slug,
  type,
}: SendAgentNotificationProps) {
  const isCreation = type === "CREATE";

  const subject = isCreation
    ? "🎉 Votre site agent est en ligne !"
    : "📝 Mise à jour de votre site agent";

  const titleText = isCreation
    ? "Bienvenue sur votre espace"
    : "Modifications effectuées";

  const bodyText = isCreation
    ? "Votre site web personnel vient d'être généré avec succès. Vous pouvez dès à présent le consulter et le partager à vos clients."
    : "Les modifications apportées à votre profil ont bien été prises en compte et sont visibles sur votre site web.";

  const buttonText = "Voir mon site web";
  const agentUrl = `${BASE_URL}/agent/${slug}`;

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background-color: #18181b; padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 40px 30px; color: #3f3f46; line-height: 1.6; }
          .greeting { font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #18181b; }
          .btn-container { text-align: center; margin: 30px 0; }
          .btn { background-color: #2563eb; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; }
          .footer { background-color: #f4f4f5; padding: 20px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${titleText}</h1>
          </div>
          <div class="content">
            <div class="greeting">Bonjour ${firstname} ${lastname},</div>
            <p>${bodyText}</p>
            
            <div class="btn-container">
              <a href="${agentUrl}" class="btn">${buttonText}</a>
            </div>
            
            <p style="font-size: 14px; color: #71717a;">
              Ou accédez directement via ce lien : <br>
              <a href="${agentUrl}" style="color: #2563eb;">${agentUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>Ceci est un message automatique envoyé depuis votre plateforme de gestion.</p>
            <p>&copy; ${new Date().getFullYear()} Barth Platform. Tous droits réservés.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: "Barth Platform <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: htmlTemplate,
    });

    console.log(`📧 Email sent to ${email} (${type})`, data);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error };
  }
}

// 2. CRÉATION D'AGENT
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

    // 🟢 Création en base
    const newAgent = await prisma.agent.create({
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

    // 📧 ENVOI DU MAIL (Création)
    await sendAgentNotification({
      email: newAgent.email,
      firstname: newAgent.firstname,
      lastname: newAgent.lastname,
      slug: newAgent.slug,
      type: "CREATE",
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

// 3. MISE À JOUR D'AGENT
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

    // 🟢 Mise à jour en base
    const updatedAgent = await prisma.agent.update({
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

    // 📧 ENVOI DU MAIL (Modification)
    await sendAgentNotification({
      email: updatedAgent.email,
      firstname: updatedAgent.firstname,
      lastname: updatedAgent.lastname,
      slug: updatedAgent.slug,
      type: "UPDATE",
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

// 4. VÉRIFICATION DOUBLON
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

// 5. SUPPRESSION
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

// 6. RÉCUPÉRATION DES AGENCES
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

// 7. TRACKING VISITES
export async function trackVisit(data: {
  agentId?: string;
  agencyId?: string;
}) {
  if (!data.agentId && !data.agencyId) return { success: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const existingEntry = await prisma.analytics.findFirst({
      where: {
        date: today,
        agentId: data.agentId ?? null,
        agencyId: data.agencyId ?? null,
      },
    });

    if (existingEntry) {
      await prisma.analytics.update({
        where: { id: existingEntry.id },
        data: { visits: { increment: 1 } },
      });
    } else {
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
  } catch (error: unknown) {
    // Correction ici pour éviter de retourner un objet "error" potentiellement complexe ou inconnu
    console.error("Erreur tracking visite:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}
