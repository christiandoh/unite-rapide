import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function PasswordStrength({ password }) {
  const checks = [
    { label: '8 caracteres', ok: password.length >= 8 },
    { label: 'Majuscule', ok: /[A-Z]/.test(password) },
    { label: 'Minuscule', ok: /[a-z]/.test(password) },
    { label: 'Chiffre', ok: /\d/.test(password) },
    { label: 'Special (!@#...)', ok: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {checks.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[i] : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1.5 text-xs">
            {c.ok
              ? <CheckCircle size={10} className="text-[#2ED3A0]" />
              : <XCircle size={10} className="text-white/30" />}
            <span className={c.ok ? 'text-white/60' : 'text-white/30'}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Inscription() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '', email: '', mot_de_passe: '', confirm_mot_de_passe: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function handleChange(e) {
    let value = e.target.value;
    if (e.target.name === 'telephone') value = value.replace(/\D/g, '').slice(0, 10);
    setForm({ ...form, [e.target.name]: value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  }

  function validate() {
    const errs = {};
    if (!form.nom.trim()) errs.nom = 'Le nom est requis';
    if (!form.prenom.trim()) errs.prenom = 'Le prenom est requis';
    if (!form.telephone.match(/^(07|05|01)\d{8}$/)) errs.telephone = 'Format: 07, 05 ou 01 + 8 chiffres (10 chiffres)';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email invalide';
    if (form.mot_de_passe.length < 8) errs.mot_de_passe = 'Minimum 8 caracteres';
    if (form.mot_de_passe !== form.confirm_mot_de_passe) errs.confirm_mot_de_passe = 'Ne correspond pas';
    if (!acceptedTerms) errs.terms = 'Vous devez accepter les conditions';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirm_mot_de_passe, ...data } = form;
      await register(data);
      toast.success('Compte cree avec succes');
      navigate('/catalogue');
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur lors de l\'inscription';
      if (err.response?.data?.details) {
        err.response.data.details.forEach(d => setErrors(prev => ({ ...prev, [d.field]: d.message })));
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const ic = (name) => `w-full bg-white/5 border ${errors[name] ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#2ED3A0] transition-colors`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#2ED3A0] to-[#5EE0B8] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#2ED3A0]/30">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Inscription</h1>
          <p className="text-sm text-white/50 mt-1">Creez votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Nom <span className="text-red-400">*</span></label>
              <input name="nom" value={form.nom} onChange={handleChange} className={ic('nom')} required placeholder="Votre nom" />
              {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Prenom <span className="text-red-400">*</span></label>
              <input name="prenom" value={form.prenom} onChange={handleChange} className={ic('prenom')} required placeholder="Votre prenom" />
              {errors.prenom && <p className="text-red-400 text-xs mt-1">{errors.prenom}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Telephone <span className="text-red-400">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-mono">+225</span>
              <input name="telephone" value={form.telephone} onChange={handleChange}
                className={ic('telephone') + ' pl-14'} required placeholder="0701020304" maxLength={10}
                inputMode="numeric" />
            </div>
            <p className="text-white/30 text-xs mt-1">Numeros ivorien: 07, 05 ou 01 suivi de 8 chiffres</p>
            {errors.telephone && <p className="text-red-400 text-xs mt-1">{errors.telephone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Email (optionnel)</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className={ic('email')} placeholder="vous@email.com" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Mot de passe <span className="text-red-400">*</span></label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} name="mot_de_passe" value={form.mot_de_passe}
                onChange={handleChange} className={ic('mot_de_passe') + ' pr-11'} required minLength={8} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.mot_de_passe && <PasswordStrength password={form.mot_de_passe} />}
            {errors.mot_de_passe && <p className="text-red-400 text-xs mt-1">{errors.mot_de_passe}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Confirmer le mot de passe <span className="text-red-400">*</span></label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} name="confirm_mot_de_passe" value={form.confirm_mot_de_passe}
                onChange={handleChange} className={ic('confirm_mot_de_passe') + ' pr-11'} required />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirm_mot_de_passe && <p className="text-red-400 text-xs mt-1">{errors.confirm_mot_de_passe}</p>}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-[#2ED3A0] focus:ring-[#2ED3A0] accent-[#2ED3A0]" />
            <span className="text-white/50 text-xs leading-relaxed">
              J'accepte les{' '}
              <a href="#" className="text-[#2ED3A0] hover:underline">conditions d'utilisation</a> et la{' '}
              <a href="#" className="text-[#2ED3A0] hover:underline">politique de confidentialite</a>
            </span>
          </label>
          {errors.terms && <p className="text-red-400 text-xs -mt-2">{errors.terms}</p>}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#2ED3A0] to-[#5EE0B8] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#2ED3A0]/30 transition-all duration-300 disabled:opacity-50">
            {loading ? 'Inscription...' : <><UserPlus className="w-4 h-4" /> Creer mon compte</>}
          </button>

          <p className="text-center text-sm text-white/40">
            Deja inscrit ?{' '}
            <Link to="/connexion" className="text-[#2ED3A0] hover:underline font-medium">Se connecter</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
