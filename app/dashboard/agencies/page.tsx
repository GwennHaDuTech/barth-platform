import prisma from "@/lib/prisma";
import CreateAgencyButton from "./CreateAgencyButton";
import AgencyViews from "./AgencyViews";

export const dynamic = "force-dynamic";

export default async function AgenciesPage() {
  // 1. Récupérer les agences
  const agencies = await prisma.agency.findMany({
    include: {
      manager: true,
      agents: true,
    },
    orderBy: { name: "asc" },
  });

  // 2. Récupérer les agents pour le formulaire (Dropdown)
  const agentsList = await prisma.agent.findMany({
    select: { id: true, firstname: true, lastname: true },
    orderBy: { lastname: "asc" },
  });

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">
            Réseau d'Agences
          </h1>
          <p className="text-gray-400 text-sm">
            Gérez vos points de vente physiques et digitaux.
          </p>
        </div>
        <CreateAgencyButton availableAgents={agentsList} />
      </div>
      <AgencyViews agencies={agencies} />
    </div>
  );
}
