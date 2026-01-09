"use client";

import React, {
  useState,
  useTransition,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useRouter } from "next/navigation"; // ✅ AJOUT IMPORT
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
  Search,
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
  const router = useRouter(); // ✅ AJOUT ROUTER
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState("Tout");
  const [searchTerm, setSearchTerm] = useState("");

  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);

  // 1. REF POUR LE SCROLL HORIZONTAL
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const periods = ["24h", "7 jours", "30 jours", "Tout"];

  // Gestion des clics extérieurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (
        headerMenuRef.current &&
        !headerMenuRef.current.contains(target as Node)
      ) {
        setShowHeaderMenu(false);
      }

      // ✅ C'est ici que ça bloquait : il faut que les éléments aient ces classes
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

  // 2. LOGIQUE SCROLL HORIZONTAL AVEC MOLETTE SOURIS
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (container.scrollWidth > container.clientWidth) {
        if (e.deltaY !== 0) {
          e.preventDefault();
          container.scrollLeft += e.deltaY;
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Logique de tri et de filtrage
  const processedData = useMemo(() => {
    let list = [...data];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      list = list.filter((item) => {
        if (type === "agent") {
          return (
            item.firstname?.toLowerCase().includes(lowerTerm) ||
            item.lastname?.toLowerCase().includes(lowerTerm) ||
            item.agency?.name.toLowerCase().includes(lowerTerm)
          );
        } else {
          return item.name?.toLowerCase().includes(lowerTerm);
        }
      });
    }

    return list.sort((a, b) => {
      const visitsA = liveVisits[a.id]?.[period as keyof PeriodStats] || 0;
      const visitsB = liveVisits[b.id]?.[period as keyof PeriodStats] || 0;
      return visitsB - visitsA;
    });
  }, [data, liveVisits, period, searchTerm, type]);

  const handleExportCSV = () => {
    const headers =
      type === "agent" ? "ID,Prenom,Nom,Agence,Visites\n" : "ID,Nom,Visites\n";
    const rows = processedData
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

      if (result.success) {
        toast.success("Site supprimé");
        router.refresh(); // ✅ Force le rafraîchissement de la page pour retirer la ligne
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    });
  };

  return (
    <GlassCard
      className={`p-0.5! flex flex-col h-full bg-[#0a0a0a]/40 border-white/5 backdrop-blur-xl overflow-hidden ${
        isPending ? "opacity-50" : ""
      }`}
    >
      {/* HEADER COMPACT */}
      <div className="h-13.75  border-b border-white/5 flex items-center justify-between shrink-0 bg-white/2">
        <h2 className="text-[13px] font-semibold uppercase tracking-widest text-white/90 whitespace-nowrap pl-2">
          {title}
        </h2>

        <div className="flex items-center justify-end gap-2">
          {/* SEARCH */}
          <div className="group/search relative flex items-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all duration-300 w-7.5 hover:w-40 h-7.5 focus-within:w-40 focus-within:bg-white/10 focus-within:border-barth-gold/30">
            <div className="absolute left-0 w-7.5 h-full flex items-center justify-center pointer-events-none text-gray-400 group-hover/search:text-barth-gold transition-colors">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full bg-transparent border-none outline-none pl-8 pr-3 text-xs text-white placeholder-gray-500 opacity-0 group-hover/search:opacity-100 focus:opacity-100 transition-opacity duration-300"
            />
          </div>

          {/* TIME SELECTOR */}
          <div className="group/time flex items-center bg-black/20 p-0.5 rounded-lg border border-white/5 hover:bg-black/40 transition-colors">
            {periods.map((p) => {
              const isActive = period === p;
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`
                    text-[10px] font-medium rounded-md transition-all duration-300 ease-out whitespace-nowrap overflow-hidden
                    ${
                      isActive
                        ? "bg-barth-gold text-white shadow-sm px-2.5 py-1 w-auto opacity-100"
                        : "w-0 px-0 opacity-0 group-hover/time:w-auto group-hover/time:px-2.5 group-hover/time:opacity-100 group-hover/time:py-1 text-gray-500 hover:text-white"
                    }
                  `}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* MENU HEADER */}
          <div className="relative" ref={headerMenuRef}>
            <button
              onClick={() => setShowHeaderMenu(!showHeaderMenu)}
              className="text-gray-400 hover:text-white transition p-1.5 rounded-full hover:bg-white/10"
            >
              <MoreVertical size={16} />
            </button>
            {showHeaderMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#121212] border border-white/10 rounded-xl shadow-2xl z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => {
                    onEdit?.({} as T);
                    setShowHeaderMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-300 hover:bg-barth-gold/10 hover:text-barth-gold"
                >
                  <Plus size={14} /> Ajouter
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-300 hover:bg-white/5"
                >
                  <FileDown size={14} /> Exporter CSV
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  <RefreshCw size={14} /> Rafraîchir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLE BODY */}
      <div className="flex-1 w-full overflow-hidden pt-1">
        <div
          ref={tableContainerRef}
          className="
            w-full h-full overflow-auto 
            rounded-lg bg-black/20 border border-white/5
            scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20
            [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full
          "
        >
          {isEmpty || processedData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-500 opacity-50">
              <div className="p-4 rounded-full bg-white/5 border border-white/5">
                {type === "agent" ? <User size={24} /> : <FileDown size={24} />}
              </div>
              <p className="text-sm font-light">
                {searchTerm
                  ? "Aucun résultat trouvé"
                  : isEmpty
                  ? "En attente de configuration"
                  : "Aucune donnée"}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-20 bg-[#121212] shadow-sm shadow-black/50">
                <tr className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                  {type === "agent" ? (
                    <>
                      <th className="p-3 pl-4">Agent</th>
                      <th className="p-3 text-center w-[1%] whitespace-nowrap">
                        Visites
                      </th>
                      <th className="p-3 w-[1%] whitespace-nowrap">Agence</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3 pl-4">Nom Agence</th>
                      <th className="p-3 text-center w-[1%] whitespace-nowrap">
                        Visites
                      </th>
                    </>
                  )}
                  <th className="p-3 text-right pr-4 w-[1%] whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {processedData.map((item, index) => {
                  const currentVisits =
                    liveVisits[item.id]?.[period as keyof PeriodStats] || 0;
                  const isMenuOpen = openRowMenuId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`
                        group transition-colors duration-200 relative
                        ${index % 2 === 0 ? "bg-transparent" : "bg-white/2"} 
                        hover:bg-white/4
                        ${isMenuOpen ? "z-50 bg-white/6" : "z-0"}
                      `}
                    >
                      {type === "agent" ? (
                        <>
                          {/* AGENT */}
                          <td className="p-3 pl-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-barth-gold/10 border border-barth-gold/20 flex items-center justify-center shrink-0">
                                <User size={14} className="text-barth-gold" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium text-white truncate">
                                  {item.firstname} {item.lastname}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* VISITES */}
                          <td className="p-3 text-center w-[1%] whitespace-nowrap">
                            <span
                              className={`
                                inline-flex px-2 py-0.5 rounded text-[10px] font-bold border
                                ${
                                  currentVisits > 0
                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                    : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                }
                              `}
                            >
                              {currentVisits.toLocaleString()}
                            </span>
                          </td>

                          {/* AGENCE */}
                          <td className="p-3 w-[1%] whitespace-nowrap">
                            <span className="text-xs text-gray-400 block">
                              {item.agency?.name || "N/A"}
                            </span>
                          </td>
                        </>
                      ) : (
                        // VUE AGENCE
                        <>
                          <td className="p-3 pl-4 font-medium text-white">
                            {item.name}
                          </td>
                          <td className="p-3 text-center w-[1%] whitespace-nowrap">
                            <span
                              className={`
                                inline-flex px-2 py-0.5 rounded text-[10px] font-bold border
                                ${
                                  currentVisits > 0
                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                    : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                }
                              `}
                            >
                              {currentVisits.toLocaleString()}
                            </span>
                          </td>
                        </>
                      )}

                      {/* ACTIONS */}
                      <td className="p-3 text-right pr-4 w-[1%] whitespace-nowrap relative">
                        {/* ⚠️ AJOUT DE LA CLASSE 'row-menu-trigger' ICI */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenRowMenuId(isMenuOpen ? null : item.id);
                          }}
                          className={`row-menu-trigger p-1.5 rounded-md transition-all duration-200 ${
                            isMenuOpen
                              ? "bg-barth-gold text-black shadow-lg shadow-barth-gold/20"
                              : "text-gray-500 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {isMenuOpen && (
                          /* ⚠️ AJOUT DE LA CLASSE 'row-menu-dropdown' ICI */
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="row-menu-dropdown absolute right-10 top-1/2 -translate-y-1/2 w-40 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-100 py-1 animate-in slide-in-from-right-2 duration-200"
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
                                if (onEdit) onEdit(item);
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
      </div>
    </GlassCard>
  );
}
