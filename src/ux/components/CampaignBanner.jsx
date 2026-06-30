/**
 * CampaignBanner.jsx
 * Renders any banner-type campaign from the UX queue.
 * Replaces: MarksBanner.jsx, MergeBanner.jsx, email reminder inline in StudentDashboard.
 *
 * Variants:
 *   'info'   — standard dismiss banner with optional CTA (MarksBanner, email reminder)
 *   'merge'  — account merge banner with inline password form (MergeBanner)
 *
 * Usage:
 *   <CampaignBanner campaignId="marks-banner-v1" />
 *   <CampaignBanner campaignId="merge-banner-v1" />
 *   <CampaignBanner campaignId="email-reminder-v1" />
 */

import { useState } from 'react';
import { X, GitMerge, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useUX } from '../UXProvider';
import { getCampaign } from '../campaignConfig';
import { dismissMergeBanner } from '../../services/mergeService';
import { updatePassword } from '../../auth/authService';

/**
 * @param {{ campaignId: string }} props
 */
export default function CampaignBanner({ campaignId }) {
  const { currentUser, login } = useAuth();
  const { isActive, dismiss } = useUX();
  const navigate = useNavigate();

  // Merge form state (only used by merge variant)
  const [settingPw, setSettingPw] = useState(false);
  const [pw, setPw]   = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isActive(campaignId)) return null;

  const campaign = getCampaign(campaignId);
  if (!campaign) return null;

  const { content } = campaign;
  const Icon = content.icon;

  // ── Merge variant ─────────────────────────────────────────────────────────
  if (content.variant === 'merge') {
    const needsPassword = !currentUser?.passwordHash;

    function mask(phone) {
      return phone?.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2') || '—';
    }

    async function handleSetPassword(e) {
      e.preventDefault();
      setErr('');
      if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
      if (pw !== pw2)    { setErr('Passwords do not match.'); return; }
      setSaving(true);
      try {
        await updatePassword(currentUser.phone, pw);
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
      dismiss(campaignId);
    }

    return (
      <div className="merge-banner">
        <div className="merge-banner-icon"><GitMerge size={18} /></div>
        <div className="merge-banner-body">
          <strong>{content.title}</strong>
          <p>
            Your two phone numbers ({mask(currentUser?.phone)} and {mask(currentUser?.alternatePhone)}) are now linked to one profile.
            All your data has been combined. You can log in with either number.
          </p>

          {needsPassword && !settingPw && (
            <button
              className="auth-btn"
              style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setSettingPw(true)}
            >
              <KeyRound size={14} /> Set a new password to continue
            </button>
          )}

          {settingPw && (
            <form
              onSubmit={handleSetPassword}
              style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 300 }}
            >
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
          <button className="merge-banner-close" onClick={handleDismiss} title="Dismiss" aria-label="Dismiss">
            <X size={16} />
          </button>
        )}
      </div>
    );
  }

  // ── Info variant (default) ────────────────────────────────────────────────
  function handleCta() {
    dismiss(campaignId);
    if (content.ctaRoute) navigate(content.ctaRoute);
  }

  return (
    <div className="marks-banner">
      {Icon && <Icon size={18} className="marks-banner-icon" />}
      <div className="marks-banner-body">
        <strong>{content.title}</strong>
        {content.body && <p>{content.body}</p>}
        {content.cta && (
          <button
            className="auth-btn"
            style={{ marginTop: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            onClick={handleCta}
          >
            {content.cta}
          </button>
        )}
      </div>
      <button
        className="merge-banner-close"
        onClick={() => dismiss(campaignId)}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
