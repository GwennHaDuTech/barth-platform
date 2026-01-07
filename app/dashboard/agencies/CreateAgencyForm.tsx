"use client";

import { useState } from "react"; // <--- Indispensable pour isLoading
import { toast } from "sonner"; // <--- Pour les notifications
import { X, Upload, MapPin, Phone, User, Building } from "lucide-react";
import Image from "next/image";
import { createAgency } from "@/app/actions"; // Assure-toi que le chemin est bon

// Définition des paramètres que le formulaire accepte
interface Props {
  availableAgents: {
    id: string;
    firstname: string;
    lastname: string;
  }[];
  closeModal: () => void; // <--- La fonction pour fermer la modale
}

export default function CreateAgencyForm({
  availableAgents,
  closeModal,
}: Props) {
  // --- 1. Gestion des états ---
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // --- 2. Gestion de l'upload d'image (Prévisualisation) ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  // --- 3. La fonction de soumission corrigée ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Empêche le rechargement de page classique
    setIsLoading(true);

    try {
      // On récupère les données du formulaire
      const formData = new FormData(e.currentTarget);

      // Appel au serveur
      const result = await createAgency(formData);

      if (result?.success) {
        toast.success("Nouvelle agence créée avec succès !");
        closeModal(); // On utilise la prop pour fermer
      } else {
        toast.error(result?.error || "Erreur lors de la création de l'agence.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur inattendue est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
      {/* HEADER */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0a0a0a]">
        <div>
          <h2 className="text-xl font-light text-white">Nouvelle Agence</h2>
          <p className="text-xs text-gray-500 mt-1">
            Ajoutez un nouveau point de vente.
          </p>
        </div>
        <button
          onClick={closeModal}
          type="button"
          className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* FORMULAIRE SCROLLABLE */}
      <div className="overflow-y-auto p-6 custom-scrollbar">
        <form id="agency-form" onSubmit={handleSubmit} className="space-y-6">
          {/* UPLOAD PHOTO */}
          <div className="flex justify-center">
            <div className="relative group cursor-pointer">
              <div
                className={`w-full h-40 md:w-96 rounded-xl overflow-hidden border-2 border-dashed flex items-center justify-center transition-all ${
                  preview
                    ? "border-barth-gold/50 bg-black"
                    : "border-white/10 bg-white/5 group-hover:bg-white/10 group-hover:border-white/20"
                }`}
              >
                {preview ? (
                  <Image
                    src={preview}
                    alt="Aperçu"
                    width={400}
                    height={200}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-500 group-hover:text-gray-300">
                    <Upload size={32} className="mb-2" />
                    <span className="text-xs uppercase font-bold tracking-wider">
                      Ajouter une photo
                    </span>
                  </div>
                )}
              </div>
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* NOM */}
            <div className="space-y-2 col-span-full">
              <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">
                {`Nom de l'agence`}
              </label>
              <div className="relative">
                <Building
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  size={16}
                />
                <input
                  required
                  name="name"
                  placeholder="Ex: Agence de Rennes"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-barth-gold outline-none transition placeholder-gray-600"
                />
              </div>
            </div>

            {/* VILLE / ADRESSE */}
            <div className="space-y-2 col-span-full">
              <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">
                Adresse complète
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  size={16}
                />
                <input
                  name="address"
                  placeholder="Ex: 12 Rue de la Paix, 75000 Paris"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-barth-gold outline-none transition placeholder-gray-600"
                />
              </div>
            </div>

            {/* TÉLÉPHONE */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">
                Téléphone
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  size={16}
                />
                <input
                  name="phone"
                  placeholder="01 23 45 67 89"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-barth-gold outline-none transition placeholder-gray-600"
                />
              </div>
            </div>

            {/* RESPONSABLE (SELECT) */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">
                Responsable
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  size={16}
                />
                <select
                  name="managerId"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-barth-gold outline-none transition appearance-none cursor-pointer"
                  defaultValue=""
                >
                  <option
                    value=""
                    disabled
                    className="bg-[#1a1a1a] text-gray-500"
                  >
                    Choisir un agent...
                  </option>
                  <option value="" className="bg-[#1a1a1a] text-gray-400">
                    -- Aucun responsable --
                  </option>
                  {availableAgents.map((agent) => (
                    <option
                      key={agent.id}
                      value={agent.id}
                      className="bg-[#1a1a1a]"
                    >
                      {agent.firstname} {agent.lastname}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-6 border-t border-white/10 bg-[#0a0a0a] flex justify-end gap-3">
        <button
          onClick={closeModal}
          type="button"
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition font-medium disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          form="agency-form" // Relie ce bouton au formulaire via l'ID
          type="submit"
          disabled={isLoading}
          className="bg-barth-gold text-barth-dark px-6 py-2.5 rounded-xl font-medium hover:bg-white transition shadow-lg shadow-barth-gold/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />{" "}
              Création...
            </>
          ) : (
            "Créer l'agence"
          )}
        </button>
      </div>
    </div>
  );
}
