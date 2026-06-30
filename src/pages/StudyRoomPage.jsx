/**
 * StudyRoomPage.jsx
 * Main collaborative study room interface.
 *
 * Desktop layout:  [Video (left, ~65%)] [Chat + Members sidebar (right, ~35%)]
 * Mobile layout:   [Video] [Members collapsible] [Chat]
 *
 * Route: /study-together/:roomId
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, MessageSquare, ChevronDown, ChevronUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useStudyRoom } from '../hooks/useStudyRoom';
import { useRoomChat } from '../hooks/useRoomChat';
import { useRoomPresence } from '../hooks/useRoomPresence';
import YouTubePlayer from '../components/study/YouTubePlayer';
import RoomChat from '../components/study/RoomChat';
import MembersList from '../components/study/MembersList';
import RoomHeader from '../components/study/RoomHeader';

// ── Mobile tab bar ───────────────────────────────────────────────────────────
function MobileTabBar({ activeTab, onTabChange, memberCount, unread }) {
  return (
    <div style={mobileTabStyles.root} role="tablist">
      <button
        role="tab"
        aria-selected={activeTab === 'chat'}
        style={{ ...mobileTabStyles.tab, ...(activeTab === 'chat' ? mobileTabStyles.activeTab : {}) }}
        onClick={() => onTabChange('chat')}
      >
        <MessageSquare size={16} />
        Chat
        {unread > 0 && activeTab !== 'chat' && (
          <span style={mobileTabStyles.badge}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      <button
        role="tab"
        aria-selected={activeTab === 'members'}
        style={{ ...mobileTabStyles.tab, ...(activeTab === 'members' ? mobileTabStyles.activeTab : {}) }}
        onClick={() => onTabChange('members')}
      >
        <Users size={16} />
        Members ({memberCount})
      </button>
    </div>
  );
}

const mobileTabStyles = {
  root: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
  },
  tab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.65rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    fontWeight: 500,
    fontFamily: 'inherit',
    position: 'relative',
    transition: 'color 0.15s',
  },
  activeTab: {
    color: 'var(--primary)',
    borderBottom: '2px solid var(--primary)',
  },
  badge: {
    background: 'var(--primary)',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: 700,
    borderRadius: 999,
    padding: '0 0.35rem',
    lineHeight: '1.4',
  },
};

// ── Sidebar section wrapper (desktop) ───────────────────────────────────────
function SidebarSection({ title, icon, children, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={sidebarSectionStyles.root}>
      <button
        style={sidebarSectionStyles.heading}
        onClick={collapsible ? () => setOpen(v => !v) : undefined}
        aria-expanded={open}
      >
        <span style={sidebarSectionStyles.headingLeft}>
          {icon}
          <span style={sidebarSectionStyles.headingText}>{title}</span>
        </span>
        {collapsible && (open ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
      </button>
      {open && <div style={sidebarSectionStyles.body}>{children}</div>}
    </div>
  );
}

const sidebarSectionStyles = {
  root: {
    borderBottom: '1px solid var(--border)',
  },
  heading: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.65rem 0.85rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    fontFamily: 'inherit',
  },
  headingLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  headingText: {
    fontSize: '0.78rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  body: {
    padding: '0 0.5rem 0.75rem',
  },
};

// ── Kicked / ended overlay ───────────────────────────────────────────────────
function RoomEndedOverlay({ reason, onLeave }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(4px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        maxWidth: 360,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
      }} className="spring-up">
        <AlertTriangle size={32} color="#f59e0b" />
        <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', margin: 0 }}>
          {reason === 'kicked' ? 'You were removed' : 'Room ended'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {reason === 'kicked'
            ? 'The host removed you from this room.'
            : 'The host has ended this study session.'}
        </p>
        <button className="auth-btn primary" onClick={onLeave} style={{ width: '100%' }}>
          Back to Study Together
        </button>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function StudyRoomPage() {
  const { roomId }                    = useParams();
  const navigate                      = useNavigate();
  const { currentUser, openModal }    = useAuth();

  // Core state from hooks
  const { room, loading, error, isOwner, changeVideo, toggleLock, kickMember, closeRoom } =
    useStudyRoom(roomId, currentUser?.phone);

  // Only join presence and load chat if user is logged in
  const { members, memberCount } =
    useRoomPresence(currentUser ? roomId : null, currentUser);

  const { messages, sending, send } =
    useRoomChat(currentUser ? roomId : null, currentUser);

  // Mobile UI state
  const [mobileTab,   setMobileTab]   = useState('chat');
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMsgCount                  = useState(0);

  // Track unread messages on mobile when chat tab isn't active
  useEffect(() => {
    if (mobileTab !== 'chat' && messages.length > prevMsgCount[0]) {
      setUnreadCount(c => c + (messages.length - prevMsgCount[0]));
    }
    prevMsgCount[0] = messages.length;
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(tab) {
    setMobileTab(tab);
    if (tab === 'chat') setUnreadCount(0);
  }

  // Detect if current user was kicked (their presence doc deleted by owner)
  const [wasKicked, setWasKicked]     = useState(false);

  useEffect(() => {
    if (!currentUser || !members || members.length === 0) return;
    // If we have presence data and user is NOT in it, they were removed
    // We skip this check for the owner
    if (isOwner) return;
    const iAmPresent = members.some(m => m.phone === currentUser.phone);
    // Only flag kick after initial join (avoid false positive on mount before first heartbeat)
    // We wait until there are at least 1 member doc — meaning presence is initialised
    if (!iAmPresent && members.length > 0) {
      setWasKicked(true);
    }
  }, [members, currentUser, isOwner]);

  const handleLeave = useCallback(() => {
    navigate('/study-together');
  }, [navigate]);

  const handleEndRoom = useCallback(async () => {
    await closeRoom();
    navigate('/study-together');
  }, [closeRoom, navigate]);

  // ── Login gate ─────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Study Together</h2>
        <p style={{ color: 'var(--text-muted)' }}>Login to join this study room.</p>
        <button className="auth-btn primary" onClick={openModal}>Login to continue</button>
        <button className="auth-btn secondary" onClick={() => navigate('/study-together')}>← Back to lobby</button>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <RefreshCw size={24} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading room…</p>
      </div>
    );
  }

  // ── Not found / ended ──────────────────────────────────────────────────────
  if (error || !room || !room.isActive) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <AlertTriangle size={32} color="#f59e0b" />
        <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
          {error || 'Room not found'}
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>This room may have ended or the link is incorrect.</p>
        <button className="auth-btn primary" onClick={() => navigate('/study-together')}>Back to Study Together</button>
      </div>
    );
  }

  // ── Kick / room ended overlay ──────────────────────────────────────────────
  const showEnded = wasKicked || (!room.isActive);

  return (
    <div style={pageStyles.root} className="animate-fade-in study-room-page">

      {showEnded && (
        <RoomEndedOverlay
          reason={wasKicked ? 'kicked' : 'ended'}
          onLeave={handleLeave}
        />
      )}

      {/* Room header */}
      <RoomHeader
        room={room}
        memberCount={memberCount}
        isOwner={isOwner}
        onChangeVideo={changeVideo}
        onToggleLock={toggleLock}
        onEndRoom={handleEndRoom}
        onBack={handleLeave}
      />

      {/* ── Desktop layout ─────────────────────────────────────────────── */}
      <div style={pageStyles.desktopLayout} className="study-desktop-layout">

        {/* Video column */}
        <div style={pageStyles.videoCol}>
          <YouTubePlayer videoId={room.videoId} title={room.name} />
        </div>

        {/* Sidebar column */}
        <div style={pageStyles.sidebar}>
          {/* Members */}
          <SidebarSection
            title={`Members (${memberCount})`}
            icon={<Users size={14} />}
            collapsible
            defaultOpen
          >
            <MembersList
              members={members}
              ownerPhone={room.ownerPhone}
              currentUserPhone={currentUser.phone}
              isOwner={isOwner}
              onKick={kickMember}
            />
          </SidebarSection>

          {/* Chat */}
          <SidebarSection
            title="Chat"
            icon={<MessageSquare size={14} />}
          >
            {/* Inner wrapper fills remaining sidebar height */}
          </SidebarSection>
          <div style={pageStyles.chatWrapper}>
            <RoomChat
              messages={messages}
              sending={sending}
              onSend={send}
              currentUserPhone={currentUser.phone}
              disabled={!currentUser}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile layout ──────────────────────────────────────────────── */}
      <div style={pageStyles.mobileLayout} className="study-mobile-layout">
        {/* Video always on top */}
        <div style={pageStyles.mobileVideo}>
          <YouTubePlayer videoId={room.videoId} title={room.name} />
        </div>

        {/* Tab bar */}
        <MobileTabBar
          activeTab={mobileTab}
          onTabChange={handleTabChange}
          memberCount={memberCount}
          unread={unreadCount}
        />

        {/* Tab content */}
        <div style={pageStyles.mobileContent}>
          {mobileTab === 'members' && (
            <div style={{ padding: '0.75rem' }}>
              <MembersList
                members={members}
                ownerPhone={room.ownerPhone}
                currentUserPhone={currentUser.phone}
                isOwner={isOwner}
                onKick={kickMember}
              />
            </div>
          )}
          {mobileTab === 'chat' && (
            <RoomChat
              messages={messages}
              sending={sending}
              onSend={send}
              currentUserPhone={currentUser.phone}
              disabled={!currentUser}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Responsive styles via inline media-query simulation ─────────────────────
// .study-desktop-layout is shown by default; CSS hides it and shows .study-mobile-layout
// at <= 768px (defined in index.css under .study-room-page)

const pageStyles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 64px)', // full viewport minus navbar
    overflow: 'hidden',
  },
  // Desktop: side-by-side — CSS hides this on mobile
  desktopLayout: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex', // visible by default; overridden by CSS on mobile
  },
  videoCol: {
    flex: '0 0 65%',
    padding: '1rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  sidebar: {
    flex: '0 0 35%',
    borderLeft: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--surface)',
  },
  chatWrapper: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  // Mobile: stacked — hidden by default; CSS shows it on mobile
  mobileLayout: {
    display: 'none', // overridden to flex by CSS on mobile
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  mobileVideo: {
    padding: '0.75rem',
    background: 'var(--background)',
    borderBottom: '1px solid var(--border)',
  },
  mobileContent: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
};
