import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MATH_MARKS_RAW, MAX_MARKS } from '../data/mathMarks';
import { getOverrides, fileComplaint, getMyComplaint } from '../services/marksService';
import { AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

function getScore(raw, overrides, roll, test) {
  const ov = overrides[roll];
  if (ov && ov[test] !== undefined) return ov[test];
  const val = raw.find(r => r.roll === roll)?.[test];
  return val === 'Ab' || val === undefined ? null : val;
}

function ScoreBar({ value, max = MAX_MARKS, label }) {
  const pct = value === null ? 0 : (value / max) * 100;
  const color = value === null ? '#6b7280' : value >= 8 ? '#10b981' : value >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <div className="ts-score-bar-wrap">
      <div className="ts-score-bar-header">
        <span>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value === null ? 'Absent' : `${value}/${max}`}</span>
      </div>
      <div className="ts-score-track">
        <div className="ts-score-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function TestScoresPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [overrides, setOverrides] = useState({});
  const [myComplaints, setMyComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ test: 'test1', claimedMarks: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!currentUser) { navigate('/'); return; }
    getOverrides().then(setOverrides).catch(() => {});
    getMyComplaint(currentUser.phone).then(setMyComplaints).catch(() => {});
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const roll = currentUser.rollNo;
  const raw = MATH_MARKS_RAW.find(r => r.roll === roll);

  // Outsiders or rolls not in list
  if (!raw || roll === 0) {
    return (
      <div className="profile-page">
        <div className="profile-card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No marks data available for your account.</p>
        </div>
      </div>
    );
  }

  const t1 = getScore(MATH_MARKS_RAW, overrides, roll, 'test1');
  const t2 = getScore(MATH_MARKS_RAW, overrides, roll, 'test2');
  const scores = [t1, t2].filter(v => v !== null);
  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  const improvement = (t1 !== null && t2 !== null) ? t2 - t1 : null;

  const pendingComplaint = myComplaints.find(c => c.status === 'pending');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    const claimed = Number(form.claimedMarks);
    if (isNaN(claimed) || claimed < 0 || claimed > MAX_MARKS) {
      setErr(`Marks must be between 0 and ${MAX_MARKS}.`);
      return;
    }
    const currentVal = form.test === 'test1' ? t1 : t2;
    setSubmitting(true);
    try {
      await fileComplaint({
        phone: currentUser.phone,
        rollNo: roll,
        name: currentUser.name,
        test: form.test,
        claimedMarks: claimed,
        currentMarks: currentVal,
        reason: form.reason,
      });
      const updated = await getMyComplaint(currentUser.phone);
      setMyComplaints(updated);
      setShowForm(false);
      setForm({ test: 'test1', claimedMarks: '', reason: '' });
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2 className="page-title text-gradient" style={{ marginBottom: '0.25rem' }}>Maths Test Scores</h2>
        <p className="as-muted" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          Roll {roll} · {currentUser.name} · Out of {MAX_MARKS}
        </p>

        <div className="ts-scores-grid">
          <ScoreBar value={t1} label="Test 1" />
          <ScoreBar value={t2} label="Test 2" />
        </div>

        {avg !== null && (
          <div className="ts-avg-row">
            <span>Average</span>
            <strong style={{ color: 'var(--primary)' }}>{avg} / {MAX_MARKS}</strong>
          </div>
        )}

        {improvement !== null && (
          <div className="ts-improvement">
            {improvement > 0
              ? <><TrendingUp size={15} color="#10b981" /> <span style={{ color: '#10b981' }}>Improved by {improvement} marks in Test 2</span></>
              : improvement < 0
              ? <><TrendingDown size={15} color="#ef4444" /> <span style={{ color: '#ef4444' }}>Dropped by {Math.abs(improvement)} marks in Test 2</span></>
              : <><Minus size={15} /> <span style={{ color: 'var(--text-muted)' }}>Same score in both tests</span></>
            }
          </div>
        )}

        {/* Complaint status */}
        {myComplaints.length > 0 && (
          <div className="ts-complaints">
            {myComplaints.map(c => (
              <div key={c.id} className={`ts-complaint-item ${c.status}`}>
                {c.status === 'pending' && <Clock size={14} />}
                {c.status === 'approved' && <CheckCircle size={14} />}
                {c.status === 'rejected' && <AlertCircle size={14} />}
                <span>
                  <strong>{c.test === 'test1' ? 'Test 1' : 'Test 2'} complaint</strong> —{' '}
                  {c.status === 'pending' ? 'Pending review' : c.status === 'approved' ? 'Approved' : 'Rejected'}
                  {c.status === 'pending' && ` (claimed: ${c.claimedMarks})`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* File complaint button */}
        {!pendingComplaint && !showForm && (
          <button className="auth-btn secondary" style={{ width: '100%', marginTop: '1.5rem' }}
            onClick={() => setShowForm(true)}>
            <AlertCircle size={15} /> Report incorrect marks
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="ts-complaint-form">
            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Report Incorrect Marks
            </h4>
            <label className="ts-label">Which test?
              <select className="as-select" style={{ width: '100%', marginTop: '0.25rem' }}
                value={form.test} onChange={e => setForm(f => ({ ...f, test: e.target.value }))}>
                <option value="test1">Test 1 (currently: {t1 === null ? 'Absent' : t1})</option>
                <option value="test2">Test 2 (currently: {t2 === null ? 'Absent' : t2})</option>
              </select>
            </label>
            <label className="ts-label">My actual marks (0–{MAX_MARKS})
              <input className="auth-input" type="number" min="0" max={MAX_MARKS} placeholder="e.g. 8"
                value={form.claimedMarks} onChange={e => setForm(f => ({ ...f, claimedMarks: e.target.value }))} required />
            </label>
            <label className="ts-label">Reason (optional)
              <input className="auth-input" type="text" placeholder="e.g. marked absent but I was present"
                value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
            </label>
            {err && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>{err}</p>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="auth-btn" type="submit" style={{ flex: 1 }} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Complaint'}
              </button>
              <button className="auth-btn secondary" type="button" style={{ flex: 1 }}
                onClick={() => { setShowForm(false); setErr(''); }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
