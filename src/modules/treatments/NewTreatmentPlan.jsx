import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MoreVertical } from 'lucide-react';

const NewTreatmentPlan = ({ onCancel, onSave, initialData = null }) => {
  const [planName, setPlanName] = useState('');
  const [treatmentName, setTreatmentName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (initialData) {
      setPlanName(initialData.name || '');
      setItems(initialData.items || []);
    }
  }, [initialData]);

  const handleAddItem = () => {
    if (!treatmentName || !unitPrice) return;
    
    setItems([
      ...items,
      {
        id: Date.now(),
        name: treatmentName,
        quantity: parseInt(quantity) || 1,
        price: parseFloat(unitPrice) || 0
      }
    ]);
    
    // Reset form
    setTreatmentName('');
    setQuantity(1);
    setUnitPrice('');
  };

  const handleUpdateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        let updatedValue = value;
        if (field === 'quantity') updatedValue = parseInt(value) || 0;
        if (field === 'price') updatedValue = parseFloat(value) || 0;
        return { ...item, [field]: updatedValue };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const handleCreatePlan = () => {
    if (!planName || items.length === 0) return; // Basic validation
    const newId = initialData ? initialData.id : Date.now();
    onSave({
      id: newId,
      name: planName,
      items,
      total: totalAmount,
      date: initialData ? initialData.date : new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    });
  };

  const isEditing = !!initialData;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          {isEditing ? 'Editar plan de tratamiento' : 'Nuevo plan de tratamiento'}
        </h2>
        <button 
          type="button"
          onClick={onCancel}
          className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors border-none bg-transparent cursor-pointer"
        >
          Cancelar
        </button>
      </div>

      <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col gap-10">
        
        {/* Basic Info Section */}
        <div className="flex flex-col gap-6 relative">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Información del plan de tratamiento</h3>
          
          <div className="flex items-center justify-between">
            <div className="w-[60%]">
              <input 
                type="text" 
                placeholder="Nombre del plan de tratamiento" 
                className="w-full pb-2 border-b border-slate-300 text-sm focus:outline-none focus:border-primary transition-colors text-slate-700 bg-transparent placeholder:text-slate-400"
                style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontSize: '15px' }}
                value={planName}
                onChange={e => setPlanName(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col items-center gap-3 absolute right-4 top-2">
              <span className="text-sm text-slate-600 font-medium tracking-tight">Progreso del plan</span>
              <div className="w-16 h-16 rounded-full border-[3px] border-[#0070AC] flex items-center justify-center bg-white shadow-sm" style={{ borderColor: 'var(--primary, #0070AC)' }}>
                <span className="text-lg font-bold text-slate-500 tracking-wider">0 / {items.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Treatments Section */}
        <div className="flex flex-col gap-6 mt-4">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Agregar tratamientos</h3>
          
          <div className="flex flex-col gap-4">
            {/* Treatment List Items - Editable Rows */}
            {items.map((item) => (
              <div key={item.id} className="relative bg-white p-6 rounded-[20px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-end gap-6 group">
                <div className="flex-1 w-full">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block">Nombre</label>
                  <input 
                    type="text" 
                    className="w-full pb-2 border-b border-slate-300 text-sm focus:outline-none focus:border-primary transition-colors text-slate-700 bg-transparent font-medium"
                    style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontSize: '15px' }}
                    value={item.name}
                    onChange={e => handleUpdateItem(item.id, 'name', e.target.value)}
                  />
                </div>
                
                <div className="w-full md:w-24">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block">Cantidad</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full pb-2 border-b border-slate-300 text-sm focus:outline-none focus:border-primary transition-colors text-slate-700 bg-transparent font-medium"
                    style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontSize: '15px' }}
                    value={item.quantity}
                    onChange={e => handleUpdateItem(item.id, 'quantity', e.target.value)}
                  />
                </div>

                <div className="w-full md:w-32">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block">Precio Unitario</label>
                  <input 
                    type="number" 
                    className="w-full pb-2 border-b border-slate-300 text-sm focus:outline-none focus:border-primary transition-colors text-slate-700 bg-transparent font-medium"
                    style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontSize: '15px' }}
                    value={item.price}
                    onChange={e => handleUpdateItem(item.id, 'price', e.target.value)}
                  />
                </div>

                <div className="w-full md:w-20">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block">Total</label>
                  <div 
                    className="w-full pb-2 border-b border-slate-300 text-sm font-bold text-slate-700"
                    style={{ fontSize: '15px', height: '31px', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
                  >
                    {(item.quantity * item.price).toFixed(0)}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <button 
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-transparent border-none cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="text-slate-300">
                    <MoreVertical size={18} />
                  </div>
                </div>
              </div>
            ))}

            {/* Main Add Row */}
            <div className="bg-white p-6 rounded-[20px] border-2 border-dashed border-slate-200 flex flex-col md:flex-row items-end gap-6 shadow-sm mt-2">
              <div className="flex-1 w-full">
                <input 
                  type="text" 
                  placeholder="Nombre del tratamiento" 
                  className="w-full pb-2 border-b border-slate-300 text-sm focus:outline-none focus:border-primary transition-colors text-slate-700 bg-transparent font-medium placeholder:text-slate-400"
                  style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontSize: '15px' }}
                  value={treatmentName}
                  onChange={e => setTreatmentName(e.target.value)}
                />
              </div>
              
              <div className="w-full md:w-24">
                <label className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block">Cantidad</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full pb-2 border-b border-slate-300 text-sm focus:outline-none focus:border-primary transition-colors text-slate-700 bg-transparent font-medium"
                  style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontSize: '15px' }}
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                />
              </div>

              <div className="w-full md:w-32">
                <input 
                  type="number" 
                  placeholder="Precio Unitario" 
                  className="w-full pb-2 border-b border-slate-300 text-sm focus:outline-none focus:border-primary transition-colors text-slate-700 bg-transparent font-medium placeholder:text-slate-400"
                  style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', fontSize: '15px' }}
                  value={unitPrice}
                  onChange={e => setUnitPrice(e.target.value)}
                />
              </div>

              <button 
                type="button"
                onClick={handleAddItem}
                className="px-6 py-2.5 bg-[#0070AC] hover:bg-[#005c8f] text-white font-bold rounded-xl transition-all shadow-sm border-none cursor-pointer flex items-center justify-center gap-2 text-sm w-full md:w-auto h-[42px]"
                style={{ backgroundColor: 'var(--primary, #0070AC)' }}
              >
                <Plus size={18} strokeWidth={3} />
                Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Total and Submit */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-8">
          <div className="flex justify-end pr-4">
            <div className="w-48">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 block">Monto total</label>
              <div className="w-full pb-2 border-b border-slate-300 text-slate-800 text-xl font-bold h-9 flex items-end">
                {totalAmount > 0 ? `$${totalAmount.toFixed(2)}` : '0'}
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <button 
              type="button"
              onClick={handleCreatePlan}
              className="px-12 py-3 bg-primary text-white hover:opacity-90 font-bold rounded-full transition-all shadow-md border-none cursor-pointer text-[15px] tracking-wide flex items-center justify-center gap-2"
            >
              {!isEditing && <Plus size={18} strokeWidth={3} />}
              {isEditing ? 'Guardar cambios' : 'Crear plan de tratamiento'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NewTreatmentPlan;
