import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Flame, CheckCircle, Activity, BookOpen, Heart, ThumbsUp, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const StoryViewer = ({ feedUser, onClose, currentUser }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  
  // Get up to 3 days of entries, oldest to newest
  const entries = feedUser.entries || [];
  const currentEntry = entries[currentIndex];
  
  const timerRef = useRef(null);
  
  // Reactions state
  const reactionKey = `sadhana_story_reactions_${currentEntry?.date}_${feedUser.user.email}`;
  const [reactions, setReactions] = useState(() => JSON.parse(localStorage.getItem(reactionKey) || '[]'));
  
  const STYD_DURATION = 10000; // 10 seconds per story

  useEffect(() => {
    // Reset progress when entry changes
    setProgress(0);
    if (currentEntry) {
        setReactions(JSON.parse(localStorage.getItem(`sadhana_story_reactions_${currentEntry.date}_${feedUser.user.email}`) || '[]'));
    }
  }, [currentIndex, currentEntry, feedUser.user.email]);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    
    const interval = 50; // update every 50ms
    const step = (interval / STYD_DURATION) * 100;
    
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          handleNext();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, entries.length]);

  const handleNext = () => {
    if (currentIndex < entries.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  const addReaction = (emoji) => {
    const newReaction = { emoji, from: currentUser.name };
    const updated = [...reactions, newReaction];
    setReactions(updated);
    localStorage.setItem(reactionKey, JSON.stringify(updated));
    setShowReactions(true);
    setTimeout(() => setShowReactions(false), 2000); // Floating effect
  };

  if (!currentEntry) return null;
  const attendedMA = currentEntry.activityTimes?.mangala_arati ? 'Yes' : 'No';

  return createPortal(
    <div 
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column' }}
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Progress Bars */}
      <div style={{ display: 'flex', gap: '4px', padding: '10px 10px 5px 10px' }}>
        {entries.map((_, i) => (
          <div key={i} style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              background: '#fff', 
              width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
              transition: 'width 0.05s linear'
            }} />
          </div>
        ))}
      </div>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {feedUser.user.photo ? <img src={feedUser.user.photo} alt="Avatar" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{color: '#fff', fontWeight: 'bold'}}>{feedUser.user.name.substring(0,2).toUpperCase()}</span>}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{feedUser.user.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{format(parseISO(currentEntry.date), 'do MMM')}</div>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ background: 'none', border: 'none', color: '#fff', padding: '5px', cursor: 'pointer' }}>
          <X size={24} />
        </button>
      </div>

      {/* Navigation Zones (Left 30% = prev, Right 70% = next) */}
      <div style={{ position: 'absolute', inset: 0, top: '60px', bottom: '80px', display: 'flex' }}>
        <div style={{ width: '30%' }} onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
        <div style={{ width: '70%' }} onClick={(e) => { e.stopPropagation(); handleNext(); }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '24px', width: '100%', maxWidth: '340px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-amber)', fontSize: '1.4rem' }}>Sādhana Complete! 🎊</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}><Clock size={14} style={{ display: 'inline', marginRight: '6px' }}/>Wake Up</span>
            <span style={{ fontWeight: '800', color: '#c4b5fd', fontSize: '1.1rem' }}>{currentEntry.details?.wakeupTime || '--'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}><Flame size={14} style={{ display: 'inline', marginRight: '6px' }}/>Mangala Arati</span>
            <span style={{ fontWeight: '800', color: attendedMA === 'Yes' ? '#34d399' : '#fb7185', fontSize: '1.1rem' }}>{attendedMA}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}><CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }}/>Total Chanting</span>
            <span style={{ fontWeight: '800', color: '#34d399', fontSize: '1.1rem' }}>{currentEntry.details?.totalRounds || 0} rds</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}><BookOpen size={14} style={{ display: 'inline', marginRight: '6px' }}/>Reading</span>
            <span style={{ fontWeight: '800', color: '#60a5fa', fontSize: '1.1rem' }}>{currentEntry.details?.readingDuration || 0}m</span>
          </div>
        </div>
      </div>
      
      {/* Floating Reactions overlay */}
      {showReactions && (
        <div style={{ position: 'absolute', bottom: '100px', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', animation: 'floatUp 2s ease-out forwards' }}>
          <div style={{ fontSize: '3rem' }}>{reactions[reactions.length - 1]?.emoji}</div>
        </div>
      )}

      {/* Footer / Reaction Bar */}
      <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          {/* List who reacted */}
          {reactions.slice(-3).map((r, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '12px', fontSize: '0.75rem', color: '#fff' }}>
              {r.emoji} {r.from.split(' ')[0]}
            </div>
          ))}
          {reactions.length > 3 && <div style={{ color: '#fff', fontSize: '0.75rem' }}>+{reactions.length - 3}</div>}
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={(e) => { e.stopPropagation(); addReaction('🔥'); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', transition: 'transform 0.1s' }}>🔥</button>
          <button onClick={(e) => { e.stopPropagation(); addReaction('🙏'); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', transition: 'transform 0.1s' }}>🙏</button>
          <button onClick={(e) => { e.stopPropagation(); addReaction('❤️'); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', transition: 'transform 0.1s' }}>❤️</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StoryViewer;
