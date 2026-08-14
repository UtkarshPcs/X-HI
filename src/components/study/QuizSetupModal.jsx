import { useState, useEffect, useMemo } from 'react';
import { X, Play, Users, Clock, Hash, Shield, BookOpen, AlertCircle, Layers, Star } from 'lucide-react';
import { getAllTests } from '../../services/starBatchTestService';
import { syllabusData } from '../../data/syllabusData';

export default function QuizSetupModal({ onClose, onStart, onlineMembers, currentCoHosts, askedQuestionIds = [] }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Selections
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  
  const [quizDifficulty, setQuizDifficulty] = useState('medium');
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

  // Extract available sets based on tests to prevent empty selections
  const { availableSections, availableSubjects, availableChapters } = useMemo(() => {
    const sections = new Set();
    const subjects = new Set();
    const chapters = new Set();

    tests.forEach(t => {
      if (t.sectionId) sections.add(t.sectionId);
      if (t.subjectId) subjects.add(t.subjectId);
      if (t.chapterId || t.id) chapters.add(t.chapterId || t.id);
    });

    return { availableSections: sections, availableSubjects: subjects, availableChapters: chapters };
  }, [tests]);

  // Derived options from syllabusData based on availability
  const sectionOptions = useMemo(() => {
    return syllabusData.filter(sec => availableSections.has(sec.sectionId));
  }, [availableSections]);

  const subjectOptions = useMemo(() => {
    if (!selectedSection) return [];
    const sec = syllabusData.find(s => s.sectionId === selectedSection);
    if (!sec) return [];
    return sec.subjects.filter(sub => availableSubjects.has(sub.subjectId));
  }, [selectedSection, availableSubjects]);

  const chapterOptions = useMemo(() => {
    if (!selectedSubject) return [];
    const sec = syllabusData.find(s => s.sectionId === selectedSection);
    const sub = sec?.subjects.find(s => s.subjectId === selectedSubject);
    if (!sub) return [];
    return sub.chapters.filter(ch => availableChapters.has(ch.chapterId));
  }, [selectedSection, selectedSubject, availableChapters]);

  // Reset cascade
  useEffect(() => { setSelectedSubject(''); setSelectedChapter(''); }, [selectedSection]);
  useEffect(() => { setSelectedChapter(''); }, [selectedSubject]);

  // Compute how many fresh questions are left per difficulty for the selected chapter
  const difficultyCounts = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0, difficult: 0 };
    if (!selectedChapter) return counts;
    const matchingTests = tests.filter(t => (t.chapterId || t.id) === selectedChapter);
    if (matchingTests.length === 0) return counts;

    let allQuestions = (matchingTests[0].questions || []).map((q, idx) => ({ ...q, originalIndex: idx })).filter(q => !q.isDeleted);
    let freshQuestions = allQuestions.filter(q => !askedQuestionIds.includes(q.originalIndex));

    freshQuestions.forEach(q => {
      const d = (q.difficulty || 'Medium').toLowerCase();
      if (d === 'easy') counts.easy++;
      else if (d === 'hard') counts.hard++;
      else if (d === 'super hard' || d === 'difficult') counts.difficult++;
      else counts.medium++;
    });
    return counts;
  }, [selectedChapter, tests, askedQuestionIds]);

  const totalFresh = difficultyCounts.easy + difficultyCounts.medium + difficultyCounts.hard + difficultyCounts.difficult;
  const isExhausted = (diff) => totalFresh > 0 && difficultyCounts[diff] === 0;

  // Auto-switch difficulty if the current one is exhausted
  useEffect(() => {
    if (totalFresh > 0 && difficultyCounts[quizDifficulty] === 0) {
      if (difficultyCounts.medium > 0) setQuizDifficulty('medium');
      else if (difficultyCounts.easy > 0) setQuizDifficulty('easy');
      else if (difficultyCounts.hard > 0) setQuizDifficulty('hard');
      else if (difficultyCounts.difficult > 0) setQuizDifficulty('difficult');
    }
  }, [difficultyCounts, totalFresh, quizDifficulty]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedChapter) {
      setErrorMsg('Please select a chapter.');
      return;
    }
    
    const matchingTests = tests.filter(t => (t.chapterId || t.id) === selectedChapter);
    if (matchingTests.length === 0) {
       setErrorMsg('No tests found for this chapter.');
       return;
    }

    let allQuestions = (matchingTests[0].questions || []).map((q, idx) => ({ ...q, originalIndex: idx })).filter(q => !q.isDeleted);
    
    if (allQuestions.length === 0) {
      setErrorMsg('No valid questions available in this chapter.');
      return;
    }

    let targetDifficultyStr = 'Medium';
    if (quizDifficulty === 'easy') targetDifficultyStr = 'Easy';
    if (quizDifficulty === 'hard') targetDifficultyStr = 'Hard';
    if (quizDifficulty === 'difficult') targetDifficultyStr = 'Super Hard';

    let diffQuestions = allQuestions.filter(q => (q.difficulty || 'Medium') === targetDifficultyStr);
    
    // EXCLUDE previously asked questions
    let freshQuestions = diffQuestions.filter(q => !askedQuestionIds.includes(q.originalIndex));

    // If we don't have enough fresh questions of this difficulty, fall back to reusing asked ones
    if (freshQuestions.length < totalQuestions) {
       freshQuestions = diffQuestions;
    }

    // If STILL not enough, ignore difficulty and grab everything
    if (freshQuestions.length < totalQuestions) {
      freshQuestions = [...allQuestions].filter(q => !askedQuestionIds.includes(q.originalIndex));
      if (freshQuestions.length < totalQuestions) {
         freshQuestions = [...allQuestions];
      }
    }

    for (let i = freshQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [freshQuestions[i], freshQuestions[j]] = [freshQuestions[j], freshQuestions[i]];
    }

    const selectedQuestions = freshQuestions.slice(0, totalQuestions);
    const testTitle = chapterOptions.find(c => c.chapterId === selectedChapter)?.chapterName || 'Custom Quiz';

    onStart({
      quizId: Date.now().toString(),
      testId: matchingTests[0].id,
      chapterId: selectedChapter,
      chapterTitle: testTitle,
      subject: selectedSubject,
      difficulty: targetDifficultyStr,
      questions: selectedQuestions,
      quizMode,
      timePerQuestion: quizMode === 'dynamic' ? 180 : timePerQuestion,
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
                      if (e.target.checked) setSelectedCoHosts([...selectedCoHosts, m.phone]);
                      else setSelectedCoHosts(selectedCoHosts.filter(p => p !== m.phone));
                    }}
                  />
                  {m.name}
                </label>
              ))}
              {onlineMembers.length === 0 && <span style={styles.hint}>No other members online.</span>}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              <Layers size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Section
            </label>
            <select style={styles.select} value={selectedSection} onChange={e => setSelectedSection(e.target.value)} required>
              <option value="">-- Select Section --</option>
              {sectionOptions.map(s => <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>)}
            </select>
          </div>

          {selectedSection && (
            <div style={styles.field}>
              <label style={styles.label}>
                <BookOpen size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Subject
              </label>
              <select style={styles.select} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} required>
                <option value="">-- Select Subject --</option>
                {subjectOptions.map(s => <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>)}
              </select>
            </div>
          )}

          {selectedSubject && (
            <div style={styles.field}>
              <label style={styles.label}>
                <Hash size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Chapter
              </label>
              <select style={styles.select} value={selectedChapter} onChange={e => { setSelectedChapter(e.target.value); setErrorMsg(''); }} required>
                <option value="">-- Select Chapter --</option>
                {chapterOptions.map(c => <option key={c.chapterId} value={c.chapterId}>{c.chapterName}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            <div style={styles.field}>
              <label style={styles.label}><Star size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Difficulty</label>
              <select style={styles.select} value={quizDifficulty} onChange={e => setQuizDifficulty(e.target.value)}>
                <option value="easy" disabled={isExhausted('easy')}>Easy {isExhausted('easy') ? '(Exhausted)' : ''}</option>
                <option value="medium" disabled={isExhausted('medium')}>Medium {isExhausted('medium') ? '(Exhausted)' : ''}</option>
                <option value="hard" disabled={isExhausted('hard')}>Hard {isExhausted('hard') ? '(Exhausted)' : ''}</option>
                <option value="difficult" disabled={isExhausted('difficult')}>Super Hard {isExhausted('difficult') ? '(Exhausted)' : ''}</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Total Qs</label>
              <input type="number" style={styles.input} min="1" max="50" value={totalQuestions} onChange={e => setTotalQuestions(Number(e.target.value))} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}><Clock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Time Limit</label>
              <select style={styles.select} value={quizMode === 'dynamic' ? 180 : timePerQuestion} onChange={e => setTimePerQuestion(Number(e.target.value))} disabled={quizMode === 'dynamic'}>
                {quizMode === 'dynamic' && <option value={180}>180 Seconds (Dynamic)</option>}
                <option value={15}>15 Seconds</option>
                <option value={30}>30 Seconds</option>
                <option value={60}>60 Seconds</option>
                <option value={90}>90 Seconds</option>
                <option value={120}>120 Seconds</option>
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              <Users size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Quiz Mode
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setQuizMode('all')} style={{ ...styles.modeBtn, ...(quizMode === 'all' ? styles.modeBtnActive : {}) }}>
                All Players <span style={styles.modeDesc}>Everyone can answer.</span>
              </button>
              <button type="button" onClick={() => setQuizMode('fastest')} style={{ ...styles.modeBtn, ...(quizMode === 'fastest' ? styles.modeBtnActive : {}) }}>
                Fastest Finger First <span style={styles.modeDesc}>Only first answer locks.</span>
              </button>
              <button type="button" onClick={() => setQuizMode('dynamic')} style={{ ...styles.modeBtn, ...(quizMode === 'dynamic' ? styles.modeBtnActive : {}) }}>
                Dynamic Pace <span style={styles.modeDesc}>Adapts to majority speed.</span>
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
    display: 'flex', flexDirection: 'column', maxHeight: '90vh'
  },
  header: {
    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
    padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid var(--border)',
    flexShrink: 0
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
    overflowY: 'auto', flex: 1
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' },
  select: {
    background: 'var(--surface-hover)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    padding: '0.55rem 0.85rem', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
    cursor: 'pointer', minWidth: 0
  },
  input: {
    background: 'var(--surface-hover)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    padding: '0.55rem 0.85rem', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
    minWidth: 0
  },
  hint: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  modeBtn: {
    flex: 1, minWidth: '160px', background: 'var(--surface-hover)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0.75rem', color: 'var(--text-primary)',
    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
    textAlign: 'center', transition: 'all 0.2s'
  },
  modeBtnActive: {
    background: 'rgba(251,191,36,0.1)', borderColor: '#fbbf24', color: '#fbbf24'
  },
  modeDesc: { fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 },
  checkboxGroup: {
    display: 'flex', flexDirection: 'column', gap: '0.4rem',
    background: 'var(--surface-hover)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0.55rem 0.85rem',
    maxHeight: '120px', overflowY: 'auto'
  },
  checkboxLabel: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer'
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem', fontWeight: 500
  }
};
