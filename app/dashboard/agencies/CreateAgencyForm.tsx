"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  ChevronDown,
  Check,
  Loader2,
  Building2,
  MapPin,
  Phone,
  User,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createAgency } from "@/app/actions";
// ✅ IMPORT DU HOOK UPLOADTHING
import { useUploadThing } from "../../utils/uploadthing";

// --- TYPES ---
interface Agent {
  id: string;
  firstname: string;
  lastname: string;
}

interface CreateAgencyFormProps {
  closeModal: () => void;
  availableAgents?: Agent[];
}

interface CityResult {
  nom: string;
  code: string;
  codesPostaux: string[];
}

interface AddressResult {
  properties: {
    label: string;
    name: string;
    postcode: string;
    city: string;
  };
}

export default function CreateAgencyForm({
  closeModal,
  availableAgents,
}: CreateAgencyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ CONFIGURATION UPLOADTHING
  // "imageUploader" correspond au nom dans ton core.ts
  const { startUpload } = useUploadThing("imageUploader");

  // État pour stocker le fichier réel à uploader
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // --- ÉTATS DU FORMULAIRE ---
  const [formData, setFormData] = useState({
    name: "",
    managerId: "",
    phone: "",
    email: "",
    city: "",
    zipCode: "",
    address: "",
  });

  // --- GESTION IMAGE (Preview + Stockage) ---
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. On garde le fichier pour l'upload plus tard
      setFileToUpload(file);
      // 2. On crée une URL temporaire pour l'affichage immédiat
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setFileToUpload(null); // On vide le fichier
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- LOGIQUE VILLE ---
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [selectedCityCode, setSelectedCityCode] = useState<string | null>(null);
  const [showCityList, setShowCityList] = useState(false);
  const ignoreCitySearch = useRef(false);

  useEffect(() => {
    if (ignoreCitySearch.current) {
      ignoreCitySearch.current = false;
      return;
    }
    if (cityQuery.length < 3) {
      setCityResults([]);
      setShowCityList(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${cityQuery}&fields=nom,code,codesPostaux&boost=population&limit=5`
        );
        const data = await res.json();
        setCityResults(Array.isArray(data) ? data : []);
        setShowCityList(true);
      } catch (e) {
        console.error("Erreur API Ville", e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [cityQuery]);

  // --- LOGIQUE ADRESSE ---
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<AddressResult[]>([]);
  const [showAddressList, setShowAddressList] = useState(false);
  const ignoreAddressSearch = useRef(false);

  useEffect(() => {
    if (ignoreAddressSearch.current) {
      ignoreAddressSearch.current = false;
      return;
    }
    if (addressQuery.length < 3) {
      setAddressResults([]);
      setShowAddressList(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        let url = `https://api-adresse.data.gouv.fr/search/?q=${addressQuery}&limit=5`;
        if (selectedCityCode) {
          url += `&citycode=${selectedCityCode}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setAddressResults(
          data.features && Array.isArray(data.features) ? data.features : []
        );
        setShowAddressList(true);
      } catch (e) {
        console.error("Erreur API Adresse", e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [addressQuery, selectedCityCode]);

  // --- LOGIQUE RESPONSABLE ---
  const [managerSearch, setManagerSearch] = useState("");
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const safeAgentsList: Agent[] = Array.isArray(availableAgents)
    ? availableAgents
    : [];

  const filteredAgents = safeAgentsList.filter((agent) => {
    const fullName = `${agent.firstname} ${agent.lastname}`.toLowerCase();
    return fullName.includes(managerSearch.toLowerCase());
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsManagerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 10) val = val.slice(0, 10);
    const formatted = val.match(/.{1,2}/g)?.join(" ") || val;
    setFormData({ ...formData, phone: formatted });
  };

  // --- SOUMISSION (AVEC UPLOAD) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let uploadedImageUrl = "";

      // 1. Si un fichier a été sélectionné, on l'envoie d'abord à UploadThing
      if (fileToUpload) {
        // startUpload attend un tableau de fichiers
        const uploadRes = await startUpload([fileToUpload]);

        if (uploadRes && uploadRes[0]) {
          uploadedImageUrl = uploadRes[0].url;
          console.log("Image uploadée avec succès :", uploadedImageUrl);
        } else {
          throw new Error("Échec de l'upload de l'image.");
        }
      }

      // 2. Préparation des données pour la Server Action
      const formPayload = new FormData();
      formPayload.append("name", formData.name);
      formPayload.append("city", formData.city);
      formPayload.append("zipCode", formData.zipCode);
      formPayload.append("address", formData.address);
      formPayload.append("phone", formData.phone.replace(/\s/g, ""));

      const emailToSend = formData.email || `agence-${Date.now()}@test.com`;
      formPayload.append("email", emailToSend);

      if (formData.managerId) {
        formPayload.append("managerId", formData.managerId);
      }

      // 3. On envoie l'URL finale (ou vide si pas d'image)
      formPayload.append("photo", uploadedImageUrl);

      // 4. Création en base de données
      const result = await createAgency(formPayload);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.refresh();
      closeModal();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Styles
  const inputWrapperStyle =
    "relative flex items-center bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden focus-within:border-white/40 transition-colors";
  const inputIconStyle = "ml-3 text-gray-500 shrink-0";
  const inputStyle =
    "w-full bg-transparent border-none text-white placeholder-gray-600 px-3 py-3 outline-none text-sm";
  const labelStyle =
    "block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-800">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white">Nouvelle Agence</h2>
            <p className="text-sm text-gray-400 mt-1">
              Ajoutez un nouveau point de vente.
            </p>
          </div>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulaire */}
        <div className="p-5 overflow-y-auto custom-scrollbar">
          <form
            id="createAgencyForm"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* UPLOAD IMAGE */}
            <div>
              <label className={labelStyle}>Photo de couverture</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 relative rounded-lg overflow-hidden border border-gray-800 bg-[#1a1a1a] hover:border-white/30 cursor-pointer transition-all group"
              >
                {previewUrl ? (
                  <>
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={removeImage}
                        className="bg-red-500/80 p-2 rounded-full text-white hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                    <ImagePlus size={32} className="mb-2 opacity-50" />
                    <span className="text-xs font-medium">
                      Cliquez pour ajouter une image
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* NOM */}
            <div>
              <label className={labelStyle}>Nom de l&apos;agence</label>
              <div className={inputWrapperStyle}>
                <Building2 size={18} className={inputIconStyle} />
                <input
                  required
                  type="text"
                  placeholder="Ex: Agence de Rennes"
                  className={inputStyle}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
            </div>

            {/* VILLE */}
            <div className="relative">
              <label className={labelStyle}>Ville</label>
              <div className={inputWrapperStyle}>
                <MapPin size={18} className={inputIconStyle} />
                <input
                  type="text"
                  placeholder="Tapez le nom d'une ville..."
                  className={inputStyle}
                  value={cityQuery}
                  onChange={(e) => {
                    setCityQuery(e.target.value);
                    setFormData({ ...formData, city: e.target.value });
                    setSelectedCityCode(null);
                  }}
                  onFocus={() => cityQuery.length >= 3 && setShowCityList(true)}
                  onBlur={() => setTimeout(() => setShowCityList(false), 200)}
                />
              </div>

              {showCityList && cityResults.length > 0 && (
                <ul className="absolute z-20 w-full bg-[#1a1a1a] border border-gray-800 mt-1 rounded-lg shadow-xl max-h-48 overflow-y-auto py-1">
                  {cityResults.map((city) => (
                    <li
                      key={city.code}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        ignoreCitySearch.current = true;
                        setCityQuery(city.nom);
                        setFormData({
                          ...formData,
                          city: city.nom,
                          zipCode: city.codesPostaux[0] || "",
                        });
                        setSelectedCityCode(city.code);
                        setShowCityList(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-800 cursor-pointer flex justify-between text-sm transition-colors"
                    >
                      <span className="font-medium text-gray-200">
                        {city.nom}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {city.codesPostaux[0]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ADRESSE */}
            <div className="relative">
              <label className={labelStyle}>Adresse Postale</label>
              <div
                className={`${inputWrapperStyle} ${
                  !selectedCityCode ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <MapPin size={18} className={inputIconStyle} />
                <input
                  type="text"
                  disabled={!selectedCityCode}
                  placeholder={
                    selectedCityCode
                      ? "Numéro et nom de voie..."
                      : "Sélectionnez une ville d'abord"
                  }
                  className={inputStyle}
                  value={addressQuery}
                  onChange={(e) => {
                    setAddressQuery(e.target.value);
                    setFormData({ ...formData, address: e.target.value });
                  }}
                  onFocus={() =>
                    addressQuery.length >= 3 && setShowAddressList(true)
                  }
                  onBlur={() =>
                    setTimeout(() => setShowAddressList(false), 200)
                  }
                />
              </div>

              {showAddressList && addressResults.length > 0 && (
                <ul className="absolute z-20 w-full bg-[#1a1a1a] border border-gray-800 mt-1 rounded-lg shadow-xl max-h-48 overflow-y-auto py-1">
                  {addressResults.map((item, idx) => (
                    <li
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        ignoreAddressSearch.current = true;
                        setAddressQuery(item.properties.name);
                        setFormData({
                          ...formData,
                          address: item.properties.name,
                          zipCode: item.properties.postcode,
                        });
                        setShowAddressList(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-sm text-gray-300 transition-colors"
                    >
                      {item.properties.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* TÉLÉPHONE */}
              <div>
                <label className={labelStyle}>Téléphone</label>
                <div className={inputWrapperStyle}>
                  <Phone size={18} className={inputIconStyle} />
                  <input
                    type="text"
                    placeholder="01 23 45 67 89"
                    className={inputStyle}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    maxLength={14}
                  />
                </div>
              </div>

              {/* RESPONSABLE (OPTIONNEL) */}
              <div className="relative" ref={dropdownRef}>
                <label className={labelStyle}>Responsable (Optionnel)</label>
                <div
                  onClick={() =>
                    setIsManagerDropdownOpen(!isManagerDropdownOpen)
                  }
                  className={`${inputWrapperStyle} cursor-pointer py-0 h-11.5`}
                >
                  <User size={18} className={inputIconStyle} />
                  <div
                    className={`flex-1 ${inputStyle} flex items-center truncate`}
                  >
                    <span
                      className={
                        formData.managerId ? "text-white" : "text-gray-500"
                      }
                    >
                      {formData.managerId
                        ? (() => {
                            const m = safeAgentsList.find(
                              (a) => a.id === formData.managerId
                            );
                            return m
                              ? `${m.firstname} ${m.lastname}`
                              : "Introuvable";
                          })()
                        : "Sélectionner (Facultatif)"}
                    </span>
                  </div>

                  {formData.managerId ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, managerId: "" });
                      }}
                      className="mr-2 p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors z-10"
                    >
                      <X size={14} />
                    </div>
                  ) : (
                    <ChevronDown size={18} className="text-gray-500 mr-3" />
                  )}
                </div>

                {isManagerDropdownOpen && (
                  <div className="absolute z-30 w-full bg-[#1a1a1a] border border-gray-800 mt-1 rounded-lg shadow-xl overflow-hidden bottom-full mb-1">
                    <div className="p-2 border-b border-gray-800 bg-[#121212]">
                      <div className="flex items-center bg-[#1a1a1a] border border-gray-800 rounded-md px-2 py-1.5">
                        <Search size={14} className="text-gray-500 mr-2" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Rechercher..."
                          className="w-full outline-none text-sm bg-transparent text-white placeholder-gray-600"
                          value={managerSearch}
                          onChange={(e) => setManagerSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <ul className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
                      {filteredAgents.length === 0 ? (
                        <li className="px-4 py-2 text-sm text-gray-500 text-center">
                          Aucun agent
                        </li>
                      ) : (
                        filteredAgents.map((agent) => (
                          <li
                            key={agent.id}
                            onClick={() => {
                              setFormData({ ...formData, managerId: agent.id });
                              setIsManagerDropdownOpen(false);
                              setManagerSearch("");
                            }}
                            className={`px-4 py-2 text-sm cursor-pointer flex justify-between items-center hover:bg-gray-800 transition-colors ${
                              formData.managerId === agent.id
                                ? "bg-gray-800 text-barth-gold font-medium"
                                : "text-gray-300"
                            }`}
                          >
                            <span>
                              {agent.firstname} {agent.lastname}
                            </span>
                            {formData.managerId === agent.id && (
                              <Check size={14} />
                            )}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-800 flex justify-end gap-3 bg-[#121212] rounded-b-xl">
          <button
            onClick={closeModal}
            className="px-5 py-2 rounded-lg text-gray-400 font-medium hover:text-white hover:bg-white/5 transition-all text-sm"
          >
            Annuler
          </button>

          <button
            type="submit"
            form="createAgencyForm"
            disabled={isSubmitting || !formData.name || !selectedCityCode}
            className="px-6 py-2 rounded-lg bg-white text-black font-bold hover:bg-gray-200 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Envoi en cours..." : "Créer le site"}
          </button>
        </div>
      </div>
    </div>
  );
}
