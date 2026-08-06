import { ChaitanyaCoinIcon, NityanandCoinIcon, PrabhupadaCoinIcon } from './CoinIcons';
import { useState, useEffect, useRef } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfToday, differenceInDays, subDays } from 'date-fns';
import { Save, AlertTriangle, User, Lock, Unlock, Flame, Star, Zap } from 'lucide-react';
import { calculatePoints, DEFAULT_RESIDENCY_CONFIG } from '../utils/scoring';
import { cloudSaveSadhanaLog } from '../services/firebase';
import { calculateDailyCoins } from '../utils/currency';

const CORE_ACTIVITIES = [
  { id: 'mangala_arati', label: 'Maṅgala Ārati' },
  { id: 'japa', label: 'Morning Japa' },
  { id: 'reading', label: 'Book Reading' },
  { id: 'class', label: 'Srimad-Bhagavatam' },
];

const OPTIONAL_ACTIVITIES = [
  { id: 'yoga', label: 'Yoga (Optional)' }
];

const ABSENT_REASONS = [
  'Sick (Health not well)',
  'Authorized Service',
  'Authorized Travel',
  'No Reason (Woke up late)'
];

const SadhanaTracker = ({ currentUser, prefilledDate }) => {
  const todayObj = startOfToday();
  const todayStr = format(todayObj, 'yyyy-MM-dd');
  
  const [date, setDate] = useState(prefilledDate || todayStr);
  const [history, setHistory] = useState([]);
  
  // DYNAMIC CONFIG
  const residencies = JSON.parse(localStorage.getItem('sadhana_residencies') || '[]');
  const myRes = residencies.find(r => r.name === currentUser?.residency) || {};
  const config = myRes.config || DEFAULT_RESIDENCY_CONFIG;

  const activeCore = CORE_ACTIVITIES.filter(act => config[act.id]?.enabled !== false);
  const activeOptional = OPTIONAL_ACTIVITIES.filter(act => config[act.id]?.enabled !== false);
  const maxScore = (activeCore.length + activeOptional.length) * 4;

  const [activityTimes, setActivityTimes] = useState({
    mangala_arati: '', japa: '', reading: '', class: '', yoga: ''
  });
  
  const [details, setDetails] = useState({
    sleepTime: '', wakeupTime: '', totalRounds: '', chantingCompletionTime: '', readingDuration: '', absentReason: '', bookName: '', hearingDuration: '', inTemple: false
  });

  const [score, setScore] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [earnedCoins, setEarnedCoins] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [isLocked, setIsLocked] = useState(false);
  const [unlockRequested, setUnlockRequested] = useState(false);
  const [campaigns, setCampaigns] = useState({});

  const monthStart = startOfMonth(todayObj);
  const monthEnd = endOfMonth(todayObj);
  const fullMonthDays = eachDayOfInterval({ start: monthStart, end: monthEnd }).map(d => format(d, 'yyyy-MM-dd'));

  const carouselRef = useRef(null);

  useEffect(() => {
    const rawCamps = JSON.parse(localStorage.getItem('sadhana_campaigns') || '[]');
    const userEmail = currentUser?.email;
    const activeCamp = rawCamps.find(c => c.enrolledEmails?.includes(userEmail));
    setCampaigns(activeCamp ? { multiplierDays: activeCamp.multiplierDays || [] } : {});
    const data = JSON.parse(localStorage.getItem(`sadhana_history_${currentUser.email}`) || '[]');
    setHistory(data);
  }, [date, score]);

  useEffect(() => {
    let newScore = 0;
    activeCore.forEach(act => {
      newScore += calculatePoints(act.id, activityTimes[act.id], config, details.inTemple);
    });
    activeOptional.forEach(act => {
      newScore += calculatePoints(act.id, activityTimes[act.id], config, details.inTemple);
    });
    setScore(Math.min(newScore, maxScore)); 
  }, [activityTimes, maxScore, details.inTemple]);

  const loadData = (selectedDate) => {
    const data = JSON.parse(localStorage.getItem(`sadhana_history_${currentUser.email}`) || '[]');
    const existingEntry = data.find(entry => entry.date === selectedDate);
    
    if (existingEntry) {
      setActivityTimes(existingEntry.activityTimes || { mangala_arati: '', japa: '', reading: '', class: '', yoga: '' });
      setDetails(existingEntry.details || { sleepTime: '', wakeupTime: '', totalRounds: '', chantingCompletionTime: '', readingDuration: '', absentReason: '', bookName: '', hearingDuration: '' });
    } else {
      setActivityTimes({ mangala_arati: '', japa: '', reading: '', class: '', yoga: '' });
      setDetails({ sleepTime: '', wakeupTime: '', totalRounds: '', chantingCompletionTime: '', readingDuration: '', absentReason: '', bookName: '', hearingDuration: '' });
    }
    setErrorMsg('');
    setUnlockRequested(false);
  };

  useEffect(() => {
    loadData(date);
    setTimeout(() => {
      if (carouselRef.current) {
        const selectedEl = carouselRef.current.querySelector(`[data-date="${date}"]`);
        if (selectedEl) {
          selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    }, 100);
  }, [date]);

  useEffect(() => {
    if (prefilledDate) setDate(prefilledDate);
  }, [prefilledDate]);

  const isPM = (timeStr) => {
    if (!timeStr) return false;
    const [hours] = timeStr.split(':').map(Number);
    return hours >= 12;
  };

  const getTargetTime = (id, baseTime, inTemple) => {
    if (!inTemple) return baseTime;
    switch (id) {
      case 'mangala_arati': return "04:30";
      case 'japa': return "05:10";
      case 'class': return "08:00";
      case 'yoga': return "09:00";
      case 'reading': return "11:00";
      default: return baseTime;
    }
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (isLocked && !unlockRequested) return;

    // --- Chronological Enforcement Logic ---
    if (date !== format(monthStart, 'yyyy-MM-dd')) {
      const h = JSON.parse(localStorage.getItem(`sadhana_history_${currentUser.email}`) || '[]');
      const daysToCheck = eachDayOfInterval({ start: monthStart, end: subDays(parseISO(date), 1) });
      
      for (const day of daysToCheck) {
        const dStr = format(day, 'yyyy-MM-dd');
        const entryExists = h.some(entry => entry.date === dStr);
        if (!entryExists) {
          setErrorMsg(`Please fill your pending Sādhana for ${format(day, 'MMM do')} before proceeding!`);
          setDate(dStr);
          return;
        }
      }
    }
    // ----------------------------------------

    const isResident = currentUser?.status === 'FOLK Resident';
    const isNonResident = currentUser?.status === 'Non-FOLK Resident';
    const isBeginner = currentUser?.status === 'Beginner';

    if (isResident) {
      if (!details.sleepTime || !details.wakeupTime || !details.totalRounds || !details.readingDuration) {
        setErrorMsg('Please fill all compulsory details.');
        return;
      }
      const morningKeys = ['mangala_arati', 'japa', 'reading', 'class', 'yoga'];
      for (const key of morningKeys) {
        if (isPM(activityTimes[key])) {
          setErrorMsg("This is not a Sādhana time. Please enter a valid AM time or leave it blank (Absent).");
          return;
        }
      }
      if (isPM(details.wakeupTime)) {
        setErrorMsg("Wake-up time should be in the AM. This is not a proper Sādhana schedule.");
        return;
      }
    } else if (isNonResident) {
      if (!details.sleepTime || !details.wakeupTime || !details.totalRounds || !details.readingDuration || !details.bookName || !details.hearingDuration) {
        setErrorMsg('Please fill all compulsory details.');
        return;
      }
    } else if (isBeginner) {
      if (!details.totalRounds || !details.readingDuration || !details.hearingDuration) {
        setErrorMsg('Please fill all compulsory details.');
        return;
      }
    }

    const hasAbsentCore = isResident && activeCore.some(a => !activityTimes[a.id]);
    if (hasAbsentCore && !details.absentReason) {
      setErrorMsg('Please provide a reason for the missing core activities.');
      return;
    }

    if (date === todayStr && details.chantingCompletionTime) {
      const now = new Date();
      const [hours, minutes] = details.chantingCompletionTime.split(':').map(Number);
      if (hours > now.getHours() || (hours === now.getHours() && minutes > now.getMinutes())) {
        setErrorMsg('Chanting completion time cannot be in the future.');
        return;
      }
    }

    setErrorMsg('');
    
    const h = JSON.parse(localStorage.getItem(`sadhana_history_${currentUser.email}`) || '[]');
    const newEntry = { date, activityTimes, details, score, maxScore };
    
    const existingIndex = h.findIndex(entry => entry.date === date);
    if (existingIndex >= 0) {
      h[existingIndex] = newEntry;
    } else {
      h.push(newEntry);
    }
    
    localStorage.setItem(`sadhana_history_${currentUser.email}`, JSON.stringify(h));
    setHistory(h);

    // Sync Sādhana entry to Cloud DB
    cloudSaveSadhanaLog(currentUser.email, newEntry);
    setSaveStatus('Saved successfully!');
    
    // Check if coins were earned
    const coins = calculateDailyCoins(newEntry);
    if (coins.chaitanya || coins.nityanand || coins.prabhupada) {
      localStorage.setItem('hasNewCurrency', 'true');
      setEarnedCoins(coins);
    } else {
      setEarnedCoins(null);
    }
    
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try { window.navigator.vibrate([30, 20, 30]); } catch(e) {}
    }

    setShowSubmitModal(true);
    setTimeout(() => { setShowSubmitModal(false); setSaveStatus(''); }, 4500);
    
    window.dispatchEvent(new Event('storage'));
  };

  const getStatusDot = (dStr) => {
    const entry = history.find(e => e.date === dStr);
    if (!entry) return null;
    const isResident = currentUser?.status === 'FOLK Resident';
    if (isResident) {
      const isAbs = CORE_ACTIVITIES.some(act => !(entry.activityTimes && entry.activityTimes[act.id]));
      if (isAbs || entry.score < 16) return 'var(--accent-rose)';
    }
    return 'var(--accent-emerald)';
  };

  const requestUnlock = () => {
    setUnlockRequested(true);
    setSaveStatus('Admin unlock requested... Access granted for 24 hours.');
    setTimeout(() => setSaveStatus(''), 4000);
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      
            {/* Always Centered Floating Submission Modal Overlay */}
      {showSubmitModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5, 8, 15, 0.85)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#0f172a', padding: '2rem 1.8rem', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.4)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(245, 158, 11, 0.2)', maxWidth: '420px', width: '90vw' }}>
            
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)', color: '#fff' }}>
              <CheckCircle size={36} />
            </div>

            <h2 style={{ margin: '0 0 0.4rem 0', color: '#f8fafc', fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif', fontWeight: '800' }}>
              Sādhana Logged!
            </h2>
            
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f59e0b', margin: '0.4rem 0 1rem' }}>
              Score Earned: {score} / {maxScore} Points
            </div>

            {/* Coins Section */}
            {earnedCoins && (earnedCoins.chaitanya > 0 || earnedCoins.nityanand > 0 || earnedCoins.prabhupada > 0) ? (
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '16px', padding: '1rem', marginBottom: '1.2rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '0.6rem' }}>
                  🎉 Reward Coins Earned!
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  {earnedCoins.chaitanya > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ margin: '0 auto 0.3rem', display: 'flex', justifyContent: 'center' }}>
                        <ChaitanyaCoinIcon size={46} />
                      </div>
                      <div style={{ fontWeight: '800', color: '#fbbf24', fontSize: '0.82rem' }}>+1 Chaitanya</div>
                    </div>
                  )}
                  {earnedCoins.nityanand > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ margin: '0 auto 0.3rem', display: 'flex', justifyContent: 'center' }}>
                        <NityanandCoinIcon size={46} />
                      </div>
                      <div style={{ fontWeight: '800', color: '#60a5fa', fontSize: '0.82rem' }}>+1 Nityanand</div>
                    </div>
                  )}
                  {earnedCoins.prabhupada > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ margin: '0 auto 0.3rem', display: 'flex', justifyContent: 'center' }}>
                        <PrabhupadaCoinIcon size={46} />
                      </div>
                      <div style={{ fontWeight: '800', color: '#f97316', fontSize: '0.82rem' }}>+1 Prabhupada</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ margin: '0 0 1.2rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                Your entry has been saved into the ledger.
              </p>
            )}

            <button
              onClick={() => setShowSubmitModal(false)}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                color: '#fff',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              Great! View Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Campaign Multiplier Banner */}
      {campaigns.multiplierDays?.includes(date) && (
        <div style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#fff', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(245,158,11,0.4)' }}>
          <Flame size={24} />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Double Points Day!</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Your Sādhana score will automatically be doubled for {format(parseISO(date), 'MMM do')} on the Leaderboard!</div>
          </div>
        </div>
      )}

      {/* Full Month Horizontal Date Carousel */}
      <div 
        ref={carouselRef}
        className="panel" 
        style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        {fullMonthDays.map(dStr => {
          const isSelected = dStr === date;
          const isFuture = parseISO(dStr) > startOfToday();
          const dotColor = getStatusDot(dStr);
          const dayNum = format(parseISO(dStr), 'd');
          const dayName = format(parseISO(dStr), 'EEE');

          return (
            <div 
              key={dStr}
              data-date={dStr}
              onClick={() => { if (!isFuture) setDate(dStr); }}
              style={{
                flex: '0 0 auto',
                width: '65px',
                height: '75px',
                background: isSelected ? 'var(--primary-amber)' : 'var(--bg-main)',
                border: isSelected ? '2px solid var(--primary-amber)' : '1px solid var(--border-subtle)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isFuture ? 'not-allowed' : 'pointer',
                opacity: isFuture ? 0.3 : 1,
                color: isSelected ? '#fff' : 'var(--text-main)',
                position: 'relative',
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 4px 15px rgba(245,158,11,0.2)' : 'none'
              }}
            >
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '2px' }}>{dayName}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{dayNum}</div>
              
              <div style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', borderRadius: '50%', background: dotColor || 'transparent' }}></div>
              {dotColor && <User size={12} style={{ position: 'absolute', bottom: '6px', left: '6px', color: isSelected ? 'rgba(255,255,255,0.7)' : dotColor }} />}
            </div>
          );
        })}
      </div>
      


      {isLocked && !unlockRequested && (
        <div style={{ padding: '1.5rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Lock size={24} />
            <div>
              <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem' }}>48-Hour Edit Lock Active</strong>
              <span>This Sādhana date is older than 48 hours and has been permanently locked to enforce discipline. No edits can be made.</span>
            </div>
          </div>
          <button className="nav-btn btn-secondary" style={{ borderColor: 'rgba(244, 63, 94, 0.5)', color: 'var(--accent-rose)', whiteSpace: 'nowrap' }} onClick={requestUnlock}>
            <Unlock size={16} /> Request Admin Unlock
          </button>
        </div>
      )}

      <form onSubmit={handleSave} style={{ opacity: (isLocked && !unlockRequested) ? 0.6 : 1, pointerEvents: (isLocked && !unlockRequested) ? 'none' : 'auto' }}>
        
        {currentUser?.status === 'FOLK Resident' && (
        <div className="panel" style={{ marginBottom: '1.5rem' }}>
          <div className="panel-header" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>1. Core Activities Timing</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', marginTop: '0.2rem' }}>
                Leave the time blank if you were absent. PM times are not accepted here.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold' }}>In Temple Today?</label>
                <div 
                  onClick={() => setDetails({...details, inTemple: !details.inTemple})}
                  style={{ 
                    width: '40px', height: '20px', borderRadius: '10px', 
                    background: details.inTemple ? 'var(--primary-amber)' : 'var(--bg-main)', 
                    position: 'relative', cursor: 'pointer', transition: 'background 0.3s',
                    border: '1px solid var(--border-highlight)'
                  }}
                >
                  <div style={{ 
                    width: '16px', height: '16px', borderRadius: '50%', background: '#fff', 
                    position: 'absolute', top: '1px', left: details.inTemple ? '21px' : '1px', 
                    transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
                  }} />
                </div>
              </div>
              <div className="score-display">
                Score: <strong>{score} / {maxScore}</strong>
              </div>
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="custom-table" style={{ textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Activity</th>
                  <th style={{ width: '30%' }}>Completion Time</th>
                  <th style={{ width: '30%' }}>Points Earned</th>
                </tr>
              </thead>
              <tbody>
                {activeCore.map(activity => {
                  const currentPts = calculatePoints(activity.id, activityTimes[activity.id], config, details.inTemple);
                  const targetTime = getTargetTime(activity.id, config[activity.id].time, details.inTemple);
                  
                  return (
                    <tr key={activity.id}>
                      <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>
                        {activity.label} <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>({targetTime})</span>
                      </td>
                      <td>
                        <input 
                          type="time" 
                          className="form-control" 
                          value={activityTimes[activity.id]} 
                          onChange={(e) => setActivityTimes(prev => ({...prev, [activity.id]: e.target.value}))}
                        />
                      </td>
                      <td>
                        {activityTimes[activity.id] ? (
                          <span className={`badge ${currentPts === 4 ? 'badge-emerald' : currentPts === 2 ? 'badge-amber' : 'badge-rose'}`}>
                            {currentPts} pts
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>--</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <h3 style={{ margin: '1.5rem 0 1rem', fontSize: '1.1rem' }}>Optional Activities</h3>
          {activeOptional.length > 0 && (
            <div className="table-responsive">
              <table className="custom-table" style={{ textAlign: 'left' }}>
                <tbody>
                  {activeOptional.map(activity => {
                    const currentPts = calculatePoints(activity.id, activityTimes[activity.id], config, details.inTemple);
                    const targetTime = getTargetTime(activity.id, config[activity.id].time, details.inTemple);
                  
                  return (
                    <tr key={activity.id}>
                      <td style={{ width: '40%', fontWeight: '500', color: 'var(--text-main)' }}>
                        {activity.label} <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>({targetTime})</span>
                      </td>
                      <td style={{ width: '30%' }}>
                        <input 
                          type="time" 
                          className="form-control" 
                          value={activityTimes[activity.id]} 
                          onChange={(e) => setActivityTimes(prev => ({...prev, [activity.id]: e.target.value}))}
                        />
                      </td>
                      <td style={{ width: '30%' }}>
                        {activityTimes[activity.id] ? (
                          <span className={`badge ${currentPts === 4 ? 'badge-emerald' : currentPts === 2 ? 'badge-amber' : 'badge-rose'}`}>
                            {currentPts} pts
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>--</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          )}

          {currentUser?.status === 'FOLK Resident' && activeCore.some(a => !activityTimes[a.id]) && (
            <div style={{ marginTop: '1.5rem', background: 'rgba(15, 23, 42, 0.8)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-highlight)' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-amber)', display: 'block', marginBottom: '0.5rem' }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }}/> 
                You left some core times blank (Absent). Please select the reason:
              </label>
              <select 
                className="form-control" 
                value={details.absentReason} 
                onChange={(e) => setDetails({...details, absentReason: e.target.value})}
                style={{ width: '100%', maxWidth: '300px' }}
              >
                <option value="">-- Select Reason --</option>
                {ABSENT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}
        </div>
        )}

        <div className="panel">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>
            {currentUser?.status === 'FOLK Resident' ? '2. Daily Details (Compulsory)' : 'Daily Details (Compulsory)'}
          </h3>
          
          <div className="form-grid">
            {currentUser?.status !== 'Beginner' && (
              <>
                <div className="form-group">
                  <label>Previous Night Sleep Time <span style={{color: 'var(--accent-rose)'}}>*</span></label>
                  <input type="time" className="form-control" value={details.sleepTime || ''} onChange={(e) => setDetails({...details, sleepTime: e.target.value})} required/>
                </div>
                <div className="form-group">
                  <label>Wake-up Time <span style={{color: 'var(--accent-rose)'}}>*</span></label>
                  <input type="time" className="form-control" value={details.wakeupTime || ''} onChange={(e) => setDetails({...details, wakeupTime: e.target.value})} required/>
                </div>
              </>
            )}
            <div className="form-group">
              <label>Total Rounds Chanted <span style={{color: 'var(--accent-rose)'}}>*</span></label>
              <input type="number" className="form-control" min="0" placeholder="e.g. 16" value={details.totalRounds || ''} onChange={(e) => setDetails({...details, totalRounds: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Chanting Completion Time {currentUser?.status !== 'Beginner' && <span style={{color: 'var(--accent-rose)'}}>*</span>}</label>
              <input type="time" className="form-control" value={details.chantingCompletionTime || ''} onChange={(e) => setDetails({...details, chantingCompletionTime: e.target.value})} />
            </div>
            {currentUser?.status === 'Non-FOLK Resident' && (
              <div className="form-group">
                <label>Which Book are you reading? <span style={{color: 'var(--accent-rose)'}}>*</span></label>
                <input type="text" className="form-control" placeholder="e.g. Bhagavad Gita" value={details.bookName || ''} onChange={(e) => setDetails({...details, bookName: e.target.value})} required />
              </div>
            )}
            <div className="form-group">
              <label>Reading Duration (Mins) <span style={{color: 'var(--accent-rose)'}}>*</span></label>
              <input type="number" className="form-control" min="0" placeholder="e.g. 45" value={details.readingDuration || ''} onChange={(e) => setDetails({...details, readingDuration: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Total Hearing (Mins) <span style={{color: 'var(--accent-rose)'}}>*</span></label>
              <input type="number" className="form-control" min="0" placeholder="e.g. 30" value={details.hearingDuration || ''} onChange={(e) => setDetails({...details, hearingDuration: e.target.value})} required />
            </div>
            </div>
          </div>
        {errorMsg && (
          <div style={{ color: 'var(--accent-rose)', fontWeight: '600', textAlign: 'right', marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          {saveStatus && <span style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>{saveStatus}</span>}
          <button type="submit" className="nav-btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }} disabled={isLocked && !unlockRequested}>
            <Save size={20} /> Save Entry to Ledger
          </button>
        </div>
      </form>
    </div>
  );
};

export default SadhanaTracker;

