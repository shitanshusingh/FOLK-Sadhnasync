import { useState, useEffect, useRef } from 'react';
import { Home, Calendar, Timer, CheckSquare, Settings, LogOut, Package, Download, Upload, X, User as UserIcon, Bell, Trophy, BookOpen, Cloud } from 'lucide-react';
import folkLogo from './assets/folk_logo.png';
import iskconLogo from './assets/iskcon_logo.png';
import SadhanaTracker from './components/SadhanaTracker';
import Dashboard from './components/Dashboard';
import BucketList from './components/BucketList';
import FocusTimer from './components/FocusTimer';
import Auth from './components/Auth';
import Profile from './components/Profile';
import SettingsModal from './components/SettingsModal';
import Leaderboard from './components/Leaderboard';
import AdminDashboard from './components/AdminDashboard';
import GuideDashboard from './components/GuideDashboard';
import { subDays, format } from 'date-fns';
import { calculatePoints } from './utils/scoring';
import {
  cloudFetchAllUsers, cloudSaveUser, cloudFetchCampaigns, subscribeToCloudUpdates, cloudFetchNotifications, cloudFetchResidencies, cloudSaveResidency
} from './services/firebase';
import { isCloudActive } from './services/firebase';

function App() {
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('sadhana_current_user') || 'null'));
  const [impersonatingUser, setImpersonatingUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [prefilledDate, setPrefilledDate] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [clearedNotifs, setClearedNotifs] = useState(() => JSON.parse(localStorage.getItem('sadhana_cleared_notifs') || '[]'));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fileInputRef = useRef(null);

  // Apply Theme on Load
  useEffect(() => {
    const savedColor = localStorage.getItem('sadhana_theme');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary-amber', savedColor);
      document.documentElement.style.setProperty('--primary-glow', `${savedColor}40`); 
      document.documentElement.style.setProperty('--border-highlight', `${savedColor}66`);
    }

    const savedMode = localStorage.getItem('sadhana_theme_mode');
    if (savedMode === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, []);

  // ☁️ Cloud Startup Sync & Deep Root Real-Time Listeners
  useEffect(() => {
    cloudFetchAllUsers().catch(console.error);
    cloudFetchNotifications().catch(console.error);
    cloudFetchResidencies().then(() => {
      // ONE-TIME MIGRATION: Push local residencies to cloud if not already synced
      const localResidencies = JSON.parse(localStorage.getItem('sadhana_residencies') || '[]');
      localResidencies.forEach(res => {
        cloudSaveResidency(res).catch(console.error);
      });
    }).catch(console.error);

    // DEEP ROOT CONNECT: Real-time Live Sync
    const unsubUsers = subscribeToCloudUpdates('users', (cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        const localUsers = JSON.parse(localStorage.getItem('sadhana_users') || '[]').filter(Boolean);
        const merged = [...cloudUsers];
        localUsers.forEach(lu => {
          if (!merged.find(u => u.email === lu.email)) merged.push(lu);
        });
        localStorage.setItem('sadhana_users', JSON.stringify(merged));
        window.dispatchEvent(new Event('sadhana_live_sync'));
      }
    });

    const unsubNotifs = subscribeToCloudUpdates('notifications', (cloudNotifs) => {
      if (cloudNotifs && cloudNotifs.length > 0) {
        localStorage.setItem('sadhana_notifications', JSON.stringify(cloudNotifs));
        window.dispatchEvent(new Event('sadhana_live_sync'));
      }
    });

    return () => {
      unsubUsers();
      unsubNotifs();
    };
  }, []);

  // Ensure Super Admin exists (only locally if cloud is not active yet)
  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('sadhana_users') || '[]');
    if (!allUsers.find(u => u.email === 'admin@folk.in')) {
      allUsers.push({
        photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        name: 'Super Admin',
        phone: '0000000000',
        email: 'admin@folk.in',
        password: 'admin',
        role: 'admin'
      });
      localStorage.setItem('sadhana_users', JSON.stringify(allUsers));
    }
  }, []);

  useEffect(() => {
    const handleNav = (e) => {
      setCurrentTab('tracker');
      if (e.detail && e.detail.date) {
        setPrefilledDate(e.detail.date);
      }
    };
    window.addEventListener('navigate-to-tracker', handleNav);
    return () => window.removeEventListener('navigate-to-tracker', handleNav);
  }, []);

  // OS-level Notification Logic
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin' || currentUser.role === 'guide') return;
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkAndNotify = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const historyStr = localStorage.getItem(`sadhana_history_${currentUser.email}`);
      let history = [];
      if (historyStr) {
        try { history = JSON.parse(historyStr); } catch(e){}
      }
      
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
      
      const todayEntry = history.find(h => h.date === todayStr);
      const yesterdayEntry = history.find(h => h.date === yesterdayStr);
      
      const isResident = currentUser.status === 'FOLK Resident';
      const isTodayPending = !todayEntry || (isResident ? todayEntry.score === 0 : !todayEntry.details?.totalRounds);
      const isYesterdayPending = !yesterdayEntry || (isResident ? yesterdayEntry.score === 0 : !yesterdayEntry.details?.totalRounds);
      
      const hour = today.getHours();
      
      let message = "";
      if (isYesterdayPending && (isTodayPending && hour >= 12)) {
        message = "Your Sādhana for yesterday and today (past 12:00 PM) is pending!";
      } else if (isYesterdayPending) {
        message = "Your Sādhana for yesterday is still pending!";
      } else if (isTodayPending && hour >= 12) {
        message = "It is past 12:00 PM. Please take a moment to fill your Sādhana for today.";
      }
      
      if (message) {
        const lastNotifiedKey = `sadhana_last_notified_${currentUser.email}`;
        const lastNotifiedTime = localStorage.getItem(lastNotifiedKey);
        const now = today.getTime();
        
        // 2 hours = 2 * 60 * 60 * 1000 = 7200000 ms
        if (!lastNotifiedTime || now - parseInt(lastNotifiedTime, 10) >= 7200000) {
          try {
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification("Sadhana Pending!", {
                body: message
              });
            }
          } catch (e) {
            console.log('Notification API not supported or failed', e);
          }
          localStorage.setItem(lastNotifiedKey, now.toString());
        }
      }
    };

    checkAndNotify();
    // Check frequently enough so we don't miss the 2-hour window
    const intervalId = setInterval(checkAndNotify, 600000); // Every 10 mins
    
    return () => clearInterval(intervalId);
  }, [currentUser]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('sadhana_current_user', JSON.stringify(user));
    // ☁️ Sync user profile to Cloud DB on every login/registration
    cloudSaveUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTab('dashboard');
    localStorage.removeItem('sadhana_current_user');
    setShowLogoutConfirm(false);
  };

  const handleClearNotifications = () => {
    if (notifications.length > 0) {
      const newCleared = [...clearedNotifs, ...notifications.map(n => n.id)];
      setClearedNotifs(newCleared);
      localStorage.setItem('sadhana_cleared_notifs', JSON.stringify(newCleared));
    }
  };

  if (!currentUser) {
    return <Auth onAuthSuccess={handleLogin} />;
  }

  const handleSwitchBackToAdmin = () => {
    const adminUser = JSON.parse(localStorage.getItem('sadhana_users') || '[]').find(u => u.role === 'admin');
    if (adminUser) handleLogin(adminUser);
  };

  if (currentUser.role === 'admin') {
    return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} onLoginAsUser={handleLogin} />;
  }

  if (currentUser.role === 'guide') {
    return (
      <div>
        {currentUser._isImpersonated && (
          <div style={{ background: 'linear-gradient(90deg, #f59e0b, #ea580c)', padding: '0.6rem 1rem', color: '#fff', fontSize: '0.85rem', fontWeight: '800', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 9999 }}>
            <span>⚠️ Super Admin Mode: Viewing as FOLK Guide ({currentUser.name})</span>
            <button onClick={handleSwitchBackToAdmin} style={{ background: '#fff', color: '#ea580c', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>
              ← Return to Super Admin Panel
            </button>
          </div>
        )}
        <GuideDashboard currentUser={currentUser} onLogout={handleLogout} />
      </div>
    );
  }

  // Derive notifications dynamically
  const getNotifications = () => {
    const notifs = [];
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayMonthDay = format(today, 'MM-dd');
    const hour = today.getHours();
    
    // Check if sadhana is filled
    const historyStr = localStorage.getItem(`sadhana_history_${currentUser.email}`);
    let history = [];
    if (historyStr) {
      try { history = JSON.parse(historyStr); } catch(e){}
    }
    const todayEntry = history.find(h => h.date === todayStr);
    
    if (hour >= 12 && (!todayEntry || todayEntry.score === 0)) {
      notifs.push({
        id: `sadhana_pending_${todayStr}`,
        title: 'Sādhana Pending!',
        message: 'It is past 12:00 PM. Please fill your Sādhana for today.',
        type: 'warning'
      });
    }

    // Dynamic Birthday Notifications
    const allUsers = JSON.parse(localStorage.getItem('sadhana_users') || '[]');
    allUsers.forEach(u => {
      if (u.email !== currentUser.email && u.guide === currentUser.guide && u.residency === currentUser.residency && u.dob) {
        // dob format: YYYY-MM-DD
        const userDob = u.dob.substring(5); // gets MM-DD
        if (userDob === todayMonthDay) {
          notifs.push({
            id: `bday_${u.email}_${todayStr}`,
            title: `🎉 ${u.name}'s Birthday!`,
            message: `Today is ${u.name}'s birthday! Wish them well.`,
            type: 'info'
          });
        }
      }
    });

    // Global Broadcasts
    const broadcasts = JSON.parse(localStorage.getItem('sadhana_global_broadcasts') || '[]');
    broadcasts.forEach(b => {
      notifs.push({
        id: b.id,
        title: `📢 ${b.sender} Broadcast`,
        message: b.message,
        type: 'info'
      });
    });

    // Cloud Personal Notifications
    const cloudNotifs = JSON.parse(localStorage.getItem('sadhana_notifications') || '[]');
    cloudNotifs.forEach(n => {
      if (n.target === currentUser.email) {
        notifs.push(n);
      }
    });

    // Filter out cleared notifications
    return notifs.filter(n => !clearedNotifs.includes(n.id));
  };

  const notifications = getNotifications();

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard currentUser={activeUser} setActiveTab={setCurrentTab} setPrefilledDate={setPrefilledDate} />;
      case 'tracker':
        return <SadhanaTracker currentUser={activeUser} prefilledDate={prefilledDate} />;
      case 'goals':
        return <BucketList currentUser={activeUser} />;
      case 'timer':
        return <FocusTimer currentUser={activeUser} />;
      case 'leaderboard':
        return <Leaderboard currentUser={activeUser} />;
      case 'admin_dashboard':
        return <AdminDashboard currentUser={currentUser} onImpersonate={handleImpersonate} />;
      case 'guide_dashboard':
        return <GuideDashboard currentUser={activeUser} onImpersonate={handleImpersonate} />;
      default:
        return null;
    }
  };

  const handleImpersonate = (user) => {
    setImpersonatingUser(user);
    setCurrentTab(user.role === 'guide' ? 'guide_dashboard' : 'dashboard');
  };

  const activeUser = impersonatingUser || currentUser;

  return (
    <div className="app-container">
      {/* 🔴 GOD MODE BANNER */}
      {impersonatingUser && (
        <div style={{
          background: '#ef4444', color: 'white', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontWeight: 'bold', zIndex: 9999, position: 'sticky', top: 0, boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye size={20} />
            LIVE MONITOR: You are viewing & editing as {impersonatingUser.name} ({impersonatingUser.role})
          </div>
          <button onClick={() => { setImpersonatingUser(null); setCurrentTab('dashboard'); }} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold'
          }}>
            Exit Live View
          </button>
        </div>
      )}

      {/* Background glow effects */}
      <div className="glow-sphere" style={{ top: '-10%', left: '-10%' }}></div>
      <div className="glow-sphere" style={{ bottom: '-20%', right: '-10%', background: 'var(--accent-blue)', opacity: 0.08 }}></div>
      
      <header className="navbar">
        <div className="nav-content">
          <div className="brand" onClick={() => setCurrentTab('dashboard')} style={{ cursor: 'pointer' }}>
            <img src={folkLogo} alt="FOLK Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 15px rgba(245,158,11,0.4)' }} />
            <div className="brand-text">
              <h1>FOLK SadhnaSync</h1>
              <p>ISKCON BHADAJ, AHMEDABAD • <span style={{color: impersonatingUser ? '#ef4444' : 'var(--accent-blue)'}}>● {activeUser.name} {impersonatingUser ? '(Live View)' : ''}</span></p>
            </div>
          </div>

          <div className="nav-actions">
            <button className="nav-btn btn-primary" onClick={() => setCurrentTab('tracker')}>
              <Package size={16} /> Fill Tracker
            </button>
            <button className="nav-btn btn-indigo" onClick={() => setCurrentTab('goals')}>
              <CheckSquare size={16} /> Bucket List
            </button>

            {/* Notifications Button */}
            <div style={{ position: 'relative' }}>
              <button className="nav-btn btn-secondary" style={{ position: 'relative' }} onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>

            {/* User Profile Button */}
            <button className="nav-btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%', overflow: 'hidden', border: impersonatingUser ? '2px solid #ef4444' : 'none' }} onClick={() => setShowProfile(true)}>
              {activeUser.photo ? (
                <img src={activeUser.photo} alt="Profile" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <UserIcon size={18} />
              )}
            </button>

            <button className="nav-btn btn-secondary" onClick={() => setShowSettings(true)}>
              <Settings size={18} />
            </button>

            {/* ☁️ Tiny Cloud Sync Status Indicator */}
            <div title={isCloudActive ? 'Cloud Connected ⚡ plk-sadhnasync' : 'Offline Mode'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '32px', height: '32px', cursor: 'default' }}>
              <Cloud size={16} style={{ color: isCloudActive ? '#10b981' : '#f43f5e', opacity: 0.9 }} />
              <span style={{
                position: 'absolute',
                bottom: '3px',
                right: '3px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isCloudActive ? '#10b981' : '#f43f5e',
                border: '1.5px solid var(--bg-main)',
                animation: isCloudActive ? 'cloud-pulse 1.8s ease-in-out infinite' : 'none'
              }} />
            </div>
            <style>{`
              @keyframes cloud-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.3; transform: scale(0.6); }
              }
            `}</style>

            <button className="nav-btn btn-rose" style={{ padding: '0.6rem' }} onClick={() => setShowLogoutConfirm(true)}>
              <LogOut size={18} />
            </button>
            {/* Logout Confirm Dialog (Fixed position for mobile) */}
            {showLogoutConfirm && (
              <div onClick={e => e.stopPropagation()} className="animate-fade-in" style={{ position: 'fixed', top: '70px', right: '15px', width: '220px', background: '#0f172a', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '14px', padding: '1rem', boxShadow: '0 15px 35px rgba(0,0,0,0.6)', zIndex: 9999, textAlign: 'center' }}>
                <p style={{ color: '#f8fafc', margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'normal', lineHeight: '1.4' }}>Are you sure you want to log out?</p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button onClick={(e) => { e.stopPropagation(); setShowLogoutConfirm(false); }} className="nav-btn" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                  <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="nav-btn" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', background: '#f43f5e', border: 'none', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Yes</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="tabs-bar">
        <div className="tabs-container">
          <button className={`tab-item ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentTab('dashboard')}>
            <Calendar size={18} /> <span>Dashboard</span>
          </button>
          <button className={`tab-item ${currentTab === 'tracker' ? 'active' : ''}`} onClick={() => setCurrentTab('tracker')}>
            <Home size={18} /> <span>Entry</span>
          </button>
          <button className={`tab-item ${currentTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setCurrentTab('leaderboard')}>
            <Trophy size={18} /> <span>Rankings</span>
          </button>
          <button className={`tab-item ${currentTab === 'goals' ? 'active' : ''}`} onClick={() => setCurrentTab('goals')}>
            <CheckSquare size={18} /> <span>Goals</span>
          </button>
          <button className={`tab-item ${currentTab === 'timer' ? 'active' : ''}`} onClick={() => setCurrentTab('timer')}>
            <Timer size={18} /> <span>Timer</span>
          </button>
        </div>
      </nav>

      <main className="main-content">
        {renderContent()}
      </main>

      <footer style={{
        marginTop: '3rem',
        padding: '1.5rem 2rem',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(11, 17, 30, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justify: 'center',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <img src={folkLogo} alt="FOLK Logo" style={{ height: '42px', objectFit: 'contain' }} />
          <img src={iskconLogo} alt="ISKCON Logo" style={{ height: '42px', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
          © 2026 All rights reserved | ISKCON Bhadaj, Ahmedabad | Managed by FOLK
        </p>
      </footer>

      {/* Notifications Modal (Moved to root to prevent clipping) */}
      {showNotifications && (
        <>
          <div onClick={() => setShowNotifications(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }} />
          <div onClick={e => e.stopPropagation()} className="animate-fade-in" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90vw', maxWidth: '350px', background: 'var(--bg-card)', border: '1px solid var(--border-highlight)', borderRadius: '16px', padding: '1.2rem', boxShadow: '0 15px 35px rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, color: 'var(--text-main)' }}>Notifications</h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                {notifications.length > 0 && (
                  <button onClick={handleClearNotifications} style={{ background: 'none', border: 'none', color: 'var(--primary-amber)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Clear All</button>
                )}
                <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
              </div>
            </div>
            
            {notifications.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No new notifications.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{ background: 'var(--bg-main)', padding: '0.8rem', borderRadius: '8px', borderLeft: `3px solid ${n.type === 'warning' ? '#f59e0b' : '#3b82f6'}` }}>
                    <h5 style={{ margin: '0 0 0.3rem 0', color: 'var(--text-main)', fontSize: '0.95rem' }}>{n.title}</h5>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          user={currentUser} 
          onClose={() => setShowSettings(false)} 
          onLogout={handleLogout} 
        />
      )}

      {/* Profile Modal */}
      {showProfile && (
        <Profile user={currentUser} onClose={() => setShowProfile(false)} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
