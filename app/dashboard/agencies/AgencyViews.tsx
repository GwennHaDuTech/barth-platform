"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutGrid,
  List,
  MapPin,
  Phone,
  User,
  Building,
  ExternalLink,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { deleteAgency } from "@/app/actions"; // Assure-toi que cette action existe bien
import CreateAgencyForm from "./CreateAgencyForm";
import { toast } from "sonner"; // On l'importe pour pouvoir l'ouvrir en mode édition

interface AgencyData {
  id: string;
  name: string;
  photo: string | null;
  address: string | null;
  phone: string | null;
  manager: {
    firstname: string;
    lastname: string;
  } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  agents: any[];
}

interface Props {
  agencies: AgencyData[];
  // On peut avoir besoin des agents disponibles si on veut éditer (optionnel pour l'affichage pur)
}

export default function AgencyViews({ agencies }: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // --- ÉTATS POUR LES ACTIONS ---
  const [openMenuId, setOpenMenuId] = useState<string | null>(null); // Pour savoir quel menu "3 points" est ouvert
  const [deletingAgency, setDeletingAgency] = useState<AgencyData | null>(null); // L'agence en cours de suppression
  const [deleteConfirmation, setDeleteConfirmation] = useState(""); // Le texte tapé par l'utilisateur
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Pour l'édition (Simulé pour l'instant, ouvrira le formulaire)
  // Note: Il faudra adapter CreateAgencyForm pour accepter une prop "agencyToEdit"
  const [editingAgencyId, setEditingAgencyId] = useState<string | null>(null);

  // Gestion du clic sur les 3 points
  const toggleMenu = (id: string) => {
    if (openMenuId === id) setOpenMenuId(null);
    else setOpenMenuId(id);
  };

  // Gestion de la suppression sécurisée
  const handleDelete = async () => {
    if (!deletingAgency) return;

    const expectedText = `supprimer le site ${deletingAgency.name}`;
    if (deleteConfirmation !== expectedText) {
      toast.error("Le texte de confirmation est incorrect."); // Optionnel
      return;
    }

    setIsDeleteLoading(true);

    // On appelle le serveur
    const result = await deleteAgency(deletingAgency.id);

    setIsDeleteLoading(false);

    if (result.success) {
      // SUCCÈS : On ferme tout et on notifie
      setDeletingAgency(null);
      setDeleteConfirmation("");
      toast.success(`L'agence ${deletingAgency.name} a été supprimée.`);
    } else {
      // ERREUR : On prévient l'utilisateur
      toast.error("Erreur lors de la suppression. Réessayez.");
    }
  };

  if (agencies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500 py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
        <Building size={48} className="mb-4 opacity-50" />
        <p>Aucune agence pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 relative">
      {/* --- MODALE DE SUPPRESSION (SÉCURISÉE) --- */}
      {deletingAgency && (
        <div className="fixed inset-0 z-150 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0f0f0f] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setDeletingAgency(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {`Supprimer l'agence ?`}
              </h3>
              <p className="text-sm text-gray-400">
                Cette action est{" "}
                <span className="text-red-400 font-bold">irréversible</span>.
                {`Cela supprimera l'agence`}{" "}
                <strong>{deletingAgency.name}</strong> et détachera tous ses
                agents.
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                Veuillez écrire{" "}
                <span className="text-white select-all">
                  supprimer le site {deletingAgency.name}
                </span>{" "}
                ci-dessous :
              </div>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={`supprimer le site ${deletingAgency.name}`}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:border-red-500/50 outline-none transition"
              />

              <button
                onClick={handleDelete}
                disabled={
                  deleteConfirmation !==
                    `supprimer le site ${deletingAgency.name}` ||
                  isDeleteLoading
                }
                className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleteLoading
                  ? "Suppression..."
                  : "Confirmer la suppression"}
              </button>
            </div>
          </div>
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
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* --- VUE CARTE (GRID) AVEC MODIFICATIONS --- */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-10">
          {agencies.map((agency) => (
            <GlassCard
              key={agency.id}
              className="group relative overflow-hidden p-0 flex flex-col h-87.5"
            >
              {/* --- 1. BOUTON 3 POINTS (MENU) --- */}
              <div className="absolute top-3 right-3 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu(agency.id);
                  }}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-white hover:text-black transition"
                >
                  <MoreVertical size={16} />
                </button>

                {/* MENU DÉROULANT */}
                {openMenuId === agency.id && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-30">
                    <button
                      onClick={() => {
                        setDeletingAgency(agency);
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition"
                    >
                      <Trash2 size={14} /> Supprimer le site
                    </button>
                  </div>
                )}
              </div>

              {/* Image */}
              <div className="relative h-40 w-full overflow-hidden">
                {agency.photo ? (
                  <Image
                    src={agency.photo}
                    alt={agency.name}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <Building className="text-white/20" size={32} />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-2xl font-semibold text-white">
                    {agency.name}
                  </h3>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/10 ${
                        agency.manager
                          ? "bg-white/10"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        Responsable
                      </p>
                      <p className="text-sm font-medium text-white">
                        {agency.manager
                          ? `${agency.manager.firstname} ${agency.manager.lastname}`
                          : "Non assigné"}
                      </p>
                    </div>
                  </div>

                  {agency.address && (
                    <div className="flex items-start gap-2 text-xs text-gray-500 mt-2">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span className="truncate">{agency.address}</span>
                    </div>
                  )}
                </div>

                {/* --- 2. DOUBLE BOUTONS (MODIFIER / VOIR) --- */}
                <div className="flex items-center gap-3 mt-4">
                  {/* Bouton Modifier */}
                  <button
                    onClick={() => {
                      // Logique pour ouvrir le formulaire d'édition
                      // Tu devras connecter ça à ton CreateAgencyForm plus tard
                      alert(
                        "Fonctionnalité d'édition à connecter au formulaire !"
                      );
                    }}
                    className="p-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition"
                    title="Modifier les infos"
                  >
                    <Edit size={16} />
                  </button>

                  {/* Bouton Voir le site */}
                  <Link
                    href={`/agence/${agency.id}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs uppercase tracking-widest font-bold border border-white/10 rounded-lg hover:bg-white hover:text-black transition text-gray-300"
                  >
                    Voir le site <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* --- VUE TABLEAU (LISTE) --- */}
      {viewMode === "list" && (
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-xs uppercase text-barth-gold font-medium">
              <tr>
                <th className="px-6 py-4">Agence</th>
                <th className="px-6 py-4">Responsable</th>
                <th className="px-6 py-4">Localisation</th>
                <th className="px-6 py-4 text-center">Équipe</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {agencies.map((agency) => (
                <tr
                  key={agency.id}
                  className="hover:bg-white/5 transition group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg overflow-hidden relative border border-white/10">
                        {agency.photo ? (
                          <Image
                            src={agency.photo}
                            alt={agency.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/10" />
                        )}
                      </div>
                      <span className="font-semibold text-white">
                        {agency.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {agency.manager ? (
                      `${agency.manager.firstname} ${agency.manager.lastname}`
                    ) : (
                      <span className="text-red-400 text-xs">Non assigné</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-300">
                      {agency.address || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-barth-gold">
                      {agency.agents.length}
                    </span>
                  </td>

                  {/* Actions Tableau */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/agence/${agency.id}`}
                        target="_blank"
                        className="p-2 hover:text-white transition"
                      >
                        <ExternalLink size={16} />
                      </Link>
                      <button
                        onClick={() => setDeletingAgency(agency)}
                        className="p-2 hover:text-red-400 transition"
                      >
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
