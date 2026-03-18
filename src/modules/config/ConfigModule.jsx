import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { DollarSign, Percent, Save, Trash2, Plus } from 'lucide-react';

const ConfigModule = () => {
  const { exchange_rate, updateExchangeRate } = useSettings();
  const [newRate, setNewRate] = useState(exchange_rate);
  const [doctors, setDoctors] = useState([
    { id: 1, name: 'Dr. Ricardo Pérez', specialty: 'Ortodoncia', active: true },
    { id: 2, name: 'Dra. Elena Gómez', specialty: 'Endodoncia', active: true }
  ]);
  const [services, setServices] = useState([
    { id: 1, name: 'Limpieza Dental', price: 40 },
    { id: 2, name: 'Resina Simple', price: 35 },
    { id: 3, name: 'Extracción', price: 50 }
  ]);

  const handleSaveRate = () => {
    updateExchangeRate(parseFloat(newRate));
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Configuración Maestra</h1>
          <p className="muted-foreground" style={{ fontSize: '0.875rem' }}>Gestión de tasas, doctores y catálogo de servicios.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Tasa de Cambio */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={20} />
            <h2 style={{ fontWeight: 600 }}>Tasa de Cambio (VES/USD)</h2>
          </div>
          <div className="flex gap-2">
            <input 
              type="number" 
              className="input" 
              value={newRate} 
              onChange={(e) => setNewRate(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleSaveRate}>
              <Save size={16} className="mr-2" /> Guardar
            </button>
          </div>
          <p className="muted-foreground mt-4" style={{ fontSize: '0.75rem' }}>
            Esta tasa afecta a todos los montos mostrados en Bolívares en el sistema.
          </p>
        </div>

        {/* Doctores Rápido */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Plus size={20} />
              <h2 style={{ fontWeight: 600 }}>Doctores</h2>
            </div>
            <button className="btn btn-secondary" style={{ height: '2rem', padding: '0 0.5rem' }}>
              + Añadir
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {doctors.map(doc => (
              <div key={doc.id} className="flex justify-between items-center p-2 border-radius" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{doc.name}</div>
                  <div className="muted-foreground" style={{ fontSize: '0.75rem' }}>{doc.specialty}</div>
                </div>
                <Trash2 size={14} className="muted-foreground" style={{ cursor: 'pointer' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Catálogo Base */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Plus size={20} />
              <h2 style={{ fontWeight: 600 }}>Servicios</h2>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {services.map(svc => (
              <div key={svc.id} className="flex justify-between items-center p-2 border-radius" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <span style={{ fontSize: '0.875rem' }}>{svc.name}</span>
                <span style={{ fontWeight: 600 }}>${svc.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigModule;
