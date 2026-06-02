import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function AuthShell({ title, subtitle, icon: Icon, accent = 'purple', children, footer }) {
  const accents = {
    purple: {
      icon: 'from-brand-purple to-brand-purple-light shadow-brand-purple/30',
      glow: 'bg-brand-purple/25',
      link: 'text-brand-purple-light',
    },
    mint: {
      icon: 'from-brand-mint to-brand-mint-light shadow-glow-mint',
      glow: 'bg-brand-mint/20',
      link: 'text-brand-mint',
    },
  };
  const a = accents[accent] || accents.purple;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-brand-dark flex">
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/15 via-brand-surface to-brand-dark" />
        <div className={`absolute top-1/3 -left-24 w-72 h-72 ${a.glow} rounded-full blur-[100px]`} />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-purple-light rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white group-hover:text-brand-purple-light transition-colors">Unite Rapide</span>
          </Link>

          <div>
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
              Vos forfaits mobile,<br /> simplifies.
            </h2>
            <p className="text-white/55 leading-relaxed max-w-sm">
              Orange, MTN et Moov — paiement Wave securise et activation automatique en quelques minutes.
            </p>
          </div>

          <p className="text-white/30 text-sm">Cote d&apos;Ivoire</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className={`w-10 h-10 bg-gradient-to-br ${a.icon} rounded-xl flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">{title}</p>
              <p className="text-white/50 text-sm">{subtitle}</p>
            </div>
          </div>

          <div className="hidden lg:block mb-8">
            <div className={`w-14 h-14 bg-gradient-to-br ${a.icon} rounded-2xl flex items-center justify-center mb-5`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-white/50 text-sm mt-1">{subtitle}</p>
          </div>

          <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-glow/30">
            {children}
          </div>

          {footer && (
            <p className="text-center text-sm text-white/40 mt-6">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
