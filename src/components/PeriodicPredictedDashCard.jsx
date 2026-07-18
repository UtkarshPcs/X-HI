import { useNavigate } from 'react-router-dom';
import { ArrowRight, Target } from 'lucide-react';

export default function PeriodicPredictedDashCard() {
  const navigate = useNavigate();

  return (
    <div
      className="glass-card glow-hover"
      onClick={() => navigate('/periodic-predicted')}
      style={{ cursor: 'pointer', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(245, 158, 11, 0.05) 100%)',
        zIndex: 0, pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
        <h2 className="section-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0 }}>
          <Target size={20} color="#f59e0b" />
          <span>Periodic Predicted Analysis</span>
          <span className="dash-new-badge" style={{ background: '#f59e0b', color: '#fff', fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>NEW</span>
        </h2>
        <span className="auth-link" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0, color: '#f59e0b' }}>
          Take test <ArrowRight size={13} />
        </span>
      </div>
      <p style={{ position: 'relative', zIndex: 1, color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.6rem 0 0' }}>
        Practice highly anticipated questions with 25-minute mock tests. Available for all core subjects.
      </p>
    </div>
  );
}
