import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
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
  { id: 'forfait_mixte', nom: 'Mixte' },
  { id: 'abonnement', nom: 'Abonnement' },
];

export default function Catalogue() {
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [showFilters, setShowFilters] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Catalogue</h1>
          <p className="text-white/50 text-sm sm:text-base mt-1">Choisissez votre forfait</p>
        </div>

        <div className="space-y-4 mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/30" />
            <input type="text" placeholder="Rechercher..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadServices()}
              className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#7C5CFC] transition-colors text-sm sm:text-base" />
          </div>

          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors sm:hidden">
            <Filter className="w-4 h-4" />
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>

          <div className={`space-y-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
            <OperatorFilter operators={OPERATORS} selected={selectedOperator} onSelect={setSelectedOperator} />

            <div className="flex gap-2 overflow-x-auto pb-1">
              {TYPES.map((type) => (
                <button key={type.id} onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                    selectedType === type.id ? 'bg-[#7C5CFC] text-white shadow-sm' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}>
                  {type.nom}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="animate-pulse bg-white/5 rounded-2xl border border-white/5 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-xl" />
                  <div className="space-y-2">
                    <div className="bg-white/10 h-3 w-16 rounded" />
                    <div className="bg-white/10 h-3 w-12 rounded" />
                  </div>
                </div>
                <div className="bg-white/10 h-5 w-40 rounded mb-3" />
                <div className="bg-white/10 h-3 w-24 rounded mb-1" />
                <div className="bg-white/10 h-3 w-28 rounded" />
              </div>
            ))}
          </div>
        ) : servicesList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/40 text-lg">Aucun service trouve</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {servicesList.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      pagination.page === p ? 'bg-[#7C5CFC] text-white shadow-sm' : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
