import React from 'react';
import { Smartphone } from 'lucide-react';

export default function ExecutionPage({ data, execForm, setExecForm, execResult, executerUssd }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Execution USSD</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">Envoyer un code USSD a executer sur un telephone</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operateur</label>
            <select
              value={execForm.operateur_id}
              onChange={e => setExecForm({ ...execForm, operateur_id: e.target.value, service_id: '' })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
            >
              <option value="">Choisir un operateur</option>
              {data.operateurs.map(op => (
                <option key={op.id} value={op.id}>{op.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service / Forfait</label>
            <select
              value={execForm.service_id}
              onChange={e => {
                const svc = data.services.find(s => s.id === e.target.value);
                setExecForm({
                  ...execForm,
                  service_id: e.target.value,
                  code_ussd: svc?.codeUssd || '',
                  sequence: svc?.sequenceUssd?.join(', ') || '',
                  montant: svc?.montantWave || '',
                });
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
            >
              <option value="">Choisir un service</option>
              {data.services.filter(s => !execForm.operateur_id || s.operateurId === execForm.operateur_id).map(s => (
                <option key={s.id} value={s.id}>{s.operateur?.nom} — {s.nom} ({Number(s.montantWave).toLocaleString()} F)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code USSD</label>
            <input
              type="text"
              value={execForm.code_ussd}
              readOnly
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sequence USSD</label>
            <input
              type="text"
              value={execForm.sequence}
              readOnly
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900"
            />
            <p className="text-xs text-gray-400 mt-1">Etapes de saisie separees par des virgules</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
            <input
              type="text"
              value={execForm.montant}
              readOnly
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telephone beneficiaire</label>
            <input
              type="tel"
              value={execForm.telephone}
              onChange={e => setExecForm({ ...execForm, telephone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
              placeholder="0700000000"
              required
            />
          </div>

          <button
            onClick={executerUssd}
            disabled={!execForm.service_id || !execForm.telephone}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-3 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300 disabled:opacity-50"
          >
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
  );
}
