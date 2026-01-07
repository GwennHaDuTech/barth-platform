import prisma from "@/lib/prisma";
import AgencyViews from "./AgencyViews";
import CreateAgencyButton from "./CreateAgencyButton";

export const dynamic = "force-dynamic";

export default async function AgenciesPage() {
  // 1. Récupérer les agences
  const agencies = await prisma.agency.findMany({
    include: {
      manager: true,
      agents: true,
      _count: {
        select: { agents: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Récupérer la liste des agents (pour le formulaire de création)
  const agentsList = await prisma.agent.findMany({
    select: {
      id: true,
      firstname: true,
      lastname: true,
    },
    orderBy: { lastname: "asc" },
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">Agences</h1>
          <p className="text-gray-400 text-sm">
            Gérez vos points de vente et leurs responsables.
          </p>
        </div>

        {/* Partie Droite : Compteur + Bouton */}
        <div className="flex flex-col items-end gap-4">
          {/* ✅ LE COMPTEUR AJOUTÉ */}
          <div className="text-right">
            <span className="text-4xl font-light text-white">
              {agencies.length}
            </span>
            <span className="text-gray-300 text-sm ml-2">
              sites agences actifs
            </span>
          </div>

          {/* Le bouton reste ici */}
          <CreateAgencyButton availableAgents={agentsList} />
        </div>
      </div>

      <div className="w-full">
        <AgencyViews agencies={agencies} />
      </div>
    </div>
  );
}
