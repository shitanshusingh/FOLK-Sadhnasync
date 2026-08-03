import React, { useState, useEffect } from 'react';
import {
  Shield, UserPlus, Trash2, Send, Users, Search, Eye, EyeOff,
  Edit3, Key, RotateCcw, Activity, BarChart2, LogOut, ChevronRight,
  AlertTriangle, CheckCircle, MessageSquare, Database, TrendingUp, X, Save,
  Copy, Check, Compass, Trophy, Flag, Gift, FileText, Download, Award
} from 'lucide-react';
import { format } from 'date-fns';
import { calculatePoints } from '../utils/scoring';
import { generateSadhanaPDFReport } from '../utils/pdfGenerator';
import folkLogo from '../assets/folk_logo.png';
import iskconLogo from '../assets/iskcon_logo.png';
import { cloudSaveUser } from '../services/firebase';

const TABS = [
  { id: 'all_guides', label: '👥 All Guides Oversight', icon: Compass },
  { id: 'all_devotees', label: '📿 All Devotees Directory', icon: Users },
  { id: 'all_campaigns', label: '🏆 All Campaigns System-Wide', icon: Trophy },
  { id: 'master_leaderboard', label: '📊 Master Temple Leaderboard', icon: TrendingUp },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'create_guide', label: 'Create Guide', icon: UserPlus },
  { id: 'broadcast', label: 'Broadcast Notification', icon: Send },
  { id: 'activity', label: 'Activity Audit Log', icon: Activity },
  { id: 'data', label: 'System Data Control', icon: Database },
];

const AdminDashboard = ({ currentUser, onLogout, onImpersonate }) => {
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('sadhana_users') || '[]'));
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [impersonating, setImpersonating] = useState(null);

  // Form states
  const [guideName, setGuideName] = useState('');
  const [guideEmail, setGuideEmail] = useState('');
  const [guidePassword, setGuidePassword] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all');

  // Edit user modal states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editGuide, setEditGuide] = useState('');
  const [editResidency, setEditResidency] = useState('');
  const [editRole, setEditRole] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [userSadhanaHistory, setUserSadhanaHistory] = useState([]);
  const [showUserDetail, setShowUserDetail] = useState(false);

  const [activityLog, setActivityLog] = useState([]);
  const [statusMsg, setStatusMsg] = useState({ text: '', error: false });
  const [createdGuideCredentials, setCreatedGuideCredentials] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const [selectedGuideFilter, setSelectedGuideFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedResidencyFilter, setSelectedResidencyFilter] = useState('all');

  const getDevoteeStats = (email) => {
    const hist = JSON.parse(localStorage.getItem(`sadhana_history_${email}`) || '[]');
    if (!hist.length) return { avg: 0, streak: 0, total: 0 };
    const sorted = [...hist].sort((a, b) => b.date.localeCompare(a.date));
    let sumScore = 0; let sumMax = 0;
    hist.forEach(h => { sumScore += (h.score || 0); sumMax += (h.maxScore || 20); });
    const avg = sumMax > 0 ? Math.round((sumScore / sumMax) * 20) : 0;
    let streak = 0;
    for (let h of sorted) {
      if (h.score > 0) streak++;
      else break;
    }
    return { avg, streak, total: hist.length };
  };

  useEffect(() => {
    refreshUsers();
    const log = JSON.parse(localStorage.getItem('sadhana_activity_log') || '[]');
    setActivityLog(log.reverse().slice(0, 100));
  }, []);

  const refreshUsers = () => {
    const loaded = JSON.parse(localStorage.getItem('sadhana_users') || '[]');
    setUsers(loaded);
  };

  const saveUsers = (updated) => {
    setUsers(updated);
    localStorage.setItem('sadhana_users', JSON.stringify(updated));
  };

  const showStatus = (msg, isError = false) => {
    setStatusMsg({ text: msg, error: isError });
    setTimeout(() => setStatusMsg({ text: '', error: false }), 3000);
  };

  const handleDeleteUser = (email) => {
    if (email === 'admin@folk.in') { showStatus('Cannot delete Super Admin!', true); return; }
    if (!window.confirm(`Permanently delete ${email}?`)) return;
    const updated = users.filter(u => u.email !== email);
    saveUsers(updated);
    localStorage.removeItem(`sadhana_history_${email}`);
    localStorage.removeItem(`sadhana_bucket_list_${email}`);
    localStorage.removeItem(`sadhana_init_${email}`);
    setShowUserModal(false);
    showStatus(`User ${email} deleted.`);
    logActivity(`Admin deleted user: ${email}`);
  };

  const handleSaveEdit = () => {
    if (!selectedUser) return;
    const updated = users.map(u => u.email === selectedUser.email
      ? { ...u, name: editName, guide: editGuide, residency: editResidency, role: editRole, ...(editPassword ? { password: editPassword } : {}) }
      : u
    );
    const updatedUser = updated.find(u => u.email === selectedUser.email);
    saveUsers(updated);
    cloudSaveUser(updatedUser);
    showStatus('User updated successfully!');
    setShowUserModal(false);
    logActivity(`Admin edited user: ${selectedUser.email}`);
  };

  const handleResetPassword = (email) => {
    const newPass = prompt('Enter new password for ' + email + ':');
    if (!newPass || newPass.length < 4) { showStatus('Password too short.', true); return; }
    const updated = users.map(u => u.email === email ? { ...u, password: newPass } : u);
    saveUsers(updated);
    showStatus(`Password reset for ${email}`);
    logActivity(`Admin reset password for: ${email}`);
  };

  const handleWipeHistory = (email) => {
    if (!window.confirm(`Wipe all Sādhana history for ${email}? This cannot be undone.`)) return;
    localStorage.removeItem(`sadhana_history_${email}`);
    localStorage.removeItem(`sadhana_init_${email}`);
    showStatus(`History wiped for ${email}`);
    logActivity(`Admin wiped Sadhana data for: ${email}`);
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditPassword('');
    setEditGuide(user.guide || '');
    setEditResidency(user.residency || '');
    setEditRole(user.role || 'devotee');
    const hist = JSON.parse(localStorage.getItem(`sadhana_history_${user.email}`) || '[]');
    setUserSadhanaHistory(hist.slice(0, 10));
    setShowUserModal(true);
  };

  const handleCreateGuide = (e) => {
    e.preventDefault();
    if (users.find(u => u.email === guideEmail)) { showStatus('Email already exists.', true); return; }
    const newGuide = {
      name: guideName, email: guideEmail, password: guidePassword,
      role: 'guide', phone: '',
      photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guideName.replace(/\s+/g, '')}`
    };
    saveUsers([...users, newGuide]);
    cloudSaveUser(newGuide);
    
    // Store generated credentials for modal display
    setCreatedGuideCredentials({
      name: guideName,
      email: guideEmail,
      password: guidePassword,
      role: 'FOLK Guide',
      createdTime: new Date().toLocaleString()
    });

    setGuideName(''); setGuideEmail(''); setGuidePassword('');
    showStatus('FOLK Guide account created!');
    logActivity(`Admin created Guide: ${guideEmail}`);
    setActiveTab('users');
  };

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastMsg) return;
    const broadcasts = JSON.parse(localStorage.getItem('sadhana_global_broadcasts') || '[]');
    broadcasts.push({
      id: `broadcast_${Date.now()}`,
      message: broadcastMsg,
      date: new Date().toISOString(),
      sender: 'Super Admin',
      target: broadcastTarget
    });
    localStorage.setItem('sadhana_global_broadcasts', JSON.stringify(broadcasts));
    setBroadcastMsg('');
    showStatus('Broadcast sent to all users!');
    logActivity(`Admin sent broadcast: "${broadcastMsg.slice(0, 40)}..."`);
  };

  const logActivity = (msg) => {
    const log = JSON.parse(localStorage.getItem('sadhana_activity_log') || '[]');
    log.push({ msg, time: new Date().toISOString(), by: 'Super Admin' });
    localStorage.setItem('sadhana_activity_log', JSON.stringify(log));
    setActivityLog([{ msg, time: new Date().toISOString(), by: 'Super Admin' }, ...activityLog].slice(0, 100));
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    (u.role || 'devotee').toLowerCase().includes(search.toLowerCase()) ||
    (u.residency || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalDevotees = users.filter(u => !u.role || u.role === 'devotee').length;
  const totalGuides = users.filter(u => u.role === 'guide').length;

  const roleColor = (role) => {
    if (role === 'admin') return '#ef4444';
    if (role === 'guide') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>

      {/* Status toast */}
      {statusMsg.text && (
        <div className="animate-fade-in" style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
          padding: '0.9rem 1.5rem',
          background: statusMsg.error ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
          border: `1px solid ${statusMsg.error ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`,
          borderRadius: '12px', color: statusMsg.error ? '#ef4444' : '#10b981',
          fontWeight: '600', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          {statusMsg.error ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          {statusMsg.text}
        </div>
      )}

      {/* Header */}
      <header style={{
        background: 'rgba(11,17,30,0.8)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(239,68,68,0.3)'
            }}>
              <Shield size={24} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: '#f8fafc' }}>
                Super Admin Control Panel
              </h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Full system access · {users.length} total accounts
              </p>
            </div>
          </div>
          <button onClick={onLogout} style={{
            padding: '0.6rem 1.5rem', borderRadius: '10px', cursor: 'pointer',
            border: 'none', background: 'rgba(239,68,68,0.15)', color: '#ef4444',
            fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'all 0.2s', fontFamily: 'inherit'
          }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="admin-kpi-wrapper" style={{ maxWidth: '1400px', margin: '1.5rem auto', padding: '0 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Users', value: users.length, icon: '👥', color: '#3b82f6' },
            { label: 'Devotees', value: totalDevotees, icon: '🙏', color: '#10b981' },
            { label: 'FOLK Guides', value: totalGuides, icon: '📿', color: '#f59e0b' },
            { label: 'Broadcasts Sent', value: JSON.parse(localStorage.getItem('sadhana_global_broadcasts') || '[]').length, icon: '📢', color: '#8b5cf6' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: '16px', padding: '1.2rem',
              borderTop: `3px solid ${color}`
            }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>{icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color }}>{value}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="admin-tabs-nav" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              padding: '0.7rem 1.2rem', border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem',
              background: activeTab === id ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'var(--bg-card)',
              color: activeTab === id ? '#fff' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap',
              boxShadow: activeTab === id ? '0 4px 15px rgba(239,68,68,0.3)' : 'none',
              transition: 'all 0.2s', fontFamily: 'inherit'
            }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* ─── TAB: 👥 ALL GUIDES OVERSIGHT ─── */}
        {activeTab === 'all_guides' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="panel">
              <h2 className="panel-title" style={{ color: '#f59e0b', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={22} /> Super Admin Oversight — All FOLK Guides ({users.filter(u => u.role === 'guide').length})
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Central monitoring panel for all FOLK Guides. Track total assigned boys, average Sādhana performance, residencies, and launched campaigns across the entire temple ecosystem.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.2rem' }}>
                {users.filter(u => u.role === 'guide').map(guide => {
                  const guideBoys = users.filter(u => u.guide === guide.name && u.role !== 'guide' && u.role !== 'admin');
                  const guideResidencies = JSON.parse(localStorage.getItem('sadhana_residencies') || '[]').filter(r => r.guide === guide.name);
                  const guideCamps = JSON.parse(localStorage.getItem(`guide_campaigns_${guide.email}`) || '[]');
                  
                  // Compute average score of all boys under this guide
                  let totalScoreSum = 0;
                  let boyCount = guideBoys.length || 1;
                  guideBoys.forEach(b => {
                    const st = getDevoteeStats(b.email);
                    totalScoreSum += st.avg;
                  });
                  const overallAvgScore = Math.round(totalScoreSum / boyCount);

                  return (
                    <div key={guide.email} style={{
                      background: 'var(--bg-input)', border: '1.5px solid rgba(245,158,11,0.3)',
                      borderRadius: '16px', padding: '1.4rem', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                          <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #f59e0b', flexShrink: 0 }}>
                            <img src={guide.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${guide.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: '800' }}>{guide.name}</h3>
                            <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '700' }}>📿 FOLK Guide</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{guide.email}</div>
                          </div>
                        </div>

                        {/* Metrics Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '12px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#3b82f6' }}>{guideBoys.length}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Total Boys</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>{overallAvgScore}/20</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Avg Score</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f59e0b' }}>{guideCamps.length}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Campaigns</div>
                          </div>
                        </div>

                        {/* Residencies list */}
                        <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                          <strong style={{ color: '#f59e0b' }}>🏠 Assigned Residencies:</strong>{' '}
                          {guideResidencies.map(r => r.name).join(', ') || 'General / Non-Resident'}
                        </div>
                      </div>

                      {/* Enrolled Boys Avatar Pill */}
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: '600' }}>Assigned Devotees:</div>
                        <div style={{ display: 'flex', gap: '0.8rem', maxWidth: '1400px', margin: '0 auto 1.5rem auto', flexWrap: 'nowrap' }} className="admin-tabs-nav">
                          {guideBoys.map(b => (
                            <span key={b.email} className="badge badge-amber" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                              {b.name} ({b.status})
                            </span>
                          ))}
                          {guideBoys.length === 0 && <span style={{ color: '#64748b', fontSize: '0.75rem' }}>No boys assigned yet</span>}
                        </div>

                        {onLoginAsUser && (
                          <button
                            onClick={() => onLoginAsUser({ ...guide, _isImpersonated: true })}
                            style={{
                              width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid #f59e0b',
                              background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: '800',
                              cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                            }}
                          >
                            <Eye size={16} /> 👁️ Open Portal as {guide.name.split(' ')[0]}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: 📿 ALL DEVOTEES DIRECTORY ─── */}
        {activeTab === 'all_devotees' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 className="panel-title" style={{ color: '#10b981', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={22} /> Master Devotee Directory — All Boys ({users.filter(u => !u.role || u.role === 'devotee').length})
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
                    Super Admin viewing power across all guides, residencies, and categories.
                  </p>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <select className="form-control" value={selectedGuideFilter} onChange={e => setSelectedGuideFilter(e.target.value)} style={{ fontSize: '0.8rem', width: '180px' }}>
                    <option value="all">Filter: All Guides</option>
                    {users.filter(u => u.role === 'guide').map(g => <option key={g.email} value={g.name}>{g.name}</option>)}
                  </select>

                  <select className="form-control" value={selectedCategoryFilter} onChange={e => setSelectedCategoryFilter(e.target.value)} style={{ fontSize: '0.8rem', width: '170px' }}>
                    <option value="all">Filter: All Categories</option>
                    <option value="FOLK Resident">FOLK Residents</option>
                    <option value="Non-FOLK Resident">Non-FOLK Residents</option>
                    <option value="Beginner">Beginners</option>
                  </select>
                </div>
              </div>

              {/* Devotees Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {users.filter(u => (!u.role || u.role === 'devotee') &&
                  (selectedGuideFilter === 'all' || u.guide === selectedGuideFilter) &&
                  (selectedCategoryFilter === 'all' || u.status === selectedCategoryFilter) &&
                  (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
                ).map(devotee => {
                  const stats = getDevoteeStats(devotee.email);
                  return (
                    <div key={devotee.email} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #10b981', flexShrink: 0 }}>
                          <img src={devotee.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${devotee.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '0.98rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{devotee.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '700' }}>{devotee.status}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Guide: {devotee.guide || 'Unassigned'} · {devotee.residency || 'Non-Resident'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>{stats.avg}/20</div>
                          <div style={{ fontSize: '0.68rem', color: '#3b82f6', fontWeight: '700' }}>🔥 {stats.streak}d streak</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.78rem' }}>
                        <span style={{ color: '#94a3b8' }}>📧 {devotee.email}</span>
                        <button onClick={() => openUserModal(devotee)} className="btn-secondary" style={{ padding: '0.3rem 0.7rem', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Eye size={14} /> Inspect
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: 🏆 ALL CAMPAIGNS SYSTEM-WIDE ─── */}
        {activeTab === 'all_campaigns' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="panel">
              <h2 className="panel-title" style={{ color: '#f59e0b', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={22} /> System-Wide Sādhana Campaigns Overview
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                View all Sādhana campaigns launched by any FOLK Guide across the temple ecosystem.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.2rem' }}>
                {JSON.parse(localStorage.getItem('sadhana_campaigns') || '[]').map(c => (
                  <div key={c.id} style={{ background: 'var(--bg-input)', border: '1.5px solid #f59e0b', borderRadius: '16px', padding: '1.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase' }}>🏆 {c.festival || 'Festival Campaign'}</span>
                        <h4 style={{ margin: '0.2rem 0', color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: '800' }}>{c.title}</h4>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Guide: {c.guide}</div>
                      </div>
                      <span className="badge badge-emerald">👥 {(c.enrolledDevotees || []).length} Enrolled</span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.8rem' }}>
                      📅 Dates: {c.startDate ? format(new Date(c.startDate), 'dd MMM yyyy') : 'Immediate'} — {c.endDate ? format(new Date(c.endDate), 'dd MMM yyyy') : 'TBD'}
                    </div>

                    {c.rules && (
                      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.6rem', borderRadius: '8px', marginBottom: '0.8rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                        <strong style={{ color: '#f59e0b' }}>📋 Rules:</strong>
                        <div style={{ whiteSpace: 'pre-line', marginTop: '0.2rem' }}>{c.rules}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: 📊 MASTER TEMPLE LEADERBOARD ─── */}
        {activeTab === 'master_leaderboard' && (
          <div className="animate-fade-in">
            <div className="panel">
              <h2 className="panel-title" style={{ color: '#3b82f6', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={22} /> Temple Master Sādhana Leaderboard (All Boys Across All Guides)
              </h2>
              
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Devotee Name</th>
                      <th>Category Status</th>
                      <th>Residency</th>
                      <th>Assigned Guide</th>
                      <th>Avg Sādhana Score</th>
                      <th>Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => !u.role || u.role === 'devotee')
                      .map(u => ({ ...u, ...getDevoteeStats(u.email) }))
                      .sort((a, b) => b.avg - a.avg)
                      .map((d, idx) => (
                        <tr key={d.email}>
                          <td>
                            <strong style={{ color: idx < 3 ? '#f59e0b' : 'inherit' }}>
                              {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                            </strong>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <img src={d.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.name}`} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                              <strong style={{ color: 'var(--text-main)' }}>{d.name}</strong>
                            </div>
                          </td>
                          <td><span className="badge badge-amber">{d.status}</span></td>
                          <td>{d.residency || 'Non-Resident'}</td>
                          <td><span style={{ color: '#f59e0b', fontWeight: '600' }}>{d.guide || 'Unassigned'}</span></td>
                          <td><strong style={{ color: '#10b981', fontSize: '1rem' }}>{d.avg}/20 pts</strong></td>
                          <td><span style={{ color: '#3b82f6', fontWeight: '700' }}>🔥 {d.streak}d</span></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: User Management ─── */}
        {activeTab === 'users' && (
          <div className="panel animate-fade-in">
            <div className="panel-header">
              <h2 className="panel-title">All Users</h2>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text" placeholder="Search by name, email, role, residency..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '34px', width: '300px', borderRadius: '20px' }}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Guide / Residency</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.email} style={{ cursor: 'pointer' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${roleColor(user.role)}`, flexShrink: 0 }}>
                            {user.photo ? <img src={user.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: roleColor(user.role) }}>{(user.name || 'U').charAt(0)}</div>}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{user.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: `${roleColor(user.role)}20`, color: roleColor(user.role), border: `1px solid ${roleColor(user.role)}40` }}>
                          {(user.role || 'devotee').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{user.guide || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.residency || '—'}</div>
                      </td>
                      <td>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', marginRight: '6px' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button onClick={() => openUserModal(user)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'inherit' }}>
                            <Eye size={12} /> Edit Info
                          </button>
                          <button onClick={() => onImpersonate(user)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#10b981', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'inherit' }}>
                            <Activity size={12} /> Live Monitor
                          </button>
                          <button onClick={() => handleResetPassword(user.email)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'inherit' }}>
                            <Key size={12} /> Reset Pass
                          </button>
                          {user.role !== 'admin' && (
                            <button onClick={() => handleDeleteUser(user.email)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'inherit' }}>
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB: Create Guide ─── */}
        {activeTab === 'create_guide' && (
          <div className="panel animate-fade-in" style={{ maxWidth: '580px' }}>
            <h2 className="panel-title" style={{ marginBottom: '1.5rem', color: '#f59e0b' }}>Create New FOLK Guide</h2>
            <form onSubmit={handleCreateGuide} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {[
                { label: 'Full Name', value: guideName, set: setGuideName, placeholder: 'e.g. HG Hrishikesh Prabhu' },
                { label: 'Login Email', value: guideEmail, set: setGuideEmail, placeholder: 'e.g. hrishikesh@folk.in', type: 'email' },
                { label: 'Temporary Password', value: guidePassword, set: setGuidePassword, placeholder: 'Min. 6 characters' },
              ].map(({ label, value, set, placeholder, type = 'text' }) => (
                <div key={label}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>{label}</label>
                  <input type={type} className="form-control" value={value} onChange={e => set(e.target.value)} required placeholder={placeholder} />
                </div>
              ))}
              <button type="submit" style={{ padding: '1rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: '#fff', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem', fontFamily: 'inherit' }}>
                Create Guide Account
              </button>
            </form>
          </div>
        )}

        {/* ─── TAB: Activity Log ─── */}
        {activeTab === 'activity' && (
          <div className="panel animate-fade-in">
            <h2 className="panel-title" style={{ marginBottom: '1.5rem' }}>Activity Log</h2>
            {activityLog.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No activity recorded yet.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {activityLog.map((entry, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--bg-input)', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                  <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{entry.msg}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                    {entry.time ? format(new Date(entry.time), 'dd MMM, hh:mm a') : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB: Broadcast ─── */}
        {activeTab === 'broadcast' && (
          <div className="panel animate-fade-in" style={{ maxWidth: '620px' }}>
            <h2 className="panel-title" style={{ marginBottom: '0.5rem', color: '#8b5cf6' }}>
              <Send size={20} style={{ marginRight: '0.5rem' }} /> Global Broadcast
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Send an announcement directly to users' notification boxes.
            </p>
            <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Send To</label>
                <select className="form-control" value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value)}>
                  <option value="all">Everyone (All Users)</option>
                  <option value="devotees">Devotees Only</option>
                  <option value="guides">Guides Only</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Message</label>
                <textarea
                  className="form-control" value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                  required placeholder="Type your announcement..."
                  rows="5"
                />
              </div>
              <button type="submit" style={{ padding: '1rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: 'inherit' }}>
                <Send size={18} /> Send Broadcast
              </button>
            </form>

            {/* Broadcast History */}
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1rem' }}>Past Broadcasts</h3>
              {JSON.parse(localStorage.getItem('sadhana_global_broadcasts') || '[]').reverse().slice(0, 5).map((b, i) => (
                <div key={i} style={{ padding: '0.8rem', background: 'var(--bg-input)', borderRadius: '8px', marginBottom: '0.5rem', borderLeft: '3px solid #8b5cf6' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{b.message}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    {b.date ? format(new Date(b.date), 'dd MMM yyyy, hh:mm a') : ''} · {b.sender}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB: Data Control ─── */}
        {activeTab === 'data' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="panel" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.03)' }}>
              <h2 className="panel-title" style={{ color: '#ef4444', marginBottom: '1rem' }}>
                <AlertTriangle size={20} style={{ marginRight: '0.5rem' }} /> Dangerous Operations
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                These actions are irreversible. Use with extreme care.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {users.filter(u => u.role !== 'admin').map(user => (
                  <div key={user.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-input)', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontWeight: '700' }}>{user.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleWipeHistory(user.email)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                        Wipe Sādhana Data
                      </button>
                      <button onClick={() => handleDeleteUser(user.email)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                        Delete Account
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── User Detail Modal ─── */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowUserModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-card)', borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto',
            padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${roleColor(selectedUser.role)}` }}>
                  {selectedUser.photo ? <img src={selectedUser.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                </div>
                <div>
                  <h2 style={{ margin: 0, color: 'var(--text-main)' }}>{selectedUser.name}</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setShowUserModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            {/* Edit Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Full Name', value: editName, set: setEditName },
                { label: 'Role', value: editRole, set: setEditRole, isSelect: true, options: ['devotee', 'guide', 'admin'] },
                { label: 'FOLK Guide', value: editGuide, set: setEditGuide, isSelect: true, options: ['', ...users.filter(u => u.role === 'guide').map(g => g.name)] },
                { label: 'Residency', value: editResidency, set: setEditResidency, isSelect: true, options: ['', ...JSON.parse(localStorage.getItem('sadhana_residencies') || '[]').map(r => r.name)] },
              ].map(({ label, value, set, isSelect, options }) => (
                <div key={label}>
                  <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>{label}</label>
                  {isSelect
                    ? <select className="form-control" value={value} onChange={e => set(e.target.value)}>
                        {options.map(o => <option key={o} value={o}>{o || '— None —'}</option>)}
                      </select>
                    : <input type="text" className="form-control" value={value} onChange={e => set(e.target.value)} />
                  }
                </div>
              ))}
            </div>

            {/* Reset password inline */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>New Password (leave blank to keep unchanged)</label>
              <div style={{ position: 'relative' }}>
                <input type={showNewPass ? 'text' : 'password'} className="form-control" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Enter new password..." />
                <button type="button" onClick={() => setShowNewPass(!showNewPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Sadhana History Preview */}
            {userSadhanaHistory.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.8rem 0', color: 'var(--text-main)', fontSize: '1rem' }}>Recent Sādhana (last 10 entries)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {userSadhanaHistory.map((h, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{h.date}</span>
                      <span style={{ color: h.score > 15 ? '#10b981' : h.score > 8 ? '#f59e0b' : '#ef4444', fontWeight: '700' }}>
                        {h.score} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button onClick={handleSaveEdit} style={{ flex: 1, padding: '0.9rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: 'inherit' }}>
                <Save size={16} /> Save Changes
              </button>
              {selectedUser.role !== 'admin' && (
                <button onClick={() => handleWipeHistory(selectedUser.email)} style={{ padding: '0.9rem 1.2rem', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Wipe Data
                </button>
              )}
              {selectedUser.role !== 'admin' && (
                <button onClick={() => handleDeleteUser(selectedUser.email)} style={{ padding: '0.9rem 1.2rem', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Delete User
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── NEW GUIDE ACCOUNT CREATED POPUP / CREDENTIALS MODAL ─── */}
      {createdGuideCredentials && (
        <div className="modal-overlay animate-fade-in" onClick={() => setCreatedGuideCredentials(null)} style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 10000 }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0f172a', borderRadius: '24px',
            border: '2px solid #f59e0b',
            width: '100%', maxWidth: '500px', padding: '2rem',
            boxShadow: '0 25px 70px rgba(245, 158, 11, 0.3)',
            textAlign: 'center', position: 'relative'
          }}>
            <button onClick={() => setCreatedGuideCredentials(null)} style={{ position: 'absolute', right: '1.2rem', top: '1.2rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <X size={22} />
            </button>

            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', margin: '0 auto 1rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
              <UserPlus size={32} color="white" />
            </div>

            <h2 style={{ color: '#f8fafc', margin: '0 0 0.4rem 0', fontSize: '1.4rem', fontWeight: '800' }}>
              🎉 FOLK Guide Account Created!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>
              Take a screenshot or copy these credentials to send to the FOLK Guide.
            </p>

            {/* Formatted Credential Card */}
            <div style={{
              background: '#020617', border: '1px dashed #f59e0b60',
              borderRadius: '16px', padding: '1.2rem', textAlign: 'left',
              marginBottom: '1.5rem', fontFamily: "'Outfit', monospace"
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid #1e293b', marginBottom: '0.6rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Role</span>
                <span style={{ color: '#f59e0b', fontWeight: '800', fontSize: '0.85rem' }}>{createdGuideCredentials.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid #1e293b', marginBottom: '0.6rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Guide Name</span>
                <span style={{ color: '#f8fafc', fontWeight: '700', fontSize: '0.85rem' }}>{createdGuideCredentials.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid #1e293b', marginBottom: '0.6rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Login Email / ID</span>
                <span style={{ color: '#3b82f6', fontWeight: '700', fontSize: '0.85rem' }}>{createdGuideCredentials.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid #1e293b', marginBottom: '0.6rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Password</span>
                <span style={{ color: '#10b981', fontWeight: '800', fontSize: '0.9rem', letterSpacing: '1px' }}>{createdGuideCredentials.password}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Portal Access</span>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>FOLK SadhnaSync Guide Portal</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                onClick={() => {
                  const text = `🌸 FOLK Guide Credentials 🌸\nRole: ${createdGuideCredentials.role}\nName: ${createdGuideCredentials.name}\nEmail / User ID: ${createdGuideCredentials.email}\nPassword: ${createdGuideCredentials.password}\nPortal: FOLK SadhnaSync Portal`;
                  navigator.clipboard.writeText(text);
                  setCopiedCreds(true);
                  setTimeout(() => setCopiedCreds(false), 2500);
                }}
                style={{
                  flex: 1, padding: '0.85rem', borderRadius: '12px', border: 'none',
                  background: copiedCreds ? '#10b981' : 'linear-gradient(135deg, #f59e0b, #ea580c)',
                  color: '#fff', fontWeight: '800', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  fontFamily: 'inherit', fontSize: '0.9rem', transition: 'all 0.2s'
                }}
              >
                {copiedCreds ? <Check size={18} /> : <Copy size={18} />}
                {copiedCreds ? 'Copied to Clipboard!' : 'Copy Credentials'}
              </button>
              <button
                onClick={() => setCreatedGuideCredentials(null)}
                style={{
                  padding: '0.85rem 1.2rem', borderRadius: '12px', border: '1px solid #334155',
                  background: '#1e293b', color: '#f8fafc', fontWeight: '700', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '0.9rem'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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

    </div>
  );
};

export default AdminDashboard;
