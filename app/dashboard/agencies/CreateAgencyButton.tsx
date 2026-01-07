"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import CreateAgencyForm from "./CreateAgencyForm";

// Définition du type Agent pour TypeScript
interface Agent {
  id: string;
  firstname: string;
  lastname: string;
}

// On définit que ce bouton attend une liste d'agents
interface CreateAgencyButtonProps {
  availableAgents: Agent[];
}

export default function CreateAgencyButton({
  availableAgents,
}: CreateAgencyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all shadow-lg"
      >
        <Plus size={20} />
        <span>Nouvelle Agence</span>
      </button>

      {isOpen && (
        <CreateAgencyForm
          closeModal={() => setIsOpen(false)}
          // ✅ C'EST ICI LA CLÉ : On transmet la liste reçue au formulaire enfant
          availableAgents={availableAgents}
        />
      )}
    </>
  );
}
