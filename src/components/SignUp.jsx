import { useState, useRef, useEffect } from 'react';
import { Camera, Eye, EyeOff } from 'lucide-react';
import { cloudSaveUser, cloudFetchAllUsers, cloudSaveNotification } from '../services/firebase';

const SignUp = ({ onAuthSuccess }) => {
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [occupation, setOccupation] = useState('');
  const [guide, setGuide] = useState('');
  const [status, setStatus] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const [guidesList, setGuidesList] = useState([]);
  const [residenciesList, setResidenciesList] = useState([]);

  useEffect(() => {
    // ☁️ Fetch guides from Firebase cloud so newly registered guides appear on all devices
    cloudFetchAllUsers().then(users => {
      setGuidesList(users.filter(u => u.role === 'guide'));
    }).catch(() => {
      const users = JSON.parse(localStorage.getItem('sadhana_users') || '[]');
      setGuidesList(users.filter(u => u.role === 'guide'));
    });
  }, []);

  useEffect(() => {
    if (guide) {
      const allResidencies = JSON.parse(localStorage.getItem('sadhana_residencies') || '[]');
      setResidenciesList(allResidencies.filter(r => r.guide === guide));
    } else {
      setResidenciesList([]);
    }
  }, [guide]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 250;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress as JPEG
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setPhotoPreview(compressedBase64);
          setPhotoBase64(compressedBase64);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!photoBase64) {
      setError('Please upload a profile photo (Mandatory)');
      return;
    }
    setError('');

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.photo = photoBase64;
    
    // Convert specified fields to uppercase automatically
    if (data.college) data.college = data.college.toUpperCase();
    if (data.course) data.course = data.course.toUpperCase();
    if (data.branch) data.branch = data.branch.toUpperCase();
    if (data.institution) data.institution = data.institution.toUpperCase();

    try {
      const users = JSON.parse(localStorage.getItem('sadhana_users') || '[]');
      
      // Generate User ID (e.g., sinek@folk.in)
      const firstName = data.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let baseId = `${firstName}@folk.in`;
      let uniqueId = baseId;
      let counter = 1;
      while (users.find(u => u.userId === uniqueId)) {
        uniqueId = `${firstName}${counter}@folk.in`;
        counter++;
      }
      data.userId = uniqueId;

      if (users.find(u => u.email === data.email)) {
        setError('An account with this email already exists.');
        return;
      }

      if (!localStorage.getItem(`sadhana_history_${data.email}`)) {
        localStorage.setItem(`sadhana_history_${data.email}`, '[]');
      }

      users.push(data);
      localStorage.setItem('sadhana_users', JSON.stringify(users));

      // ☁️ Sync new user to Firebase cloud — so they can login from any device
      cloudSaveUser(data);
      
      // 🔔 Send direct notification to their Guide
      if (data.guide) {
        cloudSaveNotification({
          id: `signup_${data.userId}_${Date.now()}`,
          title: `👤 New Devotee: ${data.name}`,
          message: `${data.name} has registered under your guidance as a ${data.status}.`,
          type: 'info',
          target: data.guide,
          date: new Date().toISOString(),
          sender: 'System'
        });
      }

      // Store remembered email so refresh doesn't log them out
      localStorage.setItem('sadhana_remembered_email', data.email);
      
      alert(`Registration Successful!\nYour generated User ID is: ${data.userId}\nYou can login using this ID or your email.`);
      onAuthSuccess(data);
    } catch (err) {
      console.error(err);
      if (err.name === 'QuotaExceededError') {
        setError('Storage is full. Please try signing up again without a photo, or clear browser cache.');
      } else {
        setError('An error occurred during signup: ' + err.message);
      }
    }
  };

  const inputStyle = { width: '100%', fontSize: '0.95rem', padding: '0.8rem', backgroundColor: '#0b1120', borderColor: '#334155', color: '#f8fafc' };
  const labelStyle = { display: 'block', marginBottom: '0.4rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '500' };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxHeight: '55vh', overflowY: 'auto', paddingRight: '10px' }}>
      
      {/* Photo Upload */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{ width: '80px', height: '80px', borderRadius: '50%', background: photoPreview ? `url(${photoPreview}) center/cover` : '#0b1120', border: '2px dashed #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
        >
          {!photoPreview && <Camera size={24} color="#64748b" />}
          {photoPreview && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', fontSize: '0.65rem', textAlign: 'center', padding: '2px', color: '#fff' }}>Change</div>}
        </div>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>Profile Photo *</span>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} style={{ display: 'none' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input type="text" name="name" className="form-control" style={inputStyle} required />
        </div>
        <div>
          <label style={labelStyle}>Contact Number *</label>
          <input type="tel" name="phone" className="form-control" style={inputStyle} required />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Email ID *</label>
        <input type="email" name="email" className="form-control" style={inputStyle} required />
      </div>

      <div style={{ position: 'relative' }}>
        <label style={labelStyle}>Password *</label>
        <input type={showPassword ? 'text' : 'password'} name="password" className="form-control" style={{ ...inputStyle, paddingRight: '2.5rem' }} required minLength="6" />
        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '30px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div>
        <label style={labelStyle}>Date of Birth *</label>
        <input type="date" name="dob" className="form-control" style={inputStyle} required />
      </div>

      <hr style={{ borderColor: '#1e293b', margin: '0.5rem 0' }} />

      {/* Occupation Logic */}
      <div>
        <label style={labelStyle}>Occupation *</label>
        <select name="occupation" className="form-control" style={inputStyle} required value={occupation} onChange={(e) => setOccupation(e.target.value)}>
          <option value="">Select Occupation</option>
          <option value="Student">Student</option>
          <option value="Working">Working</option>
        </select>
      </div>

      {occupation === 'Student' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: '#0b1120', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <div>
            <label style={labelStyle}>College *</label>
            <input type="text" name="college" className="form-control" style={{ ...inputStyle, textTransform: 'uppercase' }} placeholder="e.g. IIT" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Course *</label>
              <input type="text" name="course" className="form-control" style={{ ...inputStyle, textTransform: 'uppercase' }} placeholder="e.g. B.TECH" required />
            </div>
            <div>
              <label style={labelStyle}>Branch *</label>
              <input type="text" name="branch" className="form-control" style={{ ...inputStyle, textTransform: 'uppercase' }} placeholder="e.g. CSE" required />
            </div>
          </div>
        </div>
      )}

      {occupation === 'Working' && (
        <div style={{ padding: '1rem', background: '#0b1120', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <label style={labelStyle}>Institution / Business *</label>
          <input type="text" name="institution" className="form-control" style={{ ...inputStyle, textTransform: 'uppercase' }} placeholder="e.g. INFOSYS" required />
        </div>
      )}

      <hr style={{ borderColor: '#1e293b', margin: '0.5rem 0' }} />

      {/* FOLK Logic */}
      <div>
        <label style={{ ...labelStyle, color: '#f59e0b' }}>FOLK Guide *</label>
        <select name="guide" className="form-control" style={{ ...inputStyle, borderColor: '#f59e0b' }} required value={guide} onChange={(e) => { setGuide(e.target.value); setStatus(''); }}>
          <option value="">Select FOLK Guide</option>
          {guidesList.map(g => (
            <option key={g.email} value={g.name}>{g.name}</option>
          ))}
        </select>
      </div>

      {guide && (
        <div className="animate-fade-in">
          <label style={{ ...labelStyle, marginTop: '1rem' }}>Status *</label>
          <select name="status" className="form-control" style={inputStyle} required value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Select Status</option>
            <option value="FOLK Resident">FOLK Resident</option>
            <option value="Non-FOLK Resident">Non-FOLK Resident</option>
            <option value="Beginner">Beginner</option>
          </select>
        </div>
      )}

      {status === 'FOLK Resident' && (
        <div className="animate-fade-in" style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', marginTop: '1rem' }}>
          <label style={{ ...labelStyle, color: '#10b981' }}>FOLK Residency *</label>
          <select name="residency" className="form-control" style={{ ...inputStyle, backgroundColor: '#0b1120' }} required>
            <option value="">Select Residency</option>
            {residenciesList.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
          {residenciesList.length === 0 && <p style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.5rem' }}>Your guide hasn't created any residencies yet.</p>}
        </div>
      )}

      <hr style={{ borderColor: '#1e293b', margin: '0.5rem 0' }} />

      {/* Account Recovery Logic */}
      <div style={{ padding: '1rem', background: '#0b1120', borderRadius: '8px', border: '1px solid #1e293b' }}>
        <h4 style={{ color: '#f8fafc', margin: '0 0 1rem 0', fontSize: '1rem' }}>Account Recovery Settings</h4>
        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem' }}>These will be used if you forget your password.</p>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Security Question *</label>
          <select name="securityQuestion" className="form-control" style={inputStyle} required>
            <option value="">Select a Question</option>
            <option value="What was your childhood nickname?">What was your childhood nickname?</option>
            <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
            <option value="What was the name of your first pet?">What was the name of your first pet?</option>
            <option value="What city were you born in?">What city were you born in?</option>
            <option value="What is your favorite book?">What is your favorite book?</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Security Answer *</label>
          <input type="text" name="securityAnswer" className="form-control" style={inputStyle} placeholder="Enter your answer" required />
        </div>
      </div>

      {error && (
        <div className="animate-fade-in" style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.95rem', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.15)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          ⚠️ {error}
        </div>
      )}

      <button type="submit" className="btn-rgb-action" style={{
        padding: '0.85rem',
        fontSize: '1rem',
        marginTop: '1.2rem',
        fontWeight: '700',
        borderRadius: '12px',
        border: 'none',
        color: '#ffffff',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s'
      }}>
        Create Account
      </button>
    </form>
  );
};

export default SignUp;
