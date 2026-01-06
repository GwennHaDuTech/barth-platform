import prisma from "@/lib/prisma";
import GlassCard from "@/components/ui/GlassCard";
import Image from "next/image";
import Link from "next/link"; // <--- 1. Import de Link
import { MapPin, Phone, User, Building, ExternalLink } from "lucide-react"; // <--- 2. Import icône
import CreateAgencyButton from "./CreateAgencyButton";

export const dynamic = "force-dynamic";

export default async function AgenciesPage() {
  // 1. Récupérer les agences
  const agencies = await prisma.agency.findMany({
    include: {
      manager: true,
      agents: true,
    },
    orderBy: { name: "asc" },
  });

  // 2. Récupérer les agents pour le formulaire
  const agentsList = await prisma.agent.findMany({
    select: { id: true, firstname: true, lastname: true },
    orderBy: { lastname: "asc" },
  });

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">
            Réseau d'Agences
          </h1>
          <p className="text-gray-400 text-sm">
            Gérez vos points de vente physiques et digitaux.
          </p>
        </div>

        <CreateAgencyButton availableAgents={agentsList} />
      </div>

      {/* LISTE DES AGENCES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-10">
        {agencies.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-gray-500 py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
            <Building size={48} className="mb-4 opacity-50" />
            <p>Aucune agence pour le moment.</p>
          </div>
        ) : (
          agencies.map((agency) => (
            <GlassCard
              key={agency.id}
              className="group relative overflow-hidden p-0 flex flex-col h-[350px]"
            >
              {/* Image de fond */}
              <div className="relative h-40 w-full overflow-hidden">
                {agency.photo ? (
                  <Image
                    src={agency.photo}
                    alt={agency.name}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <Building className="text-white/20" size={32} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-90" />

                <div className="absolute bottom-4 left-4">
                  <h3 className="text-2xl font-semibold text-white">
                    {agency.name}
                  </h3>
                </div>
              </div>

              {/* Contenu Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Responsable */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/10 ${
                        agency.manager
                          ? "bg-white/10"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        Responsable
                      </p>
                      <p className="text-sm font-medium text-white">
                        {agency.manager
                          ? `${agency.manager.firstname} ${agency.manager.lastname}`
                          : "Non assigné"}
                      </p>
                    </div>
                  </div>

                  {/* Stats & Infos */}
                  <div className="flex items-center gap-4 text-sm text-gray-400 border-t border-white/5 pt-3 mt-1">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-barth-gold" />
                      <span>{agency.agents.length} agents</span>
                    </div>
                    {agency.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-barth-gold" />
                        <span>{agency.phone}</span>
                      </div>
                    )}
                  </div>

                  {agency.address && (
                    <div className="flex items-start gap-2 text-xs text-gray-500 mt-2">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span className="truncate">{agency.address}</span>
                    </div>
                  )}
                </div>

                {/* --- 3. LIEN VERS LA PAGE PUBLIQUE --- */}
                <Link
                  href={`/agence/${agency.id}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full mt-4 py-2 text-xs uppercase tracking-widest font-bold border border-white/10 rounded-lg hover:bg-white hover:text-black transition text-gray-400"
                >
                  Voir le site <ExternalLink size={12} />
                </Link>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
