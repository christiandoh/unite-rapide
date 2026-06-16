import React from 'react';

export default function GammuPage({
  gammuStatus,
  gammuUssdCode,
  setGammuUssdCode,
  gammuResult,
  refreshGammu,
  execGammuUssd,
}) {
  return (
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
                <input
                  type="text"
                  value={gammuUssdCode}
                  onChange={e => setGammuUssdCode(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#7C5CFC]"
                  placeholder="#124#"
                />
              </div>
              <button
                onClick={execGammuUssd}
                disabled={!gammuUssdCode}
                className="w-full bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:shadow-lg transition-all"
              >
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
  );
}
