"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
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
  onClose: () => void;
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
  onClose,
  availableAgents,
}: CreateAgencyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ CONFIGURATION UPLOADTHING
  const { startUpload } = useUploadThing("imageUploader");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // --- ÉTATS DU FORMULAIRE ---
  const [formData, setFormData] = useState({
    name: "",
    managerId: "",
    phone: "",
    email: "", // Optionnel
    city: "",
    zipCode: "",
    address: "",
  });

  // --- GESTION IMAGE ---
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      // Nettoyage de l'ancienne URL si elle existe
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileToUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- LOGIQUE VILLE (API Geo) ---
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

  // --- LOGIQUE ADRESSE (API Adresse) ---
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
        if (selectedCityCode) url += `&citycode=${selectedCityCode}`;
        const res = await fetch(url);
        const data = await res.json();
        setAddressResults(data.features || []);
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
  const safeAgentsList = Array.isArray(availableAgents) ? availableAgents : [];

  const filteredAgents = safeAgentsList.filter((agent) => {
    const fullName = `${agent.firstname} ${agent.lastname}`.toLowerCase();
    return fullName.includes(managerSearch.toLowerCase());
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 10) val = val.slice(0, 10);
    const formatted = val.match(/.{1,2}/g)?.join(" ") || val;
    setFormData({ ...formData, phone: formatted });
  };

  // --- SOUMISSION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let uploadedImageUrl = "";

      if (fileToUpload) {
        const uploadRes = await startUpload([fileToUpload]);
        if (uploadRes?.[0]) {
          uploadedImageUrl = uploadRes[0].url;
        } else {
          throw new Error("Échec de l'upload de l'image.");
        }
      }

      const formPayload = new FormData();
      formPayload.append("name", formData.name);
      formPayload.append("city", formData.city);
      formPayload.append("zipCode", formData.zipCode);
      formPayload.append("address", formData.address);
      formPayload.append("phone", formData.phone.replace(/\s/g, ""));

      // Email par défaut si vide pour éviter les erreurs de contrainte unique
      const finalEmail =
        formData.email ||
        `agence-${Math.random().toString(36).slice(2, 7)}@system.com`;
      formPayload.append("email", finalEmail);

      if (formData.managerId) {
        formPayload.append("managerId", formData.managerId);
      }
      formPayload.append("photo", uploadedImageUrl);

      const result = await createAgency(formPayload);

      if (!result.success) throw new Error(result.error);

      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Erreur lors de la création."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- STYLES REUTILISABLES ---
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
              Configurez votre nouveau point de vente.
            </p>
          </div>
          <button
            onClick={onClose}
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
            {/* PHOTO */}
            <div>
              <label className={labelStyle}>Photo de l&apos;agence</label>
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
                        className="bg-red-500/80 p-2 rounded-full text-white hover:bg-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                    <ImagePlus size={32} className="mb-2 opacity-50" />
                    <span className="text-xs font-medium">
                      Ajouter une photo
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

            {/* VILLE ET ADRESSE (votre logique API reste identique) */}
            <div className="space-y-4">
              {/* Ville */}
              <div className="relative">
                <label className={labelStyle}>Ville</label>
                <div className={inputWrapperStyle}>
                  <MapPin size={18} className={inputIconStyle} />
                  <input
                    type="text"
                    placeholder="Ville..."
                    className={inputStyle}
                    value={cityQuery}
                    onChange={(e) => {
                      setCityQuery(e.target.value);
                      setFormData({ ...formData, city: e.target.value });
                      setSelectedCityCode(null);
                    }}
                    onFocus={() =>
                      cityQuery.length >= 3 && setShowCityList(true)
                    }
                    onBlur={() => setTimeout(() => setShowCityList(false), 200)}
                  />
                </div>
                {showCityList && cityResults.length > 0 && (
                  <ul className="absolute z-20 w-full bg-[#1a1a1a] border border-gray-800 mt-1 rounded-lg shadow-xl max-h-48 overflow-y-auto py-1">
                    {cityResults.map((city) => (
                      <li
                        key={city.code}
                        onMouseDown={() => {
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
                        className="px-4 py-2 hover:bg-gray-800 cursor-pointer flex justify-between text-sm text-gray-200"
                      >
                        <span>{city.nom}</span>
                        <span className="text-gray-500 text-xs">
                          {city.codesPostaux[0]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Adresse */}
              <div className="relative">
                <label className={labelStyle}>Adresse</label>
                <div
                  className={`${inputWrapperStyle} ${
                    !selectedCityCode && "opacity-50"
                  }`}
                >
                  <MapPin size={18} className={inputIconStyle} />
                  <input
                    disabled={!selectedCityCode}
                    type="text"
                    placeholder={
                      selectedCityCode
                        ? "Rue..."
                        : "Sélectionnez d'abord la ville"
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
                        onMouseDown={() => {
                          ignoreAddressSearch.current = true;
                          setAddressQuery(item.properties.name);
                          setFormData({
                            ...formData,
                            address: item.properties.name,
                            zipCode: item.properties.postcode,
                          });
                          setShowAddressList(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-sm text-gray-300"
                      >
                        {item.properties.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* TÉLÉPHONE */}
              <div>
                <label className={labelStyle}>Téléphone</label>
                <div className={inputWrapperStyle}>
                  <Phone size={18} className={inputIconStyle} />
                  <input
                    type="text"
                    placeholder="06 00 00 00 00"
                    className={inputStyle}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                  />
                </div>
              </div>

              {/* RESPONSABLE */}
              <div className="relative" ref={dropdownRef}>
                <label className={labelStyle}>Responsable</label>
                <div
                  onClick={() =>
                    setIsManagerDropdownOpen(!isManagerDropdownOpen)
                  }
                  className={`${inputWrapperStyle} cursor-pointer h-11.5 px-3 justify-between`}
                >
                  <div className="flex items-center truncate gap-2">
                    <User size={18} className="text-gray-500" />
                    <span
                      className={`text-sm ${
                        formData.managerId ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {formData.managerId
                        ? safeAgentsList.find(
                            (a) => a.id === formData.managerId
                          )?.firstname +
                          " " +
                          safeAgentsList.find(
                            (a) => a.id === formData.managerId
                          )?.lastname
                        : "Sélectionner"}
                    </span>
                  </div>
                  <ChevronDown size={16} className="text-gray-500" />
                </div>

                {isManagerDropdownOpen && (
                  <div className="absolute bottom-full mb-2 z-30 w-full bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-gray-800">
                      <input
                        autoFocus
                        className="w-full bg-black border border-gray-800 rounded-md px-2 py-1 text-xs text-white outline-none focus:border-white/20"
                        placeholder="Filtrer..."
                        value={managerSearch}
                        onChange={(e) => setManagerSearch(e.target.value)}
                      />
                    </div>
                    <ul className="max-h-40 overflow-y-auto">
                      {filteredAgents.map((agent) => (
                        <li
                          key={agent.id}
                          onClick={() => {
                            setFormData({ ...formData, managerId: agent.id });
                            setIsManagerDropdownOpen(false);
                          }}
                          className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 cursor-pointer flex justify-between"
                        >
                          {agent.firstname} {agent.lastname}
                          {formData.managerId === agent.id && (
                            <Check size={14} className="text-white" />
                          )}
                        </li>
                      ))}
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
            onClick={onClose}
            className="px-5 py-2 text-gray-400 hover:text-white text-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="createAgencyForm"
            disabled={isSubmitting || !formData.name || !selectedCityCode}
            className="px-6 py-2 rounded-lg bg-white text-black font-bold hover:bg-gray-200 flex items-center gap-2 disabled:opacity-40 transition-all text-sm"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : null}
            {isSubmitting ? "Création..." : "Créer l'agence"}
          </button>
        </div>
      </div>
    </div>
  );
}
