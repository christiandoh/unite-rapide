import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Smartphone, CreditCard, Zap, Shield, Users, CheckCircle, Star,
  Activity, ChevronDown, Sparkles, Clock, TrendingUp,
} from 'lucide-react';
import { services } from '../services/api';

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.unobserve(el); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function AnimatedSection({ children, className = '', delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CountUp({ end, suffix = '' }) {
  const [ref, inView] = useInView();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const dur = 1800;
    const step = Math.max(1, Math.ceil(end / (dur / 16)));
    const t = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(t); }
      else setCount(start);
    }, 16);
    return () => clearInterval(t);
  }, [inView, end]);
  return <span ref={ref}>{count.toLocaleString('fr-FR')}{suffix}</span>;
}

const operators = [
  { name: 'Orange CI', logo: '/logo_orange.jpg' },
  { name: 'MTN CI', logo: '/Mtn_ci_.jpg' },
  { name: 'Moov', logo: '/moov_ci_logo.jpg' },
];

const stats = [
  { value: 15000, label: 'Clients satisfaits', suffix: '+' },
  { value: 50, label: 'Forfaits disponibles', suffix: '+' },
  { value: 99, label: 'Taux de succes', suffix: '%' },
  { value: 5, label: "Delai moyen d'activation", suffix: ' min' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    services.featured().then(({ data }) => setFeatured(data.populaires || [])).catch(() => {});
    const t = setTimeout(() => setHeroLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-brand-dark text-white overflow-hidden -mt-16 pt-16">
      {/* Hero */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-[10%] w-[420px] h-[420px] bg-brand-purple/25 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-[5%] w-[380px] h-[380px] bg-brand-mint/15 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,92,252,0.08),transparent_50%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className={`transition-all duration-1000 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center gap-2 glass-panel rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4 text-brand-mint" />
                <span className="text-sm text-white/80">Orange · MTN · Moov — activation automatique</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] text-balance mb-6">
                Forfaits internet &amp; credit,{' '}
                <span className="gradient-text">actives en minutes</span>
              </h1>

              <p className="text-lg text-white/55 leading-relaxed mb-8 max-w-xl">
                Achetez vos forfaits en ligne, payez via Wave en toute securite, et recevez votre activation automatique sans vous deplacer.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10">
                <Link to="/catalogue" className="btn-primary text-base px-8 py-4 group">
                  Explorer le catalogue
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/inscription"
                  className="inline-flex items-center justify-center gap-2 glass-panel text-white/90 px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                  Creer un compte gratuit
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/45">
                {[
                  { icon: Shield, label: 'Paiement Wave securise' },
                  { icon: Zap, label: 'Validation IA instantanee' },
                  { icon: Clock, label: 'Suivi en temps reel' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-brand-mint shrink-0" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup */}
            <div className={`hidden lg:block transition-all duration-1000 delay-200 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="relative animate-float">
                <div className="absolute -inset-4 bg-gradient-to-br from-brand-purple/20 to-brand-mint/10 rounded-[2rem] blur-2xl" />
                <div className="relative glass-panel rounded-3xl p-6 shadow-glow border-white/15">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider">Commande en cours</p>
                      <p className="font-bold text-lg mt-0.5">Forfait 2 Go Orange</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-brand-mint/15 text-brand-mint text-xs font-semibold">Actif</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {[
                      { step: 'Paiement Wave', done: true },
                      { step: 'Verification IA', done: true },
                      { step: 'Execution USSD', done: true, current: true },
                      { step: 'Forfait active', done: false },
                    ].map((s, i) => (
                      <div key={s.step} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          s.done ? 'bg-brand-mint/20 text-brand-mint' : 'bg-white/5 text-white/30'
                        } ${s.current ? 'ring-2 ring-brand-purple/40' : ''}`}>
                          {s.done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-sm ${s.done ? 'text-white/90' : 'text-white/40'}`}>{s.step}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-white/40">Montant</p>
                      <p className="text-xl font-bold text-brand-mint">2 000 FCFA</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/40">Temps estime</p>
                      <p className="text-sm font-semibold">&lt; 5 min</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 glass-panel rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-brand-purple-light" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Aujourd&apos;hui</p>
                    <p className="font-bold text-sm">+127 activations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:block animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/25" />
        </div>
      </section>

      {/* Operateurs */}
      <AnimatedSection className="py-14 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="section-label text-center mb-8">Operateurs partenaires</p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {operators.map((op) => (
              <div key={op.name}
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl glass-panel hover:bg-white/[0.08] hover:border-white/15 transition-all duration-300">
                <img src={op.logo} alt={op.name} className="w-10 h-10 rounded-xl object-contain bg-white/90 p-1" />
                <span className="font-semibold text-sm text-white/85">{op.name}</span>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Stats */}
      <AnimatedSection delay={80}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center p-6 rounded-2xl glass-panel hover:border-brand-purple/20 transition-colors">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold gradient-text">
                  <CountUp end={s.value} suffix={s.suffix} />
                </p>
                <p className="text-white/45 text-sm mt-3 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Comment ca marche */}
      <AnimatedSection delay={120}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <p className="section-label mb-3">Simple et rapide</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Comment ca marche ?</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">Trois etapes pour activer votre forfait, sans file d&apos;attente</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: Smartphone, title: 'Choisissez', desc: 'Parcourez le catalogue multi-operateurs et selectionnez votre forfait', color: 'from-brand-purple to-brand-purple-light', step: '01' },
              { icon: CreditCard, title: 'Payez', desc: 'Reglez via Wave Business et uploadez votre capture de paiement', color: 'from-brand-mint to-brand-mint-light', step: '02' },
              { icon: Zap, title: 'Activez', desc: 'Notre IA valide le paiement et le code USSD s\'execute automatiquement', color: 'from-blue-500 to-sky-400', step: '03' },
            ].map((item) => (
              <div key={item.title}
                className="group relative glass-panel rounded-2xl p-8 hover:bg-white/[0.06] hover:border-brand-purple/25 transition-all duration-500 hover:-translate-y-1">
                <span className="absolute top-5 right-5 text-4xl font-black text-white/[0.04] group-hover:text-white/[0.08] transition-colors">{item.step}</span>
                <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Forfaits populaires */}
      {featured.length > 0 && (
        <AnimatedSection delay={160}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="section-label mb-2">Selection du moment</p>
                <h2 className="text-3xl sm:text-4xl font-bold">Forfaits populaires</h2>
              </div>
              <Link to="/catalogue" className="inline-flex items-center gap-2 text-brand-purple-light hover:text-white font-semibold transition-colors">
                Voir tout le catalogue <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.slice(0, 6).map((s) => (
                <Link key={s.id} to={`/commande/${s.id}`}
                  className="group glass-panel rounded-2xl p-6 hover:border-brand-purple/30 hover:shadow-glow transition-all duration-500 hover:-translate-y-0.5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wide text-brand-purple-light bg-brand-purple/10 px-2.5 py-1 rounded-lg">
                      {s.operateur?.nom}
                    </span>
                    {s.populaire && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-brand-purple-light transition-colors">{s.nom}</h3>
                  {s.volumeData && <p className="text-sm text-white/45 mb-4">{s.volumeData}{s.dureeValidite ? ` · ${s.dureeValidite}` : ''}</p>}
                  <div className="flex items-end justify-between pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-white/35">A partir de</p>
                      <p className="text-2xl font-bold text-brand-mint">{Number(s.montantWave).toLocaleString('fr-FR')} <span className="text-sm font-normal text-white/50">F</span></p>
                    </div>
                    <span className="text-sm font-medium text-brand-purple-light opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Commander <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Pourquoi nous */}
      <AnimatedSection delay={200}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <p className="section-label mb-3">Nos avantages</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Pourquoi Unite Rapide ?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Shield, title: 'Paiement securise', desc: 'Wave Business + validation IA anti-fraude sur chaque preuve' },
              { icon: Zap, title: 'Activation rapide', desc: 'Codes USSD executes automatiquement sur nos telephones dedies' },
              { icon: Users, title: 'Support reactif', desc: 'Equipe disponible 7j/7 par telephone et WhatsApp' },
              { icon: Star, title: 'Meilleurs tarifs', desc: 'Forfaits negocies directement avec les operateurs ivoiriens' },
              { icon: Smartphone, title: 'Multi-operateurs', desc: 'Orange, MTN et Moov reunis sur une seule plateforme' },
              { icon: CheckCircle, title: 'Historique complet', desc: 'Suivez vos commandes et telechargez vos recus' },
            ].map((f) => (
              <div key={f.title} className="glass-panel rounded-xl p-6 hover:bg-white/[0.05] transition-colors">
                <div className="w-11 h-11 rounded-xl bg-brand-purple/15 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-brand-purple-light" />
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Temoignages */}
      <AnimatedSection delay={240}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <p className="section-label mb-3">Confiance</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Ce que disent nos clients</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Kouassi A.', loc: 'Abidjan', text: 'Service rapide et fiable. Mon forfait etait actif en moins de 2 minutes !', rating: 5 },
              { name: 'Diallo F.', loc: 'Bouake', text: 'Enfin une plateforme qui fonctionne vraiment. Je recommande a tous mes proches.', rating: 5 },
              { name: 'Bamba M.', loc: 'Yamoussoukro', text: 'Le paiement Wave est super pratique. Plus besoin de courir chercher du credit.', rating: 5 },
            ].map((t) => (
              <div key={t.name} className="glass-panel rounded-2xl p-6 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/65 text-sm leading-relaxed mb-6 flex-1 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-light flex items-center justify-center text-sm font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-white/40">{t.loc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection delay={280}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="relative overflow-hidden rounded-3xl p-10 sm:p-16 text-center border border-white/10 bg-gradient-to-br from-brand-purple/20 via-brand-surface to-brand-dark">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/30 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-mint/15 rounded-full blur-[60px]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">Pret a activer votre forfait ?</h2>
              <p className="text-white/55 text-lg mb-8 max-w-lg mx-auto">
                Rejoignez des milliers de clients satisfaits en Cote d&apos;Ivoire.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/catalogue" className="btn-primary text-base px-8 py-4">
                  Voir les offres <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/inscription"
                  className="inline-flex items-center gap-2 text-white/70 hover:text-white font-medium transition-colors">
                  Pas encore inscrit ? Creer un compte
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
