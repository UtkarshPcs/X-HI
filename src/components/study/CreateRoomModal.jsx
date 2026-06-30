/**
 * CreateRoomModal.jsx
 * Modal form to create a new study room.
 * Validates YouTube URL before submission.
 */

import { useState } from 'react';
import { X, Play, Lock, BookOpen } from 'lucide-react';
import { isValidYouTubeUrl } from '../../services/studyRoomService';

/**
 * @param {{
 *   onClose: () => void,
 *   onCreate: (data: { name: string, youtubeUrl: string, password?: string }) => Promise<void>,
 * }} props
 */
export default function CreateRoomModal({ onClose, onCreate }) {
  const [name,       setName]       = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [password,   setPassword]   = useState('');
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errs = {};
    if (!name.trim())              errs.name = 'Room name is required.';
    if (name.trim().length > 60)   errs.name = 'Name must be 60 characters or less.';
    if (!youtubeUrl.trim())        errs.youtubeUrl = 'YouTube URL is required.';
    else if (!isValidYouTubeUrl(youtubeUrl)) errs.youtubeUrl = 'Please enter a valid YouTube video or live URL.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        youtubeUrl: youtubeUrl.trim(),
        password: password.trim() || undefined,
      });
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to create room. Try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Create study room">
      <div style={styles.modal} onClick={e => e.stopPropagation()} className="spring-up">

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>
            <BookOpen size={20} color="var(--primary)" />
          </div>
          <div>
            <h2 style={styles.title}>Create a Study Room</h2>
            <p style={styles.subtitle}>Start a collaborative session around a YouTube lecture or stream.</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>

          {/* Room name */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="room-name">Room Name</label>
            <input
              id="room-name"
              style={{ ...styles.input, borderColor: errors.name ? '#ef4444' : 'var(--border)' }}
              type="text"
              placeholder="e.g. Physics Chapter 12 – Today's lecture"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(v => ({ ...v, name: '' })); }}
              maxLength={60}
              autoFocus
              autoComplete="off"
            />
            {errors.name && <span style={styles.error}>{errors.name}</span>}
          </div>

          {/* YouTube URL */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="room-url">
              <Play size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              YouTube URL
            </label>
            <input
              id="room-url"
              style={{ ...styles.input, borderColor: errors.youtubeUrl ? '#ef4444' : 'var(--border)' }}
              type="url"
              placeholder="https://www.youtube.com/watch?v=…"
              value={youtubeUrl}
              onChange={e => { setYoutubeUrl(e.target.value); setErrors(v => ({ ...v, youtubeUrl: '' })); }}
              autoComplete="off"
            />
            {errors.youtubeUrl
              ? <span style={styles.error}>{errors.youtubeUrl}</span>
              : <span style={styles.hint}>Supports regular videos and YouTube Live streams.</span>
            }
          </div>

          {/* Password (optional) */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="room-password">
              <Lock size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              id="room-password"
              style={styles.input}
              type="text"
              placeholder="Leave blank for no password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              maxLength={50}
              autoComplete="off"
            />
            <span style={styles.hint}>Members will need this password to join.</span>
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div style={styles.submitError}>{errors.submit}</div>
          )}

          {/* Actions */}
          <div style={styles.actions}>
            <button
              type="button"
              className="auth-btn secondary"
              onClick={onClose}
              disabled={submitting}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="auth-btn primary"
              disabled={submitting}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              {submitting ? 'Creating…' : <><BookOpen size={15} /> Create Room</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: 480,
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '1.25rem 1.5rem 1rem',
    borderBottom: '1px solid var(--border)',
  },
  headerIcon: {
    flexShrink: 0,
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(139,92,246,0.12)',
    border: '1px solid rgba(139,92,246,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    marginTop: '0.15rem',
  },
  closeBtn: {
    marginLeft: 'auto',
    flexShrink: 0,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    padding: '0.2rem',
    display: 'flex',
    alignItems: 'center',
  },
  form: {
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  input: {
    background: 'var(--surface-hover)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '0.55rem 0.85rem',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
  },
  hint: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  error: {
    fontSize: '0.78rem',
    color: '#ef4444',
  },
  submitError: {
    fontSize: '0.85rem',
    color: '#ef4444',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.6rem 0.85rem',
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.25rem',
  },
};
