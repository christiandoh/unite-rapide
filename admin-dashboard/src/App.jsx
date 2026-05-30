import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, Smartphone, Package, LogOut, Plus, Pencil, Trash2,
  TrendingUp, CheckCircle, XCircle, Clock, DollarSign, Activity,
  Wifi, BatteryFull, ToggleLeft, ToggleRight, Star, Copy, Key,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || '/api' });

api.interceptors.request.use(c => {
  const t = localStorage.getItem('admin_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const COLORS = ['#7C5CFC', '#2ED3A0', '#FF3B5C', '#FFB84D', '#3B82F6'];
const TYPES_SERVICE = [
  { value: 'forfait_internet', label: 'Forfait Internet' },
  { value: 'credit_appel', label: 'Crédit Appel' },
  { value: 'forfait_mixte', label: 'Forfait Mixte' },
  { value: 'abonnement', label: 'Abonnement' },
];

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'commandes', label: 'Commandes', icon: TrendingUp },
  { key: 'telephones', label: 'Téléphones', icon: Smartphone },
  { key: 'services', label: 'Forfaits', icon: Package },
];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState({ dashboard: null, telephones: [], services: [], historique: null, operateurs: [] });
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ identifiant: 'christiandoh29@gmail.com', mot_de_passe: '' });
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('admin_token'));
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [phoneForm, setPhoneForm] = useState({ code: '', telephone: '' });

  useEffect(() => { if (loggedIn) loadData(); }, [loggedIn]);

  async function loadData() {
    setLoading(true);
    try {
      const [dash, phone, svc, hist, cmd] = await Promise.all([
        api.get('/admin/dashboard'), api.get('/admin/telephones'),
        api.get('/admin/services'), api.get('/admin/stats/historique').catch(() => null),
        api.get('/admin/commandes'),
      ]);
      const ops = [];
      const seen = new Set();
      svc.data.services.forEach(s => {
        if (!seen.has(s.operateur.nom)) { seen.add(s.operateur.nom); ops.push({ id: s.operateurId, nom: s.operateur.nom }); }
      });
      setData({ dashboard: dash.data, telephones: phone.data.telephones, services: svc.data.services, historique: hist?.data, operateurs: ops, commandes: cmd.data.commandes });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) { localStorage.removeItem('admin_token'); setLoggedIn(false); }
    } finally { setLoading(false); }
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const isEmail = loginForm.identifiant.includes('@');
      const payload = isEmail ? { email: loginForm.identifiant, mot_de_passe: loginForm.mot_de_passe } : { telephone: loginForm.identifiant, mot_de_passe: loginForm.mot_de_passe };
      const r = await api.post('/auth/login', payload);
      localStorage.setItem('admin_token', r.data.token);
      setLoggedIn(true);
    } catch (_) { alert('Erreur de connexion'); }
  }

  async function saveService() {
    try {
      const p = { ...form, montant_wave: parseFloat(form.montant_wave), sequence_ussd: form.sequence_ussd || [] };
      if (modal === 'new') await api.post('/admin/services', p);
      else await api.put(`/admin/services/${form.id}`, p);
      setModal(null);
      const r = await api.get('/admin/services');
      setData(prev => ({ ...prev, services: r.data.services }));
    } catch (err) { alert(err.response?.data?.error || 'Erreur'); }
  }

  async function deleteService(id) {
    if (!window.confirm('Supprimer ce service ?')) return;
    try { await api.delete(`/admin/services/${id}`); setData(prev => ({ ...prev, services: prev.services.filter(s => s.id !== id) })); }
    catch (err) { alert(err.response?.data?.error || 'Impossible'); }
  }

  async function toggleActif(svc) {
    try { await api.put(`/admin/services/${svc.id}`, { actif: !svc.actif }); setData(prev => ({ ...prev, services: prev.services.map(s => s.id === svc.id ? { ...s, actif: !svc.actif } : s) })); }
    catch (_) { alert('Erreur'); }
  }

  async function createPhone() {
    try {
      const { data } = await api.post('/admin/telephones', { code: phoneForm.code, telephone: phoneForm.telephone });
      setModal(null);
      setData(prev => ({ ...prev, telephones: [...prev.telephones, data.telephone] }));
      setPhoneForm({ code: '', telephone: '' });
      alert(`Telephone cree ! Token: ${data.telephone.tokenAuth}`);
    } catch (err) { alert(err.response?.data?.error || 'Erreur'); }
  }

  async function updatePhone() {
    try {
      const { data } = await api.put(`/admin/telephones/${phoneForm.id}`, { code: phoneForm.code, telephone: phoneForm.telephone });
      setData(prev => ({ ...prev, telephones: prev.telephones.map(p => p.id === phoneForm.id ? { ...p, nomAppareil: phoneForm.code, numeroTelephone: phoneForm.telephone } : p) }));
      setModal(null);
      setPhoneForm({ code: '', telephone: '' });
      alert('Telephone modifie');
    } catch (err) { alert(err.response?.data?.error || 'Erreur'); }
  }

  async function deleteTelephone(id) {
    if (!window.confirm('Supprimer ce telephone ?')) return;
    try { await api.delete(`/admin/telephones/${id}`); setData(prev => ({ ...prev, telephones: prev.telephones.filter(p => p.id !== id) })); }
    catch (err) { alert(err.response?.data?.error || 'Impossible'); }
  }

  if (!loggedIn) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#7C5CFC]/30">
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-white/50 mt-1">Unite Rapide Admin</p>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="Email ou téléphone" value={loginForm.identifiant}
            onChange={e => setLoginForm({ ...loginForm, identifiant: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#7C5CFC] transition-colors" required />
          <input type="password" placeholder="Mot de passe" value={loginForm.mot_de_passe}
            onChange={e => setLoginForm({ ...loginForm, mot_de_passe: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#7C5CFC] transition-colors" required />
          <button type="submit" className="w-full bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300">
            Se connecter
          </button>
        </div>
      </form>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#7C5CFC] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Chargement...</p>
      </div>
    </div>
  );

  const d = data.dashboard;
  const h = data.historique;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed h-full z-30">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-xl flex items-center justify-center shadow-lg shadow-[#7C5CFC]/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Unite Rapide</h1>
              <p className="text-xs text-gray-400">Plateforme</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(n => {
            const active = tab === n.key;
            return (
              <button key={n.key} onClick={() => setTab(n.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active ? 'bg-[#7C5CFC]/10 text-[#7C5CFC]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}>
                <n.icon className={`w-5 h-5 ${active ? 'text-[#7C5CFC]' : ''}`} />
                {n.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={() => { localStorage.removeItem('admin_token'); setLoggedIn(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </div>
      </aside>

      <div className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Unite Rapide</span>
          </div>
          <div className="flex gap-1">
            {NAV.map(n => (
              <button key={n.key} onClick={() => setTab(n.key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  tab === n.key ? 'bg-[#7C5CFC]/10 text-[#7C5CFC]' : 'text-gray-500'
                }`}>{n.label}</button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">Aperçu de votre plateforme USSD</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={TrendingUp} label="Commandes aujourd'hui" value={d?.stats_jour?.commandes || 0} color="bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF]" />
                <StatCard icon={CheckCircle} label="Taux de succès" value={`${d?.stats_jour?.taux_succes || 0}%`} color="bg-gradient-to-br from-[#2ED3A0] to-[#5EE0B8]" />
                <StatCard icon={Smartphone} label="Téléphones actifs" value={d?.telephones_actifs || 0} color="bg-gradient-to-br from-[#3B82F6] to-[#60A5FA]" />
                <StatCard icon={Clock} label="File d'attente" value={d?.file_attente || 0} color="bg-gradient-to-br from-[#FFB84D] to-[#FFD580]" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Évolution des commandes</h3>
                  {h?.quotidien ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={h.quotidien}>
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} stroke="#E5E7EB" />
                        <YAxis stroke="#E5E7EB" tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          labelFormatter={v => new Date(v).toLocaleDateString('fr-FR')} />
                        <Line type="monotone" dataKey="total" stroke="#7C5CFC" strokeWidth={2} dot={false} name="Total" />
                        <Line type="monotone" dataKey="reussi" stroke="#2ED3A0" strokeWidth={2} dot={false} name="Réussi" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">Données insuffisantes</div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Répartition</h3>
                  {h?.stats ? (
                    <div className="space-y-4">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={[
                            { name: 'Réussies', value: h.quotidien.reduce((s, d) => s + d.reussi, 0) },
                            { name: 'Échouées', value: h.quotidien.reduce((s, d) => s + d.echoue, 0) },
                            { name: 'Autres', value: h.quotidien.reduce((s, d) => s + d.total - d.reussi - d.echoue, 0) },
                          ]} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                            {[0, 1, 2].map(i => <Cell key={i} fill={[COLORS[0], COLORS[2], COLORS[3]][i]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 pt-2">
                        {[
                          { label: 'Réussies', color: COLORS[0], value: h.quotidien.reduce((s, d) => s + d.reussi, 0) },
                          { label: 'Échouées', color: COLORS[2], value: h.quotidien.reduce((s, d) => s + d.echoue, 0) },
                        ].map(item => (
                          <div key={item.label} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-gray-600">{item.label}</span>
                            </div>
                            <span className="font-semibold text-gray-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">Données insuffisantes</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Forfaits populaires</h3>
                  <button onClick={() => setTab('services')} className="text-sm text-[#7C5CFC] font-medium hover:underline">Voir tout</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.services.filter(s => s.actif).slice(0, 6).map(s => (
                    <div key={s.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#7C5CFC] uppercase bg-[#7C5CFC]/5 px-2 py-1 rounded-lg">{s.operateur.nom}</span>
                        {s.populaire && <Star className="w-4 h-4 text-[#FFB84D] fill-[#FFB84D]" />}
                      </div>
                      <p className="font-semibold text-gray-900">{s.nom}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{Number(s.montantWave).toLocaleString()} <span className="text-sm font-normal text-gray-400">F</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'commandes' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
                <p className="text-gray-500 text-sm mt-1">Historique des transactions</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-500">
                      <th className="px-6 py-4 font-medium">Reference</th>
                      <th className="px-6 py-4 font-medium">Client</th>
                      <th className="px-6 py-4 font-medium">Service</th>
                      <th className="px-6 py-4 font-medium">Montant</th>
                      <th className="px-6 py-4 font-medium">Statut</th>
                      <th className="px-6 py-4 font-medium">USSD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.commandes || []).length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Aucune commande</td></tr>
                    ) : data.commandes.map(c => {
                      const ussd = c.tachesUssd?.[0]?.statutExecution || '-';
                      const ussdBadge = ussd === 'reussi' || ussd === 'execute' ? 'bg-green-50 text-green-700'
                        : ussd === 'echoue' || ussd === 'timeout' ? 'bg-red-50 text-red-700'
                        : ussd === 'en_cours' ? 'bg-blue-50 text-blue-700'
                        : ussd === 'en_attente' ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-gray-100 text-gray-500';
                      const cmdBadge = c.statutCommande === 'execute' ? 'bg-green-50 text-green-700'
                        : c.statutCommande === 'echoue' ? 'bg-red-50 text-red-700'
                        : c.statutCommande === 'paiement_valide' ? 'bg-blue-50 text-blue-700'
                        : c.statutCommande === 'en_attente_paiement' ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-gray-100 text-gray-500';
                      return (
                        <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-gray-600">{c.referenceUnique}</td>
                          <td className="px-6 py-4 text-gray-900">{c.user?.telephone || '-'}</td>
                          <td className="px-6 py-4 text-gray-900">{c.service?.nom || '-'}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">{Number(c.montant).toLocaleString()} F</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${cmdBadge}`}>{c.statutCommande}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${ussdBadge}`}>{ussd}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'telephones' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Telephones executeurs</h1>
                  <p className="text-gray-500 text-sm mt-1">Appareils connectes pour l'execution USSD</p>
                </div>
                <button onClick={() => { setPhoneForm({ code: '', telephone: '' }); setModal('phone'); }}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300">
                  <Plus className="w-4 h-4" /> Ajouter un telephone
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-500">
                      <th className="px-6 py-4 font-medium">Code</th>
                      <th className="px-6 py-4 font-medium">Numero</th>
                      <th className="px-6 py-4 font-medium">Operateur</th>
                      <th className="px-6 py-4 font-medium">Token</th>
                      <th className="px-6 py-4 font-medium">Statut</th>
                      <th className="px-6 py-4 font-medium">Batterie</th>
                      <th className="px-6 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.telephones.length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Aucun telephone</td></tr>
                    ) : data.telephones.map(p => (
                      <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-gray-400" />
                            <span className="font-medium text-gray-900">{p.nomAppareil}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-gray-600">{p.numeroTelephone}</td>
                        <td className="px-6 py-4 text-gray-600">{p.operateur?.nom || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600 font-mono max-w-[120px] truncate block">{p.tokenAuth}</code>
                            <button onClick={() => { navigator.clipboard?.writeText(p.tokenAuth); }}
                              className="text-gray-400 hover:text-[#7C5CFC] transition-colors">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            p.statut === 'en_ligne' ? 'bg-green-50 text-green-700' : p.statut === 'occupe' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.statut === 'en_ligne' ? 'bg-green-500' : p.statut === 'occupe' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                            {p.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <BatteryFull className={`w-4 h-4 ${(p.niveauBatterie || 0) > 50 ? 'text-green-500' : (p.niveauBatterie || 0) > 20 ? 'text-yellow-500' : 'text-red-500'}`} />
                            <span className="text-gray-600">{p.niveauBatterie || '-'}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => {
                              setPhoneForm({ code: p.nomAppareil, telephone: p.numeroTelephone, id: p.id });
                              setModal('phone');
                            }}
                              className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteTelephone(p.id)}
                              className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'services' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Forfaits & Services</h1>
                  <p className="text-gray-500 text-sm mt-1">Gérez les forfaits disponibles à la souscription</p>
                </div>
                <button onClick={() => { setForm({ operateur_id: '', nom: '', type_service: 'forfait_internet', code_ussd: '', sequence_ussd: [], montant_wave: '', volume_data: '', duree_validite: '', populaire: false }); setModal('new'); }}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300">
                  <Plus className="w-4 h-4" /> Nouveau forfait
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-500">
                      <th className="px-6 py-4 font-medium">Opérateur</th>
                      <th className="px-6 py-4 font-medium">Nom</th>
                      <th className="px-6 py-4 font-medium">Code USSD</th>
                      <th className="px-6 py-4 font-medium">Prix</th>
                      <th className="px-6 py-4 font-medium">Populaire</th>
                      <th className="px-6 py-4 font-medium">Statut</th>
                      <th className="px-6 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.services.map(s => (
                      <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-[#7C5CFC] uppercase bg-[#7C5CFC]/5 px-2 py-1 rounded-lg">{s.operateur.nom}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{s.nom}</p>
                            <p className="text-xs text-gray-400">{s.typeService.replace(/_/g, ' ')}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-600">{s.codeUssd}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{Number(s.montantWave).toLocaleString()} F</td>
                        <td className="px-6 py-4">{s.populaire ? <Star className="w-4 h-4 text-[#FFB84D] fill-[#FFB84D]" /> : '—'}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => toggleActif(s)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              s.actif ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {s.actif ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                            {s.actif ? 'Actif' : 'Inactif'}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => { setForm({ id: s.id, operateur_id: s.operateurId, nom: s.nom, type_service: s.typeService, code_ussd: s.codeUssd, sequence_ussd: s.sequenceUssd, montant_wave: s.montantWave, volume_data: s.volumeData || '', duree_validite: s.dureeValidite || '', actif: s.actif, populaire: s.populaire }); setModal('edit'); }}
                              className="p-2 rounded-lg text-gray-400 hover:bg-[#7C5CFC]/5 hover:text-[#7C5CFC] transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteService(s.id)}
                              className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Modal open={modal !== null} onClose={() => setModal(null)}
        title={modal === 'phone' ? (phoneForm.id ? 'Modifier le telephone' : 'Nouveau telephone') : modal === 'new' ? 'Nouveau forfait' : 'Modifier le forfait'}>
        {modal === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code identifiant</label>
              <input type="text" value={phoneForm.code} onChange={e => setPhoneForm({ ...phoneForm, code: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
                placeholder="Ex: OMCI01" required />
              <p className="text-xs text-gray-400 mt-1">Ce code servira d'identifiant pour configurer le telephone</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero de telephone</label>
              <input type="tel" value={phoneForm.telephone} onChange={e => setPhoneForm({ ...phoneForm, telephone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
                placeholder="0700000000" required />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={phoneForm.id ? updatePhone : createPhone}
                className="flex-1 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300">
                {phoneForm.id ? 'Modifier' : 'Creer le telephone'}
              </button>
              <button onClick={() => setModal(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opérateur</label>
              <select value={form.operateur_id} onChange={e => setForm({ ...form, operateur_id: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors" required>
                <option value="">Sélectionner...</option>
                {data.operateurs.map(op => <option key={op.id} value={op.id}>{op.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input type="text" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type_service} onChange={e => setForm({ ...form, type_service: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors">
                  {TYPES_SERVICE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA)</label>
                <input type="number" value={form.montant_wave} onChange={e => setForm({ ...form, montant_wave: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code USSD</label>
                <input type="text" value={form.code_ussd} onChange={e => setForm({ ...form, code_ussd: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#7C5CFC] transition-colors" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volume Data</label>
                <input type="text" value={form.volume_data} onChange={e => setForm({ ...form, volume_data: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors" placeholder="Ex: 2Go" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée validité</label>
                <input type="text" value={form.duree_validite} onChange={e => setForm({ ...form, duree_validite: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors" placeholder="Ex: 7 jours" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Séquence USSD</label>
                <input type="text" value={(form.sequence_ussd || []).join(',')} onChange={e => setForm({ ...form, sequence_ussd: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors" placeholder="1,2,1" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.populaire || false} onChange={e => setForm({ ...form, populaire: e.target.checked })}
                className="rounded text-[#7C5CFC] focus:ring-[#7C5CFC]" />
              <span className="text-gray-700">Marquer comme populaire</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={saveService}
                className="flex-1 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300">
                {modal === 'new' ? 'Créer le forfait' : 'Enregistrer'}
              </button>
              <button onClick={() => setModal(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}