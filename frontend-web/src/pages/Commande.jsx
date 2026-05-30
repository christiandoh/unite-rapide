import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Smartphone, Activity } from 'lucide-react';
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
  }, [serviceId]);

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

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] flex items-center justify-center"><div className="text-center py-20 text-white/50">Chargement...</div></div>;
  if (!service) return <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] flex items-center justify-center"><div className="text-center py-20 text-white/50">Service non trouve</div></div>;

  const typeLabel = service.typeService === 'forfait_internet' ? 'Internet'
    : service.typeService === 'credit_appel' ? 'Credit' : 'Forfait';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] flex items-start justify-center px-3 sm:px-4 py-6 sm:py-8">
      <div className="w-full max-w-lg">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-2xl flex items-center justify-center shadow-lg shadow-[#7C5CFC]/20 shrink-0">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">Confirmer la souscription</h1>
              <p className="text-xs sm:text-sm text-white/50 truncate">{typeLabel} - {service.operateur?.nom}</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 sm:p-5 mb-6 space-y-3">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-white/50">Service</span>
              <span className="font-medium text-white text-right">{service.nom}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-white/50">Operateur</span>
              <span className="font-medium text-white text-right">{service.operateur?.nom}</span>
            </div>
            {service.volumeData && (
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-white/50">Volume</span>
                <span className="font-medium text-white text-right">{service.volumeData}</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="text-white/50 text-xs sm:text-sm">Montant</span>
              <span className="font-bold text-lg sm:text-xl text-white">
                {Number(service.montantWave).toLocaleString('fr-FR')} <span className="text-xs sm:text-sm font-normal text-white/40">F</span>
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="block text-xs sm:text-sm font-medium text-white/70 mb-2">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Numero de telephone beneficiaire
              </div>
            </label>
            <input type="tel" value={telephone}
              onChange={(e) => setTelephone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="0701020304"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg text-white placeholder-white/30 focus:outline-none focus:border-[#7C5CFC] transition-colors mb-6"
              required pattern="0[715]\d{8}" />
            <button type="submit" disabled={submitting || telephone.length !== 10}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Creation en cours...' : <><span>Continuer vers le paiement</span> <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
