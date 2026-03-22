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
              className="fixed bottom-0 left-0 right-0 bg-white dark:glass rounded-t-[32px] p-8 z-[201] shadow-2xl border-t border-slate-100 dark:border-white/10"
              style={{ maxWidth: '500px', margin: '0 auto' }}
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col gap-1">
                  <h2 className="text-primary" style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Ajouter</h2>
                  <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sélectionnez un type</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all active:scale-90 text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {options.map((opt) => (
                  <button 
                    key={opt.id} 
                    className="flex items-center gap-5 p-5 hover:bg-slate-50 rounded-[24px] transition-all w-full text-left group active:scale-[0.98] border border-transparent hover:border-slate-100 dark:hover:border-white/5"
                    onClick={() => handleOptionClick(opt.id)}
                  >
                    <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${
                      opt.id === 'course' 
                        ? 'bg-primary/10 dark:bg-blue-500/20' 
                        : 'bg-error/10 dark:bg-red-500/20'
                    }`}>
                      {opt.icon}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-primary" style={{ fontWeight: 700, fontSize: '1.1rem' }}>{opt.label}</span>
                      <span className="text-[13px] text-slate-500 font-medium">
                        {opt.id === 'course' ? 'Planifier une session' : 'Définir une échéance'}
                      </span>
                    </div>
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
