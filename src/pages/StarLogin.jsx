import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getStarBatchConfig } from '../services/starBatchService';
import { getUserByPhone, registerUser } from '../auth/authService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Sparkles } from 'lucide-react';

export default function StarLogin() {
  const navigate = useNavigate();
  const { savePassword, login, updateCurrentUser, refreshUser } = useAuth();
  
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleStep1(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const config = await getStarBatchConfig();
      if (config.code !== code) {
        throw new Error("Invalid Star Batch access code.");
      }
      
      const existing = await getUserByPhone(phone.trim());
      if (existing) {
        setIsNewUser(false);
        setStep(2);
      } else {
        if (!name.trim()) throw new Error("Name is required for new users.");
        await registerUser({ name: name.trim(), phone: phone.trim(), rollNo: 85 });
        setIsNewUser(true);
        setStep(2);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleStep2(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isNewUser) {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        await savePassword(phone.trim(), password);
      } else {
        await login(phone.trim(), password);
      }
      
      // Update user document to mark unlocked
      await updateDoc(doc(db, 'users', phone.trim()), { hasUnlockedStarBatch: true });
      await refreshUser(phone.trim()); // To ensure contextual user is updated
      updateCurrentUser({ hasUnlockedStarBatch: true });
      
      navigate('/star-batch');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '1rem', animation: 'fade-in 0.4s ease' }}>
      <div className="auth-modal" style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
            <Sparkles size={32} color="#fbbf24" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Star Batch Login</h2>
          <p className="as-muted" style={{ fontSize: '0.9rem' }}>Exclusive access for Elite students.</p>
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Phone Number</label>
              <input type="tel" className="auth-input" value={phone} onChange={e => setPhone(e.target.value)} maxLength={10} required autoFocus placeholder="10-digit mobile number" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Full Name (Required for new users)</label>
              <input type="text" className="auth-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aditya Gupta" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Special Access Code</label>
              <input type="text" className="auth-input" value={code} onChange={e => setCode(e.target.value)} maxLength={4} required style={{ textAlign: 'center', letterSpacing: '0.5rem', fontWeight: 600, fontSize: '1.2rem' }} placeholder="----" />
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>{error}</p>}
            <button type="submit" className="auth-btn primary" disabled={busy}>
              {busy ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              {isNewUser ? 'Create a password for your new account.' : 'Welcome back! Enter your password.'}
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Password</label>
              <input type="password" className="auth-input" value={password} onChange={e => setPassword(e.target.value)} required autoFocus placeholder={isNewUser ? 'Min 6 characters' : 'Your password'} />
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>{error}</p>}
            <button type="submit" className="auth-btn primary" disabled={busy}>
              {busy ? (isNewUser ? 'Saving...' : 'Logging in...') : (isNewUser ? 'Set Password & Enter' : 'Login & Enter')}
            </button>
            <button type="button" className="auth-link" onClick={() => { setError(''); setStep(1); }}>← Back</button>
          </form>
        )}
      </div>
    </div>
  );
}
