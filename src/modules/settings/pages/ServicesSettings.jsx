import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../context/DataContext';
import { ClipboardList, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';

const ServicesSettings = () => {
  const navigate = useNavigate();
  const { services, removeService } = useData();
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDelete = () => {
    if (deleteConfirm) {
      removeService(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Servicios</h1>
          <p className="text-sm text-slate-500 mt-1">Catálogo de tratamientos para presupuestos y planes.</p>
        </div>
        <button
          onClick={() => navigate('/settings/new-service')}
          style={{ border: 'none', cursor: 'pointer' }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} /> Añadir Servicio
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <ClipboardList size={12} /> Catálogo ({services?.length || 0} servicios)
        </p>

        {(!services || services.length === 0) ? (
          <div className="text-center py-10 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <ClipboardList size={28} className="mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-sm">El catálogo está vacío</p>
            <button
              onClick={() => navigate('/settings/new-service')}
              style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
              className="mt-3 text-sm font-bold text-primary hover:underline"
            >
              + Añadir el primer servicio
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {services.map(ser => (
              <div key={ser.id} className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                  <ClipboardList size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800 truncate">{ser.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Por unidad</p>
                </div>
                <span className="font-black text-slate-800 text-base whitespace-nowrap">${ser.price}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => navigate(`/settings/edit-service/${ser.id}`)}
                    style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ id: ser.id, name: ser.name })}
                    style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">¿Eliminar servicio?</h3>
                <p className="text-sm text-slate-500 mt-1">Se eliminará <b className="text-slate-800">{deleteConfirm.name}</b> del catálogo permanentemente.</p>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteConfirm(null)} style={{ border: 'none', cursor: 'pointer' }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors">
                  Cancelar
                </button>
                <button onClick={handleDelete} style={{ border: 'none', cursor: 'pointer' }} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition-colors">
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesSettings;
