import { cloudSaveRedemption, cloudFetchAllRedemptions } from '../services/firebase';
import { ChaitanyaCoinIcon, NityanandCoinIcon, PrabhupadaCoinIcon } from './CoinIcons';
import React, { useState, useEffect, useMemo } from 'react';
import { Award, Star, Zap, Clock, CheckCircle, XCircle, Shield, Sparkles, Gift, Info } from 'lucide-react';
import { calculateUserCurrencies, getPrestigeTitle } from '../utils/currency';
import { ACHIEVEMENTS, calculateAchievements } from '../utils/achievements';

const Wallet = ({ currentUser }) => {
  const [walletData, setWalletData] = useState({ lifetime: {}, balance: {} });
  const [redemptions, setRedemptions] = useState([]);
  
  // Redeem state
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemType, setRedeemType] = useState('Chaitanya');
  const [redeemCategory, setRedeemCategory] = useState('Trip Discount');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [showRulesInfo, setShowRulesInfo] = useState(false);

  useEffect(() => {
    // Clear notification dot
    localStorage.setItem('hasNewCurrency', 'false');
    window.dispatchEvent(new Event('storage'));
    
    const loadRedemptions = async () => {
      const allR = await cloudFetchAllRedemptions();
      setRedemptions(allR.filter(x => x.email === currentUser.email).sort((a,b) => new Date(b.date) - new Date(a.date)));
      setWalletData(calculateUserCurrencies(currentUser.email));
    };
    loadRedemptions();
  }, [currentUser.email]);

  const earnedBadges = useMemo(() => calculateAchievements(currentUser.email), [currentUser.email]);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate([40, 30, 40]);
      } catch (e) {
        // ignore
      }
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    const amount = Number(redeemAmount);
    if (!amount || amount <= 0) return;
    
    if (redeemType === 'Chaitanya' && amount > (walletData.balance.chaitanya || 0)) {
      alert("Insufficient Chaitanya balance!");
      return;
    }
    if (redeemType === 'Nityanand' && amount > (walletData.balance.nityanand || 0)) {
      alert("Insufficient Nityanand balance!");
      return;
    }
    if (redeemType === 'Prabhupada' && amount > (walletData.balance.prabhupada || 0)) {
      alert("Insufficient Prabhupada balance!");
      return;
    }

    triggerHaptic();
    setIsSubmitting(true);

    const newRequest = {
      id: Date.now().toString(),
      email: currentUser.email,
      name: currentUser.name,
      date: new Date().toISOString(),
      type: redeemType,
      amount: amount,
      category: redeemCategory,
      status: 'pending',
      chaitanyaCost: redeemType === 'Chaitanya' ? amount : 0,
      nityanandCost: redeemType === 'Nityanand' ? amount : 0,
      prabhupadaCost: redeemType === 'Prabhupada' ? amount : 0,
      remarks: ''
    };

    setTimeout(async () => {
      await cloudSaveRedemption(newRequest);
      const r = JSON.parse(localStorage.getItem('currency_redemptions') || '[]');
      setRedemptions(r.filter(x => x.email === currentUser.email).sort((a,b) => new Date(b.date) - new Date(a.date)));
      
      setWalletData(calculateUserCurrencies(currentUser.email));
      setRedeemAmount('');
      setIsSubmitting(false);
      setSubmittedSuccess(true);

      // Auto-reset success state after 2.5 seconds
      setTimeout(() => {
        setSubmittedSuccess(false);
      }, 2500);
    }, 600);
  };

  const title = getPrestigeTitle(walletData.lifetime.chaitanya || 0);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '5rem', maxWidth: '850px', margin: '0 auto' }}>
      
      {/* 🌟 SLEEK PRESTIGE TITLE HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        padding: '1.2rem 1.5rem',
        marginBottom: '1.2rem',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
            color: '#fff'
          }}>
            <Award size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>
              FOLK Boy Status
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', fontFamily: 'Outfit, sans-serif', background: 'linear-gradient(135deg, #fff, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {title || 'FOLK Boy'}
            </div>
          </div>
        </div>

        <button 
          onClick={() => { triggerHaptic(); setShowRulesInfo(!showRulesInfo); }}
          style={{
            background: showRulesInfo ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#f59e0b',
            borderRadius: '12px',
            padding: '0.5rem 0.9rem',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s'
          }}
        >
          <Info size={16} /> {showRulesInfo ? 'Hide Rules' : 'Point Rules'}
        </button>
      </div>

      {/* 💡 EXPANDABLE POINT SYSTEM EXPLANATION CARD */}
      {showRulesInfo && (
        <div className="animate-fade-in" style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '18px',
          padding: '1.2rem',
          marginBottom: '1.2rem',
          boxShadow: '0 12px 25px rgba(0,0,0,0.5)'
        }}>
          <h4 style={{ color: '#f59e0b', margin: '0 0 0.8rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} /> How Chaitanya Currency Works
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
            <div style={{ background: 'rgba(251, 191, 36, 0.08)', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
              <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '0.2rem' }}>🥇 Chaitanya Coin (Gold - "गौर")</strong>
              Earn 1 Gold Coin on 20/20 daily score. <br/>
              • <strong>100 Coins</strong> = Up to 100% Free Trip<br/>
              • <strong>20 Coins</strong> = Up to 100% Free FOLK Event Entry<br/>
              <span style={{ color: '#fef08a', fontSize: '0.75rem', marginTop: '0.3rem', display: 'block' }}>
                ⚡ <em>Missed Morning Sadhana?</em> Complete 16+ rounds, 60+ mins reading & 60+ mins hearing to still recover 1 Gold Coin!
              </span>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '0.2rem' }}>🔵 Nityanand Coin (Blue)</strong>
              Earn 1 Blue Coin on 10+ Sādhana score.<br/>
              • <strong>3 Nityanand Coins</strong> = 1 Chaitanya Gold Coin!
            </div>
            <div style={{ background: 'rgba(234, 88, 12, 0.08)', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(234, 88, 12, 0.2)' }}>
              <strong style={{ color: '#f97316', display: 'block', marginBottom: '0.2rem' }}>⚡ Prabhupada Coin (Bonus)</strong>
              Earned on extra reading & hearing bonus activities!
            </div>
          </div>
        </div>
      )}

      {/* 💰 DYNAMIC GLASSMORPHIC CURRENCY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginBottom: '1.2rem' }}>
        
        {/* Chaitanya Gold */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(217, 119, 6, 0.05))',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          borderRadius: '18px',
          padding: '1rem 0.8rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{ margin: '0 auto 0.4rem', display: 'flex', justifyContent: 'center' }}>
            <ChaitanyaCoinIcon size={42} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fbbf24', fontFamily: 'Outfit, sans-serif' }}>
            {walletData.balance.chaitanya || 0}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Chaitanya
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.3rem' }}>
            Total: {walletData.lifetime.chaitanya || 0}
          </div>
        </div>

        {/* Nityanand Blue */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.05))',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          borderRadius: '18px',
          padding: '1rem 0.8rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{ margin: '0 auto 0.4rem', display: 'flex', justifyContent: 'center' }}>
            <NityanandCoinIcon size={42} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#60a5fa', fontFamily: 'Outfit, sans-serif' }}>
            {walletData.balance.nityanand || 0}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Nityanand
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.3rem' }}>
            Total: {walletData.lifetime.nityanand || 0}
          </div>
        </div>

        {/* Prabhupada Saffron */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.15), rgba(194, 65, 12, 0.05))',
          border: '1px solid rgba(234, 88, 12, 0.35)',
          borderRadius: '18px',
          padding: '1rem 0.8rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{ margin: '0 auto 0.4rem', display: 'flex', justifyContent: 'center' }}>
            <PrabhupadaCoinIcon size={42} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#f97316', fontFamily: 'Outfit, sans-serif' }}>
            {walletData.balance.prabhupada || 0}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#ffedd5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Prabhupada
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.3rem' }}>
            Total: {walletData.lifetime.prabhupada || 0}
          </div>
        </div>

      </div>

      {/* 🛡️ COMPACT HORIZONTAL ACHIEVEMENTS STRIP (Occupies minimal space as requested) */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        padding: '0.9rem 1.2rem',
        marginBottom: '1.2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={16} /> Your Achievements ({earnedBadges.length}/{ACHIEVEMENTS.length})
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
          {ACHIEVEMENTS.map(badge => {
            const isEarned = earnedBadges.includes(badge.id);
            return (
              <div 
                key={badge.id}
                title={`${badge.name}: ${badge.description}`}
                style={{
                  flex: '0 0 auto',
                  background: isEarned ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: isEarned ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '0.45rem 0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: isEarned ? 1 : 0.45,
                  filter: isEarned ? 'none' : 'grayscale(100%)',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{badge.icon}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: isEarned ? '#e9d5ff' : '#64748b', whiteSpace: 'nowrap' }}>
                  {badge.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🎁 AESTHETIC REDEMPTION STORE (No white blank selects, curved aesthetic corners) */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '1.4rem',
        marginBottom: '1.2rem',
        boxShadow: '0 15px 35px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gift size={20} color="#f59e0b" /> Redeem Rewards
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            Instant FOLK Request
          </span>
        </div>

        {/* Benefits summary pills */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
          <div style={{ fontSize: '0.75rem', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.25)', padding: '0.35rem 0.75rem', borderRadius: '10px' }}>
            🌟 100 Chaitanya = 100% Free Trip
          </div>
          <div style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '0.35rem 0.75rem', borderRadius: '10px' }}>
            🎟️ 20 Chaitanya = 100% Free Event
          </div>
        </div>

        <form onSubmit={handleRedeem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            
            {/* Custom dark-styled select for currency type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', marginBottom: '0.3rem' }}>
                Select Coin
              </label>
              <select
                value={redeemType}
                onChange={e => { triggerHaptic(); setRedeemType(e.target.value); }}
                style={{
                  width: '100%',
                  background: '#0b1120',
                  color: redeemType === 'Chaitanya' ? '#fbbf24' : redeemType === 'Nityanand' ? '#60a5fa' : '#f97316',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  padding: '0.75rem 0.9rem',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="Chaitanya" style={{ background: '#0f172a', color: '#fbbf24' }}>🥇 Chaitanya (Gold)</option>
                <option value="Nityanand" style={{ background: '#0f172a', color: '#60a5fa' }}>🔵 Nityanand (Blue)</option>
                <option value="Prabhupada" style={{ background: '#0f172a', color: '#f97316' }}>⚡ Prabhupada (Bonus)</option>
              </select>
            </div>

            {/* Amount Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', marginBottom: '0.3rem' }}>
                Coins Amount
              </label>
              <input 
                type="number" 
                min="1"
                placeholder="e.g. 10" 
                value={redeemAmount}
                onChange={e => setRedeemAmount(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0b1120',
                  color: '#f8fafc',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  padding: '0.75rem 0.9rem',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  outline: 'none'
                }}
              />
            </div>

          </div>

          {/* Reward Category dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', marginBottom: '0.3rem' }}>
              Redemption Reward Category
            </label>
            <select 
              value={redeemCategory}
              onChange={e => { triggerHaptic(); setRedeemCategory(e.target.value); }}
              style={{
                width: '100%',
                background: '#0b1120',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '14px',
                padding: '0.75rem 0.9rem',
                fontSize: '0.88rem',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Trip Discount" style={{ background: '#0f172a' }}>⛺ FOLK Yatra / Trip Discount</option>
              <option value="Event Entry" style={{ background: '#0f172a' }}>🎟️ FOLK Youth Event Pass</option>
              <option value="Books/Merch" style={{ background: '#0f172a' }}>📚 Srila Prabhupada Books / Merch</option>
              <option value="Other" style={{ background: '#0f172a' }}>✨ Custom Reward (Guide Approval)</option>
            </select>
          </div>

          {/* 🚀 ANIMATED DYNAMIC SUBMIT BUTTON (resets from REQUESTED after 2.5s) */}
          <button
            type="submit"
            disabled={!redeemAmount || Number(redeemAmount) <= 0 || isSubmitting}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.95rem',
              borderRadius: '14px',
              border: 'none',
              background: submittedSuccess
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : (!redeemAmount || Number(redeemAmount) <= 0)
                ? 'rgba(255,255,255,0.08)'
                : 'linear-gradient(135deg, #f59e0b, #ea580c)',
              color: submittedSuccess ? '#fff' : (!redeemAmount || Number(redeemAmount) <= 0) ? '#64748b' : '#fff',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: (!redeemAmount || Number(redeemAmount) <= 0 || isSubmitting) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: submittedSuccess 
                ? '0 0 20px rgba(16, 185, 129, 0.4)' 
                : (!redeemAmount || Number(redeemAmount) <= 0) 
                ? 'none' 
                : '0 6px 20px rgba(245, 158, 11, 0.35)'
            }}
          >
            {isSubmitting ? (
              <span>Submitting Request...</span>
            ) : submittedSuccess ? (
              <>
                <CheckCircle size={20} /> Request Submitted to Guide!
              </>
            ) : (
              <>
                <Gift size={20} /> Submit Redemption Request
              </>
            )}
          </button>
        </form>
      </div>

      {/* 📜 TRANSACTION HISTORY LEDGER */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '1.4rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="#94a3b8" /> Request History & Status
        </h3>

        {redemptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>
            No redemptions requested yet. Fill out the form above to redeem your earned coins!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {redemptions.map(r => (
              <div 
                key={r.id} 
                style={{
                  background: 'rgba(11, 17, 30, 0.8)',
                  padding: '1rem 1.1rem',
                  borderRadius: '14px',
                  borderLeft: `4px solid ${r.status === 'approved' ? '#10b981' : r.status === 'rejected' ? '#ef4444' : '#f59e0b'}`,
                  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.04)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#f8fafc' }}>
                      {r.amount} {r.type} Coin{r.amount > 1 ? 's' : ''}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                      Category: {r.category}
                    </div>
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    background: r.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : r.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: r.status === 'approved' ? '#10b981' : r.status === 'rejected' ? '#ef4444' : '#f59e0b',
                    border: `1px solid ${r.status === 'approved' ? 'rgba(16, 185, 129, 0.3)' : r.status === 'rejected' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                  }}>
                    {r.status === 'approved' && <CheckCircle size={13} />}
                    {r.status === 'rejected' && <XCircle size={13} />}
                    {r.status === 'pending' && <Clock size={13} />}
                    {r.status.toUpperCase()}
                  </div>
                </div>

                {r.remarks && (
                  <div style={{ marginTop: '0.6rem', background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <strong style={{ color: '#f59e0b' }}>Guide Note:</strong> {r.remarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Wallet;
