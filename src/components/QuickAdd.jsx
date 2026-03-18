import { useState, useEffect } from 'react';
import { X, Layout, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import CourseForm from './CourseForm';
import AssignmentForm from './AssignmentForm';

const QuickAdd = ({ isOpen, onClose, initialData }) => {
  const [activeForm, setActiveForm] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData?.type) {
        setActiveForm(initialData.type);
      } else if (initialData?.id) {
        // Mode édition : on détecte le type
        if (initialData.due_date && !initialData.start_time) {
          setActiveForm('assignment');
        } else {
          setActiveForm('course');
        }
      } else {
        // Mode création sans type spécifié : on affiche le choix
        setActiveForm(null);
      }
    } else {
      setActiveForm(null);
    }
  }, [isOpen, initialData]);

  const options = [
    { id: 'course', icon: <Layout className="text-primary" />, label: 'Nouveau cours' },
    { id: 'assignment', icon: <FileText className="text-error" />, label: 'Nouveau rendu' },
  ];

  const handleOptionClick = (id) => {
    setActiveForm(id);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !activeForm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
              onClick={onClose}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-8 z-[201] shadow-2xl"
              style={{ maxWidth: '500px', margin: '0 auto' }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ajouter</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {options.map((opt) => (
                  <button 
                    key={opt.id} 
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors w-full text-left border-b border-slate-50 last:border-0"
                    onClick={() => handleOptionClick(opt.id)}
                  >
                    <div className="bg-slate-50 p-3 rounded-xl">
                      {opt.icon}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Modal 
        isOpen={activeForm === 'course'} 
        onClose={() => setActiveForm(null)} 
        title="Nouveau cours"
      >
        <CourseForm 
          onClose={() => { setActiveForm(null); onClose(); }} 
          initialData={initialData}
        />
      </Modal>

      <Modal 
        isOpen={activeForm === 'assignment'} 
        onClose={() => setActiveForm(null)} 
        title="Nouveau devoir"
      >
        <AssignmentForm 
          onClose={() => { setActiveForm(null); onClose(); }} 
          initialData={initialData}
        />
      </Modal>
    </>
  );
};

export default QuickAdd;
