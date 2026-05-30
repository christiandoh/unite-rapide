import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Connexion() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!telephone.match(/^(07|05|01)\d{8}$/)) {
      setError('Format: 07, 05 ou 01 + 8 chiffres');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(telephone, motDePasse);
      toast.success('Connecte avec succes');
      navigate('/catalogue');
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur de connexion';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#7C5CFC] transition-colors';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#7C5CFC]/30">
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Connexion</h1>
          <p className="text-sm text-white/50 mt-1">Accedez a votre espace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Telephone</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-mono z-10">+225</span>
              <input type="tel" value={telephone} onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                setTelephone(v);
                setError('');
              }} className={inputClass + ' pl-14'} required placeholder="0701020304" inputMode="numeric" />
            </div>
            <p className="text-white/30 text-xs mt-1">Numeros ivorien: 07, 05 ou 01 suivi de 8 chiffres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={motDePasse}
                onChange={(e) => { setMotDePasse(e.target.value); setError(''); }}
                className={inputClass + ' pr-11'} required placeholder="Entrez votre mot de passe" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300 disabled:opacity-50">
            {loading ? 'Connexion...' : <><LogIn className="w-4 h-4" /> Se connecter</>}
          </button>

          <p className="text-center text-sm text-white/40">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-[#A78BFF] hover:underline font-medium">S'inscrire</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
