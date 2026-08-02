import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isBefore, startOfToday } from 'date-fns';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { VAISHNAVA_EVENTS_2026 } from '../constants/calendar2026';

const VaishnavaCalendar = ({ history = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedEvent, setSelectedEvent] = useState(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const isCurrentMonth = currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

  const handleDayClick = (dateStr, isPending, vEvent) => {
    if (vEvent) {
      setSelectedEvent(vEvent);
      return;
    }
    // If it's a pending day in the current month, allow quick navigation to fill it out
    if (isPending && isCurrentMonth) {
      window.dispatchEvent(new CustomEvent('navigate-to-tracker', { detail: { date: dateStr } }));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-amber)' }}>{format(currentDate, 'MMMM yyyy')}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="nav-btn btn-secondary" style={{ padding: '0.4rem' }} onClick={prevMonth}><ChevronLeft size={16} /></button>
          <button className="nav-btn btn-secondary" style={{ padding: '0.4rem' }} onClick={nextMonth}><ChevronRight size={16} /></button>
        </div>
      </div>

      {!isCurrentMonth && (
        <div style={{ padding: '0.5rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={14} /> Month Locked: You cannot edit past months.
        </div>
      )}

      <div className="calendar-days">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            {day}
          </div>
        ))}

        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-cell disabled"></div>
        ))}

        {daysInMonth.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isToday = isSameDay(day, new Date());
          
          const entry = history.find(h => h.date === dateStr);
          const isFilled = !!entry;
          
          const isPast = isBefore(day, startOfToday());
          const isPending = isPast && !isFilled;
          const isMissedLocked = isPending && !isCurrentMonth;

          const vEventData = VAISHNAVA_EVENTS_2026.find(e => e.date === dateStr);

          let cellClass = 'calendar-cell';
          if (isToday) cellClass += ' today';
          if (isFilled) cellClass += ' filled';
          else if (isMissedLocked) cellClass += ' missed';
          else if (isPending) cellClass += ' pending';

          return (
            <div 
              key={day.toString()} 
              className={cellClass}
              onClick={() => handleDayClick(dateStr, isPending, vEventData)}
              style={{ cursor: vEventData ? 'pointer' : (isPending && isCurrentMonth ? 'pointer' : 'default') }}
              title={isPending && isCurrentMonth ? "Click to fill Sādhana" : ""}
            >
              <span>{format(day, 'd')}</span>
              {vEventData && (
                <div className="event-indicator" title={vEventData.title}>
                  <i className="fa-solid fa-star" style={{ color: 'var(--primary-amber)' }}></i>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <div style={{ width: '10px', height: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}></div> Done
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <div style={{ width: '10px', height: '10px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)' }}></div> Missed (Locked)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <div style={{ width: '10px', height: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}></div> Pending (Click to fill)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <i className="fa-solid fa-star" style={{ color: 'var(--primary-amber)', fontSize: '10px' }}></i> Festival
        </div>
      </div>

      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-card animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--primary-amber)', fontSize: '1.4rem' }}>
                {selectedEvent.title}
              </h3>
              <button className="close-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setSelectedEvent(null)}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{ color: 'var(--text-main)', lineHeight: '1.6' }}>
              <p style={{ color: 'var(--accent-blue)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {format(new Date(selectedEvent.date), 'EEEE, MMMM do, yyyy')} — {selectedEvent.description}
              </p>
              <p style={{ textAlign: 'justify' }}>
                {selectedEvent.pastime}
              </p>
            </div>
            <div className="modal-footer">
              <button className="nav-btn btn-primary" onClick={() => setSelectedEvent(null)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaishnavaCalendar;
