import { useState } from 'react';
import { GitMerge, X, KeyRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { dismissMergeBanner } from '../services/mergeService';
import { updatePassword } from '../auth/authService';

/**
 * Shown on the dashboard when a user's account was recently merged.
 * If passwordHash is null (post-merge), they must set a new password first.
 */
export default function MergeBanner() {
  const { currentUser, login } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [settingPw, setSettingPw] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  if (!currentUser) return null;
  const needsMerge = currentUser.mergedAt && !currentUser.mergeBannerSeen;
  const needsPassword = !currentUser.passwordHash;

  if ((!needsMerge && !needsPassword) || dismissed) return null;

  function mask(phone) {
    return phone?.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2') || '—';
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    setErr('');
    if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (pw !== pw2) { setErr('Passwords do not match.'); return; }
    setSaving(true);
    try {
      await updatePassword(currentUser.phone, pw);
      // Re-login with new password to refresh session
      await login(currentUser.phone, pw);
      setSettingPw(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDismiss() {
    await dismissMergeBanner(currentUser.phone).catch(() => {});
    setDismissed(true);
  }

  return (
    <div className="merge-banner">
      <div className="merge-banner-icon"><GitMerge size={18} /></div>
      <div className="merge-banner-body">
        <strong>Your accounts have been merged.</strong>
        <p>
          Your two phone numbers ({mask(currentUser.phone)} and {mask(currentUser.alternatePhone)}) are now linked to one profile.
          All your data has been combined. You can log in with either number.
        </p>

        {needsPassword && !settingPw && (
          <button className="auth-btn" style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setSettingPw(true)}>
            <KeyRound size={14} /> Set a new password to continue
          </button>
        )}

        {settingPw && (
          <form onSubmit={handleSetPassword} style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 300 }}>
            <input className="auth-input" type="password" placeholder="New password (min 6 chars)"
              value={pw} onChange={e => setPw(e.target.value)} autoFocus />
            <input className="auth-input" type="password" placeholder="Confirm new password"
              value={pw2} onChange={e => setPw2(e.target.value)} />
            {err && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>{err}</p>}
            <button className="auth-btn" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Set Password'}
            </button>
          </form>
        )}
      </div>
      {!needsPassword && (
        <button className="merge-banner-close" onClick={handleDismiss} title="Dismiss">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
