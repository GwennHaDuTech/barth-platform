// components/RightSidebar.tsx
import GlassCard from "./ui/GlassCard";

const RightSidebar = () => {
  return (
    <aside
      className="
        w-80             
        h-full            
        p-8              
        hidden lg:flex    
        flex-col          
        overflow-y-auto   
        pointer-events-auto
      "
    >
      <h2 className="text-xl font-light mb-6 text-white">Dernière actions :</h2>

      {/* Exemple de notification basé sur l'image */}
      <GlassCard className="mb-4 !p-4 flex items-center gap-4 !bg-barth-dark-soft/50 !border-barth-gold/5">
        <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0 border border-barth-gold/30">
          {/* Placeholder image profil */}
        </div>
        <div className="flex-1 leading-tight">
          <p className="text-sm text-gray-200">
            <span className="font-bold text-barth-gold">Tom</span> à modifier
            son site
          </p>
          <p className="text-xs text-gray-500 mt-1">Il y a 9 heures</p>
        </div>
      </GlassCard>

      <button className="w-full py-3 rounded-full bg-gradient-to-r from-barth-gold to-[#B08D57] text-barth-dark font-bold text-sm shadow-lg shadow-barth-gold/20 hover:opacity-90 transition mt-2">
        voir la modification
      </button>
    </aside>
  );
};

export default RightSidebar;
