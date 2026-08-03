import { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Camera, ShieldAlert, ShieldCheck, User as UserIcon, Users, Mail, CheckCircle, Clock, FlaskConical, LayoutDashboard, Plus, MinusCircle, Lock, MoveVertical, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { ROLES, TEST_PHONE } from '../auth/roles';
import { saveEmail, setTestAccountRole, resetTestAccount, clearEmail, updateDashboardPreferences } from '../auth/authService';
import { sendEmailLink } from '../firebase';
import { useToast } from '../ux/hooks/useToast';
import packageJson from '../../package.json';

const ToggleSwitch = ({ isOn, onToggle }) => (
  <div onClick={onToggle} style={{
    width: '38px', height: '22px', borderRadius: '20px',
    background: isOn ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
    position: 'relative', cursor: 'pointer', transition: 'background 0.3s',
    flexShrink: 0
  }}>
    <div style={{
      width: '18px', height: '18px', borderRadius: '50%',
      background: '#fff', position: 'absolute', top: '2px',
      left: isOn ? '18px' : '2px', transition: 'left 0.3s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }} />
  </div>
);

export default function ProfilePage() {
  const { currentUser, loading, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef();
  const { toast } = useToast();
  const [photo, setPhoto] = useState(null);
  const [loadedPhotoForPhone, setLoadedPhotoForPhone] = useState(null);

  // Email section state
  const [emailInput, setEmailInput] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Dashboard Customization State
  const DEFAULT_WIDGETS = [
    { id: 'notices', label: 'Notices Board', enabled: true, lockedToggle: true },
    { id: 'homework', label: 'Latest Homework', enabled: true },
    { id: 'classwork', label: 'Latest Classwork', enabled: true },
    { id: 'syllabus', label: 'Syllabus Progress', enabled: true },
    { id: 'records', label: 'My Records', enabled: true },
    { id: 'notes', label: 'Notes Exchange', enabled: true },
    { id: 'testdata', label: 'Test Data', enabled: false },
    { id: 'periodic', label: 'Periodic Predicted', enabled: false },
    { id: 'starbatch', label: 'Star Batch Portal', enabled: false },
    { id: 'studyrooms', label: 'Study Together', enabled: false },
    { id: 'testscores', label: 'Test Scores', enabled: false },
    { id: 'calendar', label: 'School Calendar', enabled: false },
    { id: 'monitor', label: 'Monitor Tools', enabled: false },
    { id: 'admin', label: 'Admin Tools', enabled: false },
    { id: 'maths', label: 'Maths Dashboard', enabled: false },
    { id: 'attendance', label: 'My Attendance', enabled: true, lockedToggle: true }
  ];

  const [widgets, setWidgets] = useState([]);
  const [prefsBusy, setPrefsBusy] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState('');

  // Drag and Drop State
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) setDragOverId(id);
  };

  const handleDragLeave = (e, id) => {
    if (dragOverId === id) setDragOverId(null);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    setDragOverId(null);
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    
    const newWidgets = [...widgets];
    const sourceIndex = newWidgets.findIndex(w => w.id === draggedId);
    const targetIndex = newWidgets.findIndex(w => w.id === targetId);
    
    if (sourceIndex > -1 && targetIndex > -1) {
      const [movedItem] = newWidgets.splice(sourceIndex, 1);
      newWidgets.splice(targetIndex, 0, movedItem);
      setWidgets(newWidgets);
    }
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const availableWidgetsDefault = useMemo(() => {
    if (!currentUser) return DEFAULT_WIDGETS;
    return DEFAULT_WIDGETS.filter(w => {
      if (w.id === 'admin' && currentUser.role !== ROLES.ADMIN) return false;
      if (w.id === 'monitor' && currentUser.role !== ROLES.ADMIN && currentUser.role !== ROLES.MONITOR) return false;
      if (w.id === 'starbatch' && !currentUser.isStarBatch) return false;
      return true;
    });
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && widgets.length === 0) {
      const savedPrefs = currentUser.dashboardPreferences;
      if (savedPrefs && Array.isArray(savedPrefs)) {
        const savedMap = new Map(savedPrefs.map(w => [w.id, w]));
        const merged = savedPrefs.map(w => ({ ...w, label: availableWidgetsDefault.find(d => d.id === w.id)?.label || w.label }));
        availableWidgetsDefault.forEach(dw => {
          if (!savedMap.has(dw.id)) merged.push(dw);
        });
        // Filter out widgets that are in savedPrefs but are no longer available to this user role
        const finalWidgets = merged.filter(w => availableWidgetsDefault.some(d => d.id === w.id));
        setWidgets(finalWidgets);
      } else {
        setWidgets([...availableWidgetsDefault]);
      }
    }
  }, [currentUser, availableWidgetsDefault]);

  const moveWidget = (index, dir) => {
    const newWidgets = [...widgets];
    if (dir === 'up' && index > 0) {
      [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
    } else if (dir === 'down' && index < newWidgets.length - 1) {
      [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
    }
    setWidgets(newWidgets);
  };

  const toggleWidget = (index) => {
    const newWidgets = [...widgets];
    newWidgets[index].enabled = !newWidgets[index].enabled;
    setWidgets(newWidgets);
  };

  const handleSavePrefs = async () => {
    setPrefsBusy(true); setPrefsMsg('');
    try {
      await updateDashboardPreferences(currentUser.phone, widgets);
      await refreshUser(currentUser.phone);
      toast.success('Dashboard preferences saved!');
      setPrefsMsg('✓ Saved successfully');
    } catch (err) {
      setPrefsMsg('Error: ' + err.message);
    } finally {
      setPrefsBusy(false);
    }
  };

  // Show success toast when returning from verification link
  useEffect(() => {
    if (location.state?.emailVerified) {
      toast.success('Email verified successfully!');
      // Clear the router state so it doesn't re-fire on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading && !currentUser) navigate('/');
  }, [currentUser, loading, navigate]);

  const isTeacher = currentUser?.role === ROLES.TEACHER;
  const identifier = isTeacher ? currentUser?.id : currentUser?.phone;
  const isTestAccount = currentUser?.phone === TEST_PHONE;
  const [testRoleBusy, setTestRoleBusy] = useState(false);
  const [testMsg, setTestMsg] = useState('');

  async function handleSwitchRole(role) {
    setTestRoleBusy(true); setTestMsg('');
    try {
      await setTestAccountRole(role);
      await refreshUser(TEST_PHONE);
      setTestMsg(`✓ Switched to ${role}`);
    } catch (e) { setTestMsg('Failed: ' + e.message); }
    finally { setTestRoleBusy(false); }
  }

  async function handleResetAccount() {
    if (!window.confirm('Reset test account? This clears email, attendance, homework, onboarding and resets role to STUDENT.')) return;
    setTestRoleBusy(true); setTestMsg('');
    try {
      await resetTestAccount();
      await refreshUser(TEST_PHONE);
      setTestMsg('✓ Account reset to clean state.');
    } catch (e) { setTestMsg('Failed: ' + e.message); }
    finally { setTestRoleBusy(false); }
  }

  if (currentUser && loadedPhotoForPhone !== identifier) {
    setLoadedPhotoForPhone(identifier);
    setPhoto(localStorage.getItem(`photo_${identifier}`) || null);
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result;
      setPhoto(b64);
      localStorage.setItem(`photo_${identifier}`, b64);
    };
    reader.readAsDataURL(file);
  }

  function getInitials(name) {
    const parts = name.trim().split(' ');
    return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0]).toUpperCase();
  }

  async function handleAddEmail(e) {
    e.preventDefault();
    if (!emailInput.includes('@')) { setEmailMsg('Enter a valid email address.'); return; }
    setEmailBusy(true); setEmailMsg('');
    try {
      await saveEmail(currentUser.phone, emailInput.trim());
      await sendEmailLink(emailInput.trim(), 'verify');
      await refreshUser(currentUser.phone);
      setEmailMsg('✓ Verification link sent! Check your inbox and click the link.');
      setShowEmailForm(false);
    } catch (err) {
      setEmailMsg('Failed to send link: ' + err.message);
    } finally {
      setEmailBusy(false);
    }
  }

  async function handleResendVerification() {
    if (!currentUser.email) return;
    setEmailBusy(true); setEmailMsg('');
    try {
      await sendEmailLink(currentUser.email, 'verify');
      setEmailMsg('✓ Verification link resent! Check your inbox.');
    } catch (err) {
      setEmailMsg('Failed: ' + err.message);
    } finally {
      setEmailBusy(false);
    }
  }

  async function handleChangeEmail() {
    if (!window.confirm('Remove this email so you can enter a different one?')) return;
    setEmailBusy(true); setEmailMsg('');
    try {
      await clearEmail(currentUser.phone);
      await refreshUser(currentUser.phone);
      setEmailInput('');
      setShowEmailForm(true);
    } catch (err) {
      setEmailMsg('Failed: ' + err.message);
    } finally {
      setEmailBusy(false);
    }
  }

  if (!currentUser) return null;

  const maskedPhone = isTeacher
    ? currentUser.id
    : currentUser.phone?.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2') ?? '—';

  return (
    <div className="profile-page">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.5rem', width: '100%', maxWidth: '1100px', boxSizing: 'border-box' }}>
        
        {/* LEFT COLUMN: Profile Info & Email */}
        <div className="profile-card" style={{ maxWidth: '100%', margin: 0, height: 'fit-content' }}>
          <div className="profile-avatar-wrap" onClick={() => fileRef.current.click()} title="Change photo">
            {photo
              ? <img src={photo} alt="profile" className="profile-photo" />
              : <div className="profile-initials">{getInitials(currentUser.name)}</div>
            }
            <div className="profile-camera-overlay"><Camera size={18} /></div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          </div>

          <h2 className="profile-name">{currentUser.name}</h2>
          <p className="profile-roll">
            {isTeacher
              ? `${currentUser.subject} · ${currentUser.period}`
              : currentUser.rollNo === 0 ? 'Outsider Account' : `Class 10th HI · Roll No. ${currentUser.rollNo}`}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
            {currentUser.role === ROLES.ADMIN && <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}><ShieldAlert size={14} style={{ marginRight: 4 }} /> ADMIN</span>}
            {currentUser.role === ROLES.MONITOR && <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}><ShieldCheck size={14} style={{ marginRight: 4 }} /> MONITOR</span>}
            {currentUser.role === ROLES.STUDENT && <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}><UserIcon size={14} style={{ marginRight: 4 }} /> STUDENT</span>}
            {currentUser.role === ROLES.OUTSIDER && <span className="badge" style={{ background: 'rgba(168, 162, 158, 0.1)', color: '#a8a29e', border: '1px solid rgba(168, 162, 158, 0.3)' }}><Users size={14} style={{ marginRight: 4 }} /> OUTSIDER</span>}
            {isTeacher && <span className="badge teacher-chip">TEACHER</span>}
          </div>

          <div className="profile-info-grid">
            <div className="profile-info-item">
              <span className="profile-info-label">{isTeacher ? 'Teacher ID' : 'Login ID (Phone)'}</span>
              <span className="profile-info-value">{maskedPhone}</span>
            </div>
            {isTeacher ? (
              <div className="profile-info-item">
                <span className="profile-info-label">Period</span>
                <span className="profile-info-value">{currentUser.period}</span>
              </div>
            ) : (
              <div className="profile-info-item">
                <span className="profile-info-label">{currentUser.rollNo === 0 ? 'Account Type' : 'Roll Number'}</span>
                <span className="profile-info-value">{currentUser.rollNo === 0 ? 'Outsider' : currentUser.rollNo}</span>
              </div>
            )}
            {!isTeacher && (
              <div className="profile-info-item">
                <span className="profile-info-label">Registered</span>
                <span className="profile-info-value">{currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-IN') : '—'}</span>
              </div>
            )}
          </div>

          <p className="profile-photo-hint">Tap the photo to change it. Stored on this device only.</p>

          {/* ── Email Section — students only ── */}
          {!isTeacher && (
          <div className="profile-email-section" style={{ marginTop: '1rem' }}>
            <div className="profile-email-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="profile-email-header">
                <Mail size={15} />
                <span>Recovery Email</span>
              </div>

              {currentUser.email && currentUser.emailVerified ? (
                <div className="profile-email-row">
                  <span className="profile-email-addr">
                    {currentUser.email.replace(/(.{2}).*(@.*)/, '$1…$2')}
                  </span>
                  <span className="profile-email-badge verified">
                    <CheckCircle size={12} /> Verified
                  </span>
                </div>
              ) : currentUser.email && !currentUser.emailVerified ? (
                <>
                  <div className="profile-email-row">
                    <span className="profile-email-addr">
                      {currentUser.email.replace(/(.{2}).*(@.*)/, '$1…$2')}
                    </span>
                    <span className="profile-email-badge pending">
                      <Clock size={12} /> Pending
                    </span>
                  </div>
                  <p className="profile-email-hint">
                    Check your inbox (and <strong>spam folder</strong>) for the verification link.
                  </p>
                  <button type="button" className="profile-email-resend"
                    onClick={handleResendVerification} disabled={emailBusy}>
                    {emailBusy ? 'Sending…' : 'Resend verification link'}
                  </button>
                  <button type="button" className="profile-email-resend"
                    onClick={handleChangeEmail} disabled={emailBusy}
                    style={{ marginTop: '0.4rem', color: 'var(--text-muted)', borderColor: 'rgba(113,113,122,0.35)' }}>
                    ✏️ Wrong email? Change it
                  </button>
                  {emailMsg && <p className="profile-email-msg">{emailMsg}</p>}
                </>
              ) : showEmailForm ? (
                <form onSubmit={handleAddEmail} className="profile-email-form">
                  <input
                    type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
                    placeholder="your@email.com" required autoFocus
                    className="profile-email-input"
                  />
                  <p className="profile-email-hint">
                    A verification link will be sent to this email. Check your <strong>spam folder</strong> if you don't see it.
                  </p>
                  <div className="profile-email-actions">
                    <button className="auth-btn primary" type="submit" disabled={emailBusy}
                      style={{ flex: 1, fontSize: '0.875rem' }}>
                      {emailBusy ? 'Sending…' : 'Send verification link'}
                    </button>
                    <button type="button" className="auth-btn secondary"
                      onClick={() => { setShowEmailForm(false); setEmailMsg(''); }}
                      style={{ fontSize: '0.875rem' }}>
                      Cancel
                    </button>
                  </div>
                  {emailMsg && <p className="profile-email-msg">{emailMsg}</p>}
                </form>
              ) : (
                <>
                  <p className="profile-email-hint" style={{ marginBottom: '0.6rem' }}>
                    Used to reset your password if you forget it.
                  </p>
                  <button type="button" className="profile-email-resend"
                    onClick={() => setShowEmailForm(true)}>
                    + Add email address
                  </button>
                </>
              )}
            </div>
          </div>
          )}

          {/* ── Test Account Role Switcher ── */}
          {isTestAccount && (
            <div className="profile-email-section">
              <div className="profile-email-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="profile-email-header">
                  <FlaskConical size={15} />
                  <span>Test Account — Switch Role</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {[ROLES.STUDENT, ROLES.MONITOR, ROLES.TEACHER, ROLES.ADMIN].map(role => (
                    <button
                      key={role}
                      type="button"
                      className={`auth-btn ${currentUser.role === role ? 'primary' : 'secondary'}`}
                      style={{ flex: 1, minWidth: '80px', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                      disabled={testRoleBusy || currentUser.role === role}
                      onClick={() => handleSwitchRole(role)}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="auth-btn secondary"
                  style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.82rem', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                  disabled={testRoleBusy}
                  onClick={handleResetAccount}
                >
                  🔄 Reset Test Account
                </button>
                {testMsg && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>{testMsg}</p>}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Dashboard Customization */}
        {!isTeacher && widgets.length > 0 && (
          <div className="profile-card" style={{ maxWidth: '100%', margin: 0, height: 'fit-content' }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <LayoutDashboard size={22} color="var(--primary)" />
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Dashboard Customizer</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
                Personalize your dashboard layout. Drag to reorder, or add/remove features below.
              </p>

              {/* INCLUDED WIDGETS */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.05em', fontWeight: 600 }}>Included (Drag to reorder)</h3>
                <div style={{ 
                  display: 'flex', flexDirection: 'column', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: 'var(--radius-md)', 
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ width: '24px' }}></div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, flex: 1, paddingLeft: '0.8rem' }}>Fixed Top (AI Insights & Banners)</span>
                    <Lock size={16} color="var(--text-muted)" />
                  </div>
                  
                  {widgets.filter(w => w.enabled).map((widget, i, arr) => {
                    const idx = widgets.findIndex(w => w.id === widget.id);
                    const isLast = i === arr.length - 1;
                    return (
                      <div 
                        key={`drag-${widget.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, widget.id)}
                        onDragOver={(e) => handleDragOver(e, widget.id)}
                        onDragLeave={(e) => handleDragLeave(e, widget.id)}
                        onDrop={(e) => handleDrop(e, widget.id)}
                        onDragEnd={handleDragEnd}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 1rem',
                          background: dragOverId === widget.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                          borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                          cursor: 'grab',
                          opacity: draggedId === widget.id ? 0.4 : 1,
                          transition: 'background 0.2s ease',
                        }}
                      >
                        <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                          {widget.lockedToggle ? (
                            <Lock size={16} color="var(--text-muted)" />
                          ) : (
                            <button onClick={() => toggleWidget(idx)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                              <MinusCircle size={20} />
                            </button>
                          )}
                        </div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>{widget.label}</span>
                        <MoveVertical size={18} color="rgba(255,255,255,0.2)" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MORE CONTROLS WIDGETS */}
              {widgets.filter(w => !w.enabled).length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.05em', fontWeight: 600 }}>More Controls</h3>
                  <div style={{ 
                    display: 'flex', flexDirection: 'column',
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid rgba(255,255,255,0.06)', 
                    borderRadius: 'var(--radius-md)', 
                    overflow: 'hidden'
                  }}>
                    {widgets.filter(w => !w.enabled).map((widget, i, arr) => {
                      const idx = widgets.findIndex(w => w.id === widget.id);
                      const isLast = i === arr.length - 1;
                      return (
                        <div key={`toggle-${widget.id}`} style={{ 
                          display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 1rem',
                          borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)'
                        }}>
                          <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                            <button onClick={() => toggleWidget(idx)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                              <Plus size={20} />
                            </button>
                          </div>
                          <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', flex: 1 }}>{widget.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button type="button" className="auth-btn primary" style={{ width: '100%', fontSize: '0.9rem', padding: '0.8rem' }} disabled={prefsBusy} onClick={handleSavePrefs}>
                {prefsBusy ? 'Saving...' : 'Save Layout Preferences'}
              </button>
              {prefsMsg && <p style={{ fontSize: '0.85rem', color: prefsMsg.includes('Error') ? '#f87171' : '#10b981', marginTop: '0.75rem', textAlign: 'center', fontWeight: 500 }}>{prefsMsg}</p>}
            </div>
          </div>
        )}
      </div>

      <div style={{ width: '100%', maxWidth: '400px', margin: '2.5rem auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button className="auth-btn secondary profile-logout" style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', margin: 0 }} onClick={() => { logout(); navigate('/'); }}>
          Sign Out
        </button>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1.5rem', fontWeight: 500 }}>
          App Version: v{packageJson.version}
        </p>
      </div>
    </div>
  );
}
