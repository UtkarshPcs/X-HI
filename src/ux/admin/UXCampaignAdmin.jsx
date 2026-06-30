/**
 * UXCampaignAdmin.jsx
 * Admin panel for managing UX campaigns.
 * Replaces the scattered reset buttons in AdminServicesPage OnboardingTab.
 *
 * Usage (inside AdminServicesPage):
 *   import UXCampaignAdmin from '../ux/admin/UXCampaignAdmin';
 *   <UXCampaignAdmin />
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useUX } from '../UXProvider';
import { ROLES } from '../../auth/roles';
import { RotateCcw, Play, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

const TYPE_BADGE_COLOR = {
  banner:   { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa' },
  modal:    { bg: 'rgba(236,72,153,0.12)', color: '#ec4899' },
  tour:     { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
  prompt:   { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  toast:    { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa' },
};

function TypeBadge({ type }) {
  const colors = TYPE_BADGE_COLOR[type] || { bg: 'var(--surface-hover)', color: 'var(--text-muted)' };
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      padding: '0.15rem 0.5rem', borderRadius: 999,
      background: colors.bg, color: colors.color,
    }}>
      {type}
    </span>
  );
}

export default function UXCampaignAdmin() {
  const navigate = useNavigate();
  const { currentUser, triggerTour } = useAuth();
  const { allCampaigns, queue, reset, resetAll, isActive } = useUX();
  const [busy, setBusy]             = useState(null);
  const [expanded, setExpanded]     = useState(null);
  const [resetAllDone, setResetAllDone] = useState(false);

  async function handleReset(campaignId) {
    setBusy(campaignId);
    try { await reset(campaignId); } finally { setBusy(null); }
  }

  async function handleResetAll() {
    if (!window.confirm('Reset ALL UX campaigns for your account? Every tour, banner, and modal will show again.')) return;
    setBusy('__all__');
    try {
      await resetAll();
      setResetAllDone(true);
      setTimeout(() => setResetAllDone(false), 3000);
    } finally { setBusy(null); }
  }

  function handleTestTour(role) {
    triggerTour(role);
    navigate('/');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── Quick tour testers ───────────────────────────────────────── */}
      <div>
        <p className="as-muted" style={{ marginBottom: '0.75rem' }}>
          Tours run on the dashboard — you'll be taken there first.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[ROLES.STUDENT, ROLES.MONITOR, ROLES.TEACHER].map(role => (
            <button
              key={role}
              className="auth-btn secondary"
              style={{ flex: 1, minWidth: 100 }}
              onClick={() => handleTestTour(role)}
            >
              <Play size={13} style={{ marginRight: 4 }} />
              {role[0] + role.slice(1).toLowerCase()} Tour
            </button>
          ))}
        </div>
      </div>

      {/* ── Reset all ───────────────────────────────────────────────── */}
      <button
        className="auth-btn secondary"
        style={{ width: '100%', color: resetAllDone ? '#10b981' : undefined }}
        disabled={busy === '__all__'}
        onClick={handleResetAll}
      >
        <RotateCcw size={14} style={{ marginRight: 6 }} />
        {busy === '__all__' ? 'Resetting…' : resetAllDone ? '✓ All campaigns reset' : 'Reset All Campaigns'}
      </button>

      {/* ── Campaign list ────────────────────────────────────────────── */}
      <div>
        <p className="as-muted" style={{ marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          All Campaigns
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {allCampaigns.map(c => {
            const active = isActive(c.id);
            const isExpanded = expanded === c.id;

            return (
              <div
                key={c.id}
                style={{
                  background: 'var(--surface-hover)',
                  border: `1px solid ${active ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                }}
              >
                {/* Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.75rem' }}>
                  {/* Status dot */}
                  <span style={{
                    flexShrink: 0, width: 8, height: 8, borderRadius: '50%',
                    background: active ? '#10b981' : 'var(--border)',
                    boxShadow: active ? '0 0 6px rgba(16,185,129,0.6)' : 'none',
                  }} title={active ? 'Active' : 'Seen / Dismissed'} />

                  {/* ID + type */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {c.id}
                    </span>
                  </div>

                  <TypeBadge type={c.type} />

                  {/* Priority */}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>p{c.priority}</span>

                  {/* Actions */}
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.15rem', display: 'flex', alignItems: 'center' }}
                    onClick={() => handleReset(c.id)}
                    disabled={busy === c.id}
                    title="Reset this campaign"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.15rem', display: 'flex', alignItems: 'center' }}
                    onClick={() => setExpanded(isExpanded ? null : c.id)}
                    title="Details"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span><strong>Storage:</strong> {c.storage}</span>
                    <span><strong>Priority:</strong> {c.priority}</span>
                    <span><strong>Dismissible:</strong> {c.dismissible ? 'Yes' : 'No'}</span>
                    <span><strong>Status:</strong> {active ? '🟢 Active in queue' : '⚫ Seen / Dismissed'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
