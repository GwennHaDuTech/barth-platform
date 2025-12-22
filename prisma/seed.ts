// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1. Créer Julie
  const julie = await prisma.agent.upsert({
    where: { subdomain: "julie" },
    update: {},
    create: {
      subdomain: "julie",
      name: "Julie Martin",
      city: "Rennes Centre",
      photo:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
      bio: "Passionnée par l'architecture rennaise, je vous accompagne depuis 10 ans.",
      phone: "06 12 34 56 78",
      listings: {
        create: [
          {
            title: "Appartement T3 Thabor",
            price: "350 000 €",
            img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
          },
          {
            title: "Loft Centre Historique",
            price: "520 000 €",
            img: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=600&q=80",
          },
        ],
      },
    },
  });

  // 2. Créer Thomas
  const thomas = await prisma.agent.upsert({
    where: { subdomain: "thomas" },
    update: {},
    create: {
      subdomain: "thomas",
      name: "Thomas Dubois",
      city: "Saint-Malo",
      photo:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
      bio: "Spécialiste vue mer et investissement locatif sur la côte.",
      phone: "06 98 76 54 32",
      listings: {
        create: [
          {
            title: "Villa Vue Mer",
            price: "850 000 €",
            img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
          },
        ],
      },
    },
  });

  console.log("Base de données remplie avec :", { julie, thomas });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
