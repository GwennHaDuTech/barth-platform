"use client";

import { useState, useEffect } from "react";
// ⚠️ Vérifie le chemin
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
  Plus, // Pour l'ajout de ville
  ImageIcon, // Icône pour la nouvelle section photo
} from "lucide-react";
import { createAgent, checkAgentDuplication } from "@/app/actions";
import Image from "next/image";
import { toast } from "sonner";

import styles from "./CreateAgentForm.module.css";

interface AgentFormData {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  photo: string; // Photo de profil (Step 1)
  city: string;
  zipCode: string;
  cityPhotoUrl: string; // NOUVEAU : Photo de la ville (Step 2)
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
  "Configuration des réseaux sociaux... 🌐",
  "Optimisation du SEO local... 📍",
  "Ton site va être incroyable ✨",
];

export default function CreateAgentForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<AgentFormData>({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    photo: "",
    city: "",
    zipCode: "",
    cityPhotoUrl: "", // Init vide
    secondarySector: "",
    instagram: "",
    linkedin: "",
    tiktok: "",
    bio: "",
  });

  // État pour la photo de profil (Step 1)
  const [imageUrl, setImageUrl] = useState("");
  // NOUVEAU : État pour la photo de la ville (Step 2)
  const [cityImageUrl, setCityImageUrl] = useState("");

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState(loadingMessages[0]);
  const [isChecking, setIsChecking] = useState(false);

  // --- GESTION VILLE PRINCIPALE ---
  const [citySuggestions, setCitySuggestions] = useState<GeoCity[]>([]);
  const [showZipInput, setShowZipInput] = useState(false);
  const [isValidatedCity, setIsValidatedCity] = useState(false);

  // --- GESTION VILLES SECONDAIRES (Tags) ---
  const [secondaryQuery, setSecondaryQuery] = useState("");
  const [secondarySuggestions, setSecondarySuggestions] = useState<GeoCity[]>(
    []
  );
  const [secondaryCitiesList, setSecondaryCitiesList] = useState<
    SelectedCity[]
  >([]);

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

  // FONCTION DE RECHERCHE API (Générique)
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

  // Gestion changement Input Ville Principale
  const handleMainCityChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, city: value, zipCode: "" }));
    setIsValidatedCity(false);

    const results = await searchApiGeo(value);
    setCitySuggestions(results);

    // Si pas de résultat après 3 lettres, on propose le zip manuel
    if (value.length >= 3 && results.length === 0) setShowZipInput(true);
    else setShowZipInput(false);
  };

  // Gestion changement Input Ville Secondaire
  const handleSecondaryCityChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setSecondaryQuery(value);
    const results = await searchApiGeo(value);
    setSecondarySuggestions(results);
  };

  // Sélection Ville Principale
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

  // Ajout Ville Secondaire (Tag)
  const addSecondaryCity = (city: GeoCity) => {
    const newCity: SelectedCity = {
      name: city.nom,
      zip: city.codesPostaux[0] || "",
    };

    // Éviter les doublons dans la liste
    if (!secondaryCitiesList.some((c) => c.name === newCity.name)) {
      const newList = [...secondaryCitiesList, newCity];
      setSecondaryCitiesList(newList);
      updateSecondarySectorString(newList);
    }

    setSecondaryQuery(""); // Reset input
    setSecondarySuggestions([]); // Reset liste
  };

  // Suppression Ville Secondaire
  const removeSecondaryCity = (indexToRemove: number) => {
    const newList = secondaryCitiesList.filter(
      (_, index) => index !== indexToRemove
    );
    setSecondaryCitiesList(newList);
    updateSecondarySectorString(newList);
  };

  // Convertit la liste de tags en string pour la BDD
  const updateSecondarySectorString = (list: SelectedCity[]) => {
    // Ex: "Cesson (35510), Betton (35830)"
    const formatted = list.map((c) => `${c.name} (${c.zip})`).join(", ");
    setFormData((prev) => ({ ...prev, secondarySector: formatted }));
  };

  const validateStep = (step: number) => {
    const d = formData;
    switch (step) {
      case 1:
        return !!(d.firstname && d.lastname && d.phone && imageUrl);
      case 2:
        // Ville principale + Zip + Au moins 1 secondaire + PHOTO VILLE (Nouveau)
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
      // Message d'erreur générique, peut être affiné selon l'étape
      let errorMsg = "Merci de compléter l'étape actuelle.";
      if (currentStep === 2 && !cityImageUrl)
        errorMsg = "N'oubliez pas la photo de couverture de la ville.";

      toast.error("Champs manquants", {
        description: errorMsg,
      });
      return;
    }
    setServerError(null);

    if (currentStep === 1) {
      setIsChecking(true);
      try {
        const isTaken = await checkAgentDuplication(
          formData.firstname,
          formData.lastname
        );
        if (isTaken) {
          setServerError("Ce nom existe déjà. Ajoute un chiffre (ex: Paul 2).");
          setIsChecking(false);
          toast.warning("Doublon détecté");
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
      if (name === "firstname" || name === "lastname") {
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
        // On n'ajoute pas les champs "photo" et "cityPhotoUrl" ici car ils sont vides dans formData
        if (key !== "photo" && key !== "cityPhotoUrl") {
          dataToSend.append(key, value);
        }
      });
      // On ajoute les vraies URLs des images uploadées
      dataToSend.append("photo", imageUrl); // Photo profil
      dataToSend.append("cityPhotoUrl", cityImageUrl); // NOUVEAU : Photo ville

      const result = await createAgent(dataToSend);

      if (result && !result.success) {
        setServerError(result.error || "Erreur serveur.");
        setIsSubmitting(false);
        toast.error("Erreur", { description: result.error });
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 8000));
      toast.success("Site créé ! ✨");
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
      className={`${styles.container} ${
        isSubmitting ? styles.modeLoading : styles.modeForm
      }`}
    >
      {!isSubmitting && (
        <>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
          <div className="mb-8">
            <h2 className={styles.title}>
              Nouveau site <span className={styles.goldText}>Agent</span>
            </h2>
            <div className={styles.progressContainer}>
              <div
                className={styles.progressBar}
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
                Création en cours...
              </h3>
              <p
                key={loadingText}
                className="text-gray-400 font-light text-sm animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[280px] mx-auto leading-relaxed"
              >
                {loadingText}
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
          >
            {/* ÉTAPE 1 : IDENTITÉ */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xl text-white mb-4">
                  <User className="text-barth-gold" /> <span>Identité</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={styles.label}>Prénom</label>
                    <input
                      name="firstname"
                      className={styles.input}
                      onChange={handleChange}
                      value={formData.firstname}
                      placeholder="Ex: Paul"
                    />
                  </div>
                  <div>
                    <label className={styles.label}>Nom</label>
                    <input
                      name="lastname"
                      className={styles.input}
                      onChange={handleChange}
                      value={formData.lastname}
                      placeholder="Ex: Durand"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="relative group">
                    <label className={styles.label}>Email Pro</label>
                    <div className="relative">
                      <input
                        value={formData.email}
                        readOnly
                        className={`${styles.input} ${styles.inputReadOnly}`}
                      />
                      <Lock
                        size={16}
                        className="absolute right-4 top-3 text-gray-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={styles.label}>Téléphone</label>
                    <input
                      name="phone"
                      className={styles.input}
                      onChange={handleChange}
                      value={formData.phone}
                      placeholder="0612345678"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div>
                  <label className={styles.label}>
                    Photo de profil (Obligatoire)
                  </label>
                  <div className={styles.uploadBox}>
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
                  <div className={styles.errorBox}>
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
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xl text-white mb-4">
                  <MapPin className="text-barth-gold" />{" "}
                  <span>Secteurs & Image</span>
                </div>

                {/* --- VILLE PRINCIPALE --- */}
                <div className="relative">
                  <label className={styles.label}>
                    Secteur Principal (Ville)
                  </label>
                  <input
                    name="city"
                    className={styles.input}
                    onChange={handleMainCityChange}
                    value={formData.city}
                    placeholder="Tapez une ville..."
                    autoComplete="off"
                  />
                  {/* Suggestions Principales */}
                  {citySuggestions.length > 0 && !isValidatedCity && (
                    <div className={styles.suggestionsList}>
                      {citySuggestions.map((city, index) => (
                        <div
                          key={index}
                          className={styles.suggestionItem}
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
                    <div className={styles.validatedBadge}>
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
                        className={styles.input}
                        onChange={handleChange}
                        value={formData.zipCode}
                        placeholder="Ex: 35760"
                        maxLength={5}
                      />
                    </div>
                  )}
                </div>

                {/* --- NOUVEAU : UPLOAD PHOTO VILLE --- */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="text-barth-gold" size={18} />
                    <label className={styles.label} style={{ marginBottom: 0 }}>
                      Photo de couverture (Ville Principale)
                    </label>
                  </div>

                  <div className={styles.uploadBox}>
                    {cityImageUrl ? (
                      // Prévisualisation en mode "Bannière" large
                      <div className="relative w-full h-32 rounded-lg overflow-hidden group">
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
                  <p className={styles.helperText}>
                    {` Cette image servira de grande bannière sur le site de
                    l'agent. Choisissez une photo de bonne qualité
                    représentative du secteur.`}
                  </p>
                </div>

                {/* --- SECTEURS SECONDAIRES (TAGS) --- */}
                <div className="relative mt-6">
                  <label className={styles.label}>
                    Secteurs Secondaires (Ajouter plusieurs)
                  </label>
                  <div className="relative">
                    <input
                      value={secondaryQuery}
                      onChange={handleSecondaryCityChange}
                      className={styles.input}
                      placeholder="Ajouter une ville (ex: Betton) puis valider..."
                      autoComplete="off"
                    />
                    <div className="absolute right-4 top-3 text-gray-500 pointer-events-none">
                      <Plus size={20} />
                    </div>
                  </div>

                  {/* Suggestions Secondaires */}
                  {secondarySuggestions.length > 0 && (
                    <div
                      className={styles.suggestionsList}
                      style={{ zIndex: 60 }}
                    >
                      {secondarySuggestions.map((city, index) => (
                        <div
                          key={index}
                          className={styles.suggestionItem}
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

                  {/* Liste des Tags (Chips) */}
                  <div className={styles.chipsContainer}>
                    {secondaryCitiesList.map((city, index) => (
                      <div key={index} className={styles.chip}>
                        <span>
                          {city.name}{" "}
                          <span className="opacity-70 text-[10px]">
                            ({city.zip})
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSecondaryCity(index)}
                          className={styles.chipRemove}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {secondaryCitiesList.length === 0 && (
                      <p className="text-xs text-gray-500 italic mt-1">
                        Aucun secteur secondaire ajouté.
                      </p>
                    )}
                  </div>
                  <input
                    type="hidden"
                    name="secondarySector"
                    value={formData.secondarySector}
                  />
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : RÉSEAUX */}
            {currentStep === 3 && (
              <div className="space-y-6">
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
                      className={`${styles.input} ${styles.inputIconPadding}`}
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
                      className={`${styles.input} ${styles.inputIconPadding}`}
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
                      className={`${styles.input} ${styles.inputIconPadding}`}
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
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xl text-white mb-4">
                  <FileText className="text-barth-gold" />{" "}
                  <span>Biographie</span>
                </div>
                <div>
                  <label className={styles.label}>Ta présentation (SEO)</label>
                  <textarea
                    name="bio"
                    rows={8}
                    className={`${styles.input} resize-none ${
                      formData.bio.length > 0 && formData.bio.length <= 20
                        ? styles.inputError
                        : ""
                    }`}
                    onChange={handleChange}
                    value={formData.bio}
                    placeholder="Votre histoire..."
                  />
                  <div className="flex justify-between items-center mt-2">
                    {formData.bio.length > 0 && formData.bio.length <= 20 ? (
                      <p className="text-xs text-red-400 font-medium animate-pulse flex items-center gap-1">
                        <AlertCircle size={12} /> Encore{" "}
                        {21 - formData.bio.length} caractères.
                      </p>
                    ) : (
                      <span></span>
                    )}
                    <p
                      className={`text-xs transition-colors duration-300 ${
                        formData.bio.length > 20
                          ? styles.bioCounterValid
                          : styles.bioCounterInvalid
                      }`}
                    >
                      {formData.bio.length} caractères
                    </p>
                  </div>
                </div>
                {serverError && (
                  <div className={styles.errorBox}>
                    <AlertCircle
                      className="text-red-500 shrink-0 mt-0.5"
                      size={18}
                    />
                    <p className="text-red-500 text-sm">{serverError}</p>
                  </div>
                )}
              </div>
            )}
          </form>
        )}
      </div>

      {!isSubmitting && (
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className={styles.btnBack}
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
              className={styles.btnNext}
            >
              {isChecking && <Loader2 size={16} className="animate-spin" />}{" "}
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!validateStep(4)}
              className={styles.btnSubmit}
            >
              {`Créer l'agent ✨`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
