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
      firstname: "Julie", // 👈 Ajouté
      lastname: "Martin", // 👈 Ajouté
      name: "Julie Martin",
      email: "julie@martin.fr", // 👈 Ajouté
      city: "Rennes Centre",
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
      bio: "Experte du centre-ville rennais depuis 10 ans.",
      phone: "06 12 34 56 78",
      listings: {
        create: [
          {
            title: "Appartement de prestige Place des Lices",
            price: "450 000 €",
            img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
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
