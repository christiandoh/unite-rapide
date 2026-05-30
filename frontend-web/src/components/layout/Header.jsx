import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, User, LogIn, Activity, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-[#0D0D1A] border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
          <div className="w-9 h-9 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-xl flex items-center justify-center shadow-lg shadow-[#7C5CFC]/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white">USSD Automation</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-2">
          <Link to="/catalogue"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <Package className="w-4 h-4" />
            <span>Forfaits</span>
          </Link>
          {user ? (
            <Link to="/profil"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/70 hover:text-white rounded-xl transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">
                {user.nom?.[0] || 'U'}
              </div>
              <span>{user.prenom || user.nom}</span>
            </Link>
          ) : (
            <Link to="/connexion"
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300">
              <LogIn className="w-4 h-4" />
              Connexion
            </Link>
          )}
        </nav>

        <button onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-2 text-white/70 hover:text-white transition-colors">
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-white/10 bg-[#0D0D1A]/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-2">
            <Link to="/catalogue" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
              <Package className="w-4 h-4" />
              Forfaits
            </Link>
            {user ? (
              <Link to="/profil" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                <div className="w-7 h-7 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] text-white rounded-lg flex items-center justify-center text-xs font-bold">
                  {user.nom?.[0] || 'U'}
                </div>
                {user.prenom || user.nom}
              </Link>
            ) : (
              <Link to="/connexion" onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-4 py-2.5 rounded-xl text-sm font-medium">
                <LogIn className="w-4 h-4" />
                Connexion
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
