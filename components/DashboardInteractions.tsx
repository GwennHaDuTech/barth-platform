"use client";

import { useState } from "react";
import GlassCard from "./ui/GlassCard";
import CreateAgentForm from "@/app/dashboard/CreateagentForm/CreateAgentForm"; // Ajuste le chemin si besoin

export default function DashboardInteractions() {
  const [showAgentForm, setShowAgentForm] = useState(false);

  return (
    <>
      {/* LA CARTE AVEC LES BOUTONS */}
      <GlassCard className="flex flex-col md:flex-row items-center justify-between gap-8 !py-8">
        <h1 className="text-3xl font-light text-center md:text-left">
          Créer un site pour :
        </h1>

        <div className="flex gap-4 w-full md:w-auto">
          {/* Bouton Agent : Ouvre la modale au clic */}
          <button
            onClick={() => setShowAgentForm(true)}
            className="flex-1 md:flex-none px-8 py-4 rounded-2xl bg-gradient-to-br from-barth-gold/80 to-barth-gold/40 text-barth-dark font-bold shadow-[0_0_20px_rgba(212,175,55,0.2)] transition hover:scale-[1.02] active:scale-95"
          >
            un agent
          </button>

          <button className="flex-1 md:flex-none px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition cursor-not-allowed">
            une agence
          </button>
        </div>
      </GlassCard>

      {/* LA MODALE (POPUP) */}
      {showAgentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Fond noir flouté derrière */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAgentForm(false)}
          ></div>

          {/* Le Formulaire (par dessus) */}
          <div className="relative z-10 w-full max-w-2xl animate-in fade-in zoom-in duration-300">
            <CreateAgentForm onClose={() => setShowAgentForm(false)} />
          </div>
        </div>
      )}
    </>
  );
}
