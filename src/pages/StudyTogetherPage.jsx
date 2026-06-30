/**
 * StudyTogetherPage.jsx
 * Lobby page — shows active rooms, lets users create new rooms or join by code.
 * Route: /study-together
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Search, Users, Lock, RefreshCw,
  ArrowRight, LogIn,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import {
  subscribeToActiveRooms,
  createRoom,
  getRoomByCode,
} from '../services/studyRoomService';
import CreateRoomModal from '../components/study/CreateRoomModal';

function formatAge(ts) {
  if (!ts) return '';
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function RoomCard({ room, onJoin }) {
  const hasPassword = Boolean(room.password);
  return (
    <div style={cardStyles.root} className="animate-fade-in">
      {/* Header row */}
      <div style={cardStyles.top}>
        <div style={cardStyles.iconWrap}>
          <BookOpen size={18} color="var(--primary)" />
        </div>
        <div style={cardStyles.info}>
          <h3 style={cardStyles.name}>{room.name}</h3>
          <p style={cardStyles.owner}>by {room.ownerName}</p>
        </div>
        {room.isLocked && (
          <span style={cardStyles.lockedBadge} title="Room is locked">
            <Lock size={11} /> Locked
          </span>
        )}
      </div>

      {/* Stats row */}
      <div style={cardStyles.stats}>
        <span style={cardStyles.stat}><Users size={12} /> {room.memberCount || 0} members</span>
        {hasPassword && <span style={cardStyles.stat}><Lock size={12} /> Password protected</span>}
        <span style={{ ...cardStyles.stat, marginLeft: 'auto' }}>{formatAge(room.createdAt)}</span>
      </div>

      {/* Code row */}
      <div style={cardStyles.codeRow}>
        <span style={cardStyles.codeLabel}>Code:</span>
        <code style={cardStyles.code}>{room.roomCode}</code>
      </div>

      {/* Join button */}
      <button
        className="auth-btn primary"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem' }}
        onClick={() => onJoin(room)}
        disabled={room.isLocked}
      >
        {room.isLocked ? 'Locked' : <><LogIn size={15} /> Join Room</>}
      </button>
    </div>
  );
}

const cardStyles = {
  root: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  top: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  iconWrap: {
    flexShrink: 0,
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(139,92,246,0.1)',
    border: '1px solid rgba(139,92,246,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  name: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  owner: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    margin: '0.1rem 0 0',
  },
  lockedBadge: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.2rem',
    fontSize: '0.7rem',
    color: '#f59e0b',
    background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.2)',
    borderRadius: 999,
    padding: '0.15rem 0.5rem',
    fontWeight: 600,
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  stat: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.2rem',
  },
  codeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  codeLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  code: {
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    background: 'var(--surface-hover)',
    color: 'var(--primary)',
    padding: '0.1rem 0.45rem',
    borderRadius: 4,
    letterSpacing: '0.05em',
  },
};

// ── Password check modal ─────────────────────────────────────────────────────
function PasswordModal({ room, onConfirm, onCancel }) {
  const [pwd, setPwd]     = useState('');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    if (pwd.trim() !== room.password) {
      setError('Incorrect password.');
      return;
    }
    onConfirm();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', width: '100%', maxWidth: 360 }} className="spring-up">
        <h3 style={{ fontFamily: 'Outfit, sans-serif', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>Password required</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>"{room.name}" is password-protected.</p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            autoFocus
            type="text"
            placeholder="Enter room password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setError(''); }}
            style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '0.55rem 0.75rem', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', width: '100%' }}
          />
          {error && <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>{error}</span>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="auth-btn secondary" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
            <button type="submit" className="auth-btn primary" style={{ flex: 1 }}>Enter</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Join by code form ────────────────────────────────────────────────────────
function JoinByCodeForm({ onJoinRoom }) {
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError('Please enter a room code.'); return; }
    setLoading(true);
    setError('');
    try {
      const room = await getRoomByCode(trimmed);
      if (!room) { setError('Room not found or has ended.'); return; }
      if (!room.isActive) { setError('This room has ended.'); return; }
      onJoinRoom(room);
    } catch (err) {
      setError('Failed to find room. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <input
          style={{
            width: '100%',
            background: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            padding: '0.55rem 0.85rem',
            fontSize: '0.9rem',
            fontFamily: 'monospace',
            letterSpacing: '0.08em',
            outline: 'none',
            textTransform: 'uppercase',
          }}
          type="text"
          placeholder="ROOM CODE"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
          maxLength={6}
          autoComplete="off"
          aria-label="Room code"
        />
        {error && <p style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.3rem' }}>{error}</p>}
      </div>
      <button
        type="submit"
        className="auth-btn primary"
        disabled={loading}
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
      >
        {loading ? 'Finding…' : <><ArrowRight size={15} /> Join</>}
      </button>
    </form>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function StudyTogetherPage() {
  const { currentUser, openModal } = useAuth();
  const navigate = useNavigate();

  const [rooms,          setRooms]          = useState([]);
  const [roomsLoading,   setRoomsLoading]   = useState(true);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [showCreate,     setShowCreate]     = useState(false);
  const [passwordRoom,   setPasswordRoom]   = useState(null); // room awaiting password check
  const [pendingRoom,    setPendingRoom]    = useState(null); // room to nav to after password

  // Subscribe to active rooms
  useEffect(() => {
    setRoomsLoading(true);
    const unsub = subscribeToActiveRooms((data) => {
      setRooms(data);
      setRoomsLoading(false);
    });
    return unsub;
  }, []);

  // Navigate to a room, handling password if required
  const handleJoinRoom = useCallback((room) => {
    if (!currentUser) { openModal(); return; }
    if (room.password) {
      setPendingRoom(room);
      setPasswordRoom(room);
    } else {
      navigate(`/study-together/${room.id}`);
    }
  }, [currentUser, navigate, openModal]);

  function handlePasswordConfirmed() {
    setPasswordRoom(null);
    if (pendingRoom) {
      navigate(`/study-together/${pendingRoom.id}`);
      setPendingRoom(null);
    }
  }

  async function handleCreate(data) {
    if (!currentUser) { openModal(); return; }
    const { roomId } = await createRoom({
      ...data,
      ownerPhone: currentUser.phone,
      ownerName: currentUser.name,
    });
    setShowCreate(false);
    navigate(`/study-together/${roomId}`);
  }

  const filtered = rooms.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.roomCode.includes(searchQuery.toUpperCase())
  );

  if (!currentUser) {
    return (
      <div style={styles.loginPrompt} className="animate-fade-in">
        <div style={styles.loginIcon}>
          <BookOpen size={40} color="var(--primary)" />
        </div>
        <h2 style={styles.loginTitle}>Study Together</h2>
        <p style={styles.loginText}>
          Create or join collaborative study rooms with real-time chat, YouTube lectures, and shared presence.
        </p>
        <button className="auth-btn primary" onClick={openModal} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <LogIn size={16} /> Login to continue
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page} className="animate-fade-in">

      {/* Page header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>
            <BookOpen size={22} color="var(--primary)" style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
            Study Together
          </h1>
          <p style={styles.pageSubtitle}>Join a live session or start one around any YouTube lecture.</p>
        </div>
        <button
          className="auth-btn primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} /> New Room
        </button>
      </div>

      {/* Join by code */}
      <div style={styles.joinSection}>
        <p style={styles.joinLabel}>Have a room code?</p>
        <JoinByCodeForm onJoinRoom={handleJoinRoom} />
      </div>

      {/* Search + rooms list */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Active Rooms</h2>
          <div style={styles.searchWrap}>
            <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              style={styles.searchInput}
              type="search"
              placeholder="Search rooms…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search rooms"
            />
          </div>
          {!roomsLoading && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              {filtered.length} room{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {roomsLoading ? (
          <div style={styles.loadingState}>
            <RefreshCw size={20} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading rooms…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <BookOpen size={36} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.75rem' }}>
              {searchQuery ? 'No rooms match your search.' : 'No active rooms right now.'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {searchQuery ? 'Try a different search or clear the filter.' : 'Be the first — create a study room!'}
            </p>
            {!searchQuery && (
              <button
                className="auth-btn primary"
                onClick={() => setShowCreate(true)}
                style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={15} /> Create a Room
              </button>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map(room => (
              <RoomCard key={room.id} room={room} onJoin={handleJoinRoom} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateRoomModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
      {passwordRoom && (
        <PasswordModal
          room={passwordRoom}
          onConfirm={handlePasswordConfirmed}
          onCancel={() => { setPasswordRoom(null); setPendingRoom(null); }}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '1.5rem 1rem 4rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  pageTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '1.6rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
  },
  joinSection: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  joinLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    margin: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  searchWrap: {
    position: 'relative',
    flex: 1,
    minWidth: 180,
    maxWidth: 280,
  },
  searchInput: {
    width: '100%',
    background: 'var(--surface-hover)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '0.45rem 0.75rem 0.45rem 2rem',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    outline: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1rem',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '3rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '3rem',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px dashed var(--border)',
    textAlign: 'center',
  },
  loginPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    minHeight: '60vh',
    textAlign: 'center',
    padding: '2rem',
  },
  loginIcon: {
    width: 72,
    height: 72,
    borderRadius: 'var(--radius-md)',
    background: 'rgba(139,92,246,0.1)',
    border: '1px solid rgba(139,92,246,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: '1.6rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: 0,
  },
  loginText: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    maxWidth: 360,
    lineHeight: 1.6,
  },
};
