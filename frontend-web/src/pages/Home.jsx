import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Smartphone, CreditCard, Zap, Shield, Users, CheckCircle, Star, Activity, ChevronDown } from 'lucide-react';
import { services } from '../services/api';

function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && (setInView(true), obs.unobserve(el)), { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function AnimatedSection({ children, className, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'}`}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className={className}>{children}</div>
    </div>
  );
}

function CountUp({ end, suffix = '' }) {
  const [ref, inView] = useInView();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const dur = 2000;
    const step = Math.ceil(end / (dur / 16));
    const t = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(t); }
      else setCount(start);
    }, 16);
    return () => clearInterval(t);
  }, [inView, end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const operators = [
  { name: 'Orange CI', color: 'from-orange-500 to-orange-600' },
  { name: 'MTN CI', color: 'from-yellow-500 to-yellow-600' },
  { name: 'Moov', color: 'from-red-500 to-red-600' },
];

const stats = [
  { value: 15000, label: 'Clients satisfaits', suffix: '+' },
  { value: 50, label: 'Forfaits disponibles', suffix: '+' },
  { value: 99, label: 'Taux de succes', suffix: '%' },
  { value: 5, label: 'Minutes d\'activation', suffix: ' min' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    services.featured().then(({ data }) => setFeatured(data.populaires || [])).catch(() => {});
    setTimeout(() => setHeroLoaded(true), 100);
  }, []);

  return (
    <div className="bg-[#08080F] text-white overflow-hidden">
      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#7C5CFC]/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#2ED3A0]/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        </div>

        <div className={`relative max-w-5xl mx-auto px-6 text-center transition-all duration-1000 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 mb-8 backdrop-blur-sm">
            <Activity className="w-4 h-4 text-[#2ED3A0]" />
            <span className="text-sm text-white/70">Plateforme officielle Orange, MTN, Moov</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1]">
            Forfaits Internet &<br />
            <span className="bg-gradient-to-r from-[#7C5CFC] via-[#A78BFF] to-[#2ED3A0] bg-clip-text text-transparent">Credit en Côte d'Ivoire</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
            Souscrivez a vos forfaits Orange, MTN et Moov en ligne. 
            Paiement Wave securise et activation automatique en moins de 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/catalogue"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-[#7C5CFC]/40 transition-all duration-500 hover:scale-105">
              Voir les offres
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/connexion"
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/80 px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm">
              Deja inscrit ?
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-white/40">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#2ED3A0]" /> Paiement securise</div>
            <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#2ED3A0]" /> Activation instantanee</div>
            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-[#2ED3A0]" /> Support client</div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/30" />
        </div>
      </section>

      {/* ── Operateurs ── */}
      <AnimatedSection className="py-12 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-sm text-white/30 mb-6 uppercase tracking-widest">Operateurs partenaires</p>
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {operators.map((op, i) => (
              <div key={op.name} className={`flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r ${op.color}/10 border border-white/5 backdrop-blur-sm`}>
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${op.color}`} />
                <span className="text-white/70 font-medium">{op.name}</span>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── Stats ── */}
      <AnimatedSection delay={100}>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                  <CountUp end={s.value} suffix={s.suffix} />
                </p>
                <p className="text-white/40 text-sm mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── Fonctionnement ── */}
      <AnimatedSection delay={200}>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comment ça marche ?</h2>
            <p className="text-white/50 text-lg">3 etapes pour activer votre forfait</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Smartphone, title: 'Choisissez', desc: 'Parcourez notre catalogue et selectionnez le forfait qui vous convient', color: 'from-[#7C5CFC] to-[#A78BFF]', step: '01' },
              { icon: CreditCard, title: 'Payez', desc: 'Effectuez le paiement via Wave en toute securite', color: 'from-[#2ED3A0] to-[#5EE0B8]', step: '02' },
              { icon: Zap, title: 'Activez', desc: 'Votre forfait est active automatiquement en moins de 5 minutes', color: 'from-[#3B82F6] to-[#60A5FA]', step: '03' },
            ].map((item) => (
              <div key={item.title} className="group relative bg-white/[0.03] border border-white/5 rounded-2xl p-8 text-center hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500">
                <span className="absolute top-4 right-4 text-5xl font-bold text-white/5 group-hover:text-white/10 transition-colors">{item.step}</span>
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── Forfaits populaires ── */}
      {featured.length > 0 && (
        <AnimatedSection delay={300}>
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Forfaits populaires</h2>
                <p className="text-white/50">Les offres les plus demandées du moment</p>
              </div>
              <Link to="/catalogue" className="hidden sm:flex items-center gap-2 text-[#7C5CFC] hover:text-[#A78BFF] font-medium transition-colors">
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((s) => (
                <Link key={s.id} to={`/catalogue`}
                  className="group bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.06] hover:border-[#7C5CFC]/30 hover:shadow-lg hover:shadow-[#7C5CFC]/10 transition-all duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C5CFC]/20 to-[#A78BFF]/20 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-[#7C5CFC]" />
                    </div>
                    <span className="text-sm text-white/40">{s.operateur?.nom}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-[#7C5CFC] transition-colors">{s.nom}</h3>
                  <p className="text-white/50 text-sm mb-4 line-clamp-2">{s.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold bg-gradient-to-r from-[#2ED3A0] to-[#5EE0B8] bg-clip-text text-transparent">
                      {Number(s.montant_wave).toLocaleString()} FCFA
                    </span>
                    <span className="text-xs text-white/30 group-hover:text-[#7C5CFC] transition-colors">Voir plus →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ── Features ── */}
      <AnimatedSection delay={400}>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pourquoi nous choisir ?</h2>
            <p className="text-white/50 text-lg">La meilleure plateforme de souscription en Côte d'Ivoire</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Paiement securise', desc: 'Transactions via Wave Business avec validation par IA pour une securite maximale' },
              { icon: Zap, title: 'Activation rapide', desc: 'Votre forfait est active en moins de 5 minutes apres confirmation du paiement' },
              { icon: Users, title: 'Support client', desc: 'Une equipe dediee pour vous accompagner 7j/7 par telephone et WhatsApp' },
              { icon: Star, title: 'Meilleurs prix', desc: 'Forfaits aux meilleurs tarifs negocies directement avec les operateurs' },
              { icon: Smartphone, title: 'Multi-operateurs', desc: 'Orange, MTN, Moov : tous les operateurs ivoiriens sur une seule plateforme' },
              { icon: CheckCircle, title: 'Historique complet', desc: 'Suivez toutes vos commandes et telechargez vos reçus de paiement' },
            ].map((f) => (
              <div key={f.title} className="bg-white/[0.02] border border-white/5 rounded-xl p-6 hover:bg-white/[0.05] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C5CFC]/20 to-[#A78BFF]/20 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[#7C5CFC]" />
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── Témoignages ── */}
      <AnimatedSection delay={500}>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ce que disent nos clients</h2>
            <p className="text-white/50 text-lg">Ils nous ont fait confiance</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Kouassi A.', text: 'Service rapide et fiable. J\'ai active mon forfait en moins de 2 minutes !', rating: 5 },
              { name: 'Diallo F.', text: 'Enfin une plateforme qui marche vraiment au pays. Je recommande.', rating: 5 },
              { name: 'Bamba M.', text: 'Le paiement Wave est super pratique. Plus besoin de chercher du credit.', rating: 4 },
            ].map((t) => (
              <div key={t.name} className="bg-white/[0.03] border border-white/5 rounded-xl p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                  ))}
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] flex items-center justify-center text-xs font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── CTA ── */}
      <AnimatedSection delay={600}>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1a3e] via-[#16162A] to-[#0D0D1A] rounded-3xl p-8 md:p-16 text-center border border-white/5">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#7C5CFC]/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#2ED3A0]/10 rounded-full blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à souscrire ?</h2>
              <p className="text-white/50 text-lg mb-8 max-w-lg mx-auto">
                Rejoignez plus de 15 000 clients satisfaits et activez votre forfait dès maintenant.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/catalogue"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-[#7C5CFC]/40 transition-all duration-500 hover:scale-105">
                  Decouvrir les offres
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/inscription"
                  className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/80 px-8 py-4 rounded-xl font-medium hover:bg-white/10 transition-all duration-300">
                  Creer un compte
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Unité Rapide</span>
          </div>
          <p className="text-white/30 text-sm">© {new Date().getFullYear()} Unité Rapide. Tous droits reserves.</p>
          <div className="flex items-center gap-4 text-white/30 text-sm">
            <span>Contact: support@unite-rapide.ci</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
