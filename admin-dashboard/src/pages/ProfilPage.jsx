import React from 'react';
import { toast } from 'react-hot-toast';
import api from '../api/client';

export default function ProfilPage({
  adminUser,
  setAdminUser,
  uploadingPhoto,
  setUploadingPhoto,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">Gerer votre photo et informations</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7C5CFC] to-[#A78BFF] flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
              {adminUser?.photoUrl ? (
                <img src={`/unite/api${adminUser.photoUrl.replace('/uploads', '/uploads')}`} alt="" className="w-full h-full object-cover" />
              ) : (
                (adminUser?.nom?.[0] || 'A')
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#7C5CFC] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#6B3CE1] transition-colors shadow-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('Image trop volumineuse (max 5 Mo)');
                    return;
                  }
                  setUploadingPhoto(true);
                  try {
                    const fd = new FormData();
                    fd.append('photo', file);
                    const r = await api.post('/users/photo', fd);
                    const updated = { ...adminUser, photoUrl: r.data.photoUrl };
                    setAdminUser(updated);
                    localStorage.setItem('admin_user', JSON.stringify(updated));
                    toast.success('Photo mise a jour');
                  } catch (err) {
                    toast.error(err.response?.data?.error || 'Erreur');
                  } finally {
                    setUploadingPhoto(false);
                  }
                }}
              />
            </label>
          </div>
          <div>
            <p className="font-bold text-gray-900">{adminUser?.nom || 'Admin'}</p>
            <p className="text-sm text-gray-500">{adminUser?.email || 'admin@unite-rapide.ci'}</p>
            <p className="text-xs text-gray-400 mt-1">Telephone: {adminUser?.telephone || '-'}</p>
          </div>
        </div>
        {uploadingPhoto && <p className="text-sm text-[#7C5CFC] animate-pulse mb-4">Chargement...</p>}
      </div>
    </div>
  );
}
