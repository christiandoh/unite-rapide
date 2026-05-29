import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowRight, Clock, Upload, ExternalLink, CheckCircle } from 'lucide-react';
import { commandes, paiement } from '../services/api';
import toast from 'react-hot-toast';

export default function Paiement() {
  const { commandeId } = useParams();
  const navigate = useNavigate();
  const [commande, setCommande] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);

  useEffect(() => { loadCommande(); }, [commandeId]);

  useEffect(() => {
    if (!commande?.dateExpiration) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(commande.dateExpiration) - new Date()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [commande?.dateExpiration]);

  async function loadCommande() {
    try {
      const { data } = await commandes.getById(commandeId);
      setCommande(data.commande);
    } catch (err) { console.error(err); }
  }

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.heic'] },
    maxSize: 10 * 1024 * 1024, maxFiles: 1,
  });

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('commande_id', commandeId);
      await paiement.uploadProof(formData);
      toast.success('Preuve envoyee ! Validation en cours...');
      navigate(`/suivi/${commandeId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally { setUploading(false); }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Paiement Wave</h1>

        <div className="space-y-3 mb-6">
          {[
            'Cliquez sur le lien ci-dessous pour payer via Wave',
            'Prenez une capture d\'ecran du recu de paiement',
            'Deposez la capture ci-dessous pour validation',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#7C5CFC]/10 text-[#7C5CFC] rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-gray-600">{step}</p>
            </div>
          ))}
        </div>

        {commande?.lienPaiementWave && (
          <a href={commande.lienPaiementWave} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#2ED3A0] to-[#5EE0B8] text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#2ED3A0]/30 transition-all duration-300 mb-6">
            Payer avec Wave <ExternalLink className="w-4 h-4" />
          </a>
        )}

        <div className="flex items-center justify-center gap-3 mb-6">
          <Clock className={`w-5 h-5 ${timeLeft < 120 ? 'text-red-500' : 'text-gray-400'}`} />
          <p className={`text-2xl font-mono font-bold ${timeLeft < 120 ? 'text-red-500' : 'text-gray-900'}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
          <span className="text-sm text-gray-400">restant</span>
        </div>

        <div {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive ? 'border-[#7C5CFC] bg-[#7C5CFC]/5' : 'border-gray-200 hover:border-[#7C5CFC] hover:bg-gray-50'
          }`}>
          <input {...getInputProps()} />
          {preview ? (
            <img src={preview} alt="Apercu" className="max-h-48 mx-auto rounded-xl" />
          ) : (
            <div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Upload className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-1">
                {isDragActive ? 'Deposez l\'image ici' : 'Capture d\'ecran du paiement Wave'}
              </p>
              <p className="text-xs text-gray-400">Glissez-deposez ou cliquez pour selectionner</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG ou HEIC - Max 10 Mo</p>
            </div>
          )}
        </div>

        {file && (
          <button onClick={handleUpload} disabled={uploading}
            className="flex items-center justify-center gap-2 w-full mt-5 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300 disabled:opacity-50">
            {uploading ? 'Envoi en cours...' : <><CheckCircle className="w-4 h-4" /> Valider le paiement</>}
          </button>
        )}
      </div>
    </div>
  );
}
