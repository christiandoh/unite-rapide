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
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#16162A] to-[#0D0D1A] flex items-start justify-center px-3 sm:px-4 py-6 sm:py-8">
      <div className="w-full max-w-lg">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8">
          <h1 className="text-lg sm:text-xl font-bold text-white mb-5 sm:mb-6">Paiement Wave</h1>

          <div className="space-y-3 mb-6">
            {[
              'Cliquez sur le lien ci-dessous pour payer via Wave',
              'Prenez une capture d\'ecran du recu de paiement',
              'Deposez la capture ci-dessous pour validation',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#7C5CFC]/10 text-[#A78BFF] rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-xs sm:text-sm text-white/60">{step}</p>
              </div>
            ))}
          </div>

          {commande?.lienPaiementWave && (
            <a href={commande.lienPaiementWave} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#2ED3A0] to-[#5EE0B8] text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold hover:shadow-lg hover:shadow-[#2ED3A0]/30 transition-all duration-300 mb-6">
              Payer avec Wave <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </a>
          )}

          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
            <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${timeLeft < 120 ? 'text-red-400' : 'text-white/50'}`} />
            <p className={`text-xl sm:text-2xl font-mono font-bold ${timeLeft < 120 ? 'text-red-400' : 'text-white'}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
            <span className="text-xs sm:text-sm text-white/40">restant</span>
          </div>

          <div {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-5 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive ? 'border-[#7C5CFC] bg-[#7C5CFC]/10' : 'border-white/10 hover:border-[#7C5CFC] hover:bg-white/5'
            }`}>
            <input {...getInputProps()} />
            {preview ? (
              <img src={preview} alt="Apercu" className="max-w-full max-h-48 mx-auto rounded-xl" />
            ) : (
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
                </div>
                <p className="text-xs sm:text-sm text-white/60 mb-1">
                  {isDragActive ? 'Deposez l\'image ici' : 'Capture d\'ecran du paiement Wave'}
                </p>
                <p className="text-[10px] sm:text-xs text-white/40">Glissez-deposez ou cliquez pour selectionner</p>
                <p className="text-[10px] sm:text-xs text-white/40 mt-1">JPG, PNG ou HEIC - Max 10 Mo</p>
              </div>
            )}
          </div>

          {file && (
            <button onClick={handleUpload} disabled={uploading}
              className="flex items-center justify-center gap-2 w-full mt-5 bg-gradient-to-r from-[#7C5CFC] to-[#A78BFF] text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold hover:shadow-lg hover:shadow-[#7C5CFC]/30 transition-all duration-300 disabled:opacity-50">
              {uploading ? 'Envoi en cours...' : <><CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Valider le paiement</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
