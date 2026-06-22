import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../auth/roles';
import { resetWhatsNew } from '../auth/authService';
import { ShieldAlert } from 'lucide-react';

export default function AdminServicesPage() {
  const { currentUser, triggerTour } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || currentUser.role !== ROLES.ADMIN) navigate('/');
  }, [currentUser, navigate]);

  if (!currentUser || currentUser.role !== ROLES.ADMIN) return null;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <ShieldAlert size={22} color="#ef4444" />
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Admin Services</h2>
        </div>

        <div style={{ textAlign: 'left' }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Onboarding
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
            Tours run on the dashboard. You'll be taken there first.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="auth-btn secondary"
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
              onClick={() => { triggerTour(ROLES.STUDENT); navigate('/'); }}
            >
              Test Student Tour
            </button>
            <button
              className="auth-btn secondary"
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
              onClick={() => { triggerTour(ROLES.MONITOR); navigate('/'); }}
            >
              Test Monitor Tour
            </button>
          </div>
          <button
            className="auth-btn secondary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.85rem' }}
            onClick={() => {
              localStorage.removeItem(`onboarding_done_${currentUser.phone}`);
              alert('Onboarding reset. Refresh the page to trigger it again.');
            }}
          >
            Reset Onboarding (for testing)
          </button>
          <button
            className="auth-btn secondary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.85rem' }}
            onClick={async () => {
              localStorage.removeItem(`whatsnew_v1_${currentUser.phone}`);
              try { await resetWhatsNew(currentUser.phone); } catch (e) { console.error(e); }
              window.location.href = '/';
            }}
          >
            Show "What's New" Again (for testing)
          </button>
        </div>
      </div>
    </div>
  );
}
