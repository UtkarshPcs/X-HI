import { useState, useEffect } from 'react';
import { X, Play, Users, Clock, Hash, Shield } from 'lucide-react';
import { getAllTests } from '../../services/starBatchTestService';

export default function QuizSetupModal({ onClose, onStart, onlineMembers, currentCoHost }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selections
  const [selectedTestId, setSelectedTestId] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [quizMode, setQuizMode] = useState('all'); // 'all' or 'fastest'
  const [selectedCoHost, setSelectedCoHost] = useState(currentCoHost || '');

  useEffect(() => {
    getAllTests().then(data => {
      setTests(data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTestId) return alert('Please select a chapter/test.');
    if (!selectedCoHost) return alert('You must assign a Co-Host before starting the quiz.');
    
    const test = tests.find(t => t.id === selectedTestId);
    if (!test) return;

    // Randomly select questions up to totalQuestions
    let availableQuestions = test.questions.filter(q => !q.isDeleted);
    // Shuffle
    for (let i = availableQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
    }
    const selectedQuestions = availableQuestions.slice(0, totalQuestions);

    if (selectedQuestions.length === 0) {
      return alert('No questions available in this chapter.');
    }

    onStart({
      testId: test.id,
      chapterId: test.chapterId,
      questions: selectedQuestions,
      quizMode,
      timePerQuestion,
      currentQuestionIndex: 0,
      status: 'reading',
      questionStartedAt: null,
      coHostPhone: selectedCoHost
    });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()} className="spring-up">
        
        <div style={styles.header}>
          <div style={styles.headerIcon}>
            <Play size={20} color="var(--primary)" />
          </div>
          <div>
            <h2 style={styles.title}>Start Live Quiz</h2>
            <p style={styles.subtitle}>Configure quiz settings and assign a co-host.</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          
          {/* 1. Assign Co-Host */}
          <div style={styles.field}>
            <label style={styles.label}>
              <Shield size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Assign Co-Host <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select 
              style={styles.select} 
              value={selectedCoHost} 
              onChange={e => setSelectedCoHost(e.target.value)}
              required
            >
              <option value="">-- Select a Co-Host --</option>
              {onlineMembers.map(m => (
                <option key={m.phone} value={m.phone}>{m.name}</option>
              ))}
            </select>
            <span style={styles.hint}>Co-host will take over if you disconnect.</span>
          </div>

          {/* 2. Select Test/Chapter */}
          <div style={styles.field}>
            <label style={styles.label}>
              <Hash size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Select Chapter
            </label>
            <select 
              style={styles.select} 
              value={selectedTestId} 
              onChange={e => setSelectedTestId(e.target.value)}
              required
            >
              <option value="">-- Select Chapter --</option>
              {tests.map(t => (
                <option key={t.id} value={t.id}>{t.title} ({t.sectionId})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* 3. Total Questions */}
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Total Questions</label>
              <input 
                type="number" 
                style={styles.input} 
                min="1" max="50" 
                value={totalQuestions} 
                onChange={e => setTotalQuestions(Number(e.target.value))} 
              />
            </div>

            {/* 4. Time Per Question */}
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>
                <Clock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Time Limit
              </label>
              <select style={styles.select} value={timePerQuestion} onChange={e => setTimePerQuestion(Number(e.target.value))}>
                <option value={30}>30 Seconds</option>
                <option value={60}>60 Seconds</option>
                <option value={90}>90 Seconds</option>
                <option value={120}>120 Seconds</option>
              </select>
            </div>
          </div>

          {/* 5. Mode */}
          <div style={styles.field}>
            <label style={styles.label}>
              <Users size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Quiz Mode
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setQuizMode('all')}
                style={{
                  ...styles.modeBtn,
                  ...(quizMode === 'all' ? styles.modeBtnActive : {})
                }}
              >
                All Players
                <span style={styles.modeDesc}>Everyone can answer.</span>
              </button>
              <button
                type="button"
                onClick={() => setQuizMode('fastest')}
                style={{
                  ...styles.modeBtn,
                  ...(quizMode === 'fastest' ? styles.modeBtnActive : {})
                }}
              >
                Fastest Finger First
                <span style={styles.modeDesc}>Only the first to answer locks it.</span>
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn primary" style={{ padding: '0.8rem', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Loading tests...' : 'Start Live Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
  },
  modal: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 480,
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
    padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid var(--border)',
  },
  headerIcon: {
    flexShrink: 0, width: 40, height: 40, borderRadius: 'var(--radius-sm)',
    background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontFamily: 'Outfit, sans-serif', fontSize: '1.05rem', fontWeight: 700,
    color: 'var(--text-primary)', margin: 0,
  },
  subtitle: {
    fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem',
  },
  closeBtn: {
    marginLeft: 'auto', flexShrink: 0, background: 'none', border: 'none',
    cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem',
  },
  form: {
    padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' },
  select: {
    background: 'var(--surface-hover)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    padding: '0.55rem 0.85rem', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
  },
  input: {
    background: 'var(--surface-hover)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    padding: '0.55rem 0.85rem', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
  },
  hint: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  modeBtn: {
    flex: 1, background: 'var(--surface-hover)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0.75rem', color: 'var(--text-primary)',
    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
    textAlign: 'center', transition: 'all 0.2s'
  },
  modeBtnActive: {
    background: 'rgba(251,191,36,0.1)', borderColor: '#fbbf24', color: '#fbbf24'
  },
  modeDesc: { fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }
};
