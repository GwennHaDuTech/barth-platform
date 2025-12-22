"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

// --- CRÉATION ---
export async function createAgent(formData: FormData) {
  // Sécurité
  const { userId } = await auth();
  if (!userId) throw new Error("Accès refusé");

  const name = formData.get("name") as string;
  const subdomain = formData.get("subdomain") as string;
  const city = formData.get("city") as string;
  const phone = formData.get("phone") as string;
  const bio = formData.get("bio") as string;
  const photo =
    (formData.get("photo") as string) ||
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80";

  try {
    await prisma.agent.create({
      data: {
        name,
        subdomain: subdomain.toLowerCase(),
        city,
        phone,
        bio,
        photo,
        listings: {
          create: [
            {
              title: "Bien de bienvenue",
              price: "0 €",
              img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?auto=format&fit=crop&w=600&q=80",
            },
          ],
        },
      },
    });
  } catch (error) {
    console.error("Erreur:", error);
    throw new Error("Erreur création agent");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// --- SUPPRESSION ---
export async function deleteAgent(formData: FormData) {
  // Sécurité
  const { userId } = await auth();
  if (!userId) throw new Error("Accès refusé");

  const agentId = formData.get("agentId") as string;

  await prisma.listing.deleteMany({ where: { agentId } });
  await prisma.agent.delete({ where: { id: agentId } });

  revalidatePath("/dashboard");
}
