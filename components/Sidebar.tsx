// components/Sidebar.tsx
import Link from "next/link";
import { Home, Users, Calendar, Settings } from "lucide-react"; // Installe lucide-react si besoin: npm i lucide-react

const Sidebar = () => {
  return (
    <aside className="w-24 m-4 rounded-3xl bg-white/5 backdrop-blur-md border border-barth-gold/10 flex flex-col items-center py-8 gap-8">
      {/* Logo P (Placeholder pour le profil ou logo) */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-barth-gold to-barth-dark-soft flex items-center justify-center font-bold text-barth-dark">
        P
      </div>

      {/* Navigation Icons */}
      <nav className="flex flex-col gap-6 mt-8">
        <Link
          href="/dashboard"
          className="p-3 rounded-xl bg-barth-gold/20 text-barth-gold"
        >
          <Home size={24} />
        </Link>
        <Link
          href="#"
          className="p-3 rounded-xl text-gray-400 hover:text-barth-gold hover:bg-white/5 transition"
        >
          <Users size={24} />
        </Link>
        <Link
          href="#"
          className="p-3 rounded-xl text-gray-400 hover:text-barth-gold hover:bg-white/5 transition"
        >
          <Calendar size={24} />
        </Link>
        <div className="mt-auto pt-8">
          <Link
            href="#"
            className="p-3 rounded-xl text-gray-400 hover:text-barth-gold hover:bg-white/5 transition"
          >
            <Settings size={24} />
          </Link>
        </div>
      </nav>

      {/* Logo Barth en bas */}
      <div className="mt-auto text-center">
        <div className="text-[0.6rem] uppercase tracking-widest text-gray-400">
          Cabinet Immobilier
        </div>
        <div className="text-xl font-bold text-barth-gold tracking-wider">
          BARTH
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
