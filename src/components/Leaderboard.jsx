import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, Medal, Award, Flame, Clock, BookOpen, Star, Target, Gift, Calendar as CalIcon, LogOut, User, Activity, X } from 'lucide-react';
import { format, startOfMonth, parseISO, isWithinInterval, isAfter, endOfMonth, differenceInMinutes, differenceInDays, parse, startOfWeek, endOfWeek, startOfDay, endOfDay, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { calculatePoints } from '../utils/scoring';



const Leaderboard = ({ currentUser }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [activeTabMode, setActiveTabMode] = useState('regular'); // 'campaign' | 'regular'
  const [timeFilter, setTimeFilter] = useState('month'); // today, week, month, quarter, year, custom
  const [customStartDate, setCustomStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedDevotee, setSelectedDevotee] = useState(null);
  const [syncCount, setSyncCount] = useState(0);

  const handleOptOutCampaign = () => {
    if (!activeCampaign) return;
    if (!window.confirm("Are you sure you want to opt-out of this campaign? Your progress will be removed from the leaderboard.")) return;
    
    // Update global campaigns
    const globalCamps = JSON.parse(localStorage.getItem('sadhana_campaigns') || '[]');
    const updatedGlobal = globalCamps.map(c => {
      if (c.id === activeCampaign.id) {
        return { ...c, enrolledDevotees: (c.enrolledDevotees || []).filter(e => e !== currentUser.email) };
      }
      return c;
    });
    localStorage.setItem('sadhana_campaigns', JSON.stringify(updatedGlobal));

    // Update guide campaigns
    const myGuideCamps = JSON.parse(localStorage.getItem(`guide_campaigns_${currentUser.guide}`) || '[]');
    const updatedGuide = myGuideCamps.map(c => {
      if (c.id === activeCampaign.id) {
        return { ...c, enrolledDevotees: (c.enrolledDevotees || []).filter(e => e !== currentUser.email) };
      }
      return c;
    });
    localStorage.setItem(`guide_campaigns_${currentUser.guide}`, JSON.stringify(updatedGuide));
    
    setActiveTabMode('regular');
    window.dispatchEvent(new Event('sadhana_live_sync'));
  };

  // 1. Initial Campaign check on mount
  useEffect(() => {
    const handleSync = () => setSyncCount(c => c + 1);
    window.addEventListener('sadhana_live_sync', handleSync);
    
    const globalCamps = JSON.parse(localStorage.getItem('sadhana_campaigns') || '[]');
    const myGuideCamps = JSON.parse(localStorage.getItem(`guide_campaigns_${currentUser.guide}`) || '[]');
    const combined = [...globalCamps, ...myGuideCamps];
    const activeCamp = combined.find(c => 
      (c.target === 'all' || c.target === currentUser.status) &&
      (c.enrolledDevotees || []).includes(currentUser.email)
    ) || combined[0] || null;

    setActiveCampaign(activeCamp);
    if (activeCamp && (activeCamp.enrolledDevotees || []).includes(currentUser.email)) {
      setActiveTabMode('campaign');
    }
    
    return () => window.removeEventListener('sadhana_live_sync', handleSync);
  }, [currentUser.email, currentUser.guide, currentUser.status, syncCount]);

  // 2. Fetch and calculate scores based on selected activeTabMode
  useEffect(() => {
    // 3. Gather all users in this bucket
    const allUsers = [];
    const allRegisteredUsers = JSON.parse(localStorage.getItem('sadhana_users') || '[]');
    const matchedUsers = allRegisteredUsers.filter(u => 
      u.status === currentUser.status && 
      u.guide === currentUser.guide
    );
    
    if (!matchedUsers.find(u => u.email === currentUser.email)) {
       matchedUsers.push(currentUser);
    }
    allUsers.push(...matchedUsers);

    // 4. Calculate Scores
    const now = new Date();
    let startDate, endDate;
    
    if (activeTabMode === 'campaign' && activeCampaign) {
      startDate = activeCampaign.startDate ? startOfDay(parseISO(activeCampaign.startDate)) : startOfMonth(now);
      endDate = activeCampaign.endDate ? endOfDay(parseISO(activeCampaign.endDate)) : endOfMonth(now);
    } else {
      switch (timeFilter) {
        case 'today':
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'quarter':
          startDate = startOfQuarter(now);
          endDate = endOfQuarter(now);
          break;
        case 'year':
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        case 'custom':
          startDate = startOfDay(parseISO(customStartDate));
          endDate = endOfDay(parseISO(customEndDate));
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
      }
    }

    // If campaign mode, only include enrolled devotees
    let targetUsers = allUsers;
    if (activeTabMode === 'campaign' && activeCampaign && activeCampaign.enrolledDevotees) {
      targetUsers = allUsers.filter(u => activeCampaign.enrolledDevotees.includes(u.email));
      if (!targetUsers.length) targetUsers = allUsers; // fallback if no dummy enrolled
    }

    // Calculate total days for Percentage ranking, capped to today so users aren't penalized for future days
    const effectiveEndDate = isAfter(endDate, now) ? now : endDate;
    const totalDays = Math.max(1, differenceInDays(effectiveEndDate, startDate) + 1);

    const scoredUsers = targetUsers.map(user => {
      const historyStr = localStorage.getItem(`sadhana_history_${user.email}`);
      const history = historyStr ? JSON.parse(historyStr) : [];
      
      const filteredHistory = history.filter(entry => {
        if (!entry.date) return false;
        const entryDate = parseISO(entry.date);
        return isWithinInterval(entryDate, { start: startDate, end: endDate });
      });

      let totalScore = 0;
      let totalReading = 0;
      let totalHearing = 0;
      let wakeupTimesMins = [];

      const ekadashiDatesArr = (activeCampaign?.ekadashiDates || '').split(',').map(s => s.trim());

      filteredHistory.forEach(entry => {
        const maxS = entry.maxScore || 20;
        let normalizedScore = maxS > 0 ? (entry.score / maxS) * 20 : 0;
        let entryScore = normalizedScore;

        // Ekadashi 2X Multiplier Check
        if (activeTabMode === 'campaign' && activeCampaign?.enableEkadashi2x) {
          const isEkadashi = ekadashiDatesArr.includes(entry.date) || entry.details?.isEkadashi;
          if (isEkadashi) {
            entryScore = entryScore * 2; // 2X Double Points on Ekadashi!
          }
        }

        totalScore += entryScore;
        totalReading += Number(entry.details?.readingDuration || 0);
        totalHearing += Number(entry.details?.hearingDuration || 0);
        
        if (entry.details?.wakeupTime) {
          let timeStr = String(entry.details.wakeupTime);
          let isPM = timeStr.toLowerCase().includes('pm');
          let isAM = timeStr.toLowerCase().includes('am');
          let timePart = timeStr.replace(/[^\d:]/g, '');
          let [h, m] = timePart.split(':').map(Number);
          
          if (!isNaN(h) && !isNaN(m)) {
             if (isPM && h < 12) h += 12;
             if (isAM && h === 12) h = 0;
             wakeupTimesMins.push(h * 60 + m);
          }
        }
      });

      const avgWakeupMins = wakeupTimesMins.length > 0
        ? Math.round(wakeupTimesMins.reduce((a, b) => a + b, 0) / wakeupTimesMins.length)
        : 9999;

      const totalDaysActive = Math.max(1, filteredHistory.length);
      const percentage = Math.min(100, Math.round((totalScore / (totalDays * 20)) * 100));

      return {
        ...user,
        totalScore: percentage,
        totalReading: Math.round(totalReading / totalDaysActive),
        totalHearing: Math.round(totalHearing / totalDaysActive),
        avgWakeupMins
      };
    });

    scoredUsers.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.totalReading !== a.totalReading) return b.totalReading - a.totalReading;
      if (b.totalHearing !== a.totalHearing) return b.totalHearing - a.totalHearing;
      return a.avgWakeupMins - b.avgWakeupMins;
    });

    setLeaderboardData(scoredUsers);

  }, [currentUser, activeTabMode, timeFilter, customStartDate, customEndDate, syncCount]);

  const hasActiveCampaign = Boolean(activeCampaign && activeCampaign.title);
  const activeCampaignTitle = activeCampaign ? activeCampaign.title : "";
  const activePrizes = activeCampaign ? [activeCampaign.prize1st, activeCampaign.prize2nd, activeCampaign.prize3rd].filter(Boolean) : [];

  const formatWakeup = (mins) => {
    if (mins === 9999) return "--:--";
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
  };

  const top3 = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

  // Determine current user's rank
  const myRankIndex = leaderboardData.findIndex(u => u.email === currentUser.email);
  const myRank = myRankIndex + 1;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '80px', position: 'relative' }}>
      
      {/* Mode Switcher: Campaign Leaderboard vs Regular Leaderboard */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTabMode('campaign')}
          style={{
            flex: 1, padding: '0.8rem 1.2rem', borderRadius: '14px', border: 'none', cursor: 'pointer',
            background: activeTabMode === 'campaign' ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : 'var(--bg-input)',
            color: activeTabMode === 'campaign' ? '#fff' : 'var(--text-muted)',
            fontWeight: '800', fontSize: '0.95rem', fontFamily: 'inherit',
            boxShadow: activeTabMode === 'campaign' ? '0 4px 20px rgba(245,158,11,0.35)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}
        >
          <Trophy size={18} /> 🏆 Active Campaign Leaderboard {activeCampaign ? `(${activeCampaign.title})` : ''}
        </button>

        <button
          onClick={() => setActiveTabMode('regular')}
          style={{
            flex: 1, padding: '0.8rem 1.2rem', borderRadius: '14px', border: 'none', cursor: 'pointer',
            background: activeTabMode === 'regular' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'var(--bg-input)',
            color: activeTabMode === 'regular' ? '#fff' : 'var(--text-muted)',
            fontWeight: '800', fontSize: '0.95rem', fontFamily: 'inherit',
            boxShadow: activeTabMode === 'regular' ? '0 4px 20px rgba(59,130,246,0.35)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}
        >
          <Flame size={18} /> 📊 Regular Sādhana Leaderboard
        </button>
      </div>

      {/* Time Filters (Only for Regular Leaderboard) */}
      {activeTabMode === 'regular' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '5px' }}>
          {['today', 'week', 'month', 'quarter', 'year', 'custom'].map(filter => (
            <button 
              key={filter}
              onClick={() => setTimeFilter(filter)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: 'none',
                background: timeFilter === filter ? 'var(--primary-amber)' : 'var(--bg-input)',
                color: timeFilter === filter ? '#fff' : 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: timeFilter === filter ? 'bold' : 'normal',
                textTransform: 'capitalize',
                boxShadow: timeFilter === filter ? '0 2px 8px rgba(245, 158, 11, 0.3)' : 'none',
                transition: 'all 0.2s',
                flex: '0 0 auto'
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {/* Campaign Details Header Card */}
      {activeTabMode === 'campaign' && activeCampaign && (
        <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.95))', border: '1.5px solid #f59e0b', borderRadius: '20px', padding: '1.4rem', color: '#fff', marginBottom: '2rem', boxShadow: 'var(--shadow-main)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-amber" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                🏆 {activeCampaign.festival || 'Festival Campaign'}
              </span>
              <h2 style={{ margin: '0.2rem 0', fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>{activeCampaign.title}</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.82rem', color: '#cbd5e1' }}>
                Guide: {activeCampaign.guide || currentUser.guide} · Target: {activeCampaign.target || 'All My Devotees'}
              </p>
              <button 
                onClick={handleOptOutCampaign}
                style={{ marginTop: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid #ef4444', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s' }}
              >
                <LogOut size={12} /> Opt Out of Campaign
              </button>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 1rem', borderRadius: '12px', textAlign: 'right', fontSize: '0.8rem' }}>
              <span style={{ color: '#f59e0b', fontWeight: '700' }}>📅 Campaign Duration</span>
              <div style={{ fontWeight: '800', marginTop: '0.1rem' }}>
                {activeCampaign.startDate ? format(new Date(activeCampaign.startDate), 'dd MMM') : 'Now'} — {activeCampaign.endDate ? format(new Date(activeCampaign.endDate), 'dd MMM yyyy') : 'TBD'}
              </div>
            </div>
          </div>

          {activeCampaign.rules && (
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.8rem 1rem', borderRadius: '12px', fontSize: '0.82rem' }}>
              <strong style={{ color: '#f59e0b' }}>📋 Rules & Regulations:</strong>
              <div style={{ whiteSpace: 'pre-line', marginTop: '0.2rem', color: '#e2e8f0' }}>{activeCampaign.rules}</div>
            </div>
          )}

          {/* Position Prizes Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', background: 'rgba(245,158,11,0.08)', padding: '0.9rem', borderRadius: '12px' }}>
            {activeCampaign.prize1st && (
              <div style={{ background: 'rgba(255, 215, 0, 0.12)', border: '1px solid #FFD700', borderRadius: '10px', padding: '0.6rem', fontSize: '0.78rem' }}>
                <div style={{ color: '#FFD700', fontWeight: '800' }}>🥇 1st Position Prize</div>
                <div style={{ color: '#fff', marginTop: '0.2rem' }}>{activeCampaign.prize1st}</div>
              </div>
            )}
            {activeCampaign.prize2nd && (
              <div style={{ background: 'rgba(192, 192, 192, 0.12)', border: '1px solid #C0C0C0', borderRadius: '10px', padding: '0.6rem', fontSize: '0.78rem' }}>
                <div style={{ color: '#C0C0C0', fontWeight: '800' }}>🥈 2nd Position Prize</div>
                <div style={{ color: '#fff', marginTop: '0.2rem' }}>{activeCampaign.prize2nd}</div>
              </div>
            )}
            {activeCampaign.prize3rd && (
              <div style={{ background: 'rgba(205, 127, 50, 0.12)', border: '1px solid #CD7F32', borderRadius: '10px', padding: '0.6rem', fontSize: '0.78rem' }}>
                <div style={{ color: '#CD7F32', fontWeight: '800' }}>🥉 3rd Position Prize</div>
                <div style={{ color: '#fff', marginTop: '0.2rem' }}>{activeCampaign.prize3rd}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Podium */}
      {top3.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginBottom: '3rem', marginTop: '2rem', minHeight: '200px' }}>
          
          {/* Rank 2 */}
          {top3[1] && (
            <div onClick={() => setSelectedDevotee(top3[1])} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', maxWidth: '120px', cursor: 'pointer' }}>
              <div style={{ position: 'relative', marginBottom: '-15px', zIndex: 2 }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-card)', border: '4px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-main)', overflow: 'hidden' }}>
                  {top3[1].photo ? <img src={top3[1].photo} alt={top3[1].name} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : top3[1].name.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#cbd5e1', borderRadius: '50%', padding: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                  <Medal size={16} color="#475569" />
                </div>
              </div>
              <div style={{ background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)', width: '100%', height: '100px', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '25px', boxShadow: '0 -5px 15px rgba(0,0,0,0.1)' }}>
                <span style={{ fontWeight: 'bold', color: '#334155', fontSize: '1.2rem' }}>2</span>
                <span style={{ fontSize: '0.8rem', color: '#475569', textAlign: 'center', padding: '0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{top3[1].name.split(' ')[0]}</span>
                <span style={{ fontWeight: 'bold', color: '#1e293b', marginTop: '5px' }}>{top3[1].totalScore} %</span>
              </div>
            </div>
          )}

          {/* Rank 1 */}
          <div onClick={() => setSelectedDevotee(top3[0])} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%', maxWidth: '140px', zIndex: 10, cursor: 'pointer' }}>
            <div style={{ position: 'relative', marginBottom: '-15px', zIndex: 2 }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-card)', border: '5px solid #fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.2rem', overflow: 'hidden' }}>
                {top3[0].photo ? <img src={top3[0].photo} alt={top3[0].name} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : top3[0].name.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', background: '#fbbf24', borderRadius: '50%', padding: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                <Trophy size={20} color="#78350f" />
              </div>
            </div>
            <div style={{ background: 'linear-gradient(180deg, #fde68a 0%, #fbbf24 100%)', width: '100%', height: '130px', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '30px', boxShadow: '0 -5px 20px rgba(251, 191, 36, 0.4)' }}>
              <span style={{ fontWeight: 'bold', color: '#78350f', fontSize: '1.5rem' }}>1</span>
              <span style={{ fontSize: '0.9rem', color: '#92400e', textAlign: 'center', padding: '0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{top3[0].name.split(' ')[0]}</span>
              <span style={{ fontWeight: 'bold', color: '#451a03', marginTop: '5px' }}>{top3[0].totalScore} %</span>
            </div>
          </div>

          {/* Rank 3 */}
          {top3[2] && (
            <div onClick={() => setSelectedDevotee(top3[2])} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', maxWidth: '120px', cursor: 'pointer' }}>
              <div style={{ position: 'relative', marginBottom: '-15px', zIndex: 2 }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg-card)', border: '4px solid #d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-main)', overflow: 'hidden' }}>
                  {top3[2].photo ? <img src={top3[2].photo} alt={top3[2].name} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : top3[2].name.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#d97706', borderRadius: '50%', padding: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                  <Award size={16} color="#fff" />
                </div>
              </div>
              <div style={{ background: 'linear-gradient(180deg, #fcd34d 0%, #d97706 100%)', width: '100%', height: '80px', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px', boxShadow: '0 -5px 15px rgba(0,0,0,0.1)' }}>
                <span style={{ fontWeight: 'bold', color: '#78350f', fontSize: '1.2rem' }}>3</span>
                <span style={{ fontSize: '0.8rem', color: '#78350f', textAlign: 'center', padding: '0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{top3[2].name.split(' ')[0]}</span>
                <span style={{ fontWeight: 'bold', color: '#451a03', marginTop: '5px' }}>{top3[2].totalScore} %</span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* List for Rest of Ranks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingBottom: '60px' }}>
        {rest.map((user, idx) => {
          const rank = idx + 4;
          const isMe = user.email === currentUser.email;

          const bgColors = [
            'linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)',
            'linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)',
            'linear-gradient(90deg, rgba(236, 72, 153, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)',
            'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)',
            'linear-gradient(90deg, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)',
            'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)'
          ];
          const dynamicBg = isMe ? 'rgba(245, 158, 11, 0.15)' : bgColors[idx % bgColors.length];
          const borderStyle = isMe ? '1px solid var(--primary-amber)' : '1px solid rgba(255, 255, 255, 0.05)';

          return (
            <div key={user.email} onClick={() => setSelectedDevotee(user)} style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: dynamicBg, border: borderStyle, borderRadius: '12px', gap: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s' }}
                 onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                 onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ fontWeight: 'bold', color: 'var(--text-main)', width: '30px', textAlign: 'center', fontSize: '1.1rem' }}>
                #{rank}
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-main)', overflow: 'hidden' }}>
                {user.photo ? <img src={user.photo} alt={user.name} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : user.name.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{user.name} {isMe && '(You)'}</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BookOpen size={12} /> {user.totalReading} mins/day</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={12} /> {user.totalHearing} mins/day</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Wake: {formatWakeup(user.avgWakeupMins)}</span>
                </div>
              </div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.2rem' }}>
                {user.totalScore}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Bar for Current User's Rank */}
      {myRank > 3 && (
        <div style={{ position: 'sticky', bottom: '80px', left: '1rem', right: '1rem', maxWidth: '468px', margin: '0 auto', background: 'var(--bg-card)', border: '2px solid var(--primary-amber)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 -5px 25px rgba(0,0,0,0.3)', zIndex: 9999 }}>
          <div style={{ fontWeight: 'bold', color: 'var(--primary-amber)', width: '30px', textAlign: 'center' }}>
            #{myRank}
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', overflow: 'hidden' }}>
            {currentUser.photo ? <img src={currentUser.photo} alt={currentUser.name} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : currentUser.name.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>You</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Keep pushing! You're doing great.</div>
          </div>
          <div style={{ fontWeight: 'bold', color: 'var(--primary-amber)', fontSize: '1.2rem' }}>
            {leaderboardData[myRankIndex]?.totalScore || 0}%
          </div>
        </div>
      )}

      {/* Devotee Analytics Modal Overlay */}
      {selectedDevotee && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }} onClick={() => setSelectedDevotee(null)}>
          <div className="animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '20px', width: '100%', maxWidth: '350px', padding: '1.5rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedDevotee(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--bg-input)', border: 'none', color: 'var(--text-muted)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'}>
              <X size={18} />
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid var(--primary-amber)', overflow: 'hidden' }}>
                {selectedDevotee.photo ? <img src={selectedDevotee.photo} alt="Avatar" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{width:'100%', height:'100%', background:'var(--bg-input)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', fontWeight:'bold', color:'var(--text-main)'}}>{selectedDevotee.name.substring(0,2).toUpperCase()}</div>}
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)', fontWeight: '800' }}>{selectedDevotee.name}</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedDevotee.status}</p>
              </div>
            </div>
            
            <div style={{ background: 'var(--bg-input)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Trophy size={16} /> Average</span>
                <span style={{ fontWeight: '800', color: 'var(--primary-amber)' }}>{selectedDevotee.totalScore} %</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={16} /> Avg Reading</span>
                <span style={{ fontWeight: '800', color: '#3b82f6' }}>{selectedDevotee.totalReading} mins/day</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={16} /> Avg Hearing</span>
                <span style={{ fontWeight: '800', color: '#10b981' }}>{selectedDevotee.totalHearing} mins/day</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> Avg Wakeup</span>
                <span style={{ fontWeight: '800', color: '#8b5cf6' }}>{formatWakeup(selectedDevotee.avgWakeupMins)}</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Leaderboard;

