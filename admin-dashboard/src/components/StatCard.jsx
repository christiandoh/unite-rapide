import React from 'react';

export default function StatCard({ icon: Icon, label, value, sub, accent = 'purple', trend }) {
  const accents = {
    purple: 'from-brand-purple to-brand-purple-light shadow-brand-purple/20',
    mint: 'from-brand-mint to-emerald-400 shadow-emerald-500/20',
    blue: 'from-blue-500 to-sky-400 shadow-blue-500/20',
    amber: 'from-amber-400 to-orange-400 shadow-amber-500/20',
  };

  return (
    <div className="admin-card-hover p-5 sm:p-6 relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-brand-purple/5 to-transparent group-hover:scale-110 transition-transform duration-500" />
      <div className="flex items-start justify-between mb-4 relative">
        <div className={`p-2.5 sm:p-3 rounded-xl bg-gradient-to-br ${accents[accent]} shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${trend.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {trend.label}
          </span>
        )}
      </div>
      <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-2">{sub}</p>}
    </div>
  );
}
