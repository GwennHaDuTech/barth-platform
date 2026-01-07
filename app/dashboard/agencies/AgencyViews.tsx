"use client";

import { useState } from "react";
import {
  LayoutGrid,
  List,
  MapPin,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// ✅ CORRECTION 1 : On définit un type pour les agents au lieu de 'any'
interface Agent {
  id: string;
  firstname: string;
  lastname: string;
}

interface AgencyData {
  id: string;
  name: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string | null;
  email: string;
  photo: string | null;
  manager: {
    firstname: string;
    lastname: string;
  } | null;
  // ✅ On utilise le type Agent[] ici
  agents: Agent[];
  _count: {
    agents: number;
  };
}

interface Props {
  agencies: AgencyData[];
}

export default function AgencyViews({ agencies }: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);

  // ✅ CORRECTION 4 : On a supprimé 'editingAgencyId' et son setter car inutilisés.

  return (
    <div className="space-y-6">
      {/* Barre d'outils */}
      <div className="flex justify-between items-center">
        <div className="bg-[#0f0f0f] p-1 rounded-xl border border-white/10 flex gap-1">
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
        </div>
      </div>

      {/* VUE GRILLE */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agencies.map((agency) => (
            <div
              key={agency.id}
              className="group relative bg-[#121212] border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col"
            >
              {/* Image Header */}
              <div className="relative h-48 w-full bg-white/5">
                <Image
                  src={
                    agency.photo || "https://placehold.co/600x400?text=Agence"
                  }
                  alt={agency.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-transparent to-transparent opacity-80" />

                {/* Menu 3 points */}
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() =>
                      setOpenSettingsId(
                        openSettingsId === agency.id ? null : agency.id
                      )
                    }
                    className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:text-white hover:bg-black/60 transition"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openSettingsId === agency.id && (
                    <>
                      <div
                        className="fixed inset-0 z-0"
                        onClick={() => setOpenSettingsId(null)}
                      ></div>
                      <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                        <button className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                          <Edit size={14} /> Modifier
                        </button>
                        <button className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5">
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-1 truncate">
                    {agency.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin size={14} className="text-barth-gold" />
                    <span className="truncate">
                      {agency.city} ({agency.zipCode})
                    </span>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-6 flex flex-col gap-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                      Manager
                    </p>
                    <p className="text-sm font-medium text-white truncate">
                      {agency.manager
                        ? `${agency.manager.firstname} ${agency.manager.lastname}`
                        : "Non assigné"}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                      Équipe
                    </p>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-barth-gold" />
                      <p className="text-sm font-medium text-white">
                        {agency._count.agents} agents
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/10 flex gap-2">
                  <button className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition">
                    <Edit size={18} />
                  </button>
                  <Link
                    href={`/agence/${agency.id}`}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition border border-white/10"
                  >
                    Voir le détail <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VUE LISTE */}
      {viewMode === "list" && (
        <div className="w-full bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase border-b border-white/10 text-barth-gold bg-[#0f0f0f]">
              <tr>
                <th className="px-6 py-4 font-medium">Nom de l&apos;agence</th>
                <th className="px-6 py-4 font-medium">Localisation</th>
                <th className="px-6 py-4 font-medium">Responsable</th>
                <th className="px-6 py-4 font-medium text-center">Effectif</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {agencies.map((agency) => (
                <tr
                  key={agency.id}
                  className="hover:bg-white/5 transition group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden relative bg-white/5 border border-white/10">
                        <Image
                          src={
                            agency.photo || "https://placehold.co/100?text=A"
                          }
                          alt={agency.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-white font-medium">
                        {agency.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white">{agency.city}</span>
                      <span className="text-xs text-gray-500">
                        {agency.zipCode}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {agency.manager ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-barth-gold/20 flex items-center justify-center text-xs text-barth-gold font-bold">
                            {agency.manager.firstname[0]}
                          </div>
                          <span>
                            {agency.manager.firstname} {agency.manager.lastname}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-600 italic">
                          Non assigné
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-xs text-white">
                      {agency._count.agents}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
