import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// On définit quelles routes doivent être protégées (Le Dashboard)
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  let hostname = req.headers.get("host") || "";

  // 1. SÉCURITÉ : Si on essaie d'aller sur /dashboard, on vérifie si on est connecté
  if (isProtectedRoute(req)) {
    await auth.protect(); // Redirige vers la page de connexion si pas connecté
  }

  // ---------------------------------------------------------
  // 2. ROUTAGE (Ton ancien code pour les sous-domaines)
  // ---------------------------------------------------------

  // Nettoyage du port (:3000)
  hostname = hostname.split(":")[0];

  // Gestion des domaines de dev (nip.io / sslip.io)
  if (hostname.includes(".nip.io") || hostname.includes(".sslip.io")) {
    const parts = hostname.split(".");
    if (parts.length > 2) {
      hostname = parts[0] + ".localhost";
    }
  }

  const subdomain = hostname.split(".")[0];
  console.log("🔍 DEBUG MIDDLEWARE :");
  console.log("   - Host complet :", hostname);
  console.log("   - Sous-domaine détecté :", subdomain);

  // Si c'est le domaine principal, on laisse passer (Next.js gère le reste)
  if (
    subdomain === "www" ||
    subdomain === "barthimmobilier" ||
    subdomain === "localhost" ||
    subdomain === "barth-platform"
  ) {
    return NextResponse.next();
  }

  // Sinon, on réécrit l'URL vers le dossier /sites/[site]
  // Note importante : On doit cloner l'URL pour ne pas casser la requête Clerk
  const newUrl = new URL(`/sites/${subdomain}${url.pathname}`, req.url);
  return NextResponse.rewrite(newUrl);
});

export const config = {
  matcher: [
    // La config recommandée par Clerk pour tout intercepter
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
