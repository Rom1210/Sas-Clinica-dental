import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useData } from '../../../context/DataContext';
import { RefreshCw, Zap, Plus, Trash2, X, DollarSign, CheckCircle2 } from 'lucide-react';

const FinanceSettings = () => {
  const { exchangeRate, updateExchangeRate } = useSettings();
  const { paymentMethods, addPaymentMethod, updatePaymentMethod, removePaymentMethod } = useData();

  const [tempRate, setTempRate] = useState(exchangeRate);
  const [rateSaved, setRateSaved] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(localStorage.getItem('rateLastUpdate') || null);
  const [rateSource, setRateSource] = useState(localStorage.getItem('rateSource') || null);
  const [fetchError, setFetchError] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [newMethod, setNewMethod] = useState({ name: '', type: 'other' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { setTempRate(exchangeRate); }, [exchangeRate]);

  const fetchLiveRate = useCallback(async () => {
    setFetchingRate(true);
    setFetchError(false);
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      const data = await res.json();
      const rate = parseFloat(data.promedio);
      if (!isNaN(rate) && rate > 0) {
        setTempRate(rate); updateExchangeRate(rate);
        const now = new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
        setLastUpdate(now); setRateSource('BCV Oficial');
        localStorage.setItem('rateLastUpdate', now);
        localStorage.setItem('rateSource', 'BCV Oficial');
        setRateSaved(true); setTimeout(() => setRateSaved(false), 2500);
        setFetchingRate(false); return;
      }
    } catch (_) {}
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      const rate = parseFloat(data.rates?.VES);
      if (!isNaN(rate) && rate > 0) {
        setTempRate(rate); updateExchangeRate(rate);
        const now = new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
        setLastUpdate(now); setRateSource('Open Exchange');
        localStorage.setItem('rateLastUpdate', now);
        localStorage.setItem('rateSource', 'Open Exchange');
        setRateSaved(true); setTimeout(() => setRateSaved(false), 2500);
        setFetchingRate(false); return;
      }
    } catch (_) {}
    setFetchError(true);
    setFetchingRate(false);
  }, [updateExchangeRate]);

  const handleSaveRate = () => {
    updateExchangeRate(parseFloat(tempRate));
    setRateSaved(true);
    setTimeout(() => setRateSaved(false), 2500);
  };

  const handleAddMethod = async () => {
    if (!newMethod.name.trim()) return;
    await addPaymentMethod({ name: newMethod.name.trim(), type: newMethod.type });
    setNewMethod({ name: '', type: 'other' });
    setShowMethodModal(false);
  };

  const handleDeleteMethod = () => {
    if (!deleteConfirm) return;
    removePaymentMethod(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const typeLabel = { cash: 'Efectivo', transfer: 'Transferencia', other: 'Otro' };

  return (
    <div className="p-8 flex flex-col gap-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finanzas</h1>
        <p className="text-sm text-slate-500 mt-1">Tasa de cambio y métodos de cobro activos.</p>
      </div>

      {/* Exchange Rate */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <RefreshCw size={12} /> Tasa de Cambio BCV
        </p>
        <div className="p-5 bg-slate-50 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-700 text-sm">VES por 1 USD</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {lastUpdate
                  ? <><span className="font-medium text-slate-500">{lastUpdate}</span> · <span className="text-emerald-600 font-medium">{rateSource}</span></>
                  : 'Afecta todos los presupuestos en tiempo real.'
                }
              </p>
            </div>
            <button
              onClick={fetchLiveRate}
              disabled={fetchingRate}
              style={{ border: 'none', cursor: 'pointer' }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap size={13} className={fetchingRate ? 'animate-pulse' : ''} />
              {fetchingRate ? 'Consultando...' : 'Live BCV'}
            </button>
          </div>

          {fetchError && (
            <p className="text-xs text-rose-500 font-medium bg-rose-50 px-3 py-2 rounded-lg">
              ⚠ No se pudo conectar a la API. Edita el valor manualmente.
            </p>
          )}

          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xl font-black text-slate-800 outline-none focus:border-primary transition-all"
              value={tempRate}
              onChange={(e) => setTempRate(e.target.value)}
            />
            <button
              onClick={handleSaveRate}
              style={{ border: 'none', cursor: 'pointer' }}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap
                ${rateSaved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-primary text-white hover:bg-blue-700'
                }`}
            >
              {rateSaved ? <span className="flex items-center gap-1.5"><CheckCircle2 size={15} /> Guardado</span> : 'Aplicar'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <DollarSign size={12} /> Vías de Cobro
          </p>
          <button
            onClick={() => setShowMethodModal(true)}
            style={{ border: 'none', cursor: 'pointer' }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={13} strokeWidth={2.5} /> Añadir
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {(!paymentMethods || paymentMethods.length === 0) && (
            <div className="text-center py-10 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <DollarSign size={28} className="mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-sm">No hay vías de cobro configuradas</p>
            </div>
          )}
          {paymentMethods?.slice().sort((a, b) => {
            const p = { Efectivo: 1, Zelle: 2, Transferencia: 3, 'Pago Móvil': 4 };
            return (p[a.name] || 99) - (p[b.name] || 99) || a.name.localeCompare(b.name);
          }).map(method => (
            <div key={method.id} className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-xl">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${method.is_active ? 'bg-blue-50 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                <DollarSign size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${method.is_active ? 'text-slate-800' : 'text-slate-400'}`}>{method.name}</p>
                <p className="text-xs text-slate-400">{typeLabel[method.type] || 'Otro'}</p>
              </div>
              <button
                onClick={() => updatePaymentMethod(method.id, { is_active: !method.is_active })}
                style={{ border: 'none', cursor: 'pointer' }}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${method.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
              >
                {method.is_active ? 'Activo' : 'Pausado'}
              </button>
              <button
                onClick={() => setDeleteConfirm({ id: method.id, name: method.name })}
                style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
                className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                title="Eliminar"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">¿Eliminar vía de cobro?</h3>
                <p className="text-sm text-slate-500 mt-1">Se eliminará <b className="text-slate-800">{deleteConfirm.name}</b> de forma permanente.</p>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteConfirm(null)} style={{ border: 'none', cursor: 'pointer' }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors">
                  Cancelar
                </button>
                <button onClick={handleDeleteMethod} style={{ border: 'none', cursor: 'pointer' }} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition-colors">
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showMethodModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setShowMethodModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-slate-900">Nueva vía de cobro</h3>
              <button onClick={() => setShowMethodModal(false)} style={{ border: 'none', cursor: 'pointer', background: 'transparent' }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Nombre</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Ej: Binance, Cashea, Zinli..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-primary transition-colors text-sm"
                  value={newMethod.name}
                  onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMethod()}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Categoría</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: 'cash', label: 'Efectivo' }, { id: 'transfer', label: 'Transferencia' }, { id: 'other', label: 'Otro' }].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setNewMethod({ ...newMethod, type: t.id })}
                      style={{ border: 'none', cursor: 'pointer' }}
                      className={`py-2.5 text-xs font-bold rounded-xl transition-colors ${newMethod.type === t.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddMethod}
                disabled={!newMethod.name.trim()}
                style={{ border: 'none', cursor: 'pointer' }}
                className="w-full py-3 bg-primary hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceSettings;
