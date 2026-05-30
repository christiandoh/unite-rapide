import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, LogOut, Package, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { commandes } from '../services/api';

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
  const { user, logout } = useAuth();
  const [mesCommandes, setMesCommandes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    commandes.myCommandes({ limit: 10 }).then(({ data }) => setMesCommandes(data.commandes)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] px-3 sm:px-4 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-2xl flex items-center justify-center text-white text-lg sm:text-2xl font-bold shadow-lg shadow-[#7C5CFC]/20 shrink-0">
              {user?.nom?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-white truncate">{user?.nom} {user?.prenom}</h1>
              <p className="text-xs sm:text-sm text-white/50">Votre espace personnel</p>
            </div>
            <button onClick={logout}
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0">
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Deconnexion
            </button>
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
