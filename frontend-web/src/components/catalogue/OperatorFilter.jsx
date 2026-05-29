import React from 'react';
import { Smartphone } from 'lucide-react';

const OPERATOR_STYLES = {
  Orange: { bg: '#FF6600', light: '#FFF5EB' },
  MTN: { bg: '#FFCC00', light: '#FFFDEB' },
  Moov: { bg: '#00A3E0', light: '#EBF8FF' },
};

export default function OperatorFilter({ operators, selected, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={() => onSelect(null)}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          !selected ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}>
        <Smartphone className="w-4 h-4" />
        Tous
      </button>
      {operators.map((op) => {
        const style = OPERATOR_STYLES[op.nom] || { bg: '#7C5CFC', light: '#F5F3FF' };
        return (
          <button key={op.id} onClick={() => onSelect(selected === op.id ? null : op.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              selected === op.id
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={selected === op.id ? { backgroundColor: style.bg } : {}}>
            {op.nom}
          </button>
        );
      })}
    </div>
  );
}
