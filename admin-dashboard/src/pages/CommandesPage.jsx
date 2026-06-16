import React from 'react';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

export default function CommandesPage({ data, revalidateCommande, setProofImage }) {
  return (
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
                          <button
                            onClick={() => setProofImage(preuve.imageOriginaleUrl)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#7C5CFC] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : <span className="text-xs text-gray-400">-</span>}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {canReview ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => revalidateCommande(c.id, 'valider')}
                            className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors"
                            title="Valider"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => revalidateCommande(c.id, 'rejeter')}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Rejeter"
                          >
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
  );
}
