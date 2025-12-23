import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;

  // 1. Récupérer le nom de domaine actuel (ex: "tom.merel.localhost:3000")
  let hostname = req.headers.get("host")!;

  // 2. Nettoyage du port pour le local (on enlève :3000)
  hostname = hostname.replace(":3000", "");

  // Liste des domaines "principaux" (Ceux qui ne sont PAS des sites agents)
  const allowedDomains = ["localhost", "barth-platform.vercel.app"];

  // Vérifier si on est sur le domaine principal
  const isMainDomain = allowedDomains.includes(hostname);

  // --- CAS 1 : On est sur le domaine principal (Dashboard Admin) ---
  if (isMainDomain) {
    // On laisse passer normalement (Clerk gère l'auth si besoin)
    return NextResponse.next();
  }

  // --- CAS 2 : On est sur un sous-domaine (Site Agent) ---
  // Ex: hostname = "tom.merel.localhost" -> on garde "tom.merel"
  const subdomain = hostname
    .replace(".localhost", "")
    .replace(".barth-platform.vercel.app", "");

  // On réécrit l'URL en interne pour pointer vers le dossier /sites/[site]
  // Cela permet d'afficher le contenu de l'agent tout en gardant l'URL jolie
  return NextResponse.rewrite(
    new URL(`/sites/${subdomain}${url.pathname}`, req.url)
  );
});

export const config = {
  matcher: [
    // Le matcher officiel de Clerk pour intercepter toutes les routes nécessaires
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
