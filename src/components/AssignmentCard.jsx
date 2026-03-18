import { Calendar, Info, BookOpen } from 'lucide-react';
import { getTimeRemaining } from '../lib/utils';
import { motion } from 'framer-motion';

const AssignmentCard = ({ assignment, onInfoClick }) => {
  const { title, due_date, classes } = assignment;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="card flex flex-col gap-2"
      style={{ 
        padding: '10px 16px', 
        borderLeft: '4px solid var(--error)', 
        marginBottom: '12px',
        position: 'relative',
        background: 'white'
      }}
    >
      <div className="flex items-start justify-between">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-8" style={{ marginBottom: '4px' }}>
            <BookOpen size={16} className="text-secondary" />
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {classes?.name}
            </h4>
          </div>
          <div className="flex items-center gap-2" style={{ marginTop: '2px' }}>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {title}
            </p>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--error)', background: 'var(--error-light)', padding: '2px 8px', borderRadius: '6px' }}>
              Due {new Date(due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onInfoClick(assignment); }}
          className="p-1.5 hover:bg-slate-50 rounded-full transition-colors"
          style={{ marginTop: '-4px', marginRight: '-4px' }}
        >
          <Info size={22} className="text-secondary" />
        </button>
      </div>
      
      <div className="flex items-center gap-1.5" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, opacity: 0.8 }}>
        <Calendar size={12} />
        <span>{getTimeRemaining(due_date)}</span>
      </div>
    </motion.div>
  );
};

export default AssignmentCard;
