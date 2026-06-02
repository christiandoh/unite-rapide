import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from '../components/layout/AuthShell';

function PasswordStrength({ password }) {
  const checks = [
    { label: '8 caracteres', ok: password.length >= 8 },
    { label: 'Majuscule', ok: /[A-Z]/.test(password) },
    { label: 'Minuscule', ok: /[a-z]/.test(password) },
    { label: 'Chiffre', ok: /\d/.test(password) },
    { label: 'Special', ok: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-brand-mint'];

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {checks.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[i] : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5 text-xs">
            {c.ok ? <CheckCircle size={10} className="text-brand-mint" /> : <XCircle size={10} className="text-white/30" />}
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

  function fieldClass(name) {
    return `input-dark ${errors[name] ? 'border-red-500/60 focus:border-red-500' : ''}`;
  }

  function validate() {
    const errs = {};
    if (!form.nom.trim()) errs.nom = 'Le nom est requis';
    if (!form.prenom.trim()) errs.prenom = 'Le prenom est requis';
    if (!form.telephone.match(/^(07|05|01)\d{8}$/)) errs.telephone = 'Format: 07, 05 ou 01 + 8 chiffres';
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
        err.response.data.details.forEach((d) => setErrors((prev) => ({ ...prev, [d.field]: d.message })));
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Inscription"
      subtitle="Creez votre compte en quelques secondes"
      icon={UserPlus}
      accent="mint"
      footer={(
        <>
          Deja inscrit ?{' '}
          <Link to="/connexion" className="text-brand-mint hover:underline font-medium">Se connecter</Link>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Nom *</label>
            <input name="nom" value={form.nom} onChange={handleChange} className={fieldClass('nom')} required placeholder="Nom" />
            {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Prenom *</label>
            <input name="prenom" value={form.prenom} onChange={handleChange} className={fieldClass('prenom')} required placeholder="Prenom" />
            {errors.prenom && <p className="text-red-400 text-xs mt-1">{errors.prenom}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Telephone *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-mono">+225</span>
            <input name="telephone" value={form.telephone} onChange={handleChange}
              className={fieldClass('telephone') + ' pl-14'} required placeholder="0701020304" inputMode="numeric" />
          </div>
          {errors.telephone && <p className="text-red-400 text-xs mt-1">{errors.telephone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Email (optionnel)</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className={fieldClass('email')} placeholder="vous@email.com" />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Mot de passe *</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} name="mot_de_passe" value={form.mot_de_passe}
              onChange={handleChange} className={fieldClass('mot_de_passe') + ' pr-11'} required minLength={8} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {form.mot_de_passe && <PasswordStrength password={form.mot_de_passe} />}
          {errors.mot_de_passe && <p className="text-red-400 text-xs mt-1">{errors.mot_de_passe}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Confirmer *</label>
          <div className="relative">
            <input type={showConfirm ? 'text' : 'password'} name="confirm_mot_de_passe" value={form.confirm_mot_de_passe}
              onChange={handleChange} className={fieldClass('confirm_mot_de_passe') + ' pr-11'} required />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirm_mot_de_passe && <p className="text-red-400 text-xs mt-1">{errors.confirm_mot_de_passe}</p>}
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-brand-mint" />
          <span className="text-white/50 text-xs leading-relaxed">
            J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialite
          </span>
        </label>
        {errors.terms && <p className="text-red-400 text-xs -mt-2">{errors.terms}</p>}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-mint to-brand-mint-light text-white py-3.5 rounded-xl font-semibold hover:shadow-glow-mint transition-all disabled:opacity-50">
          {loading ? 'Inscription...' : <><UserPlus className="w-4 h-4" /> Creer mon compte</>}
        </button>
      </form>
    </AuthShell>
  );
}
