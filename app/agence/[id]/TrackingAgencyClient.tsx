"use client";

import { useEffect } from "react";

export default function TrackingAgencyClient({
  agencyId,
}: {
  agencyId: string;
}) {
  useEffect(() => {
    // On appelle la même API /api/track mais avec agencyId
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId }),
    }).catch((err) => console.error("Agency Tracking error:", err));
  }, [agencyId]);

  return null;
}
