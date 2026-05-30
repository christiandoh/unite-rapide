import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import Commande from './pages/Commande';
import Paiement from './pages/Paiement';
import Suivi from './pages/Suivi';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import Profil from './pages/Profil';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter basename="/unite">
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#0D0D1A]">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalogue" element={<Catalogue />} />
              <Route path="/commande/:serviceId" element={<Commande />} />
              <Route path="/paiement/:commandeId" element={<Paiement />} />
              <Route path="/suivi/:commandeId" element={<Suivi />} />
              <Route path="/connexion" element={<Connexion />} />
              <Route path="/inscription" element={<Inscription />} />
              <Route path="/profil" element={<Profil />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
