import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getTables, getMyEntries, addRecordRequest } from '../services/recordsService';
import { ClipboardList, AlertCircle, X, Send } from 'lucide-react';

function ValueDisplay({ type, value }) {
  if (value === undefined || value === null || value === '') return <span className="rec-muted">—</span>;
  if (type === 'check') return <span className={`rec-check-display ${value ? 'yes' : 'no'}`}>{value ? '✓ Yes' : '✗ No'}</span>;
  return <span>{String(value)}</span>;
}

export default function RecordPage() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables]   = useState(null);
  const [entries, setEntries] = useState({});  // { tableId: { values } }

  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedCol, setSelectedCol] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !currentUser) navigate('/');
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    if (!currentUser?.rollNo) return;
    Promise.all([
      getTables(),
      getMyEntries(currentUser.rollNo),
    ]).then(([tbls, myEntries]) => {
      const map = {};
      myEntries.forEach(e => { map[e.tableId] = e.values || {}; });
      setTables(tbls.filter(t => !t.sensitive));
      setEntries(map);
    }).catch(console.error);
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div className="rec-page">
      <div className="rec-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="rec-page-title">
          <ClipboardList size={26} />
          <h1>My Records</h1>
        </div>
        <button className="auth-btn secondary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertCircle size={16} /> File complaint
        </button>
      </div>
      <p className="rec-page-sub">Your class records, filled by monitors.</p>

      {tables === null ? (
        <p className="rec-muted">Loading…</p>
      ) : tables.length === 0 ? (
        <div className="rec-empty">
          <ClipboardList size={40} />
          <p>No records available right now.</p>
        </div>
      ) : (
        <div className="rec-student-grid">
          {tables.map(table => {
            const vals = entries[table.id] || {};
            const hasData = table.columns?.some(c => vals[c.id] !== undefined && vals[c.id] !== '');
            return (
              <div key={table.id} className="rec-student-card">
                <div className="rec-student-card-header">
                  <h3 className="rec-student-card-title">{table.title}</h3>
                  {table.description && <p className="rec-student-card-desc">{table.description}</p>}
                </div>
                {!hasData ? (
                  <p className="rec-muted rec-not-filled">Not filled yet</p>
                ) : (
                  <div className="rec-student-fields">
                    {table.columns?.map(col => (
                      <div key={col.id} className="rec-student-field">
                        <span className="rec-field-label">{col.label}</span>
                        <span className="rec-field-value">
                          <ValueDisplay type={col.type} value={vals[col.id]} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Complaint Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} /> Request Record Change
              </h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedTable || !selectedCol || !message.trim()) return;
              setSubmitting(true);
              try {
                const tbl = tables.find(t => t.id === selectedTable);
                const col = tbl.columns.find(c => c.id === selectedCol);
                
                await addRecordRequest({
                  tableId: tbl.id,
                  tableName: tbl.title,
                  colId: col.id,
                  colName: col.label,
                  rollNo: currentUser.rollNo,
                  studentName: currentUser.name,
                  message: message.trim()
                });
                
                alert('Request submitted! Monitor will review it.');
                setShowModal(false);
                setSelectedTable('');
                setSelectedCol('');
                setMessage('');
              } catch (err) {
                console.error(err);
                alert('Failed to submit request.');
              } finally {
                setSubmitting(false);
              }
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label className="auth-label">Select Table</label>
                  <select 
                    className="auth-input" 
                    value={selectedTable} 
                    onChange={e => { setSelectedTable(e.target.value); setSelectedCol(''); }}
                    required
                  >
                    <option value="">-- Choose Table --</option>
                    {tables?.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                {selectedTable && (
                  <div>
                    <label className="auth-label">Select Column</label>
                    <select 
                      className="auth-input" 
                      value={selectedCol} 
                      onChange={e => setSelectedCol(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Column --</option>
                      {tables.find(t => t.id === selectedTable)?.columns.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="auth-label">Message</label>
                  <textarea
                    className="auth-input"
                    placeholder="e.g. I have completed my holiday homework but it shows ✗ No."
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button type="submit" disabled={submitting} className="auth-btn primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
