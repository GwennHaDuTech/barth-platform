"use client";

import { useState, useEffect } from "react";
import { UploadButton } from "../utils/uploadthing";
import { useRouter } from "next/navigation";
import { X, Loader2, AlertCircle, Lock } from "lucide-react";
import { createAgent } from "@/app/actions";
import Image from "next/image"; // Ajoute cette ligne avec les autres imports

// 1. DÉFINITION DE L'INTERFACE
interface AgentFormData {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  city: string;
  bio: string;
}

// 2. CONSTANTES EXTERNES
const cleanString = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

const loadingMessages = [
  "Paul travaille dur pour créer ton site 🥵",
  "Ton site va être incroyable ✨",
  "Tu vas tout déchirer avec cette vitrine 🚀",
];

export default function CreateAgentForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  // 3. INITIALISATION
  const [formData, setFormData] = useState<AgentFormData>({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    city: "",
    bio: "",
  });

  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState(loadingMessages[0]);

  // Animation chargement
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting) {
      let index = 0;
      interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setLoadingText(loadingMessages[index]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isSubmitting]);

  // ❌ J'AI SUPPRIMÉ LE USEEFFECT "MAGIE EMAIL" D'ICI
  // On gère ça directement dans handleChange plus bas 👇

  // --- VALIDATION ---
  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case "firstname":
      case "lastname":
        if (!/^[a-zA-ZÀ-ÿ\s-]+$/.test(value) && value !== "") {
          error = "Lettres et tirets uniquement.";
        }
        break;
      case "phone":
        if (!/^\d+$/.test(value) && value !== "") {
          error = "Chiffres uniquement.";
        }
        break;
    }
    return error;
  };

  // 📧 NOUVEAU HANDLECHANGE INTELLIGENT
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // 1. Gestion des erreurs
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));

    // 2. Mise à jour des données + Calcul Email immédiat
    setFormData((prev: AgentFormData) => {
      // On prépare la nouvelle version des données
      const newData = { ...prev, [name]: value };

      // Si on est en train de modifier le Nom ou le Prénom...
      if (name === "firstname" || name === "lastname") {
        const fName = cleanString(newData.firstname);
        const lName = cleanString(newData.lastname);

        // ... on met à jour l'email tout de suite !
        if (fName && lName) {
          newData.email = `${fName}.${lName}@barth-immo.fr`;
        } else {
          newData.email = ""; // Vide si incomplet
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasErrors =
      Object.values(errors).some((err) => err !== "") ||
      !formData.firstname ||
      !formData.lastname ||
      !formData.phone;

    if (hasErrors) {
      alert("Merci de corriger les erreurs avant de valider.");
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        dataToSend.append(key, value);
      });
      dataToSend.append("photo", imageUrl);

      await Promise.all([
        createAgent(dataToSend),
        new Promise((resolve) => setTimeout(resolve, 6000)),
      ]);

      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue.");
      setIsSubmitting(false);
    }
  };

  // Styles
  const inputStyle = (hasError: boolean, readOnly: boolean = false) => `
    w-full rounded-xl px-4 py-3 text-white placeholder:text-gray-500 
    focus:outline-none focus:ring-1 transition border
    ${
      readOnly
        ? "bg-white/5 border-white/5 text-gray-400 cursor-not-allowed select-none"
        : "bg-white/5"
    }
    ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : readOnly
        ? ""
        : "border-barth-gold/30 focus:border-barth-gold focus:ring-barth-gold"
    }
  `;
  const labelStyle = "block text-sm text-barth-gold/80 mb-2 font-medium";
  const errorStyle = "text-xs text-red-400 mt-1 flex items-center gap-1";

  return (
    <div className="bg-barth-dark/95 backdrop-blur-xl border border-barth-gold/20 p-8 rounded-3xl w-full max-w-4xl shadow-[0_0_50px_rgba(212,175,55,0.15)] relative max-h-[90vh] overflow-y-auto custom-scrollbar">
      {!isSubmitting && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
        >
          <X size={24} />
        </button>
      )}

      <h2 className="text-2xl font-light text-white mb-8">
        Nouveau site <span className="text-barth-gold font-bold">Agent</span>
      </h2>

      {isSubmitting ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-barth-gold blur-xl opacity-20 animate-pulse rounded-full"></div>
            <Loader2 className="w-16 h-16 text-barth-gold animate-spin relative z-10" />
          </div>
          <p className="text-xl text-white font-light text-center animate-in fade-in slide-in-from-bottom-4 duration-500 key={loadingText}">
            {loadingText}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ligne 1 : Prénom & Nom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>Prénom</label>
              <input
                name="firstname"
                type="text"
                placeholder="Ex: Paul"
                required
                className={inputStyle(!!errors.firstname)}
                onChange={handleChange}
                value={formData.firstname}
              />
              {errors.firstname && (
                <p className={errorStyle}>
                  <AlertCircle size={12} /> {errors.firstname}
                </p>
              )}
            </div>
            <div>
              <label className={labelStyle}>Nom</label>
              <input
                name="lastname"
                type="text"
                placeholder="Ex: Durand"
                required
                className={inputStyle(!!errors.lastname)}
                onChange={handleChange}
                value={formData.lastname}
              />
              {errors.lastname && (
                <p className={errorStyle}>
                  <AlertCircle size={12} /> {errors.lastname}
                </p>
              )}
            </div>
          </div>

          {/* Ligne 2 : Email & Téléphone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative group">
              <label className={labelStyle}>
                Email Pro (Généré automatiquement)
              </label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  readOnly
                  className={inputStyle(false, true)}
                />
                <div className="absolute right-4 top-3 text-gray-500">
                  <Lock size={16} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Identifiant de connexion unique.
              </p>
            </div>
            <div>
              <label className={labelStyle}>Téléphone</label>
              <input
                name="phone"
                type="text"
                placeholder="0612345678"
                required
                className={inputStyle(!!errors.phone)}
                onChange={handleChange}
                maxLength={10}
              />
              {errors.phone && (
                <p className={errorStyle}>
                  <AlertCircle size={12} /> {errors.phone}
                </p>
              )}
            </div>
          </div>

          {/* Ligne 3 : Ville */}
          <div>
            <label className={labelStyle}>Ville Principale</label>
            <input
              name="city"
              type="text"
              placeholder="Ex: Saint-Grégoire"
              className={inputStyle(false)}
              onChange={handleChange}
            />
          </div>

          {/* Ligne 4 : Bio */}
          <div className="col-span-1 md:col-span-2">
            <label className={labelStyle}>
              {`Biographie complète (c'est important pour le SEO ! )`}
            </label>
            <textarea
              name="bio"
              placeholder="Racontez votre parcours, votre passion pour l'immobilier..."
              rows={5}
              className={`${inputStyle(
                false
              )} min-h-[120px] max-h-[300px] resize-y`}
              onChange={handleChange}
            />
          </div>

          {/* Upload Photo */}
          <div>
            <label className={labelStyle}>Photo de profil</label>
            <div className="border border-dashed border-barth-gold/30 rounded-xl p-6 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition">
              {imageUrl ? (
                <div className="flex items-center gap-4 animate-in fade-in">
                  <div className="relative w-16 h-16">
                    {" "}
                    {/* Conteneur pour gérer la taille */}
                    <Image
                      src={imageUrl}
                      alt="Profil"
                      width={64} // Correspond à w-16 (16 * 4px)
                      height={64} // Correspond à h-16
                      className="rounded-full border-2 border-barth-gold object-cover shadow-lg shadow-barth-gold/20"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-green-400 text-sm font-bold">
                      Image chargée !
                    </p>
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Changer
                    </button>
                  </div>
                </div>
              ) : (
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) setImageUrl(res[0].url);
                  }}
                  onUploadError={(error: Error) => {
                    alert(`Erreur: ${error.message}`);
                  }}
                  appearance={{
                    button:
                      "bg-barth-gold text-barth-dark font-bold px-6 py-2 rounded-full hover:bg-white transition text-sm",
                    allowedContent: "text-gray-400 text-xs mt-2",
                  }}
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting || Object.values(errors).some((e) => e !== "")
            }
            className="w-full py-4 rounded-xl bg-gradient-to-r from-barth-gold to-[#B08D57] text-barth-dark font-bold text-lg shadow-lg shadow-barth-gold/20 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
          >
            Valider et générer le site ✨
          </button>
        </form>
      )}
    </div>
  );
}
