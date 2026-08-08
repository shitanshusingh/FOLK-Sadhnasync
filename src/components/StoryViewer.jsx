import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Flame, CheckCircle, Activity, BookOpen, Heart, ThumbsUp, Star, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cloudSaveReaction } from '../services/firebase';

const StoryViewer = ({ feedUser, onClose, currentUser }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  
  const entries = feedUser.entries || [];
  const currentEntry = entries[currentIndex];
  
  const timerRef = useRef(null);
  
  const reactionKey = `sadhana_story_reactions_${currentEntry?.date}_${feedUser.user.email}`;
  const [reactions, setReactions] = useState(() => JSON.parse(localStorage.getItem(reactionKey) || '[]'));
  
  const STYD_DURATION = 10000; // 10 seconds per story

  useEffect(() => {
    setProgress(0);
    if (currentEntry) {
      const saved = JSON.parse(localStorage.getItem(`sadhana_story_reactions_${currentEntry.date}_${feedUser.user.email}`) || '[]');
      setReactions(saved);
    }
  }, [currentIndex, currentEntry, feedUser.user.email]);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    
    const interval = 50;
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
    cloudSaveReaction(reactionKey, updated);
    setShowReactions(true);
    setTimeout(() => setShowReactions(false), 2000);

    if (currentUser.email !== feedUser.user.email) {
      const notifs = JSON.parse(localStorage.getItem('sadhana_notifications_array') || '[]');
      const senderName = currentUser.name.split(' ')[0];
      // Prevent spamming multiple notifications from the same person
      if (!notifs.find(n => n.type === 'reaction' && n.targetEmail === feedUser.user.email && n.message.includes(senderName))) {
        notifs.push({
          id: Date.now().toString(),
          type: 'reaction',
          targetEmail: feedUser.user.email,
          title: 'New Story Reaction 🔥',
          message: `${senderName} reacted to your Sādhana story with ${emoji}`,
          seen: false
        });
        localStorage.setItem('sadhana_notifications_array', JSON.stringify(notifs));
      }
    }
  };

  if (!currentEntry) return null;
  const attendedMA = currentEntry.activityTimes?.mangala_arati ? 'Yes' : 'No';
  const details = currentEntry.details || {};

  return createPortal(
    <div 
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column' }}
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

      {/* Navigation Touch Zones */}
      <div style={{ position: 'absolute', inset: 0, top: '60px', bottom: '80px', display: 'flex' }}>
        <div style={{ width: '30%' }} onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
        <div style={{ width: '70%' }} onClick={(e) => { e.stopPropagation(); handleNext(); }} />
      </div>

      {/* Story Content Cards */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(16px)', borderRadius: '24px', width: '100%', maxWidth: '360px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', border: '1px solid rgba(245, 158, 11, 0.35)', boxShadow: '0 15px 35px rgba(0,0,0,0.6)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '0.4rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-amber)', fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>Sādhana Story 🌸</h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Score: {currentEntry.score}/{currentEntry.maxScore || 20} pts</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.82rem' }}>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '12px' }}>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>Wake Up</span>
              <strong style={{ color: '#c4b5fd', fontSize: '0.95rem' }}>{details.wakeupTime || '--'}</strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '12px' }}>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>Mangala Arati</span>
              <strong style={{ color: attendedMA === 'Yes' ? '#34d399' : '#fb7185', fontSize: '0.95rem' }}>{attendedMA}</strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '12px' }}>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>Chanting</span>
              <strong style={{ color: '#34d399', fontSize: '0.95rem' }}>{details.totalRounds || 0} rounds</strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '12px' }}>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>Reading</span>
              <strong style={{ color: '#60a5fa', fontSize: '0.95rem' }}>{details.readingDuration || 0} mins</strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '12px' }}>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>Hearing</span>
              <strong style={{ color: '#e879f9', fontSize: '0.95rem' }}>{details.hearingDuration || 0} mins</strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '12px' }}>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>Sleep Time</span>
              <strong style={{ color: '#c4b5fd', fontSize: '0.95rem' }}>{details.sleepTime || '--'}</strong>
            </div>

          </div>

          {details.bookName && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem 0.8rem', borderRadius: '10px', fontSize: '0.78rem', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              📖 Book: {details.bookName}
            </div>
          )}

          {details.sevaName && (
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '0.5rem 0.8rem', borderRadius: '10px', fontSize: '0.78rem', color: '#c4b5fd', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              ✨ Seva: {details.sevaName} ({details.sevaDurationMins || 0}m)
            </div>
          )}

        </div>
      </div>
      
      {/* Floating Reactions Overlay */}
      {showReactions && (
        <div style={{ position: 'absolute', bottom: '100px', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: '3rem' }}>{reactions[reactions.length - 1]?.emoji}</div>
        </div>
      )}

      {/* Footer / Reaction Bar */}
      <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {reactions.slice(-3).map((r, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '12px', fontSize: '0.75rem', color: '#fff' }}>
              {r.emoji} {r.from?.split(' ')[0]}
            </div>
          ))}
          {reactions.length > 3 && <div style={{ color: '#fff', fontSize: '0.75rem' }}>+{reactions.length - 3}</div>}
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={(e) => { e.stopPropagation(); addReaction('🔥'); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>🔥</button>
          <button onClick={(e) => { e.stopPropagation(); addReaction('🙏'); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>🙏</button>
          <button onClick={(e) => { e.stopPropagation(); addReaction('❤️'); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>❤️</button>
          <button onClick={(e) => { e.stopPropagation(); addReaction('🙌'); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>🙌</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StoryViewer;
