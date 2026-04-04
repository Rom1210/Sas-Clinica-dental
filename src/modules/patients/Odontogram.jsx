import React, { useState, useEffect } from 'react';
import Tooth from './Tooth';
import ToothContextMenu from './ToothContextMenu';
import { Info, X } from 'lucide-react';
import './Odontogram.css';

const Odontogram = () => {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeSelection, setActiveSelection] = useState({ tooth: null, surface: null });
  const [odontogramData, setOdontogramData] = useState({});
  const [selectionMode, setSelectionMode] = useState(null); // null | 'parcial'
  const [parcialStart, setParcialStart] = useState(null);
  const [rowStates, setRowStates] = useState({
    permUpper: null, 
    permLower: null,
    tempUpper: null,
    tempLower: null
  });
  const [bridges, setBridges] = useState([]); // { start, end, type }

  // Body scroll lock logic
  useEffect(() => {
    if (menuAnchor) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [menuAnchor]);

  const handleSurfaceClick = (toothNumber, surface, anchor) => {
    if (selectionMode === 'parcial') {
      handleAction(toothNumber, surface, 'PRO_PAR_END');
      return;
    }
    if (selectionMode && selectionMode !== 'parcial') {
      handleAction(toothNumber, surface, selectionMode);
      return;
    }
    setActiveSelection({ tooth: toothNumber, surface });
    setMenuAnchor(anchor);
  };

  const handleAction = (toothNumber, surface, action) => {
    // Handle special multi-step actions
    if (action === 'SAN_MULTI') {
      setSelectionMode('SAN_THIS');
      return;
    }
    if (action === 'CAR_MULTI') {
      setSelectionMode('CARIES');
      return;
    }
    if (action === 'EXO_IND_MULTI') {
      setSelectionMode('EXO_IND');
      return;
    }
    if (action === 'EXO_REA_MULTI') {
      setSelectionMode('EXO_REA');
      return;
    }
    if (action === 'END_IND_MULTI') {
      setSelectionMode('END_IND');
      return;
    }
    if (action === 'END_REA_MULTI') {
      setSelectionMode('END_REA');
      return;
    }
    if (action === 'IMP_IND_MULTI') {
      setSelectionMode('IMP_IND');
      return;
    }
    if (action === 'IMP_REA_MULTI') {
      setSelectionMode('IMP_REA');
      return;
    }
    if (action === 'FRA_MULTI') {
      setSelectionMode('FRACTURE');
      return;
    }
    if (action === 'ABS_MULTI') {
      setSelectionMode('ABSENT');
      return;
    }

    if (action === 'PRO_PAR_IND' || action === 'PRO_PAR_REA') {
      setSelectionMode('parcial');
      setParcialStart({ tooth: toothNumber, type: action });
      return;
    }

    if (selectionMode === 'parcial' && action === 'PRO_PAR_END') {
      applyParcialProtesis(parcialStart.tooth, toothNumber, parcialStart.type);
      setSelectionMode(null);
      setParcialStart(null);
      return;
    }

    if (action.startsWith('PRO_TOT_')) {
      const row = getRowKey(toothNumber);
      setRowStates(prev => ({ 
        ...prev, 
        [row]: prev[row] === action ? null : action 
      }));
      return;
    }

    const getBridgesForTooth = (num) => {
      const rowKey = getRowKey(num);
      if (!rowKey) return [];
      const rowArr = {
        permUpper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
        permLower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
        tempUpper: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
        tempLower: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]
      }[rowKey];

      return bridges.filter(b => {
        const bRowKey = getRowKey(b.start);
        if (bRowKey !== rowKey) return false;
        const startIdx = rowArr.indexOf(b.start);
        const endIdx = rowArr.indexOf(b.end);
        const toothIdx = rowArr.indexOf(num);
        const minIdx = Math.min(startIdx, endIdx);
        const maxIdx = Math.max(startIdx, endIdx);
        return toothIdx >= minIdx && toothIdx <= maxIdx;
      });
    };

    if (action === 'DELETE_BRIDGE') {
      const toothBridges = getBridgesForTooth(toothNumber);
      setBridges(prev => prev.filter(b => !toothBridges.includes(b)));
      return;
    }

    if (action === 'RESET') {
      setOdontogramData(prev => {
        const newData = { ...prev };
        delete newData[toothNumber];
        return newData;
      });

      const rowKey = getRowKey(toothNumber);
      if (rowKey) {
        setRowStates(prev => ({ ...prev, [rowKey]: null }));
        const toothBridges = getBridgesForTooth(toothNumber);
        setBridges(prev => prev.filter(b => !toothBridges.includes(b)));
      }
      return;
    }

    setOdontogramData(prev => {
      const currentTooth = prev[toothNumber] || { surfaces: {}, wholeState: null };
      
      // Distinguish between surface actions and whole tooth actions
      const surfaceActions = ['RES_GOOD', 'RES_DEF', 'RES_PROV'];
      
      if (surfaceActions.includes(action)) {
        // Toggle surface action
        const isCurrentlyApplied = currentTooth.surfaces[surface] === action;
        const newSurfaces = { ...currentTooth.surfaces };
        
        if (isCurrentlyApplied) {
          delete newSurfaces[surface];
        } else {
          newSurfaces[surface] = action;
        }

        return {
          ...prev,
          [toothNumber]: {
            ...currentTooth,
            surfaces: newSurfaces
          }
        };
      } else {
        // Toggle whole tooth states
        const isCurrentlyApplied = currentTooth.wholeState === action;
        return {
          ...prev,
          [toothNumber]: {
            ...currentTooth,
            wholeState: isCurrentlyApplied ? null : action
          }
        };
      }
    });
  };

  const getRowKey = (num) => {
    if (num >= 11 && num <= 28) return 'permUpper';
    if (num >= 31 && num <= 48) return 'permLower';
    if (num >= 51 && num <= 65) return 'tempUpper';
    if (num >= 71 && num <= 85) return 'tempLower';
    return null;
  };

  const applyParcialProtesis = (start, end, type) => {
    setBridges(prev => [...prev, { start, end, type }]);
  };

  const renderRowLines = (rowKey) => {
    const state = rowStates[rowKey];
    if (!state) return null;
    const color = state.includes('REA') ? 'blue' : 'red';
    return <div className={`protesis-total-line ${color}`} />;
  };

  const getToothMarkers = (num) => {
    // Linear mapping for FDI quadrants to handle ranges correctly
    const upperRow = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
    const lowerRow = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
    const tempUpper = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
    const tempLower = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

    const findInRow = (num, row) => {
      const idx = row.indexOf(num);
      return idx !== -1 ? { row, idx } : null;
    };

    const toothInfo = findInRow(num, upperRow) || findInRow(num, lowerRow) || findInRow(num, tempUpper) || findInRow(num, tempLower);
    if (!toothInfo) return null;

    const bridge = bridges.find(b => {
      const startInfo = findInRow(b.start, toothInfo.row);
      const endInfo = findInRow(b.end, toothInfo.row);
      if (!startInfo || !endInfo) return false;
      const minIdx = Math.min(startInfo.idx, endInfo.idx);
      const maxIdx = Math.max(startInfo.idx, endInfo.idx);
      return toothInfo.idx >= minIdx && toothInfo.idx <= maxIdx;
    });

    if (!bridge) return null;

    const startInfo = findInRow(bridge.start, toothInfo.row);
    const endInfo = findInRow(bridge.end, toothInfo.row);
    const isStart = num === bridge.start;
    const isEnd = num === bridge.end;
    const color = bridge.type.includes('REA') ? 'blue' : 'red';
    
    // Determine if the line segment should connect to neighbors
    const currentIdx = toothInfo.idx;
    const startIdx = startInfo.idx;
    const endIdx = endInfo.idx;
    const minIdx = Math.min(startIdx, endIdx);

    return (
      <div className={`bridge-marker-layer ${color}`}>
        {isStart && <div className={`bracket-marker start ${color}`} />}
        <div className={`bridge-line-segment ${color}`} />
        {isEnd && <div className={`bracket-marker end ${color}`} />}
      </div>
    );
  };

  const getBridgesForTooth = (num) => {
    const rowKey = getRowKey(num);
    if (!rowKey) return [];
    const rowArr = {
      permUpper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
      permLower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
      tempUpper: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
      tempLower: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]
    }[rowKey];

    return bridges.filter(b => {
      const bRowKey = getRowKey(b.start);
      if (bRowKey !== rowKey) return false;
      const startIdx = rowArr.indexOf(b.start);
      const endIdx = rowArr.indexOf(b.end);
      const toothIdx = rowArr.indexOf(num);
      const minIdx = Math.min(startIdx, endIdx);
      const maxIdx = Math.max(startIdx, endIdx);
      return toothIdx >= minIdx && toothIdx <= maxIdx;
    });
  };

  // Tooth grouping definitions according to request
  const permanentUpper = {
    left: [18, 17, 16, 15, 14, 13, 12, 11],
    right: [21, 22, 23, 24, 25, 26, 27, 28]
  };

  const temporalUpper = {
    left: [55, 54, 53, 52, 51],
    right: [61, 62, 63, 64, 65]
  };

  const temporalLower = {
    left: [85, 84, 83, 82, 81],
    right: [71, 72, 73, 74, 75]
  };

  const permanentLower = {
    left: [48, 47, 46, 45, 44, 43, 42, 41],
    right: [31, 32, 33, 34, 35, 36, 37, 38]
  };

  const renderRow = (quadrants) => (
    <div className="odontogram-row">
      <div className="odontogram-quadrant">
        {quadrants.left.map(num => (
          <div key={num} className="relative">
            {getToothMarkers(num)}
            <Tooth 
              toothNumber={num} 
              onSurfaceClick={handleSurfaceClick}
              surfaces={odontogramData[num]?.surfaces || {}}
              wholeToothState={odontogramData[num]?.wholeState}
            />
          </div>
        ))}
      </div>
      <div className="quadrant-gap" />
      <div className="odontogram-quadrant">
        {quadrants.right.map(num => (
          <div key={num} className="relative">
            {getToothMarkers(num)}
            <Tooth 
              toothNumber={num} 
              onSurfaceClick={handleSurfaceClick}
              surfaces={odontogramData[num]?.surfaces || {}}
              wholeToothState={odontogramData[num]?.wholeState}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="odontogram-wrapper">
      <div className="odontogram-header">
        <h2 className="odontogram-title">Odontograma</h2>
        <Info size={18} className="info-icon" />
      </div>

      <div className="flex flex-col gap-10 items-center w-full overflow-x-auto pb-4">
        {/* Fila superior permanente */}
        <div className="relative w-fit flex justify-center">
          {renderRowLines('permUpper')}
          {renderRow(permanentUpper)}
        </div>

        {/* Fila temporal superior */}
        <div className="relative w-fit flex justify-center">
          {renderRowLines('tempUpper')}
          <div className="odontogram-row">
            <div className="odontogram-quadrant">
              {temporalUpper.left.map(num => (
                <div key={num} className="relative">
                  {getToothMarkers(num)}
                  <Tooth 
                    toothNumber={num} 
                    onSurfaceClick={handleSurfaceClick}
                    surfaces={odontogramData[num]?.surfaces || {}}
                    wholeToothState={odontogramData[num]?.wholeState}
                  />
                </div>
              ))}
            </div>
            <div className="quadrant-gap" />
            <div className="odontogram-quadrant">
              {temporalUpper.right.map(num => (
                <div key={num} className="relative">
                  {getToothMarkers(num)}
                  <Tooth 
                    toothNumber={num} 
                    onSurfaceClick={handleSurfaceClick}
                    surfaces={odontogramData[num]?.surfaces || {}}
                    wholeToothState={odontogramData[num]?.wholeState}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fila temporal inferior */}
        <div className="relative w-fit flex justify-center">
          {renderRowLines('tempLower')}
          <div className="odontogram-row">
            <div className="odontogram-quadrant">
              {temporalLower.left.map(num => (
                <div key={num} className="relative">
                  {getToothMarkers(num)}
                  <Tooth 
                    toothNumber={num} 
                    onSurfaceClick={handleSurfaceClick}
                    surfaces={odontogramData[num]?.surfaces || {}}
                    wholeToothState={odontogramData[num]?.wholeState}
                  />
                </div>
              ))}
            </div>
            <div className="quadrant-gap" />
            <div className="odontogram-quadrant">
              {temporalLower.right.map(num => (
                <div key={num} className="relative">
                  {getToothMarkers(num)}
                  <Tooth 
                    toothNumber={num} 
                    onSurfaceClick={handleSurfaceClick}
                    surfaces={odontogramData[num]?.surfaces || {}}
                    wholeToothState={odontogramData[num]?.wholeState}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fila inferior permanente */}
        <div className="relative w-fit flex justify-center">
          {renderRowLines('permLower')}
          {renderRow(permanentLower)}
        </div>

        {/* Bridges Layer - Handled per-tooth markers */}
      </div>

      {selectionMode === 'parcial' && (
        <div className="protesis-parcial-overlay">
          <span>Selecciona el diente FINAL para la Prótesis Parcial</span>
          <button onClick={() => { setSelectionMode(null); setParcialStart(null); }}>Cancelar</button>
        </div>
      )}

      {selectionMode && selectionMode !== 'parcial' && (
        <div className="protesis-parcial-overlay">
          <span>
            {selectionMode === 'SAN_THIS' && 'Selecciona los dientes SANOS (clic para marcar/desmarcar)'}
            {selectionMode === 'CARIES' && 'Selecciona los dientes con CARIES (cuadro central)'}
            {selectionMode === 'EXO_IND' && 'Marca los dientes para EXODONCIA INDICADA'}
            {selectionMode === 'EXO_REA' && 'Marca los dientes con EXODONCIA REALIZADA'}
            {selectionMode === 'END_IND' && 'Marca los dientes para ENDODONCIA INDICADA'}
            {selectionMode === 'END_REA' && 'Marca los dientes con ENDODONCIA REALIZADA'}
            {selectionMode === 'IMP_IND' && 'Marca los dientes para IMPLANTE INDICADO'}
            {selectionMode === 'IMP_REA' && 'Marca los dientes con IMPLANTE REALIZADO'}
            {selectionMode === 'FRACTURE' && 'Marca los dientes con FRACTURA (zigzag rojo)'}
            {selectionMode === 'ABSENT' && 'Marca los DIENTES AUSENTES (diagonal azul)'}
          </span>
          <button onClick={() => setSelectionMode(null)}>Terminar</button>
        </div>
      )}

      {menuAnchor && (
        <ToothContextMenu 
          anchor={menuAnchor}
          toothNumber={activeSelection.tooth}
          surface={activeSelection.surface}
          onClose={() => setMenuAnchor(null)}
          onAction={handleAction}
          currentState={{
            whole: odontogramData[activeSelection.tooth]?.wholeState,
            surface: odontogramData[activeSelection.tooth]?.surfaces[activeSelection.surface],
            row: rowStates[getRowKey(activeSelection.tooth)],
            hasBridge: getBridgesForTooth(activeSelection.tooth).length > 0
          }}
        />
      )}
    </div>
  );
};

export default Odontogram;
