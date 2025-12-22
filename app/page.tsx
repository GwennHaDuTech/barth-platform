import React from "react";
import styles from "./home.module.css";
import Link from "next/link";
// Imports Clerk pour l'interface
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Barth Platform</h1>

        {/* ... (Le reste du texte ne change pas) ... */}

        <div className="flex justify-center my-8">
          {/* CAS 1 : L'utilisateur N'EST PAS connecté */}
          <SignedOut>
            <SignInButton mode="modal">
              <button className={styles.adminLink}>Se connecter (Admin)</button>
            </SignInButton>
          </SignedOut>

          {/* CAS 2 : L'utilisateur EST connecté */}
          <SignedIn>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Link href="/dashboard" className={styles.adminLink}>
                Aller au Dashboard →
              </Link>
              {/* Le petit rond avec ton avatar pour se déconnecter */}
              <UserButton />
            </div>
          </SignedIn>
        </div>

        {/* ... (La liste des agents reste ici) ... */}
      </div>
    </div>
  );
}
