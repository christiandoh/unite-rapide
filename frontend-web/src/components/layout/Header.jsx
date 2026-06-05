import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, LogIn, Activity, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const shellClass = scrolled || !isHome || menuOpen
    ? 'bg-brand-surface/90 backdrop-blur-xl border-white/10 shadow-lg shadow-black/20'
    : 'bg-transparent border-transparent';

  return (
    <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${shellClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-purple to-brand-purple-light rounded-xl flex items-center justify-center shadow-lg shadow-brand-purple/25 group-hover:shadow-glow transition-shadow shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-bold text-white block text-sm sm:text-base">Unite Rapide</span>
            <span className="text-[10px] text-white/40 hidden sm:block">Forfaits mobile CI</span>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <Link to="/catalogue"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <Package className="w-4 h-4" />
            Forfaits
          </Link>
          {user ? (
            <Link to="/profil"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 text-sm font-medium text-white/70 hover:text-white rounded-xl transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-purple-light text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">
                {user.nom?.[0] || 'U'}
              </div>
              <span className="hidden md:inline">{user.prenom || user.nom}</span>
            </Link>
          ) : (
            <>
              <Link to="/connexion"
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
                Connexion
              </Link>
              <Link to="/inscription"
                className="flex items-center gap-1.5 bg-gradient-to-r from-brand-purple to-brand-purple-light text-white px-5 py-2 rounded-xl text-sm font-semibold hover:shadow-glow transition-all duration-300">
                <LogIn className="w-4 h-4" />
                S&apos;inscrire
              </Link>
            </>
          )}
        </nav>

        <button type="button" onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-2 -mr-2 text-white/70 hover:text-white transition-colors"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-white/10 bg-brand-surface/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-1">
            <Link to="/catalogue"
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
              <Package className="w-4 h-4" />
              Forfaits
            </Link>
            {user ? (
              <Link to="/profil"
                className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-purple-light text-white rounded-lg flex items-center justify-center text-xs font-bold">
                  {user.nom?.[0] || 'U'}
                </div>
                {user.prenom || user.nom}
              </Link>
            ) : (
              <>
                <Link to="/connexion"
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                  Connexion
                </Link>
                <Link to="/inscription"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-purple to-brand-purple-light text-white px-4 py-3 rounded-xl text-sm font-semibold mt-2">
                  <LogIn className="w-4 h-4" />
                  Creer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
