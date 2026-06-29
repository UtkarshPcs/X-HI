import { useState, useEffect, useRef } from 'react';
import { ClipboardList, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { rollList } from '../auth/rollList';
import { getTables, getEntries, setCellValue } from '../services/recordsService';

// Identical to RecordMonitorPage's EditCell — inline editable cell
function EditCell({ type, value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(value ?? ''));
  const inputRef = useRef();

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  if (type === 'check') {
    return (
      <button
        className={`rec-check-cell ${value ? 'checked' : ''}`}
        onClick={() => onChange(!value)}
        title={value ? 'Mark as unchecked' : 'Mark as checked'}
      >
        {value ? '✓' : '—'}
      </button>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="rec-edit-input"
        type={type === 'number' ? 'number' : 'text'}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); onChange(type === 'number' ? Number(draft) : draft); }}
        onKeyDown={e => {
          if (e.key === 'Enter') e.target.blur();
          if (e.key === 'Escape') { setEditing(false); setDraft(String(value ?? '')); }
        }}
      />
    );
  }

  return (
    <span className="rec-view-cell" onClick={() => { setDraft(String(value ?? '')); setEditing(true); }}>
      {value !== undefined && value !== '' && value !== null
        ? String(value)
        : <span className="rec-muted">—</span>}
    </span>
  );
}

function TableSection({ table }) {
  const [entries, setEntries] = useState({});
  const [open, setOpen]       = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEntries(table.id)
      .then(rows => {
        const map = {};
        rows.forEach(r => { map[r.rollNo] = r.values || {}; });
        setEntries(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [table.id]);

  async function handleChange(rollNo, colId, value) {
    setEntries(prev => ({ ...prev, [rollNo]: { ...(prev[rollNo] || {}), [colId]: value } }));
    try {
      await setCellValue(table.id, rollNo, colId, value);
    } catch (err) {
      alert('Could not save: ' + (err?.message || err));
    }
  }

  return (
    <div className="rec-section-card">
      <button className="rec-section-header" onClick={() => setOpen(v => !v)}>
        <div className="rec-section-title">
          {table.title}
          {table.sensitive && <span className="rec-sensitive-badge"><Lock size={11} /> Sensitive</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {table.description && <span className="rec-section-desc">{table.description}</span>}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        loading ? <p className="rec-muted" style={{ padding: '1rem' }}>Loading…</p> : (
          <div className="rec-table-wrap">
            <table className="rec-table">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Name</th>
                  {table.columns.map(c => <th key={c.id}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rollList.map(student => (
                  <tr key={student.rollNo}>
                    <td className="rec-td-roll">{student.rollNo}</td>
                    <td className="rec-td-name">{student.name}</td>
                    {table.columns.map(col => (
                      <td key={col.id}>
                        <EditCell
                          type={col.type}
                          value={entries[student.rollNo]?.[col.id]}
                          onChange={val => handleChange(student.rollNo, col.id, val)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

/**
 * Teacher-facing records view. Only shows tables the admin has granted
 * via recordTables: string[] on the teacher doc.
 */
export default function TeacherRecordsView({ recordTables = [] }) {
  const [tables, setTables] = useState(null);

  useEffect(() => {
    if (!recordTables.length) { setTables([]); return; }
    getTables()
      .then(all => setTables(all.filter(t => recordTables.includes(t.id))))
      .catch(() => setTables([]));
  }, [recordTables.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (tables === null) return <p className="rec-muted">Loading…</p>;

  if (recordTables.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No record tables assigned yet. Ask the admin to grant access.</p>;
  }

  if (tables.length === 0) {
    return (
      <div className="rec-empty">
        <ClipboardList size={36} />
        <p>No matching record tables found.</p>
      </div>
    );
  }

  return (
    <div className="rec-sections">
      {tables.map(t => <TableSection key={t.id} table={t} />)}
    </div>
  );
}
