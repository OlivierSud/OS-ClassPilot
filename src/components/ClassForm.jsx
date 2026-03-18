import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const ClassForm = ({ onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    id: initialData?.id || null,
    name: initialData?.name || '',
    color: initialData?.color || 'var(--grad-primary)'
  });
  const [loading, setLoading] = useState(false);

  const colors = [
    { name: 'Bleu', value: 'var(--grad-primary)' },
    { name: 'Orange', value: 'var(--grad-secondary)' },
    { name: 'Violet', value: 'var(--grad-accent)' },
    { name: 'Rouge', value: 'var(--grad-error)' },
    { name: 'Vert', value: 'linear-gradient(135deg, #10b981, #059669)' },
    { name: 'Rose', value: 'linear-gradient(135deg, #ec4899, #db2777)' },
  ];

  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved'

  const handleAutoSave = async (updatedData) => {
    if (!updatedData.id) return;
    
    setSaveStatus('saving');
    const { error } = await supabase
      .from('classes')
      .update({
        name: updatedData.name,
        color: updatedData.color
      })
      .eq('id', updatedData.id);

    if (error) {
      alert("Erreur de sauvegarde automatique : " + error.message);
      setSaveStatus('error');
    } else {
      setSaveStatus('saved');
      if (onSuccess) onSuccess(); // Signal update to parent
      setTimeout(() => setSaveStatus('idle'), 2000); // Reset status
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (formData.id) return;
    
    setSaveStatus('saving');
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('classes')
      .insert([
        { 
          name: formData.name,
          color: formData.color,
          user_id: user?.id 
        }
      ]);

    if (!error) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      alert(error.message);
    }
    setSaveStatus('idle');
  };

  const handleColorSelect = (colorValue) => {
    const newData = { ...formData, color: colorValue };
    setFormData(newData);
    if (formData.id) {
      handleAutoSave(newData);
    }
  };

  const handleNameBlur = () => {
    if (formData.id) {
      handleAutoSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Nom de la classe
        </label>
        <input 
          required
          type="text" 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          onBlur={handleNameBlur}
          className="form-input"
          style={{ fontSize: '1.25rem', padding: '16px', borderRadius: '16px' }}
          placeholder="ex: M1 Interaction"
        />
      </div>

      <div className="flex flex-col gap-3">
        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Couleur distinctive
        </label>
        <div className="flex flex-wrap gap-4">
          {colors.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => handleColorSelect(c.value)}
              style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '18px', 
                background: c.value,
                border: formData.color === c.value ? '4px solid white' : 'none',
                boxShadow: formData.color === c.value ? '0 0 0 3px var(--primary)' : '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: formData.color === c.value ? 'scale(1.1)' : 'scale(1)'
              }}
              className="active:scale-95"
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          {saveStatus === 'saving' && (
            <motion.div 
              key="saving"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2 text-primary font-medium"
            >
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <span style={{ fontSize: '0.9rem' }}>Enregistrement...</span>
            </motion.div>
          )}
          {saveStatus === 'saved' && (
            <motion.div 
              key="saved"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-success font-medium"
            >
              <div className="p-1 bg-success/10 rounded-full">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <path d="M20 6L9 17L4 12" />
                </svg>
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--success)' }}>Enregistré !</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!formData.id && (
        <button 
          type="submit" 
          disabled={saveStatus === 'saving'}
          className="bg-accent text-white p-5 rounded-2xl font-bold mt-4 shadow-xl active:scale-95 transition-all"
        >
          {saveStatus === 'saving' ? 'Création...' : 'Créer la classe'}
        </button>
      )}
    </form>
  );
};

export default ClassForm;
