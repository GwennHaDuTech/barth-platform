"use client";

import { useState, useEffect } from "react";
// ⚠️ Vérifie que le chemin est correct selon ton projet
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
} from "lucide-react";
import { createAgent, checkAgentDuplication } from "@/app/actions";
import Image from "next/image";
import { toast } from "sonner";

// 👇 Import du CSS Module (Le fichier Pure CSS)
import styles from "./CreateAgentForm.module.css";

interface AgentFormData {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  photo: string;
  city: string;
  secondarySector: string;
  instagram: string;
  linkedin: string;
  tiktok: string;
  bio: string;
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
    secondarySector: "",
    instagram: "",
    linkedin: "",
    tiktok: "",
    bio: "",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState(loadingMessages[0]);
  const [isChecking, setIsChecking] = useState(false);

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

  const validateStep = (step: number) => {
    const d = formData;
    switch (step) {
      case 1:
        return !!(d.firstname && d.lastname && d.phone && imageUrl);
      case 2:
        return !!(d.city && d.secondarySector);
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
      toast.error("Champs manquants", {
        description: "Merci de compléter l'étape actuelle.",
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
        if (key !== "photo") dataToSend.append(key, value);
      });
      dataToSend.append("photo", imageUrl);

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
            {/* ÉTAPE 1 */}
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

            {/* ÉTAPE 2 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xl text-white mb-4">
                  <MapPin className="text-barth-gold" /> <span>Secteurs</span>
                </div>
                <div>
                  <label className={styles.label}>Secteur Principal</label>
                  <input
                    name="city"
                    className={styles.input}
                    onChange={handleChange}
                    value={formData.city}
                    placeholder="Ex: Rennes Centre"
                  />
                  <p className={styles.helperText}>Ville principale.</p>
                </div>
                <div>
                  <label className={styles.label}>Secteur Secondaire</label>
                  <input
                    name="secondarySector"
                    className={styles.input}
                    onChange={handleChange}
                    value={formData.secondarySector}
                    placeholder="Ex: Saint-Grégoire"
                  />
                  <p className={styles.helperText}>Zone élargie.</p>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 */}
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

            {/* ÉTAPE 4 */}
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
