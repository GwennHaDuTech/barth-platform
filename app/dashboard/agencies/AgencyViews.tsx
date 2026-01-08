"use client";

import { useState, useEffect } from "react";
import {
  LayoutGrid,
  List,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { deleteAgency } from "@/app/actions/agencies";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// --- INTERFACES ---

interface Agent {
  id: string;
  firstname: string;
  lastname: string;
}

// Interface pour les données brutes de l'API
interface RawAnalyticsData {
  date: string;
  agentId: string;
  agencyId: string;
  visits: number;
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
  agents: Agent[];
  _count: {
    agents: number;
  };
}

interface PeriodStats {
  "24h": number;
  "7 jours": number;
  "30 jours": number;
  Tout: number;
}

interface Props {
  agencies: AgencyData[];
  onEdit?: (agency: AgencyData) => void;
}

export default function AgencyViews({ agencies, onEdit }: Props) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null);

  const [agencyVisits, setAgencyVisits] = useState<Record<string, PeriodStats>>(
    {}
  );

  // ✅ CORRECTION 2 & 10 : Logique encapsulée dans useEffect pour éviter les avertissements
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

        agencies.forEach((agency) => {
          const entries = raw.filter((s) => s.agencyId === agency.id);

          // ✅ CORRECTION 1 : Typage explicite dans le reduce
          visitsMap[agency.id] = {
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

        setAgencyVisits(visitsMap);
      } catch (e) {
        console.error("Erreur polling stats agences", e);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [agencies]); // ✅ Dépendance correcte : si la liste d'agences change, on relance

  const handleDelete = async (id: string, name: string) => {
    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer l'agence "${name}" ?\n\nCette action supprimera également toutes les données analytiques liées.`
      )
    ) {
      try {
        const result = await deleteAgency(id);
        if (result.success) {
          toast.success("Agence supprimée avec succès");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } catch {
        // ✅ CORRECTION 13 : suppression de 'error' inutilisé
        toast.error("Une erreur est survenue");
      }
    }
    setOpenSettingsId(null);
  };

  return (
    <div className="space-y-6">
      {/* Barre d'outils */}
      <div className="flex justify-between items-center">
        <div className="bg-[#0f0f0f] p-1 rounded-xl border border-white/10 flex gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-white"
            }`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "list"
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-white"
            }`}
          >
            <List size={18} />
          </button>
        </div>
        <div className="text-xs text-gray-500 italic">
          Mise à jour des visites en temps réel automatique
        </div>
      </div>

      {/* VUE GRILLE */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agencies.map((agency) => (
            <div
              key={agency.id}
              className="group relative bg-[#121212] border border-white/10 rounded-3xl overflow-hidden hover:border-barth-gold/30 transition-all duration-300 flex flex-col"
            >
              <div className="relative h-48 w-full bg-white/5">
                <Image
                  src={
                    agency.photo ||
                    "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800"
                  }
                  alt={agency.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* ✅ CORRECTION 14 : bg-linear-to-t */}
                <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-transparent to-transparent opacity-90" />

                {/* Badge Visites Live */}
                <div className="absolute top-3 left-3 bg-barth-gold/20 backdrop-blur-md border border-barth-gold/30 px-2 py-1 rounded-lg flex items-center gap-1.5">
                  <Eye size={12} className="text-barth-gold" />
                  <span className="text-[10px] font-bold text-barth-gold">
                    {agencyVisits[agency.id]?.["Tout"] || 0}
                  </span>
                </div>

                {/* Menu 3 points */}
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() =>
                      setOpenSettingsId(
                        openSettingsId === agency.id ? null : agency.id
                      )
                    }
                    className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:text-white transition"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openSettingsId === agency.id && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                      <button
                        onClick={() => {
                          onEdit?.(agency);
                          setOpenSettingsId(null);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                      >
                        <Edit size={14} /> Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(agency.id, agency.name)}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5"
                      >
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-1 truncate">
                    {agency.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin size={14} className="text-barth-gold" />
                    <span className="truncate">{agency.city}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                      Manager
                    </p>
                    <p className="text-xs font-medium text-white truncate">
                      {agency.manager
                        ? `${agency.manager.firstname} ${agency.manager.lastname}`
                        : "Non assigné"}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                      Visites 24h
                    </p>
                    <p className="text-xs font-bold text-barth-gold">
                      {agencyVisits[agency.id]?.["24h"] || 0}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/10 flex gap-2">
                  <Link
                    href={`/agence/${agency.id}`}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-lg py-2.5 flex items-center justify-center gap-2 text-xs font-bold transition border border-white/10"
                  >
                    Site Public <ExternalLink size={14} />
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
            <thead className="text-[10px] uppercase border-b border-white/10 text-gray-500 bg-black/20">
              <tr>
                <th className="px-6 py-4 font-bold tracking-widest">Agence</th>
                <th className="px-6 py-4 font-bold tracking-widest">
                  Responsable
                </th>
                <th className="px-6 py-4 font-bold tracking-widest text-center">
                  Visites (7j)
                </th>
                <th className="px-6 py-4 font-bold tracking-widest text-center">
                  Effectif
                </th>
                <th className="px-6 py-4 font-bold tracking-widest text-right">
                  Actions
                </th>
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
                      <div className="w-8 h-8 rounded-lg overflow-hidden relative bg-white/5">
                        <Image
                          src={
                            agency.photo ||
                            "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=100"
                          }
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-medium">
                          {agency.name}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {agency.city}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs">
                      {agency.manager
                        ? `${agency.manager.firstname} ${agency.manager.lastname}`
                        : "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-barth-gold font-bold">
                      {agencyVisits[agency.id]?.["7 jours"] || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-gray-300">
                      {agency._count.agents} agents
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit?.(agency)}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(agency.id, agency.name)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400"
                      >
                        <Trash2 size={14} />
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
