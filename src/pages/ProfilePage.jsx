import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Camera, ShieldAlert, ShieldCheck, User as UserIcon, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { ROLES } from '../auth/roles';
import ClassInfo from '../components/ClassInfo';
import packageJson from '../../package.json';

export default function ProfilePage() {
  const { currentUser, logout, triggerTour } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [photo, setPhoto] = useState(null);
  const [showClassInfo, setShowClassInfo] = useState(false);

  useEffect(() => {
    if (!currentUser) { navigate('/'); return; }
    const saved = localStorage.getItem(`photo_${currentUser.phone}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (saved) setPhoto(saved);
  }, [currentUser, navigate]);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result;
      setPhoto(b64);
      localStorage.setItem(`photo_${currentUser.phone}`, b64);
    };
    reader.readAsDataURL(file);
  }

  function getInitials(name) {
    const parts = name.trim().split(' ');
    return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0]).toUpperCase();
  }

  if (!currentUser) return null;

  const maskedPhone = currentUser.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2');

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar-wrap" onClick={() => fileRef.current.click()} title="Change photo">
          {photo
            ? <img src={photo} alt="profile" className="profile-photo" />
            : <div className="profile-initials">{getInitials(currentUser.name)}</div>
          }
          <div className="profile-camera-overlay"><Camera size={18} /></div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
        </div>

        <h2 className="profile-name">{currentUser.name}</h2>
        <p className="profile-roll">{currentUser.rollNo === 0 ? 'Outsider Account' : `Class 10th HI · Roll No. ${currentUser.rollNo}`}</p>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          {currentUser.role === ROLES.ADMIN && <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}><ShieldAlert size={14} style={{ marginRight: 4 }} /> ADMIN</span>}
          {currentUser.role === ROLES.MONITOR && <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}><ShieldCheck size={14} style={{ marginRight: 4 }} /> MONITOR</span>}
          {currentUser.role === ROLES.STUDENT && <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}><UserIcon size={14} style={{ marginRight: 4 }} /> STUDENT</span>}
          {currentUser.role === ROLES.OUTSIDER && <span className="badge" style={{ background: 'rgba(168, 162, 158, 0.1)', color: '#a8a29e', border: '1px solid rgba(168, 162, 158, 0.3)' }}><Users size={14} style={{ marginRight: 4 }} /> OUTSIDER</span>}
        </div>

        <div className="profile-info-grid">
          <div className="profile-info-item">
            <span className="profile-info-label">Login ID (Phone)</span>
            <span className="profile-info-value">{maskedPhone}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">{currentUser.rollNo === 0 ? 'Account Type' : 'Roll Number'}</span>
            <span className="profile-info-value">{currentUser.rollNo === 0 ? 'Outsider' : currentUser.rollNo}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Registered</span>
            <span className="profile-info-value">{new Date(currentUser.createdAt).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        <p className="profile-photo-hint">Tap the photo to change it. Stored on this device only.</p>

        {currentUser.role === ROLES.ADMIN && (
          <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid var(--border)', textAlign: 'left' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Tools — Onboarding</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
              Tours run on the dashboard. You'll be taken there first.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="auth-btn secondary"
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                onClick={() => { triggerTour(ROLES.STUDENT); navigate('/'); }}>
                Test Student Tour
              </button>
              <button
                className="auth-btn secondary"
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                onClick={() => { triggerTour(ROLES.MONITOR); navigate('/'); }}>
                Test Monitor Tour
              </button>
            </div>
            <button
              className="auth-btn secondary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.85rem' }}
              onClick={() => {
                localStorage.removeItem(`onboarding_done_${currentUser.phone}`);
                alert('Onboarding reset. Refresh the page to trigger it again.');
              }}>
              Reset Onboarding (for testing)
            </button>
          </div>
        )}

        <button className="auth-btn secondary profile-logout" style={{ marginTop: '2rem' }} onClick={() => { logout(); navigate('/'); }}>
          Logout
        </button>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1.5rem' }}>
          App Version: v{packageJson.version}
        </p>
      </div>

      <div className="profile-classinfo-wrap">
        <button
          className="class-info-toggle"
          onClick={() => setShowClassInfo((v) => !v)}
          aria-expanded={showClassInfo}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} /> Class Info — routine, monitors & student register
          </span>
          {showClassInfo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showClassInfo && (
          <div style={{ marginTop: '1.5rem' }}>
            <ClassInfo />
          </div>
        )}
      </div>

    </div>
  );
}
