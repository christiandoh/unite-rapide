import React from 'react';
import { Plus, Pencil, Trash2, Star, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ServicesPage({ data, setForm, setModal, toggleActif, deleteService }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Forfaits</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Gestion des services et forfaits</p>
        </div>
        <button
          onClick={() => {
            setForm({
              operateur_id: '', nom: '', type_service: 'forfait_internet', code_ussd: '',
              sequence_ussd: [], montant_wave: '', volume_data: '', duree_validite: '', populaire: false,
            });
            setModal('new');
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300"
        >
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
                    <button
                      onClick={() => toggleActif(s)}
                      className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        s.actif ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {s.actif ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {s.actif ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex gap-1 sm:gap-2">
                      <button
                        onClick={() => {
                          setForm({
                            id: s.id, operateur_id: s.operateurId, nom: s.nom, type_service: s.typeService,
                            code_ussd: s.codeUssd, sequence_ussd: s.sequenceUssd, montant_wave: s.montantWave,
                            volume_data: s.volumeData || '', duree_validite: s.dureeValidite || '',
                            actif: s.actif, populaire: s.populaire,
                          });
                          setModal('edit');
                        }}
                        className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:bg-[#7C5CFC]/5 hover:text-[#7C5CFC] transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => deleteService(s.id)}
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
