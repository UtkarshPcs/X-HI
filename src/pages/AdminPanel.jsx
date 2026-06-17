import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Plus, Save, Trash2, Megaphone, Bold, Italic, List, Pencil, X, CalendarX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { addHomework } from '../services/homeworkService';
import { getNotices, addNotice, updateNotice, deleteNotice } from '../services/noticeService';
import { getClosedDays, addClosedDay, removeClosedDay } from '../services/calendarOverrideService';
import { isWorkingDay, fromDateKey } from '../data/attendanceUtils';
import { ROLES } from '../auth/roles';

function canAccess(user) {
  return user && (user.isAdmin || user.role === ROLES.MONITOR || user.role === ROLES.ADMIN);
}

function isAdminUser(user) {
  return user && (user.isAdmin || user.role === ROLES.ADMIN);
}

// ── Notices section ────────────────────────────────────────────
function NoticesManager({ currentUser }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const textareaRef = useRef(null);

  // Fetch notices on mount and whenever a reload is requested. State is
  // only set inside async callbacks, never synchronously in the effect.
  useEffect(() => {
    let active = true;
    getNotices()
      .then((data) => { if (active) setNotices(data); })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  // Trigger a reload from event handlers (setState here is allowed).
  const refresh = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  // Insert markdown formatting around the current textarea selection.
  function applyFormat(type) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end);
    let inserted;

    if (type === 'bold') {
      inserted = `**${selected || 'bold text'}**`;
    } else if (type === 'italic') {
      inserted = `*${selected || 'italic text'}*`;
    } else if (type === 'bullet') {
      const lines = (selected || 'list item').split('\n');
      inserted = lines.map((l) => `- ${l}`).join('\n');
    }

    const next = body.slice(0, start) + inserted + body.slice(end);
    setBody(next);
    // Restore focus and place caret after the inserted text.
    requestAnimationFrame(() => {
      el.focus();
      try { el.setSelectionRange(start + inserted.length, start + inserted.length); } catch { /* noop */ }
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      if (editingId) {
        await updateNotice(editingId, { body });
      } else {
        await addNotice({ body, authorName: currentUser.name, authorPhone: currentUser.phone });
      }
      setBody('');
      setEditingId(null);
      refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to save notice: ' + err.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(notice) {
    setEditingId(notice.id);
    setBody(notice.body);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setBody('');
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this notice for everyone? This cannot be undone.')) return;
    try {
      await deleteNotice(id);
      refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete: ' + err.message);
    }
  }

  return (
    <div className="glass-card" style={{ marginBottom: '2rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
        <Megaphone size={20} /> {editingId ? 'Edit Notice' : 'Post a Notice'}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="fmt-toolbar">
          <button type="button" className="fmt-btn" title="Bold" onClick={() => applyFormat('bold')}><Bold size={16} /></button>
          <button type="button" className="fmt-btn" title="Italic" onClick={() => applyFormat('italic')}><Italic size={16} /></button>
          <button type="button" className="fmt-btn" title="Bullet list" onClick={() => applyFormat('bullet')}><List size={16} /></button>
        </div>

        <textarea
          ref={textareaRef}
          placeholder="Write your notice… Use the toolbar for **bold**, *italic*, or bullet lists."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          required
          style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
        />

        {body.trim() && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Preview</span>
            <div className="markdown-content" style={{ marginTop: '0.5rem' }}>
              <ReactMarkdown>{body}</ReactMarkdown>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={busy} className="auth-btn primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            <Save size={16} /> {busy ? 'Saving…' : editingId ? 'Update Notice' : 'Post Notice'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="auth-btn secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <X size={16} /> Cancel
            </button>
          )}
        </div>
      </form>

      {/* Existing notices */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          All Notices {notices.length > 0 && `(${notices.length})`}
        </h3>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
        ) : notices.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No notices posted yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notices.map((n) => (
              <div key={n.id} className="notice-item">
                <div className="markdown-content"><ReactMarkdown>{n.body}</ReactMarkdown></div>
                <div className="notice-item-meta">
                  <span>— {n.authorName}</span>
                  <span style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => startEdit(n)} title="Edit" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(n.id)} title="Delete" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}><Trash2 size={15} /></button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Homework section ───────────────────────────────────────────
function HomeworkManager() {
  const [date, setDate] = useState('');
  const [tasks, setTasks] = useState([{ subject: '', description: '', type: 'homework' }]);
  const [loading, setLoading] = useState(false);

  const handleAddTask = () => setTasks([...tasks, { subject: '', description: '', type: 'homework' }]);
  const handleRemoveTask = (index) => setTasks(tasks.filter((_, i) => i !== index));
  const handleTaskChange = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || tasks.length === 0) return alert('Please enter date and at least one task');
    setLoading(true);
    try {
      await addHomework(date, tasks);
      alert('Homework added successfully!');
      setDate('');
      setTasks([{ subject: '', description: '', type: 'homework' }]);
    } catch (err) {
      console.error(err);
      alert('Failed to add homework: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="glass-card" style={{ marginBottom: '2rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
        <Plus size={20} /> Add Daily Homework
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ color: 'var(--text-secondary)' }}>Tasks</label>
            <button type="button" onClick={handleAddTask} className="auth-btn secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
              <Plus size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Add Task
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tasks.map((task, index) => (
              <div key={index} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Task {index + 1}</h4>
                  {tasks.length > 1 && (
                    <button type="button" onClick={() => handleRemoveTask(index)} style={{ background: 'none', border: 'none', color: 'var(--error, #ef4444)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Subject (e.g., Math, Science)"
                  value={task.subject}
                  onChange={e => handleTaskChange(index, 'subject', e.target.value)}
                  required
                  style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
                />
                <textarea
                  placeholder="Task Description..."
                  value={task.description}
                  onChange={e => handleTaskChange(index, 'description', e.target.value)}
                  required
                  rows={3}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="auth-btn primary" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          <Save size={18} /> {loading ? 'Saving...' : 'Save Homework'}
        </button>
      </form>
    </div>
  );
}

// ── Calendar Override section ──────────────────────────────────
function CalendarOverrideManager() {
  const [closedDays, setClosedDaysState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateInput, setDateInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getClosedDays()
      .then((days) => { if (active) setClosedDaysState(days); })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    if (!dateInput) return;

    // Guard: don't allow marking a day that's already a holiday/Sunday.
    if (!isWorkingDay(dateInput)) {
      setError('That date is already a holiday or Sunday in the school calendar.');
      return;
    }
    setBusy(true);
    try {
      await addClosedDay(dateInput);
      setDateInput('');
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      setError('Failed to add: ' + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(key) {
    if (!window.confirm(`Restore ${formatHuman(key)} as a working day? It will count toward attendance again.`)) return;
    try {
      await removeClosedDay(key);
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to remove: ' + err.message);
    }
  }

  function formatHuman(key) {
    return fromDateKey(key).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  return (
    <div className="glass-card" style={{ marginBottom: '2rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
        <CalendarX size={20} /> Calendar Override
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
        Declare an extra holiday on a working day (e.g. an unplanned closure). It is removed from everyone's attendance immediately.
      </p>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <input
          type="date"
          value={dateInput}
          onChange={(e) => { setDateInput(e.target.value); setError(''); }}
          required
          style={{ flex: '1 1 200px', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
        />
        <button type="submit" disabled={busy} className="auth-btn primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 0 }}>
          <Plus size={16} /> {busy ? 'Adding…' : 'Mark Closed'}
        </button>
      </form>
      {error && <p className="auth-err" style={{ marginTop: '0.75rem' }}>{error}</p>}

      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Declared Closures {closedDays.length > 0 && `(${closedDays.length})`}
        </h3>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
        ) : closedDays.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No extra closures declared.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {closedDays.map((key) => (
              <span
                key={key}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '0.4rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem' }}
              >
                {formatHuman(key)}
                <button
                  onClick={() => handleRemove(key)}
                  title="Restore as working day"
                  style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', display: 'flex', padding: 0 }}
                >
                  <X size={15} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser === undefined) return;
    if (!canAccess(currentUser)) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  if (!canAccess(currentUser)) return null;

  const roleLabel = isAdminUser(currentUser) ? 'Admin Panel' : 'Monitor Panel';

  return (
    <div className="animate-fade-in fade-in-up" style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <ShieldAlert size={32} className="text-primary" />
        <h1 className="page-title text-gradient" style={{ margin: 0 }}>{roleLabel}</h1>
      </div>

      <NoticesManager currentUser={currentUser} />
      <HomeworkManager />
      {isAdminUser(currentUser) && <CalendarOverrideManager />}
    </div>
  );
}
