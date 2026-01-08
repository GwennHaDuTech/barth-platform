import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard = ({ children, className = "" }: GlassCardProps) => {
  return (
    <div
      className={`
      relative overflow-hidden
      rounded-3xl 
      bg-white/5 /* Fond blanc très transparent */
      backdrop-blur-md /* L'effet de flou derrière */
      border border-barth-gold/20 /* Bordure dorée subtile */
      shadow-[0_0_15px_rgba(212,175,55,0.05)] /* Légère lueur dorée */
      p-6
      text-white
      ${className}
    `}
    >
      {/* Petit effet de reflet optionnel en haut */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-barth-gold/30 to-transparent"></div>

      {children}
    </div>
  );
};

export default GlassCard;
