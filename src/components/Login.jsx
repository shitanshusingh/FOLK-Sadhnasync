import { useState } from 'react';
import { Eye, EyeOff, LogIn, KeyRound, ArrowLeft } from 'lucide-react';
import { cloudFetchAllUsers } from '../services/firebase';

const Login = ({ onAuthSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Recovery Flow State
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: Email, 2: Answer, 3: New Password
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryUser, setRecoveryUser] = useState(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const identifier = e.target.identifier.value.trim().toLowerCase();
    const password = e.target.password.value;
    setIsLoading(true);
    setError('');

    try {
      // ☁️ Always fetch latest users from Firebase cloud first
      const users = await cloudFetchAllUsers();
      const user = users.find(u =>
        (u.email.toLowerCase() === identifier || (u.userId && u.userId.toLowerCase() === identifier))
        && u.password === password
      );

      if (user) {
        localStorage.setItem('sadhana_remembered_email', user.email);
        onAuthSuccess(user);
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      // Fallback to localStorage if cloud fetch fails
      const localUsers = JSON.parse(localStorage.getItem('sadhana_users') || '[]');
      const user = localUsers.find(u =>
        (u.email.toLowerCase() === identifier || (u.userId && u.userId.toLowerCase() === identifier))
        && u.password === password
      );
      if (user) {
        localStorage.setItem('sadhana_remembered_email', user.email);
        onAuthSuccess(user);
      } else {
        setError('Invalid username or password');
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleRecoverySubmit = (e) => {
    e.preventDefault();
    setError('');
    const users = JSON.parse(localStorage.getItem('sadhana_users') || '[]');
    
    if (recoveryStep === 1) {
      const email = e.target.recoveryEmail.value;
      const user = users.find(u => u.email === email);
      if (user && user.securityQuestion) {
        setRecoveryEmail(email);
        setRecoveryUser(user);
        setRecoveryStep(2);
      } else if (user && !user.securityQuestion) {
        setError('This account does not have a security question set.');
      } else {
        setError('No account found with this email.');
      }
    } 
    else if (recoveryStep === 2) {
      const answer = e.target.securityAnswer.value;
      // Case insensitive check
      if (recoveryUser.securityAnswer.trim().toLowerCase() === answer.trim().toLowerCase()) {
        setRecoveryStep(3);
      } else {
        setError('Incorrect security answer.');
      }
    }
    else if (recoveryStep === 3) {
      const newPassword = e.target.newPassword.value;
      const confirmPassword = e.target.confirmPassword.value;
      
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      
      // Update password in local storage
      const userIndex = users.findIndex(u => u.email === recoveryEmail);
      if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('sadhana_users', JSON.stringify(users));
        alert('Password successfully reset! Please login with your new password.');
        setIsRecovering(false);
        setRecoveryStep(1);
        setRecoveryUser(null);
        setRecoveryEmail('');
      }
    }
  };

  const rememberedEmail = localStorage.getItem('sadhana_remembered_email') || '';

  if (isRecovering) {
    return (
      <form onSubmit={handleRecoverySubmit} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><KeyRound size={20} color="#f59e0b" /> Account Recovery</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            {recoveryStep === 1 && "Enter your registered email ID."}
            {recoveryStep === 2 && "Answer your security question."}
            {recoveryStep === 3 && "Create a new password."}
          </p>
        </div>

        {error && <div style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
        
        {recoveryStep === 1 && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontWeight: '500', fontSize: '0.9rem' }}>Email ID *</label>
            <input type="email" name="recoveryEmail" className="form-control" style={{ width: '100%', fontSize: '1rem', padding: '0.9rem', backgroundColor: '#0b1120', borderColor: '#334155', color: '#f8fafc' }} required />
          </div>
        )}

        {recoveryStep === 2 && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f59e0b', fontWeight: 'bold', fontSize: '0.95rem' }}>{recoveryUser?.securityQuestion}</label>
            <input type="text" name="securityAnswer" placeholder="Your Answer" className="form-control" style={{ width: '100%', fontSize: '1rem', padding: '0.9rem', backgroundColor: '#0b1120', borderColor: '#334155', color: '#f8fafc' }} required />
          </div>
        )}

        {recoveryStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontWeight: '500', fontSize: '0.9rem' }}>New Password *</label>
              <input type="password" name="newPassword" minLength="6" className="form-control" style={{ width: '100%', fontSize: '1rem', padding: '0.9rem', backgroundColor: '#0b1120', borderColor: '#334155', color: '#f8fafc' }} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontWeight: '500', fontSize: '0.9rem' }}>Confirm New Password *</label>
              <input type="password" name="confirmPassword" minLength="6" className="form-control" style={{ width: '100%', fontSize: '1rem', padding: '0.9rem', backgroundColor: '#0b1120', borderColor: '#334155', color: '#f8fafc' }} required />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="button" onClick={() => { setIsRecovering(false); setRecoveryStep(1); setError(''); }} className="nav-btn btn-secondary" style={{ flex: 1, padding: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Back
          </button>
          <button type="submit" className="nav-btn btn-primary" style={{ flex: 2, padding: '0.9rem', fontWeight: 'bold' }}>
            {recoveryStep === 3 ? "Reset Password" : "Continue"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleLoginSubmit} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {error && <div style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
      
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontWeight: '500', fontSize: '0.9rem' }}>Email or User ID *</label>
        <input 
          type="text" 
          name="identifier" 
          placeholder="Enter your Email or User ID"
          defaultValue={rememberedEmail} 
          className="form-control" 
          style={{ width: '100%', fontSize: '1rem', padding: '0.9rem', backgroundColor: '#0b1120', borderColor: '#334155', color: '#f8fafc' }} 
          required 
        />
      </div>

      <div style={{ position: 'relative' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontWeight: '500', fontSize: '0.9rem' }}>Password *</label>
        <input 
          type={showPassword ? 'text' : 'password'} 
          name="password" 
          placeholder="Enter password"
          className="form-control" 
          style={{ width: '100%', fontSize: '1rem', padding: '0.9rem', paddingRight: '2.5rem', backgroundColor: '#0b1120', borderColor: '#334155', color: '#f8fafc' }} 
          required 
        />
        <button 
          type="button" 
          onClick={() => setShowPassword(!showPassword)} 
          style={{ position: 'absolute', right: '12px', top: '35px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); setIsRecovering(true); setError(''); }} style={{ color: '#3b82f6', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer' }}>
          Forgot Password?
        </a>
      </div>

      <button type="submit" disabled={isLoading} className="btn-rgb-action" style={{
        padding: '0.85rem',
        fontSize: '1rem',
        marginTop: '0.6rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: '700',
        borderRadius: '12px',
        border: 'none',
        color: '#ffffff',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
        opacity: isLoading ? 0.7 : 1
      }}>
        {isLoading ? '⏳ Connecting to Cloud...' : <><LogIn size={18} /> Login</>}
      </button>
    </form>
  );
};

export default Login;
