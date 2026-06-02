import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, Smartphone, Package, LogOut, Plus, Pencil, Trash2,
  TrendingUp, CheckCircle, XCircle, Clock, Activity, User, Radio, Play, FlaskConical,
  BatteryFull, ToggleLeft, ToggleRight, Star, Copy, Eye, EyeOff, Bell, RefreshCw,
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import StatCard from './components/StatCard';
import LoginPage from './components/LoginPage';

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
  { key: 'telephones', label: 'Telephones', icon: Smartphone },
  { key: 'execution', label: 'Execution', icon: Play },
  { key: 'testussd', label: 'Test USSD', icon: FlaskConical },
  { key: 'services', label: 'Forfaits', icon: Package },
  { key: 'profil', label: 'Profil', icon: User },
  { key: 'gammu', label: 'GSM Modem', icon: Radio },
];

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-[95%] sm:max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState({ dashboard: null, telephones: [], services: [], historique: null, operateurs: [] });
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ identifiant: '', mot_de_passe: '' });
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('admin_token'));
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [adminUser, setAdminUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_user') || 'null'); } catch { return null; }
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [gammuStatus, setGammuStatus] = useState(null);
  const [gammuUssdCode, setGammuUssdCode] = useState('');
  const [gammuResult, setGammuResult] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [phoneForm, setPhoneForm] = useState({ code: '', telephone: '' });
  const [execForm, setExecForm] = useState({ operateur_id: '', service_id: '', telephone: '', code_ussd: '', sequence: '', montant: '' });
  const [execResult, setExecResult] = useState(null);
  const [testForm, setTestForm] = useState({ operateur_nom: '', telephone: '', code_ussd: '', montant: '' });
  const [testResult, setTestResult] = useState(null);
  const [proofImage, setProofImage] = useState(null);

  useEffect(() => { if (loggedIn) loadData(); }, [loggedIn]);
  useEffect(() => { if (loggedIn && tab === 'gammu') refreshGammu(); }, [loggedIn, tab]);

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
    setLoginError('');
    setLoginLoading(true);
    try {
      const isEmail = loginForm.identifiant.includes('@');
      const payload = isEmail ? { email: loginForm.identifiant, mot_de_passe: loginForm.mot_de_passe } : { telephone: loginForm.identifiant, mot_de_passe: loginForm.mot_de_passe };
      const r = await api.post('/auth/login', payload);
      localStorage.setItem('admin_token', r.data.token);
      if (r.data.user) {
        localStorage.setItem('admin_user', JSON.stringify(r.data.user));
        setAdminUser(r.data.user);
      }
      setLoggedIn(true);
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Identifiant ou mot de passe incorrect');
    } finally {
      setLoginLoading(false);
    }
  }

  async function saveService() {
    try {
      const p = { ...form, montant_wave: parseFloat(form.montant_wave), sequence_ussd: form.sequence_ussd || [] };
      if (modal === 'new') await api.post('/admin/services', p);
      else await api.put(`/admin/services/${form.id}`, p);
      setModal(null);
      const r = await api.get('/admin/services');
      setData(prev => ({ ...prev, services: r.data.services }));
      toast.success('Forfait enregistre');
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  }

  async function deleteService(id) {
    if (!window.confirm('Supprimer ce service ?')) return;
    try { await api.delete(`/admin/services/${id}`); setData(prev => ({ ...prev, services: prev.services.filter(s => s.id !== id) })); toast.success('Service supprime'); }
    catch (err) { toast.error(err.response?.data?.error || 'Impossible'); }
  }

  async function toggleActif(svc) {
    try { await api.put(`/admin/services/${svc.id}`, { actif: !svc.actif }); setData(prev => ({ ...prev, services: prev.services.map(s => s.id === svc.id ? { ...s, actif: !svc.actif } : s) })); }
    catch (_) { toast.error('Erreur'); }
  }

  async function createPhone() {
    try {
      const { data } = await api.post('/admin/telephones', { code: phoneForm.code, telephone: phoneForm.telephone });
      setModal(null);
      setData(prev => ({ ...prev, telephones: [...prev.telephones, data.telephone] }));
      setPhoneForm({ code: '', telephone: '' });
      toast.success('Telephone cree avec succes');
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  }

  async function updatePhone() {
    try {
      await api.put(`/admin/telephones/${phoneForm.id}`, { code: phoneForm.code, telephone: phoneForm.telephone });
      setData(prev => ({ ...prev, telephones: prev.telephones.map(p => p.id === phoneForm.id ? { ...p, nomAppareil: phoneForm.code, numeroTelephone: phoneForm.telephone } : p) }));
      setModal(null);
      setPhoneForm({ code: '', telephone: '' });
      toast.success('Telephone modifie');
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  }

  async function revalidateCommande(id, action) {
    try {
      await api.post(`/admin/commandes/${id}/revalider`, { action });
      toast.success(`Commande ${action === 'valider' ? 'validee' : 'rejetee'}`);
      const cmd = await api.get('/admin/commandes');
      setData(prev => ({ ...prev, commandes: cmd.data.commandes }));
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  }

  async function deleteTelephone(id) {
    if (!window.confirm('Supprimer ce telephone ?')) return;
    try { await api.delete(`/admin/telephones/${id}`); setData(prev => ({ ...prev, telephones: prev.telephones.filter(p => p.id !== id) })); }
    catch (err) { toast.error(err.response?.data?.error || 'Impossible'); }
  }

  async function executerUssd() {
    try {
      const { data } = await api.post('/admin/ussd/executer', {
        service_id: execForm.service_id,
        telephone_beneficiaire: execForm.telephone,
      });
      setExecResult({ success: true, message: 'Code USSD envoye avec succes', commande: data.commande });
    } catch (err) {
      setExecResult({ success: false, message: err.response?.data?.error || 'Erreur lors de l\'execution' });
    }
  }

  async function executerTestUssd() {
    try {
      let code = testForm.code_ussd;
      code = code.replace(/\{numero\}/g, testForm.telephone);
      if (testForm.montant) code = code.replace(/\{montant\}/g, testForm.montant);
      const { data } = await api.post('/admin/ussd/test', {
        code_ussd: code,
        operateur_nom: testForm.operateur_nom || undefined,
        telephone: testForm.telephone,
      });
      setTestResult({ success: true, message: 'Code USSD envoye avec succes', ...data, code_envoye: code });
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.error || 'Erreur lors de l\'envoi' });
    }
  }

  async function refreshGammu() {
    try {
      const { data } = await api.get('/admin/gammu/status');
      setGammuStatus(data);
    } catch { setGammuStatus({ modem: false }); }
  }

  async function execGammuUssd() {
    try {
      const { data } = await api.post('/admin/gammu/ussd', { code: gammuUssdCode });
      setGammuResult(data);
    } catch (err) {
      setGammuResult({ success: false, error: err.response?.data?.error || 'Erreur' });
    }
  }

  if (!loggedIn) return (
    <LoginPage
      loginForm={loginForm}
      setLoginForm={setLoginForm}
      loginError={loginError}
      setLoginError={setLoginError}
      loginLoading={loginLoading}
      showLoginPw={showLoginPw}
      setShowLoginPw={setShowLoginPw}
      onSubmit={handleLogin}
    />
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Chargement du tableau de bord...</p>
      </div>
    </div>
  );

  const d = data.dashboard;
  const h = data.historique;

  return (
    <div className="min-h-screen bg-slate-100/80">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:z-30 lg:w-[17rem]">
        <div className="flex flex-col flex-1 bg-slate-950 text-white border-r border-white/5">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-brand-purple to-brand-purple-light rounded-2xl flex items-center justify-center shadow-lg shadow-brand-purple/30">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">Unite Rapide</h1>
                <p className="text-xs text-white/40">Administration</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {NAV.map(n => {
              const active = tab === n.key;
              return (
                <button key={n.key} onClick={() => setTab(n.key)}
                  className={active ? 'sidebar-link-active' : 'sidebar-link-inactive text-white/55 hover:text-white hover:bg-white/5'}>
                  <n.icon className={`w-5 h-5 shrink-0 ${active ? 'text-brand-purple' : ''}`} />
                  {n.label}
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t border-white/5">
            {adminUser && (
              <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-white/5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-purple to-brand-purple-light flex items-center justify-center text-sm font-bold shrink-0">
                  {adminUser.nom?.[0] || 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{adminUser.nom || 'Admin'}</p>
                  <p className="text-xs text-white/40 truncate">{adminUser.telephone || adminUser.email}</p>
                </div>
              </div>
            )}
            <button onClick={() => { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user'); setLoggedIn(false); }}
              className="sidebar-link-inactive text-white/55 hover:text-red-400 hover:bg-red-500/10 w-full">
              <LogOut className="w-5 h-5" /> Deconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSidebarOpen(true)} className="text-slate-600 hover:text-slate-900 p-1 -ml-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-purple-light rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Unite Rapide</span>
          </div>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{NAV.find(n => n.key === tab)?.label}</span>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-[17rem] bg-slate-950 h-full shadow-2xl text-white">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-purple-light rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">Unite Rapide</span>
              </div>
              <button type="button" onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="p-3 space-y-0.5 overflow-y-auto">
              {NAV.map(n => {
                const active = tab === n.key;
                return (
                  <button key={n.key} onClick={() => { setTab(n.key); setSidebarOpen(false); }}
                    className={active ? 'sidebar-link-active' : 'sidebar-link-inactive text-white/55 hover:text-white hover:bg-white/5'}>
                    <n.icon className={`w-5 h-5 ${active ? 'text-brand-purple' : ''}`} />
                    {n.label}
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-white/5">
              <button onClick={() => { localStorage.removeItem('admin_token'); setLoggedIn(false); }}
                className="sidebar-link-inactive text-white/55 hover:text-red-400 hover:bg-red-500/10 w-full">
                <LogOut className="w-5 h-5" /> Deconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-[17rem]">
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white/60 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{NAV.find(n => n.key === tab)?.label}</p>
            <p className="text-sm text-slate-600 mt-0.5">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadData}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button type="button" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <div className="relative overflow-hidden admin-card p-6 sm:p-8 bg-gradient-to-br from-brand-purple via-violet-600 to-indigo-700 border-0 text-white shadow-lg shadow-brand-purple/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-white/70 text-sm font-medium mb-1">Bonjour{adminUser?.nom ? `, ${adminUser.nom}` : ''}</p>
                    <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord</h1>
                    <p className="text-white/70 text-sm mt-2 max-w-lg">
                      Vue d&apos;ensemble de vos commandes, telephones executeurs et performances du jour.
                    </p>
                  </div>
                  <div className="flex gap-6 sm:gap-8">
                    <div className="text-center sm:text-right">
                      <p className="text-3xl font-bold">{d?.commandes_total || 0}</p>
                      <p className="text-xs text-white/60 uppercase tracking-wide">Commandes totales</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-3xl font-bold">{d?.stats_jour?.taux_succes || 0}%</p>
                      <p className="text-xs text-white/60 uppercase tracking-wide">Succes aujourd&apos;hui</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard icon={TrendingUp} label="Commandes aujourd'hui" value={d?.stats_jour?.commandes || 0} accent="purple" sub="Nouvelles transactions" />
                <StatCard icon={CheckCircle} label="Taux de succes" value={`${d?.stats_jour?.taux_succes || 0}%`} accent="mint" trend={{ positive: (d?.stats_jour?.taux_succes || 0) >= 80, label: 'Performance' }} />
                <StatCard icon={Smartphone} label="Telephones actifs" value={d?.telephones_actifs || 0} accent="blue" sub="Connectes en ligne" />
                <StatCard icon={Clock} label="File d'attente USSD" value={d?.file_attente || 0} accent="amber" sub="Taches en attente" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 admin-card p-6 overflow-x-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-slate-900">Evolution des commandes</h3>
                      <p className="text-slate-500 text-sm">30 derniers jours</p>
                    </div>
                  </div>
                  {h?.quotidien ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={h.quotidien}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorReussi" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2ED3A0" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#2ED3A0" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} stroke="#CBD5E1" />
                        <YAxis stroke="#CBD5E1" tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 8px 30px rgba(15,23,42,0.08)' }}
                          labelFormatter={v => new Date(v).toLocaleDateString('fr-FR')}
                        />
                        <Area type="monotone" dataKey="total" stroke="#7C5CFC" strokeWidth={2} fill="url(#colorTotal)" name="Total" />
                        <Area type="monotone" dataKey="reussi" stroke="#2ED3A0" strokeWidth={2} fill="url(#colorReussi)" name="Reussi" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">Donnees insuffisantes</div>
                  )}
                </div>

                <div className="admin-card p-6">
                  <h3 className="font-bold text-slate-900 mb-1">Repartition</h3>
                  <p className="text-slate-500 text-sm mb-6">Resultats sur la periode</p>
                  {h?.stats ? (
                    <div className="space-y-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={[
                            { name: 'Reussies', value: h.quotidien.reduce((s, d) => s + d.reussi, 0) },
                            { name: 'Echouees', value: h.quotidien.reduce((s, d) => s + d.echoue, 0) },
                            { name: 'Autres', value: h.quotidien.reduce((s, d) => s + d.total - d.reussi - d.echoue, 0) },
                          ]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                            {[0, 1, 2].map(i => <Cell key={i} fill={[COLORS[0], COLORS[2], COLORS[3]][i]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-3 pt-2">
                        {[
                          { label: 'Reussies', color: COLORS[0], value: h.quotidien.reduce((s, d) => s + d.reussi, 0) },
                          { label: 'Echouees', color: COLORS[2], value: h.quotidien.reduce((s, d) => s + d.echoue, 0) },
                        ].map(item => (
                          <div key={item.label} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-slate-600">{item.label}</span>
                            </div>
                            <span className="font-bold text-slate-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-slate-400 text-sm">Donnees insuffisantes</div>
                  )}
                </div>
              </div>

              <div className="admin-card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-slate-900">Forfaits populaires</h3>
                    <p className="text-slate-500 text-sm">Services les plus actifs</p>
                  </div>
                  <button type="button" onClick={() => setTab('services')} className="text-sm text-brand-purple font-semibold hover:underline">Voir tout</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.services.filter(s => s.actif).slice(0, 6).map(s => (
                    <div key={s.id} className="group border border-slate-100 rounded-xl p-4 hover:border-brand-purple/20 hover:shadow-card-hover transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-brand-purple uppercase bg-brand-purple/10 px-2.5 py-1 rounded-lg">{s.operateur.nom}</span>
                        {s.populaire && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                      </div>
                      <p className="font-semibold text-slate-900 group-hover:text-brand-purple transition-colors">{s.nom}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">{Number(s.montantWave).toLocaleString('fr-FR')} <span className="text-sm font-normal text-slate-400">F</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'commandes' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Commandes</h1>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">Historique des transactions</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-500">
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Reference</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Client</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Service</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Montant</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Statut</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Preuve</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.commandes || []).length === 0 ? (
                        <tr><td colSpan={7} className="px-4 sm:px-6 py-12 text-center text-gray-400">Aucune commande</td></tr>
                      ) : data.commandes.map(c => {
                        const preuve = c.preuvesPaiement?.[0];
                        const ussd = c.tachesUssd?.[0]?.statutExecution || '-';
                        const cmdBadge = c.statutCommande === 'execute' ? 'bg-green-50 text-green-700'
                          : c.statutCommande === 'echoue' ? 'bg-red-50 text-red-700'
                          : c.statutCommande === 'paiement_valide' ? 'bg-blue-50 text-blue-700'
                          : c.statutCommande === 'en_attente_paiement' ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-gray-100 text-gray-500';
                        const canReview = c.statutCommande === 'paiement_soumis' || c.statutCommande === 'a_reviser';
                        return (
                          <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 sm:px-6 py-4 font-mono text-xs text-gray-600 break-all sm:break-normal">{c.referenceUnique}</td>
                            <td className="px-4 sm:px-6 py-4 text-gray-900 text-xs sm:text-sm">{c.user?.telephone || '-'}</td>
                            <td className="px-4 sm:px-6 py-4 text-gray-900 text-xs sm:text-sm">{c.service?.nom || '-'}</td>
                            <td className="px-4 sm:px-6 py-4 font-semibold text-gray-900 text-xs sm:text-sm">{Number(c.montant).toLocaleString()} F</td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${cmdBadge}`}>{c.statutCommande}</span>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              {preuve ? (
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                    preuve.statutValidation === 'valide_auto' || preuve.statutValidation === 'valide_manuel' ? 'bg-green-50 text-green-700'
                                    : preuve.statutValidation === 'rejete' ? 'bg-red-50 text-red-700'
                                    : 'bg-yellow-50 text-yellow-700'
                                  }`}>{preuve.statutValidation || 'en_attente'}</span>
                                  <button onClick={() => setProofImage(preuve.imageOriginaleUrl)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#7C5CFC] transition-colors">
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : <span className="text-xs text-gray-400">-</span>}
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              {canReview ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => revalidateCommande(c.id, 'valider')}
                                    className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors" title="Valider">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => revalidateCommande(c.id, 'rejeter')}
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Rejeter">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">{ussd}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <Modal open={!!proofImage} onClose={() => setProofImage(null)} title="Preuve de paiement">
            {proofImage && (
              <div className="flex flex-col items-center">
                <img src={proofImage} alt="Preuve de paiement" className="max-w-full h-auto rounded-xl shadow-md" />
              </div>
            )}
          </Modal>

          {tab === 'execution' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Execution USSD</h1>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">Envoyer un code USSD a executer sur un telephone</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 max-w-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operateur</label>
                    <select value={execForm.operateur_id} onChange={e => setExecForm({ ...execForm, operateur_id: e.target.value, service_id: '' })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors">
                      <option value="">Choisir un operateur</option>
                      {data.operateurs.map(op => (
                        <option key={op.id} value={op.id}>{op.nom}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service / Forfait</label>
                    <select value={execForm.service_id} onChange={e => {
                      const svc = data.services.find(s => s.id === e.target.value);
                      setExecForm({
                        ...execForm,
                        service_id: e.target.value,
                        code_ussd: svc?.codeUssd || '',
                        sequence: svc?.sequenceUssd?.join(', ') || '',
                        montant: svc?.montantWave || '',
                      });
                    }}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors">
                      <option value="">Choisir un service</option>
                      {data.services.filter(s => !execForm.operateur_id || s.operateurId === execForm.operateur_id).map(s => (
                        <option key={s.id} value={s.id}>{s.operateur?.nom} — {s.nom} ({Number(s.montantWave).toLocaleString()} F)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code USSD</label>
                    <input type="text" value={execForm.code_ussd} readOnly
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sequence USSD</label>
                    <input type="text" value={execForm.sequence} readOnly
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900" />
                    <p className="text-xs text-gray-400 mt-1">Etapes de saisie separees par des virgules</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                    <input type="text" value={execForm.montant} readOnly
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telephone beneficiaire</label>
                    <input type="tel" value={execForm.telephone} onChange={e => setExecForm({ ...execForm, telephone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
                      placeholder="0700000000" required />
                  </div>

                  <button onClick={executerUssd}
                    disabled={!execForm.service_id || !execForm.telephone}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-3 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300 disabled:opacity-50">
                    <Smartphone className="w-4 h-4" />
                    Executer le code USSD
                  </button>
                </div>
              </div>

              {execResult && (
                <div className={`bg-white rounded-2xl border p-4 sm:p-6 break-words ${execResult.success ? 'border-green-100' : 'border-red-100'}`}>
                  <p className={`font-medium ${execResult.success ? 'text-green-700' : 'text-red-700'}`}>{execResult.message}</p>
                  {execResult.commande && (
                    <div className="mt-3 text-sm text-gray-600 space-y-1">
                      <p>Reference: <span className="font-mono">{execResult.commande.reference}</span></p>
                      <p>Service: {execResult.commande.service}</p>
                      <p>Telephone: {execResult.commande.telephone}</p>
                      <p>Code USSD: <span className="font-mono text-[#7C5CFC]">{execResult.commande.code_ussd}</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'testussd' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Test USSD</h1>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">Envoyer n'importe quel code USSD a un telephone</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 max-w-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operateur (optionnel)</label>
                    <select value={testForm.operateur_nom} onChange={e => setTestForm({ ...testForm, operateur_nom: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors">
                      <option value="">Tous les operateurs</option>
                      {data.operateurs.map(op => (
                        <option key={op.id} value={op.nom}>{op.nom}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telephone destinataire</label>
                    <input type="tel" value={testForm.telephone} onChange={e => setTestForm({ ...testForm, telephone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
                      placeholder="0711118582" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                    <input type="number" value={testForm.montant} onChange={e => setTestForm({ ...testForm, montant: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
                      placeholder="500" min={0} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code USSD</label>
                    <textarea value={testForm.code_ussd} onChange={e => setTestForm({ ...testForm, code_ussd: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#7C5CFC] transition-colors"
                      placeholder="#144*1*1*{numero}*{montant}*1*8582#" rows={3} />
                    <p className="text-xs text-gray-400 mt-1">Utilisez {'{numero}'} et {'{montant}'} pour les placeholders</p>
                  </div>

                  <button onClick={executerTestUssd}
                    disabled={!testForm.code_ussd || !testForm.telephone}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-3 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300 disabled:opacity-50">
                    <Smartphone className="w-4 h-4" />
                    Envoyer le code USSD
                  </button>
                </div>
              </div>

              {testResult && (
                <div className={`bg-white rounded-2xl border p-4 sm:p-6 break-words ${testResult.success ? 'border-green-100' : 'border-red-100'}`}>
                  <p className={`font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>{testResult.message}</p>
                  {testResult.telephone && (
                    <div className="mt-3 text-sm text-gray-600 space-y-1">
                      <p>Telephone: <span className="font-mono">{testResult.telephone}</span></p>
                      <p>Operateur: {testResult.operateur}</p>
                      <p>Code envoye: <span className="font-mono text-[#7C5CFC] break-all">{testResult.code_envoye || testResult.code_ussd}</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'telephones' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Telephones executeurs</h1>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">Appareils connectes pour l'execution USSD</p>
                </div>
                <button onClick={() => { setPhoneForm({ code: '', telephone: '' }); setModal('phone'); }}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300">
                  <Plus className="w-4 h-4" /> Ajouter un telephone
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-500">
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Code</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Numero</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Operateur</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Token</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Statut</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Batterie</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.telephones.length === 0 ? (
                        <tr><td colSpan={7} className="px-4 sm:px-6 py-12 text-center text-gray-400">Aucun telephone</td></tr>
                      ) : data.telephones.map(p => (
                        <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                              <span className="font-medium text-gray-900 text-xs sm:text-sm">{p.nomAppareil}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 font-mono text-xs sm:text-sm text-gray-600">{p.numeroTelephone}</td>
                          <td className="px-4 sm:px-6 py-4 text-gray-600 text-xs sm:text-sm">{p.operateur?.nom || '-'}</td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600 font-mono max-w-[80px] sm:max-w-[120px] truncate block">{p.tokenAuth}</code>
                              <button onClick={() => { navigator.clipboard?.writeText(p.tokenAuth); }}
                                className="text-gray-400 hover:text-[#7C5CFC] transition-colors shrink-0">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                              p.statut === 'en_ligne' ? 'bg-green-50 text-green-700' : p.statut === 'occupe' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${p.statut === 'en_ligne' ? 'bg-green-500' : p.statut === 'occupe' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                              {p.statut}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <BatteryFull className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${(p.niveauBatterie || 0) > 50 ? 'text-green-500' : (p.niveauBatterie || 0) > 20 ? 'text-yellow-500' : 'text-red-500'}`} />
                              <span className="text-gray-600 text-xs sm:text-sm">{p.niveauBatterie || '-'}%</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-1">
                              <button onClick={() => {
                                setPhoneForm({ code: p.nomAppareil, telephone: p.numeroTelephone, id: p.id });
                                setModal('phone');
                              }}
                                className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
                                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                              <button onClick={() => deleteTelephone(p.id)}
                                className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'profil' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mon profil</h1>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">Gerer votre photo et informations</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
                      {adminUser?.photoUrl ? (
                        <img src={`/unite/api${adminUser.photoUrl.replace('/uploads', '/uploads')}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (adminUser?.nom?.[0] || 'A')
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#7C5CFC] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#6B3CE1] transition-colors shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        if (file.size > 5*1024*1024) { toast.error('Image trop volumineuse (max 5 Mo)'); return; }
                        setUploadingPhoto(true);
                        try {
                          const fd = new FormData(); fd.append('photo', file);
                          const r = await api.post('/users/photo', fd);
                          const updated = { ...adminUser, photoUrl: r.data.photoUrl };
                          setAdminUser(updated);
                          localStorage.setItem('admin_user', JSON.stringify(updated));
                          toast.success('Photo mise a jour');
                        } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
                        finally { setUploadingPhoto(false); }
                      }} />
                    </label>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{adminUser?.nom || 'Admin'}</p>
                    <p className="text-sm text-gray-500">{adminUser?.email || 'admin@unite-rapide.ci'}</p>
                    <p className="text-xs text-gray-400 mt-1">Telephone: {adminUser?.telephone || '-'}</p>
                  </div>
                </div>
                {uploadingPhoto && <p className="text-sm text-[#7C5CFC] animate-pulse mb-4">Chargement...</p>}
              </div>
            </div>
          )}

          {tab === 'gammu' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">GSM Modem</h1>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">Envoyer des USSD et SMS via modem GSM</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 max-w-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50">
                    <div className={`w-3 h-3 rounded-full ${gammuStatus?.modem ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Modem GSM</p>
                      <p className="text-xs text-gray-500">{gammuStatus?.modem ? 'Connecte' : 'Non branche'}</p>
                      {gammuStatus?.info && <p className="text-xs text-gray-400 mt-1 font-mono">{gammuStatus.info}</p>}
                    </div>
                    <button onClick={refreshGammu} className="ml-auto text-xs text-[#7C5CFC] hover:underline">Rafraichir</button>
                  </div>

                  {gammuStatus?.modem && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code USSD</label>
                        <input type="text" value={gammuUssdCode} onChange={e => setGammuUssdCode(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#7C5CFC]"
                          placeholder="#124#" />
                      </div>
                      <button onClick={execGammuUssd} disabled={!gammuUssdCode}
                        className="w-full bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:shadow-lg transition-all">
                        Envoyer USSD
                      </button>
                      {gammuResult && (
                        <div className={`p-3 rounded-xl text-sm ${gammuResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          <pre className="whitespace-pre-wrap font-mono text-xs">{gammuResult.response || gammuResult.error}</pre>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'services' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Forfaits</h1>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">Gestion des services et forfaits</p>
                </div>
                <button onClick={() => { setForm({ operateur_id: '', nom: '', type_service: 'forfait_internet', code_ussd: '', sequence_ussd: [], montant_wave: '', volume_data: '', duree_validite: '', populaire: false }); setModal('new'); }}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300">
                  <Plus className="w-4 h-4" /> Nouveau forfait
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-500">
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Opérateur</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Nom</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Code USSD</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Prix</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Populaire</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Statut</th>
                        <th className="px-4 sm:px-6 py-4 font-medium text-xs sm:text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.services.map(s => (
                        <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 sm:px-6 py-4">
                            <span className="text-xs font-bold text-[#7C5CFC] uppercase bg-[#7C5CFC]/5 px-2 py-1 rounded-lg">{s.operateur.nom}</span>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900 text-xs sm:text-sm">{s.nom}</p>
                              <p className="text-xs text-gray-400">{s.typeService.replace(/_/g, ' ')}</p>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 font-mono text-xs text-gray-600">{s.codeUssd}</td>
                          <td className="px-4 sm:px-6 py-4 font-semibold text-gray-900 text-xs sm:text-sm">{Number(s.montantWave).toLocaleString()} F</td>
                          <td className="px-4 sm:px-6 py-4">{s.populaire ? <Star className="w-4 h-4 text-[#FFB84D] fill-[#FFB84D]" /> : '—'}</td>
                          <td className="px-4 sm:px-6 py-4">
                            <button onClick={() => toggleActif(s)}
                              className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                s.actif ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                              {s.actif ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                              {s.actif ? 'Actif' : 'Inactif'}
                            </button>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex gap-1 sm:gap-2">
                              <button onClick={() => { setForm({ id: s.id, operateur_id: s.operateurId, nom: s.nom, type_service: s.typeService, code_ussd: s.codeUssd, sequence_ussd: s.sequenceUssd, montant_wave: s.montantWave, volume_data: s.volumeData || '', duree_validite: s.dureeValidite || '', actif: s.actif, populaire: s.populaire }); setModal('edit'); }}
                                className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:bg-[#7C5CFC]/5 hover:text-[#7C5CFC] transition-colors">
                                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                              <button onClick={() => deleteService(s.id)}
                                className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
      <Toaster position="top-right" />
    </div>
  );
}