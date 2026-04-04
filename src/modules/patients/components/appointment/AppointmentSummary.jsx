import React from 'react';
import { ArrowRight } from 'lucide-react';
import { T, EyebrowLabel, Card } from './AppointmentUI';

const AppointmentSummary = ({ 
  selectedServices, 
  selectedDoctor, 
  subtotal, 
  handleGoToScheduler, 
  onCancel 
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>
      {/* Resumen de cita */}
      <Card style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: 16, fontWeight: 900, color: T.slate900, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Resumen del plan
        </h3>
        <EyebrowLabel>Confirmación rápida del tratamiento</EyebrowLabel>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {selectedServices.length === 0 ? (
            <div style={{ fontSize: 13, color: T.slate400, fontWeight: 600, padding: '8px 0' }}>
              Sin servicios seleccionados
            </div>
          ) : selectedServices.map(sv => (
            <div key={sv.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.slate800 }}>{sv.name}</div>
                <div style={{ fontSize: 10, color: T.slate400, fontWeight: 600 }}>Cantidad: 1</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: T.slate900, flexShrink: 0, marginLeft: 12 }}>
                ${sv.price}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ margin: '18px 0', height: 1, background: `repeating-linear-gradient(90deg, ${T.slate200} 0, ${T.slate200} 6px, transparent 6px, transparent 12px)` }} />

        {/* Specialist + totals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: T.slate400, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Especialista</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.slate700 }}>
              {selectedDoctor?.name || 'No asignado'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: T.slate400, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Subtotal</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: T.slate900 }}>${subtotal}</span>
          </div>
        </div>

        {/* Total box */}
        <div style={{
          marginTop: 18, borderRadius: 18,
          background: T.primary,
          padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 8px 24px rgba(37,99,235,0.25)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
            Total final
          </span>
          <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em' }}>
            ${subtotal}
          </span>
        </div>
      </Card>

      {/* Siguiente paso */}
      <Card style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: 14, fontWeight: 900, color: T.slate900, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
          Siguiente paso
        </h3>
        <p style={{ fontSize: 13, color: T.slate500, fontWeight: 500, lineHeight: 1.7, margin: '0 0 20px' }}>
          Al hacer clic en <strong style={{ color: T.slate800 }}>"Ver horarios disponibles"</strong>, el sistema te llevará a{' '}
          <span style={{ color: T.primary, fontWeight: 800 }}>Agenda Atómica</span>{' '}
          con el paciente, servicios y especialista ya precargados.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleGoToScheduler}
            disabled={selectedServices.length === 0 || !selectedDoctor}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
              background: (selectedServices.length === 0 || !selectedDoctor) ? T.slate200 : T.primary,
              color: (selectedServices.length === 0 || !selectedDoctor) ? T.slate400 : '#fff',
              fontWeight: 800, fontSize: 13, letterSpacing: '0.04em',
              cursor: (selectedServices.length === 0 || !selectedDoctor) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: (selectedServices.length > 0 && selectedDoctor) ? '0 6px 20px rgba(37,99,235,0.25)' : 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (selectedServices.length > 0 && selectedDoctor) e.currentTarget.style.background = T.primaryH; }}
            onMouseLeave={e => { if (selectedServices.length > 0 && selectedDoctor) e.currentTarget.style.background = T.primary; }}
          >
            Ver horarios disponibles <ArrowRight size={16} />
          </button>
          <button
            onClick={onCancel}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 14, border: `1px solid ${T.slate200}`,
              background: T.white, color: T.slate500, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.slate50; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.white; }}
          >
            Cancelar
          </button>
        </div>
      </Card>
    </div>
  );
};

export default AppointmentSummary;
