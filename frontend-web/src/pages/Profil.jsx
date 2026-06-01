import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, LogOut, Package, Activity, Camera, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { commandes } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';

const BADGE = {
  execute: 'bg-green-500/10 text-green-400 border-green-500/20',
  echoue: 'bg-red-500/10 text-red-400 border-red-500/20',
  paiement_rejete: 'bg-red-500/10 text-red-400 border-red-500/20',
  en_attente_paiement: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  paiement_soumis: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  a_reviser: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  paiement_valide: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  en_cours_execution: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const LABEL = {
  execute: 'Termine', echoue: 'Echoue',
  paiement_rejete: 'Rejete',
  en_attente_paiement: 'En attente', paiement_soumis: 'En cours',
  a_reviser: 'A reviser', paiement_valide: 'Valide',
  en_cours_execution: 'Activation',
};

export default function Profil() {
  const { user, logout, setUser } = useAuth();
  const [mesCommandes, setMesCommandes] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nom: user?.nom || '', prenom: user?.prenom || '', email: user?.email || '' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    commandes.myCommandes({ limit: 10 }).then(({ data }) => setMesCommandes(data.commandes)).catch(() => {});
  }, []);

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image trop volumineuse (max 5 Mo)'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const { data } = await api.post('/users/photo', fd);
      setUser({ ...user, photoUrl: data.photoUrl });
      toast.success('Photo mise a jour');
    } catch { toast.error('Erreur lors du chargement'); }
    finally { setUploading(false); }
  }

  async function handleSave() {
    try {
      const { data } = await api.put('/users/profile', form);
      setUser({ ...user, ...data.user });
      setEditing(false);
      toast.success('Profil mis a jour');
    } catch { toast.error('Erreur lors de la mise a jour'); }
  }

  const initials = `${user?.nom?.[0] || ''}${user?.prenom?.[0] || ''}` || 'U';
  const photoUrl = user?.photoUrl ? `${process.env.REACT_APP_API_URL || '/api'}/../${user.photoUrl}` : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] px-3 sm:px-4 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Carte profil */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div className="relative group shrink-0">
              <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white text-xl sm:text-3xl font-bold shadow-lg shadow-[#7C5CFC]/20 overflow-hidden ${photoUrl ? '' : 'bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF]'}`}>
                {photoUrl ? (
                  <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-[#7C5CFC] rounded-full flex items-center justify-center hover:bg-[#6B3CE1] transition-colors shadow-lg disabled:opacity-50">
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>

            <div className="flex-1 min-w-0 pt-1">
              {editing ? (
                <div className="space-y-2">
                  <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7C5CFC]" placeholder="Nom" />
                  <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7C5CFC]" placeholder="Prenom" />
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7C5CFC]" placeholder="Email" />
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSave} className="px-4 py-1.5 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white text-xs font-medium rounded-lg hover:opacity-90">Enregistrer</button>
                    <button onClick={() => setEditing(false)} className="px-4 py-1.5 bg-white/10 text-white/70 text-xs rounded-lg hover:bg-white/20">Annuler</button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-base sm:text-xl font-bold text-white truncate">{user?.nom} {user?.prenom}</h1>
                  <p className="text-xs sm:text-sm text-white/50">Votre espace personnel</p>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 pt-1">
              {!editing && (
                <button onClick={() => setEditing(true)}
                  className="p-2 text-white/40 hover:text-white/70 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              <button onClick={logout}
                className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Deconnexion
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 sm:p-4">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-[#7C5CFC] shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-white/50">Telephone</p>
                <p className="font-medium text-white text-sm sm:text-base truncate">{user?.telephone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 sm:p-4">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[#7C5CFC] shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-white/50">Email</p>
                <p className="font-medium text-white text-sm sm:text-base truncate">{user?.email || 'Non renseigne'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Commandes */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#7C5CFC]" />
            <h2 className="text-base sm:text-lg font-bold text-white">Mes commandes</h2>
          </div>
          {mesCommandes.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Aucune commande</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {mesCommandes.map((cmd) => (
                <div key={cmd.id}
                  onClick={() => navigate(`/suivi/${cmd.id}`)}
                  className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="min-w-0 flex-1 mr-2 sm:mr-3">
                    <p className="font-medium text-xs sm:text-sm text-white truncate">{cmd.service?.nom}</p>
                    <p className="text-[10px] sm:text-xs text-white/50 mt-0.5 truncate">{cmd.referenceUnique}</p>
                  </div>
                  <span className={`text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg font-medium border shrink-0 ${BADGE[cmd.statutCommande] || 'bg-white/10 text-white/50 border-white/10'}`}>
                    {LABEL[cmd.statutCommande] || cmd.statutCommande}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
