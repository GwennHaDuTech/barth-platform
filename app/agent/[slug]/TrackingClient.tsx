"use client";

import { useEffect } from "react";

export default function TrackingClient({ agentId }: { agentId: string }) {
  useEffect(() => {
    // Appel à l'API de tracking que nous avons créée
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    }).catch((err) => console.error("Tracking error:", err));
  }, [agentId]);

  return null; // Ce composant ne rend rien visuellement
}
