import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Activity } from 'lucide-react';
import { commandes } from '../services/api';
import { connectWebSocket, subscribeCommande, unsubscribeCommande, onStatusUpdate } from '../services/websocket';

const ETAPES = [
  { key: 'en_attente_paiement', label: 'Paiement' },
  { key: 'paiement_soumis', label: 'Verification IA' },
  { key: 'a_reviser', label: 'Revision manuelle' },
  { key: 'paiement_valide', label: 'Envoi USSD' },
  { key: 'en_cours_execution', label: 'Activation' },
  { key: 'execute', label: 'Termine' },
];

const STATUS_MAP = {
  en_attente_paiement: 0, paiement_soumis: 1, a_reviser: 2, paiement_valide: 3,
  en_cours_execution: 4, execute: 5, echoue: -1, paiement_rejete: -1,
};

export default function Suivi() {
  const { commandeId } = useParams();
  const [commande, setCommande] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCommande();
    const socket = connectWebSocket();
    subscribeCommande(commandeId);
    const cleanup = onStatusUpdate((data) => {
      if (data.commandeId === commandeId) {
        setCommande((prev) => ({ ...prev, statutCommande: data.status }));
      }
    });
    return () => { unsubscribeCommande(commandeId); if (cleanup) cleanup(); };
  }, [commandeId]);

  async function loadCommande() {
    try {
      const { data } = await commandes.getById(commandeId);
      setCommande(data.commande);
    } catch (err) { setError('Commande non trouvee'); }
  }

  const stepIndex = commande ? (STATUS_MAP[commande.statutCommande] ?? -1) : 0;
  const isError = commande?.statutCommande === 'echoue' || commande?.statutCommande === 'paiement_rejete';
  const isSuccess = commande?.statutCommande === 'execute';
  const isReview = commande?.statutCommande === 'a_reviser';

  if (error) return <div className="text-center py-20 text-red-500 font-medium">{error}</div>;
  if (!commande) return (
    <div className="text-center py-20">
      <Loader className="w-8 h-8 animate-spin text-[#7C5CFC] mx-auto" />
      <p className="text-gray-500 mt-3">Chargement...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#7C5CFC]/20">
          <Activity className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Suivi de la commande</h1>
        <p className="text-gray-500 text-sm mt-1">Ref: {commande.referenceUnique}</p>
      </div>

      <div className="relative max-w-md mx-auto">
        {ETAPES.map((etape, index) => {
          const isActive = index <= stepIndex;
          const isCurrent = index === stepIndex;
          const isPast = index < stepIndex;
          return (
            <div key={etape.key} className="flex items-start mb-8 last:mb-0">
              <div className="flex flex-col items-center mr-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-300 ${
                  isActive ? 'bg-[#7C5CFC] text-white shadow-md shadow-[#7C5CFC]/20' : 'bg-gray-100 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-[#7C5CFC]/20' : ''}`}>
                  {isPast ? <CheckCircle className="w-5 h-5" /> : index + 1}
                </div>
                {index < ETAPES.length - 1 && (
                  <div className={`w-0.5 h-8 mt-1 ${isActive ? 'bg-[#7C5CFC]/30' : 'bg-gray-200'}`} />
                )}
              </div>
              <div className="pt-1.5">
                <p className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{etape.label}</p>
                {isCurrent && !isError && !isSuccess && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 bg-[#7C5CFC] rounded-full animate-pulse" />
                    <span className="text-xs text-[#7C5CFC]">En cours</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isError && (
        <div className="mt-8 bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-700 font-semibold mb-1">Echec de la transaction</p>
          <p className="text-red-500 text-sm">Contactez le support pour plus d'informations</p>
        </div>
      )}

      {isSuccess && (
        <div className="mt-8 bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-green-700 font-semibold mb-1">Service active avec succes !</p>
          <p className="text-green-500 text-sm">Votre forfait est maintenant actif</p>
        </div>
      )}

      {isReview && (
        <div className="mt-8 bg-yellow-50 border border-yellow-100 rounded-2xl p-6 text-center">
          <Loader className="w-8 h-8 animate-spin text-yellow-500 mx-auto mb-3" />
          <p className="text-yellow-700 font-semibold mb-1">Paiement en cours de vérification</p>
          <p className="text-yellow-500 text-sm">Notre équipe vérifie manuellement votre paiement. Cela peut prendre quelques minutes.</p>
        </div>
      )}

      {stepIndex >= 0 && !isError && !isSuccess && !isReview && (
        <div className="mt-8 bg-[#7C5CFC]/5 border border-[#7C5CFC]/10 rounded-2xl p-6 text-center">
          <Loader className="w-8 h-8 animate-spin text-[#7C5CFC] mx-auto mb-3" />
          <p className="text-[#7C5CFC] font-medium">Traitement en cours...</p>
        </div>
      )}
    </div>
  );
}
