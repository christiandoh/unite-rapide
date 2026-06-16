import React from 'react';
import Modal from './Modal';
import { TYPES_SERVICE } from '../constants';

export default function ServiceModal({
  modal,
  setModal,
  form,
  setForm,
  phoneForm,
  setPhoneForm,
  data,
  saveService,
  createPhone,
  updatePhone,
}) {
  const title = modal === 'phone'
    ? (phoneForm.id ? 'Modifier le telephone' : 'Nouveau telephone')
    : modal === 'new'
      ? 'Nouveau forfait'
      : 'Modifier le forfait';

  return (
    <Modal open={modal !== null} onClose={() => setModal(null)} title={title}>
      {modal === 'phone' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code identifiant</label>
            <input
              type="text"
              value={phoneForm.code}
              onChange={e => setPhoneForm({ ...phoneForm, code: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
              placeholder="Ex: OMCI01"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Ce code servira d'identifiant pour configurer le telephone</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numero de telephone</label>
            <input
              type="tel"
              value={phoneForm.telephone}
              onChange={e => setPhoneForm({ ...phoneForm, telephone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
              placeholder="0700000000"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={phoneForm.id ? updatePhone : createPhone}
              className="flex-1 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300"
            >
              {phoneForm.id ? 'Modifier' : 'Creer le telephone'}
            </button>
            <button
              onClick={() => setModal(null)}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opérateur</label>
            <select
              value={form.operateur_id}
              onChange={e => setForm({ ...form, operateur_id: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
              required
            >
              <option value="">Sélectionner...</option>
              {data.operateurs.map(op => <option key={op.id} value={op.id}>{op.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type_service}
                onChange={e => setForm({ ...form, type_service: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
              >
                {TYPES_SERVICE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA)</label>
              <input
                type="number"
                value={form.montant_wave}
                onChange={e => setForm({ ...form, montant_wave: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code USSD</label>
              <input
                type="text"
                value={form.code_ussd}
                onChange={e => setForm({ ...form, code_ussd: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#7C5CFC] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volume Data</label>
              <input
                type="text"
                value={form.volume_data}
                onChange={e => setForm({ ...form, volume_data: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
                placeholder="Ex: 2Go"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée validité</label>
              <input
                type="text"
                value={form.duree_validite}
                onChange={e => setForm({ ...form, duree_validite: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
                placeholder="Ex: 7 jours"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Séquence USSD</label>
              <input
                type="text"
                value={(form.sequence_ussd || []).join(',')}
                onChange={e => setForm({ ...form, sequence_ussd: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
                placeholder="1,2,1"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.populaire || false}
              onChange={e => setForm({ ...form, populaire: e.target.checked })}
              className="rounded text-[#7C5CFC] focus:ring-[#7C5CFC]"
            />
            <span className="text-gray-700">Marquer comme populaire</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              onClick={saveService}
              className="flex-1 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300"
            >
              {modal === 'new' ? 'Créer le forfait' : 'Enregistrer'}
            </button>
            <button
              onClick={() => setModal(null)}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
