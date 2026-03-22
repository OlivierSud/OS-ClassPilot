import { 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  FileText,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameDay, 
  startOfDay, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  isSameMonth,
  isToday,
  addMonths,
  subMonths
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSchedule } from '../hooks/useData';
import QuickAdd from '../components/QuickAdd';

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addInitialData, setAddInitialData] = useState(null);

  const range = useMemo(() => ({
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
  }), [currentDate]);

  const { schedule, loading } = useSchedule(range.start, range.end);

  const days = useMemo(() => eachDayOfInterval({ start: range.start, end: range.end }), [range]);

  const handlePrev = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNext = () => setCurrentDate(addMonths(currentDate, 1));

  const handleCellClick = (day) => {
    setSelectedDate(day);
  };

  const selectedDayEvents = useMemo(() => {
    return schedule
      .filter(e => isSameDay(new Date(e.start_time || e.due_date), selectedDate))
      .sort((a, b) => new Date(a.start_time || a.due_date) - new Date(b.start_time || b.due_date));
  }, [schedule, selectedDate]);

  const dayHeaders = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Map class color (gradient vars or inline gradients) to a solid color for dots
  const getDotColor = (colorStr) => {
    if (!colorStr) return '#6366f1';
    const map = {
      'var(--grad-primary)': '#6366f1',
      'var(--grad-secondary)': '#f97316',
      'var(--grad-accent)': '#8b5cf6',
      'var(--grad-error)': '#ef4444',
    };
    if (map[colorStr]) return map[colorStr];
    // Extract first hex color from inline gradient
    const match = colorStr.match(/#[a-fA-F0-9]{6}/);
    if (match) return match[0];
    return '#6366f1';
  };

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      {/* Navigation header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, textTransform: 'capitalize' }}>
          {format(currentDate, 'MMMM yyyy', { locale: fr })}
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handlePrev} style={{ padding: '8px', background: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer' }}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={handleNext} style={{ padding: '8px', background: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* Calendar grid */}
      <div className="card" style={{ padding: '12px', marginBottom: '20px' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', marginBottom: '4px' }}>
          {dayHeaders.map((day, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '4px 0' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {days.map(day => {
            const dayEvents = schedule.filter(e => isSameDay(new Date(e.start_time || e.due_date), day));
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = isSameDay(day, selectedDate);
            const today = isToday(day);

            return (
              <div 
                key={day.toString()} 
                onClick={() => handleCellClick(day)}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  minHeight: '56px',
                  padding: '4px 2px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: isSelected 
                    ? 'var(--primary)' 
                    : today 
                      ? 'rgba(99,102,241,0.08)' 
                      : !isCurrentMonth ? 'rgba(241,245,249,0.5)' : 'transparent',
                  transition: 'all 0.2s ease',
                  border: isSelected ? 'none' : today ? '1px solid rgba(99,102,241,0.2)' : 'none'
                }}
              >
                <div style={{ 
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.95rem', 
                  fontWeight: today || isSelected ? 800 : 500,
                  color: isSelected ? 'white' : !isCurrentMonth ? '#94a3b8' : today ? 'var(--primary)' : 'var(--text-primary)',
                  marginBottom: '1px'
                }}>
                  {format(day, 'd')}
                </div>
                {/* Event indicators container */}
                <div style={{ 
                  display: 'flex', 
                  gap: '4px', 
                  height: '24px', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexWrap: 'wrap',
                  width: '100%'
                }}>
                  {dayEvents.slice(0, 3).map((event, i) => {
                    const isCourse = event.eventType === 'course';
                    const color = isSelected ? 'rgba(255,255,255,0.95)' : getDotColor(event.color);
                    
                    if (isCourse) {
                      return (
                        <div key={i} style={{ 
                          width: '16px', 
                          height: '5px', 
                          borderRadius: '1.5px',
                          background: color,
                          boxShadow: isSelected ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'
                        }} />
                      );
                    } else {
                      return (
                        <div key={i} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '1.5px'
                        }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
                          <AlertCircle size={13} color={color} strokeWidth={2.5} />
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'capitalize', margin: 0 }}>
            {isToday(selectedDate) 
              ? "Aujourd'hui" 
              : format(selectedDate, 'EEEE d MMMM', { locale: fr })
            }
          </h2>
          <button 
            onClick={() => {
              const baseData = {
                start_time: format(selectedDate, "yyyy-MM-dd'T'12:00"),
                end_time: format(selectedDate, "yyyy-MM-dd'T'13:00"),
                due_date: format(selectedDate, "yyyy-MM-dd"),
                start_date: format(selectedDate, "yyyy-MM-dd")
              };
              setAddInitialData(baseData);
              setIsAddOpen(true);
            }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', 
              color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', 
              background: 'var(--primary-light, rgba(99,102,241,0.1))', 
              border: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: '12px' 
            }}
          >
            <Plus size={18} /> Ajouter
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedDate.toString()}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {selectedDayEvents.length > 0 ? selectedDayEvents.map(event => {
              const isCourse = event.eventType === 'course';
              const startTime = new Date(event.start_time);
              const endTime = event.end_time ? new Date(event.end_time) : null;
              const timeStr = isCourse && endTime
                ? `${format(startTime, 'HH:mm')} – ${format(endTime, 'HH:mm')}`
                : format(startTime, 'HH:mm');

              const isPassed = isCourse && endTime && endTime < new Date();

              return (
                <div 
                  key={event.id}
                  onClick={() => !isCourse && navigate(`/assignment/${event.id}`)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    cursor: !isCourse ? 'pointer' : 'default',
                    borderLeft: `4px solid ${getDotColor(event.color)}`,
                    opacity: isPassed ? 0.6 : 1,
                    filter: isPassed ? 'grayscale(0.8)' : 'none'
                  }}
                >
                  <div style={{ 
                    flexShrink: 0, width: '40px', height: '40px', borderRadius: '12px', 
                    background: event.color || 'var(--grad-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative'
                  }}>
                    {isCourse ? (
                      <>
                        <Clock size={18} color="white" />
                        {isPassed && (
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={28} color="#ef4444" strokeWidth={3} style={{ opacity: 0.9 }} />
                          </div>
                        )}
                      </>
                    ) : <FileText size={18} color="white" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {isCourse ? '🕐' : '📄'} {event.classes?.name || ''} · {timeStr}
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    padding: '6px 10px', 
                    borderRadius: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: isCourse ? 'var(--primary)' : 'var(--error)',
                    color: 'white',
                    flexShrink: 0,
                    boxShadow: isCourse 
                      ? '0 4px 10px rgba(59, 130, 246, 0.2)' 
                      : '0 4px 10px rgba(239, 68, 68, 0.2)'
                  }}>
                    {isCourse ? 'Cours' : 'Rendu'}
                  </span>
                </div>
              );
            }) : (
              <div style={{ 
                textAlign: 'center', padding: '32px 20px', color: 'var(--text-secondary)',
                background: 'white', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                fontSize: '0.9rem'
              }}>
                Rien de prévu ce jour
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <QuickAdd 
        isOpen={isAddOpen} 
        onClose={() => {
          setIsAddOpen(false);
          // Reload to show new items
          window.location.reload();
        }} 
        initialData={addInitialData}
      />
    </div>
  );
};

export default Calendar;
