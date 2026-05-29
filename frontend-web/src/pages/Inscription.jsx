import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Inscription() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '', email: '', mot_de_passe: '' });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.mot_de_passe.length < 8) {
      toast.error('Mot de passe : minimum 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Compte cree avec succes');
      navigate('/catalogue');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  }

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
              <input name="nom" value={form.nom} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#2ED3A0] transition-colors" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Prenom</label>
              <input name="prenom" value={form.prenom} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#2ED3A0] transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Telephone</label>
            <input name="telephone" value={form.telephone} onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#2ED3A0] transition-colors"
              required placeholder="0701020304" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Email (optionnel)</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#2ED3A0] transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Mot de passe</label>
            <input type="password" name="mot_de_passe" value={form.mot_de_passe} onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#2ED3A0] transition-colors"
              required minLength={8} />
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
