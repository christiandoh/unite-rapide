import React from 'react';
import { Plus, Smartphone, Copy, Pencil, Trash2, BatteryFull } from 'lucide-react';

export default function TelephonesPage({ data, setPhoneForm, setModal, deleteTelephone }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Telephones executeurs</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Appareils connectes pour l'execution USSD</p>
        </div>
        <button
          onClick={() => { setPhoneForm({ code: '', telephone: '' }); setModal('phone'); }}
          className="flex items-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300"
        >
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
                      <button
                        onClick={() => { navigator.clipboard?.writeText(p.tokenAuth); }}
                        className="text-gray-400 hover:text-[#7C5CFC] transition-colors shrink-0"
                      >
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
                      <button
                        onClick={() => {
                          setPhoneForm({ code: p.nomAppareil, telephone: p.numeroTelephone, id: p.id });
                          setModal('phone');
                        }}
                        className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => deleteTelephone(p.id)}
                        className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
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
  );
}
