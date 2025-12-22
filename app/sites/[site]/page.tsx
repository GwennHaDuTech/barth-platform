import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import styles from "./agent.module.css";

// Fonction pour récupérer l'agent
async function getAgent(subdomain: string) {
  const cleanSubdomain = decodeURIComponent(subdomain).toLowerCase();

  const agent = await prisma.agent.findUnique({
    where: { subdomain: cleanSubdomain },
    include: { listings: true },
  });

  return agent;
}

// --- CORRECTION NEXT.JS 15 ---
// On définit le type de props où params est une Promise
type Props = {
  params: Promise<{ site: string }>;
};

export default async function AgentSitePage(props: Props) {
  // 1. On attend (await) que les params soient chargés
  const params = await props.params;
  const site = params.site;

  // 2. On récupère l'agent
  const agent = await getAgent(site);

  if (!agent) {
    notFound();
  }

  // Fallback photo
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
            {agent.city}
          </a>
          <a href="#about" className={styles.navLink}>
            Qui suis-je ?
          </a>
          <a href="#mandats" className={styles.navLink}>
            Mes Mandats
          </a>
          <a href="#sales" className={styles.navLink}>
            Ventes Récentes
          </a>
          <a href="#contact" className={styles.ctaButton}>
            ESTIMATION GRATUITE
          </a>
        </nav>
      </header>

      {/* --- HERO SECTION --- */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            {"L'expertise immobilière locale au service de vos projets à "}
            {agent.city}
          </h1>
          <p className={styles.heroSubtitle}>
            {agent.name}
            {
              ", votre partenaire privilégié pour l'achat, la vente et l'estimation de votre bien."
            }
          </p>
          <a href="#mandats" className={styles.heroButton}>
            {"VOIR LES BIENS À VENDRE"}
          </a>
        </div>
      </section>

      {/* --- SERVICES --- */}
      <section className={styles.servicesSection}>
        {/* Carte Blanche */}
        <div className={styles.cardWhite}>
          <h3 className={styles.cardTitle}>Vendre votre bien</h3>
          <p className={styles.cardText}>
            {
              "Profitez d'une stratégie de commercialisation personnalisée pour valoriser votre propriété et atteindre le meilleur prix."
            }
          </p>
          <a href="#contact" className={styles.cardLink}>
            DÉCOUVRIR LES SERVICES DE BARTH IMMOBILIER
          </a>
        </div>

        {/* Carte Dorée */}
        <div className={styles.cardGold}>
          <h3 className={styles.cardTitleWhite}>Estimation Offerte</h3>
          <p className={styles.cardTextWhite}>
            {
              "Obtenez une estimation précise et gratuite de votre maison ou appartement à "
            }
            {agent.city}
            {", basée sur le marché local."}
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
            Qui suis-je ? {agent.name}
          </h2>
          <p className={styles.text}>
            {agent.bio ||
              "Agent commercial passionné, je mets ma connaissance approfondie du marché local à votre disposition. Mon objectif est de simplifier votre transaction immobilière, en vous offrant un accompagnement humain, transparent et efficace de A à Z."}
          </p>
          <p className={styles.quote}>
            {
              "Pour moi, l'immobilier, c'est avant tout une histoire de confiance et de proximité."
            }
          </p>
          <a href="#contact" className={styles.outlineButton}>
            CONTACTEZ-MOI
          </a>
        </div>
        <div className={styles.aboutImageCol}>
          <img
            src={photoUrl}
            alt={agent.name}
            className={styles.profileImage}
          />
        </div>
      </section>

      {/* --- SEO / VILLE --- */}
      <section className={styles.citySection}>
        <h2 className={styles.sectionTitleCenter}>
          {agent.city}
          {" : Vivre en première couronne"}
        </h2>
        <p className={styles.textCenter}>
          {agent.city}
          {
            " est une commune prisée, offrant une qualité de vie exceptionnelle : dynamisme économique, excellentes infrastructures (écoles, commerces), et un cadre verdoyant. Un emplacement idéal, conjuguant calme résidentiel et proximité de la métropole."
          }
        </p>
        <p className={styles.goldText}>
          {
            "Le Saviez-vous ? Le prix moyen au mètre carré y est l'un des plus élevés du secteur."
          }
        </p>
      </section>

      {/* --- MANDATS (Placeholder) --- */}
      <section id="mandats" className={styles.listingsSection}>
        <h2 className={styles.sectionTitleCenter}>Mes Mandats en Cours</h2>
        <div className={styles.divider}></div>

        <div className={styles.emptyState}>
          <p>
            <i>
              {"(Exemple de carte de bien : Appartement T3, 85m², 350 000 €, "}
              {agent.city}
              {")"}
            </i>
          </p>
          <p>... Retrouvez ici tous les détails de mes exclusivités.</p>
        </div>
      </section>

      {/* --- VENTES (Placeholder) --- */}
      <section id="sales" className={styles.salesSection}>
        <h2 className={styles.sectionTitleCenter}>
          {"Ventes Récentes à "}
          {agent.city}
        </h2>
        <div className={styles.divider}></div>

        <div className={styles.emptyState}>
          <p>
            {
              "Témoignages de mon expertise et de ma connaissance du prix du marché local."
            }
          </p>
          <p>
            <i>
              {
                "(Exemple : Maison 5 pièces - Vendu en 15 jours | Appartement T2 - Prix atteint à 99% de l'estimation)"
              }
            </i>
          </p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer id="contact" className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.contactBlock}>
            <h4>Contactez {agent.name}</h4>
            <p>Téléphone : {agent.phone}</p>
            <p>Email : contact@{agent.subdomain}.barth-immo.fr</p>
            <p>Siret : 123 456 789 00012</p>
          </div>
        </div>
        <div className={styles.copyright}>
          © 2025 {agent.name} Immobilier. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
