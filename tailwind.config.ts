import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- NOS COULEURS PREMIUM BARTH ---
        barth: {
          gold: "#D4AF37", // Le Doré principal
          "gold-light": "#ECD28B", // Doré clair (reflet)
          dark: "#0C0C0C", // Noir profond
          "dark-soft": "#1A1A1A", // Gris très sombre
        },
      },
      backgroundImage: {
        // On garde le dégradé au cas où
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        // 👇 AJOUTE TON IMAGE ICI (remplace 'ton-image.jpg' par le vrai nom) 👇
        "barth-bg": "url('/background.jpg')",
        // Important : le chemin commence par un / car il est dans le dossier public
      },
    },
  },
  plugins: [],
};
export default config;
