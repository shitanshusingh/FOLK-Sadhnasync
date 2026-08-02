import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import Login from './Login';
import SignUp from './SignUp';
import folkLogo from '../assets/folk_logo.png';

const Auth = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justify: 'center',
      background: '#050914',
      padding: '1.5rem 1rem',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      {/* Dynamic Animated Constant RGB Changing Background Orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        animation: 'rgb-ambient 12s ease-in-out infinite alternate',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '20%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        animation: 'rgb-ambient 12s ease-in-out infinite alternate-reverse',
        pointerEvents: 'none'
      }} />

      <style>{`
        @keyframes rgb-ambient {
          0% { background: radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%); }
          33% { background: radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 70%); }
          66% { background: radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 70%); }
          100% { background: radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 70%); }
        }
        @keyframes rgb-glow-button {
          0% { background-position: 0% 50%; box-shadow: 0 0 20px rgba(245, 158, 11, 0.4); }
          50% { background-position: 100% 50%; box-shadow: 0 0 25px rgba(139, 92, 246, 0.5); }
          100% { background-position: 0% 50%; box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
        }
        .btn-rgb-action {
          background: linear-gradient(90deg, #f59e0b, #ec4899, #8b5cf6, #3b82f6, #f59e0b) !important;
          background-size: 300% 300% !important;
          animation: rgb-glow-button 6s linear infinite !important;
        }
      `}</style>

      {/* COMPACT & SYMMETRICAL CARD */}
      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '375px',
        background: '#0c1322',
        border: '1.2px solid rgba(245, 158, 11, 0.4)',
        borderRadius: '22px',
        padding: '1.5rem 1.6rem 1.8rem 1.6rem',
        boxShadow: '0 0 45px rgba(245, 158, 11, 0.15), 0 20px 60px rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        boxSizing: 'border-box',
        zIndex: 10
      }}>

        {/* 1. Center Glowing FOLK LIFE Logo Circle */}
        <div style={{ textAlign: 'center', marginBottom: '0.9rem' }}>
          <div style={{
            width: '70px', height: '70px', borderRadius: '50%',
            margin: '0 auto 0.6rem auto', overflow: 'hidden',
            border: '2px solid #f59e0b',
            boxShadow: '0 0 25px rgba(245,158,11,0.4)',
            background: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img src={folkLogo} alt="FOLK Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', margin: '0 0 0.2rem 0', textAlign: 'center', color: '#ffffff' }}>
            FOLK <span style={{ color: '#f59e0b' }}>SadhnaSync</span>
          </h1>
          <p style={{ color: '#808ea3', fontSize: '0.78rem', margin: 0, textAlign: 'center' }}>
            ISKCON Bhadaj, Ahmedabad — Sādhana Portal
          </p>
        </div>

        {/* 2. SYMMETRICAL Full-Width Mode Switcher (Login / Sign Up) */}
        <div style={{
          display: 'flex',
          width: '100%',
          gap: '0.5rem',
          background: 'rgba(255,255,255,0.03)',
          padding: '3px',
          borderRadius: '14px',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '1.3rem',
          boxSizing: 'border-box'
        }}>
          <button
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '11px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.88rem',
              transition: 'all 0.25s ease',
              background: mode === 'login' ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : 'transparent',
              color: mode === 'login' ? '#ffffff' : '#94a3b8',
              boxShadow: mode === 'login' ? '0 4px 15px rgba(245,158,11,0.35)' : 'none',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
            }}
          >
            <LogIn size={15} /> Login
          </button>

          <button
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '11px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.88rem',
              transition: 'all 0.25s ease',
              background: mode === 'signup' ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : 'transparent',
              color: mode === 'signup' ? '#ffffff' : '#94a3b8',
              boxShadow: mode === 'signup' ? '0 4px 15px rgba(245,158,11,0.35)' : 'none',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
            }}
          >
            <UserPlus size={15} /> Sign Up
          </button>
        </div>

        {/* 3. Form Container */}
        <div style={{ width: '100%' }}>
          {mode === 'login' ? <Login onAuthSuccess={onAuthSuccess} /> : <SignUp onAuthSuccess={onAuthSuccess} />}
        </div>

      </div>

      {/* 4. Bottom Text Line (Positioned absolutely so card is dead-centered) */}
      <div style={{
        position: 'absolute',
        bottom: '1.2rem',
        left: 0, right: 0,
        textAlign: 'center',
        zIndex: 10
      }}>
        <p style={{ margin: 0, color: '#566579', fontSize: '0.74rem', letterSpacing: '0.02em' }}>
          © 2026 All rights reserved | ISKCON Bhadaj, Ahmedabad | Managed by FOLK
        </p>
      </div>

    </div>
  );
};

export default Auth;
