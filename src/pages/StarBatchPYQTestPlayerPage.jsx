
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getPYQTestById, savePYQAttempt } from '../services/pyqPracticeService';
import { reportTestQuestion } from '../services/starBatchTestService';
import { addBookmark, removeBookmark, checkIsBookmarked } from '../services/starBatchBookmarkService';
import TermPracticeAnalyticsDashboard from '../components/TermPracticeAnalyticsDashboard';
import { Loader2, ArrowLeft, Clock, Target, CheckCircle, Edit3, AlertCircle, Bookmark, Flag, ChevronRight, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { formatMath } from '../utils/formatMath';
import DiagramRenderer from '../components/DiagramRenderer';

export default function StarBatchPYQTestPlayerPage() {
  const { testId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 'instruction' -> 'objective' -> 'subjective_write' -> 'subjective_eval' -> 'result'
  const [phase, setPhase] = useState('instruction');
  
  // Objective State
  const [objIndex, setObjIndex] = useState(0);
  const [objAnswers, setObjAnswers] = useState({});
  const [objDwellTimes, setObjDwellTimes] = useState({});
  const [objTimer, setObjTimer] = useState(0);
  const objIntervalRef = useRef(null);

  // Subjective State
  const [subjMarks, setSubjMarks] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0); // For CBSE paper countdown
  const subjIntervalRef = useRef(null);
  
  // Bookmarks & Reporting
  const [bookmarks, setBookmarks] = useState({});
  const [reporting, setReporting] = useState(false);
  const [reportedStatus, setReportedStatus] = useState({});

  // Result
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!currentUser) return navigate('/');
    async function loadTest() {
      try {
        const t = await getPYQTestById(testId);
        setTest(t);
        
        // Initialize bookmark status for all questions
        const bStatus = {};
        for (let q of t.questions) {
          bStatus[q.id] = await checkIsBookmarked(currentUser.id || currentUser.phone, q.id);
        }
        setBookmarks(bStatus);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [testId, currentUser, navigate]);

  const objQuestions = test?.questions.filter(q => q.type === 'objective') || [];
  const subjQuestions = test?.questions.filter(q => q.type !== 'objective') || [];

  const startTest = () => {
    if (test.mode === 'objective' || test.mode === 'mixed') {
      setPhase('objective');
      objIntervalRef.current = setInterval(() => setObjTimer(prev => prev + 1), 1000);
    } else {
      setPhase('subjective_write');
      const totalMins = test.questions.reduce((acc, q) => acc + (q.marks || 2), 0) * 1.5; // ~1.5 mins per mark
      setTimeRemaining(Math.max(totalMins * 60, 600)); // Min 10 mins
      subjIntervalRef.current = setInterval(() => setTimeRemaining(prev => Math.max(0, prev - 1)), 1000);
    }
  };

  const [objStartTime, setObjStartTime] = useState(Date.now());

  const handleObjNext = () => {
    const timeSpent = Math.floor((Date.now() - objStartTime) / 1000);
    const currentQId = objQuestions[objIndex].id;
    setObjDwellTimes(prev => ({ ...prev, [currentQId]: (prev[currentQId] || 0) + timeSpent }));
    setObjStartTime(Date.now());

    if (objIndex < objQuestions.length - 1) {
      setObjIndex(objIndex + 1);
    } else {
      finishObjective();
    }
  };

  const finishObjective = () => {
    clearInterval(objIntervalRef.current);
    if (test.mode === 'mixed') {
      if (!window.confirm("Submit Objective section and start Subjective paper?")) return;
      setPhase('subjective_write');
      const totalMins = subjQuestions.reduce((acc, q) => acc + (q.marks || 2), 0) * 1.5;
      setTimeRemaining(Math.max(totalMins * 60, 600));
      subjIntervalRef.current = setInterval(() => setTimeRemaining(prev => Math.max(0, prev - 1)), 1000);
    } else {
      if (!window.confirm("Submit Objective test?")) return;
      generateResult();
    }
  };

  const finishSubjectiveWrite = () => {
    if (!window.confirm("Are you sure you have finished writing all answers in your copy?")) return;
    clearInterval(subjIntervalRef.current);
    setPhase('subjective_eval');
  };

  const finishSubjectiveEval = () => {
    const allEval = subjQuestions.every(q => subjMarks[q.id] !== undefined);
    if (!allEval) {
      if (!window.confirm("You have un-evaluated questions. Finalize anyway?")) return;
    }
    generateResult();
  };

  const generateResult = async () => {
    setPhase('result');
    
    let objScore = 0;
    let objTotal = 0;
    const objDetails = [];
    
    objQuestions.forEach(q => {
      objTotal += (q.marks || 1);
      const isCorrect = objAnswers[q.id] === q.correct_option;
      if (isCorrect) objScore += (q.marks || 1);
      objDetails.push({ questionId: q.id, correct: isCorrect, timeSpent: objDwellTimes[q.id] || 0 });
    });

    let subjScore = 0;
    let subjTotal = 0;
    const subjDetails = [];

    subjQuestions.forEach(q => {
      subjTotal += (q.marks || 2);
      const m = subjMarks[q.id] || 0;
      subjScore += m;
      subjDetails.push({ questionId: q.id, marksAwarded: m, maxMarks: (q.marks || 2) });
    });

    const totalScore = objScore + subjScore;
    const maxScore = objTotal + subjTotal;

    const attemptData = {
      testId,
      chapterId: test.chapterId,
      score: totalScore,
      total: maxScore,
      objScore,
      objTotal,
      subjScore,
      subjTotal,
      mode: test.mode,
      difficulty: test.difficulty,
      createdAt: new Date().toISOString()
    };

    const resId = await savePYQAttempt(currentUser.id || currentUser.phone, attemptData);
    setResult({ ...attemptData, id: resId });
  };

  const toggleBookmark = async (q) => {
    const userId = currentUser.id || currentUser.phone;
    if (bookmarks[q.id]) {
      await removeBookmark(userId, q.id);
      setBookmarks(prev => ({ ...prev, [q.id]: false }));
    } else {
      await addBookmark(userId, {
        questionId: q.id,
        testId: test.id,
        testTitle: "PYQ Practice Test",
        chapterId: test.chapterId,
        questionText: q.question,
        options: q.options || {},
        correctOptionIndex: q.correct_option,
        difficulty: q.difficulty,
        type: q.type,
        marks: q.marks,
        solution: q.solution
      });
      setBookmarks(prev => ({ ...prev, [q.id]: true }));
    }
  };

  const reportQuestion = async (q) => {
    if (reportedStatus[q.id]) return;
    if (!window.confirm("Report this question as incorrect or out of syllabus?")) return;
    setReporting(true);
    try {
      await reportTestQuestion({
        testId: test.id,
        testTitle: "PYQ Practice Test",
        chapterId: test.chapterId,
        questionId: q.id,
        questionText: q.question,
        reporterId: currentUser.id || currentUser.phone
      });
      setReportedStatus(prev => ({ ...prev, [q.id]: true }));
    } catch(err) {
      console.error(err);
    }
    setReporting(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem 0', color: '#fff' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}/> Loading PYQ Test...</div>;
  if (error) return <div style={{ color: '#ef4444', textAlign: 'center', padding: '4rem 0' }}>{error}</div>;

  return (
    <div style={{ paddingBottom: '6rem' }}>
      <style>{`
        .tp-btn { background: #fbbf24; color: #000; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; alignItems: center; gap: 0.5rem; transition: 0.2s; }
        .tp-btn:hover { background: #f59e0b; transform: translateY(-2px); }
        .tp-btn-outline { background: transparent; color: #fbbf24; border: 1px solid #fbbf24; }
        .tp-btn-outline:hover { background: rgba(251,191,36,0.1); }
        
        .obj-opt { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1rem; cursor: pointer; display: flex; gap: 1rem; align-items: center; transition: 0.2s; color: #fff; }
        .obj-opt:hover { background: rgba(255,255,255,0.1); }
        .obj-opt.selected { background: rgba(59,130,246,0.2); border-color: #3b82f6; }
        .obj-opt-letter { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
        .obj-opt.selected .obj-opt-letter { background: #3b82f6; color: #fff; }

        .paper-container { background: #fdfbf7; color: #111; padding: 3rem 4rem; max-width: 900px; margin: 0 auto; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); font-family: 'Times New Roman', Times, serif; }
        @media print {
          body * { visibility: hidden; }
          .paper-container, .paper-container * { visibility: visible; }
          .paper-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0 !important; box-shadow: none !important; background: white !important; color: black !important; }
          button, .no-print { display: none !important; }
        }
        .cbse-header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 1rem; margin-bottom: 2rem; }
        .cbse-q { display: flex; gap: 1rem; margin-bottom: 1.5rem; font-size: 1.15rem; line-height: 1.5; page-break-inside: avoid; }
        
        .eval-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
        .mark-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); color: #fff; width: 40px; height: 40px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .mark-btn:hover { background: rgba(255,255,255,0.1); }
        .mark-btn.selected { background: #10b981; border-color: #10b981; color: #fff; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(10px)' }}>
        <button onClick={() => navigate('/star-pyq-practice')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ArrowLeft size={24}/></button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>PYQ Practice • {test.mode.toUpperCase()}</h2>
        </div>
        {phase === 'subjective_write' && (
          <>
            <button className="tp-btn tp-btn-outline no-print" onClick={() => window.print()}>Print PDF</button>
            <div style={{ color: timeRemaining < 300 ? '#ef4444' : '#fbbf24', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="no-print">
              <Clock size={20}/> 
              {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        {phase === 'instruction' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '3rem', textAlign: 'center', animation: 'fade-in 0.4s ease' }}>
            <Target size={64} color="#fbbf24" style={{ margin: '0 auto 1.5rem' }} />
            <h1 style={{ color: '#fff', fontSize: '2rem', marginBottom: '1rem' }}>Ready for PYQ Practice?</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
              {test.mode === 'objective' ? 'You will be presented with interactive MCQs. Try to answer them as quickly and accurately as possible.' : 
               test.mode === 'subjective' ? 'Please grab a pen and a notebook. You will write your answers offline and self-evaluate them afterward.' :
               'You will first take interactive MCQs, followed by a subjective written paper. Grab a pen and notebook for the second phase.'}
            </p>
            <button className="tp-btn" style={{ margin: '0 auto', fontSize: '1.2rem', padding: '1rem 3rem' }} onClick={startTest}>
              Start Practice
            </button>
          </div>
        )}

        {phase === 'objective' && (
          <div style={{ animation: 'fade-in 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Question {objIndex + 1} of {objQuestions.length}</span>
              <span><Clock size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> {Math.floor(objTimer/60)}:{String(objTimer%60).padStart(2,'0')}</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
                <button onClick={() => toggleBookmark(objQuestions[objIndex])} style={{ background: 'none', border: 'none', color: bookmarks[objQuestions[objIndex].id] ? '#fbbf24' : 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><Bookmark size={20} fill={bookmarks[objQuestions[objIndex].id] ? '#fbbf24' : 'none'} /></button>
                <button onClick={() => reportQuestion(objQuestions[objIndex])} style={{ background: 'none', border: 'none', color: reportedStatus[objQuestions[objIndex].id] ? '#ef4444' : 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><Flag size={20} fill={reportedStatus[objQuestions[objIndex].id] ? '#ef4444' : 'none'} /></button>
              </div>

              <div style={{ fontSize: '1.25rem', color: '#fff', lineHeight: 1.6, marginBottom: '2rem' }} className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatMath(objQuestions[objIndex].question)}</ReactMarkdown>
                {objQuestions[objIndex].diagram_url && <DiagramRenderer code={objQuestions[objIndex].diagram_url} />}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {['a', 'b', 'c', 'd'].map(opt => {
                  const optVal = objQuestions[objIndex][opt];
                  if (!optVal) return null;
                  const isSelected = objAnswers[objQuestions[objIndex].id] === opt;
                  return (
                    <div key={opt} className={`obj-opt \${isSelected ? 'selected' : ''}`} onClick={() => {
                      setObjAnswers(prev => ({ ...prev, [objQuestions[objIndex].id]: opt }));
                    }}>
                      <div className="obj-opt-letter">{opt.toUpperCase()}</div>
                      <div style={{ flex: 1 }} className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatMath(optVal)}</ReactMarkdown></div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="tp-btn" onClick={handleObjNext}>
                {objIndex < objQuestions.length - 1 ? <>Next <ChevronRight size={18}/></> : 'Finish Objective'}
              </button>
            </div>
          </div>
        )}

        {phase === 'subjective_write' && (
          <div style={{ animation: 'fade-in 0.5s ease' }}>
            <iframe width="0" height="0" src="https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&loop=1&playlist=5qap5aO4i9A" frameBorder="0" allow="autoplay" style={{ display: 'none' }}></iframe>
            
            <div className="paper-container">
              <div className="cbse-header">
                <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem' }}>PRACTICE EXAMINATION</h1>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  <span>Time Allowed: {test.mode === 'mixed' ? 'Continued' : 'Various'}</span>
                  <span>Maximum Marks: {subjQuestions.reduce((a, q) => a + (q.marks || 2), 0)}</span>
                </div>
              </div>
              <div style={{ marginBottom: '2rem', fontStyle: 'italic', fontSize: '1.1rem' }}>
                <strong>General Instructions:</strong>
                <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                  <li>This question paper contains {subjQuestions.length} questions.</li>
                  <li>Write your answers neatly in your notebook.</li>
                  <li>Marks are indicated against each question.</li>
                </ol>
              </div>

              {subjQuestions.map((q, idx) => (
                <div key={q.id} className="cbse-q">
                  <div style={{ fontWeight: 'bold', width: '30px' }}>{idx + 1}.</div>
                  <div style={{ flex: 1 }} className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatMath(q.question)}</ReactMarkdown>
                    {q.diagram_url && <DiagramRenderer code={q.diagram_url} />}
                  </div>
                  <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>[{q.marks || 2}]</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '3rem' }} className="no-print">
              <button className="tp-btn" style={{ margin: '0 auto', fontSize: '1.1rem' }} onClick={finishSubjectiveWrite}>
                <CheckCircle size={20}/> I have finished writing
              </button>
            </div>
          </div>
        )}

        {phase === 'subjective_eval' && (
          <div style={{ animation: 'fade-in 0.3s ease' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Edit3 size={32} color="#ef4444" />
              <div>
                <h3 style={{ margin: '0 0 0.5rem', color: '#ef4444', fontSize: '1.2rem' }}>Red Pen Time!</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>Be honest. Compare your written answers with the official marking scheme and award yourself marks.</p>
              </div>
            </div>

            {subjQuestions.map((q, idx) => {
              const maxM = q.marks || 2;
              const steps = [];
              for (let i = 0; i <= maxM; i += 0.5) steps.push(i);

              return (
                <div key={q.id} className="eval-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Q{idx + 1}</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => toggleBookmark(q)} style={{ background: 'none', border: 'none', color: bookmarks[q.id] ? '#fbbf24' : 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><Bookmark size={18} fill={bookmarks[q.id] ? '#fbbf24' : 'none'} /></button>
                      <button onClick={() => reportQuestion(q)} style={{ background: 'none', border: 'none', color: reportedStatus[q.id] ? '#ef4444' : 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><Flag size={18} fill={reportedStatus[q.id] ? '#ef4444' : 'none'} /></button>
                    </div>
                  </div>
                  
                  <div style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1rem' }} className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatMath(q.question)}</ReactMarkdown>
                  </div>

                  <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ color: '#10b981', fontWeight: 700, marginBottom: '0.5rem' }}>Official Marking Scheme</div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.95rem' }} className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatMath(q.solution || 'No solution provided.')}</ReactMarkdown>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Award Marks (out of {maxM})</div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {steps.map(step => (
                        <button 
                          key={step} 
                          className={`mark-btn \${subjMarks[q.id] === step ? 'selected' : ''}`}
                          onClick={() => setSubjMarks(prev => ({ ...prev, [q.id]: step }))}
                        >
                          {step}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button className="tp-btn" style={{ margin: '0 auto', fontSize: '1.1rem' }} onClick={finishSubjectiveEval}>
                <CheckCircle size={20}/> Finalize Score
              </button>
            </div>
          </div>
        )}

        {phase === 'result' && result && (
          <div style={{ animation: 'fade-in 0.5s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <Target size={64} color="#10b981" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ color: '#fff', fontSize: '2.5rem', margin: '0 0 0.5rem' }}>{result.score} / {result.total}</h2>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem' }}>Test Completed</div>
            </div>

            {/* Note: This component is from TermPractice and expects specific props. We pass a mock attempt format it understands, or adapt it. */}
            <TermPracticeAnalyticsDashboard 
              attempt={result} 
              test={test}
              questions={test.questions} 
              history={[]} 
            />
          </div>
        )}

      </div>
    </div>
  );
}
