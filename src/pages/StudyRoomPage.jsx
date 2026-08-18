/**
 * StudyRoomPage.jsx
 * Main collaborative study room interface.
 *
 * Desktop layout:  [Video (left, ~65%)] [Chat + Members sidebar (right, ~35%)]
 * Mobile layouts:
 *   - YouTube mode:  Split view — video on top, collapsible chat+members below
 *   - Quiz mode:     Full-screen tab switching — Quiz view OR Chat/Members view
 *   - Chat-only:     Full chat with members tab
 *
 * Route: /study-together/:roomId
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, MessageSquare, ChevronDown, ChevronUp,
  AlertTriangle, RefreshCw, Minimize2, Maximize2,
  Monitor, Play, Lock,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useStudyRoom } from '../hooks/useStudyRoom';
import { useRoomChat } from '../hooks/useRoomChat';
import { useRoomPresence } from '../hooks/useRoomPresence';
import YouTubePlayer from '../components/study/YouTubePlayer';
import RoomChat from '../components/study/RoomChat';
import MembersList from '../components/study/MembersList';
import RoomHeader from '../components/study/RoomHeader';
import { useLiveQuiz } from '../hooks/useLiveQuiz';
import LiveQuizPlayer from '../components/study/LiveQuizPlayer';
import QuizSetupModal from '../components/study/QuizSetupModal';
import { startQuiz, pinMessage, unpinMessage } from '../services/studyRoomService';

// ── Mobile: Chat / Members sub-tab bar (used inside the chat panel) ─────────
function MobileChatMembersTabs({ activeTab, onTabChange, memberCount, unread }) {
  return (
    <div style={mobileSubTabStyles.root} role="tablist">
      <button
        role="tab"
        aria-selected={activeTab === 'chat'}
        style={{ ...mobileSubTabStyles.tab, ...(activeTab === 'chat' ? mobileSubTabStyles.activeTab : {}) }}
        onClick={() => onTabChange('chat')}
      >
        <MessageSquare size={14} />
        Chat
        {unread > 0 && activeTab !== 'chat' && (
          <span style={mobileSubTabStyles.badge}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      <button
        role="tab"
        aria-selected={activeTab === 'members'}
        style={{ ...mobileSubTabStyles.tab, ...(activeTab === 'members' ? mobileSubTabStyles.activeTab : {}) }}
        onClick={() => onTabChange('members')}
      >
        <Users size={14} />
        Members ({memberCount})
      </button>
    </div>
  );
}

const mobileSubTabStyles = {
  root: {
    display: 'flex',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    padding: '0.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    fontWeight: 500,
    fontFamily: 'inherit',
    transition: 'color 0.15s',
  },
  activeTab: {
    color: 'var(--primary)',
    borderBottom: '2px solid var(--primary)',
  },
  badge: {
    background: 'var(--primary)',
    color: '#fff',
    fontSize: '0.6rem',
    fontWeight: 700,
    borderRadius: 999,
    padding: '0 0.3rem',
    lineHeight: '1.4',
  },
};

// ── Mobile: Quiz mode top-level tab bar (Quiz vs Chat) ──────────────────────
function MobileQuizTabBar({ activeView, onViewChange, unread }) {
  return (
    <div style={quizTabStyles.root} role="tablist">
      <button
        role="tab"
        aria-selected={activeView === 'quiz'}
        style={{ ...quizTabStyles.tab, ...(activeView === 'quiz' ? quizTabStyles.activeTab : {}) }}
        onClick={() => onViewChange('quiz')}
      >
        <Monitor size={16} />
        Quiz
      </button>
      <button
        role="tab"
        aria-selected={activeView === 'chat'}
        style={{ ...quizTabStyles.tab, ...(activeView === 'chat' ? quizTabStyles.activeTab : {}) }}
        onClick={() => onViewChange('chat')}
      >
        <MessageSquare size={16} />
        Chat
        {unread > 0 && activeView !== 'chat' && (
          <span style={quizTabStyles.badge}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
    </div>
  );
}

const quizTabStyles = {
  root: {
    display: 'flex',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.7rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    fontSize: '0.88rem',
    fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'color 0.15s, background 0.15s',
  },
  activeTab: {
    color: 'var(--primary)',
    background: 'rgba(139,92,246,0.06)',
    borderBottom: '2.5px solid var(--primary)',
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
          {reason === 'kicked' ? 'Session active elsewhere' : 'Room ended'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {reason === 'kicked'
            ? 'You have joined this room from another device or tab.'
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
  const { room, loading, error, isOwner, isPrivileged, changeVideo, toggleLock, kickMember, closeRoom, promoteCoHost, demoteCoHost, clearScreen } =
    useStudyRoom(roomId, currentUser?.phone);

  useEffect(() => {
    document.body.classList.add('study-room-active');
    return () => document.body.classList.remove('study-room-active');
  }, []);

  const handleKicked = useCallback(() => setWasKicked(true), []);
  const { members, memberCount } =
    useRoomPresence(currentUser ? roomId : null, currentUser, handleKicked);

  const { messages, sending, send } =
    useRoomChat(currentUser ? roomId : null, currentUser);

  const quizProps = useLiveQuiz(roomId, room, currentUser, members);

  // Mobile UI state
  const [mobileChatTab, setMobileChatTab] = useState('chat');   // 'chat' | 'members' (sub-tab inside chat panel)
  const [mobileQuizView, setMobileQuizView] = useState('quiz'); // 'quiz' | 'chat' (top-level for quiz mode)
  const [chatCollapsed, setChatCollapsed] = useState(false);    // YouTube mode: collapse chat panel
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMsgCount = useRef(messages.length);
  const [showQuizSetup, setShowQuizSetup] = useState(false);

  // Track unread messages on mobile when chat tab isn't active
  const handleStartQuizClick = useCallback(() => {
    setShowQuizSetup(true);
  }, []);

  // Unread tracking — counts new messages when the user isn't looking at chat
  // Note: in video mode, chat is visible if not collapsed.
  const isChatVisible = room?.mode === 'quiz' 
    ? mobileQuizView === 'chat' 
    : (room?.mode === 'video' || room?.videoId ? !chatCollapsed && mobileChatTab === 'chat' : mobileChatTab === 'chat');

  useEffect(() => {
    // Only increment if we had previously loaded messages to avoid spiking on initial load
    if (messages.length > prevMsgCount.current && prevMsgCount.current > 0) {
      if (!isChatVisible) {
        setUnreadCount(c => c + (messages.length - prevMsgCount.current));
      }
    }
    // If it's initial load (prev was 0), we just sync it without marking as unread
    prevMsgCount.current = messages.length;
  }, [messages.length, isChatVisible]);

  function handleChatTabChange(tab) {
    setMobileChatTab(tab);
    if (tab === 'chat') setUnreadCount(0);
  }

  function handleQuizViewChange(view) {
    setMobileQuizView(view);
    if (view === 'chat') setUnreadCount(0);
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

  const handleStartQuiz = async (quizData) => {
    await startQuiz(roomId, quizData);
    setShowQuizSetup(false);
  };

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

  const showEnded = wasKicked || (!room.isActive);

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.activeRole === 'ADMIN';
  const isRoomOwner = room.ownerPhone === currentUser.phone;
  const isRoomCoHost = (room.coHostPhones || []).includes(currentUser.phone);
  const isLockedOut = room.isLocked && !isRoomOwner && !isRoomCoHost && !isAdmin;

  if (isLockedOut) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <Lock size={32} color="#f59e0b" />
        <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Room is Locked</h2>
        <p style={{ color: 'var(--text-muted)' }}>The host has locked this room. New members cannot join right now.</p>
        <button className="auth-btn primary" onClick={() => navigate('/study-together')}>Back to Study Together</button>
      </div>
    );
  }
  const isQuizMode = room.mode === 'quiz';
  const isVideoMode = room.mode === 'video' || room.videoId;

  // ── Shared chat + members panel (reused across mobile layouts) ─────────────
  const renderChatMembersPanel = () => (
    <>
      <MobileChatMembersTabs
        activeTab={mobileChatTab}
        onTabChange={handleChatTabChange}
        memberCount={memberCount}
        unread={unreadCount}
      />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {mobileChatTab === 'members' ? (
          <div style={{ padding: '0.75rem', overflowY: 'auto', flex: 1 }}>
            <MembersList
              members={members}
              ownerPhone={room.ownerPhone}
              currentUserPhone={currentUser.phone}
              isOwner={isOwner}
              isPrivileged={isPrivileged}
              coHostPhones={room.coHostPhones || []}
              onKick={kickMember}
              onPromote={promoteCoHost}
              onDemote={demoteCoHost}
            />
          </div>
        ) : (
          <RoomChat
            messages={messages}
            sending={sending}
            onSend={send}
            currentUserPhone={currentUser.phone}
            disabled={!currentUser}
            pinnedMessage={room.pinnedMessage}
            onPin={(msg) => pinMessage(room.id, msg)}
            onUnpin={() => unpinMessage(room.id)}
            isPrivileged={isPrivileged}
          />
        )}
      </div>
    </>
  );

  // ── Mobile: YouTube split-view layout ──────────────────────────────────────
  const renderMobileVideoLayout = () => (
    <>
      {/* Video section — expands when chat is collapsed */}
      <div style={{
        flex: chatCollapsed ? 1 : '0 0 auto',
        overflowY: 'auto',
        padding: '0.5rem',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'flex 0.3s ease',
      }}>
        <YouTubePlayer videoId={room.videoId} title={room.name} />
      </div>

      {/* Drag handle / collapse toggle */}
      <button
        onClick={() => setChatCollapsed(c => !c)}
        style={mobileSplitStyles.handle}
        aria-label={chatCollapsed ? 'Expand chat' : 'Minimize chat'}
      >
        <div style={mobileSplitStyles.handleBar} />
        <span style={mobileSplitStyles.handleLabel}>
          {chatCollapsed ? <><Maximize2 size={13} /> Show Chat</> : <><Minimize2 size={13} /> Hide Chat</>}
        </span>
        <div style={mobileSplitStyles.handleBar} />
      </button>

      {/* Chat panel — collapses to zero height */}
      <div style={{
        flex: chatCollapsed ? '0 0 0px' : 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'flex 0.3s ease',
        borderTop: chatCollapsed ? 'none' : '1px solid var(--border)',
      }}>
        {!chatCollapsed && renderChatMembersPanel()}
      </div>
    </>
  );

  // ── Mobile: Quiz tab-switch layout ─────────────────────────────────────────
  const renderMobileQuizLayout = () => (
    <>
      {/* Top-level tab bar: Quiz vs Chat */}
      <MobileQuizTabBar
        activeView={mobileQuizView}
        onViewChange={handleQuizViewChange}
        unread={unreadCount}
      />

      {/* Full-screen panel for the active tab */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {mobileQuizView === 'quiz' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            <LiveQuizPlayer {...quizProps} currentUser={currentUser} />
          </div>
        ) : (
          renderChatMembersPanel()
        )}
      </div>
    </>
  );

  // ── Mobile: Chat-only layout (no video or quiz active) ─────────────────────
  const renderMobileChatOnlyLayout = () => (
    <>
      {/* Empty state hint */}
      <div style={{
        padding: '1.5rem 1rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <MessageSquare size={28} style={{ opacity: 0.25, marginBottom: '0.35rem' }} />
        <p style={{ margin: 0, fontSize: '0.85rem' }}>No video or quiz is playing right now.</p>
      </div>

      {/* Chat + members fills the rest */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderChatMembersPanel()}
      </div>
    </>
  );

  return (
    <div style={pageStyles.root} className="animate-fade-in study-room-page">

      {showEnded && (
        <RoomEndedOverlay
          reason={wasKicked ? 'kicked' : 'ended'}
          onLeave={handleLeave}
        />
      )}

      {showQuizSetup && isPrivileged && (
        <QuizSetupModal 
          onClose={() => setShowQuizSetup(false)} 
          onStart={handleStartQuiz} 
          onlineMembers={members}
          currentCoHosts={room.coHostPhones || []}
          askedQuestionIds={room.askedQuestionIds || []}
        />
      )}

      {/* Room header */}
      <RoomHeader
        room={room}
        memberCount={memberCount}
        isOwner={isOwner}
        isPrivileged={isPrivileged}
        onChangeVideo={changeVideo}
        onToggleLock={toggleLock}
        onEndRoom={handleEndRoom}
        onBack={handleLeave}
        onStartQuiz={isPrivileged ? handleStartQuizClick : undefined}
        onClearScreen={isPrivileged ? clearScreen : undefined}
      />

      {/* ── Desktop layout (unchanged) ─────────────────────────────────── */}
      <div style={pageStyles.desktopLayout} className="study-desktop-layout">

        {/* Video / Quiz column */}
        <div style={pageStyles.videoCol}>
          {isQuizMode
            ? <LiveQuizPlayer {...quizProps} currentUser={currentUser} />
            : isVideoMode
              ? <YouTubePlayer videoId={room.videoId} title={room.name} />
              : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <h3>Chat Room Active</h3>
                  <p>No video or quiz is currently playing.</p>
                </div>
              )
          }
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
              isPrivileged={isPrivileged}
              coHostPhones={room.coHostPhones || []}
              onKick={kickMember}
              onPromote={promoteCoHost}
              onDemote={demoteCoHost}
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
              pinnedMessage={room.pinnedMessage}
              onPin={(msg) => pinMessage(room.id, msg)}
              onUnpin={() => unpinMessage(room.id)}
              isPrivileged={isPrivileged}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile layout ──────────────────────────────────────────────── */}
      <div style={pageStyles.mobileLayout} className="study-mobile-layout">
        {isQuizMode
          ? renderMobileQuizLayout()
          : isVideoMode
            ? renderMobileVideoLayout()
            : renderMobileChatOnlyLayout()
        }
      </div>
    </div>
  );
}

// ── Split-view handle styles (YouTube mobile) ───────────────────────────────
const mobileSplitStyles = {
  handle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.45rem 0.75rem',
    background: 'var(--surface)',
    border: 'none',
    borderTop: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    flexShrink: 0,
    fontFamily: 'inherit',
    color: 'var(--text-muted)',
    transition: 'background 0.15s',
  },
  handleBar: {
    flex: 1,
    height: 1,
    background: 'var(--border)',
  },
  handleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
};

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
};
