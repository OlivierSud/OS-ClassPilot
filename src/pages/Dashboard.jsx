import { useState } from 'react';
import { isThisWeek, endOfWeek, addWeeks } from 'date-fns';
import { Plus, LogOut, Clock, MapPin, Calendar as CalendarIcon, FileText, BookOpen, Pencil } from 'lucide-react';
import { formatDate, formatTime } from '../lib/utils';
import CourseCard from '../components/CourseCard';
import AssignmentCard from '../components/AssignmentCard';
import CourseForm from '../components/CourseForm';
import AssignmentForm from '../components/AssignmentForm';
import QuickAdd from '../components/QuickAdd';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { useUpcomingCoursesPerClass, useUpcomingAssignments } from '../hooks/useData';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { courses: schedule, loading: loadingSchedule } = useUpcomingCoursesPerClass();
  const { assignments, loading: loadingAssignments } = useUpcomingAssignments();
  const today = new Date();

  const handleInfoClick = (item) => {
    setDetailItem(item);
    setIsEditing(false);
  };

  const handleEditClick = (item) => {
    setDetailItem(item);
    setIsEditing(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="page-container">
      <header className="section-title">
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Bonjour 👋</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
            {formatDate(today)}
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-white p-2 rounded-full shadow-sm hover:bg-red-50 transition-colors"
          title="Déconnexion"
        >
          <LogOut size={22} className="text-error" />
        </button>
      </header>

      <section style={{ marginTop: '24px' }}>
        <h2 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
          Prochains cours
        </h2>
        {schedule.map(course => {
          const startDate = new Date(course.start_time);
          const isWeek = isThisWeek(startDate, { weekStartsOn: 1 });
          const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
          const endOfNextWeek = addWeeks(endOfThisWeek, 1);
          const isAfterNextWeek = startDate > endOfNextWeek;

          return (
            <div key={course.id} style={{
              marginLeft: isAfterNextWeek ? '20px' : '0',
              transition: 'margin 0.3s ease',
              position: 'relative'
            }}>
              {isWeek && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '12px',
                  background: 'var(--accent)',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  zIndex: 2,
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  Cette semaine
                </div>
              )}
              <CourseCard
                course={course}
                onClick={() => handleInfoClick(course)}
                onEditClick={() => handleEditClick(course)}
              />
            </div>
          );
        })}
        {!loadingSchedule && schedule.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
            Aucun cours à venir
          </p>
        )}
      </section>

      <section style={{ marginTop: '32px' }}>
        <h2 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
          Travaux à rendre
        </h2>
        {assignments.map(assignment => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            onClick={() => handleInfoClick(assignment)}
            onEditClick={() => handleEditClick(assignment)}
          />
        ))}
        {!loadingAssignments && assignments.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
            Aucun devoir en attente
          </p>
        )}
      </section>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsAddOpen(true)}
        className="bg-accent text-white flex items-center justify-center gap-2"
        style={{ 
          width: '100%', 
          padding: '16px', 
          borderRadius: 'var(--radius-md)',
          marginTop: '32px',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
        }}
      >
        <Plus size={20} />
        Ajouter
      </motion.button>

      <QuickAdd isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      <Modal 
        isOpen={!!detailItem} 
        onClose={() => { setDetailItem(null); setIsEditing(false); }}
        title={isEditing 
          ? (detailItem?.end_time ? "Modifier le cours" : "Modifier le rendu")
          : (detailItem?.end_time ? "Détails du cours" : "Détails du rendu")
        }
      >
        {detailItem && (
          <div className="flex flex-col gap-6">
            {!isEditing ? (
              <>
                <div className="flex flex-col gap-2 relative">
                  <div className="flex items-center gap-2 text-secondary">
                    <BookOpen size={18} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase' }}>
                      {detailItem.classes?.name}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2, paddingRight: '40px' }}>
                    {detailItem.title}
                  </h2>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="absolute top-0 right-0 p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-primary"
                    title="Modifier"
                  >
                    <Pencil size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {detailItem.start_time && (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                      <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <CalendarIcon size={20} className="text-secondary" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Date</div>
                        <div style={{ fontWeight: 600 }}>{formatDate(new Date(detailItem.start_time))}</div>
                      </div>
                    </div>
                  )}

                  {detailItem.start_time && (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                      <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <Clock size={20} className="text-primary" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Horaire</div>
                        <div style={{ fontWeight: 600 }}>{formatTime(detailItem.start_time)} - {formatTime(detailItem.end_time)}</div>
                      </div>
                    </div>
                  )}

                  {detailItem.due_date && (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                      <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <CalendarIcon size={20} className="text-error" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Échéance</div>
                        <div style={{ fontWeight: 600 }}>{formatDate(new Date(detailItem.due_date))}</div>
                      </div>
                    </div>
                  )}

                  {detailItem.room && (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                      <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <MapPin size={20} className="text-accent" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lieu / Salle</div>
                        <div style={{ fontWeight: 600 }}>Salle {detailItem.room}</div>
                      </div>
                    </div>
                  )}

                  {detailItem.description && (
                    <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <FileText size={16} />
                        <span>Description</span>
                      </div>
                      <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                        {detailItem.description}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              detailItem.end_time ? (
                <CourseForm 
                  initialData={detailItem} 
                  onClose={() => setIsEditing(false)} 
                  onSuccess={() => window.location.reload()} 
                />
              ) : (
                <AssignmentForm 
                  initialData={detailItem} 
                  onClose={() => setIsEditing(false)} 
                  onSuccess={() => window.location.reload()} 
                />
              )
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
