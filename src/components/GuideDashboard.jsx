import React, { useState, useEffect } from 'react';
import {
  Users, Building2, Flag, Send, CheckSquare, BarChart2,
  LogOut, Download, TrendingUp, Award, BookOpen, Target,
  MessageSquare, Bell, Home, Star, ArrowLeft, X, Save,
  Calendar, Activity, List, Plus, Trash2, CheckCircle, Clock,
  Filter, Gift, AlertCircle, ShieldAlert, Trophy
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subDays } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import folkLogo from '../assets/folk_logo.png';
import iskconLogo from '../assets/iskcon_logo.png';
import { generateSadhanaPDFReport } from '../utils/pdfGenerator';
import { cloudSaveResidency, cloudSaveCampaign, cloudSaveUser, cloudFetchAllUsers } from '../services/firebase';

// Import all Devotee App Components so Guide can view the full App Experience for any boy!
import Dashboard from './Dashboard';
import SadhanaTracker from './SadhanaTracker';
import Leaderboard from './Leaderboard';
import BucketList from './BucketList';
import FocusTimer from './FocusTimer';

const TABS = [
  { id: 'overview', label: 'Overview & Analytics', icon: Home },
  { id: 'devotees', label: 'Devotee Directory', icon: Users },
  { id: 'campaigns', label: 'Campaign Manager', icon: Flag },
  { id: 'push_bucket', label: 'Push to Bucket List', icon: CheckSquare },
  { id: 'targeted_msg', label: 'Targeted Broadcast', icon: Send },
  { id: 'residencies', label: 'Manage Residencies', icon: Building2 },
];

const SCORE_COLOR = s => s >= 16 ? '#10b981' : s >= 10 ? '#f59e0b' : '#ef4444';
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div style={{ background: 'var(--bg-card)', border: `1px solid ${color}30`, borderTop: `3px solid ${color}`, borderRadius: '16px', padding: '1.2rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 0.4rem 0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <div style={{ fontSize: '1.9rem', fontWeight: '800', color }}>{value}</div>
        {sub && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.3rem 0 0 0' }}>{sub}</p>}
      </div>
      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
    </div>
  </div>
);

const GuideDashboard = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [allUsers, setAllUsers] = useState([]);
  const [myDevotees, setMyDevotees] = useState([]);
  const [residencies, setResidencies] = useState([]);
  
  // Cascading Filters
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'FOLK Resident' | 'Non-FOLK Resident' | 'Beginner'
  const [selectedResidency, setSelectedResidency] = useState('all'); // shown only if selectedStatus === 'FOLK Resident'

  // Selected devotee for inspection
  const [selectedDevotee, setSelectedDevotee] = useState(null);
  const [devoteeTab, setDevoteeTab] = useState('dashboard'); // 'dashboard' | 'tracker' | 'leaderboard' | 'bucket' | 'timer'

  // Campaign Manager states
  const [campaigns, setCampaigns] = useState([]);
  const [newCampaign, setNewCampaign] = useState({
    title: '', festival: '', startDate: '', endDate: '', rules: '',
    ekadashiDates: '', enableEkadashi2x: true,
    prize1st: '', prize2nd: '', prize3rd: '', prizeConsolation: '', target: 'all'
  });

  // Targeted messaging state
  const [msgTargetType, setMsgTargetType] = useState('all'); // 'all' | 'individual' | 'residency' | 'status'
  const [msgTargetValue, setMsgTargetValue] = useState('');
  const [messageText, setMessageText] = useState('');

  // Push bucket list state
  const [bucketPushTargetType, setBucketPushTargetType] = useState('all');
  const [bucketPushTargetValue, setBucketPushTargetValue] = useState('');
  const [bucketCategory, setBucketCategory] = useState('seva');
  const [bucketItemTitle, setBucketItemTitle] = useState('');
  const [bucketItemRemark, setBucketItemRemark] = useState('');

  // New residency state
  const [newResidencyName, setNewResidencyName] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [clearedNotifs, setClearedNotifs] = useState(() => JSON.parse(localStorage.getItem(`sadhana_cleared_notifs_${currentUser.email}`) || '[]'));

  useEffect(() => {
    refreshData();
    
    // DEEP ROOT CONNECT: Listen for real-time live sync events from Firebase
    const handleLiveSync = () => refreshData();
    window.addEventListener('sadhana_live_sync', handleLiveSync);

    return () => {
      window.removeEventListener('sadhana_live_sync', handleLiveSync);
    };
  }, [currentUser]);

  const refreshData = () => {
    const users = JSON.parse(localStorage.getItem('sadhana_users') || '[]').filter(Boolean);
    setAllUsers(users);
    const mine = users.filter(u => u && u.guide === currentUser.name && u.role !== 'guide' && u.role !== 'admin');
    setMyDevotees(mine);

    const res = JSON.parse(localStorage.getItem('sadhana_residencies') || '[]').filter(r => r.guide === currentUser.name);
    setResidencies(res);

    let camps = JSON.parse(localStorage.getItem(`guide_campaigns_${currentUser.email}`) || '[]');
    setCampaigns(camps);

    // Fetch Notifications for this Guide
    const allNotifs = JSON.parse(localStorage.getItem('sadhana_notifications') || '[]');
    const myNotifs = allNotifs.filter(n => n.target === currentUser.name || n.target === currentUser.email);
    setNotifications(myNotifs);
  };

  const handleClearNotifications = () => {
    if (notifications.length > 0) {
      const newCleared = [...clearedNotifs, ...notifications.map(n => n.id)];
      setClearedNotifs(newCleared);
      localStorage.setItem(`sadhana_cleared_notifs_${currentUser.email}`, JSON.stringify(newCleared));
    }
  };

  const showStatus = (msg) => { setStatusMsg(msg); setTimeout(() => setStatusMsg(''), 3000); };

  // Cascading Filter Logic: Category First → If 'FOLK Resident' selected → Residency Filter
  const filteredDevotees = myDevotees.filter(d => {
    const matchStatus = selectedStatus === 'all' || d.status === selectedStatus;
    const matchResidency = (selectedStatus !== 'FOLK Resident') || (selectedResidency === 'all' || d.residency === selectedResidency);
    return matchStatus && matchResidency;
  });

  // Compute stats for each devotee
  const getDevoteeStats = (email) => {
    const hist = JSON.parse(localStorage.getItem(`sadhana_history_${email}`) || '[]');
    if (!hist.length) return { avg: 0, streak: 0, total: 0, last7: 0, trend: 'stable' };
    const sorted = [...hist].sort((a, b) => b.date.localeCompare(a.date));
    const avg = Math.round(hist.reduce((s, h) => s + (h.score || 0), 0) / hist.length);
    const last7 = sorted.slice(0, 7).reduce((s, h) => s + (h.score || 0), 0) / 7;
    const prev7 = sorted.slice(7, 14).reduce((s, h) => s + (h.score || 0), 0) / 7;
    let streak = 0;
    for (const h of sorted) { if ((h.score || 0) > 0) streak++; else break; }
    return { avg, streak, total: hist.length, last7: Math.round(last7), trend: last7 > prev7 ? 'up' : 'down' };
  };

  // Inspect a devotee
  const selectDevotee = (devotee) => {
    setSelectedDevotee(devotee);
    setDevoteeTab('dashboard');
  };

  // One-click PDF download
  const downloadDevoteePDF = (devotee) => {
    const hist = JSON.parse(localStorage.getItem(`sadhana_history_${devotee.email}`) || '[]');
    generateSadhanaPDFReport({
      devotee,
      history: hist,
      guideName: currentUser.name
    });
    showStatus(`PDF Downloaded for ${devotee.name}!`);
  };

  // Target Broadcast Handler
  const handleSendTargetedMessage = (e) => {
    e.preventDefault();
    if (!messageText) return;

    let recipients = [];
    if (msgTargetType === 'all') recipients = myDevotees;
    else if (msgTargetType === 'individual') recipients = myDevotees.filter(d => d.email === msgTargetValue);
    else if (msgTargetType === 'residency') recipients = myDevotees.filter(d => d.residency === msgTargetValue);
    else if (msgTargetType === 'status') recipients = myDevotees.filter(d => d.status === msgTargetValue);

    if (!recipients.length) { showStatus('No recipients found for this target.'); return; }

    const broadcasts = JSON.parse(localStorage.getItem('sadhana_global_broadcasts') || '[]');
    recipients.forEach(r => {
      broadcasts.push({
        id: `msg_${Date.now()}_${Math.random()}`,
        message: `📢 Guide ${currentUser.name}: ${messageText}`,
        date: new Date().toISOString(),
        sender: currentUser.name,
        targetEmail: r.email
      });
    });

    localStorage.setItem('sadhana_global_broadcasts', JSON.stringify(broadcasts));
    setMessageText('');
    showStatus(`Message sent to ${recipients.length} devotee(s)!`);
  };

  // Push to Bucket List Handler
  const handlePushBucketItem = (e) => {
    e.preventDefault();
    if (!bucketItemTitle) return;

    let recipients = [];
    if (bucketPushTargetType === 'all') recipients = myDevotees;
    else if (bucketPushTargetType === 'individual') recipients = myDevotees.filter(d => d.email === bucketPushTargetValue);
    else if (bucketPushTargetType === 'residency') recipients = myDevotees.filter(d => d.residency === bucketPushTargetValue);
    else if (bucketPushTargetType === 'status') recipients = myDevotees.filter(d => d.status === bucketPushTargetValue);

    if (!recipients.length) { showStatus('No devotees selected.'); return; }

    recipients.forEach(dev => {
      const bucketKey = `sadhana_bucket_list_${dev.email}`;
      const goals = JSON.parse(localStorage.getItem(bucketKey) || '{"seva":[],"topics":[],"books":[]}');
      const list = goals[bucketCategory] || [];
      list.push({
        id: `guide_task_${Date.now()}_${Math.random()}`,
        title: bucketItemTitle,
        status: 'todo',
        addedByGuide: true,
        remark: bucketItemRemark || `Assigned by ${currentUser.name} (Priority)`
      });
      goals[bucketCategory] = list;
      localStorage.setItem(bucketKey, JSON.stringify(goals));
    });

    setBucketItemTitle('');
    setBucketItemRemark('');
    showStatus(`Pushed priority task to ${recipients.length} devotee(s) bucket list!`);
  };

  // Campaign Creator
  const handleCreateCampaign = (e) => {
    e.preventDefault();
    if (!newCampaign.title) return;

    const campObj = {
      id: `camp_${Date.now()}`,
      ...newCampaign,
      guide: currentUser.name,
      guideEmail: currentUser.email,
      createdDate: new Date().toISOString(),
      enrolledDevotees: [], // array of enrolled emails
      status: 'Active'
    };

    // Guide's campaigns list
    const updated = [...campaigns, campObj];
    setCampaigns(updated);
    localStorage.setItem(`guide_campaigns_${currentUser.email}`, JSON.stringify(updated));

    // Global campaigns store for devotees to fetch
    const globalCamps = JSON.parse(localStorage.getItem('sadhana_campaigns') || '[]');
    globalCamps.push(campObj);
    localStorage.setItem('sadhana_campaigns', JSON.stringify(globalCamps));

    // ☁️ Sync campaign to Cloud DB
    cloudSaveCampaign(campObj);

    // Broadcast Notifications to all targeted devotees
    let recipients = myDevotees;
    if (newCampaign.target !== 'all') {
      recipients = myDevotees.filter(d => d.status === newCampaign.target);
    }

    const broadcasts = JSON.parse(localStorage.getItem('sadhana_global_broadcasts') || '[]');
    recipients.forEach(dev => {
      // 1. Initial Campaign Launch Notification
      broadcasts.push({
        id: `camp_notif_launch_${Date.now()}_${Math.random()}`,
        message: `🏆 NEW CAMPAIGN: "${newCampaign.title}" (${newCampaign.festival || 'Festival'}) starting ${newCampaign.startDate || 'soon'}! Open your dashboard to ACCEPT and join the Campaign Leaderboard!`,
        date: new Date().toISOString(),
        sender: currentUser.name,
        targetEmail: dev.email,
        campaignId: campObj.id
      });
      // 2. 1-Day Reminder Notification
      broadcasts.push({
        id: `camp_notif_rem_${Date.now()}_${Math.random()}`,
        message: `⏰ REMINDER: Campaign "${newCampaign.title}" is launching! Accept your Guide's invitation now to participate and win prizes!`,
        date: new Date().toISOString(),
        sender: currentUser.name,
        targetEmail: dev.email,
        campaignId: campObj.id
      });
    });

    localStorage.setItem('sadhana_global_broadcasts', JSON.stringify(broadcasts));

    setNewCampaign({
      title: '', festival: '', startDate: '', endDate: '', rules: '',
      ekadashiDates: '', enableEkadashi2x: true,
      prize1st: '', prize2nd: '', prize3rd: '', prizeConsolation: '', target: 'all'
    });
    showStatus(`Campaign "${campObj.title}" launched with Ekadashi 2X Multiplier enabled!`);
  };

  // Create Residency
  const handleCreateResidency = (e) => {
    e.preventDefault();
    if (!newResidencyName) return;
    const all = JSON.parse(localStorage.getItem('sadhana_residencies') || '[]');
    const newRes = { id: `res_${Date.now()}`, name: newResidencyName, guide: currentUser.name };
    all.push(newRes);
    localStorage.setItem('sadhana_residencies', JSON.stringify(all));
    cloudSaveResidency(newRes);
    setResidencies([...residencies, newRes]);
    setNewResidencyName('');
    showStatus('Residency created successfully!');
  };

  // Leaderboard data calculation
  const leaderboard = [...filteredDevotees].map(d => ({
    ...d,
    ...getDevoteeStats(d.email)
  })).sort((a, b) => b.avg - a.avg);

  const overallAvg = leaderboard.length ? Math.round(leaderboard.reduce((s, d) => s + d.avg, 0) / leaderboard.length) : 0;
  const topPerformer = leaderboard[0];
  const totalResidents = myDevotees.filter(d => d.status === 'FOLK Resident').length;
  const totalNonResidents = myDevotees.filter(d => d.status === 'Non-FOLK Resident').length;
  const totalBeginners = myDevotees.filter(d => d.status === 'Beginner').length;

  // Chart data 14 days
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const label = format(d, 'dd MMM');
    let totalScore = 0, count = 0;
    filteredDevotees.forEach(dev => {
      const hist = JSON.parse(localStorage.getItem(`sadhana_history_${dev.email}`) || '[]');
      const entry = hist.find(h => h.date === dateStr);
      if (entry) { totalScore += entry.score || 0; count++; }
    });
    return { date: label, avgScore: count ? Math.round(totalScore / count) : 0 };
  });

  const chartTooltipStyle = { background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: '#f8fafc', fontFamily: "'Outfit', 'Inter', sans-serif" }}>

      {/* Toast Notification */}
      {statusMsg && (
        <div className="animate-fade-in" style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, padding: '0.9rem 1.5rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '12px', color: '#10b981', fontWeight: '700', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={16} /> {statusMsg}
        </div>
      )}

      {/* Header */}
      <header style={{ background: 'rgba(11,17,30,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0.9rem 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {selectedDevotee ? (
              <button onClick={() => setSelectedDevotee(null)} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                <ArrowLeft size={18} /> Back to Guide Portal
              </button>
            ) : (
              <img src={folkLogo} alt="FOLK Logo" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 15px rgba(245,158,11,0.4)' }} />
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc' }}>
                {selectedDevotee ? `Devotee Portal View: ${selectedDevotee.name}` : 'FOLK Guide Portal'}
              </h1>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                {currentUser.name} · {myDevotees.length} Total Devotees ({totalResidents} Residents, {totalNonResidents} Non-Residents, {totalBeginners} Beginners)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
            {selectedDevotee && (
              <button onClick={() => downloadDevoteePDF(selectedDevotee)} style={{ padding: '0.55rem 1rem', borderRadius: '10px', border: 'none', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'inherit', fontSize: '0.85rem' }}>
                <Download size={16} /> Download PDF
              </button>
            )}

            <button onClick={() => setShowLogoutConfirm(true)} style={{ padding: '0.55rem 1.2rem', borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'inherit', fontSize: '0.85rem' }}>
              <LogOut size={16} /> Logout
            </button>

            {/* Logout Confirm Dialog */}
            {showLogoutConfirm && (
              <div onClick={e => e.stopPropagation()} className="guide-logout-modal animate-fade-in" style={{ position: 'absolute', top: '120%', right: 0, width: '250px', background: 'var(--bg-card)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 200, textAlign: 'center' }}>
                <p style={{ color: '#f8fafc', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>Are you sure you want to log out?</p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button onClick={() => setShowLogoutConfirm(false)} className="nav-btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Cancel</button>
                  <button onClick={onLogout} className="nav-btn btn-rose" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 'bold' }}>Yes, Logout</button>
                </div>
              </div>
            )}

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={{ padding: '0.55rem', borderRadius: '50%', border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', color: '#f8fafc', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} />
                {notifications.filter(n => !clearedNotifs.includes(n.id)).length > 0 && (
                  <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {notifications.filter(n => !clearedNotifs.includes(n.id)).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ CASCADING FILTER CONTROL BAR (Category First → If Resident, show Residency Filter) ═══ */}
      {!selectedDevotee && (
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0.8rem 2rem' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontWeight: '700', fontSize: '0.88rem' }}>
              <Filter size={16} /> Filter Boys:
            </div>

            {/* STEP 1: Devotee Category Filter (All, Resident, Non-Resident, Beginner) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Category:</span>
              <select
                value={selectedStatus}
                onChange={e => {
                  setSelectedStatus(e.target.value);
                  if (e.target.value !== 'FOLK Resident') setSelectedResidency('all');
                }}
                className="form-control"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', borderRadius: '8px', minWidth: '170px', borderColor: selectedStatus !== 'all' ? '#f59e0b' : 'var(--border-subtle)' }}
              >
                <option value="all">1. All Devotees ({myDevotees.length})</option>
                <option value="FOLK Resident">2. FOLK Resident ({totalResidents})</option>
                <option value="Non-FOLK Resident">3. Non-FOLK Resident ({totalNonResidents})</option>
                <option value="Beginner">4. Beginner ({totalBeginners})</option>
              </select>
            </div>

            {/* STEP 2: IF FOLK Resident selected → Show Residency Filter dropdown */}
            {selectedStatus === 'FOLK Resident' && (
              <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)' }}>
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '700' }}>Select Residency:</span>
                <select value={selectedResidency} onChange={e => setSelectedResidency(e.target.value)} className="form-control" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px', minWidth: '160px', background: '#0b1120' }}>
                  <option value="all">All Residencies</option>
                  {residencies.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
            )}

            <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#94a3b8' }}>
              Showing <strong style={{ color: '#f59e0b', fontSize: '0.95rem' }}>{filteredDevotees.length}</strong> boys
            </div>
          </div>
        </div>
      )}

      {/* Sub Navigation Tabs */}
      {!selectedDevotee && (
        <div style={{ background: 'rgba(11,17,30,0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', display: 'flex', gap: '0.3rem' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                padding: '0.9rem 1.2rem', border: 'none', background: 'transparent',
                borderBottom: activeTab === id ? '3px solid #f59e0b' : '3px solid transparent',
                color: activeTab === id ? '#f59e0b' : '#64748b',
                fontWeight: activeTab === id ? '700' : '500',
                cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.88rem',
                display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 2rem 4rem' }}>

        {/* ═══ DEVOTEE FULL APP VIEW (Guide can view ALL 5 TABS of the selected boy!) ═══ */}
        {selectedDevotee && (
          <div className="animate-fade-in">
            {/* Guide Control Header for this boy */}
            <div style={{ padding: '0.8rem 1.2rem', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '14px', marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <img src={selectedDevotee.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDevotee.name}`} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f59e0b' }} />
                <div>
                  <div style={{ color: '#f8fafc', fontWeight: '800', fontSize: '1rem' }}>
                    Devotee Portal: {selectedDevotee.name}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                    Category: <strong style={{ color: '#f59e0b' }}>{selectedDevotee.status}</strong> · Residency: {selectedDevotee.residency || 'Non-Resident'}
                  </div>
                </div>
              </div>

              {/* Direct Remark & Priority Task Modal triggers */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button onClick={() => downloadDevoteePDF(selectedDevotee)} className="badge badge-emerald" style={{ padding: '0.5rem 0.8rem', cursor: 'pointer' }}>
                  <Download size={14} style={{ marginRight: '4px' }} /> PDF Report
                </button>
                <button onClick={() => setSelectedDevotee(null)} className="badge badge-amber" style={{ padding: '0.5rem 0.8rem', cursor: 'pointer' }}>
                  Exit Boy View
                </button>
              </div>
            </div>

            {/* Boy Portal Navigation Bar (All 5 Tabs available to Guide!) */}
            <nav className="tabs-bar" style={{ borderRadius: '12px', marginBottom: '1.5rem', background: '#0b1120' }}>
              <div className="tabs-container">
                <button className={`tab-item ${devoteeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setDevoteeTab('dashboard')}>
                  <Calendar size={16} /> 1. Analytics & Dashboard
                </button>
                <button className={`tab-item ${devoteeTab === 'tracker' ? 'active' : ''}`} onClick={() => setDevoteeTab('tracker')}>
                  <Home size={16} /> 2. Sadhana Entry (Filling View)
                </button>
                <button className={`tab-item ${devoteeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setDevoteeTab('leaderboard')}>
                  <Trophy size={16} /> 3. Leaderboard
                </button>
                <button className={`tab-item ${devoteeTab === 'bucket' ? 'active' : ''}`} onClick={() => setDevoteeTab('bucket')}>
                  <CheckSquare size={16} /> 4. Bucket List
                </button>
                <button className={`tab-item ${devoteeTab === 'timer' ? 'active' : ''}`} onClick={() => setDevoteeTab('timer')}>
                  <Clock size={16} /> 5. Focus Timer
                </button>
              </div>
            </nav>

            {/* Tab Contents for this Boy */}
            {devoteeTab === 'dashboard' && <Dashboard currentUser={selectedDevotee} setActiveTab={() => {}} setPrefilledDate={() => {}} />}
            {devoteeTab === 'tracker' && <SadhanaTracker currentUser={selectedDevotee} prefilledDate={null} />}
            {devoteeTab === 'leaderboard' && <Leaderboard currentUser={selectedDevotee} />}
            {devoteeTab === 'bucket' && <BucketList currentUser={selectedDevotee} />}
            {devoteeTab === 'timer' && <FocusTimer currentUser={selectedDevotee} />}
          </div>
        )}

        {/* ═══ OVERVIEW & ANALYTICS TAB ═══ */}
        {!selectedDevotee && activeTab === 'overview' && (
          <div className="animate-fade-in">
            {/* KPI Row */}
            <div className="guide-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <StatCard label="Filtered Devotees" value={filteredDevotees.length} icon={Users} color="#f59e0b" sub={`${totalResidents} Residents · ${totalNonResidents} Non-Res · ${totalBeginners} Beginners`} />
              <StatCard label="Group Avg Score" value={`${overallAvg}/20`} icon={Star} color="#10b981" sub="30-day average score" />
              <StatCard label="Top Performer" value={topPerformer?.name?.split(' ')[0] || '—'} icon={Award} color="#8b5cf6" sub={topPerformer ? `${topPerformer.avg}/20 avg score` : ''} />
              <StatCard label="Active Residencies" value={residencies.length} icon={Building2} color="#3b82f6" sub={selectedResidency === 'all' ? 'All active residencies' : selectedResidency} />
            </div>

            {/* Charts Row */}
            <div className="guide-charts-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="panel">
                <h3 className="panel-title" style={{ marginBottom: '1.2rem' }}>📈 Group Average Score (Last 14 Days)</h3>
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={last14Days}>
                    <defs>
                      <linearGradient id="grpScoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area type="monotone" dataKey="avgScore" stroke="#f59e0b" fill="url(#grpScoreGrad)" strokeWidth={2.5} dot={false} name="Avg Score" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Devotees Category Breakdown */}
              <div className="panel">
                <h3 className="panel-title" style={{ marginBottom: '1.2rem' }}>📊 Boys Category Split</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  {[
                    { label: 'FOLK Residents', count: totalResidents, color: '#10b981', total: myDevotees.length },
                    { label: 'Non-FOLK Residents', count: totalNonResidents, color: '#3b82f6', total: myDevotees.length },
                    { label: 'Beginners', count: totalBeginners, color: '#f59e0b', total: myDevotees.length },
                  ].map(item => {
                    const pct = Math.round((item.count / Math.max(item.total, 1)) * 100);
                    return (
                      <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                          <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{item.label}</span>
                          <span style={{ color: item.color, fontWeight: '700' }}>{item.count} boys ({pct}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Devotee Leaderboard */}
            <div className="panel">
              <div className="panel-header">
                <h3 className="panel-title">🏆 Devotee Leaderboard ({filteredDevotees.length} Boys)</h3>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Click any boy to view complete dashboard & report</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {leaderboard.map((d, i) => (
                  <div key={d.email} onClick={() => selectDevotee(d)} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.9rem 1rem', borderRadius: '12px',
                    background: i < 3 ? `${RANK_COLORS[i]}10` : 'var(--bg-input)',
                    border: `1px solid ${i < 3 ? RANK_COLORS[i] + '30' : 'var(--border-subtle)'}`,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${RANK_COLORS[i % RANK_COLORS.length]}20`, display: 'flex', alignItems: 'center', justify: 'center', fontWeight: '800', color: RANK_COLORS[i % RANK_COLORS.length], fontSize: '0.9rem', flexShrink: 0 }}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                    </div>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={d.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span className={`badge ${d.status === 'FOLK Resident' ? 'badge-emerald' : (d.status === 'Non-FOLK Resident' ? 'badge-blue' : 'badge-amber')}`} style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                          {d.status}
                        </span>
                        {d.residency && ` • ${d.residency}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <div style={{ textAlign: 'center', minWidth: '40px' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: SCORE_COLOR(d.avg) }}>{d.avg}/20</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Avg Score</div>
                      </div>
                      <div style={{ textAlign: 'center', minWidth: '40px' }}>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#3b82f6' }}>{d.streak}d</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Streak</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <button onClick={(e) => { e.stopPropagation(); downloadDevoteePDF(d); }} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(16,185,129,0.15)', color: '#10b981', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', fontFamily: 'inherit' }}>
                          PDF
                        </button>
                      </div>
                    </div>                </button>
                      </div>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No devotees match the selected filter.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ═══ DEVOTEES DIRECTORY TAB ═══ */}
        {!selectedDevotee && activeTab === 'devotees' && (
          <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {filteredDevotees.map(d => {
                const stats = getDevoteeStats(d.email);
                return (
                  <div key={d.email} onClick={() => selectDevotee(d)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.2rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b50'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${SCORE_COLOR(stats.avg)}`, flexShrink: 0 }}>
                        <img src={d.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{d.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '600' }}>{d.status}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.residency || 'Non-Resident'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: SCORE_COLOR(stats.avg) }}>{stats.avg}/20</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Avg Score</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0 0 0', borderTop: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: '700' }}>🔥 {stats.streak}d Streak</span>
                      <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: '700', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); downloadDevoteePDF(d); }}>📥 PDF Report</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ CAMPAIGN MANAGER TAB ═══ */}
        {!selectedDevotee && activeTab === 'campaigns' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Create Campaign Panel */}
            <div className="panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 className="panel-title" style={{ margin: 0, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flag size={20} /> Launch New Sādhana Campaign
                </h3>
                {/* 1-Click Ekadashi Preset Button */}
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = format(new Date(), 'yyyy-MM-dd');
                    setNewCampaign({
                      title: '✨ Ekadashi Special 2X Sādhana Marathon',
                      festival: 'Ekadashi Mahotsav',
                      startDate: todayStr,
                      endDate: todayStr,
                      target: 'all',
                      enableEkadashi2x: true,
                      ekadashiDates: todayStr,
                      rules: '1. Complete 16+ rounds today before 8:00 AM\n2. Mandatory Mangala Aarti & Srimad Bhagavatam Class\n3. Earn 2X DOUBLE POINTS on all sadhana logged today!',
                      prize1st: '', prize2nd: '', prize3rd: '', prizeConsolation: ''
                    });
                  }}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: '10px',
                    border: '1px solid #10b981',
                    background: 'rgba(16,185,129,0.15)',
                    color: '#10b981',
                    fontWeight: '700',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: '0.3rem'
                  }}
                >
                  ⚡ Auto-Fill Ekadashi 2X Campaign
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Campaign / Festival Title *</label>
                  <input type="text" className="form-control" value={newCampaign.title} onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })} required placeholder="e.g. Kartik Month Japa Marathon 2026" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Festival Name</label>
                    <input type="text" className="form-control" value={newCampaign.festival} onChange={e => setNewCampaign({ ...newCampaign, festival: e.target.value })} placeholder="e.g. Kartik Festival / Gita Jayanti" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Target Devotees</label>
                    <select className="form-control" value={newCampaign.target} onChange={e => setNewCampaign({ ...newCampaign, target: e.target.value })}>
                      <option value="all">All My Devotees ({myDevotees.length})</option>
                      <option value="FOLK Resident">FOLK Residents Only</option>
                      <option value="Non-FOLK Resident">Non-FOLK Residents Only</option>
                      <option value="Beginner">Beginners Only</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Start Date *</label>
                    <input type="date" className="form-control" value={newCampaign.startDate} onChange={e => setNewCampaign({ ...newCampaign, startDate: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>End Date *</label>
                    <input type="date" className="form-control" value={newCampaign.endDate} onChange={e => setNewCampaign({ ...newCampaign, endDate: e.target.value })} required />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>
                      Rules & Regulations (Auto-Parsed & Enforced)
                    </label>
                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700' }}>
                      ✨ Smart AI Intent Matcher Active
                    </span>
                  </div>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={newCampaign.rules}
                    onChange={e => setNewCampaign({ ...newCampaign, rules: e.target.value })}
                    placeholder="Type raw rules, e.g. 'only 16 round before 7 AM' or '30 min reading'"
                  />

                  {/* Smart Rule Auto-Correction & Parsing Preview */}
                  {newCampaign.rules.trim() !== '' && (
                    <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '10px', padding: '0.7rem', marginTop: '0.5rem', fontSize: '0.78rem' }}>
                      <div style={{ color: '#3b82f6', fontWeight: '800', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        🧠 Smart System Translation (How the system executes your entry):
                      </div>
                      {newCampaign.rules.split('\n').filter(Boolean).map((line, i) => {
                        let parsedIntent = line;
                        const lower = line.toLowerCase();
                        if (lower.includes('16') && (lower.includes('7') || lower.includes('round'))) {
                          parsedIntent = "🎯 Rule #" + (i+1) + ": Auto-Check Devotee Chanting (Target: 16 Rounds completed before 07:00 AM).";
                        } else if (lower.includes('reading') || lower.includes('book')) {
                          parsedIntent = "📚 Rule #" + (i+1) + ": Auto-Check Devotee Reading Duration (Target: 30+ Mins).";
                        } else if (lower.includes('mangala') || lower.includes('aarti')) {
                          parsedIntent = "🌅 Rule #" + (i+1) + ": Auto-Check Mangala Aarti On-Time Attendance (4:30 AM).";
                        } else {
                          parsedIntent = "📋 Rule #" + (i+1) + ": " + line.replace(/^only\b/i, 'Minimum').replace(/\bround\b/i, 'rounds') + " (Auto-tracked in Leaderboard).";
                        }
                        return (
                          <div key={i} style={{ color: '#e2e8f0', marginLeft: '0.5rem', marginBottom: '0.2rem' }}>
                            {parsedIntent}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Ekadashi 2X Multiplier Section */}
                <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: '#10b981', fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      ✨ Ekadashi 2X Points Multiplier (Special Bonus)
                    </h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#10b981', cursor: 'pointer', fontWeight: '700' }}>
                      <input type="checkbox" checked={newCampaign.enableEkadashi2x} onChange={e => setNewCampaign({ ...newCampaign, enableEkadashi2x: e.target.checked })} />
                      Enable 2X Points
                    </label>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>
                    All sadhana activities (chanting, reading, hearing, Mangala Aarti) done on designated Ekadashi days automatically earn <strong>DOUBLE (2X) POINTS</strong>!
                  </p>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: '600' }}>Ekadashi Dates (Comma-separated YYYY-MM-DD)</label>
                    <input type="text" className="form-control" value={newCampaign.ekadashiDates} onChange={e => setNewCampaign({ ...newCampaign, ekadashiDates: e.target.value })} placeholder="e.g. 2026-08-05, 2026-08-19, 2026-09-03" />
                  </div>
                </div>

                {/* Detailed Position Prizes (OPTIONAL for Ekadashi campaigns!) */}
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: '#f59e0b', fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Gift size={16} /> Campaign Position Prizes & Rewards (Optional)
                    </h4>
                    <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>(Leave blank if 2X Points is the main reward)</span>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.2rem', color: '#FFD700', fontSize: '0.78rem', fontWeight: '700' }}>🥇 1st Position Prize (Optional)</label>
                    <input type="text" className="form-control" value={newCampaign.prize1st} onChange={e => setNewCampaign({ ...newCampaign, prize1st: e.target.value })} placeholder="e.g. Srila Prabhupada 30-Vol Book Set + Deity Lamp (Optional)" />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.2rem', color: '#C0C0C0', fontSize: '0.78rem', fontWeight: '700' }}>🥈 2nd Position Prize (Optional)</label>
                    <input type="text" className="form-control" value={newCampaign.prize2nd} onChange={e => setNewCampaign({ ...newCampaign, prize2nd: e.target.value })} placeholder="e.g. Wooden Japa Mala Bag (Optional)" />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.2rem', color: '#CD7F32', fontSize: '0.78rem', fontWeight: '700' }}>🥉 3rd Position Prize (Optional)</label>
                    <input type="text" className="form-control" value={newCampaign.prize3rd} onChange={e => setNewCampaign({ ...newCampaign, prize3rd: e.target.value })} placeholder="e.g. Devotional Journal (Optional)" />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.2rem', color: '#94a3b8', fontSize: '0.78rem', fontWeight: '700' }}>🏅 Consolation / Top 10 Reward (Optional)</label>
                    <input type="text" className="form-control" value={newCampaign.prizeConsolation} onChange={e => setNewCampaign({ ...newCampaign, prizeConsolation: e.target.value })} placeholder="e.g. Special Certificate of Excellence & Mahaprasadam" />
                  </div>
                </div>

                <button type="submit" style={{ padding: '0.9rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: '#fff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: 'inherit', fontSize: '0.95rem' }}>
                  <Flag size={18} /> Launch Campaign & Send Invitations
                </button>
              </form>
            </div>

            {/* Active & Past Campaigns Overview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="panel">
                <h3 className="panel-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trophy size={20} color="#f59e0b" /> Guide Campaign Oversight ({campaigns.length} Campaigns)
                </h3>
                {campaigns.length === 0 && <p style={{ color: '#64748b' }}>No campaigns created yet. Launch your first festival competition!</p>}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxHeight: '750px', overflowY: 'auto' }}>
                  {campaigns.map(c => {
                    const enrolledEmails = c.enrolledDevotees || [];
                    const enrolledCount = enrolledEmails.length;
                    const totalTargetCount = myDevotees.length || 1;
                    const acceptanceRatio = Math.round((enrolledCount / totalTargetCount) * 100);
                    const isCompleted = c.status === 'Completed';

                    // Compute live campaign leaderboard for enrolled boys
                    const enrolledDevoteesList = myDevotees.filter(d => enrolledEmails.includes(d.email));
                    const campLeaderboard = enrolledDevoteesList.map(dev => {
                      const stats = getDevoteeStats(dev.email);
                      return { ...dev, ...stats };
                    }).sort((a, b) => b.avg - a.avg);

                    return (
                      <div key={c.id} style={{
                        background: isCompleted ? 'rgba(15, 23, 42, 0.6)' : 'var(--bg-input)',
                        border: `1.5px solid ${isCompleted ? '#64748b' : '#f59e0b'}`,
                        borderRadius: '16px',
                        padding: '1.4rem',
                        boxShadow: isCompleted ? 'none' : '0 4px 20px rgba(245,158,11,0.15)'
                      }}>
                        {/* Title & Status Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem', gap: '0.5rem' }}>
                          <div>
                            <span style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              🏆 {c.festival || 'Festival Campaign'}
                            </span>
                            <h4 style={{ margin: '0.2rem 0 0 0', color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: '800' }}>
                              {c.title}
                            </h4>
                          </div>
                          <span className={`badge ${isCompleted ? 'badge-blue' : 'badge-emerald'}`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                            {isCompleted ? '🏁 Completed' : '🔥 Ongoing Active'}
                          </span>
                        </div>

                        {/* Acceptance Ratio Progress Bar */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.8rem', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                            <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>📊 Devotee Acceptance Ratio:</span>
                            <span style={{ color: '#10b981', fontWeight: '800' }}>
                              {enrolledCount} / {totalTargetCount} Boys Enrolled ({acceptanceRatio}%)
                            </span>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${acceptanceRatio}%`, background: 'linear-gradient(90deg, #10b981, #f59e0b)', borderRadius: '4px' }} />
                          </div>
                        </div>

                        {/* Dates & Ekadashi info */}
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                          <span>📅 Dates: <strong>{c.startDate ? format(new Date(c.startDate), 'dd MMM yyyy') : 'Now'}</strong> to <strong>{c.endDate ? format(new Date(c.endDate), 'dd MMM yyyy') : 'TBD'}</strong></span>
                          {c.enableEkadashi2x && <span style={{ color: '#10b981', fontWeight: '700' }}>✨ Ekadashi 2X Multiplier Active</span>}
                        </div>

                        {/* Rules */}
                        {c.rules && (
                          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.7rem', borderRadius: '10px', marginBottom: '0.8rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                            <strong style={{ color: '#f59e0b' }}>📋 Rules & Regulations:</strong>
                            <div style={{ whiteSpace: 'pre-line', marginTop: '0.2rem' }}>{c.rules}</div>
                          </div>
                        )}

                        {/* Position Prizes List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem', marginBottom: '1rem', background: 'rgba(245,158,11,0.06)', padding: '0.7rem', borderRadius: '10px' }}>
                          {c.prize1st && <div style={{ color: '#FFD700', fontWeight: '700' }}>🥇 1st: {c.prize1st}</div>}
                          {c.prize2nd && <div style={{ color: '#C0C0C0', fontWeight: '700' }}>🥈 2nd: {c.prize2nd}</div>}
                          {c.prize3rd && <div style={{ color: '#CD7F32', fontWeight: '700' }}>🥉 3rd: {c.prize3rd}</div>}
                          {c.prizeConsolation && <div style={{ color: '#94a3b8', fontWeight: '600' }}>🏅 Consolation: {c.prizeConsolation}</div>}
                        </div>

                        {/* Live Campaign Standings Leaderboard */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem' }}>
                          <h5 style={{ margin: '0 0 0.6rem 0', color: 'var(--text-main)', fontSize: '0.88rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Trophy size={16} color="#f59e0b" /> {isCompleted ? '🏁 Final Campaign Winners' : '🔥 Live Campaign Standings'} ({campLeaderboard.length} Boys)
                          </h5>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {campLeaderboard.map((d, idx) => (
                              <div key={d.email} style={{
                                display: 'flex', alignItems: 'center', gap: '0.8rem',
                                padding: '0.6rem 0.8rem', borderRadius: '10px',
                                background: idx < 3 ? ['rgba(255,215,0,0.12)', 'rgba(192,192,192,0.12)', 'rgba(205,127,50,0.12)'][idx] : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${idx < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][idx] + '40' : 'transparent'}`
                              }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '800', width: '22px' }}>
                                  {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                                </span>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                                  <img src={d.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--text-main)' }}>{d.name}</div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{d.status} {d.residency && `· ${d.residency}`}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: '800', fontSize: '0.9rem', color: SCORE_COLOR(d.avg) }}>{d.avg}/20 pts</div>
                                  <div style={{ fontSize: '0.68rem', color: '#3b82f6' }}>🔥 {d.streak}d streak</div>
                                </div>
                              </div>
                            ))}
                            {campLeaderboard.length === 0 && <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>No devotees enrolled yet.</p>}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PUSH TO BUCKET LIST TAB ═══ */}
        {!selectedDevotee && activeTab === 'push_bucket' && (
          <div className="animate-fade-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
            <div className="panel">
              <h3 className="panel-title" style={{ marginBottom: '0.5rem', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={20} /> Assign Task to Devotees' Bucket List
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Assigned tasks will appear directly in the selected boy(s) Bucket List marked with a ⭐ <strong>PRIORITY — Assigned by Guide</strong> badge.
              </p>

              <form onSubmit={handlePushBucketItem} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {/* Target Type */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Target Devotees</label>
                  <select className="form-control" value={bucketPushTargetType} onChange={e => { setBucketPushTargetType(e.target.value); setBucketPushTargetValue(''); }}>
                    <option value="all">All My Devotees ({myDevotees.length})</option>
                    <option value="individual">Specific Individual Boy</option>
                    <option value="residency">By Residency</option>
                    <option value="status">By Category Status (Residents / Beginners)</option>
                  </select>
                </div>

                {/* Sub-target picker */}
                {bucketPushTargetType === 'individual' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Select Devotee</label>
                    <select className="form-control" value={bucketPushTargetValue} onChange={e => setBucketPushTargetValue(e.target.value)} required>
                      <option value="">Choose Boy...</option>
                      {myDevotees.map(d => <option key={d.email} value={d.email}>{d.name} ({d.residency || d.status})</option>)}
                    </select>
                  </div>
                )}

                {bucketPushTargetType === 'residency' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Select Residency</label>
                    <select className="form-control" value={bucketPushTargetValue} onChange={e => setBucketPushTargetValue(e.target.value)} required>
                      <option value="">Choose Residency...</option>
                      {residencies.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                )}

                {bucketPushTargetType === 'status' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Select Category</label>
                    <select className="form-control" value={bucketPushTargetValue} onChange={e => setBucketPushTargetValue(e.target.value)} required>
                      <option value="">Choose Category...</option>
                      <option value="FOLK Resident">FOLK Residents Only</option>
                      <option value="Non-FOLK Resident">Non-FOLK Residents Only</option>
                      <option value="Beginner">Beginners Only</option>
                    </select>
                  </div>
                )}

                {/* Bucket List Category */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Bucket List Section</label>
                  <select className="form-control" value={bucketCategory} onChange={e => setBucketCategory(e.target.value)}>
                    <option value="seva">🙏 Seva Goals (To-Do List)</option>
                    <option value="topics">📖 Philosophical Topics Section</option>
                    <option value="books">📚 Book Reading Section</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Item Title *</label>
                  <input type="text" className="form-control" value={bucketItemTitle} onChange={e => setBucketItemTitle(e.target.value)} required placeholder="e.g. Read Bhagavad Gita Chapter 4 / Clean Altar" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Guide Remark / Instruction</label>
                  <input type="text" className="form-control" value={bucketItemRemark} onChange={e => setBucketItemRemark(e.target.value)} placeholder="e.g. Please complete by this Sunday" />
                </div>

                <button type="submit" style={{ padding: '0.9rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CheckSquare size={18} /> Push Priority Task to Bucket List
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══ TARGETED BROADCAST TAB ═══ */}
        {!selectedDevotee && activeTab === 'targeted_msg' && (
          <div className="animate-fade-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
            <div className="panel">
              <h3 className="panel-title" style={{ marginBottom: '0.5rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={20} /> Targeted Devotee Broadcast
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Send custom notifications to a specific boy, a specific residency, or an entire category group.
              </p>

              <form onSubmit={handleSendTargetedMessage} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Recipient Group</label>
                  <select className="form-control" value={msgTargetType} onChange={e => { setMsgTargetType(e.target.value); setMsgTargetValue(''); }}>
                    <option value="all">All My Devotees ({myDevotees.length})</option>
                    <option value="individual">Specific Individual Boy</option>
                    <option value="residency">Selected Residency Only</option>
                    <option value="status">By Category (Residents / Non-Residents / Beginners)</option>
                  </select>
                </div>

                {msgTargetType === 'individual' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Select Devotee</label>
                    <select className="form-control" value={msgTargetValue} onChange={e => setMsgTargetValue(e.target.value)} required>
                      <option value="">Choose Boy...</option>
                      {myDevotees.map(d => <option key={d.email} value={d.email}>{d.name} ({d.residency || d.status})</option>)}
                    </select>
                  </div>
                )}

                {msgTargetType === 'residency' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Select Residency</label>
                    <select className="form-control" value={msgTargetValue} onChange={e => setMsgTargetValue(e.target.value)} required>
                      <option value="">Choose Residency...</option>
                      {residencies.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                )}

                {msgTargetType === 'status' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Select Category</label>
                    <select className="form-control" value={msgTargetValue} onChange={e => setMsgTargetValue(e.target.value)} required>
                      <option value="">Choose Category...</option>
                      <option value="FOLK Resident">FOLK Residents Only</option>
                      <option value="Non-FOLK Resident">Non-FOLK Residents Only</option>
                      <option value="Beginner">Beginners Only</option>
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>Message Text</label>
                  <textarea className="form-control" rows="5" value={messageText} onChange={e => setMessageText(e.target.value)} required placeholder="Type your message or remark here..." />
                </div>

                <button type="submit" style={{ padding: '0.9rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Send size={18} /> Send Broadcast Message
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══ RESIDENCIES TAB ═══ */}
        {!selectedDevotee && activeTab === 'residencies' && (
          <div className="campaign-split animate-fade-in" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div className="panel">
              <h3 className="panel-title" style={{ marginBottom: '1.2rem', color: '#f59e0b' }}>🏠 Create New Residency</h3>
              <form onSubmit={handleCreateResidency} style={{ display: 'flex', gap: '0.8rem' }}>
                <input type="text" className="form-control" value={newResidencyName} onChange={e => setNewResidencyName(e.target.value)} required placeholder="e.g. FOLK PDPU" />
                <button type="submit" style={{ padding: '0 1.2rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', fontWeight: '700' }}>Create</button>
              </form>
            </div>
            <div className="panel">
              <h3 className="panel-title" style={{ marginBottom: '1rem' }}>📍 Active Residencies</h3>
              {residencies.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'var(--bg-input)', borderRadius: '10px', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{r.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{myDevotees.filter(d => d.residency === r.name).length} assigned devotees</div>
                  </div>
                  <Building2 size={20} color="#f59e0b" />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Global Footer with Both Logos */}
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

      {/* Guide Dashboard Notifications Modal (Moved to root to prevent clipping) */}
      {showNotifications && (
        <>
          <div onClick={() => setShowNotifications(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }} />
          <div onClick={e => e.stopPropagation()} className="animate-fade-in" style={{ position: 'fixed', top: '75px', left: '50%', transform: 'translateX(-50%)', width: '90vw', maxWidth: '350px', background: 'var(--bg-card)', border: '1px solid var(--border-highlight)', borderRadius: '16px', padding: '1.2rem', boxShadow: '0 15px 35px rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-amber)' }}>Notifications</h3>
              <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            
            {notifications.filter(n => !clearedNotifs.includes(n.id)).length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>
                <Bell size={32} style={{ opacity: 0.2, margin: '0 auto 0.5rem auto' }} />
                No new notifications
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {notifications.filter(n => !clearedNotifs.includes(n.id)).map(n => (
                  <div key={n.id} style={{ padding: '0.8rem', background: 'var(--bg-input)', borderRadius: '8px', borderLeft: '3px solid var(--accent-blue)', fontSize: '0.85rem' }}>
                    <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.2rem' }}>{n.title || n.sender}</strong>
                    <span style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>{n.message}</span>
                  </div>
                ))}
                <button onClick={handleClearNotifications} className="nav-btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.85rem' }}>
                  <CheckCircle size={14} /> Mark All as Read
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GuideDashboard;

