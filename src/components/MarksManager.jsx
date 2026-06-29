import { useState, useEffect, useRef } from 'react';
import { rollList } from '../auth/rollList';
import {
  getTests, createTest, deleteTest,
  getTestMarks, setStudentMark, deleteStudentMark,
} from '../services/mathTestService';
import { BarChart2, Plus, Trash2, X, Check, Loader2 } from 'lucide-react';

// ── One student row ────────────────────────────────────────────
function StudentRow({ student, maxMarks, value, onSave, onDelete }) {
  const [draft, setDraft] = useState(value === undefined ? '' : String(value));
  const [saved, setSaved] = useState(false);
  const absent = value === 'Ab';

  useEffect(() => { setDraft(value === undefined ? '' : value === 'Ab' ? '' : String(value)); }, [value]);

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 1200); }

  async function commit(raw) {
    const trimmed = String(raw).trim();
    if (trimmed === '') { return; } // empty = no change; use delete to clear
    const num = Number(trimmed);
    if (isNaN(num) || num < 0 || num > maxMarks) {
      alert(`Marks must be between 0 and ${maxMarks}.`);
      setDraft(value === undefined || value === 'Ab' ? '' : String(value));
      return;
    }
    try { await onSave(num); flash(); }
    catch (err) { alert('Could not save: ' + (err?.message || err)); }
  }

  async function toggleAbsent() {
    try {
      if (absent) { await onDelete(); }
      else { await onSave('Ab'); flash(); }
    } catch (err) { alert('Could not save: ' + (err?.message || err)); }
  }

  return (
    <div className={`mm-row ${absent ? 'absent' : ''}`}>
      <span className="mm-roll">{student.rollNo}</span>
      <span className="mm-name">{student.name}</span>
      <div className="mm-input-wrap">
        {absent ? (
          <span className="mm-absent-pill">Absent</span>
        ) : (
          <input
            className="mm-input"
            type="number"
            inputMode="numeric"
            min={0}
            max={maxMarks}
            placeholder="—"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={e => commit(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
          />
        )}
        {saved && <Check size={14} className="mm-saved-tick" />}
      </div>
      <button
        type="button"
        className={`mm-absent-btn ${absent ? 'active' : ''}`}
        onClick={toggleAbsent}
        title={absent ? 'Mark as present (clears mark)' : 'Mark absent'}
      >
        {absent ? 'Present' : 'Absent'}
      </button>
      {value !== undefined && (
        <button type="button" className="mm-clear-btn" onClick={onDelete} title="Clear this mark">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ── New test modal ─────────────────────────────────────────────
function NewTestModal({ onClose, onCreate }) {
  const [name, setName]       = useState('');
  const [maxMarks, setMax]    = useState('');
  const [busy, setBusy]       = useState(false);

  async function submit(e) {
    e.preventDefault();
    const mm = Number(maxMarks);
    if (!name.trim()) return;
    if (isNaN(mm) || mm <= 0) { alert('Enter valid max marks.'); return; }
    setBusy(true);
    try { await onCreate(name.trim(), mm); }
    catch (err) { alert('Failed: ' + err.message); setBusy(false); }
  }

  return (
    <div className="mm-modal-overlay" onClick={onClose}>
      <div className="mm-modal" onClick={e => e.stopPropagation()}>
        <div className="mm-modal-header">
          <h3><Plus size={16} /> New Test</h3>
          <button className="mm-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="mm-modal-body">
          <label className="mm-field">Test name
            <input className="mm-text-input" placeholder="e.g. Test 3" value={name}
              onChange={e => setName(e.target.value)} required autoFocus />
          </label>
          <label className="mm-field">Max marks
            <input className="mm-text-input" type="number" min={1} placeholder="e.g. 20" value={maxMarks}
              onChange={e => setMax(e.target.value)} required />
          </label>
          <button className="auth-btn primary" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create Test'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main module ────────────────────────────────────────────────
export default function MarksManager({ currentUser }) {
  const [tests, setTests]       = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [marks, setMarks]       = useState({});   // { rollNo: value }
  const [loadingMarks, setLM]   = useState(false);
  const [showModal, setModal]   = useState(false);

  async function loadTests() {
    const t = await getTests();
    setTests(t);
    if (t.length && !t.find(x => x.id === activeId)) setActiveId(t[0].id);
    if (!t.length) setActiveId(null);
    return t;
  }

  useEffect(() => { loadTests().catch(console.error); }, []);

  // Load marks whenever the active test changes
  useEffect(() => {
    if (!activeId) { setMarks({}); return; }
    setLM(true);
    getTestMarks(activeId)
      .then(rows => {
        const map = {};
        rows.forEach(r => { map[r.rollNo] = r.marks; });
        setMarks(map);
      })
      .catch(console.error)
      .finally(() => setLM(false));
  }, [activeId]);

  const activeTest = tests?.find(t => t.id === activeId) || null;

  async function handleCreate(name, maxMarks) {
    const id = await createTest({ name, maxMarks, createdBy: currentUser?.id });
    await loadTests();
    setActiveId(id);
    setModal(false);
  }

  async function handleDeleteTest() {
    if (!activeTest) return;
    if (!confirm(`Delete "${activeTest.name}" and all its marks? This cannot be undone.`)) return;
    await deleteTest(activeTest.id);
    await loadTests();
  }

  async function saveMark(rollNo, value) {
    setMarks(prev => ({ ...prev, [rollNo]: value }));
    await setStudentMark(activeId, rollNo, value);
  }

  async function clearMark(rollNo) {
    setMarks(prev => { const n = { ...prev }; delete n[rollNo]; return n; });
    await deleteStudentMark(activeId, rollNo);
  }

  const enteredCount = Object.keys(marks).length;

  return (
    <div className="glass-card mm-card">
      <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <BarChart2 size={20} color="var(--primary)" /> Maths Marks
      </h2>

      {/* Test selector */}
      <div className="mm-test-bar">
        {tests === null ? (
          <span className="mm-muted">Loading tests…</span>
        ) : tests.length === 0 ? (
          <span className="mm-muted">No tests yet. Create one to start.</span>
        ) : (
          tests.map(t => (
            <button
              key={t.id}
              className={`mm-test-chip ${t.id === activeId ? 'active' : ''}`}
              onClick={() => setActiveId(t.id)}
            >
              {t.name} <span className="mm-test-max">/{t.maxMarks}</span>
            </button>
          ))
        )}
        <button className="mm-new-test-btn" onClick={() => setModal(true)}>
          <Plus size={14} /> New Test
        </button>
      </div>

      {/* Active test editor */}
      {activeTest && (
        <>
          <div className="mm-active-head">
            <div>
              <strong>{activeTest.name}</strong>
              <span className="mm-muted" style={{ marginLeft: '0.5rem', fontSize: '0.82rem' }}>
                out of {activeTest.maxMarks} · {enteredCount}/{rollList.length} entered
              </span>
            </div>
            <button className="mm-delete-test" onClick={handleDeleteTest} title="Delete this test">
              <Trash2 size={14} /> Delete Test
            </button>
          </div>

          {loadingMarks ? (
            <div className="mm-loading"><Loader2 size={20} className="mm-spin" /> Loading marks…</div>
          ) : (
            <div className="mm-rows">
              {rollList.map(student => (
                <StudentRow
                  key={student.rollNo}
                  student={student}
                  maxMarks={activeTest.maxMarks}
                  value={marks[student.rollNo]}
                  onSave={(v) => saveMark(student.rollNo, v)}
                  onDelete={() => clearMark(student.rollNo)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showModal && <NewTestModal onClose={() => setModal(false)} onCreate={handleCreate} />}
    </div>
  );
}
