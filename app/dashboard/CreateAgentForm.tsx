"use client"; // Indispensable pour l'interactivité

import { useState } from "react";
import { UploadButton } from "@/app/utils/uploadthing"; // Notre bouton importé
import { createAgent } from "../actions";
import styles from "./dashboard.module.css";

export default function CreateAgentForm() {
  const [imageUrl, setImageUrl] = useState("");

  return (
    <div className={styles.panel}>
      <h2 className={styles.subtitle}>Ajouter un Agent</h2>

      <form action={createAgent}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Prénom Nom</label>
          <input
            name="name"
            type="text"
            required
            placeholder="Ex: Paul Durand"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Sous-domaine (URL)</label>
          <input
            name="subdomain"
            type="text"
            required
            placeholder="paul"
            className={styles.input}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Ville</label>
            <input
              name="city"
              type="text"
              required
              placeholder="Nantes"
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Téléphone</label>
            <input
              name="phone"
              type="text"
              required
              placeholder="06..."
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Bio</label>
          <textarea
            name="bio"
            rows={3}
            placeholder="Description..."
            className={styles.textarea}
          ></textarea>
        </div>

        {/* --- ZONE PHOTO MODIFIÉE --- */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Photo de profil</label>

          {imageUrl ? (
            // Si une image est uploadée, on l'affiche
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <img
                src={imageUrl}
                alt="Aperçu"
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
              <p style={{ fontSize: "0.8rem", color: "green" }}>
                Image chargée !
              </p>
            </div>
          ) : (
            // Sinon, on affiche le bouton d'upload
            <div
              style={{
                border: "1px dashed #ccc",
                padding: "1rem",
                borderRadius: "8px",
              }}
            >
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  // Quand c'est fini, on récupère l'URL
                  console.log("Fichiers: ", res);
                  setImageUrl(res[0].url);
                  alert("Upload réussi !");
                }}
                onUploadError={(error: Error) => {
                  alert(`ERREUR: ${error.message}`);
                }}
              />
            </div>
          )}

          {/* L'astuce : Un champ caché qui contient l'URL pour l'envoyer au serveur */}
          <input type="hidden" name="photo" value={imageUrl} />
        </div>
        {/* --------------------------- */}

        <button type="submit" className={styles.submitButton}>
          Créer le site agent
        </button>
      </form>
    </div>
  );
}
