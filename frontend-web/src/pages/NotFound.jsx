import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Animation Lottie */}
        <div className="w-48 h-48 mx-auto mb-6">
          <dotlottie-player
            src="https://lottie.host/b4801bb6-24bb-43a3-953b-98f22f82c432/WI9H5v4QLL.lottie"
            background="transparent"
            speed="1"
            style={{ width: '100%', height: '100%' }}
            loop
            autoplay
          />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Il y a une erreur sur la page
        </h1>

        <p className="text-white/50 text-sm leading-relaxed mb-8">
          Mais si tu donnes ta vie a <span className="text-[#2ED3A0] font-semibold">JESUS</span>, 
          ta vie sera sauve.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
          <p className="text-white/40 text-xs italic">
            "Cherchez premierement le royaume et la justice de Dieu; 
            et toutes ces choses vous seront donnees par-dessus." 
          </p>
          <p className="text-[#2ED3A0]/60 text-xs mt-1 font-medium">
            — Matthieu 6:33
          </p>
        </div>

        <Link to="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300 group">
          <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Retour a l'accueil
        </Link>
      </div>

      {/* Load Lottie script */}
      <script src="https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.js" />
    </div>
  );
}
