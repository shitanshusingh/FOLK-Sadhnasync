import React, { useState, useRef, useEffect } from 'react';
import { X, Shield, Palette, Database, LifeBuoy, Download, Upload, AlertTriangle, CheckCircle, Info, Flame } from 'lucide-react';
import { format } from 'date-fns';

const SettingsModal = ({ user, onClose, onLogout }) => {
  const [activeTab, setActiveTab] = useState('security');
  const fileInputRef = useRef(null);

  // Security Tab State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [secMsg, setSecMsg] = useState({ text: '', type: '' });

  // Privacy/Data State
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [delPass1, setDelPass1] = useState('');
  const [delPass2, setDelPass2] = useState('');
  const [delPass3, setDelPass3] = useState('');
  const [delError, setDelError] = useState('');
  
  // Handlers for Security
  const handlePasswordChange = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('sadhana_users') || '{}');
    const u = users[user.email];
    
    if (!u) {
      setSecMsg({ text: 'User not found in database.', type: 'error' });
      return;
    }
    
    if (u.password !== currentPass) {
      setSecMsg({ text: 'Incorrect current password.', type: 'error' });
      return;
    }

    if (newPass.length < 4) {
      setSecMsg({ text: 'New password must be at least 4 characters.', type: 'error' });
      return;
    }

    u.password = newPass;
    localStorage.setItem('sadhana_users', JSON.stringify(users));
    
    // Also update current user in local storage so it stays logged in
    const cu = JSON.parse(localStorage.getItem('sadhana_current_user'));
    cu.password = newPass;
    localStorage.setItem('sadhana_current_user', JSON.stringify(cu));

    setSecMsg({ text: 'Password successfully changed!', type: 'success' });
    setCurrentPass('');
    setNewPass('');
  };

  // Handlers for Theme
  const [themeMode, setThemeMode] = useState(localStorage.getItem('sadhana_theme_mode') || 'dark');

  const themes = [
    { name: 'Amber Glow', color: '#f59e0b', varName: '--primary-amber' },
    { name: 'Emerald', color: '#10b981', varName: '--accent-emerald' },
    { name: 'Violet', color: '#8b5cf6', varName: '--accent-purple' },
    { name: 'Rose', color: '#f43f5e', varName: '--accent-rose' },
    { name: 'Sky Blue', color: '#0ea5e9', varName: '--accent-blue' }
  ];

  const applyThemeMode = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('sadhana_theme_mode', mode);
    if (mode === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  };

  const applyTheme = (colorHex) => {
    document.documentElement.style.setProperty('--primary-amber', colorHex);
    // Adjust glow
    document.documentElement.style.setProperty('--primary-glow', `${colorHex}40`); 
    document.documentElement.style.setProperty('--border-highlight', `${colorHex}66`);
    localStorage.setItem('sadhana_theme', colorHex);
  };

  useEffect(() => {
    const saved = localStorage.getItem('sadhana_theme');
    if (saved) applyTheme(saved);
  }, []);

  // Handlers for Data
  const exportJSON = () => {
    const dataStr = localStorage.getItem(`sadhana_history_${user.email}`) || '[]';
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sadhana_Backup_${user.email}_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          if(window.confirm('Are you sure you want to restore this backup? This will overwrite your current Sādhana data.')) {
            localStorage.setItem(`sadhana_history_${user.email}`, JSON.stringify(importedData));
            window.location.reload();
          }
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Error reading backup file.');
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm.trim() !== 'DELETE') {
      setDelError('You must type DELETE exactly.');
      return;
    }
    
    if (delPass1 !== user.password || delPass2 !== user.password || delPass3 !== user.password) {
      setDelError('One or more of the passwords entered is incorrect.');
      return;
    }
    
    // Clear user data
    localStorage.removeItem(`sadhana_history_${user.email}`);
    localStorage.removeItem(`sadhana_goals_${user.email}`);
    
    // Remove from users list
    const users = JSON.parse(localStorage.getItem('sadhana_users') || '[]');
    const filteredUsers = users.filter(u => u.email !== user.email);
    localStorage.setItem('sadhana_users', JSON.stringify(filteredUsers));
    
    // Logout
    onLogout();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999999, padding: '1rem'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: '#1e293b', borderRadius: '20px',
        border: '1px solid #475569', width: '100%', maxWidth: '900px', height: '80vh',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)', color: '#f8fafc',
        display: 'flex', overflow: 'hidden' }} className="settings-modal-wrapper">
        
        {/* Sidebar Nav */}
        <div style={{ width: '250px', background: 'rgba(15, 23, 42, 0.5)', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #334155' }}>
            <h2 style={{ margin: 0, color: 'var(--primary-amber)', fontSize: '1.3rem' }}>Settings</h2>
          </div>
          <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            
            <button 
              onClick={() => setActiveTab('security')}
              style={{ background: activeTab === 'security' ? 'rgba(245, 158, 11, 0.15)' : 'transparent', border: 'none', borderLeft: activeTab === 'security' ? '3px solid var(--primary-amber)' : '3px solid transparent', color: activeTab === 'security' ? 'var(--primary-amber)' : '#94a3b8', padding: '1rem 1.5rem', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: activeTab === 'security' ? '600' : '400', transition: 'all 0.2s' }}>
              <Shield size={18} /> Account & Security
            </button>
            
            <button 
              onClick={() => setActiveTab('preferences')}
              style={{ background: activeTab === 'preferences' ? 'rgba(245, 158, 11, 0.15)' : 'transparent', border: 'none', borderLeft: activeTab === 'preferences' ? '3px solid var(--primary-amber)' : '3px solid transparent', color: activeTab === 'preferences' ? 'var(--primary-amber)' : '#94a3b8', padding: '1rem 1.5rem', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: activeTab === 'preferences' ? '600' : '400', transition: 'all 0.2s' }}>
              <Palette size={18} /> App Preferences
            </button>
            
            <button 
              onClick={() => setActiveTab('data')}
              style={{ background: activeTab === 'data' ? 'rgba(245, 158, 11, 0.15)' : 'transparent', border: 'none', borderLeft: activeTab === 'data' ? '3px solid var(--primary-amber)' : '3px solid transparent', color: activeTab === 'data' ? 'var(--primary-amber)' : '#94a3b8', padding: '1rem 1.5rem', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: activeTab === 'data' ? '600' : '400', transition: 'all 0.2s' }}>
              <Database size={18} /> Data & Privacy
            </button>

            <button 
              onClick={() => setActiveTab('help')}
              style={{ background: activeTab === 'help' ? 'rgba(245, 158, 11, 0.15)' : 'transparent', border: 'none', borderLeft: activeTab === 'help' ? '3px solid var(--primary-amber)' : '3px solid transparent', color: activeTab === 'help' ? 'var(--primary-amber)' : '#94a3b8', padding: '1rem 1.5rem', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: activeTab === 'help' ? '600' : '400', transition: 'all 0.2s' }}>
              <LifeBuoy size={18} /> Help & Support
            </button>

          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: '36px', height: '36px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}><X size={20} /></button>
          
          {activeTab === 'security' && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem' }}>Account & Security</h2>
              
              <div style={{ background: 'var(--bg-input)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}><Shield size={18}/> Change Password</h3>
                
                {secMsg.text && (
                  <div style={{ padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', background: secMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: secMsg.type === 'success' ? '#10b981' : '#ef4444', border: `1px solid ${secMsg.type === 'success' ? '#10b981' : '#ef4444'}` }}>
                    {secMsg.text}
                  </div>
                )}
                
                <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Current Password</label>
                    <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} className="form-control" required style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>New Password</label>
                    <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="form-control" required minLength="4" style={{ width: '100%' }} />
                  </div>
                  <button type="submit" className="nav-btn btn-primary" style={{ padding: '0.8rem', marginTop: '0.5rem' }}>Update Password</button>
                </form>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Profile Details</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Your profile details are currently managed during registration. To update your FOLK Residency or Guide, please contact your FOLK Guide directly.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'var(--text-main)' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Full Name</div>
                    <div style={{ fontWeight: '500' }}>{user.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Email</div>
                    <div style={{ fontWeight: '500' }}>{user.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Guide</div>
                    <div style={{ fontWeight: '500' }}>{user.guide}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Residency</div>
                    <div style={{ fontWeight: '500' }}>{user.residency}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem' }}>App Preferences</h2>
              
              <div style={{ background: 'var(--bg-input)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>Theme Mode</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => applyThemeMode('dark')} className={`nav-btn ${themeMode === 'dark' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.6rem 1.5rem' }}>Dark Mode</button>
                  <button onClick={() => applyThemeMode('light')} className={`nav-btn ${themeMode === 'light' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.6rem 1.5rem' }}>Light Mode</button>
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}><Palette size={18}/> Theme Accent Color</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Personalize your Sadhana Tracker by choosing a highlight color.</p>
                
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {themes.map(t => (
                    <div key={t.name} onClick={() => applyTheme(t.color)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: t.color, border: `3px solid ${localStorage.getItem('sadhana_theme') === t.color || (t.color === '#f59e0b' && !localStorage.getItem('sadhana_theme')) ? 'var(--bg-card)' : 'transparent'}`, boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}></div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem' }}>Data & Privacy</h2>
              
              <div style={{ background: 'var(--bg-input)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}><Database size={18}/> Backup & Restore</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Export your Sādhana history as a secure JSON file, or restore from a previous backup.</p>
                
                <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={importJSON} />
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={exportJSON} className="nav-btn btn-primary" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={18} /> Backup Data
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="nav-btn btn-secondary" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#334155' }}>
                    <Upload size={18} /> Restore Data
                  </button>
                </div>
              </div>

              <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}><AlertTriangle size={18}/> Danger Zone</h3>
                <p style={{ color: '#f8fafc', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Permanently delete your account and all associated Sādhana data. This requires extreme verification and <strong>cannot be undone</strong>.</p>
                
                {delError && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>{delError}</div>}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>Enter your password (1/3)</label>
                    <input type="password" value={delPass1} onChange={e => setDelPass1(e.target.value)} className="form-control" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(239, 68, 68, 0.5)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>Enter your password (2/3)</label>
                    <input type="password" value={delPass2} onChange={e => setDelPass2(e.target.value)} className="form-control" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(239, 68, 68, 0.5)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>Enter your password (3/3)</label>
                    <input type="password" value={delPass3} onChange={e => setDelPass3(e.target.value)} className="form-control" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(239, 68, 68, 0.5)' }} />
                  </div>
                  
                  <div style={{ marginTop: '0.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>Type <strong>DELETE</strong> to confirm:</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE" className="form-control" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(239, 68, 68, 0.5)' }} />
                      <button onClick={handleDeleteAccount} disabled={deleteConfirm.trim() !== 'DELETE'} className="nav-btn btn-rose" style={{ padding: '0.8rem 1.5rem', opacity: deleteConfirm.trim() === 'DELETE' ? 1 : 0.5, cursor: deleteConfirm.trim() === 'DELETE' ? 'pointer' : 'not-allowed' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem' }}>Help & Support</h2>
              
              <div style={{ background: 'var(--bg-input)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
                  <Info size={40} color="var(--primary-amber)" />
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.5rem' }}>FOLK SadhnaSync v1.0</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Empowering FOLK Boys to track their spiritual progress.</p>
                
                <div style={{ display: 'inline-block', textAlign: 'left', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', maxWidth: '450px' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Contact Support</h4>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>If you need assistance resetting your account or changing your residency details, please contact your FOLK guide directly:</p>
                  <ul style={{ color: 'var(--primary-amber)', paddingLeft: '1.5rem', margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>
                    <li>{user.guide || "Your Authorized Guide"}</li>
                  </ul>
                  
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Technical Support (Admin)</h4>
                  <p style={{ margin: '0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>For app issues or feedback, contact:</p>
                  <ul style={{ color: 'var(--primary-amber)', paddingLeft: '1.5rem', margin: '0', fontSize: '0.9rem' }}>
                    <li>Shitanshu Singh (9904281531)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;



