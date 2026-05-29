import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { services } from '../services/api';
import ServiceCard from '../components/catalogue/ServiceCard';
import OperatorFilter from '../components/catalogue/OperatorFilter';

const OPERATORS = [
  { id: 'Orange', nom: 'Orange', color: '#FF6600' },
  { id: 'MTN', nom: 'MTN', color: '#FFCC00' },
  { id: 'Moov', nom: 'Moov', color: '#00A3E0' },
];

const TYPES = [
  { id: 'forfait_internet', nom: 'Internet' },
  { id: 'credit_appel', nom: 'Credit' },
  { id: 'forfait_mixte', nom: 'Forfait Mixte' },
  { id: 'abonnement', nom: 'Abonnement' },
];

export default function Catalogue() {
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [selectedOperator, selectedType]);

  useEffect(() => {
    loadServices();
  }, [selectedOperator, selectedType, pagination.page]);

  async function loadServices() {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 20 };
      if (selectedOperator) params.operateur = selectedOperator;
      if (selectedType) params.type = selectedType;
      if (search) params.search = search;
      const { data } = await services.list(params);
      setServicesList(data.services);
      setPagination((prev) => ({ ...prev, ...data.pagination }));
    } catch (err) {
      console.error('Erreur chargement services:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Catalogue des services</h1>
        <p className="text-gray-500 mt-1">Choisissez votre operateur et le forfait qui vous convient</p>
      </div>

      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Rechercher un forfait..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadServices()}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#7C5CFC] transition-colors" />
        </div>

        <OperatorFilter operators={OPERATORS} selected={selectedOperator} onSelect={setSelectedOperator} />

        <div className="flex gap-2 flex-wrap">
          {TYPES.map((type) => (
            <button key={type.id} onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedType === type.id ? 'bg-[#7C5CFC] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {type.nom}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="animate-pulse bg-white rounded-2xl border border-gray-100 p-6 h-52">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="bg-gray-200 h-3 w-16 rounded" />
                  <div className="bg-gray-200 h-3 w-12 rounded" />
                </div>
              </div>
              <div className="bg-gray-200 h-5 w-40 rounded mb-3" />
              <div className="bg-gray-200 h-3 w-24 rounded mb-1" />
              <div className="bg-gray-200 h-3 w-28 rounded" />
            </div>
          ))}
        </div>
      ) : servicesList.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">Aucun service trouve</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesList.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                    pagination.page === p ? 'bg-[#7C5CFC] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
