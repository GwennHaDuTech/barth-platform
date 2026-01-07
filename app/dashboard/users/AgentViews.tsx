"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutGrid,
  List,
  ArrowUpDown,
  ExternalLink,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Building2,
} from "lucide-react";
import CreateAgentForm from "../CreateAgentForm/CreateAgentForm"; // Vérifie que le chemin est bon
import GlassCard from "@/components/ui/GlassCard";

// Types
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

// Logique de conformité (identique à avant)
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("list"); // Par défaut en liste comme avant
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Tri (Uniquement pour le mode tableau pour l'instant)
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

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
      if (key === "visits") return 0;
      const valA = a[key] || "";
      const valB = b[key] || "";
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setAgents(sortedAgents);
    setSortConfig({ key, direction });
  };

  return (
    <div className="w-full h-full flex flex-col gap-6">
      {/* MODALE D'ÉDITION */}
      {editingAgent && (
        <div className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <CreateAgentForm
            onClose={() => setEditingAgent(null)}
            agentToEdit={editingAgent}
            availableAgencies={availableAgencies}
          />
        </div>
      )}

      {/* BARRE D'OUTILS */}
      <div className="flex justify-start">
        <div className="bg-[#0f0f0f] p-1 rounded-lg border border-white/10 flex gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md transition ${
              viewMode === "grid"
                ? "bg-barth-gold text-barth-dark shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            title="Vue Carte"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition ${
              viewMode === "list"
                ? "bg-barth-gold text-barth-dark shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            title="Vue Liste"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* --- VUE 1 : GRILLE (CARTE) --- */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto custom-scrollbar pb-10">
          {agents.map((agent) => {
            const { isCompliant } = checkConformity(agent);
            return (
              <GlassCard
                key={agent.id}
                className="p-0 flex flex-col overflow-hidden h-95 group relative"
              >
                {/* Photo de couverture / Profil */}
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
                  {/* Badge de conformité */}
                  <div
                    className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md flex items-center gap-1 ${
                      isCompliant
                        ? "bg-green-500/20 border-green-500/30 text-green-400"
                        : "bg-red-500/20 border-red-500/30 text-red-400"
                    }`}
                  >
                    {isCompliant ? (
                      <CheckCircle2 size={10} />
                    ) : (
                      <AlertCircle size={10} />
                    )}
                    {isCompliant ? "Conforme" : "Incomplet"}
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-5 flex-1 flex flex-col justify-between bg-linear-to-t from-[#0a0a0a] to-transparent">
                  <div>
                    <h3 className="text-xl font-medium text-white">
                      {agent.firstname}{" "}
                      <span className="font-bold">{agent.lastname}</span>
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                      <Building2 size={12} className="text-barth-gold" />
                      {agent.agency ? agent.agency.name : "Aucune agence"}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <MapPin size={12} className="text-barth-gold" />
                      {agent.city || "Ville non renseignée"}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setEditingAgent(agent)}
                      className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-barth-gold/30 text-xs font-medium text-white transition flex items-center justify-center gap-2"
                    >
                      <Edit size={14} /> Gérer
                    </button>
                    <Link
                      href={`/agent/${agent.slug}`}
                      target="_blank"
                      className="py-2 px-3 rounded-lg bg-barth-gold/10 text-barth-gold hover:bg-barth-gold hover:text-barth-dark transition flex items-center justify-center"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* --- VUE 2 : TABLEAU (Ton ancien design, encapsulé ici) --- */}
      {viewMode === "list" && (
        <div className="w-full overflow-y-auto custom-scrollbar bg-[#0f0f0f] border border-white/10 rounded-2xl">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase border-b border-white/10 text-barth-gold sticky top-0 bg-[#0f0f0f] z-10">
              <tr>
                <th
                  className="px-6 py-4 font-medium cursor-pointer hover:text-white"
                  onClick={() => handleSort("lastname")}
                >
                  <div className="flex items-center gap-2">
                    Agent <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-medium cursor-pointer hover:text-white"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-2">
                    État <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-medium cursor-pointer hover:text-white"
                  onClick={() => handleSort("city")}
                >
                  <div className="flex items-center gap-2">
                    Localisation <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-6 py-4 font-medium text-center">Visites</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {agents.map((agent) => {
                const { isCompliant, missingFields } = checkConformity(agent);
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
                        <div>
                          <div className="text-white font-medium">
                            {agent.firstname} {agent.lastname}
                          </div>
                          <div className="text-xs text-gray-500">
                            {agent.agency ? agent.agency.name : "Sans agence"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative group/tooltip inline-block">
                        <button
                          onClick={() => !isCompliant && setEditingAgent(agent)}
                          disabled={isCompliant}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            isCompliant
                              ? "bg-green-500/10 border-green-500/20 text-green-400 cursor-default"
                              : "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse-slow hover:bg-red-500/20 cursor-pointer"
                          }`}
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
                            <ul className="list-disc list-inside text-xs text-gray-400">
                              {missingFields.map((f, i) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-300">
                          {agent.city || "—"}
                        </span>
                        <span className="text-xs text-gray-600">
                          {agent.zipCode}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-white/80">
                        {(agent.lastname.length + agent.firstname.length) * 123}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingAgent(agent)}
                          className="p-2 rounded-lg bg-barth-gold text-barth-dark hover:bg-white hover:text-black transition font-medium text-xs flex items-center gap-2 shadow-lg shadow-barth-gold/10"
                        >
                          <Edit size={14} />{" "}
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
      )}
    </div>
  );
}
