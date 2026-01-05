"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { deleteAgent } from "@/app/actions";
import {
  Loader2,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Edit,
} from "lucide-react";
import { toast } from "sonner";

// 1. Interface correspondant EXACTEMENT à ton Prisma Schema actuel
interface Agent {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  photo: string;
  slug: string; // C'est lui la clé pour le lien !
  city: string;
  createdAt: Date;
}

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
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (agent: Agent) => setSelectedAgent(agent);

  const confirmDelete = async () => {
    if (!selectedAgent) return;
    setIsDeleting(true);
    try {
      await deleteAgent(selectedAgent.id);
      setSelectedAgent(null);
      toast.success("Site supprimé", {
        description: `Le site de ${selectedAgent.firstname} a été retiré.`,
        icon: <Trash2 className="text-red-500" size={18} />,
        style: { border: "1px solid rgba(239, 68, 68, 0.2)" },
      });
      // Optionnel : recharger la page pour rafraîchir la liste
      window.location.reload();
    } catch (error) {
      toast.error("Erreur", {
        description: "Impossible de supprimer l'agent.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <table className="w-full text-left text-sm text-gray-400">
        <thead className="text-xs uppercase border-b border-white/10 text-barth-gold">
          <tr>
            <th className="px-4 py-3 font-medium">Agent</th>
            <th className="px-4 py-3 font-medium">Ville</th>
            <th className="px-4 py-3 font-medium">Créé le</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {initialAgents.map((agent) => (
            <tr key={agent.id} className="hover:bg-white/5 transition group">
              {/* COLONNE AGENT (Photo + Noms) */}
              <td className="px-4 py-4 font-medium text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden relative border border-white/10 shrink-0">
                  {agent.photo ? (
                    <Image
                      src={agent.photo}
                      alt={agent.lastname}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-barth-gold/20 flex items-center justify-center text-barth-gold font-bold">
                      {agent.firstname[0]}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span>
                    {agent.firstname} {agent.lastname}
                  </span>
                  <span className="text-xs text-gray-500 font-normal">
                    {agent.email}
                  </span>
                </div>
              </td>

              {/* COLONNE VILLE */}
              <td className="px-4 py-4 text-gray-300">{agent.city}</td>

              {/* COLONNE DATE */}
              <td className="px-4 py-4 text-gray-500">
                {formatDate(agent.createdAt)}
              </td>

              {/* COLONNE ACTIONS */}
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {/* --- LE LIEN MAGIQUE VERS LA PAGE PUBLIQUE --- */}
                  <Link
                    href={`/agent/${agent.slug}`}
                    target="_blank"
                    className="p-2 rounded-full hover:bg-barth-gold/20 text-barth-gold transition"
                    title="Voir le site en ligne"
                  >
                    <ExternalLink size={16} />
                  </Link>

                  <button className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition">
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => handleDeleteClick(agent)}
                    className="p-2 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- POPUP DE CONFIRMATION (Tu l'avais déjà, je l'ai gardé) --- */}
      {selectedAgent && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
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
                  {selectedAgent.firstname} {selectedAgent.lastname}
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
