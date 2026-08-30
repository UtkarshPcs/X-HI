import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getTermPracticeTestById, submitTermPracticeAttempt, reportAndReplaceQuestion } from '../services/termPracticeService';
import TermPracticeAnalyticsDashboard from '../components/TermPracticeAnalyticsDashboard';
import { Loader2, ArrowLeft, Clock, Target, CheckCircle, Edit3, AlertCircle, Flag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { formatMath } from '../utils/formatMath';
import DiagramRenderer from '../components/DiagramRenderer'; // Ensure this exists

const YT_MUSIC_ID = "hJ47yWeWBIg"; // User provided background music

export default function TermPracticeTestPlayerPage() {
  const { testId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // phases: 'INSTRUCTION', 'TEST', 'EVALUATION', 'RESULT'
  const [phase, setPhase] = useState('INSTRUCTION');
  
  const INITIAL_TIME = 10800; // 3 hours
  const [quizTime, setQuizTime] = useState(INITIAL_TIME);
  const [evalIndex, setEvalIndex] = useState(0);
  const [evalMarks, setEvalMarks] = useState({}); // idx -> marks
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [reportingIndex, setReportingIndex] = useState(null); // index currently being replaced (loading state)
  const [rejectedIds, setRejectedIds] = useState(() => new Set()); // question IDs reported+deleted this session
  const totalTestMarks = test?.questions ? test.questions.reduce((acc, q) => acc + (q.marks || 1), 0) : 80;

  async function fetchTest() {
    setLoading(true);
    try {
      const data = await getTermPracticeTestById(testId);
      if (!data.questions || data.questions.length === 0) {
        throw new Error("This practice set is empty.");
      }
      setTest(data);
    } catch (e) {
      setError(e.message || 'Test not found or access denied.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    fetchTest();
  }, [testId, currentUser, navigate]);

  useEffect(() => {
    let timer;
    if (phase === 'TEST') {
      timer = setInterval(() => {
        setQuizTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setPhase('EVALUATION');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase]);


  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
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
        window.scrollTo(0,0);
      }
    });
  };

  const handleReportQuestion = (idx) => {
    setConfirmDialog({
      message: "Report this question as corrupt? It will be permanently deleted from the question bank and instantly replaced with a fresh question of the same marks/type.",
      onConfirm: async () => {
        setReportingIndex(idx);
        try {
          const reportedQ = test.questions[idx];
          const reportedId = reportedQ.question_id || reportedQ.id;
          const replacement = await reportAndReplaceQuestion(test.id, idx, rejectedIds);

          setTest(prev => {
            const newQuestions = [...prev.questions];
            newQuestions[idx] = replacement;
            return { ...prev, questions: newQuestions };
          });

          if (reportedId) {
            setRejectedIds(prev => new Set(prev).add(reportedId));
          }
        } catch (err) {
          alert('Failed to report question: ' + err.message);
        } finally {
          setReportingIndex(null);
        }
      }
    });
  };

  const handleEvalNext = () => {
    const q = test.questions[evalIndex];
    const val = evalMarks[evalIndex];
    if (val === undefined || val < 0 || val > q.marks) {
      alert(`Please enter a valid score between 0 and ${q.marks}`);
      return;
    }
    
    if (evalIndex < test.questions.length - 1) {
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
        const historyUpdates = [];
        
        Object.entries(evalMarks).forEach(([idx, val]) => {
          const marks = parseFloat(val) || 0;
          const maxMarks = test.questions[idx].marks || 1;
          const qId = test.questions[idx].question_id || test.questions[idx].id;
          
          totalObtained += marks;
          totalMax += maxMarks;
          
          if (qId) {
             // If they scored 100%, mark as correct, else incorrect.
             // You might want a different threshold, e.g. >= 80%. Let's use === maxMarks for strict 'correct'.
             historyUpdates.push({
               questionId: qId,
               status: marks >= maxMarks ? 'correct' : 'incorrect'
             });
          }
        });

        try {
          const attemptData = {
            userId: currentUser.id || currentUser.uid || currentUser.phone,
            testId: test.id,
            subjectId: test.subjectId,
            score: totalObtained,
            total: totalMax,
            responses: evalMarks,
            totalTime: INITIAL_TIME - quizTime
          };
          
          // Save question history to firestore for spaced repetition
          try {
            const { updateUserQuestionHistory } = await import('../services/testGenerationService');
            await updateUserQuestionHistory(attemptData.userId, historyUpdates);
          } catch (histErr) {
            console.error("Failed to update user question history", histErr);
          }

          // Generate AI Report
          try {
            const { generateTermPracticeReport } = await import('../services/llmService');
            const aiReport = await generateTermPracticeReport(test, attemptData, test.questions, evalMarks);
            if (aiReport) attemptData.aiReport = aiReport;
          } catch(e) {
            console.error("AI report failed", e);
          }
          
          await submitTermPracticeAttempt(attemptData);
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
      Fetching Practice Set...
    </div>
  );

  if (error || !test) return (
    <div style={{ textAlign: 'center', color: '#f87171', padding: '3rem' }}>{error}</div>
  );

  const displayTitle = (test.title && test.title !== 'Untitled' && test.title !== 'Untitled Test') 
    ? test.title 
    : test.subjectId 
      ? `${test.subjectId.charAt(0).toUpperCase() + test.subjectId.slice(1)} Practice Set` 
      : 'Untitled Test';

  return (
    <div style={{ animation: 'fade-in 0.4s ease', paddingBottom: '6rem', maxWidth: '800px', margin: '0 auto' }}>
      <style>{`
        .tp-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; justify-content: space-between; }
        .tp-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
        .tp-back:hover { background: rgba(255,255,255,0.1); }
        .tp-title { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .paper-container { background: #fdfbf7; border-radius: 2px; padding: 3rem 4rem; color: #1a1a1a; box-shadow: 0 4px 25px rgba(0,0,0,0.5); font-family: 'Times New Roman', Times, serif; min-height: 100vh; }
        .paper-header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 1rem; margin-bottom: 2rem; }
        .paper-title { font-size: 1.75rem; font-weight: bold; margin: 0 0 0.5rem 0; text-transform: uppercase; letter-spacing: 1px; }
        .paper-meta { display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: bold; margin-top: 1rem; }
        .paper-instructions { font-size: 1rem; font-style: italic; margin-top: 1rem; text-align: left; }
        
        .paper-question { display: flex; gap: 1rem; margin-bottom: 2rem; font-size: 1.1rem; line-height: 1.5; }
        .paper-question-number { font-weight: bold; flex-shrink: 0; }
        .paper-question-body { flex: 1; }
        .paper-question-marks { font-weight: bold; flex-shrink: 0; white-space: nowrap; font-size: 1rem; }
        
        .paper-options { margin-top: 0.75rem; padding-left: 1rem; list-style-type: lower-alpha; }
        .paper-options li { margin-bottom: 0.4rem; }

        .eval-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
        .eval-input { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 0.75rem; border-radius: 8px; font-size: 1.2rem; width: 100px; text-align: center; font-weight: bold; outline: none; }
        .eval-input:focus { border-color: #fbbf24; }
        
        .custom-md p { margin: 0; }
        .custom-md .katex-display { margin: 0.5rem 0; }
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
        
        @media (max-width: 768px) {
          .paper-container { padding: 1.5rem; }
        }
        @media print {
          body * { visibility: hidden; }
          .paper-container, .paper-container * { visibility: visible; }
          .paper-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0 !important; box-shadow: none !important; background: white !important; color: black !important; }
          button { display: none !important; }
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

      {phase === 'TEST' && (
        <iframe
          src={`https://www.youtube.com/embed/${YT_MUSIC_ID}?autoplay=1&loop=1&playlist=${YT_MUSIC_ID}`}
          allow="autoplay"
          style={{ display: 'none' }}
          title="Background Music"
        />
      )}

      <div className="tp-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <button className="tp-back" onClick={() => navigate('/term-practice')}><ArrowLeft size={18} /></button>
          <h1 className="tp-title" title={displayTitle}>{displayTitle}</h1>
        </div>
        {(phase === 'TEST' || phase === 'EVALUATION') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={() => window.print()}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '20px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download PDF
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.75rem', borderRadius: '20px', color: '#fff', fontWeight: 700, flexShrink: 0, fontSize: '0.9rem' }}>
              <Clock size={14} /> {formatTime(quizTime)}
            </div>
          </div>
        )}
      </div>

      {phase === 'INSTRUCTION' && (
        <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.05) 100%)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '16px', padding: '2rem', textAlign: 'center' }}>
          <Edit3 size={48} color="#3b82f6" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ margin: '0 0 1rem', color: '#fff', fontSize: '1.5rem' }}>Get Ready for your Term Practice!</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '500px', marginInline: 'auto' }}>
            Please take out your notebook and a pen. Treat this exactly like your actual Half Yearly Examination. 
            The 3-hour timer and background focus music will start as soon as you click "Begin Test".
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
              <h2 className="paper-title">{displayTitle}</h2>
              <div className="paper-meta">
                <span>Subject: {test.subjectId?.toUpperCase()}</span>
                <span>Max. Marks: {totalTestMarks}</span>
              </div>
              <div className="paper-meta" style={{ marginTop: '0.5rem', fontWeight: 'normal' }}>
                <span>Time Allowed: 3 Hours</span>
              </div>
              <div className="paper-instructions">
                <strong>General Instructions:</strong><br/>
                1. This question paper consists of all necessary sections.<br/>
                2. All questions are compulsory. Internal choices are provided in some questions.<br/>
                3. Write your answers neatly and clearly in your notebook.
              </div>
            </div>

            {test.questions.map((q, idx) => {
              // Optionally handle section headers if provided in JSON
              const isSectionStart = q.sectionTitle;
              return (
                <React.Fragment key={idx}>
                  {isSectionStart && (
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'underline', margin: '2rem 0 1rem', textAlign: 'center' }}>
                      {q.sectionTitle}
                    </div>
                  )}
                  <div className="paper-question">
                    <div className="paper-question-number" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Q{idx + 1}.
                      {test.isDynamic && (
                        <button
                          type="button"
                          className="tp-report-btn"
                          title="Report this question as corrupt"
                          onClick={() => handleReportQuestion(idx)}
                          disabled={reportingIndex !== null}
                          style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#dc2626',
                            borderRadius: '6px',
                            width: '26px',
                            height: '26px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: reportingIndex !== null ? 'not-allowed' : 'pointer',
                            flexShrink: 0,
                            opacity: reportingIndex !== null && reportingIndex !== idx ? 0.4 : 1
                          }}
                        >
                          {reportingIndex === idx ? (
                            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Flag size={13} />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="paper-question-body">
                      {reportingIndex === idx && (
                        <div style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Replacing question...
                        </div>
                      )}
                      <div className="custom-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {formatMath(q.question_text || q.text)}
                        </ReactMarkdown>
                        {q.diagram && <DiagramRenderer diagram={q.diagram} />}
                        {q.diagram_urls && q.diagram_urls.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            {q.diagram_urls.map((url, i) => (
                              <img key={i} src={url} alt={`Diagram ${i + 1}`} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', border: '1px solid #ccc' }} />
                            ))}
                          </div>
                        )}
                        {q.map_urls && q.map_urls.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            {q.map_urls.map((url, i) => (
                              <img key={i} src={url} alt={`Map Reference ${i + 1}`} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', border: '1px solid #ccc' }} />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {q.options && q.options.length > 0 && (
                        <ol className="paper-options">
                          {q.options.map((opt, oIdx) => (
                            <li key={oIdx}>
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {formatMath(opt)}
                              </ReactMarkdown>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                    <div className="paper-question-marks">[{q.marks || 1}]</div>
                  </div>
                </React.Fragment>
              );
            })}
            
            {/* Render map_urls at the end of the paper */}
            {(() => {
              const allMapUrls = test.questions.flatMap(q => q.map_urls || []);
              if (allMapUrls.length > 0) {
                return (
                  <div style={{ marginTop: '3rem', borderTop: '2px dashed #ccc', paddingTop: '2rem' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '1.4rem' }}>Reference Maps</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
                      {allMapUrls.map((url, i) => (
                        <img key={i} src={url} alt={`Map Reference ${i + 1}`} style={{ maxWidth: '100%', height: 'auto', border: '1px solid #1a1a1a', borderRadius: '4px' }} />
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
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
                  Be strictly honest and award yourself marks accordingly.
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: 600 }}>
            <span>Self-Evaluation: Question {evalIndex + 1} of {test.questions.length}</span>
            <span style={{ color: '#fbbf24' }}>Total Marks for this Q: {test.questions[evalIndex].marks || 1}</span>
          </div>

          <div className="eval-card">
            <div style={{ fontSize: '1.1rem', color: '#f1f5f9', lineHeight: 1.6, marginBottom: '1.5rem' }} className="custom-md">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {formatMath(test.questions[evalIndex].question_text || test.questions[evalIndex].text)}
              </ReactMarkdown>
              
              {test.questions[evalIndex].options && test.questions[evalIndex].options.length > 0 && (
                <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                  {test.questions[evalIndex].options.map((opt, oIdx) => (
                    <li key={oIdx}>
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {formatMath(opt)}
                      </ReactMarkdown>
                    </li>
                  ))}
                </ol>
              )}
              {test.questions[evalIndex].diagram && <DiagramRenderer diagram={test.questions[evalIndex].diagram} />}
              {test.questions[evalIndex].diagram_urls && test.questions[evalIndex].diagram_urls.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  {test.questions[evalIndex].diagram_urls.map((url, i) => (
                    <img key={i} src={url} alt={`Diagram ${i + 1}`} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)' }} />
                  ))}
                </div>
              )}
              {test.questions[evalIndex].map_urls && test.questions[evalIndex].map_urls.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  {test.questions[evalIndex].map_urls.map((url, i) => (
                    <img key={i} src={url} alt={`Map Reference ${i + 1}`} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)' }} />
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} /> Official Marking Scheme
              </h4>
              
              {test.questions[evalIndex].type === 'objective' && test.questions[evalIndex].correctOptionIndex !== undefined ? (
                <div style={{ color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ flexShrink: 0 }}>Correct Option: {String.fromCharCode(97 + test.questions[evalIndex].correctOptionIndex)}.</span>
                    <div className="custom-md" style={{ fontWeight: 'normal' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {formatMath(test.questions[evalIndex].options[test.questions[evalIndex].correctOptionIndex] || "")}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {test.questions[evalIndex].explanation && (
                    <div style={{ marginTop: '1rem', fontWeight: 'normal', fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)' }} className="custom-md">
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Explanation:</div>
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {formatMath(test.questions[evalIndex].explanation)}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(test.questions[evalIndex].answerSteps || [{stepText: test.questions[evalIndex].explanation || "No marking scheme provided. Please judge based on standard answers."}]).map((step, sIdx) => (
                    <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      {step.marks && (
                        <div style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>
                          {step.marks}M
                        </div>
                      )}
                      <div style={{ flex: 1, color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.5 }} className="custom-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {formatMath(step.stepText || step.step || step.text)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem', color: '#fff' }}>Your Score</h4>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Out of {test.questions[evalIndex].marks || 1} marks</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: evalMarks[evalIndex] !== undefined ? '#10b981' : 'rgba(255,255,255,0.4)', fontSize: '1.4rem', fontWeight: 'bold' }}>
                    {evalMarks[evalIndex] !== undefined ? evalMarks[evalIndex] : '--'}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', fontWeight: 'bold' }}>/ {test.questions[evalIndex].marks || 1}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {Array.from({ length: ((test.questions[evalIndex].marks || 1) * 2) + 1 }, (_, i) => i * 0.5).map(m => (
                  <button 
                    key={m}
                    onClick={() => setEvalMarks(prev => ({ ...prev, [evalIndex]: m }))}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      border: evalMarks[evalIndex] === m ? 'none' : '1px solid rgba(255,255,255,0.2)',
                      background: evalMarks[evalIndex] === m ? '#10b981' : 'rgba(255,255,255,0.05)',
                      color: evalMarks[evalIndex] === m ? '#000' : '#fff',
                      transition: 'all 0.2s'
                    }}
                  >
                    {m}
                  </button>
                ))}
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
              {isSubmitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/> : (evalIndex === test.questions.length - 1 ? 'Finish & Generate Report' : 'Next Question')}
            </button>
          </div>
        </div>
      )}

      {phase === 'RESULT' && result && (
        <TermPracticeAnalyticsDashboard 
          result={result}
          activeQuestions={test.questions}
          test={test}
        />
      )}
    </div>
  );
}
