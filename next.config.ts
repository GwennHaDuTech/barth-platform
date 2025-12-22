import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Pour tes anciennes images
      },
      {
        protocol: "https",
        hostname: "utfs.io", // <--- Pour les nouvelles images UploadThing
      },
    ],
  },
};

export default nextConfig;
