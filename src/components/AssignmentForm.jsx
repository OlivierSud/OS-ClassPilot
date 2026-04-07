import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { syncEventToGoogleCalendar, isGoogleConnected } from '../lib/googleCalendar';

const AssignmentForm = ({ onClose, onSuccess, initialData }) => {
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    id: initialData?.id || null,
    title: initialData?.title || '',
    class_id: initialData?.class_id || '',
    start_date: initialData?.start_date || '',
    due_date: initialData?.due_date || '',
    description: initialData?.description || ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchClasses() {
      const { data } = await supabase.from('classes').select('id, name, color');
      if (data) {
        setClasses(data);
        if (data.length > 0 && !formData.class_id) {
          setFormData(prev => ({ ...prev, class_id: data[0].id }));
        }
      }
    }
    fetchClasses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { id, ...dataToSave } = formData;
    
    const { error } = id
      ? await supabase
        .from('assignments')
        .update({ 
          ...dataToSave,
          start_date: dataToSave.start_date ? new Date(dataToSave.start_date).toISOString() : null,
          due_date: new Date(dataToSave.due_date).toISOString()
        })
        .eq('id', id)
      : await supabase
        .from('assignments')
        .insert([
          { 
            ...dataToSave,
            start_date: dataToSave.start_date ? new Date(dataToSave.start_date).toISOString() : null,
            due_date: new Date(dataToSave.due_date).toISOString()
          }
        ]);

    if (!error) {
      if (await isGoogleConnected()) {
        const classObj = classes.find(c => c.id === formData.class_id);
        const className = classObj?.name || "?";
        await syncEventToGoogleCalendar({
          title: `[Rendu] ${className} - ${formData.title}`,
          description: formData.description,
          start_time: new Date(dataToSave.due_date).toISOString(),
          isAllDay: true,
          color: classObj?.color || 'var(--grad-error)'
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } else {
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Classe</label>
        <select 
          required
          value={formData.class_id}
          onChange={(e) => setFormData({...formData, class_id: e.target.value})}
          className="form-input"
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
          {classes.length === 0 && <option value="">Aucune classe trouvée</option>}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Titre du devoir</label>
        <input 
          required
          type="text" 
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="form-input"
          placeholder="ex: Analyse UX"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date de début</label>
          <input 
            type="date" 
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            className="form-input"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date de rendu</label>
          <input 
            required
            type="date" 
            value={formData.due_date}
            onChange={(e) => setFormData({...formData, due_date: e.target.value})}
            className="form-input"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
        <textarea 
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="form-input"
          placeholder="Détails du devoir..."
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="bg-error text-white p-4 rounded-xl font-semibold mt-4 shadow-lg active:scale-95 transition-transform"
      >
        {loading ? 'Enregistrement...' : formData.id ? 'Modifier le rendu' : 'Ajouter le rendu'}
      </button>
    </form>
  );
};

export default AssignmentForm;
