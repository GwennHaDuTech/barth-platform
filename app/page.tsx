import React from "react";
import Link from "next/link";
import Image from "next/image";
// Imports Clerk
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
// Imports UI
import GlassCard from "@/components/ui/GlassCard";
import { ArrowRight, LayoutDashboard, LogIn } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* --- 1. FOND D'ÉCRAN (Background) --- */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2600&auto=format&fit=crop"
          alt="Background"
          fill
          className="object-cover opacity-60" // Image de fond
          priority
        />
        {/* Dégradé noir par-dessus pour la lisibilité */}
        <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a] via-black/60 to-black/40" />
      </div>

      {/* --- 2. CONTENU CENTRAL (GlassCard) --- */}
      <div className="relative z-10 w-full max-w-lg p-6">
        <GlassCard className="p-10 flex flex-col items-center text-center backdrop-blur-xl bg-black/30 border-white/10 shadow-2xl">
          {/* Logo / Titre */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight mb-4">
              Barth <span className="font-bold text-barth-gold">Platform</span>
            </h1>
            <p className="text-gray-300 font-light text-sm md:text-base leading-relaxed">
              {`Plateforme de gestion centralisée pour le réseau d'agents. Pilotez
              la conformité et la performance en un clic.`}
            </p>
          </div>

          {/* Zone d'action (Connexion / Dashboard) */}
          <div className="w-full flex justify-center">
            {/* CAS 1 : NON CONNECTÉ */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="group relative px-8 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg hover:shadow-white/20">
                  <LogIn size={18} />
                  <span>Se connecter (Espace Admin)</span>
                  <ArrowRight
                    size={16}
                    className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300"
                  />
                </button>
              </SignInButton>
            </SignedOut>

            {/* CAS 2 : CONNECTÉ */}
            <SignedIn>
              <div className="flex flex-col items-center gap-6 w-full">
                {/* Bouton Dashboard */}
                <Link
                  href="/dashboard"
                  className="w-full group relative px-6 py-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-barth-gold/50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-barth-gold/10 text-barth-gold">
                      <LayoutDashboard size={20} />
                    </div>
                    <div className="text-left">
                      <span className="block text-white font-medium text-sm">
                        Accéder au Dashboard
                      </span>
                      <span className="block text-gray-500 text-xs">
                        Gérer les sites et agents
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-transform"
                  />
                </Link>

                {/* Séparateur discret */}
                <div className="w-full h-px bg-white/5" />

                {/* User Button (Centré et stylisé par Clerk, on ajoute juste un wrapper) */}
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>Connecté en tant que</span>
                  <div className="scale-110">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </div>
              </div>
            </SignedIn>
          </div>
        </GlassCard>

        {/* Footer discret */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest">
            © {new Date().getFullYear()} Barth Platform • Secured Access
          </p>
        </div>
      </div>
    </main>
  );
}
