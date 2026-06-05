import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { services } from '../services/api';
import ServiceCard from '../components/catalogue/ServiceCard';
import OperatorFilter from '../components/catalogue/OperatorFilter';
import PageHeader from '../components/layout/PageHeader';

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

  const hasFilters = selectedOperator || selectedType || search;

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <PageHeader
          label="Catalogue"
          title="Choisissez votre forfait"
          description="Internet, credit et abonnements — Orange, MTN et Moov"
        />

        <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Rechercher un forfait..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadServices()}
                className="input-dark pl-11"
              />
            </div>
            <button type="button" onClick={loadServices}
              className="btn-primary px-6 py-3 text-sm shrink-0">
              Rechercher
            </button>
          </div>

          <button type="button" onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors lg:hidden">
            <Filter className="w-4 h-4" />
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>

          <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <OperatorFilter operators={OPERATORS} selected={selectedOperator} onSelect={setSelectedOperator} />
            <div className="flex gap-2 overflow-x-auto pb-1">
              {TYPES.map((type) => (
                <button key={type.id} type="button" onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    selectedType === type.id
                      ? 'bg-brand-mint/20 text-brand-mint border border-brand-mint/30'
                      : 'glass-panel text-white/55 hover:bg-white/10 hover:text-white'
                  }`}>
                  {type.nom}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button type="button" onClick={() => { setSelectedOperator(null); setSelectedType(null); setSearch(''); }}
              className="inline-flex items-center gap-1.5 text-xs text-white/45 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" /> Reinitialiser les filtres
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="animate-pulse glass-panel rounded-2xl p-6 h-64">
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="bg-white/10 h-3 w-20 rounded" />
                    <div className="bg-white/10 h-3 w-14 rounded" />
                  </div>
                </div>
                <div className="bg-white/10 h-5 w-3/4 rounded mb-6" />
                <div className="bg-white/10 h-8 w-1/2 rounded mt-auto" />
              </div>
            ))}
          </div>
        ) : servicesList.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-2xl">
            <p className="text-white/40 text-lg mb-2">Aucun forfait trouve</p>
            <p className="text-white/30 text-sm">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <>
            <p className="text-white/40 text-sm mb-4">{servicesList.length} forfait(s) affiche(s)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {servicesList.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} type="button" onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                      pagination.page === p
                        ? 'bg-brand-purple text-white shadow-glow'
                        : 'glass-panel text-white/55 hover:bg-white/10'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
