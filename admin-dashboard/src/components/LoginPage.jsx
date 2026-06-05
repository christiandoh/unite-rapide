import React from 'react';
import { LayoutDashboard, Eye, EyeOff, Shield, Zap, Activity } from 'lucide-react';

export default function LoginPage({
  loginForm,
  setLoginForm,
  loginError,
  setLoginError,
  loginLoading,
  showLoginPw,
  setShowLoginPw,
  onSubmit,
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/30 via-slate-900 to-slate-950" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-brand-purple/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-brand-mint/20 rounded-full blur-[80px]" />
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-brand-purple to-brand-purple-light rounded-2xl flex items-center justify-center shadow-lg shadow-brand-purple/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">Unite Rapide</p>
              <p className="text-white/50 text-sm">Console d&apos;administration</p>
            </div>
          </div>

          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Pilotez votre plateforme USSD en temps reel
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-md mb-10">
              Commandes, validation des paiements, telephones executeurs et statistiques — tout en un seul endroit.
            </p>
            <div className="space-y-4">
              {[
                { icon: Shield, text: 'Validation manuelle des preuves Wave' },
                { icon: Zap, text: 'Execution USSD sur telephones Android' },
                { icon: LayoutDashboard, text: 'Tableau de bord et historique complet' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-white/70">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-brand-purple-light" />
                  </div>
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/30 text-sm">Cote d&apos;Ivoire — Orange, MTN, Moov</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-50">
        <form onSubmit={onSubmit} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-purple-light rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Unite Rapide</p>
              <p className="text-slate-500 text-sm">Administration</p>
            </div>
          </div>

          <div className="admin-card p-8 sm:p-10 shadow-card-hover">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Connexion</h2>
              <p className="text-slate-500 text-sm mt-1">Acces reserve aux administrateurs</p>
            </div>

            {loginError && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100">
                <p className="text-red-600 text-sm text-center">{loginError}</p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Identifiant</label>
                <input
                  type="text"
                  placeholder="Email ou telephone"
                  value={loginForm.identifiant}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, identifiant: e.target.value });
                    setLoginError('');
                  }}
                  className="admin-input"
                  required
                />
                <p className="text-slate-400 text-xs mt-1.5">Email ou numero ivoirien (07, 05, 01)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showLoginPw ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
                    value={loginForm.mot_de_passe}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, mot_de_passe: e.target.value });
                      setLoginError('');
                    }}
                    className="admin-input pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPw(!showLoginPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-purple to-brand-purple-light text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-brand-purple/25 transition-all duration-300 disabled:opacity-50"
              >
                {loginLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
