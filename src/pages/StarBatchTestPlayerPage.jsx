import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getTestById, submitTestAttempt, getUserTestAttemptsForTest, getTestAverageScore } from '../services/starBatchTestService';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Sparkles, Target } from 'lucide-react';

export default function StarBatchTestPlayerPage() {
  const { testId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [averageScore, setAverageScore] = useState(null);

  useEffect(() => {
    if (!currentUser) navigate('/');
    else if (!currentUser.isStarBatch || !currentUser.hasUnlockedStarBatch) navigate('/star-batch');
    else fetchTest();
  }, [testId, currentUser, navigate]);

  async function fetchTest() {
    setLoading(true);
    try {
      const [data, attempts, avg] = await Promise.all([
        getTestById(testId),
        getUserTestAttemptsForTest(currentUser.id || currentUser.phone, testId),
        getTestAverageScore(testId)
      ]);
      setAverageScore(avg);
      
      let seenIndices = new Set();
      attempts.forEach(a => {
        (a.seenIndices || []).forEach(idx => seenIndices.add(idx));
      });

      const allIndices = data.questions.map((_, i) => i);
      let unseenIndices = allIndices.filter(i => !seenIndices.has(i));

      const shuffle = (array) => {
        let arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };

      unseenIndices = shuffle(unseenIndices);
      let selectedIndices = unseenIndices.slice(0, 10);

      // If we don't have 10 unseen, fill from seen
      if (selectedIndices.length < 10) {
        let seenArr = shuffle(Array.from(seenIndices));
        const needed = 10 - selectedIndices.length;
        selectedIndices = [...selectedIndices, ...seenArr.slice(0, needed)];
      }
      
      const questionsToShow = selectedIndices.map(idx => ({
        ...data.questions[idx],
        originalIndex: idx
      }));

      setTest(data);
      setActiveQuestions(questionsToShow);
    } catch (e) {
      setError('Test not found or access denied.');
    } finally {
      setLoading(false);
    }
  }

  function handleOptionSelect(qIndex, optIndex) {
    if (result) return; // Prevent changing answers after submission
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  }

  async function handleSubmit() {
    if (!window.confirm('Are you sure you want to submit?')) return;
    
    setIsSubmitting(true);
    let score = 0;
    const weakTopics = [];
    const wrongDifficulties = [];

    activeQuestions.forEach((q, index) => {
      if (answers[index] === q.correctOptionIndex) {
        score += 1;
      } else {
        if (q.topic) weakTopics.push(q.topic);
        if (q.difficulty) wrongDifficulties.push(q.difficulty);
      }
    });

    const seenIndices = activeQuestions.map(q => q.originalIndex);

    try {
      // 1. Fetch AI Review
      let aiReview = '';
      try {
        const res = await fetch('/api/ai-test-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score, total: activeQuestions.length, weakTopics, wrongDifficulties })
        });
        if (res.ok) {
          const data = await res.json();
          aiReview = data.review;
        }
      } catch (aiErr) {
        console.error('AI Review Failed', aiErr);
        aiReview = 'Great effort! Keep practicing to improve your weak areas.';
      }

      // 2. Save Attempt
      await submitTestAttempt({
        userId: currentUser.id || currentUser.phone,
        testId: test.id,
        chapterId: test.chapterId,
        score,
        total: activeQuestions.length,
        responses: answers,
        weakTopics: [...new Set(weakTopics)], // unique
        seenIndices,
        aiReview
      });

      setResult({ score, total: activeQuestions.length, aiReview });
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

  return (
    <div style={{ animation: 'fade-in 0.4s ease', paddingBottom: '6rem', maxWidth: '800px', margin: '0 auto' }}>
      <style>{`
        .tp-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .tp-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; transition: all 0.2s; }
        .tp-back:hover { background: rgba(255,255,255,0.1); }
        .tp-title { font-size: 1.5rem; font-weight: 800; color: #fff; margin: 0; }
        
        .tp-q-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
        .tp-q-text { font-size: 1.1rem; color: #f1f5f9; line-height: 1.6; margin: 0 0 1.25rem; white-space: pre-wrap; }
        .tp-q-meta { font-size: 0.75rem; color: rgba(251,191,36,0.8); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 0.75rem; display: flex; gap: 0.75rem; }
        
        .tp-opt { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 0.75rem; cursor: pointer; transition: all 0.2s; }
        .tp-opt:hover:not(.disabled) { background: rgba(255,255,255,0.06); }
        .tp-opt.selected { background: rgba(251,191,36,0.1); border-color: rgba(251,191,36,0.4); }
        .tp-opt.correct { background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.4); }
        .tp-opt.incorrect { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.4); }
        .tp-opt.disabled { cursor: default; }
        
        .tp-opt-circle { width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.5); }
        .tp-opt.selected .tp-opt-circle { border-color: #fbbf24; color: #fbbf24; }
        .tp-opt.correct .tp-opt-circle { border-color: #10b981; color: #10b981; background: #10b981; }
        .tp-opt.incorrect .tp-opt-circle { border-color: #ef4444; color: #ef4444; background: #ef4444; }

        .tp-submit { width: 100%; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border: none; border-radius: 12px; padding: 1.1rem; color: #000; font-weight: 800; font-size: 1.1rem; cursor: pointer; transition: all 0.2s; margin-top: 1rem; display: flex; justify-content: center; align-items: center; gap: 0.5rem; }
        .tp-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(245,158,11,0.3); }
        .tp-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .tp-result-card { background: linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.05) 100%); border: 1px solid rgba(251,191,36,0.3); border-radius: 20px; padding: 2rem; margin-bottom: 2rem; text-align: center; }
        .tp-score { font-size: 4rem; font-weight: 900; color: #fbbf24; line-height: 1; margin: 1rem 0; }
        .tp-ai-review { background: rgba(0,0,0,0.3); border-radius: 12px; padding: 1.5rem; text-align: left; margin-top: 1.5rem; font-size: 1rem; line-height: 1.6; color: #e2e8f0; display: flex; flex-direction: column; gap: 0.5rem; }
      `}</style>

      <div className="tp-header">
        <button className="tp-back" onClick={() => navigate('/star-tests')}><ArrowLeft size={20} /></button>
        <h1 className="tp-title">{test.title}</h1>
      </div>

      {result && (
        <div style={{ animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)', marginBottom: '2rem' }}>
          <div className="tp-result-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <Target size={40} color="#fbbf24" style={{ margin: '0 auto' }} />
            <h2 style={{ margin: 0, color: '#fff' }}>Test Completed!</h2>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Score</div>
                <div className="tp-score">{result.score} <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.4)' }}>/ {result.total}</span></div>
              </div>
              
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Percentage</div>
                <div className="tp-score" style={{ color: '#10b981' }}>{Math.round((result.score / result.total) * 100)}%</div>
              </div>

              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Peer Average</div>
                <div className="tp-score" style={{ color: '#38bdf8' }}>{averageScore !== null ? `${Math.round(averageScore)}%` : 'N/A'}</div>
              </div>
            </div>
          </div>
          
          <div className="tp-result-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 800, fontSize: '1.2rem', marginBottom: '1rem', justifyContent: 'center' }}>
              <Sparkles size={20} /> AI Coach Insights
            </div>
            <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: 1.6, color: '#f1f5f9', textAlign: 'left' }}>
              {result.aiReview}
            </p>
          </div>
        </div>
      )}

      <div>
        {activeQuestions.map((q, qIndex) => {
          return (
            <div key={qIndex} className="tp-q-card">
              <div className="tp-q-meta">
                <span>Q{qIndex + 1}</span>
                {q.difficulty && <span>• {q.difficulty}</span>}
                {q.topic && <span>• {q.topic}</span>}
              </div>
              <p className="tp-q-text">{q.text}</p>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {q.options.map((opt, optIndex) => {
                  const isSelected = answers[qIndex] === optIndex;
                  const isCorrectOption = q.correctOptionIndex === optIndex;
                  
                  let optClass = '';
                  if (result) {
                    optClass = 'disabled ';
                    if (isCorrectOption) optClass += 'correct ';
                    else if (isSelected) optClass += 'incorrect ';
                  } else {
                    if (isSelected) optClass += 'selected ';
                  }

                  return (
                    <div 
                      key={optIndex} 
                      className={`tp-opt ${optClass}`}
                      onClick={() => handleOptionSelect(qIndex, optIndex)}
                    >
                      <div className="tp-opt-circle">
                        {result && isCorrectOption ? <CheckCircle size={16} color="#fff" /> : result && isSelected && !isCorrectOption ? <XCircle size={16} color="#fff" /> : String.fromCharCode(65 + optIndex)}
                      </div>
                      <span style={{ flex: 1, color: isSelected || (result && isCorrectOption) ? '#fff' : '#e2e8f0' }}>{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!result && (
        <button 
          className="tp-submit" 
          onClick={handleSubmit} 
          disabled={isSubmitting || Object.keys(answers).length < activeQuestions.length}
        >
          {isSubmitting ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : 'Submit Test'}
        </button>
      )}
    </div>
  );
}
