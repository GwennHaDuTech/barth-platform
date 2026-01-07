"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  ArrowUpDown,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  MoreVertical,
  LayoutGrid, // ✅ Pour l'icône Grille
  List, // ✅ Pour l'icône Liste
  MapPin,
  ExternalLink,
  Loader2,
} from "lucide-react";
import CreateAgentForm from "../CreateAgentForm/CreateAgentForm";
import { deleteAgent } from "@/app/actions";
import { toast } from "sonner";

// ... (Interfaces AgencyOption, Agent, Props inchangées) ...
interface AgencyOption {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  photo: string | null;
  slug: string;
  city: string | null;
  zipCode: string | null;
  cityPhoto: string | null;
  secondarySector: string | null;
  phone: string | null;
  instagram: string | null;
  linkedin: string | null;
  tiktok: string | null;
  bio: string | null;
  agencyId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listings: any[];
  agency?: { name: string } | null;
  createdAt: Date;
}

interface Props {
  initialAgents: Agent[];
  domain: string;
  protocol: string;
  availableAgencies: AgencyOption[];
}

const checkConformity = (agent: Agent) => {
  const missingFields = [];
  if (!agent.agencyId) missingFields.push("Agence de rattachement");
  if (!agent.photo) missingFields.push("Photo de profil");
  if (!agent.zipCode) missingFields.push("Code Postal");
  if (!agent.city) missingFields.push("Ville");
  if (!agent.cityPhoto) missingFields.push("Photo de couverture");
  if (!agent.listings || agent.listings.length === 0)
    missingFields.push("Annonces (Listings)");

  return {
    isCompliant: missingFields.length === 0,
    missingFields,
  };
};

export default function AgentViews({
  initialAgents,
  availableAgencies,
}: Props) {
  const [agents, setAgents] = useState(initialAgents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // ✅ NOUVEAU STATE : Mode d'affichage (Liste par défaut)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // --- LOGIQUE SUPPRESSION ---
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // ... (Garde tes fonctions handleDeleteClick, confirmDelete inchangées) ...
  const handleDeleteClick = (agent: Agent) => {
    setAgentToDelete(agent);
    setDeleteConfirmationInput("");
  };

  const confirmDelete = async () => {
    if (!agentToDelete) return;
    if (
      deleteConfirmationInput.toLowerCase() !==
      `supprimer le site de ${agentToDelete.lastname.toLowerCase()}`
    ) {
      toast.error(`La phrase de confirmation est incorrecte.`);
      return;
    }
    setIsDeleting(true);
    try {
      const res = await deleteAgent(agentToDelete.id);
      if (res.success) {
        toast.success("Site supprimé avec succès.");
        setAgentToDelete(null);
        setAgents((prev) => prev.filter((a) => a.id !== agentToDelete.id));
      } else {
        toast.error("Erreur lors de la suppression.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur technique.");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- TRI ---
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (key: string) => {
    // ... (Garde ta fonction handleSort inchangée) ...
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortedAgents = [...agents].sort((a: any, b: any) => {
      const valA = a[key] || "";
      const valB = b[key] || "";
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setAgents(sortedAgents);
    setSortConfig({ key, direction });
  };

  const handleCreateClick = () => {
    setEditingAgent(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (agent: Agent) => {
    setEditingAgent(agent);
    setIsModalOpen(true);
  };

  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);

  return (
    <div className="w-full flex flex-col gap-6 relative">
      {/* MODALES (Creation / Suppression) - Garde ton code existant ici */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <CreateAgentForm
            onClose={() => setIsModalOpen(false)}
            agentToEdit={editingAgent}
            availableAgencies={availableAgencies}
          />
        </div>
      )}

      {agentToDelete && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          {/* ... Ton code de popup suppression ... */}
          <div className="bg-[#1a1a1a] border border-red-500/30 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">
              Supprimer le site ?
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Cette action est irréversible. Pour confirmer, tapez la phrase
              ci-dessous :
            </p>
            <p className="text-red-400 font-mono text-sm bg-red-500/10 p-2 rounded mb-4 select-all">
              supprimer le site de {agentToDelete.lastname.toLowerCase()}
            </p>
            <input
              className="w-full bg-black border border-white/20 rounded-lg p-3 text-white mb-4 focus:border-red-500 outline-none"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              placeholder="Recopiez la phrase ici..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAgentToDelete(null)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="animate-spin" size={16} />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARRE D'OUTILS */}
      <div className="flex justify-between items-center">
        {/* GAUCHE : Toggle Vue Liste / Grille */}
        <div className="bg-[#0f0f0f] p-1 rounded-xl border border-white/10 flex gap-1">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "list"
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
            title="Vue Liste"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-white/10 text-white shadow-sm"
                : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
            title="Vue Grille"
          >
            <LayoutGrid size={18} />
          </button>
        </div>

        {/* DROITE : Bouton Créer */}
        <button
          onClick={handleCreateClick}
          className="bg-transparent text-white border border-transparent hover:border-white px-4 py-2 rounded-xl font-medium transition flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Nouvel Agent</span>
        </button>
      </div>

      {/* --- VUE LISTE (TABLEAU) --- */}
      {viewMode === "list" && (
        <div className="w-full bg-[#0f0f0f] border border-white/10 rounded-2xl">
          {/* ... Ton code de tableau existant EXACTEMENT comme avant ... */}
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase border-b border-white/10 text-barth-gold bg-[#0f0f0f]">
              <tr>
                <th
                  className="px-6 py-4 font-medium cursor-pointer"
                  onClick={() => handleSort("lastname")}
                >
                  Agent <ArrowUpDown size={12} className="inline ml-1" />
                </th>
                <th className="px-6 py-4 font-medium">Agence rattachée</th>
                <th className="px-6 py-4 font-medium text-center">Visiteurs</th>
                <th className="px-6 py-4 font-medium text-center">
                  Site à jour
                </th>
                <th className="px-6 py-4 font-medium">Date de création</th>
                <th className="px-6 py-4 font-medium text-right">Réglage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {agents.map((agent) => {
                const { isCompliant } = checkConformity(agent);
                const statusLabel = isCompliant
                  ? "Site à jour"
                  : "Site à modifier";
                const statusColor = isCompliant
                  ? "text-green-400 bg-green-500/10 border-green-500/20"
                  : "text-orange-400 bg-orange-500/10 border-orange-500/20";
                const StatusIcon = isCompliant ? CheckCircle2 : AlertCircle;

                return (
                  <tr
                    key={agent.id}
                    className="hover:bg-white/5 transition group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 relative">
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
                        <div className="text-white font-medium">
                          {agent.firstname} {agent.lastname}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <Building2 size={14} className="text-gray-500" />
                      <span>
                        {agent.agency ? agent.agency.name : "Non rattaché"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-white/80">0</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${statusColor}`}
                      >
                        <StatusIcon size={12} /> {statusLabel}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(agent.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <div className="flex justify-end">
                        <button
                          onClick={() =>
                            setOpenSettingsId(
                              openSettingsId === agent.id ? null : agent.id
                            )
                          }
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                      {openSettingsId === agent.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenSettingsId(null)}
                          ></div>
                          <div className="absolute right-6 top-12 z-20 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <button
                              onClick={() => {
                                handleEditClick(agent);
                                setOpenSettingsId(null);
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                            >
                              <Edit size={14} /> Modifier le site
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteClick(agent);
                                setOpenSettingsId(null);
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5"
                            >
                              <Trash2 size={14} /> Supprimer le site
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- VUE GRILLE (CARTES) --- */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map((agent) => {
            const { isCompliant } = checkConformity(agent);
            // Background un peu sombre style "Glass"
            return (
              <div
                key={agent.id}
                className="group relative bg-[#121212] border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col"
              >
                {/* PHOTO (Hauteur fixe, object-cover) */}
                <div className="relative h-48 w-full bg-white/5">
                  {agent.photo ? (
                    <Image
                      src={agent.photo}
                      alt={agent.lastname}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-barth-gold font-bold text-4xl">
                      {agent.firstname[0]}
                    </div>
                  )}

                  {/* Menu 3 points en haut à droite */}
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      onClick={() =>
                        setOpenSettingsId(
                          openSettingsId === agent.id ? null : agent.id
                        )
                      }
                      className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:text-white hover:bg-black/60 transition"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openSettingsId === agent.id && (
                      <>
                        <div
                          className="fixed inset-0 z-0"
                          onClick={() => setOpenSettingsId(null)}
                        ></div>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                          <button
                            onClick={() => handleDeleteClick(agent)}
                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* CONTENU TEXTE */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Nom */}
                  <h3 className="text-xl font-bold text-white mb-1">
                    {agent.firstname} {agent.lastname}
                  </h3>

                  {/* Agence */}
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isCompliant ? "bg-green-500" : "bg-orange-500"
                      }`}
                    ></div>
                    <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                      {agent.agency ? agent.agency.name : "Sans Agence"}
                    </span>
                  </div>

                  {/* Infos Localisation */}
                  <div className="flex items-center gap-2 text-sm text-gray-300 mb-6">
                    <MapPin size={16} className="text-barth-gold shrink-0" />
                    <span>{agent.city || "Ville non renseignée"}</span>
                  </div>

                  {/* BOUTONS D'ACTION (Footer) */}
                  <div className="mt-auto flex gap-3">
                    <button
                      onClick={() => handleEditClick(agent)}
                      className="p-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition"
                    >
                      <Edit size={18} />
                    </button>
                    <Link
                      href={`/agent/${agent.slug}`} // Supposons que tu aies cette route
                      className="flex-1 border border-white/20 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-medium hover:bg-white hover:text-black transition group/btn"
                    >
                      VOIR LE SITE
                      <ExternalLink
                        size={14}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
