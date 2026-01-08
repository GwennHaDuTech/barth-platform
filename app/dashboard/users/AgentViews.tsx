"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  LayoutGrid,
  List,
  MapPin,
  ExternalLink,
  Loader2,
  Activity,
} from "lucide-react";
import CreateAgentForm from "../CreateAgentForm/CreateAgentForm";
import { deleteAgent } from "@/app/actions";
import { toast } from "sonner";

// --- INTERFACES ---

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

interface RawAnalyticsData {
  date: string;
  agentId: string;
  agencyId: string;
  visits: number;
}

interface PeriodStats {
  "24h": number;
  "7 jours": number;
  "30 jours": number;
  Tout: number;
}

interface Props {
  initialAgents: Agent[];
  domain: string;
  protocol: string;
  availableAgencies: AgencyOption[];
}

// --- UTILITAIRES ---

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

// --- COMPOSANT LiveCounter CORRIGÉ ---
const LiveCounter = ({ value }: { value: number }) => {
  const [highlight, setHighlight] = useState(false);
  // On utilise useRef pour stocker la valeur précédente sans déclencher de rendu
  const prevRef = useRef(value);

  useEffect(() => {
    // Si la valeur augmente par rapport à ce qu'on a en mémoire
    if (value > prevRef.current) {
      // ✅ CORRECTION : On utilise setTimeout pour différer le setState
      // Cela sort la mise à jour du cycle synchrone et corrige l'erreur ESLint
      const startTimer = setTimeout(() => {
        setHighlight(true);
      }, 10);

      // On éteint l'effet après 1 seconde
      const endTimer = setTimeout(() => {
        setHighlight(false);
      }, 1000);

      prevRef.current = value;

      // Nettoyage des timers si le composant est démonté
      return () => {
        clearTimeout(startTimer);
        clearTimeout(endTimer);
      };
    }

    // Si pas de changement ou baisse, on met juste à jour la ref
    prevRef.current = value;
  }, [value]);

  return (
    <div
      className={`font-bold px-3 py-1 rounded-md text-sm transition-all duration-500 flex items-center justify-center gap-2 ${
        highlight
          ? "bg-green-500/20 text-green-400 scale-105 border border-green-500/30"
          : "bg-white/5 text-barth-gold scale-100 border border-transparent"
      }`}
    >
      <Activity
        size={14}
        className={`transition-all duration-500 ${
          highlight ? "opacity-100 w-4" : "opacity-0 w-0"
        }`}
      />
      {value.toLocaleString()}
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---

export default function AgentViews({
  initialAgents,
  availableAgencies,
}: Props) {
  const [agents, setAgents] = useState(initialAgents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [period, setPeriod] = useState("7 jours");
  const periods = ["24h", "7 jours", "30 jours", "Tout"];

  const [agentVisits, setAgentVisits] = useState<Record<string, PeriodStats>>(
    {}
  );

  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // --- 1. RECUPERATION DES STATS ---
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        const { raw }: { raw: RawAnalyticsData[] } = await res.json();
        if (!isMounted) return;

        const now = new Date();
        const getLimit = (days: number) =>
          new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const visitsMap: Record<string, PeriodStats> = {};

        agents.forEach((agent) => {
          const entries = raw.filter((s) => s.agentId === agent.id);
          visitsMap[agent.id] = {
            "24h": entries
              .filter((s) => new Date(s.date) >= getLimit(1))
              .reduce((acc, curr) => acc + curr.visits, 0),
            "7 jours": entries
              .filter((s) => new Date(s.date) >= getLimit(7))
              .reduce((acc, curr) => acc + curr.visits, 0),
            "30 jours": entries
              .filter((s) => new Date(s.date) >= getLimit(30))
              .reduce((acc, curr) => acc + curr.visits, 0),
            Tout: entries.reduce((acc, curr) => acc + curr.visits, 0),
          };
        });
        setAgentVisits(visitsMap);
      } catch (e) {
        console.error("Erreur stats", e);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [agents]);

  // --- 2. TRI AUTOMATIQUE ---
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const sortedAgents = useMemo(() => {
    const list = [...agents];
    if (sortConfig) {
      return list.sort((a, b) => {
        const key = sortConfig.key as keyof Agent;
        const valA = (a[key] ?? "").toString().toLowerCase();
        const valB = (b[key] ?? "").toString().toLowerCase();
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list.sort((a, b) => {
      const visitsA = agentVisits[a.id]?.[period as keyof PeriodStats] || 0;
      const visitsB = agentVisits[b.id]?.[period as keyof PeriodStats] || 0;
      return visitsB - visitsA;
    });
  }, [agents, sortConfig, agentVisits, period]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

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

  const handleCreateClick = () => {
    setEditingAgent(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (agent: Agent) => {
    setEditingAgent(agent);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full flex flex-col gap-6 relative">
      {/* MODALES */}
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
          <div className="bg-[#1a1a1a] border border-red-500/30 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">
              Supprimer le site ?
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Tapez la phrase de confirmation ci-dessous :
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

      {/* BARRE D'OUTILS AMÉLIORÉE */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Vue */}
          <div className="bg-[#0f0f0f] p-1.5 rounded-xl border border-white/10 flex gap-1 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`p-3 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-gray-500 hover:text-white"
              }`}
              title="Vue Liste"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-gray-500 hover:text-white"
              }`}
              title="Vue Grille"
            >
              <LayoutGrid size={20} />
            </button>
          </div>

          {/* Période */}
          <div className="bg-[#0f0f0f] p-1.5 rounded-xl border border-white/10 flex gap-1 shadow-sm">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === p
                    ? "bg-barth-gold text-white shadow-sm"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreateClick}
          className="bg-transparent text-white border border-transparent hover:border-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Nouvel Agent</span>
        </button>
      </div>

      {/* --- VUE LISTE (TABLEAU AGRANDI) --- */}
      {viewMode === "list" && (
        <div className="w-full bg-[#0f0f0f] border border-white/10 rounded-2xl">
          <table className="w-full text-left text-gray-400">
            <thead className="text-xs uppercase border-b border-white/10 text-barth-gold bg-[#0f0f0f]">
              <tr>
                <th
                  className="px-6 py-5 font-bold tracking-wider cursor-pointer"
                  onClick={() => handleSort("lastname")}
                >
                  Agent <ArrowUpDown size={14} className="inline ml-1" />
                </th>
                <th className="px-6 py-5 font-bold tracking-wider">
                  Agence rattachée
                </th>
                <th className="px-6 py-5 font-bold tracking-wider text-center">
                  Visiteurs ({period})
                </th>
                <th className="px-6 py-5 font-bold tracking-wider text-center">
                  Site à jour
                </th>
                <th className="px-6 py-5 font-bold tracking-wider">
                  Date de création
                </th>
                <th className="px-6 py-5 font-bold tracking-wider text-right">
                  Réglage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedAgents.map((agent) => {
                const { isCompliant } = checkConformity(agent);
                const visits =
                  agentVisits[agent.id]?.[period as keyof PeriodStats] || 0;
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
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden border border-white/10 relative shrink-0">
                          {agent.photo ? (
                            <Image
                              src={agent.photo}
                              alt={agent.lastname}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-barth-gold/20 flex items-center justify-center text-barth-gold font-bold text-xl">
                              {agent.firstname[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="text-white font-bold text-base">
                            {agent.firstname} {agent.lastname}
                          </div>
                          <div className="text-gray-500 text-sm">
                            {agent.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Building2 size={16} className="text-gray-500" />
                        <span>
                          {agent.agency ? agent.agency.name : "Non rattaché"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex justify-center">
                        <LiveCounter value={visits} />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium ${statusColor}`}
                      >
                        <StatusIcon size={14} /> {statusLabel}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-sm">
                      {new Date(agent.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-6 text-right relative">
                      <div className="flex justify-end">
                        <button
                          onClick={() =>
                            setOpenSettingsId(
                              openSettingsId === agent.id ? null : agent.id
                            )
                          }
                          className="p-3 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition"
                        >
                          <MoreVertical size={20} />
                        </button>
                      </div>
                      {openSettingsId === agent.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenSettingsId(null)}
                          ></div>
                          <div className="absolute right-6 top-16 z-20 w-52 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <button
                              onClick={() => {
                                handleEditClick(agent);
                                setOpenSettingsId(null);
                              }}
                              className="w-full text-left px-4 py-3.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3"
                            >
                              <Edit size={16} /> Modifier le site
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteClick(agent);
                                setOpenSettingsId(null);
                              }}
                              className="w-full text-left px-4 py-3.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 border-t border-white/5"
                            >
                              <Trash2 size={16} /> Supprimer le site
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
          {sortedAgents.map((agent) => {
            const { isCompliant } = checkConformity(agent);
            const visits =
              agentVisits[agent.id]?.[period as keyof PeriodStats] || 0;

            return (
              <div
                key={agent.id}
                className="group relative bg-[#121212] border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col"
              >
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

                  <div className="absolute top-3 left-3 z-10 bg-black/40 backdrop-blur-md border border-white/10 px-1 py-1 rounded-lg">
                    <LiveCounter value={visits} />
                  </div>

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

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {agent.firstname} {agent.lastname}
                  </h3>

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

                  <div className="flex items-center gap-2 text-sm text-gray-300 mb-6">
                    <MapPin size={16} className="text-barth-gold shrink-0" />
                    <span>{agent.city || "Ville non renseignée"}</span>
                  </div>

                  <div className="mt-auto flex gap-3">
                    <button
                      onClick={() => handleEditClick(agent)}
                      className="p-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition"
                    >
                      <Edit size={18} />
                    </button>
                    <Link
                      href={`/agent/${agent.slug}`}
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
