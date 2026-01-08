import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Début du remplissage des statistiques...");

  const agents = await prisma.agent.findMany();
  const agencies = await prisma.agency.findMany();

  // Supprimer les anciennes stats pour repartir à propre
  await prisma.analytics.deleteMany();

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    let totalVisitsDay = 0;

    // Simuler des visites pour chaque agent
    for (const agent of agents) {
      const visits = Math.floor(Math.random() * 50) + 10;
      totalVisitsDay += visits;
    }

    // Simuler des visites pour chaque agence
    for (const agency of agencies) {
      const visits = Math.floor(Math.random() * 100) + 20;
      totalVisitsDay += visits;
    }

    // Enregistrer le total cumulé pour ce jour dans Analytics
    await prisma.analytics.create({
      data: {
        date: date,
        visits: totalVisitsDay,
        agentId: "global",
        agencyId: "global",
      },
    });

    console.log(`✅ Jour -${i} : ${totalVisitsDay} visites cumulées.`);
  }

  console.log("✨ Statistiques liées avec succès !");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
