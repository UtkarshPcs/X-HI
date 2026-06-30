/**
 * MembersList.jsx
 * Displays online members in the study room.
 * Owner sees a "Remove" button next to each non-owner member.
 */

import { memo, useCallback } from 'react';
import { UserX, Crown } from 'lucide-react';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0]).toUpperCase();
}

// Stable colour per user based on phone hash — avoids re-assigning on re-render
const AVATAR_COLOURS = [
  '#8b5cf6', '#ec4899', '#10b981', '#f59e0b',
  '#3b82f6', '#ef4444', '#06b6d4', '#84cc16',
];
function avatarColour(phone) {
  let hash = 0;
  for (let i = 0; i < phone.length; i++) hash = phone.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length];
}

/**
 * @param {{
 *   members: object[],
 *   ownerPhone: string,
 *   currentUserPhone: string,
 *   isOwner: boolean,
 *   onKick: (phone: string) => void,
 * }} props
 */
const MembersList = memo(function MembersList({ members, ownerPhone, currentUserPhone, isOwner, onKick }) {
  const handleKick = useCallback((phone) => {
    if (window.confirm('Remove this member from the room?')) {
      onKick(phone);
    }
  }, [onKick]);

  if (!members || members.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No one online yet.</p>
      </div>
    );
  }

  return (
    <ul style={styles.list} aria-label="Online members">
      {members.map((m) => {
        const isThisOwner = m.phone === ownerPhone;
        const isMe        = m.phone === currentUserPhone;

        return (
          <li key={m.phone} style={styles.item}>
            {/* Avatar */}
            <span
              style={{
                ...styles.avatar,
                background: avatarColour(m.phone),
              }}
              aria-hidden="true"
            >
              {getInitials(m.name)}
            </span>

            {/* Name + badges */}
            <span style={styles.nameWrap}>
              <span style={styles.name}>
                {m.name}
                {isMe && <span style={styles.youBadge}>you</span>}
              </span>
              {isThisOwner && (
                <span style={styles.ownerBadge}>
                  <Crown size={10} style={{ marginRight: 3 }} />
                  Host
                </span>
              )}
            </span>

            {/* Online dot */}
            <span style={styles.onlineDot} title="Online" aria-label="online" />

            {/* Remove button (owner only, can't kick self or other owner) */}
            {isOwner && !isMe && !isThisOwner && (
              <button
                style={styles.kickBtn}
                onClick={() => handleKick(m.phone)}
                title={`Remove ${m.name}`}
                aria-label={`Remove ${m.name}`}
              >
                <UserX size={14} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
});

const styles = {
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.4rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    transition: 'background 0.15s',
  },
  avatar: {
    flexShrink: 0,
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#fff',
  },
  nameWrap: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
  },
  name: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  youBadge: {
    fontSize: '0.65rem',
    background: 'rgba(139,92,246,0.15)',
    color: 'var(--primary)',
    padding: '0.05rem 0.35rem',
    borderRadius: 999,
    fontWeight: 600,
  },
  ownerBadge: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.65rem',
    color: '#f59e0b',
    fontWeight: 600,
  },
  onlineDot: {
    flexShrink: 0,
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 6px rgba(16,185,129,0.7)',
  },
  kickBtn: {
    flexShrink: 0,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    padding: '0.2rem',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.15s',
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
};

export default MembersList;
