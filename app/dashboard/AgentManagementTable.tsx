"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpDown,
  ExternalLink,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import CreateAgentForm from "../dashboard/CreateagentForm/CreateAgentForm";

// Définition de l'agence pour le typage
interface AgencyOption {
  id: string;
  name: string;
}

// ✅ INTERFACE
interface Agent {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  photo: string | null;
  slug: string;

  // Champs Localisation
  city: string | null;
  zipCode: string | null;
  cityPhoto: string | null;
  secondarySector: string | null;

  // Champs Sociaux & Bio
  phone: string | null;
  instagram: string | null;
  linkedin: string | null;
  tiktok: string | null;
  bio: string | null;

  // ✅ AJOUT
  agencyId: string | null;

  // Listings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listings: any[];

  createdAt: Date;
}

interface Props {
  initialAgents: Agent[];
  domain: string;
  protocol: string;
  // ✅ AJOUT : La liste des agences reçue du parent
  availableAgencies: AgencyOption[];
}

// --- LOGIQUE DE CONFORMITÉ ---
const checkConformity = (agent: Agent) => {
  const missingFields = [];

  // ✅ Règle Agence
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

export default function AgentManagementTable({
  initialAgents,
  availableAgencies,
}: Props) {
  const [agents, setAgents] = useState(initialAgents);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const handleSort = (key: string) => {
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
      if (key === "status") {
        const statusA = checkConformity(a).isCompliant ? 1 : 0;
        const statusB = checkConformity(b).isCompliant ? 1 : 0;
        return direction === "asc" ? statusA - statusB : statusB - statusA;
      }

      if (key === "visits") {
        return 0;
      }

      const valA = a[key] || "";
      const valB = b[key] || "";

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setAgents(sortedAgents);
    setSortConfig({ key, direction });
  };

  const handleEditClick = (agent: Agent) => {
    setEditingAgent(agent);
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar relative">
      {/* MODALE D'ÉDITION */}
      {editingAgent && (
        <div className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 z-50">
          <CreateAgentForm
            onClose={() => setEditingAgent(null)}
            agentToEdit={editingAgent}
            // ✅ AJOUT : On transmet la liste au formulaire
            availableAgencies={availableAgencies}
          />
        </div>
      )}

      <table className="w-full text-left text-sm text-gray-400">
        <thead className="text-xs uppercase border-b border-white/10 text-barth-gold sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-10">
          <tr>
            <th
              className="px-6 py-4 font-medium cursor-pointer hover:text-white transition"
              onClick={() => handleSort("lastname")}
            >
              <div className="flex items-center gap-2">
                Agent <ArrowUpDown size={12} />
              </div>
            </th>
            <th
              className="px-6 py-4 font-medium cursor-pointer hover:text-white transition"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center gap-2">
                État de Santé <ArrowUpDown size={12} />
              </div>
            </th>
            <th
              className="px-6 py-4 font-medium cursor-pointer hover:text-white transition"
              onClick={() => handleSort("city")}
            >
              <div className="flex items-center gap-2">
                Localisation <ArrowUpDown size={12} />
              </div>
            </th>
            <th
              className="px-6 py-4 font-medium text-center cursor-pointer hover:text-white transition"
              onClick={() => handleSort("visits")}
            >
              <div className="flex items-center justify-center gap-2">
                Visites <ArrowUpDown size={12} />
              </div>
            </th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {agents.map((agent) => {
            const { isCompliant, missingFields } = checkConformity(agent);

            return (
              <tr key={agent.id} className="hover:bg-white/5 transition group">
                {/* 1. AGENT */}
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
                    <div>
                      <div className="text-white font-medium">
                        {agent.firstname} {agent.lastname}
                      </div>
                      <Link
                        href={`/agent/${agent.slug}`}
                        target="_blank"
                        className="text-xs text-barth-gold/70 hover:text-barth-gold flex items-center gap-1"
                      >
                        {agent.slug}.barth.com <ExternalLink size={10} />
                      </Link>
                    </div>
                  </div>
                </td>

                {/* 2. STATUT */}
                <td className="px-6 py-4">
                  <div className="relative group/tooltip inline-block">
                    <button
                      onClick={() => !isCompliant && handleEditClick(agent)}
                      disabled={isCompliant}
                      className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                            ${
                              isCompliant
                                ? "bg-green-500/10 border-green-500/20 text-green-400 cursor-default"
                                : "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse-slow hover:bg-red-500/20 cursor-pointer"
                            }
                          `}
                    >
                      {isCompliant ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                      {isCompliant ? "Conforme" : "Action requise"}
                    </button>

                    {!isCompliant && (
                      <div className="absolute left-0 bottom-full mb-2 w-48 p-3 bg-black border border-white/10 rounded-xl shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className="text-xs font-bold text-white mb-1">
                          Manquant :
                        </div>
                        <ul className="list-disc list-inside text-xs text-gray-400">
                          {missingFields.map((field, i) => (
                            <li key={i}>{field}</li>
                          ))}
                        </ul>
                        <div className="mt-2 text-[10px] text-barth-gold italic">
                          Cliquez pour corriger
                        </div>
                      </div>
                    )}
                  </div>
                </td>

                {/* 3. LOCALISATION */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-gray-300 flex items-center gap-1.5">
                      <MapPin size={14} className="text-gray-600" />{" "}
                      {agent.city || "Ville non renseignée"}
                    </span>
                    <span className="text-xs text-gray-600 pl-5">
                      {agent.zipCode || "Code postal manquant"}
                    </span>
                  </div>
                </td>

                {/* 4. VISITES */}
                <td className="px-6 py-4 text-center">
                  <span className="font-mono text-white/80">
                    {(agent.lastname.length + agent.firstname.length) * 123}
                  </span>
                  <span className="text-xs text-gray-600 ml-1">vues</span>
                </td>

                {/* 5. ACTIONS */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(agent)}
                      className="p-2 rounded-lg bg-barth-gold text-barth-dark hover:bg-white hover:text-black transition font-medium text-xs flex items-center gap-2 shadow-lg shadow-barth-gold/10"
                    >
                      <Edit size={14} />
                      {isCompliant ? "Éditer" : "Compléter"}
                    </button>

                    <button className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
