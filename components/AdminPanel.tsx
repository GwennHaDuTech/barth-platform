"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X,
  Plus,
  Trash2,
  Shield,
  User,
  Loader2,
  Bell,
  BellOff,
} from "lucide-react";
import { toast } from "sonner";
import { getAdmins, createAdmin, deleteAdmin } from "app/actions/admins";

// On reprend les types de Prisma pour le front
interface Admin {
  id: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  role: "SUPER_ADMIN" | "ADMIN";
  lastLoginAt: Date | null;
  createdAt: Date;
}

interface Props {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: Props) {
  // isLoading à true par défaut pour éviter le "flash" vide au démarrage
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifyTeam, setNotifyTeam] = useState(false);

  // États pour le formulaire d'ajout
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Définition stable de la fonction de chargement
  const loadAdmins = useCallback(async () => {
    // Note : On ne met pas setIsLoading(true) ici pour éviter la boucle infinie
    // car cette fonction est appelée DANS le useEffect qui dépend d'elle.
    const data = await getAdmins();
    setAdmins(data as unknown as Admin[]);
    setIsLoading(false);
  }, []);

  // 2. Appel au montage du composant
  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true); // On gère le loading du bouton séparément
    const formData = new FormData(e.currentTarget);

    const res = await createAdmin(formData, notifyTeam);

    if (res.success) {
      toast.success("Administrateur ajouté avec succès.");
      setIsAdding(false);
      // On active le chargement global pour le rafraîchissement
      setIsLoading(true);
      await loadAdmins();
    } else {
      toast.error(res.error || "Erreur.");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, email: string) => {
    if (
      !confirm(
        "Voulez-vous vraiment retirer les droits d'accès à cette personne ?"
      )
    )
      return;

    // UX : On active le loader pendant la suppression
    setIsLoading(true);

    const res = await deleteAdmin(id, email, notifyTeam);

    if (res.success) {
      toast.success("Accès révoqué.");
      await loadAdmins(); // loadAdmins remettra isLoading à false à la fin
    } else {
      toast.error("Erreur lors de la suppression.");
      setIsLoading(false); // Important : on désactive le loader en cas d'erreur
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#121212] w-full max-w-4xl h-[80vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="p-6 border-b border-white/10 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-light text-white flex items-center gap-3">
              <Shield className="text-barth-gold" /> Panneau Admin
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Gérez les accès et les permissions de la plateforme.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* TOOLBAR (Checkbox + Bouton Ajouter) */}
        <div className="p-6 pb-2 flex justify-between items-center bg-[#121212]">
          {/* CHECKBOX NOTIFICATION */}
          <div
            onClick={() => setNotifyTeam(!notifyTeam)}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div
              className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${
                notifyTeam ? "bg-barth-gold" : "bg-gray-700"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  notifyTeam ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
            <span
              className={`text-sm font-medium flex items-center gap-2 ${
                notifyTeam ? "text-white" : "text-gray-500"
              }`}
            >
              {notifyTeam ? <Bell size={14} /> : <BellOff size={14} />}
              Avertir l&apos;équipe par email
            </span>
          </div>

          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-transparent text-white border border-transparent hover:border-white px-4 py-2 rounded-xl font-medium transition flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Ajouter un admin
            </button>
          )}
        </div>

        {/* FORMULAIRE D'AJOUT (Conditionnel) */}
        {isAdding && (
          <div className="px-6 py-4 bg-white/5 border-y border-white/10 animate-in slide-in-from-top-2">
            <form onSubmit={handleCreate} className="flex gap-4 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-gray-400">Email</label>
                <input
                  required
                  name="email"
                  type="email"
                  placeholder="email@exemple.com"
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-barth-gold outline-none"
                />
              </div>
              <div className="w-40 space-y-1">
                <label className="text-xs text-gray-400">Prénom</label>
                <input
                  required
                  name="firstname"
                  placeholder="Prénom"
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-barth-gold outline-none"
                />
              </div>
              <div className="w-40 space-y-1">
                <label className="text-xs text-gray-400">Nom</label>
                <input
                  required
                  name="lastname"
                  placeholder="Nom"
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-barth-gold outline-none"
                />
              </div>
              <div className="w-40 space-y-1">
                <label className="text-xs text-gray-400">Rôle</label>
                <select
                  name="role"
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-barth-gold outline-none"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
                >
                  Annuler
                </button>
                <button
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-barth-gold font-bold text-white text-sm rounded-lg hover:bg-white hover:text-black transition flex items-center gap-2"
                >
                  {isSubmitting && (
                    <Loader2 className="animate-spin" size={14} />
                  )}{" "}
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABLEAU */}
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin text-barth-gold" size={32} />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase text-gray-500 border-b border-white/10">
                  <th className="py-3 pl-2 font-medium">Utilisateur</th>
                  <th className="py-3 font-medium">Rôle</th>
                  <th className="py-3 font-medium">Dernière connexion</th>
                  <th className="py-3 pr-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {admins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="group hover:bg-white/5 transition"
                  >
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-barth-gold/10 flex items-center justify-center text-barth-gold font-bold">
                          {admin.firstname ? (
                            admin.firstname[0]
                          ) : (
                            <User size={18} />
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {admin.firstname} {admin.lastname}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {admin.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide border ${
                          admin.role === "SUPER_ADMIN"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {admin.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 text-gray-400">
                      {admin.lastLoginAt ? (
                        new Date(admin.lastLoginAt).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      ) : (
                        <span className="text-gray-600 italic">
                          Jamais connecté
                        </span>
                      )}
                    </td>
                    <td className="py-4 pr-2 text-right">
                      <button
                        onClick={() => handleDelete(admin.id, admin.email)}
                        className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition"
                        title="Révoquer l'accès"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
