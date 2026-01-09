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
} from "lucide-react";
import CreateAgentForm from "../dashboard/CreateAgentForm/CreateAgentForm";

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
  // ✅ Correction 1 : On remplace any[] par unknown[] pour satisfaire le linter
  listings: unknown[];
  createdAt: Date;
}

interface Props {
  initialAgents: Agent[];
  domain?: string;
  protocol?: string;
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
    missingFields.push("Annonces");

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

    // ✅ Correction 2 : Typage strict des arguments de tri (plus de 'any')
    const sortedAgents = [...agents].sort((a: Agent, b: Agent) => {
      if (key === "status") {
        const statusA = checkConformity(a).isCompliant ? 1 : 0;
        const statusB = checkConformity(b).isCompliant ? 1 : 0;
        return direction === "asc" ? statusA - statusB : statusB - statusA;
      }
      if (key === "visits") return 0;

      // Accès sécurisé aux propriétés dynamiques
      const valA = a[key as keyof Agent] || "";
      const valB = b[key as keyof Agent] || "";

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setAgents(sortedAgents);
    setSortConfig({ key, direction });
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar relative">
      {editingAgent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <CreateAgentForm
            onClose={() => setEditingAgent(null)}
            agentToEdit={editingAgent}
            availableAgencies={availableAgencies}
          />
        </div>
      )}

      {/* TABLE-FIXED pour gérer strictement la largeur des colonnes */}
      <table className="w-full text-left text-gray-400 table-fixed">
        <thead className="text-[9px] lg:text-[9px] 2xl:text-xs uppercase border-b border-white/10 text-barth-gold sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-10">
          <tr>
            {/* 1. AGENT : 55% de la largeur */}
            <th
              className="px-2 py-2 w-[55%] font-medium cursor-pointer hover:text-white transition"
              onClick={() => handleSort("lastname")}
            >
              <div className="flex items-center gap-1">
                Agent <ArrowUpDown size={10} />
              </div>
            </th>
            {/* 2. STATUT : 25% */}
            <th
              className="px-1 py-2 w-[25%] font-medium cursor-pointer hover:text-white transition text-center"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center justify-center gap-1">
                État <ArrowUpDown size={10} />
              </div>
            </th>
            {/* 3. ACTIONS : 20% */}
            <th className="px-2 py-2 w-[20%] font-medium text-right">Action</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {agents.map((agent) => {
            const { isCompliant } = checkConformity(agent);
            return (
              <tr key={agent.id} className="hover:bg-white/5 transition group">
                {/* 1. AGENT CELL */}
                <td className="px-2 py-2 align-middle">
                  <div className="flex items-center gap-2 w-full max-w-full">
                    {/* AVATAR (Fixe) */}
                    {/* ✅ Correction CSS : shrink-0 au lieu de flex-shrink-0 */}
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 relative shrink-0 bg-barth-gold/10">
                      {agent.photo ? (
                        <Image
                          src={agent.photo}
                          alt="Av"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex items-center justify-center h-full text-[8px] text-barth-gold font-bold">
                          {agent.firstname[0]}
                        </span>
                      )}
                    </div>

                    {/* TEXTE (Flexible) */}
                    {/* min-w-0 est vital pour que le truncate fonctionne dans un flex */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-white font-medium text-[10px] 2xl:text-sm truncate w-full block leading-tight">
                        {agent.firstname} {agent.lastname}
                      </span>

                      {/* ✅ Correction CSS : Suppression de 'block' conflictuel, ExternalLink réutilisé */}
                      <Link
                        href={`/agent/${agent.slug}`}
                        target="_blank"
                        className="text-[9px] 2xl:text-xs text-barth-gold/70 hover:text-barth-gold flex items-center gap-1 truncate w-full mt-0.5"
                      >
                        <span className="truncate">{agent.slug}</span>
                        <ExternalLink size={8} className="shrink-0" />
                      </Link>
                    </div>
                  </div>
                </td>

                {/* 2. STATUT */}
                <td className="px-1 py-2 text-center align-middle">
                  <div className="flex justify-center">
                    {isCompliant ? (
                      <CheckCircle2 size={12} className="text-green-400" />
                    ) : (
                      <AlertCircle size={12} className="text-red-400" />
                    )}
                  </div>
                </td>

                {/* 3. ACTIONS */}
                <td className="px-2 py-2 text-right align-middle">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditingAgent(agent)}
                      className="p-1 rounded bg-barth-gold text-barth-dark hover:bg-white transition shrink-0"
                    >
                      <Edit size={10} />
                    </button>
                    {/* ✅ Trash2 réutilisé pour éviter l'erreur unused var */}
                    <button className="p-1 rounded text-gray-600 hover:text-red-400 transition shrink-0">
                      <Trash2 size={10} />
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
