import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft } from 'lucide-react';
import ClassCard from '../components/ClassCard';
import Modal from '../components/Modal';
import ClassForm from '../components/ClassForm';
import QuickAdd from '../components/QuickAdd';
import AssignmentForm from '../components/AssignmentForm';
import { motion, AnimatePresence } from 'framer-motion';
import { useClasses } from '../hooks/useData';
import { supabase } from '../lib/supabase';

const Classes = () => {
  const navigate = useNavigate();
  const { classes, loading, refresh } = useClasses();
  const [selectedClass, setSelectedClass] = useState(null);
  const [fullScreenMode, setFullScreenMode] = useState(null); // 'edit', 'add_assignment', 'create'
  const [quickAddData, setQuickAddData] = useState(null);

  const handleRefresh = async () => {
    const data = await refresh();
    if (selectedClass) {
      // Synchroniser la classe sélectionnée avec les nouvelles données
      const updated = data?.find(c => c.id === selectedClass.id);
      if (updated) setSelectedClass(updated);
    }
  };

  const handleOptionSelect = async (optionId, classData) => {
    setSelectedClass(classData);
    if (optionId === 'edit' || optionId === 'rename' || optionId === 'color') {
      setFullScreenMode('edit');
    } else if (optionId === 'delete') {
      if (confirm(`Êtes-vous sûr de vouloir supprimer la classe "${classData.name}" ?`)) {
        const { error } = await supabase
          .from('classes')
          .delete()
          .eq('id', classData.id);
        
        if (!error) {
          handleRefresh(); 
        } else {
          alert("Erreur lors de la suppression : " + error.message);
        }
      }
    } else if (optionId === 'add_assignment') {
      setQuickAddData({ class_id: classData.id, type: 'assignment' });
      setFullScreenMode('add_assignment');
    }
  };

  const FullPageWrapper = ({ title, children, onClose }) => (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-[#f8fafc] z-[500] flex flex-col p-6 overflow-y-auto"
    >
      <div className="bg-white rounded-[32px] p-8 shadow-xl">
        <header className="flex items-center gap-4 mb-8">
          <button 
            onClick={onClose}
            className="p-1 pr-3 bg-slate-50 hover:bg-slate-100 rounded-full active:scale-90 transition-all flex items-center gap-2"
          >
            <div className="bg-white p-1.5 rounded-full shadow-sm">
              <ChevronLeft size={20} className="text-slate-600" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Retour</span>
          </button>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h1>
        </header>
        {children}
      </div>
    </motion.div>
  );

  return (
    <div className="page-container">
      <AnimatePresence>
        {fullScreenMode === 'edit' && (
          <FullPageWrapper 
            title={selectedClass?.name || "Modifier"} 
            onClose={() => setFullScreenMode(null)}
          >
            <ClassForm 
              initialData={selectedClass} 
              onClose={() => setFullScreenMode(null)}
              onSuccess={handleRefresh}
            />
          </FullPageWrapper>
        )}

        {fullScreenMode === 'add_assignment' && (
          <FullPageWrapper 
            title={selectedClass?.name || "Devoir"} 
            onClose={() => setFullScreenMode(null)}
          >
            <AssignmentForm 
              initialData={quickAddData}
              onClose={() => setFullScreenMode(null)}
              onSuccess={handleRefresh}
            />
          </FullPageWrapper>
        )}

        {fullScreenMode === 'create' && (
          <FullPageWrapper 
            title="Nouvelle classe" 
            onClose={() => setFullScreenMode(null)}
          >
            <ClassForm 
              onClose={() => setFullScreenMode(null)}
              onSuccess={() => { handleRefresh(); setFullScreenMode(null); }}
            />
          </FullPageWrapper>
        )}
      </AnimatePresence>

      <header className="section-title">
        <h1 style={{ fontSize: '1.5rem' }}>Mes classes</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {classes.map(c => (
          <ClassCard 
            key={c.id}
            classData={c} 
            onOptionSelect={handleOptionSelect}
            onClick={() => navigate(`/class/${c.id}`)}
          />
        ))}
        {!loading && classes.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
            Vous n'avez pas encore de classe.
          </p>
        )}
      </div>

      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={() => setFullScreenMode('create')}
        className="flex items-center justify-center gap-2"
        style={{ 
          width: '100%', 
          padding: '16px', 
          borderRadius: 'var(--radius-md)', 
          marginTop: '24px',
          fontWeight: 700,
          background: '#ffffff',
          color: '#0f172a',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
          border: 'none'
        }}
      >
        <Plus size={20} />
        Ajouter classe
      </motion.button>
    </div>
  );
};

export default Classes;
