import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CalendarRange, Users, ArrowRight, ClipboardList, Megaphone, BarChart2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import NoticeBar from '../components/NoticeBar';
import ClassInfo from '../components/ClassInfo';
import { getHomework } from '../services/homeworkService';
import { getAllClasswork } from '../services/classworkService';
import { getAllUsers } from '../services/adminService';
import { getAttendance } from '../auth/authService';
import { getClosedDays } from '../services/calendarOverrideService';
import { calcAttendance, todayKey, toDateKey } from '../data/attendanceUtils';
import { getNotices, addNotice, updateNotice, deleteNotice } from '../services/noticeService';
import { notifyClassSafe } from '../services/notify';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function hwDateKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

// ── Notice Tool (teacher can post/edit/delete) ────────────────
function NoticeTool({ currentUser }) {
  const [notices, setNotices]   = useState([]);
  const [body, setBody]         = useState('');
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy]         = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    if (open) getNotices().then(setNotices).catch(() => {});
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      if (editingId) {
        await updateNotice(editingId, { body });
      } else {
        await addNotice({ body, authorName: currentUser.name, authorPhone: currentUser.id });
        const preview = body.trim().replace(/[#*_>`-]/g, '').replace(/\s+/g, ' ').slice(0, 120);
        notifyClassSafe(currentUser, { title: '📢 New Notice', body: preview, url: '/', type: 'notice' });
      }
      setBody(''); setEditingId(null);
      const fresh = await getNotices();
      setNotices(fresh);
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setBusy(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this notice?')) return;
    await deleteNotice(id).catch(() => {});
    setNotices(n => n.filter(x => x.id !== id));
  }

  return (
    <div className="glass-card">
      <button
        className="teacher-tool-header"
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Megaphone size={18} color="var(--primary)" /> Send / Manage Notices
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ marginTop: '1rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Type a notice…"
              rows={3}
              required
              style={{
                padding: '0.75rem', background: 'var(--background)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)', resize: 'vertical', fontSize: '0.9rem',
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="auth-btn primary" type="submit" disabled={busy} style={{ flex: 1, padding: '0.5rem' }}>
                {busy ? 'Posting…' : editingId ? 'Update Notice' : 'Post Notice'}
              </button>
              {editingId && (
                <button type="button" className="auth-btn secondary" onClick={() => { setEditingId(null); setBody(''); }} style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          {notices.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notices.slice(0, 5).map(n => (
                <div key={n.id} style={{
                  padding: '0.6rem 0.8rem', background: 'var(--surface-hover)',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.body?.slice(0, 80)}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                    <button className="auth-link" style={{ fontSize: '0.78rem' }} onClick={() => { setEditingId(n.id); setBody(n.body); }}>Edit</button>
                    <button className="auth-link" style={{ fontSize: '0.78rem', color: '#ef4444' }} onClick={() => handleDelete(n.id)}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Teacher Dashboard ────────────────────────────────────
export default function TeacherDashboard() {
  const { currentUser } = useAuth();
  const navigate        = useNavigate();

  const [latestHw,        setLatestHw]        = useState(null);
  const [hwLoading,       setHwLoading]        = useState(true);
  const [latestCw,        setLatestCw]         = useState(null);
  const [cwLoading,       setCwLoading]        = useState(true);
  const [classAvgAtt,     setClassAvgAtt]      = useState(null);
  const [closedDays,      setClosedDays]       = useState([]);

  // Load homework + classwork
  useEffect(() => {
    const tKey = todayKey();
    getHomework()
      .then(list => {
        const today = list.find(hw => hwDateKey(hw.date) === tKey);
        setLatestHw(today || list[0] || null);
      })
      .catch(() => {})
      .finally(() => setHwLoading(false));

    getAllClasswork()
      .then(list => setLatestCw(list[0] || null))
      .catch(() => {})
      .finally(() => setCwLoading(false));

    getClosedDays().then(setClosedDays).catch(() => {});
  }, []);

  // Compute class average attendance from all users
  useEffect(() => {
    let active = true;
    Promise.all([getAllUsers(), getClosedDays()])
      .then(async ([users, closed]) => {
        if (!active) return;
        const students = users.filter(u => u.rollNo && u.rollNo > 0 && u.phone);
        if (!students.length) { setClassAvgAtt(null); return; }
        const attendances = await Promise.all(
          students.map(u => getAttendance(u.phone).catch(() => []))
        );
        const pcts = attendances.map(absent => {
          const stats = calcAttendance(absent, undefined, closed);
          return stats.monthlyAveragePercentage;
        });
        const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
        if (active) setClassAvgAtt(avg);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!currentUser) return null;

  const tKey = todayKey();
  const isLatestToday = latestHw && hwDateKey(latestHw.date) === tKey;

  return (
    <div className="dashboard animate-fade-in fade-in-up">

      {/* Greeting */}
      <header className="dash-greeting">
        <h1>
          {greeting()},{' '}
          <span className="text-gradient">{currentUser.name}</span> 👋
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
          <span className="teacher-chip">{currentUser.subject}</span>
          <span className="teacher-chip">{currentUser.period}</span>
        </div>
      </header>

      {/* Class attendance overview */}
      <div className="dash-stats-row">
        <div className="glass-card dash-stat glow-hover">
          <span className="dash-stat-label"><Users size={16} /> Class Avg Attendance</span>
          <span className={`dash-stat-value ${classAvgAtt !== null ? (classAvgAtt >= 75 ? 'att-pct-good' : classAvgAtt >= 60 ? 'att-pct-warn' : 'att-pct-bad') : ''}`}>
            {classAvgAtt !== null ? `${classAvgAtt}%` : '…'}
          </span>
          <span className="dash-stat-sub">monthly average across all students</span>
        </div>
        <div className="glass-card dash-stat glow-hover" style={{ cursor: 'pointer' }} onClick={() => navigate('/maths')}>
          <span className="dash-stat-label"><BarChart2 size={16} /> Maths Dashboard</span>
          <span className="dash-stat-value" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>View Scores</span>
          <span className="dash-stat-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>Test 1 &amp; Test 2 <ArrowRight size={12} /></span>
        </div>
      </div>

      {/* Notices */}
      <NoticeBar />

      {/* Latest Homework */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h2 className="section-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} color="var(--primary)" />
            {isLatestToday ? "Today's Homework" : 'Latest Homework'}
          </h2>
          <button className="auth-link" onClick={() => navigate('/homework')}
            style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            View all <ArrowRight size={13} />
          </button>
        </div>
        {hwLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading…</p>
        ) : !latestHw ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No homework entries yet.</p>
        ) : (
          <>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{latestHw.date}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {(latestHw.tasks || []).map((task, idx) => (
                <div key={idx} style={{
                  padding: '0.7rem 0.9rem', background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)',
                }}>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0, color: 'var(--text-primary)' }}>{task.subject}</p>
                  {task.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>{task.description}</p>}
                </div>
              ))}
              {!(latestHw.tasks?.length) && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No tasks recorded.</p>}
            </div>
          </>
        )}
      </div>

      {/* Latest Classwork */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h2 className="section-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={20} color="#FF6D00" /> Latest Classwork
          </h2>
          <button className="auth-link" onClick={() => navigate('/homework?tab=classwork')}
            style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            View all <ArrowRight size={13} />
          </button>
        </div>
        {cwLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading…</p>
        ) : !latestCw ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No classwork recorded yet.</p>
        ) : (
          <>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              {latestCw.weekday}, {new Date(latestCw.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {(latestCw.periods || []).map((p, idx) => (
                <div key={idx} style={{
                  padding: '0.7rem 0.9rem', background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #FF6D00',
                }}>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#FF6D00' }}>{p.period}</span> {p.subject}
                  </p>
                  {p.note && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0', whiteSpace: 'pre-wrap' }}>{p.note}</p>}
                </div>
              ))}
              {!(latestCw.periods?.length) && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No periods recorded.</p>}
            </div>
          </>
        )}
      </div>

      {/* Teacher Tools */}
      <div className="glass-card">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          🛠 Teacher Tools
        </h2>
        <NoticeTool currentUser={currentUser} />
      </div>

      {/* Class Info (routine + register) */}
      <div className="glass-card">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <CalendarRange size={20} color="var(--primary)" /> Class Info
        </h2>
        <ClassInfo />
      </div>

    </div>
  );
}
