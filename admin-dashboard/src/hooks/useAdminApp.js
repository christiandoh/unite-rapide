import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';

export function useAdminApp() {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState({ dashboard: null, telephones: [], services: [], historique: null, operateurs: [], commandes: [] });
  const [loading, setLoading] = useState(true);
  const [telephone, setTelephone] = useState('');
  const [codePin, setCodePin] = useState('');
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('admin_token'));
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [adminUser, setAdminUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_user') || 'null'); } catch { return null; }
  });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [phoneForm, setPhoneForm] = useState({ code: '', telephone: '' });
  const [execForm, setExecForm] = useState({ operateur_id: '', service_id: '', telephone: '', code_ussd: '', sequence: '', montant: '' });
  const [execResult, setExecResult] = useState(null);
  const [testForm, setTestForm] = useState({ operateur_nom: '', telephone: '', code_ussd: '', montant: '' });
  const [testResult, setTestResult] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [gammuStatus, setGammuStatus] = useState(null);
  const [gammuUssdCode, setGammuUssdCode] = useState('');
  const [gammuResult, setGammuResult] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadData = useCallback(async () => {
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
      if (err.response?.status === 401) { localStorage.removeItem('admin_token'); setLoggedIn(false); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (loggedIn) loadData(); }, [loggedIn, loadData]);

  const refreshGammu = useCallback(async () => {
    try {
      const { data: gData } = await api.get('/admin/gammu/status');
      setGammuStatus(gData);
    } catch { setGammuStatus({ modem: false }); }
  }, []);

  useEffect(() => { if (loggedIn && tab === 'gammu') refreshGammu(); }, [loggedIn, tab, refreshGammu]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    if (!telephone.match(/^(07|05|01)\d{8}$/)) {
      setLoginError('Numéro ivoirien invalide');
      return;
    }
    if (codePin.length !== 4) {
      setLoginError('Code à 4 chiffres requis');
      return;
    }
    setLoginLoading(true);
    try {
      const r = await api.post('/auth/login', { telephone, code_pin: codePin });
      if (r.data.user?.role !== 'admin') {
        setLoginError('Accès réservé aux administrateurs');
        return;
      }
      localStorage.setItem('admin_token', r.data.token);
      if (r.data.user) {
        localStorage.setItem('admin_user', JSON.stringify(r.data.user));
        setAdminUser(r.data.user);
      }
      setLoggedIn(true);
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Numéro ou code incorrect');
    } finally {
      setLoginLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setLoggedIn(false);
  }

  async function saveService() {
    try {
      const p = { ...form, montant_wave: parseFloat(form.montant_wave), sequence_ussd: form.sequence_ussd || [] };
      if (modal === 'new') await api.post('/admin/services', p);
      else await api.put(`/admin/services/${form.id}`, p);
      setModal(null);
      const r = await api.get('/admin/services');
      setData(prev => ({ ...prev, services: r.data.services }));
      toast.success('Forfait enregistré');
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  }

  async function deleteService(id) {
    if (!window.confirm('Supprimer ce service ?')) return;
    try {
      await api.delete(`/admin/services/${id}`);
      setData(prev => ({ ...prev, services: prev.services.filter(s => s.id !== id) }));
      toast.success('Service supprimé');
    } catch (err) { toast.error(err.response?.data?.error || 'Impossible'); }
  }

  async function toggleActif(svc) {
    try {
      await api.put(`/admin/services/${svc.id}`, { actif: !svc.actif });
      setData(prev => ({ ...prev, services: prev.services.map(s => s.id === svc.id ? { ...s, actif: !svc.actif } : s) }));
    } catch (_) { toast.error('Erreur'); }
  }

  async function createPhone() {
    try {
      const { data: res } = await api.post('/admin/telephones', { code: phoneForm.code, telephone: phoneForm.telephone });
      setModal(null);
      setData(prev => ({ ...prev, telephones: [...prev.telephones, res.telephone] }));
      setPhoneForm({ code: '', telephone: '' });
      toast.success('Téléphone créé');
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  }

  async function updatePhone() {
    try {
      await api.put(`/admin/telephones/${phoneForm.id}`, { code: phoneForm.code, telephone: phoneForm.telephone });
      setData(prev => ({ ...prev, telephones: prev.telephones.map(p => p.id === phoneForm.id ? { ...p, nomAppareil: phoneForm.code, numeroTelephone: phoneForm.telephone } : p) }));
      setModal(null);
      setPhoneForm({ code: '', telephone: '' });
      toast.success('Téléphone modifié');
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  }

  async function revalidateCommande(id, action) {
    try {
      await api.post(`/admin/commandes/${id}/revalider`, { action });
      toast.success(`Commande ${action === 'valider' ? 'validée' : 'rejetée'}`);
      const cmd = await api.get('/admin/commandes');
      setData(prev => ({ ...prev, commandes: cmd.data.commandes }));
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  }

  async function deleteTelephone(id) {
    if (!window.confirm('Supprimer ce téléphone ?')) return;
    try {
      await api.delete(`/admin/telephones/${id}`);
      setData(prev => ({ ...prev, telephones: prev.telephones.filter(p => p.id !== id) }));
    } catch (err) { toast.error(err.response?.data?.error || 'Impossible'); }
  }

  async function executerUssd() {
    try {
      const { data: res } = await api.post('/admin/ussd/executer', { service_id: execForm.service_id, telephone_beneficiaire: execForm.telephone });
      setExecResult({ success: true, message: 'Code USSD envoyé', commande: res.commande });
    } catch (err) {
      setExecResult({ success: false, message: err.response?.data?.error || 'Erreur' });
    }
  }

  async function executerTestUssd() {
    try {
      let code = testForm.code_ussd.replace(/\{numero\}/g, testForm.telephone);
      if (testForm.montant) code = code.replace(/\{montant\}/g, testForm.montant);
      const { data: res } = await api.post('/admin/ussd/test', { code_ussd: code, operateur_nom: testForm.operateur_nom || undefined, telephone: testForm.telephone });
      setTestResult({ success: true, message: 'Code USSD envoyé', ...res, code_envoye: code });
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.error || 'Erreur' });
    }
  }

  async function execGammuUssd() {
    try {
      const { data: res } = await api.post('/admin/gammu/ussd', { code: gammuUssdCode });
      setGammuResult(res);
    } catch (err) {
      setGammuResult({ success: false, error: err.response?.data?.error || 'Erreur' });
    }
  }

  return {
    tab, setTab, sidebarOpen, setSidebarOpen, data, loading, loggedIn, loginError, setLoginError, loginLoading,
    telephone, setTelephone, codePin, setCodePin, adminUser, setAdminUser, modal, setModal,
    form, setForm, phoneForm, setPhoneForm, execForm, setExecForm, execResult, testForm, setTestForm,
    testResult, proofImage, setProofImage, gammuStatus, gammuUssdCode, setGammuUssdCode, gammuResult,
    uploadingPhoto, setUploadingPhoto,
    handleLogin, logout, loadData, saveService, deleteService, toggleActif,
    createPhone, updatePhone, revalidateCommande, deleteTelephone,
    executerUssd, executerTestUssd, refreshGammu, execGammuUssd,
  };
}
