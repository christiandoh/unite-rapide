import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Smartphone, CreditCard, Zap, Activity, CheckCircle } from 'lucide-react';
import { services } from '../services/api';
import ServiceCard from '../components/catalogue/ServiceCard';

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    services.featured().then(({ data }) => setFeatured(data.populaires)).catch(() => {});
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#7C5CFC]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#2ED3A0]/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <Activity className="w-4 h-4 text-[#7C5CFC]" />
            <span className="text-sm text-white/60">Plateforme officielle Orange, MTN, Moov</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Forfaits Internet &<br />
            <span className="bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] bg-clip-text text-transparent">Credit en Cote d'Ivoire</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Souscrivez a vos forfaits Orange, MTN et Moov en ligne. Paiement Wave securise et activation automatique.
          </p>
          <Link to="/catalogue"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-[#7C5CFC]/30 transition-all duration-300">
            Voir les offres
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Forfaits populaires</h2>
              <p className="text-gray-500 mt-1">Les offres les plus demandees du moment</p>
            </div>
            <Link to="/catalogue" className="hidden sm:flex items-center gap-1 text-[#7C5CFC] font-medium text-sm hover:underline">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((s) => <ServiceCard key={s.id} service={s} />)}
          </div>
        </section>
      )}

      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Comment ca marche ?</h2>
            <p className="text-gray-500 mt-2">3 etapes simples pour activer votre forfait</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              { icon: Smartphone, title: 'Choisissez', desc: 'Parcourez notre catalogue et selectionnez le forfait qui vous convient', color: 'from-[#7C5CFC] to-[#A78BFF]' },
              { icon: CreditCard, title: 'Payez', desc: 'Effectuez le paiement via Wave en toute securite', color: 'from-[#2ED3A0] to-[#5EE0B8]' },
              { icon: Zap, title: 'Activez', desc: 'Votre forfait est active automatiquement en quelques instants', color: 'from-[#3B82F6] to-[#60A5FA]' },
            ].map((item, i) => (
              <div key={item.title} className="text-center relative">
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gray-200 last:hidden" style={i === 2 ? { display: 'none' } : {}} />
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Pret a souscrire ?</h2>
            <p className="text-white/60 mb-8 max-w-lg mx-auto">
              Rejoignez des milliers de clients satisfaits et activez votre forfait des maintenant.
            </p>
            <Link to="/catalogue"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-8 py-3.5 rounded-xl font-semibold hover:shadow-xl hover:shadow-[#7C5CFC]/30 transition-all duration-300">
              Decouvrir les offres
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
