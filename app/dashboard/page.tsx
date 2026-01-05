import React from "react";
import prisma from "@/lib/prisma";
import GlassCard from "@/components/ui/GlassCard";
import DashboardInteractions from "@/components/DashboardInteractions";
import AgentListTable from "./AgentListTable";
import styles from "./dashboard.module.css";
// ✅ IMPORT AJOUTÉ
import RightSidebar from "@/components/RightSideBar";

export default async function DashboardPage() {
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
  });

  const isProduction = process.env.NODE_ENV === "production";
  const domain = isProduction ? "barth-platform.vercel.app" : "localhost:3000";
  const protocol = isProduction ? "https" : "http";

  return (
    // ✅ WRAPPER RELATIF : Permet de positionner la sidebar par rapport à cette page uniquement
    <div className="relative min-h-full">
      {/* 1. CONTENEUR PRINCIPAL (CSS Grid + Padding Droite géré par styles.mainContainer) */}
      <div className={styles.mainContainer}>
        {/* SECTION HAUT : INTERACTIONS */}
        <div className={styles.headerSection}>
          <DashboardInteractions />
        </div>

        {/* SECTION MILIEU : GRILLE (Liste + Agences) */}
        <div className={styles.gridSection}>
          <GlassCard className="flex flex-col overflow-hidden h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-light">Liste des sites crées</h2>
              <div className="text-sm px-4 py-2 rounded-full border border-barth-gold/30 text-barth-gold bg-barth-gold/10 cursor-pointer hover:bg-barth-gold/20 transition">
                trier par : Le plus de visite... ▼
              </div>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {agents.length === 0 ? (
                <div className="h-full flex items-center justify-center italic opacity-30 text-white">
                  Aucun site pour le moment.
                </div>
              ) : (
                <AgentListTable
                  initialAgents={agents}
                  domain={domain}
                  protocol={protocol}
                  isProduction={isProduction}
                />
              )}
            </div>
          </GlassCard>

          {/* COLONNE 2 : Agence Physique */}
          <GlassCard className="flex items-center justify-center opacity-50 text-gray-500 font-light text-xl border-dashed h-full">
            site agence physique
          </GlassCard>

          {/* COLONNE 3 : Agence En Ligne */}
          <GlassCard className="flex items-center justify-center opacity-50 text-gray-500 font-light text-xl border-dashed h-full">
            site agence en ligne
          </GlassCard>
        </div>

        {/* SECTION BAS : GRAPHIQUE */}
        <div className={styles.statsSection}>
          <GlassCard className="h-full flex flex-col p-6">
            <h2 className="text-xl font-light mb-4">Nombre de visite depuis</h2>
            <div className="flex-1 flex items-center justify-center text-gray-500 border border-white/5 rounded-2xl bg-white/5">
              Graphique en cours de construction...
            </div>
          </GlassCard>
        </div>
      </div>

      {/* 2. RIGHT SIDEBAR : Positionnée en absolu à droite */}
      {/* Elle remplit l'espace vide créé par le padding-right du CSS */}
      <div className="absolute top-0 right-0 h-full z-20 pointer-events-none">
        <RightSidebar />
      </div>
    </div>
  );
}
