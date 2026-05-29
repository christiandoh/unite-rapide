import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';

const OPERATOR_COLORS = {
  Orange: { bg: '#FF6600', light: '#FFF5EB' },
  MTN: { bg: '#FFCC00', light: '#FFFDEB' },
  Moov: { bg: '#00A3E0', light: '#EBF8FF' },
};

export default function ServiceCard({ service }) {
  const navigate = useNavigate();
  const op = OPERATOR_COLORS[service.operateur?.nom] || { bg: '#7C5CFC', light: '#F5F3FF' };
  const typeLabel = service.typeService === 'forfait_internet' ? 'Internet'
    : service.typeService === 'credit_appel' ? 'Credit'
    : service.typeService === 'forfait_mixte' ? 'Mixte'
    : 'Abonnement';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: op.bg }}
          >
            {service.operateur?.nom?.[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{service.operateur?.nom}</p>
            <span className="text-xs text-gray-500">{typeLabel}</span>
          </div>
        </div>
        {service.populaire && (
          <div className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-lg">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            Populaire
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-3">{service.nom}</h3>

      <div className="space-y-1.5 mb-5 text-sm text-gray-500">
        {service.volumeData && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span>{service.volumeData}</span>
          </div>
        )}
        {service.dureeValidite && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span>Valable {service.dureeValidite}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {Number(service.montantWave).toLocaleString('fr-FR')}{' '}
            <span className="text-sm font-normal text-gray-400">F</span>
          </p>
        </div>
        <button onClick={() => navigate(`/commande/${service.id}`)}
          className="flex items-center gap-1.5 bg-[#7C5CFC]/5 text-[#7C5CFC] px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#7C5CFC] hover:text-white transition-all duration-300 group-hover:shadow-lg group-hover:shadow-[#7C5CFC]/20">
          Souscrire
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
