import React from 'react';

const Tooth = ({ toothNumber, surfaces = {}, onSurfaceClick, wholeToothState }) => {
  const handleSurfaceClick = (surface, e) => {
    e.preventDefault();
    if (onSurfaceClick) {
      onSurfaceClick(toothNumber, surface, { x: e.clientX, y: e.clientY });
    }
  };

  const getSurfaceFill = (action) => {
    switch (action) {
      case 'RES_GOOD': return '#3b82f6';
      case 'RES_DEF': return 'url(#grad-mixed)';
      case 'CARIES': return '#ef4444';
      default: return '#ffffff';
    }
  };

  const isProvisional = (action) => action === 'RES_PROV';

  const getSurfaceGlow = (action) => {
    switch (action) {
      case 'RES_GOOD': return 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))';
      case 'CARIES': return 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))';
      default: return 'none';
    }
  };

  return (
    <div className="tooth-container">
      <svg viewBox="0 -20 100 120" className="tooth-svg" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="grad-mixed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="grad-tooth-base" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
        </defs>

        {/* Base Surface Polygons for interactive area and background fill */}
        <polygon 
          points="5,5 95,5 75,25 25,25" 
          className={`tooth-surface ${isProvisional(surfaces.top) ? 'provisional' : ''}`}
          style={{ 
            fill: getSurfaceFill(surfaces.top),
            filter: getSurfaceGlow(surfaces.top)
          }}
          onClick={(e) => handleSurfaceClick('top', e)}
        />
        <polygon 
          points="95,5 95,95 75,75 75,25" 
          className={`tooth-surface ${isProvisional(surfaces.right) ? 'provisional' : ''}`}
          style={{ fill: getSurfaceFill(surfaces.right) }}
          onClick={(e) => handleSurfaceClick('right', e)}
        />
        <polygon 
          points="5,95 95,95 75,75 25,75" 
          className={`tooth-surface ${isProvisional(surfaces.bottom) ? 'provisional' : ''}`}
          style={{ fill: getSurfaceFill(surfaces.bottom) }}
          onClick={(e) => handleSurfaceClick('bottom', e)}
        />
        <polygon 
          points="5,5 5,95 25,75 25,25" 
          className={`tooth-surface ${isProvisional(surfaces.left) ? 'provisional' : ''}`}
          style={{ fill: getSurfaceFill(surfaces.left) }}
          onClick={(e) => handleSurfaceClick('left', e)}
        />
        <rect 
          x="25" y="25" width="50" height="50" 
          className={`tooth-surface ${isProvisional(surfaces.center) ? 'provisional' : ''}`}
          style={{ 
            fill: wholeToothState === 'CARIES' ? '#ef4444' : getSurfaceFill(surfaces.center),
            filter: getSurfaceGlow(wholeToothState === 'CARIES' ? 'CARIES' : surfaces.center)
          }}
          onClick={(e) => handleSurfaceClick('center', e)}
        />

        {/* Caries Red Dots Layer (RENDERED ABOVE SURFACES) */}
        {Object.entries(surfaces).map(([surface, action]) => {
          if (action !== 'CARIES') return null;
          const coords = {
            top: { x: 50, y: 15 },
            right: { x: 85, y: 50 },
            bottom: { x: 50, y: 85 },
            left: { x: 15, y: 50 },
            center: { x: 50, y: 50 }
          }[surface];
          return (
            <circle 
              key={surface} 
              cx={coords.x} cy={coords.y} r="8" 
              fill="#ef4444" 
              pointerEvents="none" 
            />
          );
        })}

        {/* Clinical Symbol Overlays */}
        <g className="tooth-symbol">
          {/* Diente Sano (Large Blue S) */}
          {(wholeToothState === 'SAN_THIS' || wholeToothState === 'SAN_MULTI') && (
            <text 
              x="50" y="70" 
              textAnchor="middle" 
              className="symbol-s sano"
            >S</text>
          )}

          {/* Sellante (Double vertical lines 'll' in center) */}
          {(wholeToothState === 'SEL_IND' || wholeToothState === 'SEL_REA') && (
            <g className={`symbol-sellante-ll ${wholeToothState === 'SEL_IND' ? 'red' : 'green'}`}>
              <line x1="42" y1="30" x2="42" y2="70" />
              <line x1="58" y1="30" x2="58" y2="70" />
            </g>
          )}

          {/* Diente Ausente (Single Diagonal Blue Line) */}
          {wholeToothState === 'ABSENT' && (
            <g className="symbol-ausente">
              <line x1="10" y1="10" x2="90" y2="90" />
            </g>
          )}

          {/* Exodoncia (X Symbol) */}
          {(wholeToothState === 'EXO_IND' || wholeToothState === 'EXO_REA') && (
            <g className={`symbol-x ${wholeToothState === 'EXO_IND' ? 'red' : 'blue'}`}>
              <line x1="10" y1="10" x2="90" y2="90" />
              <line x1="90" y1="10" x2="10" y2="90" />
            </g>
          )}

          {/* Endodoncia (Bar Symbol) */}
          {(wholeToothState === 'END_IND' || wholeToothState === 'END_REA') && (
            <line x1="50" y1="5" x2="50" y2="95" className={`symbol-bar ${wholeToothState === 'END_IND' ? 'red' : 'blue'}`} />
          )}

          {/* Corona (Circle Symbol) */}
          {(wholeToothState === 'COR_IND' || wholeToothState === 'COR_REA' || wholeToothState === 'COR_DEF') && (
            <circle cx="50" cy="50" r="42" className={`symbol-circle ${wholeToothState === 'COR_IND' ? 'filled-red' : (wholeToothState === 'COR_REA' ? 'filled-blue' : 'mixed')}`} />
          )}

          {/* Erupción (Outline Circle) */}
          {(wholeToothState === 'ERU_ALT' || wholeToothState === 'ERU_DEN') && (
            <circle cx="50" cy="50" r="42" className={`symbol-circle ${wholeToothState === 'ERU_ALT' ? 'outline-red' : 'outline-blue'}`} />
          )}

          {/* Implante (Casita / U-shape) */}
          {(wholeToothState === 'IMP_IND' || wholeToothState === 'IMP_REA') && (
            <path 
              d="M30,20 L30,85 L70,85 L70,20" 
              fill="none" 
              className={`symbol-implante ${wholeToothState === 'IMP_IND' ? 'red' : 'blue'}`} 
            />
          )}

          {/* Fractura (Red Zigzag) - Matching tooth 53 */}
          {wholeToothState === 'FRACTURE' && (
            <path 
              d="M30,20 L70,40 L30,60 L70,80" 
              fill="none" 
              stroke="#ef4444" 
              strokeWidth="8" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          )}
        </g>
      </svg>
      <span className="tooth-number">{toothNumber}</span>
    </div>
  );
};

export default Tooth;
