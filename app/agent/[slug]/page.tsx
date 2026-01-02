import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import styles from "./agent.module.css";
import { MapPin, Phone, Mail, Instagram, Linkedin } from "lucide-react"; // Assure-toi d'avoir installé lucide-react

// Fonction pour récupérer l'agent via le SLUG
async function getAgent(slug: string) {
  // On nettoie le slug (ex: "jean-dupont")
  const cleanSlug = decodeURIComponent(slug).toLowerCase();

  const agent = await prisma.agent.findUnique({
    where: { slug: cleanSlug }, // ✅ On cherche bien par SLUG maintenant
  });

  return agent;
}

// --- TYPE NEXT.JS 15 ---
type Props = {
  params: Promise<{ slug: string }>; // Le dossier s'appelle [slug]
};

export default async function AgentSitePage(props: Props) {
  // 1. On attend que les params soient chargés
  const params = await props.params;
  const slug = params.slug;

  // 2. On récupère l'agent
  const agent = await getAgent(slug);

  if (!agent) {
    return notFound();
  }

  // --- VARIABLES D'AFFICHAGE ---
  const fullName = `${agent.firstname} ${agent.lastname}`;

  // Photo de profil ou fallback
  const photoUrl =
    agent.photo ||
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80";

  // Photo de VILLE (Celle de l'upload !) ou fallback immobilier
  const cityBackground =
    agent.cityPhoto ||
    "https://images.unsplash.com/photo-1600596542815-e32870026fcf?q=80&w=2074";

  return (
    <div className={styles.container}>
      {/* --- HEADER --- */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <div className={styles.logoTop}>CABINET IMMOBILIER</div>
          <div className={styles.logoMain}>BARTH</div>
        </div>

        <nav className={styles.nav}>
          <a href="#" className={styles.navLink}>
            Accueil
          </a>
          <a href="#about" className={styles.navLink}>
            {`L'Agent`}
          </a>
          <a href="#mandats" className={styles.navLink}>
            Nos Biens
          </a>
          <a href="#contact" className={styles.ctaButton}>
            ESTIMATION
          </a>
        </nav>
      </header>

      {/* --- HERO SECTION (AVEC TA PHOTO DE VILLE !) --- */}
      <section
        className={styles.hero}
        style={{
          // On applique un filtre sombre pour que le texte reste lisible
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${cityBackground}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            {" L'immobilier d'exception à "}
            <span style={{ color: "#bf9b30" }}>{agent.city}</span>
          </h1>
          <p className={styles.heroSubtitle}>
            {fullName}
            {`, votre expert local pour l'achat, la vente et
            l'estimation.`}
          </p>

          {/* Badges des secteurs */}
          <div className="flex gap-3 justify-center mt-6">
            <span className="bg-white/10 backdrop-blur-md px-4 py-1 rounded-full border border-white/20 text-sm text-white flex items-center gap-2">
              <MapPin size={14} /> {agent.zipCode || agent.city}
            </span>
            {agent.secondarySector && (
              <span className="bg-white/10 backdrop-blur-md px-4 py-1 rounded-full border border-white/20 text-sm text-white">
                + {agent.secondarySector}
              </span>
            )}
          </div>

          <a
            href="#contact"
            className={styles.heroButton}
            style={{ marginTop: "2rem" }}
          >
            PRENDRE RENDEZ-VOUS
          </a>
        </div>
      </section>

      {/* --- SERVICES --- */}
      <section className={styles.servicesSection}>
        <div className={styles.cardWhite}>
          <h3 className={styles.cardTitle}>Vendre</h3>
          <p className={styles.cardText}>
            Une stratégie marketing sur-mesure pour valoriser votre bien au
            meilleur prix.
          </p>
        </div>

        <div className={styles.cardGold}>
          <h3 className={styles.cardTitleWhite}>Estimation Offerte</h3>
          <p className={styles.cardTextWhite}>
            Connaître la valeur réelle de votre bien à {agent.city}.
          </p>
          <a href="#contact" className={styles.cardButtonWhite}>
            DEMANDER
          </a>
        </div>
      </section>

      {/* --- SECTION MANDATS (PLACEHOLDER POUR LA PROCHAINE ÉTAPE) --- */}
      <section id="mandats" className="py-20 px-6 bg-gray-50 text-center">
        <h2 className="text-3xl font-light text-gray-800 mb-10">
          Nos biens à la vente
        </h2>
        <div className="max-w-4xl mx-auto border-2 border-dashed border-gray-300 rounded-2xl p-12 bg-white">
          <p className="text-gray-400 text-lg italic">
            Les annonces immobilières seront intégrées ici prochainement.
          </p>
          <p className="text-sm text-gray-300 mt-2">
            Module Listings en cours de développement...
          </p>
        </div>
      </section>

      {/* --- QUI SUIS-JE --- */}
      <section id="about" className={styles.aboutSection}>
        <div className={styles.aboutTextCol}>
          <h2 className={styles.sectionTitleLeft}>
            Votre Agent <br />
            <span style={{ color: "#bf9b30" }}>{fullName}</span>
          </h2>
          <p className={styles.text}>
            {agent.bio ||
              `Passionné par l'immobilier et amoureux de ${agent.city}, je mets mon expertise et mon réseau à votre service. Mon approche est basée sur la confiance, la transparence et la réussite de votre projet de vie.`}
          </p>

          <div className={styles.contactInfo}>
            <p className="flex items-center gap-3 mb-2">
              <Mail className="text-barth-gold" size={20} /> {agent.email}
            </p>
            {agent.phone && (
              <p className="flex items-center gap-3">
                <Phone className="text-barth-gold" size={20} /> {agent.phone}
              </p>
            )}
          </div>

          {/* Réseaux Sociaux */}
          <div className="flex gap-4 mt-6">
            {agent.instagram && (
              <a
                href={`https://instagram.com/${agent.instagram}`}
                target="_blank"
                className="p-2 bg-gray-100 rounded-full hover:bg-[#bf9b30] hover:text-white transition"
              >
                <Instagram size={20} />
              </a>
            )}
            {agent.linkedin && (
              <a
                href={agent.linkedin}
                target="_blank"
                className="p-2 bg-gray-100 rounded-full hover:bg-[#bf9b30] hover:text-white transition"
              >
                <Linkedin size={20} />
              </a>
            )}
            {agent.tiktok && (
              <a
                href={`https://tiktok.com/@${agent.tiktok}`}
                target="_blank"
                className="p-2 bg-gray-100 rounded-full hover:bg-[#bf9b30] hover:text-white transition"
              >
                <div className="font-bold text-xs">Tk</div>
              </a>
            )}
          </div>
        </div>
        <div className={styles.aboutImageCol}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={fullName}
            className={styles.profileImage}
            style={{ objectFit: "cover" }}
          />
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer id="contact" className={styles.footer}>
        <div className={styles.copyright}>
          © 2025 Cabinet BARTH - {fullName}. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
