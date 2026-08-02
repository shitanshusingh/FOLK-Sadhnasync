import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Save, Activity } from 'lucide-react';
import { format } from 'date-fns';

const FocusTimer = ({ currentUser }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('japa'); // 'japa' or 'reading'
  const [saveStatus, setSaveStatus] = useState('');
  
  // Track the actual elapsed time in seconds to save it later
  const [elapsedTime, setElapsedTime] = useState(0);

  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // Auto-pause when window loses focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        setIsRunning(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isRunning]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'japa' ? 120 * 60 : 45 * 60);
    setElapsedTime(0);
  };

  const switchMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'japa' ? 120 * 60 : 45 * 60);
    setElapsedTime(0);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (elapsedTime === 0) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let history = JSON.parse(localStorage.getItem(`sadhana_history_${currentUser.email}`) || '[]');
    
    // Find today's entry or create it
    let todayEntry = history.find(h => h.date === todayStr);
    
    if (!todayEntry) {
      todayEntry = {
        date: todayStr,
        attendance: { mangala_arati: '', japa: '', reading: '', class: '', yoga: '' },
        activityTimes: { mangala_arati: '', japa: '', reading: '', class: '', yoga: '' },
        details: { sleepTime: '', wakeupTime: '', totalRounds: '', chantingTime: '', readingDuration: '', absentReason: '' },
        score: 0
      };
      history.push(todayEntry);
    }

    if (!todayEntry.details) {
      todayEntry.details = { sleepTime: '', wakeupTime: '', totalRounds: '', chantingTime: '', readingDuration: '', absentReason: '' };
    }
    if (!todayEntry.activityTimes) {
      todayEntry.activityTimes = { mangala_arati: '', japa: '', reading: '', class: '', yoga: '' };
    }

    const elapsedMinutes = Math.floor(elapsedTime / 60);
    
    if (mode === 'japa') {
      // Rough estimation: 7.5 mins per round
      const rounds = Math.floor(elapsedMinutes / 7.5);
      const currentRounds = parseInt(todayEntry.details.totalRounds) || 0;
      todayEntry.details.totalRounds = (currentRounds + rounds).toString();
      
      // We assume they chanted if they used the timer
      if (!todayEntry.attendance.japa) todayEntry.attendance.japa = 'partial';
      if (currentRounds + rounds >= 16) todayEntry.attendance.japa = 'full';
      
    } else if (mode === 'reading') {
      const currentReading = parseInt(todayEntry.details.readingDuration) || 0;
      todayEntry.details.readingDuration = (currentReading + elapsedMinutes).toString();
      
      if (!todayEntry.attendance.reading) todayEntry.attendance.reading = 'partial';
      if (currentReading + elapsedMinutes >= 30) todayEntry.attendance.reading = 'full';
    }

    // Recalculate score
    let newScore = 0;
    ['mangala_arati', 'japa', 'reading', 'class', 'yoga'].forEach(act => {
      if (todayEntry.attendance[act] === 'full') newScore += 4;
      else if (todayEntry.attendance[act] === 'partial') newScore += 2;
    });
    todayEntry.score = newScore;

    localStorage.setItem(`sadhana_history_${currentUser.email}`, JSON.stringify(history));
    
    setSaveStatus(`Saved ${elapsedMinutes} mins to Dashboard!`);
    setTimeout(() => setSaveStatus(''), 4000);
    resetTimer();

    // Trigger update for other components
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem' }}>
      
      <div className="panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '3rem 2rem' }}>
        <h2 style={{ color: 'var(--primary-amber)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <Activity /> Focus Timer
        </h2>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <button 
            className={`badge ${mode === 'japa' ? 'badge-amber' : 'disabled'}`}
            onClick={() => switchMode('japa')}
            style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer' }}
          >
            Japa Session
          </button>
          <button 
            className={`badge ${mode === 'reading' ? 'badge-emerald' : 'disabled'}`}
            onClick={() => switchMode('reading')}
            style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer' }}
          >
            Reading Session
          </button>
        </div>

        <div style={{ fontSize: '5rem', fontWeight: '800', fontFamily: 'monospace', color: 'var(--text-main)', marginBottom: '2rem', textShadow: '0 0 20px rgba(245,158,11,0.2)' }}>
          {formatTime(timeLeft)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={toggleTimer}
            className="nav-btn btn-primary"
            style={{ width: '60px', height: '60px', borderRadius: '50%', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {isRunning ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '4px' }} />}
          </button>
          
          <button 
            onClick={resetTimer}
            className="nav-btn btn-secondary"
            style={{ width: '60px', height: '60px', borderRadius: '50%', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {elapsedTime > 60 && (
          <div className="animate-fade-in" style={{ marginTop: '1rem' }}>
            <button className="nav-btn btn-emerald" onClick={handleSave} style={{ width: '100%', padding: '0.8rem' }}>
              <Save size={18} /> Save Session to Tracker
            </button>
            {saveStatus && <div style={{ color: 'var(--accent-emerald)', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>{saveStatus}</div>}
          </div>
        )}

      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1.5rem', maxWidth: '350px', textAlign: 'center' }}>
        Note: The timer will automatically pause if you switch away from this tab or minimize the browser. Stay focused!
      </p>
    </div>
  );
};

export default FocusTimer;
