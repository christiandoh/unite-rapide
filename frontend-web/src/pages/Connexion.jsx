import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from '../components/layout/AuthShell';

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

  return (
    <AuthShell
      title="Connexion"
      subtitle="Accedez a votre espace client"
      icon={LogIn}
      accent="purple"
      footer={(
        <>
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="text-brand-purple-light hover:underline font-medium">S&apos;inscrire</Link>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Telephone</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-mono z-10">+225</span>
            <input
              type="tel"
              value={telephone}
              onChange={(e) => {
                setTelephone(e.target.value.replace(/\D/g, '').slice(0, 10));
                setError('');
              }}
              className="input-dark pl-14"
              required
              placeholder="0701020304"
              inputMode="numeric"
            />
          </div>
          <p className="text-white/30 text-xs mt-1.5">Numeros ivoiriens: 07, 05 ou 01</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={motDePasse}
              onChange={(e) => { setMotDePasse(e.target.value); setError(''); }}
              className="input-dark pr-11"
              required
              placeholder="Entrez votre mot de passe"
            />
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

        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 disabled:opacity-50">
          {loading ? 'Connexion...' : <><LogIn className="w-4 h-4" /> Se connecter</>}
        </button>
      </form>
    </AuthShell>
  );
}
