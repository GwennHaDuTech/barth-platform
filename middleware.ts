import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;

  // 1. Récupérer le nom de domaine actuel
  let hostname = req.headers.get("host")!;

  // 2. Nettoyage du port pour le local
  hostname = hostname.replace(":3000", "");

  // --- CORRECTION ICI ---
  // On vérifie si c'est le domaine principal, OU localhost, OU une preview Vercel (.vercel.app)
  const isMainDomain =
    hostname === "localhost" ||
    hostname === "barth-platform.vercel.app" ||
    hostname.endsWith(".vercel.app"); // Accepte toutes les previews Vercel

  // --- CAS 1 : On est sur le domaine principal (Dashboard Admin) ---
  if (isMainDomain) {
    return NextResponse.next();
  }

  // --- CAS 2 : On est sur un sous-domaine (Site Agent) ---
  // Ex: hostname = "tom.merel.localhost" -> on garde "tom.merel"
  // Note: Il faut s'assurer que ton domaine de prod personnalisé soit géré ici plus tard
  const slug = hostname
    .replace(".localhost", "")
    .replace(".barth-platform.vercel.app", "");

  return NextResponse.rewrite(
    new URL(`/sites/${slug}${url.pathname}`, req.url)
  );
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
