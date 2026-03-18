import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Move, Check } from 'lucide-react';

const ToothContextMenu = ({ anchor, toothNumber, surface, onClose, onAction, currentState }) => {
  const [activeLabel, setActiveLabel] = useState(null);
  const [submenuData, setSubmenuData] = useState(null); // { items, top, label }
  const [pos, setPos] = useState({ x: anchor.x, y: anchor.y });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    setPos({ x: anchor.x, y: anchor.y });
  }, [anchor]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const onDragStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    // Calculate offset once when starting
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const isItemActive = (item) => {
    if (item.action) {
      return item.action === currentState.whole || 
             item.action === currentState.surface || 
             item.action === currentState.row;
    }
    if (item.submenu) {
      return item.submenu.some(sub => isItemActive(sub));
    }
    return false;
  };

  const menuStructure = [
    { 
      label: 'Diente Sano', 
      icon: <span className="icon-s">S</span>,
      submenu: [
        { label: 'Seleccionar este diente', action: 'SAN_THIS' },
        { label: 'Seleccionar varios dientes', action: 'SAN_MULTI' }
      ]
    },
    { 
      label: 'Caries', 
      icon: <div className="icon-rect red" />,
      submenu: [
        { label: 'Seleccionar este diente', action: 'CARIES' },
        { label: 'Seleccionar varios dientes', action: 'CAR_MULTI' }
      ]
    },
    { 
      label: 'Restauración', 
      icon: <div className="icon-restoration blue" />,
      submenu: [
        { label: 'Buen estado', action: 'RES_GOOD' },
        { label: 'Defectuosa', action: 'RES_DEF' },
        { label: 'Provisional', action: 'RES_PROV' }
      ]
    },
    { 
      label: 'Exodoncia', 
      icon: <div className="icon-x red" />,
      submenu: [
        { label: 'Exodoncia indicada', action: 'EXO_IND' },
        { label: 'Exodoncia realizada', action: 'EXO_REA' },
        { type: 'divider' },
        { label: 'Marcar varios (indicada)', action: 'EXO_IND_MULTI' },
        { label: 'Marcar varios (realizada)', action: 'EXO_REA_MULTI' }
      ]
    },
    { 
      label: 'Endodoncia', 
      icon: <div className="icon-bar red" />,
      submenu: [
        { label: 'Endodoncia indicada', action: 'END_IND' },
        { label: 'Endodoncia realizada', action: 'END_REA' },
        { type: 'divider' },
        { label: 'Marcar varios (indicada)', action: 'END_IND_MULTI' },
        { label: 'Marcar varios (realizada)', action: 'END_REA_MULTI' }
      ]
    },
    { 
      label: 'Corona', 
      icon: <div className="icon-circle red" />,
      submenu: [
        { label: 'Corona indicada', action: 'COR_IND' },
        { label: 'Corona realizada', action: 'COR_REA' },
        { label: 'Corona defectuosa', action: 'COR_DEF' }
      ]
    },
    { 
      label: 'Implante', 
      icon: <div className="icon-implante red" />,
      submenu: [
        { label: 'Implante indicado', action: 'IMP_IND' },
        { label: 'Implante realizado', action: 'IMP_REA' },
        { type: 'divider' },
        { label: 'Marcar varios (indicado)', action: 'IMP_IND_MULTI' },
        { label: 'Marcar varios (realizado)', action: 'IMP_REA_MULTI' }
      ]
    },
    { 
      label: 'Erupción', 
      icon: <div className="icon-eruption red" />,
      submenu: [
        { label: 'Proceso erupción alterado', action: 'ERU_ALT' },
        { label: 'Erupción dental', action: 'ERU_DEN' }
      ]
    },
    { 
      label: 'Prótesis', 
      icon: <div className="icon-protesis red" />,
      submenu: [
        { 
          label: 'Total', 
          submenu: [
            { label: 'Indicada', action: 'PRO_TOT_IND' },
            { label: 'Realizada', action: 'PRO_TOT_REA' }
          ]
        },
        { 
          label: 'Parcial removible', 
          submenu: [
            { label: 'Indicada (inicio)', action: 'PRO_PAR_IND' },
            { label: 'Realizada (inicio)', action: 'PRO_PAR_REA' },
            ...(currentState.hasBridge ? [
              { type: 'divider' },
              { label: 'Borrar Prótesis Parcial', action: 'DELETE_BRIDGE', className: 'menu-reset' }
            ] : [])
          ]
        }
      ]
    },
    { 
      label: 'Sellante', 
      icon: <div className="icon-ll green" />,
      submenu: [
        { label: 'Sellante indicado', icon: <div className="icon-ll red" />, action: 'SEL_IND' },
        { label: 'Sellante realizado', icon: <div className="icon-ll green" />, action: 'SEL_REA' }
      ]
    },
    { 
      label: 'Fractura', 
      icon: <div className="icon-fracture" />,
      submenu: [
        { label: 'Seleccionar este diente', action: 'FRACTURE' },
        { label: 'Marcar varios', action: 'FRA_MULTI' }
      ]
    },
    { 
      label: 'Diente ausente', 
      icon: <div className="icon-absent" />,
      submenu: [
        { label: 'Seleccionar este diente', action: 'ABSENT' },
        { label: 'Marcar varios', action: 'ABS_MULTI' }
      ]
    },
    { type: 'divider' },
    { label: 'Borrar todo', action: 'RESET', className: 'menu-reset' }
  ];

  const handleItemClick = (item, e) => {
    e.stopPropagation();
    if (item.submenu) {
      if (activeLabel === item.label) {
        setActiveLabel(null);
        setSubmenuData(null);
      } else {
        setActiveLabel(item.label);
        const rect = e.currentTarget.getBoundingClientRect();
        const parentRect = menuRef.current.getBoundingClientRect();
        setSubmenuData({
          items: item.submenu,
          top: rect.top - parentRect.top,
          label: item.label
        });
      }
    } else if (item.action) {
      onAction(toothNumber, surface, item.action);
      onClose();
    }
  };

  return (
    <div 
      ref={menuRef}
      className={`tooth-context-menu ${isDragging ? 'dragging' : ''}`} 
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="menu-header">
        <span>Diente {toothNumber} - Cara {surface.toUpperCase()}</span>
        <div className="move-handle" onMouseDown={onDragStart}>
          <Move size={14} />
        </div>
      </div>
      <div className="menu-body">
        {menuStructure.map((item, idx) => {
          if (item.type === 'divider') return <div key={idx} className="menu-divider" />;
          const hasSub = !!item.submenu;
          const isActive = activeLabel === item.label;
          const isSelected = isItemActive(item);
          
          return (
            <div key={item.label} className="menu-item-container">
              <div 
                className={`menu-item ${item.className || ''} ${isActive ? 'active' : ''} ${isSelected ? 'selected-state' : ''}`}
                onClick={(e) => handleItemClick(item, e)}
              >
                <div className="menu-item-left">
                  {item.icon && <div className="menu-icon-wrapper">{item.icon}</div>}
                  <span className="menu-label">{item.label}</span>
                </div>
                <div className="menu-item-right">
                  {isSelected && !hasSub && <Check size={14} className="selected-check" />}
                  {hasSub && (
                    <div className="arrow-trigger">
                      <ChevronRight size={14} className="submenu-arrow" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {submenuData && activeLabel === submenuData.label && (
        <SubMenu 
          items={submenuData.items} 
          top={submenuData.top}
          onAction={onAction}
          onClose={onClose}
          toothNumber={toothNumber}
          surface={surface}
          currentState={currentState}
          isItemActive={isItemActive}
        />
      )}
    </div>
  );
};

const SubMenu = ({ items, top, onAction, onClose, toothNumber, surface, currentState, isItemActive }) => {
  const [direction, setDirection] = useState('right');
  const [nestedSubmenu, setNestedSubmenu] = useState(null);
  const [activeSubLabel, setActiveSubLabel] = useState(null);
  const submenuRef = useRef(null);

  useEffect(() => {
    if (submenuRef.current) {
      const rect = submenuRef.current.getBoundingClientRect();
      const overflowRight = rect.right > window.innerWidth;
      if (overflowRight) {
        setDirection('left');
      }
    }
  }, []);

  const handleSubItemClick = (item, e) => {
    e.stopPropagation();
    if (item.submenu) {
      if (activeSubLabel === item.label) {
        setActiveSubLabel(null);
        setNestedSubmenu(null);
      } else {
        setActiveSubLabel(item.label);
        const rect = e.currentTarget.getBoundingClientRect();
        const parentRect = submenuRef.current.getBoundingClientRect();
        setNestedSubmenu({
          items: item.submenu,
          top: rect.top - parentRect.top,
          label: item.label
        });
      }
    } else if (item.action) {
      onAction(toothNumber, surface, item.action);
      onClose();
    }
  };

  return (
    <div 
      ref={submenuRef}
      className={`submenu floating-submenu ${direction === 'left' ? 'submenu-left' : ''}`}
      style={{ top }}
    >
      {items.map((item, idx) => {
        if (item.type === 'divider') return <div key={idx} className="menu-divider" />;
        const hasSub = !!item.submenu;
        const isActive = activeSubLabel === item.label;
        const isSelected = isItemActive(item);
        
        return (
          <div key={item.label} className="menu-item-container">
            <div 
              className={`menu-item ${isActive ? 'active' : ''} ${isSelected ? 'selected-state' : ''}`}
              onClick={(e) => handleSubItemClick(item, e)}
            >
              <div className="menu-item-left">
                {item.icon && <div className="menu-icon-wrapper">{item.icon}</div>}
                <span className="menu-label">{item.label}</span>
              </div>
              <div className="menu-item-right">
                {isSelected && !hasSub && <Check size={14} className="selected-check" />}
                {hasSub && <ChevronRight size={14} className="submenu-arrow" />}
              </div>
            </div>
          </div>
        );
      })}

      {nestedSubmenu && activeSubLabel === nestedSubmenu.label && (
        <SubMenu 
          items={nestedSubmenu.items}
          top={nestedSubmenu.top}
          onAction={onAction}
          onClose={onClose}
          toothNumber={toothNumber}
          surface={surface}
          currentState={currentState}
          isItemActive={isItemActive}
        />
      )}
    </div>
  );
};

export default ToothContextMenu;
