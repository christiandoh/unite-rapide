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
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] flex items-start justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-2xl flex items-center justify-center shadow-lg shadow-[#7C5CFC]/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Confirmer la souscription</h1>
              <p className="text-sm text-white/50">{typeLabel} - {service.operateur?.nom}</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 sm:p-5 mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Service</span>
              <span className="font-medium text-white">{service.nom}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Operateur</span>
              <span className="font-medium text-white">{service.operateur?.nom}</span>
            </div>
            {service.volumeData && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Volume</span>
                <span className="font-medium text-white">{service.volumeData}</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="text-white/50">Montant</span>
              <span className="font-bold text-xl text-white">
                {Number(service.montantWave).toLocaleString('fr-FR')} <span className="text-sm font-normal text-white/40">F</span>
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-white/70 mb-2">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                Numero de telephone beneficiaire
              </div>
            </label>
            <input type="tel" value={telephone}
              onChange={(e) => setTelephone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="0701020304"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg text-white placeholder-white/30 focus:outline-none focus:border-[#7C5CFC] transition-colors mb-6"
              required pattern="0[715]\d{8}" />
            <button type="submit" disabled={submitting || telephone.length !== 10}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Creation en cours...' : <><span>Continuer vers le paiement</span> <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
