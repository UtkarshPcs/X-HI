import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getPeriodicTestsMeta, getUserPeriodicAttempts } from '../services/periodicPredictedService';
import { Loader2, ArrowLeft, Target, BarChart2, BookOpen, Clock, CalendarDays, ChevronRight } from 'lucide-react';

const SUBJECTS = ['Science', 'Maths', 'SST', 'English', 'Hindi', 'IT'];

export default function PeriodicPredictedAnalysisPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'report'
  const [meta, setMeta] = useState(null);
  const [attempts, setAttempts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    let active = true;
    Promise.all([
      getPeriodicTestsMeta(),
      getUserPeriodicAttempts(currentUser.id || currentUser.phone)
    ])
      .then(([m, a]) => {
        if (active) {
          setMeta(m);
          setAttempts(a);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (active) {
          setError(err.message || 'Failed to load data. Please check your connection or permissions.');
          setLoading(false);
        }
      });

    return () => { active = false; };
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'rgba(255,255,255,0.5)' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        Loading Analysis Data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: '#ef4444' }}>
        <h3 style={{ margin: '0 0 0.5rem' }}>Error Loading Data</h3>
        <p style={{ fontSize: '0.9rem', color: 'rgba(239, 68, 68, 0.8)' }}>{error}</p>
        <button onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  // Calculate highest attempted set per subject
  const maxAttemptedSets = {};
  SUBJECTS.forEach(sub => { maxAttemptedSets[sub] = 0; });
  
  (attempts || []).forEach(a => {
    if (a.setNumber > (maxAttemptedSets[a.subject] || 0)) {
      maxAttemptedSets[a.subject] = a.setNumber;
    }
  });

  return (
    <div className="animate-fade-in fade-in-up" style={{ paddingBottom: '4rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={22} color="#f59e0b" />
            Periodic Predicted Analysis
          </h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            25-min mock tests to predict your performance.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '12px' }}>
        <button
          onClick={() => setActiveTab('tests')}
          style={{
            flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
            background: activeTab === 'tests' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'tests' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          Tests
        </button>
        <button
          onClick={() => setActiveTab('report')}
          style={{
            flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
            background: activeTab === 'report' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'report' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          Report Card
        </button>
      </div>

      {activeTab === 'tests' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {SUBJECTS.map(sub => {
            const adminMax = meta[sub] || 0;
            const userMax = maxAttemptedSets[sub] || 0;
            
            let btnText = 'No test available';
            let targetSet = null;
            let canTake = false;
            let isRetake = false;

            if (adminMax > 0) {
              if (userMax < adminMax) {
                targetSet = userMax + 1;
                btnText = `Give Set ${targetSet} Test`;
                canTake = true;
              } else {
                targetSet = adminMax;
                btnText = `Retake Set ${targetSet}`;
                canTake = true;
                isRetake = true;
              }
            }

            return (
              <div key={sub} className="glass-card glow-hover" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>{sub}</h3>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {adminMax} Set{adminMax !== 1 ? 's' : ''} Available
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  disabled={!canTake}
                  onClick={() => canTake && navigate(`/periodic-predicted/test/${sub}/${targetSet}`)}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: canTake ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                    background: canTake ? (isRetake ? 'rgba(255,255,255,0.05)' : 'rgba(245, 158, 11, 0.15)') : 'rgba(255,255,255,0.03)',
                    color: canTake ? (isRetake ? 'var(--text-secondary)' : '#f59e0b') : 'var(--text-muted)',
                    border: canTake && isRetake ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                  }}
                >
                  {btnText} {canTake && !isRetake && <ChevronRight size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'report' && (
        <ReportCardTab attempts={attempts || []} />
      )}
    </div>
  );
}

function ReportCardTab({ attempts }) {
  if (attempts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <BarChart2 size={32} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>No Tests Given Yet</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Take a test from the Tests tab to see your report card.</p>
      </div>
    );
  }

  // Calculate overall average
  const totalScore = attempts.reduce((acc, curr) => acc + curr.score, 0);
  const totalMax = attempts.reduce((acc, curr) => acc + curr.total, 0);
  const overallAvg = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={20} color="#10b981" /> Overall Average
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Across all {attempts.length} test attempts
          </p>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
          {overallAvg}%
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', padding: '0 0.5rem' }}>Attempt History</h3>
        
        {attempts.map(a => {
          const pct = Math.round((a.score / a.total) * 100);
          const date = new Date(a.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          const time = new Date(a.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          
          return (
            <div key={a.id} className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{a.score}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {a.total}</span>
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.subject} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>— Set {a.setNumber}</span>
                  </h4>
                  <span style={{ fontWeight: 700, color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444', fontSize: '0.9rem' }}>
                    {pct}%
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CalendarDays size={12} /> {date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} /> {time}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
