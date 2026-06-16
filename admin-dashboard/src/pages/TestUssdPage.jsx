import React from 'react';
import { Smartphone } from 'lucide-react';

export default function TestUssdPage({ data, testForm, setTestForm, testResult, executerTestUssd }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Test USSD</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">Envoyer n'importe quel code USSD a un telephone</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operateur (optionnel)</label>
            <select
              value={testForm.operateur_nom}
              onChange={e => setTestForm({ ...testForm, operateur_nom: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
            >
              <option value="">Tous les operateurs</option>
              {data.operateurs.map(op => (
                <option key={op.id} value={op.nom}>{op.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telephone destinataire</label>
            <input
              type="tel"
              value={testForm.telephone}
              onChange={e => setTestForm({ ...testForm, telephone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
              placeholder="0711118582"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
            <input
              type="number"
              value={testForm.montant}
              onChange={e => setTestForm({ ...testForm, montant: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
              placeholder="500"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code USSD</label>
            <textarea
              value={testForm.code_ussd}
              onChange={e => setTestForm({ ...testForm, code_ussd: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#7C5CFC] transition-colors"
              placeholder="#144*1*1*{numero}*{montant}*1*8582#"
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-1">Utilisez {'{numero}'} et {'{montant}'} pour les placeholders</p>
          </div>

          <button
            onClick={executerTestUssd}
            disabled={!testForm.code_ussd || !testForm.telephone}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-3 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300 disabled:opacity-50"
          >
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
  );
}
