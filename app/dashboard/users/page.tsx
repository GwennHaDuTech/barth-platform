import prisma from "@/lib/prisma";
import { getAgencies } from "@/app/actions";
import AgentViews from "./AgentViews";

export const dynamic = "force-dynamic";

export default async function UsersManagementPage() {
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listings: true,
      agency: {
        select: { name: true },
      },
    },
  });

  const agencies = await getAgencies();

  const isProduction = process.env.NODE_ENV === "production";
  const domain = isProduction ? "barth-platform.vercel.app" : "localhost:3000";
  const protocol = isProduction ? "https" : "http";

  return (
    <div className="flex flex-col gap-6 p-6">
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
          <span className="text-4xl font-light text-white">
            {agents.length}
          </span>
          <span className="text-gray-300 text-sm ml-2">
            sites agents actifs
          </span>
        </div>
      </div>

      <div>
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
