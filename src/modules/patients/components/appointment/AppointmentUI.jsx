/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS (Shared across Appointment Flow components)
───────────────────────────────────────────────────────────── */
export const T = {
  bg:       '#F4F7FE',
  white:    '#ffffff',
  primary:  '#2563EB',
  primaryH: '#1D4ED8',
  slate50:  '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  shadow:   '0 2px 12px rgba(0,0,0,0.05)',
  shadowLg: '0 8px 30px rgba(0,0,0,0.08)',
};

export const EyebrowLabel = ({ children }) => (
  <span style={{
    fontSize: 10, fontWeight: 800, letterSpacing: '0.18em',
    textTransform: 'uppercase', color: T.slate400
  }}>
    {children}
  </span>
);

export const Card = ({ children, style = {} }) => (
  <div style={{
    background: T.white,
    border: `1px solid ${T.slate100}`,
    borderRadius: 24,
    boxShadow: T.shadow,
    ...style
  }}>
    {children}
  </div>
);
