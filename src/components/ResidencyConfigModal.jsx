import React, { useState } from 'react';
import { X, Save, Clock } from 'lucide-react';
import { DEFAULT_RESIDENCY_CONFIG } from '../utils/scoring';

const ACTIVITY_LABELS = {
  mangala_arati: "Mangala Arati",
  japa: "Japa",
  reading: "Srimad Bhagavatam Reading",
  class: "Srimad Bhagavatam Class",
  yoga: "Yoga"
};

const ResidencyConfigModal = ({ residency, onClose, onSave }) => {
  // Deep clone to avoid mutating original reference
  const [config, setConfig] = useState(JSON.parse(JSON.stringify(residency.config || DEFAULT_RESIDENCY_CONFIG)));

  const handleToggle = (act) => {
    setConfig({
      ...config,
      [act]: { ...config[act], enabled: !config[act].enabled }
    });
  };

  const handleTimeChange = (act, time) => {
    setConfig({
      ...config,
      [act]: { ...config[act], time }
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave({ ...residency, config });
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, background: 'rgba(0,0,0,0.7)' }} />
      <div className="animate-fade-in" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90vw', maxWidth: '450px', background: 'var(--bg-card)', border: '1px solid var(--border-highlight)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 15px 35px rgba(0,0,0,0.8)', zIndex: 9999, maxHeight: '85vh', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-main)' }}>⚙️ Configure Residency</h3>
            <p style={{ margin: 0, color: '#f59e0b', fontSize: '0.85rem' }}>{residency.name}</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.keys(DEFAULT_RESIDENCY_CONFIG).map(act => (
              <div key={act} style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '10px', border: `1px solid ${config[act].enabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(51, 65, 85, 0.5)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: config[act].enabled ? '0.8rem' : '0' }}>
                  <div style={{ fontWeight: '600', color: config[act].enabled ? 'var(--text-main)' : 'var(--text-muted)' }}>{ACTIVITY_LABELS[act]}</div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={config[act].enabled} onChange={() => handleToggle(act)} style={{ display: 'none' }} />
                    <div style={{ width: '40px', height: '22px', background: config[act].enabled ? '#10b981' : '#334155', borderRadius: '20px', position: 'relative', transition: 'all 0.3s' }}>
                      <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config[act].enabled ? '20px' : '2px', transition: 'all 0.3s' }} />
                    </div>
                  </label>
                </div>
                
                {config[act].enabled && (
                  <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <Clock size={16} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1 }}>Target Completion Time:</span>
                    <input 
                      type="time" 
                      value={config[act].time} 
                      onChange={(e) => handleTimeChange(act, e.target.value)}
                      className="form-control" 
                      style={{ padding: '0.4rem', fontSize: '0.9rem', background: 'var(--bg-input)', width: 'auto' }} 
                      required 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button type="submit" style={{ padding: '0.8rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Save size={18} /> Save Settings
          </button>
        </form>
      </div>
    </>
  );
};

export default ResidencyConfigModal;
