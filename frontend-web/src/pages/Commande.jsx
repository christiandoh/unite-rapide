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

  if (loading) return <div className="text-center py-20 text-gray-500">Chargement...</div>;
  if (!service) return <div className="text-center py-20 text-gray-500">Service non trouve</div>;

  const typeLabel = service.typeService === 'forfait_internet' ? 'Internet'
    : service.typeService === 'credit_appel' ? 'Credit' : 'Forfait';

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-2xl flex items-center justify-center shadow-lg shadow-[#7C5CFC]/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Confirmer la souscription</h1>
            <p className="text-sm text-gray-500">{typeLabel} - {service.operateur?.nom}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Service</span>
            <span className="font-medium text-gray-900">{service.nom}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Operateur</span>
            <span className="font-medium text-gray-900">{service.operateur?.nom}</span>
          </div>
          {service.volumeData && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Volume</span>
              <span className="font-medium text-gray-900">{service.volumeData}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-3 flex justify-between">
            <span className="text-gray-500">Montant</span>
            <span className="font-bold text-xl text-gray-900">
              {Number(service.montantWave).toLocaleString('fr-FR')} <span className="text-sm font-normal text-gray-400">F</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              Numero de telephone beneficiaire
            </div>
          </label>
          <input type="tel" value={telephone}
            onChange={(e) => setTelephone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="0701020304"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-[#7C5CFC] transition-colors mb-6"
            required pattern="0[715]\d{8}" />
          <button type="submit" disabled={submitting || telephone.length !== 10}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Creation en cours...' : <><span>Continuer vers le paiement</span> <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
