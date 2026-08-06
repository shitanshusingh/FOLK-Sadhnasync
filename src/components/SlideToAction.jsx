import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

const SlideToAction = ({ text, onAction, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const sliderRef = useRef(null);

  const handleStart = (e) => {
    if (disabled || isCompleted) return;
    setIsDragging(true);
  };

  const handleMove = (e) => {
    if (!isDragging || !sliderRef.current || isCompleted || disabled) return;
    
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const dragX = Math.max(0, clientX - sliderRect.left);
    
    // The thumb is roughly 50px wide, so max drag is width - 50
    const maxDrag = sliderRect.width - 50;
    const progress = Math.min(1, dragX / maxDrag);
    
    setDragProgress(progress);
    
    if (progress >= 1) {
      setIsCompleted(true);
      setIsDragging(false);
      onAction();
    }
  };

  const handleEnd = () => {
    if (isCompleted || disabled) return;
    setIsDragging(false);
    setDragProgress(0); // Snap back
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    } else {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const progressPct = dragProgress * 100;
  
  return (
    <div 
      ref={sliderRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '56px',
        background: isCompleted ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.05)',
        border: '1px solid ' + (isCompleted ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.1)'),
        borderRadius: '28px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.3s'
      }}
    >
      <div 
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `calc(50px + ${progressPct}% - ${progressPct * 0.5}px)`,
          background: 'linear-gradient(90deg, var(--primary-amber) 0%, #fbbf24 100%)',
          borderRadius: '28px',
          opacity: isCompleted ? 0 : 0.2
        }}
      />
      
      <span style={{
        position: 'relative',
        zIndex: 1,
        color: isCompleted ? '#fff' : 'var(--text-muted)',
        fontWeight: '700',
        fontSize: '0.95rem',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        {isCompleted ? 'Requested!' : text}
      </span>

      {!isCompleted && (
        <div 
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          style={{
            position: 'absolute',
            left: `calc(${progressPct}% - ${progressPct * 0.5}px)`,
            top: '3px',
            bottom: '3px',
            width: '50px',
            background: 'linear-gradient(135deg, var(--primary-amber), #ea580c)',
            borderRadius: '25px',
            cursor: disabled ? 'not-allowed' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            zIndex: 2,
            transition: isDragging ? 'none' : 'left 0.3s ease'
          }}
        >
          <ChevronRight size={24} color="#fff" />
        </div>
      )}
    </div>
  );
};

export default SlideToAction;
