import React, { useState } from 'react';
import { Image as ImageIcon, Upload, Trash2, X, Plus, FileText, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../../../../context/DataContext';

const GalleryTab = ({ patient }) => {
  const { media, uploadMedia, deleteMedia } = useData();
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  const patientMedia = media.filter(m => m.patient_id === patient.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadMedia(file, patient.id, 'x-ray', '');
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, path) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) return;
    try {
      await deleteMedia(id, path);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] min-h-[400px]">
      {/* Background/Blurred content */}
      <div className="opacity-40 blur-[2px] pointer-events-none select-none">
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Camera size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Galería de Imágenes</h3>
                <p className="text-[11px] text-slate-500 font-medium">Radiografías y fotos clínicas</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white">
              <Plus size={16} strokeWidth={3} /> Subir Placa
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4"><Camera size={40} className="text-slate-300" /></div>
            <p className="text-slate-500 font-bold">Sin imágenes</p>
          </div>
        </div>
      </div>

      {/* Próximamente Overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/70 backdrop-blur-md border border-white/50 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center text-center max-w-md"
        >
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-200 animate-pulse">
            <Camera size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Galería Inteligente</h3>
          <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8">
            Estamos integrando un sistema de almacenamiento avanzado para tus radiografías y archivos clínicos con inteligencia artificial.
          </p>
          <div className="px-6 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">
            Próximamente en v2.0
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GalleryTab;
