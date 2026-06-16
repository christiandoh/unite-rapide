import React from 'react';
import {
  LayoutDashboard, TrendingUp, Smartphone, Package, LogOut, Activity,
} from 'lucide-react';
import { NAV } from '../constants';

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  commandes: TrendingUp,
  telephones: Smartphone,
  execution: Smartphone,
  testussd: Smartphone,
  services: Package,
  profil: Smartphone,
  gammu: Smartphone,
};

function NavButton({ item, active, onClick }) {
  const Icon = NAV_ICONS[item.key] || Smartphone;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
        active ? 'bg-[#7C5CFC]/10 text-[#7C5CFC]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-[#7C5CFC]' : ''}`} />
      {item.label}
    </button>
  );
}

export default function Sidebar({ tab, setTab, sidebarOpen, setSidebarOpen, logout }) {
  const currentLabel = NAV.find(n => n.key === tab)?.label;

  return (
    <>
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:z-30 lg:w-64">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-100">
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
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {NAV.map(n => (
              <NavButton key={n.key} item={n} active={tab === n.key} onClick={() => setTab(n.key)} />
            ))}
          </nav>
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" /> Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900 p-1 -ml-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Unite Rapide</span>
          </div>
          <span className="text-xs text-gray-400 font-medium">{currentLabel}</span>
        </div>
      </div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-white h-full shadow-xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900">Unite Rapide</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="p-4 space-y-1 overflow-y-auto">
              {NAV.map(n => (
                <NavButton
                  key={n.key}
                  item={n}
                  active={tab === n.key}
                  onClick={() => { setTab(n.key); setSidebarOpen(false); }}
                />
              ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
