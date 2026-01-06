import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Phone,
  Mail,
  Instagram,
  Linkedin,
  MapPin,
  ArrowRight,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  // CORRECTION : params est une Promise maintenant
  params: Promise<{
    id: string;
  }>;
}

export default async function AgencyPublicPage({ params }: Props) {
  // CORRECTION : On attend la résolution des paramètres
  const { id } = await params;

  // 1. Récupération des données de l'agence avec l'ID récupéré
  const agency = await prisma.agency.findUnique({
    where: { id: id }, // On utilise la variable 'id' extraite
    include: {
      manager: true,
      agents: {
        orderBy: { lastname: "asc" },
      },
    },
  });

  if (!agency) {
    notFound();
  }

  // --- COMPOSANTS UI INTERNES ---
  const AgentCard = ({
    agent,
    isManager = false,
  }: {
    agent: any;
    isManager?: boolean;
  }) => (
    <div
      className={`group relative bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden hover:border-barth-gold/50 transition duration-500 ${
        isManager ? "md:flex md:items-center md:gap-6 md:p-6" : "flex flex-col"
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          isManager
            ? "w-full md:w-48 h-64 md:h-48 shrink-0 rounded-xl"
            : "w-full h-80"
        }`}
      >
        {agent.photo ? (
          <Image
            src={agent.photo}
            alt={`${agent.firstname} ${agent.lastname}`}
            fill
            className="object-cover group-hover:scale-105 transition duration-700"
          />
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center text-gray-600">
            <User size={48} />
          </div>
        )}
      </div>

      <div className={`${isManager ? "p-6 md:p-0 flex-1" : "p-5"}`}>
        {isManager && (
          <span className="inline-block px-3 py-1 mb-2 text-[10px] font-bold tracking-widest text-barth-dark bg-barth-gold rounded-full uppercase">
            Responsable d'agence
          </span>
        )}

        <h3 className="text-xl font-medium text-white">
          {agent.firstname} <span className="font-bold">{agent.lastname}</span>
        </h3>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="text-gray-400 hover:text-barth-gold transition"
            >
              <Phone size={18} />
            </a>
          )}
          <a
            href={`mailto:${agent.email}`}
            className="text-gray-400 hover:text-barth-gold transition"
          >
            <Mail size={18} />
          </a>
          {agent.instagram && (
            <a
              href={agent.instagram}
              target="_blank"
              className="text-gray-400 hover:text-pink-500 transition"
            >
              <Instagram size={18} />
            </a>
          )}
          {agent.linkedin && (
            <a
              href={agent.linkedin}
              target="_blank"
              className="text-gray-400 hover:text-blue-500 transition"
            >
              <Linkedin size={18} />
            </a>
          )}
        </div>

        <Link
          href={`/agent/${agent.slug}`}
          className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider hover:text-barth-gold transition"
        >
          Voir le profil <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-barth-gold selection:text-black">
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tighter">
            BARTH <span className="text-barth-gold">.</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#accueil" className="hover:text-white transition">
              Accueil
            </a>
            <a href="#equipe" className="hover:text-white transition">
              Notre Équipe
            </a>
            <a
              href="#contact"
              className="px-5 py-2 bg-white text-black rounded-full hover:bg-barth-gold transition font-bold"
            >
              Nous contacter
            </a>
          </nav>
        </div>
      </header>

      <section
        id="accueil"
        className="relative h-[80vh] flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          {agency.photo ? (
            <Image
              src={agency.photo}
              alt={agency.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gray-900" />
          )}
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <h1 className="text-5xl md:text-7xl font-light tracking-tight">
            Agence de{" "}
            <span className="text-barth-gold font-bold">{agency.name}</span>
          </h1>
          <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto">
            L'excellence immobilière au cœur de votre région. Une équipe dédiée
            pour concrétiser vos projets de vie.
          </p>
          {agency.address && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/10 text-sm">
              <MapPin size={16} className="text-barth-gold" />
              {agency.address}
            </div>
          )}
        </div>
      </section>

      {agency.manager && (
        <section className="py-24 px-6 bg-[#050505]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light mb-2">Le Responsable</h2>
              <div className="w-12 h-1 bg-barth-gold mx-auto rounded-full" />
            </div>
            <AgentCard agent={agency.manager} isManager={true} />
          </div>
        </section>
      )}

      <section id="equipe" className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div>
              <h2 className="text-4xl font-light mb-2">Notre Équipe</h2>
              <p className="text-gray-400">
                Les experts {agency.name} à votre service.
              </p>
            </div>
            <div className="text-right">
              <span className="text-6xl font-bold text-white/10">
                {agency.agents.length}
              </span>
            </div>
          </div>

          {agency.agents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {agency.agents
                .filter((a) => a.id !== agency.managerId)
                .map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10 text-gray-500">
              L'équipe est en cours de constitution.
            </div>
          )}
        </div>
      </section>

      <section
        id="contact"
        className="py-24 px-6 bg-[#0a0a0a] border-t border-white/5"
      >
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-light">Un projet immobilier ?</h2>
          <p className="text-gray-400">
            Contactez l'agence de {agency.name} directement par téléphone ou via
            nos agents.
          </p>

          {agency.phone && (
            <a
              href={`tel:${agency.phone}`}
              className="inline-flex items-center gap-3 text-3xl md:text-5xl font-bold hover:text-barth-gold transition"
            >
              <Phone size={32} md={48} /> {agency.phone}
            </a>
          )}

          <div className="pt-12 mt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-4">
            <p>© 2026 Barth Immobilier - Agence de {agency.name}</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white">
                Mentions légales
              </Link>
              <Link href="#" className="hover:text-white">
                Confidentialité
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
