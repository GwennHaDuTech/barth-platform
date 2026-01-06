"use client";
// FIX: Force update Vercel types
import { useState, useEffect } from "react";
// Assure-toi que ce chemin est bon pour UploadThing
import { UploadButton } from "app/utils/uploadthing";
import { useRouter } from "next/navigation";
import {
  X,
  Loader2,
  MapPin,
  User,
  Instagram,
  Linkedin,
  Building2, // <--- NOUVELLE ICONE
} from "lucide-react";
// Import actions
import { createAgent, updateAgent, checkAgentDuplication } from "app/actions";
import Image from "next/image";

// Petit helper pour les notifications
const toast = {
  error: (title: string, obj?: { description?: string }) =>
    alert(`${title}: ${obj?.description || ""}`),
  success: (title: string, obj?: { description?: string }) => alert(title),
};

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
  formSpaceY: "space-y-4",
  label: "block text-sm font-medium text-gray-300 mb-1",
  input:
    "w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none transition-all p-2.5 focus:border-barth-gold/50 focus:bg-white/10 focus:ring-1 focus:ring-barth-gold/20",
  // Style spécifique pour le Select pour qu'il ressemble aux inputs
  select:
    "w-full bg-[#1a1a1a] border border-white/10 rounded-xl text-white outline-none transition-all p-2.5 focus:border-barth-gold/50 focus:bg-white/10 focus:ring-1 focus:ring-barth-gold/20 appearance-none",
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
  agencyId: string; // <--- AJOUTÉ
}

interface GeoCity {
  nom: string;
  codesPostaux: string[];
}

interface SelectedCity {
  name: string;
  zip: string;
}

// Simple interface pour les agences dans la liste
interface AgencyOption {
  id: string;
  name: string;
}

interface AgentData {
  id: string;
  firstname: string;
  lastname: string;
  email: string;

  phone: string | null;
  photo: string | null;
  city: string | null;

  zipCode?: string | null;
  cityPhoto?: string | null;
  secondarySector?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  tiktok?: string | null;
  bio?: string | null;
  agencyId?: string | null; // <--- AJOUTÉ
}

interface Props {
  onClose: () => void;
  agentToEdit?: AgentData;
  availableAgencies?: AgencyOption[]; // <--- AJOUTÉ (Liste des agences passée par le parent)
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
  "Création de la page agent... 📝",
  "Optimisation des images... 🚀",
  "Presque terminé ! ✨",
];

export default function CreateAgentForm({
  onClose,
  agentToEdit,
  availableAgencies = [], // Valeur par défaut vide
}: Props) {
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
        agencyId: agentToEdit.agencyId || "", // <--- AJOUTÉ
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
      agencyId: "", // <--- AJOUTÉ
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
      return []; // Logique simplifiée pour l'exemple
    }
    return [];
  });

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

  // --- VALIDATION DES ETAPES ---
  const validateStep = (step: number) => {
    const d = formData;
    switch (step) {
      case 1:
        // On rend l'agence obligatoire ici
        return !!(
          d.firstname &&
          d.lastname &&
          d.phone &&
          imageUrl &&
          d.agencyId
        );
      case 2:
        return !!(d.city && d.zipCode && cityImageUrl);
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
      let errorMsg = "Merci de compléter les champs obligatoires.";
      if (currentStep === 1) {
        if (!formData.agencyId) errorMsg = "Veuillez sélectionner une agence.";
        else if (!imageUrl) errorMsg = "Photo de profil manquante.";
      }
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
          setServerError("Un agent avec ce nom semble déjà exister.");
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
      // agencyId est déjà dans le formData, donc il sera ajouté par la boucle au-dessus

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

      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(isEditMode ? "Site mis à jour ! 🚀" : "Site créé ! ✨");
      router.refresh();
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error(error);
      setServerError("Erreur technique inattendue.");
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
                Création en cours...
              </h3>
              <p className="text-gray-400 font-light text-sm animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-70 mx-auto leading-relaxed">
                {loadingText}
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={`${STYLES.formSpaceY} animate-in fade-in slide-in-from-right-4 duration-300`}
          >
            {/* --- ETAPE 1 : IDENTITÉ --- */}
            {currentStep === 1 && (
              <div className={STYLES.formSpaceY}>
                <div className="flex items-center gap-2 text-xl text-white mb-4">
                  <User className="text-barth-gold" /> <span>Identité</span>
                </div>

                {/* --- NOUVEAU SELECT AGENCE --- */}
                <div>
                  <label className={STYLES.label}>
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-barth-gold" />
                      Agence de rattachement
                    </div>
                  </label>
                  <div className="relative">
                    <select
                      name="agencyId"
                      value={formData.agencyId}
                      onChange={handleChange}
                      className={STYLES.select}
                    >
                      <option value="" disabled>
                        Sélectionner une agence...
                      </option>
                      {availableAgencies.map((agency) => (
                        <option key={agency.id} value={agency.id}>
                          {agency.name}
                        </option>
                      ))}
                    </select>
                    {availableAgencies.length === 0 && (
                      <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                        ⚠️ Aucune agence trouvée. Veuillez d'abord créer une
                        agence.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={STYLES.label}>Prénom</label>
                    <input
                      name="firstname"
                      className={STYLES.input}
                      onChange={handleChange}
                      value={formData.firstname}
                      placeholder="Ex: Paul"
                    />
                  </div>
                  <div>
                    <label className={STYLES.label}>Nom</label>
                    <input
                      name="lastname"
                      className={STYLES.input}
                      onChange={handleChange}
                      value={formData.lastname}
                      placeholder="Ex: Durand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="relative">
                    <label className={STYLES.label}>Email (Auto)</label>
                    <input
                      value={formData.email}
                      readOnly
                      className={`${STYLES.input} ${STYLES.inputReadOnly}`}
                    />
                  </div>
                  <div>
                    <label className={STYLES.label}>Téléphone</label>
                    <input
                      name="phone"
                      className={STYLES.input}
                      onChange={handleChange}
                      value={formData.phone}
                      placeholder="06..."
                      maxLength={10}
                    />
                  </div>
                </div>

                {/* UPLOAD PROFIL */}
                <div>
                  <label className={STYLES.label}>Photo de profil</label>
                  <div className={STYLES.uploadBox}>
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
                        onClientUploadComplete={(res) => {
                          if (res && res[0]) setImageUrl(res[0].url);
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
                {serverError && (
                  <div className={STYLES.errorBox}>
                    <p className="text-red-500 text-sm">{serverError}</p>
                  </div>
                )}
              </div>
            )}

            {/* --- ETAPE 2 --- */}
            {currentStep === 2 && (
              <div className={STYLES.formSpaceY}>
                <div className="flex items-center gap-2 text-xl text-white mb-4">
                  <MapPin className="text-barth-gold" /> <span>Secteurs</span>
                </div>

                <div className="relative">
                  <label className={STYLES.label}>Ville Principale</label>
                  <input
                    name="city"
                    className={STYLES.input}
                    onChange={handleMainCityChange}
                    value={formData.city}
                    placeholder="Rechercher..."
                    autoComplete="off"
                  />
                  {citySuggestions.length > 0 && (
                    <div className={STYLES.suggestionsList}>
                      {citySuggestions.map((c, i) => (
                        <div
                          key={i}
                          className={STYLES.suggestionItem}
                          onClick={() => selectMainCity(c)}
                        >
                          {c.nom} ({c.codesPostaux[0]})
                        </div>
                      ))}
                    </div>
                  )}
                  {showZipInput && !isValidatedCity && (
                    <input
                      name="zipCode"
                      className={`${STYLES.input} mt-2`}
                      onChange={handleChange}
                      value={formData.zipCode}
                      placeholder="Code Postal"
                    />
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <label className={STYLES.label}>
                    Photo de couverture (Ville)
                  </label>
                  <div className={STYLES.uploadBox}>
                    {cityImageUrl ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden">
                        <Image
                          src={cityImageUrl}
                          alt="Ville"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setCityImageUrl("")}
                          className="absolute top-2 right-2 bg-black/60 p-1 rounded-full text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <UploadButton
                        endpoint="imageUploader"
                        onClientUploadComplete={(res) => {
                          if (res && res[0]) setCityImageUrl(res[0].url);
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

                <div className="mt-4">
                  <label className={STYLES.label}>Secteurs Secondaires</label>
                  <div className="relative">
                    <input
                      value={secondaryQuery}
                      onChange={handleSecondaryCityChange}
                      className={STYLES.input}
                      placeholder="Ajouter..."
                    />
                    {secondarySuggestions.length > 0 && (
                      <div className={STYLES.suggestionsList}>
                        {secondarySuggestions.map((c, i) => (
                          <div
                            key={i}
                            className={STYLES.suggestionItem}
                            onClick={() => addSecondaryCity(c)}
                          >
                            {c.nom}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={STYLES.chipsContainer}>
                    {secondaryCitiesList.map((c, i) => (
                      <div key={i} className={STYLES.chip}>
                        {c.name}{" "}
                        <button
                          type="button"
                          onClick={() => removeSecondaryCity(i)}
                          className={STYLES.chipRemove}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- ETAPE 3 --- */}
            {currentStep === 3 && (
              <div className={STYLES.formSpaceY}>
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
                    placeholder="Instagram"
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
                    placeholder="Linkedin"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-3 font-bold text-white text-xs">
                    Tk
                  </div>
                  <input
                    name="tiktok"
                    className={`${STYLES.input} ${STYLES.inputIconPadding}`}
                    onChange={handleChange}
                    value={formData.tiktok}
                    placeholder="TikTok"
                  />
                </div>
              </div>
            )}

            {/* --- ETAPE 4 --- */}
            {currentStep === 4 && (
              <div className={STYLES.formSpaceY}>
                <label className={STYLES.label}>Biographie</label>
                <textarea
                  name="bio"
                  rows={8}
                  className={`${STYLES.input} resize-none`}
                  onChange={handleChange}
                  value={formData.bio}
                  placeholder="Votre histoire..."
                />
                <p className="text-right text-xs text-gray-500">
                  {formData.bio.length} caractères
                </p>
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
