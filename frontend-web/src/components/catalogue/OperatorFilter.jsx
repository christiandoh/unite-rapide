import React from 'react';
import { Smartphone } from 'lucide-react';

const LOGOS = {
  Orange: '/logo_orange.jpg',
  MTN: '/Mtn_ci_.jpg',
  Moov: '/moov_ci_logo.jpg',
};

const OPERATOR_STYLES = {
  Orange: '#FF6600',
  MTN: '#FFCC00',
  Moov: '#00A3E0',
};

export default function OperatorFilter({ operators, selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button type="button" onClick={() => onSelect(null)}
        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
          !selected ? 'bg-brand-purple text-white shadow-glow' : 'glass-panel text-white/60 hover:bg-white/10 hover:text-white'
        }`}>
        <Smartphone className="w-4 h-4" />
        Tous
      </button>
      {operators.map((op) => {
        const color = OPERATOR_STYLES[op.nom] || '#7C5CFC';
        const logo = LOGOS[op.nom];
        const isActive = selected === op.id;
        return (
          <button key={op.id} type="button" onClick={() => onSelect(isActive ? null : op.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              isActive ? 'text-white shadow-md' : 'glass-panel text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            style={isActive ? { backgroundColor: color } : {}}>
            {logo && <img src={logo} alt={op.nom} className="w-5 h-5 rounded object-contain bg-white/90 p-0.5" />}
            {op.nom}
          </button>
        );
      })}
    </div>
  );
}
