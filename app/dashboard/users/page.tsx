// app/dashboard/users/page.tsx
import prisma from "@/lib/prisma";
import GlassCard from "@/components/ui/GlassCard";
import AgentManagementTable from "../AgentManagementTable";
import { getAgencies } from "@/app/actions"; // <--- 1. IMPORT NOUVEAU

export default async function UsersManagementPage() {
  // On récupère les agents AVEC leurs listings pour vérifier la conformité
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listings: true, // Crucial pour savoir si l'agent a des annonces
    },
  });

  // <--- 2. RÉCUPÉRATION DES AGENCES (NOUVEAU)
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

        {/* Petit compteur global */}
        <div className="text-right">
          <span className="text-4xl font-light text-barth-gold">
            {agents.length}
          </span>
          <span className="text-gray-500 text-sm ml-2">Agents actifs</span>
        </div>
      </div>

      <GlassCard className="flex-1 flex flex-col overflow-hidden">
        <AgentManagementTable
          initialAgents={agents}
          domain={domain}
          protocol={protocol}
          availableAgencies={agencies} // <--- 3. PASSAGE DE LA PROP AU TABLEAU
        />
      </GlassCard>
    </div>
  );
}
