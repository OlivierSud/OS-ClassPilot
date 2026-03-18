import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, FileText, Info, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssignment } from '../../hooks/useData';
import { formatDate } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { assignment, loading } = useAssignment(id);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleDelete = async () => {
    if (window.confirm('Voulez-vous supprimer ce devoir ?')) {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (!error) navigate(-1);
    }
  };

  const handleStartEdit = () => {
    setEditData({
      title: assignment.title || '',
      start_date: assignment.start_date ? assignment.start_date.slice(0, 10) : '',
      due_date: assignment.due_date ? assignment.due_date.slice(0, 10) : '',
      description: assignment.description || ''
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('assignments')
      .update({
        title: editData.title,
        start_date: editData.start_date ? new Date(editData.start_date).toISOString() : null,
        due_date: new Date(editData.due_date).toISOString(),
        description: editData.description
      })
      .eq('id', id);

    if (!error) {
      window.location.reload();
    } else {
      alert(error.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="page-container flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-bold mb-4">Devoir non trouvé</h2>
        <button onClick={() => navigate(-1)} className="bg-primary text-white px-6 py-2 rounded-xl">Retour</button>
      </div>
    );
  }

  const { title, classes, due_date, start_date, description, completed } = assignment;

  return (
    <div className="page-container">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <button onClick={() => isEditing ? setIsEditing(false) : navigate(-1)} className="bg-white p-2 rounded-full shadow-sm">
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, flex: 1, textAlign: 'center' }}>{isEditing ? 'Modifier' : title}</h1>
        <button onClick={handleDelete} className="bg-white p-2 rounded-full shadow-sm text-error">
          <Trash2 size={20} />
        </button>
      </header>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.form
            key="edit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSaveEdit}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Titre</label>
              <input 
                required
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({...editData, title: e.target.value})}
                className="form-input"
                style={{ fontSize: '1.1rem', padding: '14px', borderRadius: '14px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="flex flex-col gap-2">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date de début</label>
                <input 
                  required
                  type="date"
                  value={editData.start_date}
                  onChange={(e) => setEditData({...editData, start_date: e.target.value})}
                  className="form-input"
                  style={{ padding: '14px', borderRadius: '14px' }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date de rendu</label>
                <input 
                  required
                  type="date"
                  value={editData.due_date}
                  onChange={(e) => setEditData({...editData, due_date: e.target.value})}
                  className="form-input"
                  style={{ padding: '14px', borderRadius: '14px' }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
              <textarea 
                rows={3}
                value={editData.description}
                onChange={(e) => setEditData({...editData, description: e.target.value})}
                className="form-input"
                style={{ padding: '14px', borderRadius: '14px' }}
                placeholder="Détails du devoir..."
              />
            </div>

            <button 
              type="submit"
              disabled={saving}
              style={{ 
                width: '100%', 
                padding: '20px', 
                borderRadius: '16px', 
                fontSize: '1.1rem', 
                fontWeight: 700, 
                background: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                marginTop: '12px', 
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' 
              }}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="card shadow-md border-none p-6">
              <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Classe : </span>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{classes?.name || 'Inconnue'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="card shadow-md border-none p-6 flex flex-col gap-2">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={16} /> Début :
                </div>
                <div style={{ fontWeight: 600 }}>{start_date ? formatDate(new Date(start_date)) : 'N/A'}</div>
              </div>
              <div className="card shadow-md border-none p-6 flex flex-col gap-2">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={16} /> Échéance :
                </div>
                <div style={{ fontWeight: 600 }}>{due_date ? formatDate(new Date(due_date)) : 'N/A'}</div>
              </div>
            </div>

            {description && (
              <div className="card shadow-md border-none p-6">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <FileText size={16} /> Description :
                </div>
                <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  {description}
                </p>
              </div>
            )}

            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleStartEdit}
              className="bg-slate-800 text-white flex items-center justify-center gap-2"
              style={{ 
                width: '100%', 
                padding: '18px', 
                borderRadius: 'var(--radius-md)',
                marginTop: '16px',
                fontWeight: 700,
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Pencil size={18} />
              Modifier le devoir
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssignmentDetail;
