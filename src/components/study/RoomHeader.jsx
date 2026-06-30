/**
 * RoomHeader.jsx
 * Top bar for the study room page. Shows room name, member count, room code,
 * and owner controls (change video URL, lock/unlock, end room).
 */

import { memo, useState } from 'react';
import {
  Users, Copy, Check, Lock, Unlock,
  Video, StopCircle, ArrowLeft, ExternalLink,
} from 'lucide-react';
import { isValidYouTubeUrl } from '../../services/studyRoomService';

/**
 * @param {{
 *   room: object,
 *   memberCount: number,
 *   isOwner: boolean,
 *   onChangeVideo: (url: string) => void,
 *   onToggleLock: () => void,
 *   onEndRoom: () => void,
 *   onBack: () => void,
 * }} props
 */
const RoomHeader = memo(function RoomHeader({
  room, memberCount, isOwner,
  onChangeVideo, onToggleLock, onEndRoom, onBack,
}) {
  const [copied, setCopied]           = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [newUrl, setNewUrl]           = useState('');
  const [urlError, setUrlError]       = useState('');

  function copyRoomCode() {
    const shareUrl = `${window.location.origin}/study-together/${room.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback: copy just the code
      navigator.clipboard.writeText(room.roomCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function submitVideoChange(e) {
    e.preventDefault();
    if (!isValidYouTubeUrl(newUrl)) {
      setUrlError('Please enter a valid YouTube URL.');
      return;
    }
    setUrlError('');
    onChangeVideo(newUrl);
    setNewUrl('');
    setShowVideoForm(false);
  }

  return (
    <div style={styles.root}>
      {/* Left: back button + room name */}
      <div style={styles.left}>
        <button style={styles.backBtn} onClick={onBack} aria-label="Leave room" title="Leave room">
          <ArrowLeft size={18} />
        </button>
        <div style={styles.titleWrap}>
          <h1 style={styles.title}>{room.name}</h1>
          <div style={styles.meta}>
            <span style={styles.metaItem}>
              <Users size={12} /> {memberCount} online
            </span>
            {room.isLocked && (
              <span style={{ ...styles.metaItem, color: '#f59e0b' }}>
                <Lock size={12} /> Locked
              </span>
            )}
            <span style={styles.metaItem}>Code: <strong>{room.roomCode}</strong></span>
          </div>
        </div>
      </div>

      {/* Right: action buttons */}
      <div style={styles.right}>
        {/* Copy room link */}
        <button
          style={styles.iconBtn}
          onClick={copyRoomCode}
          title="Copy room link"
          aria-label="Copy room link"
        >
          {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
        </button>

        {/* Open video in YouTube */}
        <a
          href={room.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.iconBtn}
          title="Open in YouTube"
          aria-label="Open video in YouTube"
        >
          <ExternalLink size={16} />
        </a>

        {/* Owner: change video */}
        {isOwner && (
          <button
            style={{ ...styles.iconBtn, color: showVideoForm ? 'var(--primary)' : undefined }}
            onClick={() => setShowVideoForm(v => !v)}
            title="Change video"
            aria-label="Change video"
          >
            <Video size={16} />
          </button>
        )}

        {/* Owner: lock/unlock */}
        {isOwner && (
          <button
            style={{
              ...styles.iconBtn,
              color: room.isLocked ? '#f59e0b' : undefined,
            }}
            onClick={onToggleLock}
            title={room.isLocked ? 'Unlock room' : 'Lock room'}
            aria-label={room.isLocked ? 'Unlock room' : 'Lock room'}
          >
            {room.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
          </button>
        )}

        {/* Owner: end room */}
        {isOwner && (
          <button
            style={{ ...styles.iconBtn, color: '#ef4444' }}
            onClick={() => {
              if (window.confirm('End the room for everyone? This cannot be undone.')) {
                onEndRoom();
              }
            }}
            title="End room"
            aria-label="End room"
          >
            <StopCircle size={16} />
          </button>
        )}
      </div>

      {/* Change video form (inline dropdown) */}
      {showVideoForm && isOwner && (
        <form style={styles.videoForm} onSubmit={submitVideoChange}>
          <input
            style={styles.videoInput}
            type="url"
            placeholder="Paste new YouTube URL…"
            value={newUrl}
            onChange={e => { setNewUrl(e.target.value); setUrlError(''); }}
            autoFocus
            aria-label="New YouTube URL"
          />
          {urlError && <span style={styles.urlError}>{urlError}</span>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="auth-btn primary" style={{ flex: 1, padding: '0.4rem' }}>
              Update
            </button>
            <button
              type="button"
              className="auth-btn secondary"
              style={{ flex: 1, padding: '0.4rem' }}
              onClick={() => { setShowVideoForm(false); setUrlError(''); setNewUrl(''); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
});

const styles = {
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    position: 'relative',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1,
    minWidth: 0,
  },
  backBtn: {
    flexShrink: 0,
    background: 'var(--surface-hover)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    width: 34,
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'color 0.15s',
  },
  titleWrap: {
    minWidth: 0,
    flex: 1,
  },
  title: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginTop: '0.15rem',
  },
  metaItem: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
    transition: 'background 0.15s, color 0.15s',
    textDecoration: 'none',
  },
  videoForm: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem',
    background: 'var(--surface-hover)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
  },
  videoInput: {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '0.45rem 0.75rem',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    outline: 'none',
  },
  urlError: {
    fontSize: '0.8rem',
    color: '#ef4444',
  },
};

export default RoomHeader;
