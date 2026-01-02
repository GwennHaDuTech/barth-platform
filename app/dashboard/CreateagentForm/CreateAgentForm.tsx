"use client";

import { useState, useEffect } from "react";
import { UploadButton } from "../../utils/uploadthing";
import { useRouter } from "next/navigation";
import {
  X,
  Loader2,
  AlertCircle,
  Lock,
  MapPin,
  User,
  Share2,
  FileText,
  Linkedin,
  Instagram,
  CheckCircle2,
  Plus,
  ImageIcon,
} from "lucide-react";
import { createAgent, updateAgent, checkAgentDuplication } from "@/app/actions";
import Image from "next/image";
import { toast } from "sonner";

// ✅ STYLES DÉFINIS ICI (Plus de bug CSS Modules)
// J'ai appliqué ici tes demandes de réduction de taille (Compact)
const STYLES = {
  container:
    "relative w-full max-w-2xl bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl flex flex-col p-6 max-h-[85vh] overflow-y-auto custom-scrollbar",
  closeButton:
    "absolute top-4 right-4 text-gray-400 hover:text-white transition p-2 rounded-full hover:bg-white/10 z-10",
  title: "text-2xl font-light text-white mb-6",
  goldText: "font-semibold text-barth-gold",
  progressContainer: "w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden",
  progressBar:
    "h-full bg-barth-gold transition-all duration-500 ease-out rounded-full",

  // Formulaire compact
  formSpaceY: "space-y-4",
  label: "block text-sm font-medium text-gray-300 mb-1",
  input:
    "w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none transition-all p-2.5 focus:border-barth-gold/50 focus:bg-white/10 focus:ring-1 focus:ring-barth-gold/20",
  inputError: "border-red-500/50 focus:border-red-500 focus:ring-red-500/20",
  inputIconPadding: "pl-12",
  inputReadOnly:
    "bg-white/5 text-gray-400 cursor-not-allowed border-transparent focus:border-transparent",

  uploadBox:
    "mt-1 border-2 border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all hover:bg-white/5 hover:border-barth-gold/30",

  suggestionsList:
    "absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar",
  suggestionItem:
    "p-3 text-sm text-white hover:bg-white/10 cursor-pointer transition",
  validatedBadge:
    "mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-sm border border-green-500/20 animate-in fade-in",

  chipsContainer: "flex flex-wrap gap-2 mt-3",
  chip: "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-barth-gold/10 text-barth-gold text-sm border border-barth-gold/20",
  chipRemove: "hover:text-white transition",

  btnBack: "text-gray-400 hover:text-white transition text-sm px-4 py-2",
  btnNext:
    "bg-barth-gold text-barth-dark font-medium px-6 py-2.5 rounded-xl hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm",
  btnSubmit:
    "bg-gradient-to-r from-barth-gold to-[#bf9b30] text-barth-dark font-bold px-6 py-2.5 rounded-xl hover:shadow-[0_0_20px_rgba(191,155,48,0.3)] transition-shadow disabled:opacity-50 disabled:cursor-not-allowed text-sm",

  errorBox:
    "flex items-start gap-2 mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-1",
  bioCounterValid: "text-gray-500",
  bioCounterInvalid: "text-red-400 font-medium",
};

// Interface stricte
interface AgentFormData {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  photo: string;
  city: string;
  zipCode: string;
  cityPhotoUrl: string;
  secondarySector: string;
  instagram: string;
  linkedin: string;
  tiktok: string;
  bio: string;
}

interface GeoCity {
  nom: string;
  codesPostaux: string[];
}

interface SelectedCity {
  name: string;
  zip: string;
}

interface Props {
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  agentToEdit?: any;
}

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
  "Traitement des données en cours... ⚙️",
  "Mise à jour des informations... 📝",
  "Optimisation du site... 🚀",
  "Presque terminé ! ✨",
];

export default function CreateAgentForm({ onClose, agentToEdit }: Props) {
  const router = useRouter();
  const isEditMode = !!agentToEdit;

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<AgentFormData>(() => {
    if (agentToEdit) {
      return {
        firstname: agentToEdit.firstname || "",
        lastname: agentToEdit.lastname || "",
        email: agentToEdit.email || "",
        phone: agentToEdit.phone || "",
        photo: agentToEdit.photo || "",
        city: agentToEdit.city || "",
        zipCode: agentToEdit.zipCode || "",
        cityPhotoUrl: agentToEdit.cityPhoto || "",
        secondarySector: agentToEdit.secondarySector || "",
        instagram: agentToEdit.instagram || "",
        linkedin: agentToEdit.linkedin || "",
        tiktok: agentToEdit.tiktok || "",
        bio: agentToEdit.bio || "",
      };
    }
    return {
      firstname: "",
      lastname: "",
      email: "",
      phone: "",
      photo: "",
      city: "",
      zipCode: "",
      cityPhotoUrl: "",
      secondarySector: "",
      instagram: "",
      linkedin: "",
      tiktok: "",
      bio: "",
    };
  });

  const [imageUrl, setImageUrl] = useState(agentToEdit?.photo || "");
  const [cityImageUrl, setCityImageUrl] = useState(
    agentToEdit?.cityPhoto || ""
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState(loadingMessages[0]);
  const [isChecking, setIsChecking] = useState(false);

  const [citySuggestions, setCitySuggestions] = useState<GeoCity[]>([]);
  const [showZipInput, setShowZipInput] = useState(false);
  const [isValidatedCity, setIsValidatedCity] = useState(!!agentToEdit?.city);
  const [secondaryQuery, setSecondaryQuery] = useState("");
  const [secondarySuggestions, setSecondarySuggestions] = useState<GeoCity[]>(
    []
  );
  const [secondaryCitiesList, setSecondaryCitiesList] = useState<
    SelectedCity[]
  >(() => {
    if (agentToEdit?.secondarySector) {
      const parsedList: SelectedCity[] = [];
      const parts = agentToEdit.secondarySector.split(", ");
      parts.forEach((part: string) => {
        const match = part.match(/^(.+)\s\((\d+)\)$/);
        if (match) {
          parsedList.push({ name: match[1], zip: match[2] });
        } else {
          parsedList.push({ name: part, zip: "?" });
        }
      });
      return parsedList;
    }
    return [];
  });

  const isMissing = (value: string | null | undefined) => {
    if (isEditMode && (!value || value.trim() === "")) return true;
    return false;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting) {
      let index = 0;
      interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setLoadingText(loadingMessages[index]);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const searchApiGeo = async (query: string): Promise<GeoCity[]> => {
    if (query.length < 3) return [];
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${query}&fields=nom,codesPostaux&boost=population&limit=5`
      );
      return await res.json();
    } catch (error) {
      console.error("Erreur API:", error);
      return [];
    }
  };

  const handleMainCityChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, city: value, zipCode: "" }));
    setIsValidatedCity(false);
    const results = await searchApiGeo(value);
    setCitySuggestions(results);
    if (value.length >= 3 && results.length === 0) setShowZipInput(true);
    else setShowZipInput(false);
  };

  const handleSecondaryCityChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setSecondaryQuery(value);
    const results = await searchApiGeo(value);
    setSecondarySuggestions(results);
  };

  const selectMainCity = (city: GeoCity) => {
    setFormData((prev) => ({
      ...prev,
      city: city.nom,
      zipCode: city.codesPostaux[0] || "",
    }));
    setCitySuggestions([]);
    setIsValidatedCity(true);
    setShowZipInput(false);
  };

  const addSecondaryCity = (city: GeoCity) => {
    const newCity: SelectedCity = {
      name: city.nom,
      zip: city.codesPostaux[0] || "",
    };
    if (!secondaryCitiesList.some((c) => c.name === newCity.name)) {
      const newList = [...secondaryCitiesList, newCity];
      setSecondaryCitiesList(newList);
      updateSecondarySectorString(newList);
    }
    setSecondaryQuery("");
    setSecondarySuggestions([]);
  };

  const removeSecondaryCity = (indexToRemove: number) => {
    const newList = secondaryCitiesList.filter(
      (_, index) => index !== indexToRemove
    );
    setSecondaryCitiesList(newList);
    updateSecondarySectorString(newList);
  };

  const updateSecondarySectorString = (list: SelectedCity[]) => {
    const formatted = list.map((c) => `${c.name} (${c.zip})`).join(", ");
    setFormData((prev) => ({ ...prev, secondarySector: formatted }));
  };

  const validateStep = (step: number) => {
    const d = formData;
    switch (step) {
      case 1:
        return !!(d.firstname && d.lastname && d.phone && imageUrl);
      case 2:
        return !!(
          d.city &&
          d.zipCode &&
          secondaryCitiesList.length > 0 &&
          cityImageUrl
        );
      case 3:
        return true;
      case 4:
        return d.bio.length > 20;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      let errorMsg = "Merci de compléter les champs.";
      if (currentStep === 2 && !cityImageUrl)
        errorMsg = "Photo de ville manquante.";
      toast.error("Incomplet", { description: errorMsg });
      return;
    }
    setServerError(null);

    if (currentStep === 1 && !isEditMode) {
      setIsChecking(true);
      try {
        const isTaken = await checkAgentDuplication(
          formData.firstname,
          formData.lastname
        );
        if (isTaken) {
          setServerError("Ce nom existe déjà.");
          setIsChecking(false);
          return;
        }
      } catch (err) {
        console.error(err);
      }
      setIsChecking(false);
    }

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setServerError(null);
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (!isEditMode && (name === "firstname" || name === "lastname")) {
        const fName = cleanString(newData.firstname);
        const lName = cleanString(newData.lastname);
        if (fName && lName) newData.email = `${fName}.${lName}@barth-immo.fr`;
        else newData.email = "";
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    setIsSubmitting(true);

    try {
      const dataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "photo" && key !== "cityPhotoUrl") {
          dataToSend.append(key, value);
        }
      });
      dataToSend.append("photo", imageUrl);
      dataToSend.append("cityPhotoUrl", cityImageUrl);

      let result;
      if (isEditMode && agentToEdit) {
        result = await updateAgent(agentToEdit.id, dataToSend);
      } else {
        result = await createAgent(dataToSend);
      }

      if (result && !result.success) {
        setServerError(result.error || "Erreur serveur.");
        setIsSubmitting(false);
        toast.error("Oups", { description: result.error });
        return;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, isEditMode ? 2000 : 8000)
      );

      toast.success(isEditMode ? "Site mis à jour ! 🚀" : "Site créé ! ✨");
      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      setServerError("Erreur technique.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`${STYLES.container} ${
        isSubmitting ? "justify-center" : "justify-between"
      }`}
    >
      {!isSubmitting && (
        <>
          <button onClick={onClose} className={STYLES.closeButton}>
            <X size={24} />
          </button>
          <div className="mb-8">
            <h2 className={STYLES.title}>
              {isEditMode ? "Modifier le site" : "Nouveau site"}{" "}
              <span className={STYLES.goldText}>Agent</span>
            </h2>
            <div className={STYLES.progressContainer}>
              <div
                className={STYLES.progressBar}
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
            <p className="text-right text-xs text-barth-gold mt-2">
              Étape {currentStep}/{totalSteps}
            </p>
          </div>
        </>
      )}

      <div className={isSubmitting ? "w-full" : "flex-1"}>
        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-barth-gold blur-2xl opacity-20 animate-pulse rounded-full"></div>
              <Loader2 className="w-16 h-16 text-barth-gold animate-spin relative z-10" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl text-white font-medium">
                {isEditMode
                  ? "Mise à jour en cours..."
                  : "Création en cours..."}
              </h3>
              <p className="text-gray-400 font-light text-sm animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[280px] mx-auto leading-relaxed">
                {loadingText}
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={`${STYLES.formSpaceY} animate-in fade-in slide-in-from-right-4 duration-300`}
          >
            {/* ÉTAPE 1 : IDENTITÉ */}
            {currentStep === 1 && (
              <div className={STYLES.formSpaceY}>
                <div className="flex items-center gap-2 text-xl text-white mb-4">
                  <User className="text-barth-gold" /> <span>Identité</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={STYLES.label}>Prénom</label>
                    <input
                      name="firstname"
                      className={`${STYLES.input} ${
                        isMissing(formData.firstname)
                          ? "border-red-500/50 bg-red-500/10"
                          : ""
                      }`}
                      onChange={handleChange}
                      value={formData.firstname}
                      placeholder="Ex: Paul"
                    />
                  </div>
                  <div>
                    <label className={STYLES.label}>Nom</label>
                    <input
                      name="lastname"
                      className={`${STYLES.input} ${
                        isMissing(formData.lastname)
                          ? "border-red-500/50 bg-red-500/10"
                          : ""
                      }`}
                      onChange={handleChange}
                      value={formData.lastname}
                      placeholder="Ex: Durand"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="relative group">
                    <label className={STYLES.label}>Email Pro</label>
                    <div className="relative">
                      <input
                        value={formData.email}
                        readOnly
                        className={`${STYLES.input} ${STYLES.inputReadOnly}`}
                      />
                      <Lock
                        size={16}
                        className="absolute right-4 top-3 text-gray-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={STYLES.label}>Téléphone</label>
                    <input
                      name="phone"
                      className={`${STYLES.input} ${
                        isMissing(formData.phone)
                          ? "border-red-500/50 bg-red-500/10"
                          : ""
                      }`}
                      onChange={handleChange}
                      value={formData.phone}
                      placeholder="0612345678"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className={`${STYLES.label} ${
                      isMissing(imageUrl) ? "text-red-400" : ""
                    }`}
                  >
                    Photo de profil {isMissing(imageUrl) && "(MANQUANTE !)"}
                  </label>
                  <div
                    className={`${STYLES.uploadBox} ${
                      isMissing(imageUrl) ? "border-red-500/30" : ""
                    }`}
                  >
                    {imageUrl ? (
                      <div className="flex items-center gap-4">
                        <Image
                          src={imageUrl}
                          alt="Profil"
                          width={64}
                          height={64}
                          className="rounded-full border-2 border-barth-gold"
                        />
                        <button
                          type="button"
                          onClick={() => setImageUrl("")}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Changer
                        </button>
                      </div>
                    ) : (
                      <UploadButton
                        endpoint="imageUploader"
                        onClientUploadComplete={(res) =>
                          res && res[0] && setImageUrl(res[0].url)
                        }
                        onUploadError={(e) => alert(e.message)}
                        appearance={{
                          button:
                            "bg-barth-gold text-barth-dark text-sm px-4 py-2 rounded-full",
                        }}
                      />
                    )}
                  </div>
                </div>
                {serverError && (
                  <div className={STYLES.errorBox}>
                    <AlertCircle
                      className="text-red-500 shrink-0 mt-0.5"
                      size={18}
                    />
                    <p className="text-red-500 text-sm">{serverError}</p>
                  </div>
                )}
              </div>
            )}

            {/* ÉTAPE 2 : SECTEURS & PHOTO VILLE */}
            {currentStep === 2 && (
              <div className={STYLES.formSpaceY}>
                <div className="flex items-center gap-2 text-xl text-white mb-4">
                  <MapPin className="text-barth-gold" />{" "}
                  <span>Secteurs & Image</span>
                </div>

                {/* VILLE PRINCIPALE */}
                <div className="relative">
                  <label className={STYLES.label}>
                    Secteur Principal (Ville)
                  </label>
                  <input
                    name="city"
                    className={`${STYLES.input} ${
                      isMissing(formData.city)
                        ? "border-red-500/50 bg-red-500/10"
                        : ""
                    }`}
                    onChange={handleMainCityChange}
                    value={formData.city}
                    placeholder="Tapez une ville..."
                    autoComplete="off"
                  />
                  {citySuggestions.length > 0 && !isValidatedCity && (
                    <div className={STYLES.suggestionsList}>
                      {citySuggestions.map((city, index) => (
                        <div
                          key={index}
                          className={STYLES.suggestionItem}
                          onClick={() => selectMainCity(city)}
                        >
                          {city.nom}{" "}
                          <span className="text-gray-500">
                            ({city.codesPostaux[0]})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {isValidatedCity && (
                    <div className={STYLES.validatedBadge}>
                      <CheckCircle2 size={16} /> {formData.city} (
                      {formData.zipCode})
                    </div>
                  )}
                  {showZipInput && !isValidatedCity && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 text-yellow-500 text-xs mb-2">
                        <AlertCircle size={14} />{" "}
                        <span>Code postal manuel :</span>
                      </div>
                      <input
                        name="zipCode"
                        className={`${STYLES.input} ${
                          isMissing(formData.zipCode)
                            ? "border-red-500/50 bg-red-500/10"
                            : ""
                        }`}
                        onChange={handleChange}
                        value={formData.zipCode}
                        placeholder="Ex: 35760"
                        maxLength={5}
                      />
                    </div>
                  )}
                </div>

                {/* UPLOAD PHOTO VILLE (COMPACT) */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="text-barth-gold" size={18} />
                    <label
                      className={`${STYLES.label} ${
                        isMissing(cityImageUrl) ? "text-red-400" : ""
                      }`}
                      style={{ marginBottom: 0 }}
                    >
                      Photo de couverture{" "}
                      {isMissing(cityImageUrl) && "(MANQUANTE !)"}
                    </label>
                  </div>

                  <div
                    className={`${STYLES.uploadBox} ${
                      isMissing(cityImageUrl) ? "border-red-500/30" : ""
                    }`}
                  >
                    {cityImageUrl ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden group">
                        <Image
                          src={cityImageUrl}
                          alt="Ville"
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/30 transition-opacity opacity-0 group-hover:opacity-100"></div>
                        <button
                          type="button"
                          onClick={() => setCityImageUrl("")}
                          className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-red-500/80 transition z-10"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <UploadButton
                        endpoint="imageUploader"
                        onClientUploadComplete={(res) =>
                          res && res[0] && setCityImageUrl(res[0].url)
                        }
                        onUploadError={(e) => alert(e.message)}
                        appearance={{
                          button:
                            "bg-barth-gold text-barth-dark text-sm px-4 py-2 rounded-full",
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* SECTEURS SECONDAIRES */}
                <div className="relative mt-6">
                  <label className={STYLES.label}>Secteurs Secondaires</label>
                  <div className="relative">
                    <input
                      value={secondaryQuery}
                      onChange={handleSecondaryCityChange}
                      className={STYLES.input}
                      placeholder="Ajouter une ville..."
                      autoComplete="off"
                    />
                    <div className="absolute right-4 top-3 text-gray-500 pointer-events-none">
                      <Plus size={20} />
                    </div>
                  </div>
                  {secondarySuggestions.length > 0 && (
                    <div
                      className={STYLES.suggestionsList}
                      style={{ zIndex: 60 }}
                    >
                      {secondarySuggestions.map((city, index) => (
                        <div
                          key={index}
                          className={STYLES.suggestionItem}
                          onClick={() => addSecondaryCity(city)}
                        >
                          {city.nom}{" "}
                          <span className="text-gray-500">
                            ({city.codesPostaux[0]})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={STYLES.chipsContainer}>
                    {secondaryCitiesList.map((city, index) => (
                      <div key={index} className={STYLES.chip}>
                        <span>
                          {city.name}{" "}
                          <span className="opacity-70 text-[10px]">
                            ({city.zip})
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSecondaryCity(index)}
                          className={STYLES.chipRemove}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {secondaryCitiesList.length === 0 && (
                      <p
                        className={`text-xs italic mt-1 ${
                          isMissing("secondary")
                            ? "text-red-400"
                            : "text-gray-500"
                        }`}
                      >
                        Aucun secteur secondaire.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : RÉSEAUX */}
            {currentStep === 3 && (
              <div className={STYLES.formSpaceY}>
                <div className="flex items-center gap-2 text-xl text-white mb-4">
                  <Share2 className="text-barth-gold" /> <span>Réseaux</span>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <Instagram
                      className="absolute left-4 top-3 text-pink-500"
                      size={20}
                    />
                    <input
                      name="instagram"
                      className={`${STYLES.input} ${STYLES.inputIconPadding}`}
                      onChange={handleChange}
                      value={formData.instagram}
                      placeholder="Lien Instagram"
                    />
                  </div>
                  <div className="relative">
                    <Linkedin
                      className="absolute left-4 top-3 text-blue-500"
                      size={20}
                    />
                    <input
                      name="linkedin"
                      className={`${STYLES.input} ${STYLES.inputIconPadding}`}
                      onChange={handleChange}
                      value={formData.linkedin}
                      placeholder="Lien LinkedIn"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-3 font-bold text-white text-xs bg-black px-1 rounded">
                      Tk
                    </div>
                    <input
                      name="tiktok"
                      className={`${STYLES.input} ${STYLES.inputIconPadding}`}
                      onChange={handleChange}
                      value={formData.tiktok}
                      placeholder="Lien TikTok"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 4 : BIO */}
            {currentStep === 4 && (
              <div className={STYLES.formSpaceY}>
                <div className="flex items-center gap-2 text-xl text-white mb-4">
                  <FileText className="text-barth-gold" />{" "}
                  <span>Biographie</span>
                </div>
                <div>
                  <label className={STYLES.label}>Ta présentation</label>
                  <textarea
                    name="bio"
                    rows={8}
                    className={`${STYLES.input} resize-none ${
                      isMissing(formData.bio)
                        ? "border-red-500/50 bg-red-500/10"
                        : ""
                    }`}
                    onChange={handleChange}
                    value={formData.bio}
                    placeholder="Votre histoire..."
                  />
                  <div className="flex justify-between items-center mt-2">
                    {formData.bio.length > 0 && formData.bio.length <= 20 ? (
                      <p className="text-xs text-red-400 font-medium animate-pulse flex items-center gap-1">
                        <AlertCircle size={12} /> Trop court.
                      </p>
                    ) : (
                      <span></span>
                    )}
                    <p
                      className={`text-xs transition-colors duration-300 ${
                        formData.bio.length > 20
                          ? STYLES.bioCounterValid
                          : STYLES.bioCounterInvalid
                      }`}
                    >
                      {formData.bio.length} caractères
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      {!isSubmitting && (
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className={STYLES.btnBack}
            >
              Retour
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!validateStep(currentStep) || isChecking}
              className={STYLES.btnNext}
            >
              {isChecking && <Loader2 size={16} className="animate-spin" />}{" "}
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!validateStep(4)}
              className={STYLES.btnSubmit}
            >
              {isEditMode ? "Mettre à jour 💾" : "Créer l'agent ✨"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
