import { useState, useEffect, useMemo } from 'react';
import { X, Play, Users, Clock, Hash, Shield, BookOpen, AlertCircle } from 'lucide-react';
import { getAllTests } from '../../services/starBatchTestService';

export default function QuizSetupModal({ onClose, onStart, onlineMembers, currentCoHosts }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Selections
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [quizMode, setQuizMode] = useState('all'); // 'all' or 'fastest'
  const [selectedCoHosts, setSelectedCoHosts] = useState(currentCoHosts || []);

  useEffect(() => {
    getAllTests().then(data => {
      setTests(data);
      setLoading(false);
    });
  }, []);

  // Extract unique subjects
  const subjects = useMemo(() => {
    const subs = new Set(tests.map(t => t.sectionId || t.subjectId));
    return Array.from(subs).filter(Boolean).sort();
  }, [tests]);

  // Filter tests by selected subject
  const filteredTests = useMemo(() => {
    if (!selectedSubject) return [];
    return tests.filter(t => (t.sectionId || t.subjectId) === selectedSubject);
  }, [tests, selectedSubject]);

  // Reset chapter selection if subject changes
  useEffect(() => {
    setSelectedTestId('');
  }, [selectedSubject]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedSubject) {
      setErrorMsg('Please select a subject first.');
      return;
    }
    if (!selectedTestId) {
      setErrorMsg('Please select a chapter/test.');
      return;
    }
    
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
      setErrorMsg('No questions available in this chapter. Please select a different one.');
      return;
    }

    onStart({
      quizId: Date.now().toString(),
      testId: test.id,
      chapterId: test.chapterId,
      chapterTitle: test.title,
      subject: selectedSubject,
      questions: selectedQuestions,
      quizMode,
      timePerQuestion,
      currentQuestionIndex: 0,
      status: 'reading',
      questionStartedAt: null,
      coHostPhones: selectedCoHosts
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
          
          {/* 1. Assign Co-Hosts */}
          <div style={styles.field}>
            <label style={styles.label}>
              <Shield size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Assign Co-Hosts
            </label>
            <div style={styles.checkboxGroup}>
              {onlineMembers.map(m => (
                <label key={m.phone} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedCoHosts.includes(m.phone)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCoHosts([...selectedCoHosts, m.phone]);
                      } else {
                        setSelectedCoHosts(selectedCoHosts.filter(p => p !== m.phone));
                      }
                    }}
                  />
                  {m.name}
                </label>
              ))}
              {onlineMembers.length === 0 && (
                <span style={styles.hint}>No other members online.</span>
              )}
            </div>
            <span style={styles.hint}>Co-hosts will take over if you disconnect.</span>
          </div>

          {/* 2a. Select Subject */}
          <div style={styles.field}>
            <label style={styles.label}>
              <BookOpen size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Subject
            </label>
            <select 
              style={styles.select} 
              value={selectedSubject} 
              onChange={e => setSelectedSubject(e.target.value)}
              required
            >
              <option value="">-- Select Subject --</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 2b. Select Chapter */}
          <div style={styles.field}>
            <label style={styles.label}>
              <Hash size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Chapter
            </label>
            <select 
              style={styles.select} 
              value={selectedTestId} 
              onChange={e => {
                setSelectedTestId(e.target.value);
                setErrorMsg('');
              }}
              required
              disabled={!selectedSubject}
            >
              <option value="">-- Select Chapter --</option>
              {filteredTests.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
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

          {errorMsg && (
            <div style={styles.errorBox} className="animate-fade-in">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

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
    borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 520,
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
    padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' },
  select: {
    background: 'var(--surface-hover)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    padding: '0.55rem 0.85rem', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
    cursor: 'pointer'
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
  modeDesc: { fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    background: 'var(--surface-hover)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.55rem 0.85rem',
    maxHeight: '120px',
    overflowY: 'auto'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    padding: '0.75rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    fontWeight: 500
  }
};
