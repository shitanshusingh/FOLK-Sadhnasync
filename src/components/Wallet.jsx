import React, { useState, useEffect, useMemo } from 'react';
import { Award, Star, Zap, Clock, CheckCircle, XCircle, Shield } from 'lucide-react';
import { calculateUserCurrencies, getPrestigeTitle } from '../utils/currency';
import { ACHIEVEMENTS, calculateAchievements } from '../utils/achievements';
import SlideToAction from './SlideToAction';

const Wallet = ({ currentUser }) => {
  const [walletData, setWalletData] = useState({ lifetime: {}, balance: {} });
  const [redemptions, setRedemptions] = useState([]);
  
  // Redeem state
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemType, setRedeemType] = useState('Chaitanya');
  const [redeemCategory, setRedeemCategory] = useState('Trip Discount');
  
  useEffect(() => {
    // Clear notification dot
    localStorage.setItem('hasNewCurrency', 'false');
    window.dispatchEvent(new Event('storage'));
    
    const data = calculateUserCurrencies(currentUser.email);
    setWalletData(data);
    
    const r = JSON.parse(localStorage.getItem('currency_redemptions') || '[]');
    setRedemptions(r.filter(x => x.email === currentUser.email).sort((a,b) => new Date(b.date) - new Date(a.date)));
  }, [currentUser.email]);

  const earnedBadges = useMemo(() => calculateAchievements(currentUser.email), [currentUser.email]);

  const handleRedeem = () => {
    const amount = Number(redeemAmount);
    if (!amount || amount <= 0) return;
    
    if (redeemType === 'Chaitanya' && amount > walletData.balance.chaitanya) {
      alert("Insufficient Chaitanya balance!");
      return;
    }
    if (redeemType === 'Nityanand' && amount > walletData.balance.nityanand) {
      alert("Insufficient Nityanand balance!");
      return;
    }
    if (redeemType === 'Prabhupada' && amount > walletData.balance.prabhupada) {
      alert("Insufficient Prabhupada balance!");
      return;
    }

    const newRequest = {
      id: Date.now().toString(),
      email: currentUser.email,
      name: currentUser.name,
      date: new Date().toISOString(),
      type: redeemType,
      amount: amount,
      category: redeemCategory,
      status: 'pending',
      // We reserve the cost so the balance drops immediately
      chaitanyaCost: redeemType === 'Chaitanya' ? amount : 0,
      nityanandCost: redeemType === 'Nityanand' ? amount : 0,
      prabhupadaCost: redeemType === 'Prabhupada' ? amount : 0,
      remarks: ''
    };

    const r = JSON.parse(localStorage.getItem('currency_redemptions') || '[]');
    r.push(newRequest);
    localStorage.setItem('currency_redemptions', JSON.stringify(r));
    setRedemptions(r.filter(x => x.email === currentUser.email).sort((a,b) => new Date(b.date) - new Date(a.date)));
    
    setWalletData(calculateUserCurrencies(currentUser.email));
    setRedeemAmount('');
  };

  const title = getPrestigeTitle(walletData.lifetime.chaitanya || 0);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* Title Card */}
      <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid var(--border-highlight)' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-amber)', fontSize: '1.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
            <Award size={32} />
            {title}
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Lifetime Prestige Title</p>
        </div>
      </div>

      {/* Balances */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
        
        {/* Chaitanya */}
        <div className="panel" style={{ padding: '1rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(217, 119, 6, 0.1))', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #fbbf24, #d97706)', borderRadius: '50%', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(251,191,36,0.3)' }}>
            <Star size={20} color="#fff" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fbbf24' }}>{walletData.balance.chaitanya || 0}</h3>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Chaitanya</p>
          <div style={{ fontSize: '0.65rem', marginTop: '0.5rem', opacity: 0.7 }}>Lifetime: {walletData.lifetime.chaitanya || 0}</div>
        </div>

        {/* Nityanand */}
        <div className="panel" style={{ padding: '1rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', borderRadius: '50%', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' }}>
            <div style={{ width: '14px', height: '14px', background: '#fff', borderRadius: '50%' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#60a5fa' }}>{walletData.balance.nityanand || 0}</h3>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nityanand</p>
          <div style={{ fontSize: '0.65rem', marginTop: '0.5rem', opacity: 0.7 }}>Lifetime: {walletData.lifetime.nityanand || 0}</div>
        </div>

        {/* Prabhupada */}
        <div className="panel" style={{ padding: '1rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1), rgba(194, 65, 12, 0.1))', border: '1px solid rgba(234, 88, 12, 0.3)' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '50%', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(234,88,12,0.3)' }}>
            <Zap size={20} color="#fff" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#f97316' }}>{walletData.balance.prabhupada || 0}</h3>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Prabhupada</p>
          <div style={{ fontSize: '0.65rem', marginTop: '0.5rem', opacity: 0.7 }}>Lifetime: {walletData.lifetime.prabhupada || 0}</div>
        </div>

      </div>
      
      {/* Achievements / Badges */}
      <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="#8b5cf6" /> Your Achievements
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {ACHIEVEMENTS.map(badge => {
            const isEarned = earnedBadges.includes(badge.id);
            return (
              <div key={badge.id} style={{ 
                background: isEarned ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(109, 40, 217, 0.15))' : 'var(--bg-input)',
                border: isEarned ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border-subtle)',
                borderRadius: '12px', padding: '1rem', textAlign: 'center',
                opacity: isEarned ? 1 : 0.5,
                filter: isEarned ? 'none' : 'grayscale(100%)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{badge.icon}</div>
                <div style={{ fontWeight: 'bold', color: isEarned ? '#c4b5fd' : 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                  {badge.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{badge.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Redemption Store */}
      <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Redeem Coins</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          • 100 Chaitanya Coins = Up to 100% Free Trip.<br/>
          • 20 Chaitanya Coins = Up to 100% Free Event Entry.
        </p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
          <select 
            value={redeemType} 
            onChange={e => setRedeemType(e.target.value)}
            className="input-field" 
            style={{ flex: 1 }}
          >
            <option value="Chaitanya">Chaitanya (Gold)</option>
            <option value="Nityanand">Nityanand (Blue)</option>
            <option value="Prabhupada">Prabhupada (Saffron)</option>
          </select>
          <input 
            type="number" 
            placeholder="Amount" 
            value={redeemAmount}
            onChange={e => setRedeemAmount(e.target.value)}
            className="input-field" 
            style={{ width: '100px' }}
          />
        </div>
        
        <select 
          value={redeemCategory}
          onChange={e => setRedeemCategory(e.target.value)}
          className="input-field"
          style={{ width: '100%', marginBottom: '1.5rem' }}
        >
          <option value="Trip Discount">Trip Discount</option>
          <option value="Event Entry">FOLK Event Entry</option>
          <option value="Books/Merch">Books / Merch</option>
          <option value="Other">Other (Guide decides)</option>
        </select>

        <SlideToAction text="Slide to Redeem" onAction={handleRedeem} disabled={!redeemAmount || Number(redeemAmount) <= 0} />
      </div>

      {/* Transaction History */}
      <div className="panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Request History</h3>
        {redemptions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '2rem 0' }}>No redemptions yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {redemptions.map(r => (
              <div key={r.id} style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '12px', borderLeft: `4px solid ${r.status === 'approved' ? '#10b981' : r.status === 'rejected' ? '#ef4444' : '#fbbf24'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{r.amount} {r.type}</h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.category}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 'bold', color: r.status === 'approved' ? '#10b981' : r.status === 'rejected' ? '#ef4444' : '#fbbf24' }}>
                    {r.status === 'approved' && <CheckCircle size={14} />}
                    {r.status === 'rejected' && <XCircle size={14} />}
                    {r.status === 'pending' && <Clock size={14} />}
                    {r.status.toUpperCase()}
                  </div>
                </div>
                {r.remarks && (
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong>Guide Remark:</strong> {r.remarks}
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
