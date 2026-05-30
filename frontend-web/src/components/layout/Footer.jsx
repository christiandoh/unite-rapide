import React from 'react';
import { Activity, Shield, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0D0D1A]/95 border-t border-white/5 text-white/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[#7C5CFC] shrink-0" />
              <span className="font-bold text-white text-sm sm:text-base">Unite Rapide</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-white/50">
              Plateforme de souscription de forfaits mobile en Cote d'Ivoire. Orange, MTN et Moov.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2 sm:mb-3 text-sm sm:text-base">Services</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>Forfaits Internet</li>
              <li>Credit d'appel</li>
              <li>Paiement Wave securise</li>
              <li>Activation automatique</li>
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7C5CFC] shrink-0" />
              <span className="font-semibold text-white text-sm sm:text-base">Securise</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-white/50 mb-3">
              Paiements 100% securises via Wave. Vos donnees sont protegees.
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7C5CFC] shrink-0" />
              <span className="break-all">contact@unite-rapide.ci</span>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-6 sm:mt-8 pt-5 sm:pt-6 text-center text-[10px] sm:text-sm text-white/40">
          <p>Unite Rapide &copy; {new Date().getFullYear()} - Cote d'Ivoire</p>
        </div>
      </div>
    </footer>
  );
}
