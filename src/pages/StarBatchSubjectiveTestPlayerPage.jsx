import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getSubjectiveTestById, submitSubjectiveTestAttempt, getUserSubjectiveTestAttemptsForTest } from '../services/starBatchSubjectiveTestService';
import { reportTestQuestion } from '../services/starBatchTestService';
import { toggleBookmark, getUserBookmarks } from '../services/starBatchBookmarkService';
import SubjectiveTestAnalyticsDashboard from '../components/SubjectiveTestAnalyticsDashboard';
import DiagramRenderer from '../components/DiagramRenderer';
import { Loader2, ArrowLeft, Clock, Target, CheckCircle, Edit3, Save, AlertCircle, Bookmark, Flag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function StarBatchSubjectiveTestPlayerPage() {
  const { testId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const level = searchParams.get('level') || 'medium';
  const targetMarks = parseInt(searchParams.get('marks')) || 20;

  const [test, setTest] = useState(null);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [bookmarks, setBookmarks] = useState(new Set());
  const [reportedStatus, setReportedStatus] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [reporting, setReporting] = useState(false);

  // phases: 'INSTRUCTION', 'TEST', 'EVALUATION', 'RESULT'
  const [phase, setPhase] = useState('INSTRUCTION');
  
  const [quizTime, setQuizTime] = useState(0);
  const [evalIndex, setEvalIndex] = useState(0);
  const [evalMarks, setEvalMarks] = useState({}); // idx -> marks
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!currentUser) navigate('/');
    else if (currentUser.role !== 'ADMIN' && (!currentUser.isStarBatch || !currentUser.hasUnlockedStarBatch)) navigate('/star-batch');
    else fetchTest();
  }, [testId, currentUser, navigate]);

  useEffect(() => {
    let timer;
    if (phase === 'TEST') {
      timer = setInterval(() => setQuizTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [phase]);

  async function fetchTest() {
    setLoading(true);
    try {
      const data = await getSubjectiveTestById(testId);
      const userId = currentUser.id || currentUser.phone;
      
      const [history, userBookmarks] = await Promise.all([
        getUserSubjectiveTestAttemptsForTest(userId, testId),
        getUserBookmarks(userId)
      ]);
      
      const bSet = new Set(userBookmarks.filter(b => b.testId === testId).map(b => b.questionIndex));
      setBookmarks(bSet);

      let seenIndices = new Set();
      history.forEach(h => {
        if (h.seenIndices) h.seenIndices.forEach(idx => seenIndices.add(idx));
      });

      const qByMarks = { 1: [], 2: [], 3: [], 4: [], 5: [] };
      const allQByMarks = { 1: [], 2: [], 3: [], 4: [], 5: [] };
      
      data.questions.forEach((q, idx) => {
        if (!q.isDeleted && q.marks && allQByMarks[q.marks]) {
          const formattedQ = { ...q, originalIndex: idx };
          allQByMarks[q.marks].push(formattedQ);
          if (!seenIndices.has(idx)) {
            qByMarks[q.marks].push(formattedQ);
          }
        }
      });

      const multiplier = targetMarks === 40 ? 2 : 1;
      let reqCounts;
      if (allQByMarks[5].length >= 1 * multiplier) {
        reqCounts = { 1: 3 * multiplier, 2: 1 * multiplier, 3: 2 * multiplier, 4: 1 * multiplier, 5: 1 * multiplier };
      } else {
        reqCounts = { 1: 4 * multiplier, 2: 3 * multiplier, 3: 2 * multiplier, 4: 1 * multiplier, 5: 0 };
      }

      const diffPriority = {
        'easy': ['Easy', 'Medium', 'Hard', 'Super Difficult'],
        'medium': ['Medium', 'Easy', 'Hard', 'Super Difficult'],
        'hard': ['Hard', 'Medium', 'Super Difficult', 'Easy'],
        'difficult': ['Super Difficult', 'Hard', 'Medium', 'Easy']
      }[level] || ['Medium', 'Easy', 'Hard', 'Super Difficult'];

      const desiredTotal = 20 * multiplier;
      const findBestCombo = (buckets) => {
        let best = null;
        let minPen = Infinity;
        const maxC1 = Math.min(buckets[1].length, desiredTotal);
        for(let c1=0; c1<=maxC1; c1++) {
          const maxC2 = Math.min(buckets[2].length, Math.floor((desiredTotal - c1*1)/2));
          for(let c2=0; c2<=maxC2; c2++) {
            const maxC3 = Math.min(buckets[3].length, Math.floor((desiredTotal - c1*1 - c2*2)/3));
            for(let c3=0; c3<=maxC3; c3++) {
              const maxC4 = Math.min(buckets[4].length, Math.floor((desiredTotal - c1*1 - c2*2 - c3*3)/4));
              for(let c4=0; c4<=maxC4; c4++) {
                const rem = desiredTotal - c1*1 - c2*2 - c3*3 - c4*4;
                if (rem % 5 === 0) {
                  let c5 = rem / 5;
                  if (c5 <= buckets[5].length) {
                    let sec = (c1>0?1:0) + (c2>0?1:0) + (c3>0?1:0) + (c4>0?1:0) + (c5>0?1:0);
                    if (sec >= 3) {
                      let pen = Math.abs(c1 - reqCounts[1]) + Math.abs(c2 - reqCounts[2]) + Math.abs(c3 - reqCounts[3]) + Math.abs(c4 - reqCounts[4]) + Math.abs(c5 - reqCounts[5]);
                      if (pen < minPen) { minPen = pen; best = {1:c1, 2:c2, 3:c3, 4:c4, 5:c5}; }
                    }
                  }
                }
              }
            }
          }
        }
        return { best, minPen };
      };

      let res = findBestCombo(qByMarks);
      let isBankExhausted = false;
      let finalBuckets = qByMarks;
      
      if (!res.best || res.minPen > 0) {
          let resAll = findBestCombo(allQByMarks);
          if (resAll.best && resAll.minPen < (res.best ? res.minPen : Infinity)) {
              isBankExhausted = true;
              finalBuckets = allQByMarks;
              res = resAll;
          }
      }

      if (isBankExhausted) {
         alert("Question bank exhausted for perfect distribution! Restarting cycle from all available questions to form the best test.");
      }

      if (!res.best) {
         throw new Error("Sorry, Test is not Available right now. (Question bank does not have enough questions to form a balanced test of at least 3 sections).");
      }

      reqCounts = res.best;
      const selectedQuestions = [];

      for (let m = 1; m <= 5; m++) {
        const req = reqCounts[m];
        if (req === 0) continue;
        const bucket = finalBuckets[m];
        
        for (let i = bucket.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
        }

        bucket.sort((a, b) => {
          const pA = diffPriority.indexOf(a.difficulty || 'Medium');
          const pB = diffPriority.indexOf(b.difficulty || 'Medium');
          return (pA === -1 ? 99 : pA) - (pB === -1 ? 99 : pB);
        });

        selectedQuestions.push(...bucket.slice(0, req));
      }

      setTest(data);
      setActiveQuestions(selectedQuestions);
    } catch (e) {
      setError(e.message || 'Test not found or access denied.');
    } finally {
      setLoading(false);
    }
  }

  const handleToggleBookmark = async () => {
    if (!currentUser) return;
    const q = activeQuestions[evalIndex];
    const newSet = new Set(bookmarks);
    try {
      await toggleBookmark(currentUser.id || currentUser.phone, {
        testId: test.id,
        testTitle: test.title,
        chapterId: test.chapterId,
        questionIndex: q.originalIndex,
        questionText: q.text,
        type: 'subjective',
        diagram: q.diagram || null,
        answerSteps: q.answerSteps || null,
        marks: q.marks || null
      });
      if (newSet.has(q.originalIndex)) newSet.delete(q.originalIndex);
      else newSet.add(q.originalIndex);
      setBookmarks(newSet);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async () => {
    if (!currentUser || reporting) return;
    const q = activeQuestions[evalIndex];
    if (reportedStatus[q.originalIndex]) return;
    setConfirmDialog({
      message: "Report this question for errors?",
      onConfirm: async () => {
        setReporting(true);
        try {
          await reportTestQuestion(test.id, q.originalIndex, test.chapterId);
          setReportedStatus(prev => ({ ...prev, [q.originalIndex]: true }));
          alert("Question reported successfully. Our team will review it.");
        } catch (err) {
          alert("Failed to report: " + err.message);
        } finally {
          setReporting(false);
        }
      }
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartTest = () => {
    setPhase('TEST');
  };

  const handleFinishWriting = () => {
    setConfirmDialog({
      message: "Are you sure you have finished writing all answers in your copy?",
      onConfirm: () => {
        setPhase('EVALUATION');
      }
    });
  };

  const handleEvalNext = () => {
    const q = activeQuestions[evalIndex];
    const val = evalMarks[evalIndex];
    if (val === undefined || val < 0 || val > q.marks) {
      alert(`Please enter a valid score between 0 and ${q.marks}`);
      return;
    }
    
    if (evalIndex < activeQuestions.length - 1) {
      setEvalIndex(prev => prev + 1);
      window.scrollTo(0,0);
    } else {
      handleSubmitEval();
    }
  };

  async function handleSubmitEval() {
    setConfirmDialog({
      message: "Submit final evaluation?",
      onConfirm: async () => {
        setIsSubmitting(true);
        
        let totalObtained = 0;
    let totalMax = 0;
    
    Object.entries(evalMarks).forEach(([idx, val]) => {
      totalObtained += parseFloat(val) || 0;
      totalMax += activeQuestions[idx].marks;
    });

    try {
      const attemptData = {
        userId: currentUser.id || currentUser.phone,
        testId: test.id,
        chapterId: test.chapterId,
        marksObtained: totalObtained,
        totalMarks: targetMarks, // 20 or 40
        responses: evalMarks,
        totalTime: quizTime,
        seenIndices: activeQuestions.map(q => q.originalIndex)
      };
      
      await submitSubjectiveTestAttempt(attemptData);
      setResult(attemptData);
      setPhase('RESULT');
      window.scrollTo(0,0);
    } catch(err) {
      alert('Failed to submit evaluation.');
    } finally {
      setIsSubmitting(false);
    }
      }
    });
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem 0', color: 'rgba(255,255,255,0.5)' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
      Generating Subjective Exam Paper...
    </div>
  );

  if (error || !test) return (
    <div style={{ textAlign: 'center', color: '#f87171', padding: '3rem' }}>{error}</div>
  );

  // Group questions by sections for display
  const sections = [
    { title: 'Section A (1 Mark each)', questions: activeQuestions.filter(q => q.marks === 1) },
    { title: 'Section B (2 Marks each)', questions: activeQuestions.filter(q => q.marks === 2) },
    { title: 'Section C (3 Marks each)', questions: activeQuestions.filter(q => q.marks === 3) },
    { title: 'Section D (4 Marks each)', questions: activeQuestions.filter(q => q.marks === 4) },
    { title: 'Section E (Case Based / 5 Marks)', questions: activeQuestions.filter(q => q.marks === 5) }
  ];

  let globalQNum = 1;

  return (
    <div style={{ animation: 'fade-in 0.4s ease', paddingBottom: '6rem', maxWidth: '800px', margin: '0 auto' }}>
      <style>{`
        .tp-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .tp-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
        .tp-back:hover { background: rgba(255,255,255,0.1); }
        .tp-title { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .paper-container { background: #fdfbf7; border-radius: 8px; padding: 2rem; color: #1a1a1a; box-shadow: 0 4px 20px rgba(0,0,0,0.5); font-family: 'Times New Roman', Times, serif; }
        .paper-header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 1rem; margin-bottom: 2rem; }
        .paper-title { font-size: 1.5rem; font-weight: bold; margin: 0 0 0.5rem 0; text-transform: uppercase; }
        .paper-meta { display: flex; justify-content: space-between; font-size: 1rem; font-weight: bold; margin-top: 1rem; }
        .paper-instructions { font-size: 0.9rem; font-style: italic; margin-top: 1rem; text-align: left; }
        .paper-section-title { font-size: 1.2rem; font-weight: bold; text-decoration: underline; margin: 1.5rem 0 1rem; text-align: center; }
        .paper-question { display: flex; gap: 1rem; margin-bottom: 1.5rem; font-size: 1.1rem; line-height: 1.5; }
        
        .eval-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
        
        .custom-md p { margin: 0; }
        .custom-md .katex-display { margin: 0.5rem 0; }
        .eval-input { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 0.75rem; border-radius: 8px; font-size: 1.2rem; width: 100px; text-align: center; font-weight: bold; outline: none; }
        .eval-input:focus { border-color: #fbbf24; }
        .custom-md { white-space: pre-wrap; word-break: break-word; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .modal-content { background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 2rem; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .modal-title { font-size: 1.25rem; font-weight: bold; color: #fff; margin-bottom: 1rem; }
        .modal-actions { display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem; }
        .modal-btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: bold; cursor: pointer; border: none; transition: all 0.2s; }
        .modal-btn.cancel { background: rgba(255,255,255,0.1); color: #fff; }
        .modal-btn.cancel:hover { background: rgba(255,255,255,0.2); }
        .modal-btn.confirm { background: #3b82f6; color: #fff; }
        .modal-btn.confirm:hover { background: #2563eb; }
        
        @media (max-width: 600px) {
          .eval-card { padding: 1rem; }
          .paper-container { padding: 1rem; }
          .tp-title { font-size: 1.1rem; white-space: normal; }
          .eval-input { width: 70px !important; padding: 0.5rem !important; }
          .paper-question { flex-direction: column; gap: 0.5rem; }
        }
      `}</style>
      
      {confirmDialog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">{confirmDialog.message}</div>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setConfirmDialog(null)}>Cancel</button>
              <button className="modal-btn confirm" onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(null);
              }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div className="tp-header" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <button className="tp-back" onClick={() => navigate('/star-tests')}><ArrowLeft size={18} /></button>
          <h1 className="tp-title" title={test.title}>{test.title} (Subjective)</h1>
        </div>
        {(phase === 'TEST' || phase === 'EVALUATION') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.75rem', borderRadius: '20px', color: '#fff', fontWeight: 700, flexShrink: 0, fontSize: '0.9rem' }}>
            <Clock size={14} /> {formatTime(quizTime)}
          </div>
        )}
      </div>

      {phase === 'INSTRUCTION' && (
        <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.05) 100%)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '16px', padding: '2rem', textAlign: 'center' }}>
          <Edit3 size={48} color="#3b82f6" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ margin: '0 0 1rem', color: '#fff', fontSize: '1.5rem' }}>Get Ready to Write!</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '500px', marginInline: 'auto' }}>
            This is a subjective exam. Please take out your notebook/copy and a pen. Treat this exactly like a real exam. 
            The timer will start as soon as you click "Begin Test".
          </p>
          <button 
            onClick={handleStartTest}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            I am Ready, Begin Test
          </button>
        </div>
      )}

      {phase === 'TEST' && (
        <>
          <div className="paper-container">
            <div className="paper-header">
              <h2 className="paper-title">{test.title}</h2>
              <div className="paper-meta">
                <span>Class: Star Batch</span>
                <span>Max. Marks: {targetMarks}</span>
              </div>
              <div className="paper-instructions">
                <strong>General Instructions:</strong><br/>
                1. This question paper comprises {sections.length} sections.<br/>
                2. All questions are compulsory.<br/>
                3. Write your answers clearly and neatly in your notebook.
              </div>
            </div>

            {sections.map(sec => {
              if (sec.questions.length === 0) return null;
              return (
                <div key={sec.title}>
                  <div className="paper-section-title">{sec.title}</div>
                  {sec.questions.map(q => (
                    <div key={q.originalIndex} className="paper-question">
                      <div style={{ fontWeight: 'bold' }}>Q{globalQNum++}.</div>
                      <div style={{ flex: 1 }}>
                      <div className="custom-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {q.text}
                        </ReactMarkdown>
                        {q.diagram && <DiagramRenderer diagram={q.diagram} />}
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleFinishWriting}
            style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', padding: '1.25rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', margin: '2rem 0' }}
          >
            I Have Finished Writing (Submit Paper)
          </button>
        </>
      )}

      {phase === 'EVALUATION' && (
        <div style={{ animation: 'fade-in 0.4s ease' }}>
          {evalIndex === 0 && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <AlertCircle size={32} color="#ef4444" />
              <div>
                <h3 style={{ margin: '0 0 0.25rem', color: '#ef4444' }}>Red Pen Time!</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                  Take a red pen. We will show you the step-by-step marking scheme for each question. 
                  Be strictly honest and award yourself marks accordingly. You can use half marks (e.g. 1.5).
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: 600 }}>
            <span>Self-Evaluation: Question {evalIndex + 1} of {activeQuestions.length}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#fbbf24' }}>Total Marks for this Q: {activeQuestions[evalIndex].marks}</span>
              <button onClick={handleToggleBookmark} style={{ background: 'none', border: 'none', cursor: 'pointer', color: bookmarks.has(activeQuestions[evalIndex].originalIndex) ? '#fbbf24' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }} title="Bookmark Question">
                <Bookmark size={18} fill={bookmarks.has(activeQuestions[evalIndex].originalIndex) ? '#fbbf24' : 'none'} />
              </button>
              <button onClick={handleReport} disabled={reportedStatus[activeQuestions[evalIndex].originalIndex]} style={{ background: 'none', border: 'none', cursor: 'pointer', color: reportedStatus[activeQuestions[evalIndex].originalIndex] ? '#ef4444' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }} title="Report Error">
                <Flag size={18} fill={reportedStatus[activeQuestions[evalIndex].originalIndex] ? '#ef4444' : 'none'} />
              </button>
            </div>
          </div>

          <div className="eval-card">
            <div style={{ fontSize: '1.1rem', color: '#f1f5f9', lineHeight: 1.6, marginBottom: '1.5rem' }} className="custom-md">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {activeQuestions[evalIndex].text}
              </ReactMarkdown>
              {activeQuestions[evalIndex].diagram && <DiagramRenderer diagram={activeQuestions[evalIndex].diagram} />}
            </div>

            <div style={{ background: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} /> Official Marking Scheme
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(activeQuestions[evalIndex].answerSteps || []).map((step, sIdx) => (
                  <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>
                      {step.marks}M
                    </div>
                    <div style={{ flex: 1, color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.5 }} className="custom-md">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {step.stepText || step.step || step.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem', color: '#fff' }}>Your Score</h4>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Out of {activeQuestions[evalIndex].marks} marks</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0" 
                    max={activeQuestions[evalIndex].marks}
                    className="eval-input"
                    value={evalMarks[evalIndex] !== undefined ? evalMarks[evalIndex] : ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setEvalMarks(prev => ({ ...prev, [evalIndex]: isNaN(val) ? undefined : val }));
                    }}
                    placeholder="0.0"
                    style={{ width: '80px', padding: '0.6rem', fontSize: '1.1rem' }}
                  />
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', fontWeight: 'bold' }}>/ {activeQuestions[evalIndex].marks}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(() => {
                  const maxM = activeQuestions[evalIndex].marks;
                  let options = [];
                  if (maxM === 1) options = [0, 0.5, 1];
                  else if (maxM === 2) options = [0, 1, 2];
                  else if (maxM === 3) options = [1, 2, 3];
                  else if (maxM === 4) options = [1, 2, 4];
                  else if (maxM === 5) options = [2, 3, 5];
                  else options = [0, Math.floor(maxM/2), maxM];
                  
                  return options.map(opt => (
                    <button 
                      key={opt}
                      onClick={() => setEvalMarks(prev => ({ ...prev, [evalIndex]: opt }))}
                      style={{ 
                        flex: '1 1 calc(33.33% - 0.5rem)', 
                        padding: '0.75rem', 
                        background: evalMarks[evalIndex] === opt ? '#fbbf24' : 'rgba(255,255,255,0.05)', 
                        color: evalMarks[evalIndex] === opt ? '#000' : '#fff', 
                        border: '1px solid ' + (evalMarks[evalIndex] === opt ? '#fbbf24' : 'rgba(255,255,255,0.2)'),
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '1rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {opt} {opt === 1 ? 'Mark' : 'Marks'}
                    </button>
                  ));
                })()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => { setEvalIndex(prev => prev - 1); window.scrollTo(0,0); }}
              disabled={evalIndex === 0}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: '#fff', fontWeight: 600, cursor: evalIndex === 0 ? 'not-allowed' : 'pointer', opacity: evalIndex === 0 ? 0.3 : 1 }}
            >
              Previous
            </button>
            <button 
              onClick={handleEvalNext}
              disabled={isSubmitting}
              style={{ flex: 2, background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', border: 'none', padding: '1rem', borderRadius: '12px', color: '#000', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {isSubmitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/> : (evalIndex === activeQuestions.length - 1 ? 'Finish & Generate Report' : 'Next Question')}
            </button>
          </div>
        </div>
      )}

      {phase === 'RESULT' && result && (
        <SubjectiveTestAnalyticsDashboard 
          result={result}
          activeQuestions={activeQuestions}
          test={test}
        />
      )}
    </div>
  );
}
