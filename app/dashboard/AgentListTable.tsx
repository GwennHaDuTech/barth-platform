"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteAgent } from "@/app/actions";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

// 1. On définit ce qu'est un Agent pour TypeScript
interface Agent {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  // Ajoute d'autres champs si tu en as besoin ici
}

// 2. On met à jour l'interface des Props sans utiliser "any"
interface AgentListProps {
  initialAgents: Agent[];
  domain: string;
  protocol: string;
  isProduction: boolean;
}

export default function AgentListTable({
  initialAgents,
  domain,
  protocol,
  isProduction,
}: AgentListProps) {
  // 3. On précise que selectedAgent peut être un Agent ou null
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 4. On type l'argument ici aussi
  const handleDeleteClick = (agent: Agent) => setSelectedAgent(agent);

  const confirmDelete = async () => {
    if (!selectedAgent) return;
    setIsDeleting(true);
    try {
      await deleteAgent(selectedAgent.id);
      setSelectedAgent(null);
      toast.success("Site supprimé", {
        description: `Le site de ${selectedAgent.name} a été retiré.`,
        icon: <Trash2 className="text-red-500" size={18} />, // Icône personnalisée
        style: {
          border: "1px solid rgba(239, 68, 68, 0.2)", // Bordure rouge très fine pour la suppression
        },
      });
    } catch (error) {
      // 👇 NOTIFICATION D'ERREUR
      toast.error("Erreur", {
        description: "Impossible de supprimer l'agent pour le moment.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <table className="w-full text-left text-sm text-gray-400">
        <thead className="text-xs uppercase border-b border-white/10 text-barth-gold">
          <tr>
            <th className="px-4 py-3 font-medium">site agent</th>
            <th className="px-4 py-3 font-medium text-center">visites</th>
            <th className="px-4 py-3 font-medium text-right">actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {initialAgents.map((agent) => (
            <tr key={agent.id} className="hover:bg-white/5 transition">
              <td className="px-4 py-4 font-medium text-white flex flex-col">
                {agent.name}
                <Link
                  href={
                    isProduction
                      ? `/sites/${agent.subdomain}`
                      : `${protocol}://${agent.subdomain}.${domain}`
                  }
                  target="_blank"
                  className="text-xs text-barth-gold/80 hover:text-barth-gold truncate w-48"
                >
                  {agent.subdomain}.{domain} ↗
                </Link>
              </td>
              <td className="px-4 py-4 text-center font-bold text-white">0</td>
              <td className="px-4 py-4 text-right">
                <button
                  onClick={() => handleDeleteClick(agent)}
                  className="text-xs px-3 py-1 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- POPUP DE CONFIRMATION --- */}
      {selectedAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f0f0f] border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Supprimer le site ?
              </h3>
              <p className="text-gray-400 mb-8 font-light">
                Voulez-vous vraiment supprimer le site de{" "}
                <span className="text-white font-semibold">
                  {selectedAgent.name}
                </span>{" "}
                ? Cette action est irréversible.
              </p>
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setSelectedAgent(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-6 rounded-xl border border-white/10 text-white hover:bg-white/5 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-6 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    "Supprimer"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
