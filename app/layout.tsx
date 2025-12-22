import type { Metadata } from "next";
import "./globals.css";
// 1. Import de Clerk
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations"; // Pour l'avoir en français !

export const metadata: Metadata = {
  title: "Barth Platform",
  description: "Plateforme immobilière",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 2. On enveloppe TOUT le HTML dans ClerkProvider
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
