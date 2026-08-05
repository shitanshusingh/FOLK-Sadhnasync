import { useState } from 'react';
import { X, LogOut, Edit3 } from 'lucide-react';
import { cloudSaveUser } from '../services/firebase';

const Profile = ({ user, onClose, onLogout, onUpdateUser, defaultIsEditing = false }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(defaultIsEditing);
  const [profileData, setProfileData] = useState({ name: user?.name || '', phone: user?.phone || '', photo: user?.photo || '' });

  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File exceeds 5MB limit!"); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 100;
        const MAX_HEIGHT = 100;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.1);
        setProfileData(prev => ({ ...prev, photo: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    const updatedUser = { ...user, ...profileData };
    localStorage.setItem('sadhana_current_user', JSON.stringify(updatedUser));
    const allUsers = JSON.parse(localStorage.getItem('sadhana_users') || '[]');
    const newUsers = allUsers.map(u => u.email === updatedUser.email ? updatedUser : u);
    localStorage.setItem('sadhana_users', JSON.stringify(newUsers));
    cloudSaveUser(updatedUser);
    onUpdateUser(updatedUser);
    setIsEditing(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, padding: '1rem'
    }}>
      <div onClick={e => e.stopPropagation()} className="animate-fade-in" style={{
        backgroundColor: 'var(--bg-card)', borderRadius: '24px',
        border: '1px solid var(--border-highlight)', width: '100%', maxWidth: '450px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', color: 'var(--text-main)',
        maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        
        <div style={{ overflowY: 'auto', padding: '2rem', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-amber)', fontSize: '1.4rem' }}>{isEditing ? 'Edit Profile' : 'Devotee Profile'}</h3>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
          </div>

          {!isEditing ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: `url(${user.photo}) center/cover`, border: '4px solid var(--primary-amber)', marginBottom: '1rem' }}></div>
                <h2 style={{ margin: '0 0 0.2rem 0', fontSize: '1.6rem' }}>{user.name}</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>ID: {user.userId || user.email}</div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>{user.email}</span>
                
                <button className="nav-btn btn-secondary" onClick={() => setIsEditing(true)} style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                  <Edit3 size={14} style={{ marginRight: '5px', display: 'inline-block', verticalAlign: 'middle' }} /> Edit Profile
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Contact Number</span>
                  <span style={{ fontWeight: 'bold' }}>{user.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Date of Birth</span>
                  <span style={{ fontWeight: 'bold' }}>{user.dob}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Occupation</span>
                  <span style={{ fontWeight: 'bold' }}>{user.occupation}</span>
                </div>

                {user.occupation === 'Student' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>College</span>
                      <span style={{ fontWeight: 'bold', textAlign: 'right', maxWidth: '60%' }}>{user.college}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Course & Branch</span>
                      <span style={{ fontWeight: 'bold', textAlign: 'right', maxWidth: '60%' }}>{user.course} - {user.branch}</span>
                    </div>
                  </>
                )}

                {user.occupation === 'Working' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Institution / Business</span>
                    <span style={{ fontWeight: 'bold', textAlign: 'right', maxWidth: '60%' }}>{user.institution}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>FOLK Guide</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-amber)' }}>{user.guide}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>FOLK Status</span>
                  <span style={{ fontWeight: 'bold' }}>{user.status}</span>
                </div>

                {user.status === 'FOLK Resident' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--accent-emerald)' }}>Residency</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-emerald)' }}>{user.residency}</span>
                  </div>
                )}
              </div>

              {!showLogoutConfirm ? (
                <button onClick={() => setShowLogoutConfirm(true)} style={{ background: 'none', border: 'none', color: '#ef4444', textDecoration: 'underline', width: '100%', padding: '1rem', marginTop: '2rem', fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                  <LogOut size={18} /> Logout from Account
                </button>
              ) : (
                <div className="animate-fade-in" style={{ marginTop: '2rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <p style={{ color: '#f8fafc', margin: '0 0 1rem 0' }}>Are you sure you want to log out?</p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={() => setShowLogoutConfirm(false)} className="nav-btn btn-secondary" style={{ padding: '0.6rem 1.5rem' }}>Cancel</button>
                    <button onClick={onLogout} className="nav-btn btn-rose" style={{ padding: '0.6rem 1.5rem', fontWeight: 'bold' }}>Yes, Logout</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                {profileData.photo && <img src={profileData.photo} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }} />}
                <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="form-control" />
                <small style={{ color: 'var(--text-muted)' }}>Select a new profile photo</small>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Full Name</label>
                <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="form-control" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Phone Number</label>
                <input type="text" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="form-control" />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>Cancel</button>
                <button type="button" onClick={saveProfile} className="btn-primary" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>Save</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
