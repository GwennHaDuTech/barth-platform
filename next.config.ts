import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co", // ✅ Pour l'image par défaut
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Pour anciennes images
      },
      {
        protocol: "https",
        hostname: "utfs.io", // <--- Pour nouvelles images UploadThing
      },
      {
        protocol: "https",
        hostname: "img.clerk.com", //  Pour les avatars Clerk
      },
    ],
  },
};

export default nextConfig;
