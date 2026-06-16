import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Clock, ExternalLink, Smartphone, AlertCircle } from 'lucide-react';
import { commandes } from '../services/api';
import toast from 'react-hot-toast';

const METHODS = [
  { id: 'wave', label: 'Wave' },
  { id: 'orange', label: 'Orange Money' },
  { id: 'mtn', label: 'MTN MoMo' },
  { id: 'moov', label: 'Moov Money' },
  { id: 'djamo', label: 'Djamo' },
];

export default function Paiement() {
  const { commandeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [commande, setCommande] = useState(null);
  const [timeLeft, setTimeLeft] = useState(900);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadCommande(); }, [commandeId]);

  useEffect(() => {
    if (searchParams.get('payment') === 'error') {
      toast.error('Le paiement a échoué. Réessayez.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!commande?.dateExpirationPaiement) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(commande.dateExpirationPaiement) - new Date()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [commande?.dateExpirationPaiement]);

  async function loadCommande() {
    try {
      const { data } = await commandes.getById(commandeId);
      setCommande(data.commande);
    } catch (err) { console.error(err); }
  }

  function handlePay() {
    if (!commande?.lienPaiementWave) {
      toast.error('Lien de paiement indisponible');
      return;
    }
    setLoading(true);
    window.location.href = commande.lienPaiementWave;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const methodLabel = METHODS.find(m => m.id === commande?.methodePaiement)?.label || 'Mobile Money';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] flex items-start justify-center px-3 sm:px-4 py-6 sm:py-8">
      <div className="w-full max-w-lg">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-10 h-10 bg-[#7C5CFC]/20 rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-[#A78BFF]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">Paiement Mobile Money</h1>
              <p className="text-xs text-white/50">Via Jeko — Wave, Orange, MTN, Moov, Djamo</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {[
              'Cliquez sur « Payer maintenant » pour ouvrir votre application de paiement',
              'Confirmez le montant affiché sur votre téléphone',
              'Vous serez redirigé automatiquement après validation',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#7C5CFC]/10 text-[#A78BFF] rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-xs sm:text-sm text-white/60">{step}</p>
              </div>
            ))}
          </div>

          {commande && (
            <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Montant</span>
                <span className="font-bold text-white">{Number(commande.montant).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Méthode</span>
                <span className="text-[#A78BFF]">{methodLabel}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Référence</span>
                <span className="font-mono text-xs text-white/90">{commande.referenceUnique}</span>
              </div>
            </div>
          )}

          {commande?.lienPaiementWave ? (
            <button
              onClick={handlePay}
              disabled={loading || timeLeft <= 0}
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#2ED3A0] to-[#5EE0B8] text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold hover:shadow-lg hover:shadow-[#2ED3A0]/30 transition-all duration-300 mb-4 disabled:opacity-50"
            >
              {loading ? 'Redirection...' : <>Payer maintenant <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></>}
            </button>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
              <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
              <p className="text-yellow-400 text-xs">Lien de paiement en cours de génération...</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
            <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${timeLeft < 120 ? 'text-red-400' : 'text-white/50'}`} />
            <p className={`text-xl sm:text-2xl font-mono font-bold ${timeLeft < 120 ? 'text-red-400' : 'text-white'}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
            <span className="text-xs sm:text-sm text-white/40">restant</span>
          </div>

          <button
            onClick={() => navigate(`/suivi/${commandeId}`)}
            className="flex items-center justify-center gap-2 w-full border border-white/10 text-white/70 px-4 py-3 rounded-xl text-sm hover:bg-white/5 transition-colors"
          >
            J'ai déjà payé — Suivre ma commande <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[10px] sm:text-xs text-white/30 text-center mt-4">
            Paiement sécurisé par Jeko. Aucune capture d'écran requise.
          </p>
        </div>
      </div>
    </div>
  );
}
