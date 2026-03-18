import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MoreHorizontal, CheckCircle2, ChevronRight, ChevronUp, ChevronDown, Plus, X, Clock, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { useClassDetail } from '../../hooks/useData';
import { formatDate } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { classData, loading } = useClassDetail(id);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', start_date: '', due_date: '' });
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', date: '', start_time: '', end_time: '' });
  const [editingCourse, setEditingCourse] = useState(null);

  const calculateAndUpdateProgress = async (items) => {
    if (!items || items.length === 0) return;
    const completedCount = items.filter(i => i.completed).length;
    const progression = Math.round((completedCount / items.length) * 100);
    
    await supabase
      .from('classes')
      .update({ progress: progression })
      .eq('id', id);
  };

  const handleToggleItem = async (itemId, currentStatus) => {
    const { error } = await supabase
      .from('program_items')
      .update({ completed: !currentStatus })
      .eq('id', itemId);

    if (!error) {
      // Local update for better UX but also refresh
      const updatedItems = classData.program_items.map(i => 
        i.id === itemId ? { ...i, completed: !currentStatus } : i
      );
      await calculateAndUpdateProgress(updatedItems);
      window.location.reload(); // Quickest way to sync everything
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const { error } = await supabase
      .from('program_items')
      .insert([{
        class_id: id,
        title: newItemTitle,
        position: (classData.program_items?.length || 0) + 1,
        completed: false
      }]);

    if (!error) {
      setNewItemTitle('');
      setIsAddingItem(false);
      const newItems = [...(classData.program_items || []), { completed: false }];
      await calculateAndUpdateProgress(newItems);
      window.location.reload();
    }
  };

  const handleMoveItem = async (e, itemId, direction) => {
    e.stopPropagation();
    const sorted = [...(classData.program_items || [])].sort((a,b) => a.position - b.position);
    const idx = sorted.findIndex(i => i.id === itemId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const currentItem = sorted[idx];
    const swapItem = sorted[swapIdx];

    await supabase.from('program_items').update({ position: swapItem.position }).eq('id', currentItem.id);
    await supabase.from('program_items').update({ position: currentItem.position }).eq('id', swapItem.id);
    window.location.reload();
  };

  const handleDeleteItem = async (e, itemId) => {
    e.stopPropagation();
    const { error } = await supabase.from('program_items').delete().eq('id', itemId);
    if (!error) {
      const remaining = classData.program_items.filter(i => i.id !== itemId);
      await calculateAndUpdateProgress(remaining);
      window.location.reload();
    }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignment.title.trim() || !newAssignment.start_date || !newAssignment.due_date) return;

    const { error } = await supabase
      .from('assignments')
      .insert([{
        class_id: id,
        title: newAssignment.title,
        start_date: new Date(newAssignment.start_date).toISOString(),
        due_date: new Date(newAssignment.due_date).toISOString(),
        completed: false
      }]);

    if (!error) {
      setNewAssignment({ title: '', start_date: '', due_date: '' });
      setIsAddingAssignment(false);
      window.location.reload();
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.title.trim() || !newCourse.date || !newCourse.start_time || !newCourse.end_time) return;

    const startDateTime = new Date(`${newCourse.date}T${newCourse.start_time}`).toISOString();
    const endDateTime = new Date(`${newCourse.date}T${newCourse.end_time}`).toISOString();

    const { error } = await supabase
      .from('courses')
      .insert([{
        class_id: id,
        title: newCourse.title,
        start_time: startDateTime,
        end_time: endDateTime
      }]);

    if (!error) {
      setNewCourse({ title: '', date: '', start_time: '', end_time: '' });
      setIsAddingCourse(false);
      window.location.reload();
    }
  };

  const handleDeleteCourse = async (e, courseId) => {
    e.stopPropagation();
    await supabase.from('courses').delete().eq('id', courseId);
    window.location.reload();
  };

  const handleStartEditCourse = (e, course) => {
    e.stopPropagation();
    const start = new Date(course.start_time);
    const end = new Date(course.end_time);
    setEditingCourse({
      id: course.id,
      title: course.title,
      date: start.toISOString().slice(0, 10),
      start_time: start.toTimeString().slice(0, 5),
      end_time: end.toTimeString().slice(0, 5)
    });
  };

  const handleSaveEditCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse.title.trim() || !editingCourse.date || !editingCourse.start_time || !editingCourse.end_time) return;
    const startDT = new Date(`${editingCourse.date}T${editingCourse.start_time}`).toISOString();
    const endDT = new Date(`${editingCourse.date}T${editingCourse.end_time}`).toISOString();
    await supabase.from('courses').update({ title: editingCourse.title, start_time: startDT, end_time: endDT }).eq('id', editingCourse.id);
    setEditingCourse(null);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="page-container">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="bg-white p-2 rounded-full shadow-sm">
            <ChevronLeft size={24} />
          </button>
          <h1>Classe introuvable</h1>
        </header>
      </div>
    );
  }

  const { name, progress, program_items = [], assignments = [], courses = [] } = classData;

  return (
    <div className="page-container">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="bg-white p-2 rounded-full shadow-sm">
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{name}</h1>
        <button className="bg-white p-2 rounded-full shadow-sm">
          <MoreHorizontal size={24} />
        </button>
      </header>

      {/* Progress Card */}
      <div className="mb-8">
        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)' }}></div>
        </div>
        <div className="flex justify-between items-center">
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Progression: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{progress}%</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {program_items.filter(i => i.completed).length} / {program_items.length} éléments
          </div>
        </div>
      </div>

      {/* === DEVOIRS === */}
      <section className="mb-8">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Devoirs</h2>
          {!isAddingAssignment && (
            <button onClick={() => setIsAddingAssignment(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '10px', background: 'var(--primary-light, rgba(99,102,241,0.08))' }}>
              <Plus size={18} /> Ajouter
            </button>
          )}
        </div>
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          {isAddingAssignment && (
            <form onSubmit={handleAddAssignment} style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: 'rgba(248,250,252,0.5)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Titre du devoir</label>
                <input autoFocus type="text" value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})} placeholder="ex: Analyse UX" style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', fontSize: '1rem', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date de début</label>
                  <input required type="date" value={newAssignment.start_date} onChange={(e) => setNewAssignment({...newAssignment, start_date: e.target.value})} style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', fontSize: '0.95rem', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date de rendu</label>
                  <input required type="date" value={newAssignment.due_date} onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})} style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', fontSize: '0.95rem', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => { setIsAddingAssignment(false); setNewAssignment({ title: '', start_date: '', due_date: '' }); }} style={{ flex: 1, background: '#f1f5f9', color: 'var(--text-secondary)', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                <button type="submit" style={{ flex: 1, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>Ajouter</button>
              </div>
            </form>
          )}
          {assignments.length > 0 ? assignments.map((item, index) => {
            const now = new Date();
            const start = item.start_date ? new Date(item.start_date) : now;
            const due = new Date(item.due_date);
            const totalDuration = due.getTime() - start.getTime();
            const elapsed = now.getTime() - start.getTime();
            const assignProgress = totalDuration > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100))) : 100;
            let barColor = 'var(--secondary)';
            if (assignProgress >= 75) barColor = 'var(--error)';
            else if (assignProgress >= 50) barColor = 'var(--accent)';
            const daysLeft = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            return (
              <div key={item.id} onClick={() => navigate(`/assignment/${item.id}`)} style={{ display: 'block', width: '100%', padding: '16px', borderBottom: index === assignments.length -1 ? 'none' : '1px solid #f1f5f9', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.title}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: daysLeft <= 3 ? 'var(--error)' : 'var(--text-secondary)' }}>{daysLeft === 0 ? "Aujourd'hui !" : `J-${daysLeft}`}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                  <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${assignProgress}%`, height: '100%', background: barColor, borderRadius: '3px', transition: 'width 0.3s ease' }}></div>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: '32px', textAlign: 'right' }}>{assignProgress}%</span>
                </div>
              </div>
            );
          }) : !isAddingAssignment && (
            <p className="p-8 text-center text-sm text-slate-400 italic">Aucun devoir pour cette classe</p>
          )}
        </div>
      </section>

      {/* === COURS === */}
      <section className="mb-8">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cours</h2>
          {!isAddingCourse && (
            <button onClick={() => setIsAddingCourse(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '10px', background: 'var(--primary-light, rgba(99,102,241,0.08))' }}>
              <Plus size={18} /> Ajouter
            </button>
          )}
        </div>
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          {isAddingCourse && (
            <form onSubmit={handleAddCourse} style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: 'rgba(248,250,252,0.5)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Intitulé du cours</label>
                <input 
                  autoFocus
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                  placeholder="ex: Introduction au design"
                  style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</label>
                <input 
                  required
                  type="date"
                  value={newCourse.date}
                  onChange={(e) => setNewCourse({...newCourse, date: e.target.value})}
                  style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', fontSize: '0.95rem', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Heure début</label>
                  <input 
                    required
                    type="time"
                    value={newCourse.start_time}
                    onChange={(e) => setNewCourse({...newCourse, start_time: e.target.value})}
                    style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', fontSize: '0.95rem', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Heure fin</label>
                  <input 
                    required
                    type="time"
                    value={newCourse.end_time}
                    onChange={(e) => setNewCourse({...newCourse, end_time: e.target.value})}
                    style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', fontSize: '0.95rem', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button"
                  onClick={() => { setIsAddingCourse(false); setNewCourse({ title: '', date: '', start_time: '', end_time: '' }); }}
                  style={{ flex: 1, background: '#f1f5f9', color: 'var(--text-secondary)', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 1, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Ajouter
                </button>
              </div>
            </form>
          )}
          {courses.length > 0 ? [...courses]
            .sort((a,b) => new Date(a.start_time) - new Date(b.start_time))
            .map((course, index) => {
              const start = new Date(course.start_time);
              const end = new Date(course.end_time);
              const dateStr = start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
              const startStr = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              const endStr = end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={course.id} style={{ borderBottom: index === courses.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                  {editingCourse && editingCourse.id === course.id ? (
                    <form onSubmit={handleSaveEditCourse} style={{ padding: '16px', background: 'rgba(248,250,252,0.5)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Intitulé</label>
                        <input autoFocus type="text" value={editingCourse.title} onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})} style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', fontSize: '0.95rem', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</label>
                        <input required type="date" value={editingCourse.date} onChange={(e) => setEditingCourse({...editingCourse, date: e.target.value})} style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', fontSize: '0.95rem', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Début</label>
                          <input required type="time" value={editingCourse.start_time} onChange={(e) => setEditingCourse({...editingCourse, start_time: e.target.value})} style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', fontSize: '0.95rem', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fin</label>
                          <input required type="time" value={editingCourse.end_time} onChange={(e) => setEditingCourse({...editingCourse, end_time: e.target.value})} style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', fontSize: '0.95rem', outline: 'none' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={() => setEditingCourse(null)} style={{ flex: 1, background: '#f1f5f9', color: 'var(--text-secondary)', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                        <button type="submit" style={{ flex: 1, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Enregistrer</button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px' }}>
                      <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-light, rgba(99,102,241,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={16} color="var(--primary)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {dateStr} · {startStr} – {endStr}
                        </div>
                      </div>
                      <button onClick={(e) => handleStartEditCourse(e, course)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)', opacity: 0.5, flexShrink: 0 }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={(e) => handleDeleteCourse(e, course.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--error)', opacity: 0.4, flexShrink: 0 }}>
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            }) : !isAddingCourse && (
            <p className="p-8 text-center text-sm text-slate-400 italic">Aucun cours planifié</p>
          )}
        </div>
      </section>

      {/* === PROGRAMME === */}
      <section className="mb-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Programme</h2>
          {!isAddingItem && (
            <button onClick={() => setIsAddingItem(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '10px', background: 'var(--primary-light, rgba(99,102,241,0.08))' }}>
              <Plus size={18} /> Ajouter
            </button>
          )}
        </div>
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          {isAddingItem && (
            <form onSubmit={handleAddItem} style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: 'rgba(248,250,252,0.5)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nouvelle étape</label>
              <input autoFocus type="text" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} placeholder="ex: Introduction au chapitre 3" style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', fontSize: '1rem', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => { setIsAddingItem(false); setNewItemTitle(''); }} style={{ flex: 1, background: '#f1f5f9', color: 'var(--text-secondary)', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                <button type="submit" style={{ flex: 1, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>Ajouter</button>
              </div>
            </form>
          )}
          {program_items.length > 0 ? program_items
            .sort((a,b) => a.position - b.position)
            .map((item, index) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderBottom: index === program_items.length -1 ? 'none' : '1px solid #f1f5f9' }}>
              <button onClick={() => handleToggleItem(item.id, item.completed)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}>
                {item.completed ? (<CheckCircle2 size={18} color="var(--secondary)" />) : (<div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #cbd5e1' }}></div>)}
              </button>
              <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, color: item.completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: item.completed ? 'line-through' : 'none' }}>{item.title}</span>
              <button onClick={(e) => handleMoveItem(e, item.id, 'up')} disabled={index === 0} style={{ background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', padding: '4px', opacity: index === 0 ? 0.25 : 0.6, flexShrink: 0 }}><ChevronUp size={16} /></button>
              <button onClick={(e) => handleMoveItem(e, item.id, 'down')} disabled={index === program_items.length - 1} style={{ background: 'none', border: 'none', cursor: index === program_items.length - 1 ? 'default' : 'pointer', padding: '4px', opacity: index === program_items.length - 1 ? 0.25 : 0.6, flexShrink: 0 }}><ChevronDown size={16} /></button>
              <button onClick={(e) => handleDeleteItem(e, item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--error)', opacity: 0.5, flexShrink: 0 }}><X size={16} /></button>
            </div>
          )) : !isAddingItem && (
            <p className="p-8 text-center text-sm text-slate-400 italic">Votre programme est vide pour le moment</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ClassDetail;
