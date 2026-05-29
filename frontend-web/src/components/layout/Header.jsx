import React from 'react';
import { Link } from 'react-router-dom';
import { Package, User, LogIn, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-xl flex items-center justify-center shadow-lg shadow-[#7C5CFC]/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900">USSD Automation</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/catalogue"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#7C5CFC] hover:bg-[#7C5CFC]/5 rounded-xl transition-colors">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Forfaits</span>
          </Link>
          {user ? (
            <Link to="/profil"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#7C5CFC] rounded-xl transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">
                {user.nom?.[0] || 'U'}
              </div>
              <span className="hidden sm:inline">{user.prenom || user.nom}</span>
            </Link>
          ) : (
            <Link to="/connexion"
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300">
              <LogIn className="w-4 h-4" />
              Connexion
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
