import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Gift, Trophy, CheckCircle, HelpCircle } from 'lucide-react';
import { ChaitanyaCoinIcon, NityanandCoinIcon, PrabhupadaCoinIcon } from './CoinIcons';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to FOLK SadhnaSync! 🌸',
    subtitle: 'Your spiritual journey, beautifully tracked & inspired.',
    icon: <Sparkles size={48} color="#f59e0b" />,
    content: (
      <div style={{ textAlign: 'center', lineHeight: '1.6' }}>
        <p style={{ marginBottom: '1rem', color: '#cbd5e1' }}>
          FOLK SadhnaSync helps you log your daily Sādhana activities with ease — including <strong>Maṅgala Ārati</strong>, <strong>Japa Rounds</strong>, <strong>Book Reading</strong>, and <strong>Śrīmad-Bhāgavatam Class</strong>.
        </p>
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.8rem 1rem', borderRadius: '14px', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '0.88rem', fontWeight: '600' }}>
          ✨ Build unbroken daily streaks and track your spiritual growth!
        </div>
      </div>
    )
  },
  {
    id: 'currencies',
    title: 'Chaitanya & Nityanand Currencies 🪙',
    subtitle: 'Earn sacred reward coins for your daily Sādhana score.',
    icon: (
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <ChaitanyaCoinIcon size={44} />
        <NityanandCoinIcon size={44} />
        <PrabhupadaCoinIcon size={44} />
      </div>
    ),
    content: (
      <div style={{ textAlign: 'left', fontSize: '0.88rem', lineHeight: '1.6', color: '#cbd5e1' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.9rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.8rem' }}>
          🥇 <strong>Chaitanya Gold Coin:</strong> Earned on 20/20 daily score (or 16+ rounds + 60m reading + 60m hearing).<br/>
          🔵 <strong>Nityanand Blue Coin:</strong> Earned on 10+ daily score.<br/>
          ⚡ <strong>Prabhupada Saffron Coin:</strong> Earned on bonus reading, hearing & chanting!
        </div>
        <p style={{ textAlign: 'center', color: '#c4b5fd', fontSize: '0.82rem', margin: 0, fontWeight: '700' }}>
          🔄 Use the built-in Currency Converter in your Wallet to exchange coins anytime!
        </p>
      </div>
    )
  },
  {
    id: 'rewards',
    title: 'Real Life Rewards & Trips ⛺',
    subtitle: 'Redeem your points for real FOLK Yatras & Event entries!',
    icon: <Gift size={48} color="#10b981" />,
    content: (
      <div style={{ textAlign: 'center', lineHeight: '1.6' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem', textAlign: 'left' }}>
          <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '0.8rem', borderRadius: '14px', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24', fontSize: '0.82rem' }}>
            <strong>⛺ 100 Chaitanya Coins</strong><br/>
            Up to 100% Free FOLK Trip!
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.8rem', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', fontSize: '0.82rem' }}>
            <strong>🎟️ 20 Chaitanya Coins</strong><br/>
            Up to 100% Free Event Entry!
          </div>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
          Simply use <strong>"Slide to Redeem Request"</strong> in your Wallet tab to send your request directly to your FOLK Guide for approval.
        </p>
      </div>
    )
  },
  {
    id: 'community',
    title: 'Community Stories & Rankings 📊',
    subtitle: 'Inspire fellow devotees & earn Prestige Titles.',
    icon: <Trophy size={48} color="#a855f7" />,
    content: (
      <div style={{ textAlign: 'center', lineHeight: '1.6' }}>
        <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
          View 3-day Sādhana stories history from your community, check your rank on the Leaderboard, and unlock prestige titles from <strong>Bhakta → Sevaka → Sadhaka → Upasaka → Charanashraya → Prabhupada's Army</strong>!
        </p>
        <div style={{ background: 'rgba(168, 85, 247, 0.12)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#e9d5ff', fontSize: '0.85rem', fontWeight: '700' }}>
          🎯 Track your Prabhupada Book Reading Bucket List in the Goals tab!
        </div>
      </div>
    )
  },
  {
    id: 'finish',
    title: 'You are All Set! 🎉',
    subtitle: 'Ready to embark on your daily spiritual journey.',
    icon: <CheckCircle size={54} color="#10b981" />,
    content: (
      <div style={{ textAlign: 'center', lineHeight: '1.6' }}>
        <p style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Haribol! Welcome to FOLK SadhnaSync.
        </p>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
          You can replay this quick tutorial anytime by tapping the <strong>App Tour (?)</strong> icon in the top bar.
        </p>
      </div>
    )
  }
];

const OnboardingModal = ({ user, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleFinish = () => {
    if (user?.email) {
      localStorage.setItem(`hasSeenOnboarding_${user.email}`, 'true');
    }
    onClose();
  };

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      padding: '1rem',
      background: 'rgba(5, 8, 15, 0.88)',
      backdropFilter: 'blur(10px)'
    }}>
      <div 
        className="animate-fade-in"
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '480px',
          padding: '1.8rem',
          position: 'relative',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(245, 158, 11, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Skip Button (Top Right) */}
        <button
          onClick={handleFinish}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            color: '#94a3b8',
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Skip Tour <X size={14} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'middle' }} />
        </button>

        {/* Step Icon Header */}
        <div style={{
          marginBottom: '1.2rem',
          marginTop: '0.5rem',
          display: 'flex',
          justify: 'center',
          alignItems: 'center'
        }}>
          {step.icon}
        </div>

        {/* Step Title & Subtitle */}
        <h2 style={{ margin: '0 0 0.3rem 0', color: '#f8fafc', fontSize: '1.4rem', fontFamily: 'Outfit, sans-serif', fontWeight: '800', textAlign: 'center' }}>
          {step.title}
        </h2>
        <p style={{ margin: '0 0 1.4rem 0', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
          {step.subtitle}
        </p>

        {/* Step Content */}
        <div style={{ width: '100%', marginBottom: '1.8rem' }}>
          {step.content}
        </div>

        {/* Step Progress Dots & Navigation Controls */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem' }}>
          
          {/* Progress Dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {TOUR_STEPS.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                style={{
                  width: idx === currentStep ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === currentStep ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#f8fafc',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}

            {!isLastStep ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                style={{
                  padding: '0.65rem 1.2rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)'
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                style={{
                  padding: '0.65rem 1.4rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
                }}
              >
                <CheckCircle size={16} /> Get Started!
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default OnboardingModal;
