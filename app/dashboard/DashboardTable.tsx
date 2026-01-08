"use client";

import React, {
  useState,
  useTransition,
  useMemo,
  useRef,
  useEffect,
} from "react";
import GlassCard from "@/components/ui/GlassCard";
import {
  MoreVertical,
  ExternalLink,
  Edit,
  Trash2,
  User,
  Plus,
  FileDown,
  RefreshCw,
} from "lucide-react";
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
  onEdit?: (item: T) => void;
  liveVisits?: Record<string, number>; // ✅ Bien déclaré ici
}

export default function DashboardTable<T extends DashboardItem>({
  title,
  data,
  type,
  isEmpty,
  onEdit,
  liveVisits = {}, // ✅ On l'extrait ici avec une valeur par défaut
}: Props<T>) {
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState("Tout");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const periods = ["24h", "7 jours", "30 jours", "Tout"];

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LOGIQUE DE TRI ---
  const sortedData = useMemo(() => {
    const list = [...data];
    // On trie par visites réelles si disponibles, sinon par ID
    return list.sort((a, b) => {
      const visitsA = liveVisits[a.id] || 0;
      const visitsB = liveVisits[b.id] || 0;
      return visitsB - visitsA;
    });
  }, [data, liveVisits]); // ✅ Dépend de liveVisits pour se réorganiser en direct

  // --- LOGIQUE EXPORT CSV ---
  const handleExportCSV = () => {
    const headers =
      type === "agent" ? "ID,Prenom,Nom,Agence,Visites\n" : "ID,Nom,Visites\n";
    const rows = sortedData
      .map((item) => {
        const v = liveVisits[item.id] || 0;
        return type === "agent"
          ? `${item.id},${item.firstname},${item.lastname},${
              item.agency?.name || "N/A"
            },${v}`
          : `${item.id},${item.name},${v}`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `export-${type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowMenu(false);
    toast.success("Export terminé");
  };

  const handleOpen = (item: T) => {
    if (type === "agent" && item.slug) {
      window.open(`/agent/${item.slug}`, "_blank");
    } else if (type === "agency-physical") {
      window.open(`/agence/${item.id}`, "_blank");
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
      <div className="p-5 border-b border-white/5 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-light uppercase tracking-widest text-gray-300">
            {title}
          </h2>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-500 hover:text-white transition p-1 rounded-full hover:bg-white/5"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-[#121212]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-100 py-2 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => {
                    onEdit?.({} as T);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] text-gray-300 hover:bg-barth-gold/10 hover:text-barth-gold transition"
                >
                  <Plus size={14} /> Ajouter{" "}
                  {type === "agent" ? "un agent" : "une agence"}
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] text-gray-300 hover:bg-white/5 transition"
                >
                  <FileDown size={14} /> Exporter en CSV
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] text-gray-400 hover:text-white transition"
                >
                  <RefreshCw size={14} /> Rafraîchir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SÉLECTEUR DE PÉRIODE (Note: Pour l'instant, liveVisits est calé sur "Tout" ou "Aujourd'hui") */}
        <div className="flex bg-white/5 p-1 rounded-lg">
          {periods.map((p: string) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 text-[10px] py-1.5 rounded-md transition-all ${
                period === p
                  ? "bg-barth-gold text-white shadow-lg shadow-barth-gold/20"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* TABLEAU CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {isEmpty || sortedData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs italic opacity-20">
            {isEmpty ? "En attente de configuration" : "Aucun site trouvé"}
          </div>
        ) : (
          <table className="w-full text-left border-separate border-spacing-y-1">
            <thead className="sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-10">
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
                // ✅ On utilise la vraie valeur venant de liveVisits
                const currentVisits = liveVisits[item.id] || 0;

                return (
                  <tr
                    key={item.id}
                    className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    {type === "agent" ? (
                      <>
                        <td className="p-2 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/5">
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

                    <td className="p-2 text-center text-barth-gold font-light">
                      {currentVisits.toLocaleString()}
                    </td>

                    <td className="p-2 text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
                        <button
                          onClick={() => handleOpen(item)}
                          className="p-1.5 hover:bg-white/10 rounded-lg hover:text-barth-gold transition"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button
                          onClick={() => onEdit && onEdit(item)}
                          className="p-1.5 hover:bg-white/10 rounded-lg hover:text-blue-400 transition"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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
