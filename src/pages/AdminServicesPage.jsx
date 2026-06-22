import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../auth/roles';
import { resetWhatsNew } from '../auth/authService';
import { getAllUsers, getActivitySummary } from '../services/adminService';
import { Users, Activity, Settings, Search, ShieldAlert, ShieldCheck, User, Users as UsersIcon, Clock, BarChart2, GitMerge, AlertTriangle, Check } from 'lucide-react';
import { fetchDuplicates, mergeProfiles } from '../services/mergeService';

const TABS = [
  { id: 'users',    label: 'User Directory',  Icon: Users },
  { id: 'activity', label: 'Activity',         Icon: Activity },
  { id: 'merge',    label: 'Merge Profiles',   Icon: GitMerge },
  { id: 'onboarding', label: 'Onboarding',     Icon: Settings },
];

const ROLE_STYLE = {
  ADMIN:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    Icon: ShieldAlert },
  MONITOR:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   Icon: ShieldCheck },
  STUDENT:  { color: '#10b981', bg: 'rgba(16,185,129,0.1)',   Icon: User },
  OUTSIDER: { color: '#a8a29e', bg: 'rgba(168,162,158,0.1)',  Icon: UsersIcon },
};

function relativeTime(ms) {
  if (!ms) return '—';
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

// ── Users Tab ─────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getAllUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  const filtered = (users || [])
    .filter(u => u.name?.toLowerCase().includes(query.toLowerCase()) || String(u.rollNo).includes(query))
    .sort((a, b) => (a.rollNo || 999) - (b.rollNo || 999));

  return (
    <div>
      <div className="as-search-row">
        <Search size={16} />
        <input
          className="as-search"
          placeholder="Search by name or roll no…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      {users === null ? (
        <p className="as-muted">Loading…</p>
      ) : (
        <>
          <p className="as-muted" style={{ marginBottom: '0.75rem' }}>{filtered.length} of {users.length} users</p>
          <div className="as-table-wrap">
            <table className="as-table">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const rs = ROLE_STYLE[u.role] || ROLE_STYLE.OUTSIDER;
                  const RIcon = rs.Icon;
                  const masked = u.phone?.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2') || '—';
                  return (
                    <tr key={u.id}>
                      <td>{u.rollNo || '—'}</td>
                      <td style={{ fontWeight: 500 }}>{u.name}</td>
                      <td className="as-mono">{masked}</td>
                      <td>
                        <span className="as-role-badge" style={{ color: rs.color, background: rs.bg }}>
                          <RIcon size={11} /> {u.role}
                        </span>
                      </td>
                      <td className="as-muted-cell">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────
function ActivityTab() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [sort, setSort] = useState('lastSeen'); // lastSeen | totalVisits

  useEffect(() => {
    Promise.all([getActivitySummary(), getAllUsers()]).then(([act, usr]) => {
      setSummary(act);
      setUsers(usr);
    }).catch(() => setSummary([]));
  }, []);

  if (summary === null) return <p className="as-muted">Loading…</p>;

  // Merge activity with user names
  const userMap = Object.fromEntries(users.map(u => [u.phone, u]));

  const rows = summary.map(a => {
    const totalVisits = Object.values(a.events || {}).reduce((s, v) => s + v, 0);
    const topPage = Object.entries(a.events || {}).sort((x, y) => y[1] - x[1])[0];
    return { ...a, totalVisits, topPage: topPage?.[0] || '—', user: userMap[a.phone] };
  });

  const sorted = [...rows].sort((a, b) =>
    sort === 'lastSeen' ? (b.lastSeen || 0) - (a.lastSeen || 0) : b.totalVisits - a.totalVisits
  );

  // Aggregate page usage across all users
  const pageAgg = {};
  summary.forEach(a => {
    Object.entries(a.events || {}).forEach(([page, cnt]) => {
      pageAgg[page] = (pageAgg[page] || 0) + cnt;
    });
  });
  const topPages = Object.entries(pageAgg).sort((a, b) => b[1] - a[1]);
  const maxCount = topPages[0]?.[1] || 1;

  return (
    <div>
      {/* Page popularity */}
      <h4 className="as-section-title"><BarChart2 size={15} /> Page Popularity</h4>
      <div className="as-bar-list">
        {topPages.map(([page, cnt]) => (
          <div key={page} className="as-bar-row">
            <span className="as-bar-label">{page}</span>
            <div className="as-bar-track">
              <div className="as-bar-fill" style={{ width: `${(cnt / maxCount) * 100}%` }} />
            </div>
            <span className="as-bar-count">{cnt}</span>
          </div>
        ))}
      </div>

      {/* Per-user table */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1.5rem 0 0.75rem' }}>
        <h4 className="as-section-title" style={{ margin: 0 }}><Users size={15} /> Per-User Activity</h4>
        <select className="as-select" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="lastSeen">Sort: Last Active</option>
          <option value="totalVisits">Sort: Most Active</option>
        </select>
      </div>
      <div className="as-table-wrap">
        <table className="as-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Last Active</th>
              <th>Total Visits</th>
              <th>Top Page</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.phone}>
                <td style={{ fontWeight: 500 }}>{row.user?.name || row.phone}</td>
                <td className="as-muted-cell"><Clock size={12} style={{ marginRight: 4 }} />{relativeTime(row.lastSeen)}</td>
                <td style={{ textAlign: 'center' }}>{row.totalVisits}</td>
                <td className="as-muted-cell">{row.topPage}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={4} className="as-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>No activity data yet. Users will appear here once they browse.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Onboarding Tab ────────────────────────────────────────────
function OnboardingTab({ currentUser, navigate, triggerTour }) {
  return (
    <div>
      <p className="as-muted" style={{ marginBottom: '1rem' }}>Tours run on the dashboard — you'll be taken there first.</p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <button className="auth-btn secondary" style={{ flex: 1 }} onClick={() => { triggerTour(ROLES.STUDENT); navigate('/'); }}>Test Student Tour</button>
        <button className="auth-btn secondary" style={{ flex: 1 }} onClick={() => { triggerTour(ROLES.MONITOR); navigate('/'); }}>Test Monitor Tour</button>
      </div>
      <button className="auth-btn secondary" style={{ width: '100%', marginTop: '0.25rem' }}
        onClick={() => { localStorage.removeItem(`onboarding_done_${currentUser.phone}`); alert('Onboarding reset. Refresh to trigger.'); }}>
        Reset Onboarding (for testing)
      </button>
      <button className="auth-btn secondary" style={{ width: '100%', marginTop: '0.5rem' }}
        onClick={async () => {
          localStorage.removeItem(`whatsnew_v1_${currentUser.phone}`);
          try { await resetWhatsNew(currentUser.phone); } catch (e) { console.error(e); }
          window.location.href = '/';
        }}>
        Show "What's New" Again (for testing)
      </button>
    </div>
  );
}


// ── Merge Tab ─────────────────────────────────────────────────
function MergeTab() {
  const [rollNo, setRollNo] = useState('');
  const [dupes, setDupes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [status, setStatus] = useState(null); // null | 'confirm' | 'merging' | 'done' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSearch() {
    if (!rollNo) return;
    setLoading(true); setDupes(null); setStatus(null); setPrimaryPhone('');
    try {
      const found = await fetchDuplicates(rollNo);
      setDupes(found);
      if (found.length >= 2) setPrimaryPhone(found[0].phone);
    } catch(e) { setErrorMsg(e.message); setStatus('error'); }
    finally { setLoading(false); }
  }

  async function handleMerge() {
    setStatus('merging');
    try {
      const secondary = dupes.find(u => u.phone !== primaryPhone);
      await mergeProfiles(primaryPhone, secondary.phone);
      setStatus('done');
    } catch(e) { setErrorMsg(e.message); setStatus('error'); }
  }

  const secondary = dupes?.find(u => u.phone !== primaryPhone);

  function mask(phone) { return phone?.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2') || '—'; }

  return (
    <div>
      <p className="as-muted" style={{ marginBottom: '1rem' }}>
        Search by roll number to find duplicate accounts, then merge them into one profile.
        Array data (homework, attendance, syllabus) is always unioned — nothing is lost.
        The user will be prompted to set a new password on next login.
      </p>

      <div className="as-search-row" style={{ maxWidth: 320 }}>
        <Search size={16} />
        <input className="as-search" placeholder="Roll number…" value={rollNo}
          onChange={e => setRollNo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button className="auth-btn secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
          onClick={handleSearch} disabled={loading}>
          {loading ? '…' : 'Search'}
        </button>
      </div>

      {dupes !== null && dupes.length < 2 && (
        <p className="as-muted" style={{ marginTop: '1rem' }}>
          {dupes.length === 0 ? 'No users found for this roll number.' : 'Only one account found — no merge needed.'}
        </p>
      )}

      {dupes?.length >= 2 && status !== 'done' && (
        <div className="merge-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#f59e0b' }}>
            <AlertTriangle size={16} /> <strong>2 accounts found for Roll {rollNo}</strong>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Choose which phone number becomes the <strong>primary</strong> (login) number.
            The other becomes the alternate — both will still work to log in.
          </p>

          <div className="merge-phone-list">
            {dupes.map(u => (
              <label key={u.phone} className={`merge-phone-option ${primaryPhone === u.phone ? 'selected' : ''}`}>
                <input type="radio" name="primary" value={u.phone}
                  checked={primaryPhone === u.phone}
                  onChange={() => setPrimaryPhone(u.phone)} />
                <div>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                  <div className="as-mono" style={{ fontSize: '0.82rem' }}>{mask(u.phone)}</div>
                  <div className="as-muted" style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                    Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'} ·{' '}
                    Homework: {(u.completedHomework || []).length} ·{' '}
                    Absent days: {(u.attendance_absentDays || []).length}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {secondary && (
            <div className="merge-summary">
              <strong>After merge:</strong> {mask(primaryPhone)} is primary · {mask(secondary.phone)} becomes alternate ·
              Array data unioned · Password cleared (user sets new one on next login)
            </div>
          )}

          {status === 'confirm' ? (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="auth-btn" style={{ flex: 1 }} onClick={handleMerge}>
                Yes, merge permanently
              </button>
              <button className="auth-btn secondary" style={{ flex: 1 }} onClick={() => setStatus(null)}>
                Cancel
              </button>
            </div>
          ) : status === 'merging' ? (
            <p className="as-muted" style={{ marginTop: '1rem' }}>Merging…</p>
          ) : (
            <button className="auth-btn" style={{ marginTop: '1rem', width: '100%' }}
              onClick={() => setStatus('confirm')} disabled={!primaryPhone}>
              <GitMerge size={15} /> Merge Profiles
            </button>
          )}

          {status === 'error' && <p style={{ color: '#ef4444', marginTop: '0.75rem', fontSize: '0.85rem' }}>{errorMsg}</p>}
        </div>
      )}

      {status === 'done' && (
        <div className="merge-card merge-done">
          <Check size={20} color="#10b981" />
          <div>
            <strong>Merge complete.</strong>
            <p className="as-muted">
              {mask(primaryPhone)} is now the primary account.
              The user will see a banner on their dashboard and be prompted to set a new password on next login.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function AdminServicesPage() {
  const { currentUser, triggerTour } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');

  useEffect(() => {
    if (!currentUser || currentUser.role !== ROLES.ADMIN) navigate('/');
  }, [currentUser, navigate]);

  if (!currentUser || currentUser.role !== ROLES.ADMIN) return null;

  return (
    <div className="as-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <ShieldAlert size={22} color="#ef4444" />
        <h1 className="page-title text-gradient" style={{ margin: 0 }}>Admin Services</h1>
      </div>

      <div className="as-tabs">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`as-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="as-content">
        {tab === 'users'      && <UsersTab />}
        {tab === 'activity'   && <ActivityTab />}
        {tab === 'merge'      && <MergeTab />}
        {tab === 'onboarding' && <OnboardingTab currentUser={currentUser} navigate={navigate} triggerTour={triggerTour} />}
      </div>
    </div>
  );
}
