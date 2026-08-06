import React, { useState, useEffect, useMemo } from 'react';
import { Award, Clock, CheckCircle, XCircle, Shield, Sparkles, Gift, Info, RefreshCw, ArrowRight } from 'lucide-react';
import { calculateUserCurrencies, getPrestigeTitle } from '../utils/currency';
import { ACHIEVEMENTS, calculateAchievements } from '../utils/achievements';
import { ChaitanyaCoinIcon, NityanandCoinIcon, PrabhupadaCoinIcon } from './CoinIcons';
import { cloudSaveRedemption, cloudFetchAllRedemptions } from '../services/firebase';
import SlideToAction from './SlideToAction';

const Wallet = ({ currentUser }) => {
  const [walletData, setWalletData] = useState({ lifetime: {}, balance: {} });
  const [redemptions, setRedemptions] = useState([]);
  
  // Redeem state
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemType, setRedeemType] = useState('Chaitanya');
  const [redeemCategory, setRedeemCategory] = useState('Trip Discount');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [showRulesInfo, setShowRulesInfo] = useState(true);
  const [sliderKey, setSliderKey] = useState(0);

  // Conversion state
  const [convertMode, setConvertMode] = useState('2P_to_1N'); // '2P_to_1N', '3N_to_1C', '6P_to_1C'
  const [convertMultiplier, setConvertMultiplier] = useState(1);
  const [convertSuccessMsg, setConvertSuccessMsg] = useState('');

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

  // Currency Conversion Handler
  const handleConvertCurrency = () => {
    const mult = Math.max(1, Number(convertMultiplier) || 1);
    let fromType = '', fromAmount = 0, toType = '', toAmount = 0;

    if (convertMode === '2P_to_1N') {
      fromType = 'Prabhupada'; fromAmount = 2 * mult;
      toType = 'Nityanand'; toAmount = 1 * mult;
    } else if (convertMode === '3N_to_1C') {
      fromType = 'Nityanand'; fromAmount = 3 * mult;
      toType = 'Chaitanya'; toAmount = 1 * mult;
    } else if (convertMode === '6P_to_1C') {
      fromType = 'Prabhupada'; fromAmount = 6 * mult;
      toType = 'Chaitanya'; toAmount = 1 * mult;
    }

    // Check balance
    const currentFromBal = walletData.balance[fromType.toLowerCase()] || 0;
    if (currentFromBal < fromAmount) {
      alert(`Insufficient ${fromType} balance! You need ${fromAmount} ${fromType} coins for this conversion.`);
      return;
    }

    triggerHaptic();

    const conversions = JSON.parse(localStorage.getItem(`sadhana_conversions_${currentUser.email}`) || '[]');
    conversions.push({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      fromType, fromAmount, toType, toAmount
    });

    localStorage.setItem(`sadhana_conversions_${currentUser.email}`, JSON.stringify(conversions));
    setWalletData(calculateUserCurrencies(currentUser.email));
    setConvertSuccessMsg(`Converted ${fromAmount} ${fromType} → ${toAmount} ${toType} Coin${toAmount > 1 ? 's' : ''}!`);
    
    setTimeout(() => {
      setConvertSuccessMsg('');
    }, 3000);
  };

  const handleRedeem = async () => {
    const amount = Number(redeemAmount);
    if (!amount || amount <= 0) return;
    
    if (redeemType === 'Chaitanya' && amount > (walletData.balance.chaitanya || 0)) {
      alert("Insufficient Chaitanya balance!");
      setSliderKey(prev => prev + 1);
      return;
    }
    if (redeemType === 'Nityanand' && amount > (walletData.balance.nityanand || 0)) {
      alert("Insufficient Nityanand balance!");
      setSliderKey(prev => prev + 1);
      return;
    }
    if (redeemType === 'Prabhupada' && amount > (walletData.balance.prabhupada || 0)) {
      alert("Insufficient Prabhupada balance!");
      setSliderKey(prev => prev + 1);
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
      remarks: '',
      guideName: currentUser.guide || currentUser.guideName || currentUser.assignedGuide || ''
    };

    await cloudSaveRedemption(newRequest);
    const r = JSON.parse(localStorage.getItem('currency_redemptions') || '[]');
    setRedemptions(r.filter(x => x.email === currentUser.email).sort((a,b) => new Date(b.date) - new Date(a.date)));
    
    setWalletData(calculateUserCurrencies(currentUser.email));
    setRedeemAmount('');
    setIsSubmitting(false);
    setSubmittedSuccess(true);

    // Auto-reset success state & slider key after 2.5 seconds
    setTimeout(() => {
      setSubmittedSuccess(false);
      setSliderKey(prev => prev + 1);
    }, 2500);
  };

  const title = getPrestigeTitle(walletData.lifetime.chaitanya || 0);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '5rem', maxWidth: '850px', margin: '0 auto' }}>
      
      {/* 💡 DETAILED COMPREHENSIVE POINT RULES CARD */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        borderRadius: '20px',
        padding: '1.4rem',
        marginBottom: '1.2rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} /> Official Point System & Conversion Ratios
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#c4b5fd', background: 'rgba(139, 92, 246, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)', fontWeight: '700' }}>
            Prestige: {title}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.9rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
          {/* Chaitanya Gold Rule */}
          <div style={{ background: 'rgba(251, 191, 36, 0.08)', padding: '0.9rem', borderRadius: '14px', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
              <ChaitanyaCoinIcon size={26} />
              <strong style={{ color: '#fbbf24', fontSize: '0.92rem' }}>Chaitanya Coin (Gold)</strong>
            </div>
            • <strong>How to Earn:</strong> 20/20 Full Daily Sādhana score.<br/>
            • <strong>Rewards:</strong><br/>
            &nbsp;&nbsp;- <strong>100 Coins</strong> = Up to 100% Free FOLK Trip<br/>
            &nbsp;&nbsp;- <strong>20 Coins</strong> = Up to 100% Free Event Entry<br/>
            • <strong>Exchange Ratio:</strong> 1 Gold = 3 Blue = 6 Saffron<br/>
            <span style={{ color: '#fef08a', fontSize: '0.75rem', marginTop: '0.4rem', display: 'block', borderTop: '1px stroke rgba(251,191,36,0.2)', paddingTop: '0.3rem' }}>
              ⚡ <em>Missed Morning Sadhana?</em> Do 16+ rounds, 60+ mins reading & 60+ mins hearing to still recover 1 Gold Coin!
            </span>
          </div>

          {/* Nityanand Blue Rule */}
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '0.9rem', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
              <NityanandCoinIcon size={26} />
              <strong style={{ color: '#60a5fa', fontSize: '0.92rem' }}>Nityanand Coin (Blue)</strong>
            </div>
            • <strong>How to Earn:</strong> 10+ Sādhana score.<br/>
            • <strong>Exchange Ratio:</strong> 1 Blue Coin = 2 Saffron Coins.<br/>
            • <strong>Upgrade:</strong> 3 Nityanand Blue Coins = 1 Chaitanya Gold Coin!
          </div>

          {/* Prabhupada Saffron Rule */}
          <div style={{ background: 'rgba(234, 88, 12, 0.08)', padding: '0.9rem', borderRadius: '14px', border: '1px solid rgba(234, 88, 12, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
              <PrabhupadaCoinIcon size={26} />
              <strong style={{ color: '#f97316', fontSize: '0.92rem' }}>Prabhupada Coin (Bonus)</strong>
            </div>
            • <strong>How to Earn:</strong> Bonus reading (&gt;60 mins), hearing (&gt;60 mins), or 20+ rounds.<br/>
            • <strong>Exchange Ratios:</strong><br/>
            &nbsp;&nbsp;- <strong>2 Prabhupada Coins</strong> = 1 Nityanand Blue Coin<br/>
            &nbsp;&nbsp;- <strong>6 Prabhupada Coins</strong> = 1 Chaitanya Gold Coin
          </div>
        </div>
      </div>

      {/* 💰 DYNAMIC GLASSMORPHIC CURRENCY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginBottom: '1.2rem' }}>
        
        {/* Chaitanya Gold */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(217, 119, 6, 0.05))',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          borderRadius: '18px',
          padding: '1rem 0.8rem',
          textAlign: 'center',
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

      {/* 🔄 INTERACTIVE CURRENCY CONVERTER / EXCHANGE CARD */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        borderRadius: '20px',
        padding: '1.4rem',
        marginBottom: '1.2rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={20} color="#8b5cf6" /> Currency Converter / Exchange
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.12)', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(139, 92, 246, 0.3)', fontWeight: '700' }}>
            Instant Coin Exchange
          </span>
        </div>

        {convertSuccessMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} /> {convertSuccessMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.8rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', marginBottom: '0.3rem' }}>
              Select Exchange Type
            </label>
            <select
              value={convertMode}
              onChange={e => setConvertMode(e.target.value)}
              style={{
                width: '100%',
                background: '#0b1120',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '14px',
                padding: '0.75rem 0.9rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                outline: 'none'
              }}
            >
              <option value="2P_to_1N">2 Prabhupada (Saffron) → 1 Nityanand (Blue)</option>
              <option value="3N_to_1C">3 Nityanand (Blue) → 1 Chaitanya (Gold)</option>
              <option value="6P_to_1C">6 Prabhupada (Saffron) → 1 Chaitanya (Gold)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', marginBottom: '0.3rem' }}>
              Multiplier
            </label>
            <input
              type="number"
              min="1"
              value={convertMultiplier}
              onChange={e => setConvertMultiplier(e.target.value)}
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

          <button
            onClick={handleConvertCurrency}
            style={{
              padding: '0.75rem',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#fff',
              fontWeight: '800',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '6px',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
            }}
          >
            Convert <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* 🛡️ ENHANCED ATTRACTIVE ACHIEVEMENTS SECTION */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '1.2rem',
        marginBottom: '1.2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#e9d5ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#a855f7" /> Your Achievements ({earnedBadges.length}/{ACHIEVEMENTS.length})
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem' }}>
          {ACHIEVEMENTS.map(badge => {
            const isEarned = earnedBadges.includes(badge.id);
            return (
              <div 
                key={badge.id}
                style={{
                  background: isEarned ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(126, 34, 206, 0.1))' : 'rgba(255, 255, 255, 0.03)',
                  border: isEarned ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '14px',
                  padding: '0.8rem 0.6rem',
                  textAlign: 'center',
                  opacity: isEarned ? 1 : 0.45,
                  filter: isEarned ? 'none' : 'grayscale(100%)',
                  boxShadow: isEarned ? '0 0 15px rgba(168, 85, 247, 0.25)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>{badge.icon}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: isEarned ? '#f3e8ff' : '#64748b', marginBottom: '0.2rem' }}>
                  {badge.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', lineHeight: '1.2' }}>{badge.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🎁 REDEMPTION STORE WITH RESTORED SLIDE-TO-ACTION (SWIPE TO REDEEM) */}
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
            Swipe to Redeem
          </span>
        </div>

        {/* Explicit Reward Pills */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
          <div style={{ fontSize: '0.78rem', background: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '12px', fontWeight: '700' }}>
            ⛺ 100 Chaitanya Coins = Up to 100% Free FOLK Trip
          </div>
          <div style={{ fontSize: '0.78rem', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '12px', fontWeight: '700' }}>
            🎟️ 20 Chaitanya Coins = Up to 100% Free Event Entry
          </div>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            
            {/* Coin select */}
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

          {/* 📱 RESTORED SLIDE TO ACTION (SWIPE TO REDEEM) */}
          <div style={{ marginTop: '0.8rem' }}>
            <SlideToAction 
              key={sliderKey}
              text="Slide to Redeem Request" 
              onAction={handleRedeem} 
              disabled={!redeemAmount || Number(redeemAmount) <= 0 || isSubmitting} 
            />
          </div>
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
