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
  MoreHorizontal,
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

  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);

  const periods = ["24h", "7 jours", "30 jours", "Tout"];

  // Gestion des clics extérieurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Header Menu
      if (
        headerMenuRef.current &&
        !headerMenuRef.current.contains(target as Node)
      ) {
        setShowHeaderMenu(false);
      }

      // Row Menu : On ferme si on clique en dehors du menu ET en dehors du bouton trigger
      // Le stopPropagation sur le menu lui-même (plus bas) aide aussi
      if (
        !target.closest(".row-menu-trigger") &&
        !target.closest(".row-menu-dropdown")
      ) {
        setOpenRowMenuId(null);
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
    setShowHeaderMenu(false);
    toast.success("Export terminé");
  };

  const handleOpen = (item: T) => {
    setOpenRowMenuId(null);
    if (type === "agent" && item.slug) {
      window.open(`/agent/${item.slug}`, "_blank");
    } else if (type === "agency-physical") {
      window.open(`/agence/${item.id}`, "_blank");
    }
  };

  const handleDelete = async (item: T) => {
    setOpenRowMenuId(null);
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
      className={`flex flex-col h-full bg-black/20 border-white/5 ${
        isPending ? "opacity-50" : ""
      }`}
    >
      {/* HEADER */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-[15px] font-medium uppercase tracking-widest text-white whitespace-nowrap">
            {title}
          </h2>
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
        <div className="relative" ref={headerMenuRef}>
          <button
            onClick={() => setShowHeaderMenu(!showHeaderMenu)}
            className="text-gray-400 hover:text-white transition p-1.5 rounded-full hover:bg-white/10"
          >
            <MoreVertical size={18} />
          </button>
          {showHeaderMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-[#121212] border border-white/10 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => {
                  onEdit?.({} as T);
                  setShowHeaderMenu(false);
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

      {/* TABLEAU */}
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
                    <th className="p-3 font-semibold w-[45%]">Agent</th>
                    <th className="p-3 font-semibold w-[30%]">Agence</th>
                  </>
                ) : (
                  <th className="p-3 font-semibold">Nom Agence</th>
                )}
                <th className="p-3 font-semibold text-center">Visites</th>
                <th className="p-3 font-semibold text-right w-[10%]"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {sortedData.map((item) => {
                const currentVisits =
                  liveVisits[item.id]?.[period as keyof PeriodStats] || 0;
                const isMenuOpen = openRowMenuId === item.id;

                return (
                  <tr
                    key={item.id}
                    // ✅ CORRECTION MAJEURE ICI :
                    // Si le menu est ouvert, on met z-50 pour passer au-dessus de tout le reste.
                    // Sinon z-0 classique. 'relative' est requis pour que z-index fonctionne.
                    className={`group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 relative ${
                      isMenuOpen ? "z-50" : "z-0"
                    }`}
                  >
                    {type === "agent" ? (
                      <>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 flex-shrink-0">
                              <User size={16} className="text-gray-300" />
                            </div>
                            <span className="truncate font-medium text-white max-w-[120px] block">
                              {item.firstname} {item.lastname}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-400 truncate max-w-[100px]">
                          {item.agency?.name || "N/A"}
                        </td>
                      </>
                    ) : (
                      <td className="p-3 font-medium text-white truncate max-w-[150px]">
                        {item.name}
                      </td>
                    )}

                    <td className="p-3 text-center">
                      <span className="font-bold text-barth-gold bg-barth-gold/10 px-2 py-1 rounded-md border border-barth-gold/20 text-xs">
                        {currentVisits.toLocaleString()}
                      </span>
                    </td>

                    <td className="p-3 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenRowMenuId(isMenuOpen ? null : item.id);
                        }}
                        className={`row-menu-trigger p-1.5 rounded-md hover:bg-white/10 transition ${
                          isMenuOpen
                            ? "text-white bg-white/10"
                            : "text-gray-500"
                        }`}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {isMenuOpen && (
                        <div
                          // ✅ stopPropagation pour éviter que le clic dans le menu ne le ferme
                          onClick={(e) => e.stopPropagation()}
                          className="row-menu-dropdown absolute right-8 top-8 w-40 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-150 origin-top-right"
                        >
                          <button
                            onClick={() => handleOpen(item)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition"
                          >
                            <ExternalLink size={14} /> Voir le site
                          </button>

                          <button
                            onClick={() => {
                              setOpenRowMenuId(null);
                              onEdit && onEdit(item);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-blue-400 transition"
                          >
                            <Edit size={14} /> Modifier
                          </button>

                          <div className="h-px bg-white/5 my-1" />

                          <button
                            onClick={() => handleDelete(item)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition"
                          >
                            <Trash2 size={14} /> Supprimer
                          </button>
                        </div>
                      )}
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
