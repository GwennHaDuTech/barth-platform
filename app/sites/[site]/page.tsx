import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import styles from "./agent.module.css";

// Fonction pour récupérer l'agent
async function getAgent(subdomain: string) {
  const cleanSubdomain = decodeURIComponent(subdomain).toLowerCase();

  const agent = await prisma.agent.findUnique({
    where: { subdomain: cleanSubdomain },
    // ❌ J'ai supprimé la ligne "include: { listings: true }" qui faisait planter
  });

  return agent;
}

// --- CORRECTION NEXT.JS 15 ---
type Props = {
  params: Promise<{ site: string }>;
};

export default async function AgentSitePage(props: Props) {
  // 1. On attend que les params soient chargés
  const params = await props.params;
  const site = params.site;

  // 2. On récupère l'agent
  const agent = await getAgent(site);

  if (!agent) {
    notFound();
  }

  // Fallback photo si pas de photo
  const photoUrl =
    agent.photo ||
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80";

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
          <a href="#" className={styles.navLink}>
            {agent.city || "Agence"}
          </a>
          <a href="#about" className={styles.navLink}>
            Qui suis-je ?
          </a>
          <a href="#mandats" className={styles.navLink}>
            Mes Mandats
          </a>
          <a href="#contact" className={styles.ctaButton}>
            ESTIMATION GRATUITE
          </a>
        </nav>
      </header>

      {/* --- HERO SECTION --- */}
      <section
        className={styles.hero}
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1600596542815-e32870026fcf?q=80&w=2074&auto=format&fit=crop')`,
        }}
      >
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            {`L'expertise immobilière locale au service de vos projets à ${
              agent.city || "votre ville"
            }`}
          </h1>
          <p className={styles.heroSubtitle}>
            {`${agent.name}, votre partenaire privilégié pour l'achat, la vente et l'estimation.`}
          </p>
          <a href="#contact" className={styles.heroButton}>
            {`PRENDRE RENDEZ-VOUS`}
          </a>
        </div>
      </section>

      {/* --- SERVICES --- */}
      <section className={styles.servicesSection}>
        {/* Carte Blanche */}
        <div className={styles.cardWhite}>
          <h3 className={styles.cardTitle}>Vendre votre bien</h3>
          <p className={styles.cardText}>
            {`Profitez d'une stratégie de commercialisation personnalisée pour valoriser votre propriété.`}
          </p>
        </div>

        {/* Carte Dorée */}
        <div className={styles.cardGold}>
          <h3 className={styles.cardTitleWhite}>Estimation Offerte</h3>
          <p className={styles.cardTextWhite}>
            Obtenez une estimation précise et gratuite de votre bien à{" "}
            {agent.city || "domicile"}.
          </p>
          <a href="#contact" className={styles.cardButtonWhite}>
            DEMANDER MON ESTIMATION
          </a>
        </div>
      </section>

      {/* --- QUI SUIS-JE --- */}
      <section id="about" className={styles.aboutSection}>
        <div className={styles.aboutTextCol}>
          <h2 className={styles.sectionTitleLeft}>
            Qui suis-je ? <br />
            {agent.name}
          </h2>
          <p className={styles.text}>
            {agent.bio ||
              "Agent commercial passionné, je mets ma connaissance approfondie du marché local à votre disposition. Mon objectif est de simplifier votre transaction immobilière en toute transparence."}
          </p>
          <div className={styles.contactInfo}>
            <p>
              <strong>Email :</strong> {agent.email}
            </p>
            <p>
              <strong>Téléphone :</strong> {agent.phone || "Non renseigné"}
            </p>
          </div>
        </div>
        <div className={styles.aboutImageCol}>
          <img
            src={photoUrl}
            alt={agent.name}
            className={styles.profileImage}
          />
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer id="contact" className={styles.footer}>
        <div className={styles.copyright}>
          © 2025 Cabinet BARTH - {agent.name}. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
