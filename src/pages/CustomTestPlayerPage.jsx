import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getCustomTestById, getUserCustomTestAttempts, submitCustomTestAttempt } from '../services/customTestService';
import { Loader2, AlertCircle, CheckCircle, XCircle, Clock, Timer, Target, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function CustomTestPlayerPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testData, setTestData] = useState(null);
  
  // Phase: 'init' | 'pre-test' | 'in-progress' | 'completed' | 'denied'
  const [phase, setPhase] = useState('init');
  
  // Public user info
  const [publicInfo, setPublicInfo] = useState({ name: '', class: '', school: '' });
  
  // Previous attempt info
  const [pastAttempt, setPastAttempt] = useState(null);
  
  // Test State
  const [responses, setResponses] = useState({}); // { questionIndex: selectedOptionIndex }
  const [timeRemaining, setTimeRemaining] = useState(null); // in seconds
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [score, setScore] = useState(0);
  
  const timerRef = useRef(null);
  const autoSubmitTriggered = useRef(false);

  useEffect(() => {
    async function loadTest() {
      try {
        const data = await getCustomTestById(testId);
        setTestData(data);
        
        if (data.isPrivate && !currentUser) {
          setPhase('denied');
          setLoading(false);
          return;
        }
        
        if (currentUser) {
          const attempts = await getUserCustomTestAttempts(testId, currentUser.id || currentUser.phone);
          if (attempts.length > 0) {
            setPastAttempt(attempts[0]);
            if (!data.allowMultipleAttempts) {
              setPhase('completed');
              setLoading(false);
              return;
            }
          }
        }
        
        setPhase('pre-test');
      } catch (err) {
        console.error(err);
        setError('Failed to load test or test does not exist.');
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [testId, currentUser]);

  useEffect(() => {
    if (phase === 'in-progress') {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        if (testData?.timer?.type === 'countdown') {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              if (!autoSubmitTriggered.current) {
                autoSubmitTriggered.current = true;
                handleSubmit(true); // Force submit
              }
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, testData]);

  const startTest = () => {
    if (!currentUser && testData.isPrivate) return;
    if (!currentUser && !testData.isPrivate) {
      if (!publicInfo.name || !publicInfo.school) {
        alert("Please enter Name and School to start.");
        return;
      }
    }
    if (testData?.timer?.type === 'countdown' && testData.timer.durationMinutes) {
      setTimeRemaining(testData.timer.durationMinutes * 60);
    }
    setPhase('in-progress');
  };

  const handleOptionSelect = (qIndex, optIndex) => {
    if (phase !== 'in-progress') return;
    setResponses(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!isAutoSubmit && !window.confirm("Are you sure you want to submit the test?")) return;
    
    clearInterval(timerRef.current);
    
    let calculatedScore = 0;
    testData.questions.forEach((q, i) => {
      if (responses[i] === q.correctOptionIndex) {
        calculatedScore += 1;
      }
    });
    
    setScore(calculatedScore);
    setPhase('completed');
    
    try {
      const attemptData = {
        testId,
        score: calculatedScore,
        total: testData.questions.length,
        responses,
        totalTime: elapsedTime,
      };
      if (currentUser) {
        attemptData.userId = currentUser.id || currentUser.phone;
      } else {
        attemptData.publicUser = publicInfo;
      }
      
      const newAttemptId = await submitCustomTestAttempt(attemptData);
      setPastAttempt({ ...attemptData, id: newAttemptId });
    } catch (err) {
      console.error("Failed to save attempt", err);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#fff' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem', color: '#10b981' }} />
      <div>Loading Test...</div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#ef4444' }}>
      <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
      <h2>{error}</h2>
    </div>
  );

  if (phase === 'denied') return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#fff' }}>
      <User size={48} style={{ margin: '0 auto 1rem', color: '#f59e0b' }} />
      <h2>This test is private</h2>
      <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>You must be logged in to take this test.</p>
      <button onClick={() => navigate('/')} style={{ padding: '0.8rem 1.5rem', background: '#10b981', color: '#000', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Go to Login</button>
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', color: '#fff' }}>
      
      {/* HEADER */}
      <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={24} /> {testData.title}
        </h1>
        {testData.description && <p style={{ margin: '0 0 1rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>{testData.description}</p>}
        {testData.syllabus && (
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', color: '#a1a1aa' }}>
            <strong style={{ color: '#d4d4d8' }}>Syllabus:</strong> {testData.syllabus}
          </div>
        )}
      </div>

      {phase === 'pre-test' && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
          
          {pastAttempt && (
            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', color: '#f59e0b' }}>
              You have previously taken this test. Past Score: <strong>{pastAttempt.score} / {pastAttempt.total}</strong>
            </div>
          )}

          {!currentUser && (
            <div style={{ maxWidth: '300px', margin: '0 auto 2rem', textAlign: 'left' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.3rem' }}>Your Name *</label>
                <input type="text" value={publicInfo.name} onChange={e => setPublicInfo({...publicInfo, name: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }} placeholder="Enter name" />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.3rem' }}>Class</label>
                <input type="text" value={publicInfo.class} onChange={e => setPublicInfo({...publicInfo, class: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }} placeholder="e.g. 10th" />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.3rem' }}>School *</label>
                <input type="text" value={publicInfo.school} onChange={e => setPublicInfo({...publicInfo, school: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }} placeholder="Enter school name" />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', color: '#a1a1aa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={18} /> {testData.questions.length} Questions</div>
            {testData.timer?.type === 'countdown' && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Timer size={18} /> {testData.timer.durationMinutes} Minutes</div>}
          </div>

          <button onClick={startTest} style={{ padding: '1rem 3rem', fontSize: '1.1rem', background: '#10b981', color: '#000', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            Start Test
          </button>
        </div>
      )}

      {phase === 'in-progress' && (
        <>
          {testData.timer?.type !== 'none' && (
            <div style={{ position: 'sticky', top: '10px', zIndex: 10, background: 'rgba(9,9,11,0.9)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', fontWeight: 600 }}>
                <Clock size={20} color={testData.timer?.type === 'countdown' && timeRemaining < 60 ? '#ef4444' : '#10b981'} />
                {testData.timer?.type === 'countdown' ? (
                  <span style={{ color: timeRemaining < 60 ? '#ef4444' : '#fff' }}>{formatTime(timeRemaining)}</span>
                ) : (
                  <span>{formatTime(elapsedTime)}</span>
                )}
              </div>
              <button onClick={() => handleSubmit(false)} style={{ padding: '0.5rem 1.5rem', background: '#3b82f6', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Submit</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {testData.questions.map((q, qIndex) => (
              <div key={qIndex} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontWeight: 700, color: '#10b981', fontSize: '1.1rem' }}>Q{qIndex + 1}.</div>
                  <div className="markdown-body" style={{ flex: 1, color: '#e2e8f0', fontSize: '1.05rem', lineHeight: 1.6 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{q.text}</ReactMarkdown>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {q.options.map((opt, optIndex) => {
                    const isSelected = responses[qIndex] === optIndex;
                    return (
                      <button 
                        key={optIndex}
                        onClick={() => handleOptionSelect(qIndex, optIndex)}
                        style={{ 
                          textAlign: 'left', padding: '1rem', borderRadius: '8px', 
                          background: isSelected ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.2)',
                          border: isSelected ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                          color: isSelected ? '#fff' : '#d4d4d8', cursor: 'pointer', transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', gap: '1rem'
                        }}
                      >
                        <div style={{ 
                          width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                          border: isSelected ? '6px solid #10b981' : '2px solid rgba(255,255,255,0.3)',
                          background: isSelected ? '#fff' : 'transparent'
                        }} />
                        <div className="markdown-body" style={{ margin: 0, padding: 0 }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{opt}</ReactMarkdown>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button onClick={() => handleSubmit(false)} style={{ padding: '1rem 4rem', fontSize: '1.1rem', background: '#10b981', color: '#000', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              Final Submit
            </button>
          </div>
        </>
      )}

      {phase === 'completed' && (
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '3rem 2rem' }}>
          <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '2rem', margin: '0 0 1rem', color: '#fff' }}>Test Completed</h2>
          
          <div style={{ fontSize: '1.2rem', color: '#a1a1aa', marginBottom: '2rem' }}>
            Your Score: <strong style={{ color: '#10b981', fontSize: '2rem', marginLeft: '0.5rem' }}>{pastAttempt?.score ?? score}</strong> / {testData.questions.length}
          </div>

          <button onClick={() => navigate('/')} style={{ padding: '0.8rem 2rem', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Go to Home
          </button>
        </div>
      )}
    </div>
  );
}
