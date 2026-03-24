import { MapPin, Clock, Pencil, BookOpen, X } from 'lucide-react';
import { formatTime } from '../lib/utils';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

const CourseCard = ({ course, onClick, onEditClick }) => {
  const { title, start_time, end_time, room, type, classes } = course;
  const startDate = new Date(start_time);
  const dateStr = isToday(startDate) 
    ? "Aujourd'hui" 
    : format(startDate, 'EEE d MMM', { locale: fr });
  
  const isPassed = new Date(end_time) < new Date();
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className={`card text-white flex flex-col gap-2 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ 
        padding: '10px 16px', 
        marginBottom: '12px', 
        position: 'relative',
        background: classes?.color || 'var(--grad-primary)',
        border: 'none',
        display: 'flex',
        opacity: isPassed ? 0.7 : 1,
        filter: isPassed ? 'grayscale(0.6)' : 'none'
      }}
    >
      <div className="flex items-start justify-between">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-8" style={{ marginBottom: '4px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} opacity={0.9} />
              {isPassed && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={22} color="#ef4444" strokeWidth={3} style={{ opacity: 0.9 }} />
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-3">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                {classes?.name || 'Matière'}
              </h3>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8, textTransform: 'lowercase' }}>
                · {dateStr}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between" style={{ marginTop: '2px' }}>
            <div className="flex items-center gap-2" style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '1rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title}
              </p>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.9 }}>
                · {formatTime(start_time)} - {formatTime(end_time)}
              </span>
            </div>
            {room && (
              <div className="flex items-center gap-1.5" style={{ fontSize: '0.8rem', fontWeight: 700, padding: '2px 8px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', marginLeft: '8px' }}>
                <MapPin size={12} />
                <span>{room}</span>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onEditClick(course); }}
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          style={{ marginTop: '-4px', marginRight: '-4px' }}
        >
          <Pencil size={22} color="white" />
        </button>
      </div>
    </motion.div>
  );
};

export default CourseCard;
