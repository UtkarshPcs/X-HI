import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getPeriodicTest, submitPeriodicAttempt } from '../services/periodicPredictedService';
import { Loader2, ArrowLeft, Clock } from 'lucide-react';
import PeriodicTestAnalyticsDashboard from '../components/PeriodicTestAnalyticsDashboard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const TEST_DURATION = 25 * 60; // 25 minutes in seconds

export default function PeriodicPredictedTestPlayerPage() {
  const { subject, setNumber } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [questionTimes, setQuestionTimes] = useState({});

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Prevent accidental navigation
  useEffect(() => {
    if (result || loading || error) return;
    
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [result, loading, error]);

  const handleBackClick = () => {
    if (result) {
      navigate('/periodic-predicted');
    } else {
      if (window.confirm("Are you sure you want to quit the Test? Your progress won't be saved.")) {
        navigate('/periodic-predicted');
      }
    }
  };

  // Timer logic
  useEffect(() => {
    if (test && !result && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
        setQuestionTimes(prev => ({
          ...prev,
          [currentQuestionIndex]: (prev[currentQuestionIndex] || 0) + 1
        }));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [test, result, currentQuestionIndex, timeLeft]);

  useEffect(() => {
    if (!currentUser) navigate('/');
    else fetchTest();
  }, [subject, setNumber, currentUser, navigate]);

  async function fetchTest() {
    setLoading(true);
    try {
      const data = await getPeriodicTest(subject, parseInt(setNumber));
      
      const shuffle = (array) => {
        let arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };

      const allQuestions = data.questions.map((q, idx) => ({ ...q, originalIndex: idx })).filter(q => !q.isDeleted);
      const shuffledQuestions = shuffle(allQuestions).slice(0, 20); // enforce max 20 just in case

      setTest(data);
      setActiveQuestions(shuffledQuestions);
    } catch (e) {
      setError('Test not found or access denied.');
    } finally {
      setLoading(false);
    }
  }

  function handleOptionSelect(qIndex, optIndex) {
    if (result) return;
    setAnswers(prev => {
      const newAnswers = { ...prev };
      if (newAnswers[qIndex] === optIndex) {
        delete newAnswers[qIndex];
      } else {
        newAnswers[qIndex] = optIndex;
      }
      return newAnswers;
    });
  }

  async function handleSubmit(autoSubmit = false) {
    if (!autoSubmit && !window.confirm('Are you sure you want to submit?')) return;
    
    setIsSubmitting(true);
    let score = 0;
    const weakTopics = [];
    const difficultyStats = { Easy: { correct: 0, total: 0 }, Medium: { correct: 0, total: 0 }, Hard: { correct: 0, total: 0 } };
    const topicStats = {};

    activeQuestions.forEach((q, index) => {
      const isCorrect = answers[index] === q.correctOptionIndex;
      if (isCorrect) score += 1;
      else if (q.topic) weakTopics.push(q.topic);
      
      const diff = q.difficulty || 'Medium';
      if (!difficultyStats[diff]) difficultyStats[diff] = { correct: 0, total: 0 };
      difficultyStats[diff].total += 1;
      if (isCorrect) difficultyStats[diff].correct += 1;

      const top = q.topic || 'General';
      if (!topicStats[top]) topicStats[top] = { correct: 0, total: 0 };
      topicStats[top].total += 1;
      if (isCorrect) topicStats[top].correct += 1;
    });

    const wrongIndices = activeQuestions
      .filter((q, index) => answers[index] !== q.correctOptionIndex)
      .map(q => q.originalIndex);

    const timeConsumed = TEST_DURATION - timeLeft;

    try {
      await submitPeriodicAttempt(currentUser.id || currentUser.phone, {
        subject,
        setNumber: parseInt(setNumber),
        score,
        total: activeQuestions.length,
        responses: answers,
        wrongIndices,
        timeConsumed,
        questionTimes
      });

      setResult({ 
        score, 
        total: activeQuestions.length, 
        difficultyStats, 
        topicStats, 
        totalTime: timeConsumed, 
        questionTimes 
      });
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } catch (e) {
      alert('Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem 0', color: 'rgba(255,255,255,0.5)' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
      Loading Test...
    </div>
  );

  if (error || !test) return (
    <div style={{ textAlign: 'center', color: '#f87171', padding: '3rem' }}>{error}</div>
  );

  const timerColor = timeLeft < 300 ? '#ef4444' : '#fff'; // Red under 5 mins

  return (
    <div style={{ animation: 'fade-in 0.4s ease', paddingBottom: '6rem', maxWidth: '800px', margin: '0 auto' }}>
      <style>{`
        .tp-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .tp-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
        .tp-back:hover { background: rgba(255,255,255,0.1); }
        .tp-title { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        @media (min-width: 768px) { .tp-title { font-size: 1.5rem; } }
        
        .tp-q-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
        .tp-q-text { font-size: 1.1rem; color: #f1f5f9; line-height: 1.6; margin: 0 0 1.25rem; white-space: pre-wrap; word-break: break-word; }
        .custom-md table { display: block; overflow-x: auto; white-space: nowrap; max-width: 100%; border-collapse: collapse; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; }
        .custom-md th, .custom-md td { padding: 0.75rem 1rem; border: 1px solid rgba(255,255,255,0.1); }
        .custom-md th { background: rgba(255,255,255,0.05); font-weight: 700; color: #fbbf24; }
        .custom-md-opt p { margin: 0; padding: 0; display: inline-block; vertical-align: middle; }
        .katex-display { overflow-x: auto; overflow-y: hidden; padding-bottom: 0.5rem; }
        .katex { white-space: normal; }
        .tp-q-meta { font-size: 0.75rem; color: rgba(251,191,36,0.8); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 0.75rem; display: flex; gap: 0.75rem; }
        
        .tp-opt { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 0.75rem; cursor: pointer; transition: all 0.2s; }
        .tp-opt:hover:not(.disabled) { background: rgba(255,255,255,0.06); }
        .tp-opt.selected { background: rgba(251,191,36,0.1); border-color: rgba(251,191,36,0.4); }
        .tp-opt.disabled { cursor: default; }
        
        .tp-opt-circle { width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.5); }
        .tp-opt.selected .tp-opt-circle { border-color: #fbbf24; color: #fbbf24; }

        .tp-submit { width: 100%; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border: none; border-radius: 12px; padding: 1.1rem; color: #000; font-weight: 800; font-size: 1.1rem; cursor: pointer; transition: all 0.2s; margin-top: 1rem; display: flex; justify-content: center; align-items: center; gap: 0.5rem; }
        .tp-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(245,158,11,0.3); }
        .tp-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .tp-nav-btn { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.1rem; color: #fff; font-weight: 700; font-size: 1.05rem; cursor: pointer; transition: all 0.2s; display: flex; justify-content: center; align-items: center; }
        .tp-nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
        .tp-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .tp-nav-btn.primary { background: rgba(251,191,36,0.15); border-color: rgba(251,191,36,0.3); color: #fbbf24; }
        .tp-nav-btn.primary:hover:not(:disabled) { background: rgba(251,191,36,0.25); }
      `}</style>

      <div className="tp-header" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <button className="tp-back" onClick={handleBackClick}><ArrowLeft size={18} /></button>
          <h1 className="tp-title">{subject} (Set {setNumber})</h1>
        </div>
        {!result && test && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.75rem', borderRadius: '20px', color: timerColor, fontWeight: 700, flexShrink: 0, fontSize: '0.9rem' }}>
            <Clock size={14} /> {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {result ? (
        <PeriodicTestAnalyticsDashboard 
          result={result} 
          activeQuestions={activeQuestions} 
          answers={answers} 
        />
      ) : (
        <div style={{ animation: 'fade-in 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: 600 }}>
            <span>Question {currentQuestionIndex + 1} of {activeQuestions.length}</span>
            <span>{Object.keys(answers).length} / {activeQuestions.length} Answered</span>
          </div>
          
          <div className="tp-q-card">
            <div className="tp-q-meta">
              <span>Q{currentQuestionIndex + 1}</span>
            </div>
            <div className="tp-q-text markdown-body custom-md" style={{ marginBottom: '1.25rem' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {activeQuestions[currentQuestionIndex].text || activeQuestions[currentQuestionIndex].Question || activeQuestions[currentQuestionIndex].questionText || '*Question text missing*'}
              </ReactMarkdown>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activeQuestions[currentQuestionIndex].options.map((opt, optIndex) => {
                const isSelected = answers[currentQuestionIndex] === optIndex;
                let optClass = isSelected ? 'selected ' : '';
                return (
                  <div 
                    key={optIndex} 
                    className={`tp-opt ${optClass}`}
                    onClick={() => handleOptionSelect(currentQuestionIndex, optIndex)}
                  >
                    <div className="tp-opt-circle">
                      {String.fromCharCode(65 + optIndex)}
                    </div>
                    <span style={{ flex: 1, color: isSelected ? '#fff' : '#e2e8f0' }} className="markdown-body custom-md-opt">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {opt}
                      </ReactMarkdown>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button 
              className="tp-nav-btn" 
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)} 
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </button>
            
            {currentQuestionIndex < activeQuestions.length - 1 ? (
              <button 
                className="tp-nav-btn primary" 
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              >
                Next
              </button>
            ) : (
              <button 
                className="tp-submit" 
                onClick={() => handleSubmit(false)} 
                disabled={isSubmitting}
                style={{ flex: 1, marginTop: 0 }}
              >
                {isSubmitting ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : 'Submit Test'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
