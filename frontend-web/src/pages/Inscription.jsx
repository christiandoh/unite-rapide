import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Eye, EyeOff, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Inscription() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '', email: '', mot_de_passe: '', confirm_mot_de_passe: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  }

  function validate() {
    const errs = {};
    if (!form.nom.trim()) errs.nom = 'Le nom est requis';
    if (!form.telephone.match(/^(07|05|01)\d{8}$/)) errs.telephone = 'Format: 07XXXXXX (10 chiffres)';
    if (form.mot_de_passe.length < 8) errs.mot_de_passe = 'Minimum 8 caracteres';
    if (form.mot_de_passe !== form.confirm_mot_de_passe) errs.confirm_mot_de_passe = 'Les mots de passe ne correspondent pas';
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
        err.response.data.details.forEach(d => {
          setErrors(prev => ({ ...prev, [d.field]: d.message }));
        });
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (name) =>
    `w-full bg-white/5 border ${errors[name] ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#2ED3A0] transition-colors`;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
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
              <label className="block text-sm font-medium text-white/70 mb-1.5">Nom</label>
              <input name="nom" value={form.nom} onChange={handleChange} className={inputClass('nom')} required />
              {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Prenom</label>
              <input name="prenom" value={form.prenom} onChange={handleChange} className={inputClass('prenom')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Telephone</label>
            <input name="telephone" value={form.telephone} onChange={handleChange}
              className={inputClass('telephone')} required placeholder="0701020304" maxLength={10} />
            <p className="text-white/30 text-xs mt-1">Numeros ivorien: 07, 05 ou 01 suivi de 8 chiffres</p>
            {errors.telephone && <p className="text-red-400 text-xs mt-1">{errors.telephone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Email (optionnel)</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass('email')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} name="mot_de_passe" value={form.mot_de_passe}
                onChange={handleChange} className={inputClass('mot_de_passe') + ' pr-11'} required minLength={8} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.mot_de_passe && <p className="text-red-400 text-xs mt-1">{errors.mot_de_passe}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Confirmer le mot de passe</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} name="confirm_mot_de_passe" value={form.confirm_mot_de_passe}
                onChange={handleChange} className={inputClass('confirm_mot_de_passe') + ' pr-11'} required />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirm_mot_de_passe && <p className="text-red-400 text-xs mt-1">{errors.confirm_mot_de_passe}</p>}
          </div>

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
