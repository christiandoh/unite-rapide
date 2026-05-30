import React from 'react';
import { Activity, Shield, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0D0D1A]/95 border-t border-white/5 text-white/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-[#7C5CFC]" />
              <span className="font-bold text-white">Unite Rapide</span>
            </div>
            <p className="text-sm leading-relaxed text-white/50">
              Plateforme de souscription de forfaits mobile en Cote d'Ivoire. Orange, MTN et Moov.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>Forfaits Internet</li>
              <li>Credit d'appel</li>
              <li>Paiement Wave securise</li>
              <li>Activation automatique</li>
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#7C5CFC]" />
              <span className="font-semibold text-white">Securise</span>
            </div>
            <p className="text-sm leading-relaxed text-white/50 mb-3">
              Paiements 100% securises via Wave. Vos donnees sont protegees.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-[#7C5CFC]" />
              <span>contact@unite-rapide.ci</span>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/40">
          <p>Unite Rapide &copy; {new Date().getFullYear()} - Cote d'Ivoire</p>
        </div>
      </div>
    </footer>
  );
}
