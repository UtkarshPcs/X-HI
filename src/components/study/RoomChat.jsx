/**
 * RoomChat.jsx
 * Real-time chat panel for a study room.
 * Auto-scrolls to latest message, supports Enter-to-send.
 */

import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { Send } from 'lucide-react';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0]).toUpperCase();
}

const AVATAR_COLOURS = [
  '#8b5cf6', '#ec4899', '#10b981', '#f59e0b',
  '#3b82f6', '#ef4444', '#06b6d4', '#84cc16',
];
function avatarColour(phone) {
  let hash = 0;
  for (let i = 0; i < phone.length; i++) hash = phone.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length];
}

// Single chat message bubble
const ChatMessage = memo(function ChatMessage({ msg, isOwn }) {
  return (
    <div style={{ ...styles.msgRow, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
      {!isOwn && (
        <span
          style={{ ...styles.msgAvatar, background: avatarColour(msg.senderPhone) }}
          aria-hidden="true"
        >
          {getInitials(msg.senderName)}
        </span>
      )}
      <div style={{ maxWidth: '75%' }}>
        {!isOwn && (
          <span style={styles.msgSender}>{msg.senderName}</span>
        )}
        <div style={{
          ...styles.msgBubble,
          background: isOwn ? 'var(--primary)' : 'var(--surface-hover)',
          borderRadius: isOwn
            ? '1rem 1rem 0.2rem 1rem'
            : '1rem 1rem 1rem 0.2rem',
          alignSelf: isOwn ? 'flex-end' : 'flex-start',
        }}>
          <span style={styles.msgText}>{msg.text}</span>
          <span style={{ ...styles.msgTime, color: isOwn ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
            {formatTime(msg.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
});

/**
 * @param {{
 *   messages: object[],
 *   sending: boolean,
 *   onSend: (text: string) => void,
 *   currentUserPhone: string,
 *   disabled?: boolean,
 * }} props
 */
const RoomChat = memo(function RoomChat({ messages, sending, onSend, currentUserPhone, disabled }) {
  const [text, setText]         = useState('');
  const bottomRef               = useRef(null);
  const chatBodyRef             = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll when messages arrive, but only if user hasn't scrolled up
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  function handleScroll() {
    if (!chatBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
    // Re-enable auto-scroll if within 60px of bottom
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 60);
  }

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    onSend(trimmed);
    setText('');
    // Force-scroll after sending own message
    setAutoScroll(true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [text, sending, disabled, onSend]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div style={styles.root}>
      {/* Message list */}
      <div
        style={styles.body}
        ref={chatBodyRef}
        onScroll={handleScroll}
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              No messages yet.<br />Say hi! 👋
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <ChatMessage
              key={msg.id}
              msg={msg}
              isOwn={msg.senderPhone === currentUserPhone}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom nudge */}
      {!autoScroll && (
        <button
          style={styles.scrollBtn}
          onClick={() => {
            setAutoScroll(true);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          aria-label="Scroll to latest message"
        >
          ↓ New messages
        </button>
      )}

      {/* Input bar */}
      <div style={styles.inputRow}>
        <textarea
          style={styles.input}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Chat disabled' : 'Type a message…'}
          disabled={disabled || sending}
          rows={1}
          maxLength={500}
          aria-label="Chat message input"
        />
        <button
          style={{
            ...styles.sendBtn,
            opacity: (!text.trim() || sending || disabled) ? 0.4 : 1,
          }}
          onClick={submit}
          disabled={!text.trim() || sending || disabled}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
});

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: 'relative',
    minHeight: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    minHeight: 0,
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--border) transparent',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '2rem',
  },
  msgRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.4rem',
  },
  msgAvatar: {
    flexShrink: 0,
    width: 24,
    height: 24,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.6rem',
    fontWeight: 700,
    color: '#fff',
  },
  msgSender: {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '0.15rem',
    paddingLeft: '0.1rem',
  },
  msgBubble: {
    padding: '0.45rem 0.65rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  },
  msgText: {
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    lineHeight: 1.5,
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  msgTime: {
    fontSize: '0.65rem',
    alignSelf: 'flex-end',
  },
  scrollBtn: {
    position: 'absolute',
    bottom: 64,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 999,
    padding: '0.3rem 0.8rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    zIndex: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.5rem',
    padding: '0.6rem',
    borderTop: '1px solid var(--border)',
    background: 'var(--surface)',
  },
  input: {
    flex: 1,
    background: 'var(--surface-hover)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    outline: 'none',
    transition: 'border-color 0.2s',
    maxHeight: 100,
    overflowY: 'auto',
  },
  sendBtn: {
    flexShrink: 0,
    background: 'var(--primary)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: '#fff',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.1s',
  },
};

export default RoomChat;
