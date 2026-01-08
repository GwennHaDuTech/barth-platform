"use client";

import React, { useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { getLogs } from "@/app/actions/logs";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  User,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// --- TYPES ---
interface LogItem {
  id: string;
  action: string;
  entity: string;
  details: string;
  status: string;
  errorMessage: string | null;
  author: string;
  createdAt: Date;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await getLogs(page, pageSize);
      if (res.success && res.data) {
        setLogs(res.data);
        setTotal(res.pagination?.total || 0);
      }
      setLoading(false);
    };

    fetchData();
  }, [page, pageSize]);

  // --- HELPERS VISUELS ---

  // Couleur selon l'action (Création, Modif, Suppression)
  const getActionStyle = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "UPDATE":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "DELETE":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "CREATE":
        return "CRÉATION";
      case "UPDATE":
        return "MODIFICATION";
      case "DELETE":
        return "SUPPRESSION";
      default:
        return action;
    }
  };

  // Statut (Succès / Echec)
  const getStatusIcon = (status: string) => {
    if (status === "SUCCESS")
      return <CheckCircle2 size={16} className="text-green-400" />;
    return <AlertCircle size={16} className="text-red-400" />;
  };

  // Calcul pagination
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen">
      {/* --- HEADER --- */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light text-white mb-2 flex items-center gap-3">
            <Activity className="text-barth-gold" /> Journal d'activité
          </h1>
          <p className="text-gray-400 text-sm">
            Historique complet des actions effectuées sur la plateforme.
          </p>
        </div>
      </div>

      {/* --- TABLEAU --- */}
      <GlassCard className="flex flex-col flex-1 overflow-hidden backdrop-blur-xl bg-black/20 border-white/5">
        {/* Barre d'outils (Pagination Selector) */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Afficher</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1); // Retour page 1 si on change la densité
              }}
              className="bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-barth-gold text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="100">100</option>
            </select>
            <span>lignes par page</span>
          </div>

          <div className="text-xs text-gray-500 uppercase tracking-widest">
            {total} Logs enregistrés
          </div>
        </div>

        {/* Contenu Tableau */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-black/40 text-gray-500 font-medium sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Type Action</th>
                <th className="px-6 py-4">Détails</th>
                <th className="px-6 py-4">Auteur</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Erreur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-barth-gold">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="text-xs text-gray-500">
                        Chargement des logs...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="h-40 text-center text-gray-500 italic"
                  >
                    Aucune activité enregistrée pour le moment.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-white/5 transition group"
                  >
                    {/* Statut */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span
                          className={
                            log.status === "FAILURE"
                              ? "text-red-400 font-medium"
                              : "text-green-400/50"
                          }
                        >
                          {log.status === "FAILURE" ? "ÉCHEC" : "SUCCÈS"}
                        </span>
                      </div>
                    </td>

                    {/* Badge Action */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${getActionStyle(
                          log.action
                        )}`}
                      >
                        {getActionLabel(log.action)}
                      </span>
                      <div className="text-[10px] mt-1 text-gray-500 uppercase">
                        {log.entity}
                      </div>
                    </td>

                    {/* Détails */}
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">
                        {log.details}
                      </span>
                    </td>

                    {/* Auteur */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                          <User size={12} />
                        </div>
                        {log.author}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-600" />
                        <span>
                          {format(new Date(log.createdAt), "dd MMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                        <span className="text-xs text-gray-600">
                          {format(new Date(log.createdAt), "HH:mm")}
                        </span>
                      </div>
                    </td>

                    {/* Message d'Erreur (Rouge si existe) */}
                    <td className="px-6 py-4 max-w-xs truncate">
                      {log.errorMessage ? (
                        <div
                          className="flex items-center gap-2 text-red-400 bg-red-500/5 px-2 py-1 rounded border border-red-500/10"
                          title={log.errorMessage}
                        >
                          <AlertTriangle size={12} />
                          <span className="truncate text-xs font-mono">
                            {log.errorMessage}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-700">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER PAGINATION --- */}
        <div className="p-4 border-t border-white/5 flex justify-between items-center bg-black/20">
          <div className="text-sm text-gray-400">
            Affichage de{" "}
            <span className="text-white font-medium">{startItem}</span> à{" "}
            <span className="text-white font-medium">{endItem}</span> sur{" "}
            <span className="text-white font-medium">{total}</span> logs
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition text-white"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-barth-gold px-2">
              Page {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition text-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
