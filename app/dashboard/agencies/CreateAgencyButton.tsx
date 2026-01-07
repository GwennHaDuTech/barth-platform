"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import CreateAgencyForm from "./CreateAgencyForm";

interface AgentOption {
  id: string;
  firstname: string;
  lastname: string;
}

export default function CreateAgencyButton({
  availableAgents,
}: {
  availableAgents: AgentOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        // J'ai ajouté 'border-transparent' par défaut pour éviter que le bouton ne saute quand la bordure apparait
        className="flex items-center gap-2 bg-barth-gold text-barth-dark px-5 py-2.5 rounded-xl font-medium transition shadow-lg shadow-barth-gold/10 border border-transparent hover:bg-transparent hover:text-white hover:border-white"
      >
        <Plus size={18} />
        Nouvelle Agence
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <CreateAgencyForm
            availableAgents={availableAgents}
            closeModal={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  );
}
