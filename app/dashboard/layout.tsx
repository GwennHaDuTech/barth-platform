// app/dashboard/layout.tsx
import { currentUser } from "@clerk/nextjs/server"; // Note l'import /server pour les composants serveur
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar"; // Assure-toi que le chemin est bon
import styles from "./dashboard.module.css"; // Si tu as du CSS spécifique
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Récupérer l'utilisateur connecté via Clerk
  const user = await currentUser();

  // 2. Si personne n'est connecté, rediriger vers la page de connexion
  if (!user) {
    redirect("/sign-in");
  }

  // 3. LA SÉCURITÉ : Vérifier l'email
  // On regarde si l'un des emails de l'utilisateur correspond à l'admin
  const adminEmail = "theoonun@gmail.com";
  const isAdmin = user.emailAddresses.some(
    (email) => email.emailAddress === adminEmail
  );

  // 4. Si ce n'est pas Théo, on affiche une page "Interdit"
  if (!isAdmin) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#1a1a1a] text-white">
        <h1 className="text-3xl font-bold text-red-500 mb-4">
          Accès Refusé 🚫
        </h1>
        <p className="text-gray-400">
          {`Vous n'avez pas les droits pour accéder au tableau de bord.`}
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2 bg-[#D4AF37] text-black rounded-full font-bold hover:scale-105 transition"
        >
          {`Retour à l'accueil`}
        </Link>
      </div>
    );
  }

  // 5. Si c'est Théo, on affiche le Dashboard avec la Sidebar
  return (
    <div className="flex min-h-screen bg-[#1a1a1a]">
      {/* La Sidebar s'affichera à gauche */}
      <Sidebar />

      {/* Le contenu des pages (page.tsx, users/page.tsx, etc.) s'affichera ici */}
      <main className="flex-1 ml-20 md:ml-20 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
