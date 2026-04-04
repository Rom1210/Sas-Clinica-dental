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
        
        <label className="cursor-pointer group">
          <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} accept="image/*" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            uploading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 active:scale-95'
          }`}>
            {uploading ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
            ) : (
              <>
                <Plus size={16} strokeWidth={3} />
                Subir Placa
              </>
            )}
          </div>
        </label>
      </div>

      {patientMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            <ImageIcon size={40} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold">No hay imágenes cargadas aún</p>
          <p className="text-slate-400 text-xs mt-1">Sube radiografías o fotos para este paciente</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {patientMedia.map((m) => (
            <motion.div 
              layoutId={m.id}
              key={m.id}
              className="group relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedImage(m)}
            >
              <img 
                src={m.url} 
                alt="Radiografía" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/20 backdrop-blur-md px-2 py-1 rounded-md">
                    {m.type === 'x-ray' ? 'Radiografía' : m.type}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(m.id, m.storage_path); }}
                    className="p-1.5 bg-white/20 hover:bg-rose-500 text-white rounded-lg transition-colors backdrop-blur-md"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-6 right-6 p-2 text-white/60 hover:text-white transition-colors">
              <X size={32} />
            </button>
            
            <motion.div 
              layoutId={selectedImage.id}
              className="relative max-w-5xl w-full max-h-[80vh] flex flex-col gap-4"
              onClick={e => e.stopPropagation()}
            >
              <img 
                src={selectedImage.url} 
                alt="Preview" 
                className="w-full h-full object-contain rounded-xl shadow-2xl"
              />
              <div className="flex justify-between items-start text-white">
                <div>
                  <h4 className="text-lg font-bold">Detalle de Imagen</h4>
                  <p className="text-white/60 text-sm">{new Date(selectedImage.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                <button 
                  onClick={() => handleDelete(selectedImage.id, selectedImage.storage_path)}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg"
                >
                  <Trash2 size={16} />
                  Eliminar Placa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryTab;
