import prisma from "@/lib/prisma";
import { getAgencies } from "@/app/actions";
import AgentViews from "./AgentViews";

export const dynamic = "force-dynamic";

export default async function UsersManagementPage() {
  // 1. On récupère les agents avec leurs Listings ET leur Agence (pour l'affichage)
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listings: true,
      agency: {
        // <--- AJOUT : On récupère l'info de l'agence
        select: { name: true },
      },
    },
  });

  // 2. On récupère la liste pour le formulaire d'édition
  const agencies = await getAgencies();

  const isProduction = process.env.NODE_ENV === "production";
  const domain = isProduction ? "barth-platform.vercel.app" : "localhost:3000";
  const protocol = isProduction ? "https" : "http";

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">
            Gestion des Sites Agents
          </h1>
          <p className="text-gray-400 text-sm">
            Pilotez la conformité et la performance de votre réseau.
          </p>
        </div>

        <div className="text-right">
          <span className="text-4xl font-light text-barth-gold">
            {agents.length}
          </span>
          <span className="text-gray-500 text-sm ml-2">Agents actifs</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <AgentViews
          initialAgents={agents}
          availableAgencies={agencies}
          domain={domain}
          protocol={protocol}
        />
      </div>
    </div>
  );
}
