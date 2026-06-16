import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import PinInput from '../components/PinInput';

export default function LoginPage({
  telephone,
  setTelephone,
  codePin,
  setCodePin,
  loginError,
  setLoginError,
  loginLoading,
  handleLogin,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#7C5CFC]/30">
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Administrateur</h1>
          <p className="text-sm text-white/50 mt-1">Unite Rapide</p>
        </div>

        {loginError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm text-center">{loginError}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Téléphone</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-mono z-10">+225</span>
              <input
                type="tel"
                placeholder="0700000000"
                value={telephone}
                onChange={e => {
                  setTelephone(e.target.value.replace(/\D/g, '').slice(0, 10));
                  setLoginError('');
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-14 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#7C5CFC] transition-colors text-sm"
                required
              />
            </div>
            <p className="text-white/30 text-xs mt-1">Numéro ivoirien (07, 05, 01)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-3 text-center">Code PIN</label>
            <PinInput
              value={codePin}
              onChange={v => { setCodePin(v); setLoginError(''); }}
              disabled={loginLoading}
              variant="dark"
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading || codePin.length !== 4}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300 disabled:opacity-50"
          >
            {loginLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Plateforme de souscription USSD
        </p>
      </form>
    </div>
  );
}
