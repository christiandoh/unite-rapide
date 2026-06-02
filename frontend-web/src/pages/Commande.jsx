import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Smartphone, Activity, ShieldCheck } from 'lucide-react';
import { services, commandes } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Commande() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/connexion'); return; }
    loadService();
  }, [serviceId, user, navigate]);

  async function loadService() {
    try {
      const { data } = await services.getById(serviceId);
      setService(data.service);
      setTelephone(data.service.operateur?.prefixe || '07');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (telephone.length < 10) return;
    setSubmitting(true);
    try {
      const { data } = await commandes.create({ service_id: serviceId, telephone_beneficiaire: telephone });
      navigate(`/paiement/${data.commande.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-white/50 animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-white/60">Service non trouve</p>
        </div>
      </div>
    );
  }

  const typeLabel = service.typeService === 'forfait_internet' ? 'Internet'
    : service.typeService === 'credit_appel' ? 'Credit' : 'Forfait';

  return (
    <div className="min-h-screen bg-brand-dark flex items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg">
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-purple to-brand-purple-light rounded-2xl flex items-center justify-center shadow-glow shrink-0">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="section-label mb-1">Etape 1 sur 3</p>
              <h1 className="text-xl font-bold text-white">Confirmer la souscription</h1>
              <p className="text-sm text-white/50">{typeLabel} · {service.operateur?.nom}</p>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 mb-6 space-y-3">
            {[
              ['Service', service.nom],
              ['Operateur', service.operateur?.nom],
              service.volumeData && ['Volume', service.volumeData],
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm gap-4">
                <span className="text-white/45 shrink-0">{label}</span>
                <span className="font-medium text-white text-right">{value}</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <span className="text-white/45 text-sm">Montant Wave</span>
              <span className="font-bold text-2xl text-brand-mint">
                {Number(service.montantWave).toLocaleString('fr-FR')}
                <span className="text-sm font-normal text-white/40 ml-1">F</span>
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-white/70 mb-2">
              <span className="flex items-center gap-1.5 mb-2">
                <Smartphone className="w-4 h-4" />
                Numero beneficiaire
              </span>
            </label>
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="0701020304"
              className="input-dark text-lg mb-2"
              required
              pattern="0[715]\d{8}"
            />
            <p className="text-xs text-white/35 mb-6 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-mint" />
              Le forfait sera active sur ce numero
            </p>
            <button type="submit" disabled={submitting || telephone.length !== 10} className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Creation en cours...' : <>Continuer vers le paiement <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
