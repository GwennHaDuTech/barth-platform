import prisma from "@/lib/prisma";
import { createAgent, deleteAgent } from "../actions";
import Link from "next/link";
import styles from "./dashboard.module.css"; // Import du CSS*
import { UserButton } from "@clerk/nextjs";
import CreateAgentForm from "./CreateAgentForm"; // <--- IMPORT DU NOUVEAU FORMULAIRE
const isProduction = process.env.NODE_ENV === "production";
const domain = isProduction ? "barth-platform.vercel.app" : "localhost:3000";
const protocol = isProduction ? "https" : "http";

export default async function DashboardPage() {
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Admin Dashboard</h1>
            <Link href="/" className={styles.backLink}>
              ← Retour Accueil
            </Link>
          </div>

          {/* Le bouton profil avec déconnexion */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 mr-2">Admin Connecté</span>
            <UserButton />
          </div>
        </div>

        <div className={styles.grid}>
          {/* COLONNE GAUCHE : Formulaire */}
          <CreateAgentForm />

          {/* COLONNE DROITE : Liste */}
          <div className={styles.panel}>
            <h2 className={styles.subtitle}>
              Sites en ligne ({agents.length})
            </h2>
            <div className={styles.agentList}>
              {agents.map((agent) => (
                <div key={agent.id} className={styles.agentItem}>
                  <div>
                    <span className={styles.agentName}>{agent.name}</span>
                    <a
                      href={`${protocol}://${agent.subdomain}.${domain}`}
                      target="_blank"
                      className="text-sm text-blue-500 hover:underline block"
                    >
                      {agent.subdomain}.{domain} ↗
                    </a>
                  </div>

                  <form action={deleteAgent}>
                    <input type="hidden" name="agentId" value={agent.id} />
                    <button type="submit" className={styles.deleteButton}>
                      Supprimer
                    </button>
                  </form>
                </div>
              ))}

              {agents.length === 0 && (
                <div className={styles.emptyState}>
                  Aucun agent pour le moment.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
