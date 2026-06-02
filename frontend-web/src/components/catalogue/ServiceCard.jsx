import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Wifi, Calendar } from 'lucide-react';

const LOGOS = {
  Orange: '/logo_orange.jpg',
  MTN: '/Mtn_ci_.jpg',
  Moov: '/moov_ci_logo.jpg',
};

const OPERATOR_COLORS = {
  Orange: '#FF6600',
  MTN: '#FFCC00',
  Moov: '#00A3E0',
};

export default function ServiceCard({ service }) {
  const navigate = useNavigate();
  const opColor = OPERATOR_COLORS[service.operateur?.nom] || '#7C5CFC';
  const logo = LOGOS[service.operateur?.nom];
  const typeLabel = service.typeService === 'forfait_internet' ? 'Internet'
    : service.typeService === 'credit_appel' ? 'Credit'
    : service.typeService === 'forfait_mixte' ? 'Mixte'
    : 'Abonnement';

  return (
    <div className="group glass-panel rounded-2xl p-5 sm:p-6 hover:bg-white/[0.07] hover:border-brand-purple/25 hover:shadow-glow transition-all duration-300 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt={service.operateur?.nom}
              className="w-10 h-10 rounded-xl object-contain bg-white/90 p-1" />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: opColor }}>
              {service.operateur?.nom?.[0]}
            </div>
          )}
          <div>
            <p className="font-semibold text-white text-sm">{service.operateur?.nom}</p>
            <span className="text-xs text-white/40">{typeLabel}</span>
          </div>
        </div>
        {service.populaire && (
          <div className="flex items-center gap-1 text-xs bg-amber-500/15 text-amber-400 px-2 py-1 rounded-lg border border-amber-500/20">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            Top
          </div>
        )}
      </div>

      <h3 className="text-lg font-bold text-white mb-3 group-hover:text-brand-purple-light transition-colors">{service.nom}</h3>

      <div className="space-y-2 mb-5 flex-1">
        {service.volumeData && (
          <div className="flex items-center gap-2 text-sm text-white/45">
            <Wifi className="w-3.5 h-3.5 shrink-0" />
            <span>{service.volumeData}</span>
          </div>
        )}
        {service.dureeValidite && (
          <div className="flex items-center gap-2 text-sm text-white/45">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Valable {service.dureeValidite}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div>
          <p className="text-xs text-white/35 mb-0.5">Prix</p>
          <p className="text-xl sm:text-2xl font-bold text-brand-mint">
            {Number(service.montantWave).toLocaleString('fr-FR')}
            <span className="text-sm font-normal text-white/40 ml-1">F</span>
          </p>
        </div>
        <button type="button" onClick={() => navigate(`/commande/${service.id}`)}
          className="flex items-center gap-1.5 bg-brand-purple/15 text-brand-purple-light px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-purple hover:text-white transition-all duration-300 group-hover:shadow-glow">
          Souscrire
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
