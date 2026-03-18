import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ClassCard = ({ classData, onOptionSelect, onClick }) => {
  const { name, progress, next_course } = classData;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Fermer le menu si clic ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (e, actionId) => {
    e.preventDefault();
    e.stopPropagation();
    onOptionSelect(actionId, classData);
    setShowMenu(false);
  };

  return (
    <div className="relative mb-4 w-full" style={{ zIndex: showMenu ? 100 : 1 }}>
      <div 
        onClick={onClick}
        className="tuile cursor-pointer"
        style={{
          width: '100%',
          background: classData.color || 'var(--grad-secondary)',
          borderRadius: '16px',
          padding: '20px',
          color: 'white',
          position: 'relative',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        {/* === BOUTON MENU === */}
        <div 
          className="menu-btn" 
          onClick={toggleMenu}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          ⋯
        </div>

        {/* === TITRE === */}
        <h2 style={{ margin: 0, fontSize: '22px' }}>{name}</h2>

        {/* === PROGRESSION === */}
        <div className="progress-text" style={{ marginTop: '10px', fontSize: '14px' }}>
          Progression: {progress || 0}%
        </div>
        <div className="progress-bar" style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '10px',
          marginTop: '5px',
          overflow: 'hidden'
        }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress || 0}%` }}
            className="progress-fill" 
            style={{
              height: '100%',
              background: 'white'
            }}
          />
        </div>

        {/* === PROCHAIN COURS === */}
        <div className="next-course" style={{ marginTop: '10px', fontSize: '14px' }}>
          Prochain cours: {next_course || 'Non planifié'}
        </div>

        {/* === MENU DÉROULANT === */}
        <AnimatePresence>
          {showMenu && (
            <motion.div 
              ref={menuRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="menu" 
              style={{
                position: 'absolute',
                top: '45px',
                right: '15px',
                background: 'white',
                color: 'black',
                borderRadius: '8px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                display: 'block',
                minWidth: '120px',
                zIndex: 10
              }}
            >
              <div 
                onClick={(e) => handleAction(e, 'edit')}
                style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                className="hover:bg-gray-100"
              >
                Modifier
              </div>
              <div 
                onClick={(e) => handleAction(e, 'delete')}
                style={{ padding: '10px', cursor: 'pointer', color: '#ff4d00' }}
                className="hover:bg-gray-100"
              >
                Supprimer
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ClassCard;
