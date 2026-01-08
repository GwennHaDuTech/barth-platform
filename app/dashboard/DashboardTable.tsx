"use client";

import React, { useState, useTransition, useMemo } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { MoreVertical, ExternalLink, Edit, Trash2, User } from "lucide-react";
import { deleteAgent } from "@/app/actions";
import { toast } from "sonner";

interface DashboardItem {
  id: string;
  firstname?: string | null;
  lastname?: string | null;
  name?: string | null;
  slug?: string | null;
  agency?: { name: string } | null;
}

interface Props<T> {
  title: string;
  data: T[];
  type: "agent" | "agency-physical" | "agency-online";
  isEmpty?: boolean;
  // ✅ Ajout de la fonction onEdit dans les Props
  onEdit?: (item: T) => void;
}

export default function DashboardTable<T extends DashboardItem>({
  title,
  data,
  type,
  isEmpty,
  onEdit,
}: Props<T>) {
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState("Tout");
  const periods = ["24h", "7 jours", "30 jours", "Tout"];

  // --- LOGIQUE DE TRI INTELLIGENT ---
  const sortedData = useMemo(() => {
    // 1. On crée une copie pour ne pas muter les props
    const list = [...data];

    // 2. On simule/calcule un score de visites selon la période
    // Plus tard, item.visites_24h viendra de ta DB
    const getVisits = (item: T) => {
      // Simulation déterministe basée sur l'ID pour que le tri soit stable
      const seed = item.id.charCodeAt(0) + item.id.charCodeAt(1);
      if (period === "24h") return (seed * 7) % 100;
      if (period === "7 jours") return (seed * 13) % 500;
      if (period === "30 jours") return (seed * 21) % 2000;
      return (seed * 5) % 5000; // 'Tout'
    };

    // 3. Tri décroissant (Plus visités en haut)
    return list.sort((a, b) => getVisits(b) - getVisits(a));
  }, [data, period]);

  // --- LOGIQUE ACTIONS ---

  const handleOpen = (item: T) => {
    if (type === "agent" && item.slug) {
      window.open(`/agent/${item.slug}`, "_blank");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce site définitivement ?")) return;

    startTransition(async () => {
      const result = await deleteAgent(id);
      if (result.success) toast.success("Site supprimé");
      else toast.error(result.error);
    });
  };

  return (
    <GlassCard
      className={`flex flex-col h-full overflow-hidden backdrop-blur-xl bg-black/20 border-white/5 ${
        isPending ? "opacity-50" : ""
      }`}
    >
      {/* HEADER */}
      <div className="p-5 border-b border-white/5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-light uppercase tracking-widest text-gray-300">
            {title}
          </h2>
          <button className="text-gray-500 hover:text-white transition">
            <MoreVertical size={16} />
          </button>
        </div>

        {/* SÉLECTEUR DE PÉRIODE */}
        <div className="flex bg-white/5 p-1 rounded-lg">
          {periods.map((p: string) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 text-[10px] py-1.5 rounded-md transition-all ${
                period === p
                  ? "bg-barth-gold text-white shadow-lg"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* TABLEAU */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {isEmpty || data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs italic opacity-20">
            {isEmpty ? "En attente de configuration" : "Aucun site trouvé"}
          </div>
        ) : (
          <table className="w-full text-left border-separate border-spacing-y-1">
            <thead className="sticky top-0 bg-black/40 backdrop-blur-md z-10">
              <tr className="text-[10px] text-gray-500 uppercase tracking-tighter">
                {type === "agent" ? (
                  <>
                    <th className="p-2 font-medium">Agent</th>
                    <th className="p-2 font-medium">Agence</th>
                  </>
                ) : (
                  <th className="p-2 font-medium">Nom Agence</th>
                )}
                <th className="p-2 font-medium text-center">Visites</th>
                <th className="p-2 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {sortedData.map((item) => {
                // 1. Calcul dynamique des visites pour l'affichage (doit matcher la logique du useMemo)
                const getVisitsCount = (id: string, currentPeriod: string) => {
                  const seed = id.charCodeAt(0) + id.charCodeAt(1);
                  if (currentPeriod === "24h") return (seed * 7) % 100;
                  if (currentPeriod === "7 jours") return (seed * 13) % 500;
                  if (currentPeriod === "30 jours") return (seed * 21) % 2000;
                  return (seed * 5) % 5000;
                };

                const visits = getVisitsCount(item.id, period);

                return (
                  <tr
                    key={item.id}
                    className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    {type === "agent" ? (
                      <>
                        <td className="p-2 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/5">
                            {/* On pourrait ici mettre item.photo si elle existe */}
                            <User size={14} className="text-gray-400" />
                          </div>
                          <span className="truncate font-light">
                            {item.firstname} {item.lastname}
                          </span>
                        </td>
                        <td className="p-2 text-gray-500 truncate max-w-20 font-light italic">
                          {item.agency?.name || "N/A"}
                        </td>
                      </>
                    ) : (
                      <td className="p-2 font-light">{item.name}</td>
                    )}

                    {/* LA COLONNE VISITE MISE À JOUR */}
                    <td className="p-2 text-center text-barth-gold font-light">
                      {visits.toLocaleString()}
                    </td>

                    {/* ACTIONS */}
                    <td className="p-2 text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
                        <button
                          onClick={() => handleOpen(item)}
                          title="Ouvrir"
                          className="p-1.5 hover:bg-white/10 rounded-lg hover:text-barth-gold transition"
                        >
                          <ExternalLink size={14} />
                        </button>

                        <button
                          onClick={() => onEdit && onEdit(item)}
                          title="Modifier"
                          className="p-1.5 hover:bg-white/10 rounded-lg hover:text-blue-400 transition"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          title="Supprimer"
                          className="p-1.5 hover:bg-white/10 rounded-lg hover:text-red-400 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </GlassCard>
  );
}
