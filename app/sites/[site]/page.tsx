import React from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import styles from "./agent.module.css";
import prisma from "@/lib/prisma"; // <-- Import de la vraie connexion BDD

export default async function AgentPage({
  params,
}: {
  params: Promise<{ site: string }>;
}) {
  const resolvedParams = await params;
  const subdomain = resolvedParams.site;

  // --- APPEL BASE DE DONNÉES (SQL) ---
  // On demande à Prisma : "Trouve l'agent qui a ce sous-domaine ET donne-moi ses annonces"
  const data = await prisma.agent.findUnique({
    where: { subdomain: subdomain },
    include: { listings: true },
  });

  // Si l'agent n'est pas dans la base de données -> 404
  if (!data) {
    return notFound();
  }

  return (
    <div className={styles.pageContainer}>
      {/* HEADER */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <span className={styles.brandName}>BARTH IMMOBILIER</span>
          <span className={styles.agencyLocation}>Agence de {data.city}</span>
        </div>
      </nav>

      {/* HERO */}
      <header className={styles.heroSection}>
        <div className={`${styles.container} ${styles.heroContent}`}>
          <div className={styles.heroImageWrapper}>
            <Image
              src={data.photo}
              alt={data.name}
              width={160}
              height={160}
              className={styles.heroImage}
              priority
            />
          </div>

          <div>
            <h1 className={styles.agentName}>{data.name}</h1>
            <p className={styles.agentCity}>Expert à {data.city}</p>
            <p className={styles.agentBio}>{data.bio}</p>
            <div className="mt-6">
              <a href={`tel:${data.phone}`} className={styles.contactButton}>
                Me contacter : {data.phone}
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* LISTINGS */}
      <main className={`${styles.container} ${styles.listingsSection}`}>
        <h2 className={styles.sectionTitle}>Mes biens en vente</h2>

        {/* S'il n'y a pas d'annonces, on affiche un petit message */}
        {data.listings.length === 0 && (
          <p className="text-gray-500 italic">
            Aucun bien en vente pour le moment.
          </p>
        )}

        <div className={styles.grid}>
          {data.listings.map((bien) => (
            <div key={bien.id} className={styles.card}>
              <div className={styles.cardImageWrapper}>
                <Image
                  src={bien.img}
                  alt={bien.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={styles.cardImage}
                />
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{bien.title}</h3>
                <p className={styles.cardPrice}>{bien.price}</p>
                <button className={styles.cardButton}>Voir le détail</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <p>© 2025 Barth Immobilier - {data.name}</p>
        <p className={styles.footerSub}>Membre du réseau Barth</p>
      </footer>
    </div>
  );
}
