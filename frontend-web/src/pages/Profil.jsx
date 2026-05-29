import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, LogOut, Package, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { commandes } from '../services/api';

const BADGE = {
  execute: 'bg-green-50 text-green-700 border-green-200',
  echoue: 'bg-red-50 text-red-700 border-red-200',
  paiement_rejete: 'bg-red-50 text-red-700 border-red-200',
  en_attente_paiement: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  paiement_soumis: 'bg-blue-50 text-blue-700 border-blue-200',
  a_reviser: 'bg-orange-50 text-orange-700 border-orange-200',
  paiement_valide: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  en_cours_execution: 'bg-purple-50 text-purple-700 border-purple-200',
};

const LABEL = {
  execute: 'Terminé', echoue: 'Échoué',
  paiement_rejete: 'Rejeté',
  en_attente_paiement: 'En attente', paiement_soumis: 'En cours',
  a_reviser: 'À réviser', paiement_valide: 'Validé',
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#7C5CFC]/20 shrink-0">
            {user?.nom?.[0] || 'U'}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{user?.nom} {user?.prenom}</h1>
            <p className="text-sm text-gray-500">Votre espace personnel</p>
          </div>
          <button onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <Phone className="w-5 h-5 text-[#7C5CFC]" />
            <div>
              <p className="text-xs text-gray-500">Téléphone</p>
              <p className="font-medium text-gray-900">{user?.telephone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <Mail className="w-5 h-5 text-[#7C5CFC]" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email || 'Non renseigné'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Package className="w-5 h-5 text-[#7C5CFC]" />
          <h2 className="text-lg font-bold text-gray-900">Mes commandes</h2>
        </div>
        {mesCommandes.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Aucune commande</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mesCommandes.map((cmd) => (
              <div key={cmd.id}
                onClick={() => navigate(`/suivi/${cmd.id}`)}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100/50 transition-colors cursor-pointer">
                <div>
                  <p className="font-medium text-sm text-gray-900">{cmd.service?.nom}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{cmd.referenceUnique}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-lg font-medium border ${BADGE[cmd.statutCommande] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {LABEL[cmd.statutCommande] || cmd.statutCommande}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
