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
import { deleteAgency } from "@/app/actions/agencies";
import { toast } from "sonner";

interface DashboardItem {
  id: string;
  firstname?: string | null;
  lastname?: string | null;
  name?: string | null;
  slug?: string | null;
  agency?: { name: string } | null;
}

interface PeriodStats {
  "24h": number;
  "7 jours": number;
  "30 jours": number;
  Tout: number;
}

interface Props<T> {
  title: string;
  data: T[];
  type: "agent" | "agency-physical" | "agency-online";
  isEmpty?: boolean;
  onEdit?: (item: T) => void;
  liveVisits?: Record<string, PeriodStats>;
}

export default function DashboardTable<T extends DashboardItem>({
  title,
  data,
  type,
  isEmpty,
  onEdit,
  liveVisits = {},
}: Props<T>) {
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState("Tout");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const periods = ["24h", "7 jours", "30 jours", "Tout"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortedData = useMemo(() => {
    const list = [...data];
    return list.sort((a, b) => {
      const visitsA = liveVisits[a.id]?.[period as keyof PeriodStats] || 0;
      const visitsB = liveVisits[b.id]?.[period as keyof PeriodStats] || 0;
      return visitsB - visitsA;
    });
  }, [data, liveVisits, period]);

  const handleExportCSV = () => {
    const headers =
      type === "agent" ? "ID,Prenom,Nom,Agence,Visites\n" : "ID,Nom,Visites\n";
    const rows = sortedData
      .map((item) => {
        const v = liveVisits[item.id]?.[period as keyof PeriodStats] || 0;
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
    link.setAttribute("download", `export-${type}-${period}.csv`);
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

  const handleDelete = async (item: T) => {
    const name =
      type === "agent" ? `${item.firstname} ${item.lastname}` : item.name;
    if (!confirm(`Supprimer définitivement le site de "${name}" ?`)) return;

    startTransition(async () => {
      const result =
        type === "agent"
          ? await deleteAgent(item.id)
          : await deleteAgency(item.id);

      if (result.success) toast.success("Site supprimé");
      else toast.error(result.error || "Erreur lors de la suppression");
    });
  };

  return (
    <GlassCard
      className={`flex flex-col h-full overflow-hidden backdrop-blur-xl bg-black/20 border-white/5 ${
        isPending ? "opacity-50" : ""
      }`}
    >
      {/* --- HEADER REVISITÉ (Compact & Aligné) --- */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between gap-4">
        {/* TITRE + SELECTEUR (Regroupés à gauche) */}
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-[15px] font-medium uppercase tracking-widest text-white whitespace-nowrap">
            {title}
          </h2>

          {/* SÉLECTEUR DE PÉRIODE COMPACT */}
          <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
            {periods.map((p: string) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  period === p
                    ? "bg-barth-gold text-white shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* MENU 3 POINTS (À droite) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-white transition p-1.5 rounded-full hover:bg-white/10"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-[#121212] border border-white/10 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => {
                  onEdit?.({} as T);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-300 hover:bg-barth-gold/10 hover:text-barth-gold transition"
              >
                <Plus size={14} /> Ajouter{" "}
                {type === "agent" ? "un agent" : "une agence"}
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 transition"
              >
                <FileDown size={14} /> Exporter en CSV
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-400 hover:text-white transition"
              >
                <RefreshCw size={14} /> Rafraîchir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TABLEAU CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {isEmpty || sortedData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-500 opacity-40">
            <div className="p-3 rounded-full bg-white/5">
              {type === "agent" ? <User size={20} /> : <FileDown size={20} />}
            </div>
            <p className="text-sm italic font-light">
              {isEmpty ? "En attente de configuration" : "Aucune donnée"}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-separate border-spacing-y-1">
            <thead className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-10">
              <tr className="text-xs text-gray-400 uppercase tracking-wide">
                {type === "agent" ? (
                  <>
                    <th className="p-3 font-semibold">Agent</th>
                    <th className="p-3 font-semibold">Agence</th>
                  </>
                ) : (
                  <th className="p-3 font-semibold">Nom Agence</th>
                )}
                <th className="p-3 font-semibold text-center">Visites</th>
                <th className="p-3 font-semibold text-right"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {sortedData.map((item) => {
                const currentVisits =
                  liveVisits[item.id]?.[period as keyof PeriodStats] || 0;

                return (
                  <tr
                    key={item.id}
                    className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    {type === "agent" ? (
                      <>
                        <td className="p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                            <User size={16} className="text-gray-300" />
                          </div>
                          <span className="truncate font-medium text-white">
                            {item.firstname} {item.lastname}
                          </span>
                        </td>
                        <td className="p-3 text-gray-400 truncate max-w-24">
                          {item.agency?.name || "N/A"}
                        </td>
                      </>
                    ) : (
                      <td className="p-3 font-medium text-white">
                        {item.name}
                      </td>
                    )}

                    <td className="p-3 text-center">
                      <span className="font-bold text-barth-gold bg-barth-gold/10 px-2 py-1 rounded-md border border-barth-gold/20">
                        {currentVisits.toLocaleString()}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="transition-opacity flex justify-end gap-1">
                        <button
                          onClick={() => handleOpen(item)}
                          className="p-2 text-gray-500 hover:bg-white/10 rounded-lg hover:text-amber-300 transition"
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button
                          onClick={() => onEdit && onEdit(item)}
                          className="p-2 text-gray-500 hover:bg-white/10 rounded-lg hover:text-blue-400 transition"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-gray-500 hover:bg-white/10 rounded-lg hover:text-red-400 transition"
                        >
                          <Trash2 size={16} />
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
