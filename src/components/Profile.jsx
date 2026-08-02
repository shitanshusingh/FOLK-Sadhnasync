import { useState } from 'react';
import { X, LogOut } from 'lucide-react';

const Profile = ({ user, onClose, onLogout }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
            <h3 style={{ margin: 0, color: 'var(--primary-amber)', fontSize: '1.4rem' }}>Devotee Profile</h3>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: `url(${user.photo}) center/cover`, border: '4px solid var(--primary-amber)', marginBottom: '1rem' }}></div>
            <h2 style={{ margin: '0 0 0.2rem 0', fontSize: '1.6rem' }}>{user.name}</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{user.email}</span>
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
        </div>

      </div>
    </div>
  );
};

export default Profile;
