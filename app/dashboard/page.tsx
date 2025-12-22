import prisma from "@/lib/prisma";
import { createAgent, deleteAgent } from "../actions";
import Link from "next/link";
import styles from "./dashboard.module.css"; // Import du CSS*
import { UserButton } from "@clerk/nextjs";

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
          <div className={styles.panel}>
            <h2 className={styles.subtitle}>Ajouter un Agent</h2>

            <form action={createAgent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Prénom Nom</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Ex: Paul Durand"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Sous-domaine (URL)</label>
                <input
                  name="subdomain"
                  type="text"
                  required
                  placeholder="paul"
                  className={styles.input}
                />
                <p className={styles.hint}>
                  Sera accessible sur paul.localhost:3000
                </p>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Ville</label>
                  <input
                    name="city"
                    type="text"
                    required
                    placeholder="Nantes"
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Téléphone</label>
                  <input
                    name="phone"
                    type="text"
                    required
                    placeholder="06..."
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Bio</label>
                <textarea
                  name="bio"
                  rows={3}
                  placeholder="Description..."
                  className={styles.textarea}
                ></textarea>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>URL Photo (Optionnel)</label>
                <input
                  name="photo"
                  type="text"
                  placeholder="https://..."
                  className={styles.input}
                />
              </div>

              <button type="submit" className={styles.submitButton}>
                Créer le site agent
              </button>
            </form>
          </div>

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
                      href={`http://${agent.subdomain}.localhost:3000`}
                      target="_blank"
                      className={styles.agentLink}
                    >
                      {agent.subdomain}.localhost:3000 ↗
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
