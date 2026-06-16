import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PinInput from '../components/PinInput';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Inscription() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '', email: '', code_pin: '', confirm_code_pin: '' });
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
    if (!form.prenom.trim()) errs.prenom = 'Le prénom est requis';
    if (!form.telephone.match(/^(07|05|01)\d{8}$/)) errs.telephone = 'Format: 07, 05 ou 01 + 8 chiffres';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email invalide';
    if (!/^\d{4}$/.test(form.code_pin)) errs.code_pin = 'Code à 4 chiffres requis';
    if (form.code_pin !== form.confirm_code_pin) errs.confirm_code_pin = 'Les codes ne correspondent pas';
    if (!acceptedTerms) errs.terms = 'Vous devez accepter les conditions';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirm_code_pin, ...data } = form;
      await register(data);
      toast.success('Compte créé avec succès');
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
          <p className="text-sm text-white/50 mt-1">Créez votre compte avec un code à 4 chiffres</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Nom *</label>
              <input name="nom" value={form.nom} onChange={handleChange} className={ic('nom')} required placeholder="Votre nom" />
              {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Prénom *</label>
              <input name="prenom" value={form.prenom} onChange={handleChange} className={ic('prenom')} required placeholder="Votre prénom" />
              {errors.prenom && <p className="text-red-400 text-xs mt-1">{errors.prenom}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Téléphone *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-mono">+225</span>
              <input name="telephone" value={form.telephone} onChange={handleChange}
                className={ic('telephone') + ' pl-14'} required placeholder="0701020304" maxLength={10} inputMode="numeric" />
            </div>
            {errors.telephone && <p className="text-red-400 text-xs mt-1">{errors.telephone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Email (optionnel)</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className={ic('email')} placeholder="vous@email.com" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-3 text-center">Choisissez un code secret *</label>
            <PinInput value={form.code_pin} onChange={(v) => { setForm({ ...form, code_pin: v }); setErrors({ ...errors, code_pin: '' }); }} disabled={loading} />
            {errors.code_pin && <p className="text-red-400 text-xs mt-1 text-center">{errors.code_pin}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-3 text-center">Confirmez le code *</label>
            <PinInput value={form.confirm_code_pin} onChange={(v) => { setForm({ ...form, confirm_code_pin: v }); setErrors({ ...errors, confirm_code_pin: '' }); }} disabled={loading} />
            {errors.confirm_code_pin && <p className="text-red-400 text-xs mt-1 text-center">{errors.confirm_code_pin}</p>}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-[#2ED3A0] accent-[#2ED3A0]" />
            <span className="text-white/50 text-xs leading-relaxed">
              J'accepte les conditions d'utilisation et la politique de confidentialité
            </span>
          </label>
          {errors.terms && <p className="text-red-400 text-xs -mt-2">{errors.terms}</p>}

          <button type="submit" disabled={loading || form.code_pin.length !== 4}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#2ED3A0] to-[#5EE0B8] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#2ED3A0]/30 transition-all duration-300 disabled:opacity-50">
            {loading ? 'Inscription...' : <><UserPlus className="w-4 h-4" /> Créer mon compte</>}
          </button>

          <p className="text-center text-sm text-white/40">
            Déjà inscrit ?{' '}
            <Link to="/connexion" className="text-[#2ED3A0] hover:underline font-medium">Se connecter</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
