import React from 'react';
import { Smartphone } from 'lucide-react';

const LOGOS = {
  'Orange': '/logo_orange.jpg',
  'MTN': '/Mtn_ci_.jpg',
  'Moov': '/moov_ci_logo.jpg',
};

const OPERATOR_STYLES = {
  Orange: { bg: '#FF6600', light: '#FFF5EB' },
  MTN: { bg: '#FFCC00', light: '#FFFDEB' },
  Moov: { bg: '#00A3E0', light: '#EBF8FF' },
};

export default function OperatorFilter({ operators, selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
      <button onClick={() => onSelect(null)}
        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
          !selected ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}>
        <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        Tous
      </button>
      {operators.map((op) => {
        const style = OPERATOR_STYLES[op.nom] || { bg: '#7C5CFC', light: '#F5F3FF' };
        const logo = LOGOS[op.nom];
        return (
          <button key={op.id} onClick={() => onSelect(selected === op.id ? null : op.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
              selected === op.id
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={selected === op.id ? { backgroundColor: style.bg } : {}}>
            {logo && <img src={logo} alt={op.nom} className="w-5 h-5 rounded object-contain" />}
            {op.nom}
          </button>
        );
      })}
    </div>
  );
}
