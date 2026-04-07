import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { syncEventToGoogleCalendar, isGoogleConnected } from '../lib/googleCalendar';

const CourseForm = ({ onClose, onSuccess, initialData }) => {
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    id: initialData?.id || null,
    title: initialData?.title || '',
    class_id: initialData?.class_id || '',
    start_time: initialData?.start_time ? format(new Date(initialData.start_time), "yyyy-MM-dd'T'HH:mm") : '',
    end_time: initialData?.end_time ? format(new Date(initialData.end_time), "yyyy-MM-dd'T'HH:mm") : ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchClasses() {
      const { data } = await supabase.from('classes').select('id, name');
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
    
    const start = new Date(formData.start_time);
    const end = new Date(formData.end_time);

    if (end <= start) {
      alert("L'heure de fin doit être après l'heure de début.");
      setLoading(false);
      return;
    }

    const payload = {
      title: formData.title,
      class_id: formData.class_id,
      start_time: start.toISOString(),
      end_time: end.toISOString()
    };

    const { error } = formData.id 
      ? await supabase
        .from('courses')
        .update(payload)
        .eq('id', formData.id)
      : await supabase
        .from('courses')
        .insert([payload]);

    if (!error) {
      if (await isGoogleConnected()) {
        await syncEventToGoogleCalendar({
          title: formData.title,
          start_time: payload.start_time,
          end_time: payload.end_time
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
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Titre du cours</label>
        <input 
          required
          type="text" 
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="form-input"
          placeholder="ex: L3 UX Design"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Début</label>
          <input 
            required
            type="datetime-local" 
            value={formData.start_time}
            onChange={(e) => setFormData({...formData, start_time: e.target.value})}
            className="form-input"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fin</label>
          <input 
            required
            type="datetime-local" 
            value={formData.end_time}
            onChange={(e) => setFormData({...formData, end_time: e.target.value})}
            className="form-input"
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="bg-primary text-white p-4 rounded-xl font-semibold mt-4 shadow-lg active:scale-95 transition-transform"
      >
        {loading ? 'Enregistrement...' : formData.id ? 'Modifier le cours' : 'Planifier le cours'}
      </button>
    </form>
  );
};

export default CourseForm;
