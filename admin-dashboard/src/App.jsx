import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useAdminApp } from './hooks/useAdminApp';
import Modal from './components/Modal';
import Sidebar from './components/Sidebar';
import ServiceModal from './components/ServiceModal';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CommandesPage from './pages/CommandesPage';
import TelephonesPage from './pages/TelephonesPage';
import ExecutionPage from './pages/ExecutionPage';
import TestUssdPage from './pages/TestUssdPage';
import ServicesPage from './pages/ServicesPage';
import ProfilPage from './pages/ProfilPage';
import GammuPage from './pages/GammuPage';

function ActivePage({ tab, app }) {
  switch (tab) {
    case 'dashboard':
      return <DashboardPage data={app.data} setTab={app.setTab} />;
    case 'commandes':
      return <CommandesPage data={app.data} revalidateCommande={app.revalidateCommande} setProofImage={app.setProofImage} />;
    case 'telephones':
      return <TelephonesPage data={app.data} setPhoneForm={app.setPhoneForm} setModal={app.setModal} deleteTelephone={app.deleteTelephone} />;
    case 'execution':
      return <ExecutionPage data={app.data} execForm={app.execForm} setExecForm={app.setExecForm} execResult={app.execResult} executerUssd={app.executerUssd} />;
    case 'testussd':
      return <TestUssdPage data={app.data} testForm={app.testForm} setTestForm={app.setTestForm} testResult={app.testResult} executerTestUssd={app.executerTestUssd} />;
    case 'services':
      return <ServicesPage data={app.data} setForm={app.setForm} setModal={app.setModal} toggleActif={app.toggleActif} deleteService={app.deleteService} />;
    case 'profil':
      return <ProfilPage adminUser={app.adminUser} setAdminUser={app.setAdminUser} uploadingPhoto={app.uploadingPhoto} setUploadingPhoto={app.setUploadingPhoto} />;
    case 'gammu':
      return <GammuPage gammuStatus={app.gammuStatus} gammuUssdCode={app.gammuUssdCode} setGammuUssdCode={app.setGammuUssdCode} gammuResult={app.gammuResult} refreshGammu={app.refreshGammu} execGammuUssd={app.execGammuUssd} />;
    default:
      return <DashboardPage data={app.data} setTab={app.setTab} />;
  }
}

export default function App() {
  const app = useAdminApp();

  if (!app.loggedIn) {
    return (
      <LoginPage
        telephone={app.telephone}
        setTelephone={app.setTelephone}
        codePin={app.codePin}
        setCodePin={app.setCodePin}
        loginError={app.loginError}
        setLoginError={app.setLoginError}
        loginLoading={app.loginLoading}
        handleLogin={app.handleLogin}
      />
    );
  }

  if (app.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#7C5CFC] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        tab={app.tab}
        setTab={app.setTab}
        sidebarOpen={app.sidebarOpen}
        setSidebarOpen={app.setSidebarOpen}
        logout={app.logout}
      />

      <main className="flex-1 lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <ActivePage tab={app.tab} app={app} />
        </div>
      </main>

      <ServiceModal
        modal={app.modal}
        setModal={app.setModal}
        form={app.form}
        setForm={app.setForm}
        phoneForm={app.phoneForm}
        setPhoneForm={app.setPhoneForm}
        data={app.data}
        saveService={app.saveService}
        createPhone={app.createPhone}
        updatePhone={app.updatePhone}
      />

      <Modal open={!!app.proofImage} onClose={() => app.setProofImage(null)} title="Preuve de paiement">
        {app.proofImage && (
          <div className="flex flex-col items-center">
            <img src={app.proofImage} alt="Preuve de paiement" className="max-w-full h-auto rounded-xl shadow-md" />
          </div>
        )}
      </Modal>

      <Toaster position="top-right" />
    </div>
  );
}
