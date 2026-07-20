import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { verifyAndMarkAccessCode } from '../auth/authService';

export default function AccessCodeGate() {
  const { currentUser, refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // The gate is only shown for logged in, unverified, non-custom/teacher users.
  // We handle this condition in App.jsx rendering, but we can also double check here.
  if (!currentUser) return null;
  if (currentUser.accessCodeVerified) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (code.length !== 6) {
      setErr('Access code must be 6 digits.');
      return;
    }
    setBusy(true);
    try {
      await verifyAndMarkAccessCode(currentUser.phone, currentUser.rollNo, code);
      // Wait a tiny bit then refresh to let context re-evaluate
      await refreshUser(currentUser.phone);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    }}>
      <div className="auth-modal" style={{ display: 'block', maxWidth: '400px', width: '100%', pointerEvents: 'auto', margin: 0, position: 'relative', transform: 'none' }}>
        <div className="auth-step">
          <div className="auth-success-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🔒</div>
          <h2 style={{ marginTop: '0.5rem' }}>Verify Your Access</h2>
          <p className="auth-sub">
            Enter the 6-digit access code for your roll number. This is a one-time verification to protect your account.
          </p>

          <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label>Roll Number: <strong style={{ color: 'var(--primary)' }}>{String(currentUser.rollNo).padStart(2, '0')}</strong></label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                required
                autoFocus
                style={{ marginTop: '0.25rem', textAlign: 'center', letterSpacing: '0.25em', fontSize: '1.1rem' }}
              />
            </div>
            
            {err && <p className="auth-err" style={{ margin: 0 }}>{err}</p>}

            <button className="auth-btn primary" type="submit" disabled={busy}>
              {busy ? 'Verifying…' : 'Verify & Continue'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', width: '100%', textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Don't have your code?</p>
            <a 
              href="https://wa.me/918102783645" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#25D366', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem' }}
            >
              💬 Message Utkarsh on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
