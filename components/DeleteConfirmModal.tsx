"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

interface DeleteModalProps {
  agentName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export default function DeleteConfirmModal({
  agentName,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-barth-dark border border-red-500/30 p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.1)]">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="text-red-500" size={32} />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            Supprimer le site ?
          </h3>
          <p className="text-gray-400 mb-8">
            Êtes-vous sûr de vouloir supprimer le site de{" "}
            <span className="text-white font-bold">{agentName}</span> ? Cette
            action est irréversible.
          </p>

          <div className="flex gap-4 w-full">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 py-3 px-6 rounded-xl border border-white/10 text-white hover:bg-white/5 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-3 px-6 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Supprimer"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
