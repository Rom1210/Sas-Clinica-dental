import React, { useState, useRef, useMemo } from 'react';
import { Plus, Camera, Trash2, X, Columns, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../../../../context/DataContext';

const GalleryTab = ({ patient }) => {
  const { media, uploadMedia, deleteMedia } = useData();
  const [uploading, setUploading] = useState(false); // kept for compatibility
  const [selectedImage, setSelectedImage] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareImages, setCompareImages] = useState({ before: null, after: null });
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [pendingMedia, setPendingMedia] = useState([]); // optimistic uploads
  const fileInputRef = useRef(null);

  const patientMedia = useMemo(() =>
    (media || [])
      .filter(m => m.patient_id === patient?.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [media, patient]
  );

  // Merge optimistic pending items with real data
  const allMedia = useMemo(() => {
    // Filter out pending items that have been confirmed (real record now exists)
    const pendingStillActive = pendingMedia.filter(
      p => !patientMedia.some(m => m.notes === p.notes && !m.isPending)
    );
    return [...pendingStillActive, ...patientMedia];
  }, [pendingMedia, patientMedia]);

  // Compress image before upload for faster performance
  const compressImage = (file, maxWidth = 1600, quality = 0.82) => {
    return new Promise((resolve) => {
      // If tiny already, skip compression
      if (file.size < 300 * 1024) { resolve(file); return; }
      
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) { resolve(file); return; }
            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
            console.log(`[Gallery] Compressed: ${(file.size/1024).toFixed(0)}KB → ${(compressed.size/1024).toFixed(0)}KB`);
            resolve(compressed);
          },
          'image/jpeg', quality
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log('[Gallery] File selected:', file.name, file.size);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) { alert('Selecciona una imagen primero.'); return; }
    if (!patient?.id) { alert('Error: No se pudo identificar el paciente.'); return; }

    const tempId = `temp-${Date.now()}`;
    const notes = [uploadTitle, uploadDescription].filter(Boolean).join(' | ');

    // 1. Show in gallery INSTANTLY with local preview URL
    const tempRecord = {
      id: tempId,
      patient_id: patient.id,
      url: previewUrl,
      notes,
      created_at: new Date().toISOString(),
      isPending: true,
    };
    setPendingMedia(prev => [tempRecord, ...prev]);

    // 2. Clear form immediately — feels instantaneous to user
    const fileToUpload = selectedFile;
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadTitle('');
    setUploadDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    // 3. Upload in background
    try {
      const compressed = await compressImage(fileToUpload);
      await uploadMedia(compressed, patient.id, 'photo', notes);
      // Remove temp record — real record was added to state by uploadMedia
      setPendingMedia(prev => prev.filter(m => m.id !== tempId));
    } catch (err) {
      console.error('[Gallery] Upload error:', err);
      // Remove temp record on failure
      setPendingMedia(prev => prev.filter(m => m.id !== tempId));
      alert(`❌ Error: ${err?.message || 'Error desconocido al subir la imagen.'}`);
    }
  };

  const handleDelete = async (e, img) => {
    e.stopPropagation();
    // First click: show confirmation label on button
    if (confirmDeleteId !== img.id) {
      setConfirmDeleteId(img.id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    // Second click: delete instantly (optimistic — UI updates before API call)
    setConfirmDeleteId(null);
    try {
      await deleteMedia(img.id, img.storage_path);
    } catch (err) {
      console.error('[Gallery] Delete error:', err);
      alert(`❌ Error al eliminar: ${err?.message || 'Error desconocido'}`);
    }
  };

  const toggleCompare = (img) => {
    if (!compareImages.before) {
      setCompareImages({ before: img, after: null });
    } else if (!compareImages.after && compareImages.before.id !== img.id) {
      setCompareImages(prev => ({ ...prev, after: img }));
    } else {
      setCompareImages({ before: img, after: null });
    }
  };

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const btnBlue = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '12px 28px', borderRadius: 999,
    background: '#2563EB', color: '#fff',
    fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em',
    border: 'none', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
    transition: 'all 0.2s', whiteSpace: 'nowrap',
  };
  const btnDisabled = {
    ...btnBlue,
    background: '#e2e8f0', color: '#94a3b8',
    boxShadow: 'none', cursor: 'not-allowed',
  };

  const isUploadReady = !!selectedFile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>

      {/* ── Header Card ──────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 32, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, background: '#EFF6FF', color: '#2563EB', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={28} />
            </div>
            <div>
              <h3 style={{ fontWeight: 900, fontSize: 20, color: '#0f172a', margin: 0 }}>Galería Clínica</h3>
              <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                {allMedia.length} Archivos Multimedia
              </p>
            </div>
          </div>
          <button
            onClick={() => { setCompareMode(!compareMode); setCompareImages({ before: null, after: null }); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 12,
              background: compareMode ? '#2563EB' : '#f8fafc',
              color: compareMode ? '#fff' : '#64748b',
              fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
              border: compareMode ? 'none' : '1px solid #e2e8f0', cursor: 'pointer',
            }}
          >
            <Columns size={14} />
            Comparar A/B
          </button>
        </div>

        {/* ── Upload Form ───────────────────────────────────────────────────── */}
        <div style={{ background: '#f8fafc', borderRadius: 24, padding: 24, border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nombre / Título</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                placeholder="Ej. Estado Inicial"
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#334155', fontWeight: 500, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Notas / Descripción</label>
              <input
                type="text"
                value={uploadDescription}
                onChange={e => setUploadDescription(e.target.value)}
                placeholder="Notas clínicas adicionales..."
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#334155', fontWeight: 500, outline: 'none' }}
              />
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,image/heic,image/heif"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Choose File Button - always blue */}
            <button type="button" onClick={handleChooseFile} style={btnBlue}>
              {selectedFile ? <CheckCircle2 size={16} /> : <ImageIcon size={16} />}
              {selectedFile ? 'Cambiar Foto' : 'Elegir Foto'}
            </button>

            {/* Upload Button - blue when ready, grey when not */}
            <button
              type="button"
              onClick={handleUpload}
              style={isUploadReady ? btnBlue : btnDisabled}
            >
              {selectedFile
                ? <Plus size={18} strokeWidth={3} />
                : <Plus size={18} strokeWidth={3} />
              }
              Subir Registro
            </button>

            {/* File name indicator */}
            {selectedFile && (
              <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>
                📎 {selectedFile.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Compare Tool ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {compareMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ background: '#0f172a', borderRadius: 32, padding: 32, position: 'relative' }}>
              <button
                onClick={() => { setCompareMode(false); setCompareImages({ before: null, after: null }); }}
                style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
              <h4 style={{ color: '#fff', fontWeight: 900, fontSize: 16, margin: '0 0 8px' }}>Herramienta de Evolución</h4>
              <p style={{ color: '#475569', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 24px' }}>Selecciona dos fotos de la galería para comparar</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {['before', 'after'].map(slot => (
                  <div key={slot} style={{ aspectRatio: '16/9', background: '#1e293b', borderRadius: 20, overflow: 'hidden', border: '2px dashed #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {compareImages[slot]
                      ? <img src={compareImages[slot].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={slot} />
                      : <div style={{ textAlign: 'center', color: '#475569' }}>
                          <Camera size={24} />
                          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8 }}>{slot === 'before' ? 'Foto Inicial' : 'Foto Final'}</p>
                        </div>
                    }
                    <span style={{ position: 'absolute', top: 12, left: 12, padding: '3px 10px', background: slot === 'before' ? 'rgba(0,0,0,0.5)' : '#2563EB', borderRadius: 8, color: '#fff', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {slot === 'before' ? 'A' : 'B'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Preview + Gallery ─────────────────────────────────────────────────── */}
      {previewUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40, background: '#EFF6FF', borderRadius: 40, border: '2px dashed #BFDBFE' }}
        >
          <div style={{ position: 'relative' }}>
            <img src={previewUrl} alt="Preview" style={{ maxWidth: 480, maxHeight: '50vh', objectFit: 'cover', borderRadius: 24, boxShadow: '0 20px 40px rgba(37,99,235,0.15)', border: '4px solid #fff' }} />
            <button
              onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
              style={{ position: 'absolute', top: -12, right: -12, width: 36, height: 36, borderRadius: '50%', background: '#ef4444', color: '#fff', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}
            >
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563EB', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <ImageIcon size={16} /> Lista para subir
          </div>
        </motion.div>
      )}

      {/* Gallery Grid */}
      {!previewUrl && (
        allMedia.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', background: '#f8fafc', borderRadius: 40, border: '2px dashed #e2e8f0' }}>
            <div style={{ width: 80, height: 80, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Camera size={40} color="#e2e8f0" />
            </div>
            <h4 style={{ fontWeight: 900, fontSize: 18, color: '#0f172a', margin: '0 0 8px' }}>Sin Registros Multimedia</h4>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 24px', textAlign: 'center', maxWidth: 280 }}>Documenta la evolución del tratamiento con fotos clínicas.</p>
            <button onClick={handleChooseFile} style={{ ...btnBlue, background: '#fff', color: '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
              Seleccionar Foto
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
            <AnimatePresence>
              {allMedia.map((img, idx) => (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => compareMode ? toggleCompare(img) : setSelectedImage(img)}
                  style={{
                    position: 'relative', aspectRatio: '1', borderRadius: 24,
                    overflow: 'hidden', cursor: 'pointer',
                    border: (compareImages.before?.id === img.id || compareImages.after?.id === img.id)
                      ? '4px solid #2563EB' : '4px solid #fff',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                  }}
                >
                  <img src={img.url} alt={img.notes || 'Registro clínico'} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: img.isPending ? 'brightness(0.6)' : 'none' }} />
                  
                  {/* Pending upload overlay */}
                  {img.isPending && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ color: '#fff', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Subiendo...</span>
                    </div>
                  )}
                  
                  {/* Bottom gradient with title + description - visible on hover */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
                    padding: '28px 12px 12px',
                    opacity: 0, transition: 'opacity 0.25s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                  >
                    <p style={{ color: '#fff', fontSize: 11, fontWeight: 800, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {img.notes?.split(' | ')[0] || 'Registro Clínico'}
                    </p>
                    {img.notes?.split(' | ')[1] && (
                      <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {img.notes.split(' | ')[1]}
                      </p>
                    )}
                  </div>

                  {/* Delete button - inline 2-step confirmation */}
                  {!compareMode && (
                    <button
                      onClick={(e) => handleDelete(e, img)}
                      title={confirmDeleteId === img.id ? 'Toca de nuevo para confirmar' : 'Eliminar imagen'}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        width: confirmDeleteId === img.id ? 'auto' : 34,
                        height: 34,
                        padding: confirmDeleteId === img.id ? '0 12px' : 0,
                        borderRadius: confirmDeleteId === img.id ? 10 : '50%',
                        background: confirmDeleteId === img.id ? '#b91c1c' : '#ef4444',
                        border: '2.5px solid #fff',
                        color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        boxShadow: '0 2px 8px rgba(239,68,68,0.6)',
                        transition: 'all 0.2s',
                        zIndex: 10,
                        fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}
                    >
                      <Trash2 size={15} strokeWidth={2.5} />
                      {confirmDeleteId === img.id && '¿Eliminar?'}
                    </button>
                  )}

                  {compareMode && (compareImages.before?.id === img.id || compareImages.after?.id === img.id) && (

                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#2563EB', color: '#fff', padding: '4px 12px', borderRadius: 8, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>
                      {compareImages.before?.id === img.id ? 'A: Inicial' : 'B: Final'}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )
      )}

      {/* ── Lightbox ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedImage && !compareMode && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}
          >
            <button onClick={() => setSelectedImage(null)} style={{ position: 'absolute', top: 32, right: 32, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={22} />
            </button>
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <motion.img layoutId={selectedImage.id} src={selectedImage.url} alt="Detalle" style={{ maxWidth: '85vw', maxHeight: '72vh', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 80px rgba(37,99,235,0.2)' }} />
              <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', padding: '18px 36px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', maxWidth: 480 }}>
                {/* Title */}
                <h5 style={{ color: '#fff', fontWeight: 900, margin: '0 0 6px', fontSize: 16, letterSpacing: '-0.01em' }}>
                  {selectedImage.notes?.split(' | ')[0] || 'Registro Clínico'}
                </h5>
                {/* Description — only shown if present */}
                {selectedImage.notes?.split(' | ')[1] && (
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 500, margin: '0 0 10px', lineHeight: 1.5 }}>
                    {selectedImage.notes.split(' | ')[1]}
                  </p>
                )}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                {/* Date */}
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>
                  {new Date(selectedImage.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default GalleryTab;
