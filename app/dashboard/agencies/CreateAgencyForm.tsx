"use client";

import { useState } from "react";
import { UploadButton } from "app/utils/uploadthing";
import { X, Loader2, MapPin, Phone, Building2, User } from "lucide-react";
import { createAgency } from "app/actions";
import Image from "next/image";
import { useRouter } from "next/navigation";

const toast = {
  error: (title: string, obj?: { description?: string }) =>
    alert(`${title}: ${obj?.description || ""}`),
  success: (title: string, obj?: { description?: string }) => alert(title),
};

const STYLES = {
  container:
    "relative w-full max-w-xl bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl flex flex-col p-6 max-h-[90vh] overflow-y-auto custom-scrollbar",
  closeButton:
    "absolute top-4 right-4 text-gray-400 hover:text-white transition p-2 rounded-full hover:bg-white/10 z-10",
  title: "text-2xl font-light text-white mb-6",
  goldText: "font-semibold text-barth-gold",
  formSpaceY: "space-y-5",
  label: "block text-sm font-medium text-gray-300 mb-1",
  input:
    "w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none transition-all p-3 focus:border-barth-gold/50 focus:bg-white/10 focus:ring-1 focus:ring-barth-gold/20",
  select:
    "w-full bg-[#1a1a1a] border border-white/10 rounded-xl text-white outline-none transition-all p-3 focus:border-barth-gold/50 focus:bg-white/10 appearance-none",
  uploadBox:
    "mt-1 border-2 border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all hover:bg-white/5 hover:border-barth-gold/30",
  btnSubmit:
    "w-full bg-gradient-to-r from-barth-gold to-[#bf9b30] text-barth-dark font-bold px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(191,155,48,0.3)] transition-all disabled:opacity-50 mt-6",
  // Styles pour les listes déroulantes
  suggestionsList:
    "absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar",
  suggestionItem:
    "p-3 text-sm text-white hover:bg-white/10 cursor-pointer transition border-b border-white/5 last:border-0",
};

interface AgentOption {
  id: string;
  firstname: string;
  lastname: string;
}

interface Props {
  onClose: () => void;
  availableAgents: AgentOption[];
}

// Interfaces pour les APIs
interface GeoCity {
  nom: string;
  codesPostaux: string[];
}

interface GeoAddress {
  properties: {
    label: string; // Adresse complète (ex: "12 Rue de la Paix 75000 Paris")
    name: string; // Numéro + Rue (ex: "12 Rue de la Paix")
    city: string;
    postcode: string;
  };
}

export default function CreateAgencyForm({ onClose, availableAgents }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États du formulaire
  const [name, setName] = useState(""); // Ville
  const [address, setAddress] = useState(""); // Adresse postale
  const [phone, setPhone] = useState("");
  const [managerId, setManagerId] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // États pour l'autocomplétion
  const [citySuggestions, setCitySuggestions] = useState<GeoCity[]>([]);
  const [addressSuggestions, setAddressSuggestions] = useState<GeoAddress[]>(
    []
  );

  // --- 1. GESTION VILLE (API Gouv) ---
  const handleCityChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);

    if (value.length > 2) {
      try {
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${value}&fields=nom,codesPostaux&boost=population&limit=5`
        );
        const data = await res.json();
        setCitySuggestions(data);
      } catch (err) {
        console.error(err);
      }
    } else {
      setCitySuggestions([]);
    }
  };

  const selectCity = (city: GeoCity) => {
    setName(city.nom);
    setCitySuggestions([]);
  };

  // --- 2. GESTION ADRESSE (API Adresse BAN) ---
  const handleAddressChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setAddress(value);

    if (value.length > 3) {
      try {
        // Recherche d'adresse via l'API nationale
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
            value
          )}&limit=5`
        );
        const data = await res.json();
        // L'API renvoie un objet { features: [...] }, on garde les features
        setAddressSuggestions(data.features || []);
      } catch (err) {
        console.error(err);
      }
    } else {
      setAddressSuggestions([]);
    }
  };

  const selectAddress = (item: GeoAddress) => {
    // On prend le label complet (ex: "8 Boulevard du Port 80000 Amiens")
    setAddress(item.properties.label);

    // Bonus : Si la ville n'était pas remplie, on la remplit automatiquement
    if (!name) {
      setName(item.properties.city);
    }
    setAddressSuggestions([]);
  };

  // --- 3. GESTION TÉLÉPHONE (Chiffres uniquement) ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ne garde que les chiffres
    const numericValue = e.target.value.replace(/\D/g, "");
    // Limite à 10 caractères
    if (numericValue.length <= 10) {
      setPhone(numericValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !photoUrl) {
      toast.error("Incomplet", {
        description: "Le nom (ville) et la photo sont obligatoires.",
      });
      return;
    }
    // Validation longueur téléphone
    if (phone && phone.length !== 10) {
      toast.error("Format invalide", {
        description: "Le numéro de téléphone doit comporter 10 chiffres.",
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("address", address);
    formData.append("phone", phone);
    formData.append("photo", photoUrl);
    formData.append("managerId", managerId);

    const result = await createAgency(formData);

    if (result.success) {
      toast.success("Agence créée avec succès ! 🏢");
      router.refresh();
      onClose();
    } else {
      toast.error("Erreur", { description: result.error });
      setIsSubmitting(false);
    }
  };

  return (
    <div className={STYLES.container}>
      <button onClick={onClose} className={STYLES.closeButton}>
        <X size={24} />
      </button>

      <div>
        <h2 className={STYLES.title}>
          Nouvelle <span className={STYLES.goldText}>Agence</span>
        </h2>
      </div>

      <form onSubmit={handleSubmit} className={STYLES.formSpaceY}>
        {/* VILLE (NOM) + AUTOCOMPLETE */}
        <div className="relative">
          <label className={STYLES.label}>Ville de l'agence</label>
          <div className="relative">
            <Building2
              className="absolute left-3 top-3 text-gray-500"
              size={18}
            />
            <input
              className={`${STYLES.input} pl-10`}
              placeholder="Rechercher une ville..."
              value={name}
              onChange={handleCityChange}
              autoComplete="off"
            />
          </div>
          {/* Liste déroulante Ville */}
          {citySuggestions.length > 0 && (
            <div className={STYLES.suggestionsList}>
              {citySuggestions.map((c, i) => (
                <div
                  key={i}
                  className={STYLES.suggestionItem}
                  onClick={() => selectCity(c)}
                >
                  <span className="font-medium text-white">{c.nom}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    ({c.codesPostaux[0]})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PHOTO */}
        <div>
          <label className={STYLES.label}>Photo de l'agence</label>
          <div className={STYLES.uploadBox}>
            {photoUrl ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden group">
                <Image
                  src={photoUrl}
                  alt="Agence"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white font-medium"
                >
                  Changer la photo
                </button>
              </div>
            ) : (
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (res && res[0]) setPhotoUrl(res[0].url);
                }}
                onUploadError={(error: Error) =>
                  alert(`Erreur: ${error.message}`)
                }
                appearance={{
                  button:
                    "bg-barth-gold text-barth-dark text-sm px-4 py-2 rounded-full",
                }}
              />
            )}
          </div>
        </div>

        {/* RESPONSABLE */}
        <div>
          <label className={STYLES.label}>Responsable (Optionnel)</label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-500" size={18} />
            <select
              className={`${STYLES.select} pl-10`}
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
            >
              <option value="">-- Sélectionner un responsable --</option>
              {availableAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.firstname} {agent.lastname}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Liste issue des agents existants.
          </p>
        </div>

        {/* ADRESSE & TELEPHONE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ADRESSE + AUTOCOMPLETE */}
          <div className="relative">
            <label className={STYLES.label}>Adresse Postale</label>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-3 text-gray-500"
                size={18}
              />
              <input
                className={`${STYLES.input} pl-10`}
                placeholder="Tapez l'adresse..."
                value={address}
                onChange={handleAddressChange}
                autoComplete="off"
              />
            </div>
            {/* Liste déroulante Adresse */}
            {addressSuggestions.length > 0 && (
              <div className={STYLES.suggestionsList}>
                {addressSuggestions.map((item, i) => (
                  <div
                    key={i}
                    className={STYLES.suggestionItem}
                    onClick={() => selectAddress(item)}
                  >
                    <div className="text-white truncate">
                      {item.properties.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TELEPHONE (CHIFFRES UNIQUEMENT) */}
          <div>
            <label className={STYLES.label}>Téléphone Fixe</label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-3 text-gray-500"
                size={18}
              />
              <input
                className={`${STYLES.input} pl-10`}
                placeholder="0123456789"
                value={phone}
                onChange={handlePhoneChange} // Nouvelle fonction de gestion
                maxLength={10}
                type="tel" // Aide les claviers mobiles
              />
            </div>
          </div>
        </div>

        {/* BOUTON SUBMIT */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={STYLES.btnSubmit}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" /> Création...
            </span>
          ) : (
            "Créer l'agence"
          )}
        </button>
      </form>
    </div>
  );
}
