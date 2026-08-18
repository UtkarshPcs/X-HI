import React, { useState } from 'react';
import { Target, Clock, AlertCircle, CheckCircle, BarChart3, Star, Award, ChevronDown, ChevronUp, Zap, ArrowUpRight, ShieldAlert, Crosshair, BookOpen, Activity, AlertTriangle, PlayCircle, Trophy, ZapOff, BookType, Flag, Bookmark, XCircle, Brain } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { formatMath } from '../utils/formatMath';
import 'katex/dist/katex.min.css';

export default function TermPracticeAnalyticsDashboard({ result, test, activeQuestions }) {
  const navigate = useNavigate();
  const [expandedMistakes, setExpandedMistakes] = useState({});

  const totalObtained = result.score || 0;
  const totalMax = result.total || 80;
  const percentage = Math.round((totalObtained / totalMax) * 100);
  const ai = result.aiReport || {};

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h > 0 ? h + 'h ' : ''}${m}m`;
  };

  const toggleMistake = (idx) => {
    setExpandedMistakes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Safe AI Fallbacks
  const diagnosis = ai.diagnosis || {
    summary: percentage >= 80 ? "Excellent Work! Just a little more polish needed." : "You need to focus on improving your execution.",
    strong: ["Core Concepts"],
    needs_work: ["Application questions"],
    weak: ["Deep Explanations"],
    major_issue: "Losing marks due to lack of detail.",
    advice: "Focus on structuring your subjective answers better."
  };

  const objSubj = ai.objSubj || {
    objective: { accuracy: 0, insight: "Objective performance." },
    subjective: { accuracy: 0, insight: "Subjective performance." },
    recommendation: "Focus on writing complete answers."
  };

  // Chapter Health Fallback
  let chapterHealth = ai.chapterHealth;
  if (!chapterHealth || chapterHealth.length === 0) {
    const chapMap = {};
    activeQuestions.forEach((q, idx) => {
      const t = q.topic || 'General';
      if(!chapMap[t]) chapMap[t] = { score: 0, max: 0 };
      chapMap[t].score += parseFloat(result.responses[idx]) || 0;
      chapMap[t].max += q.marks || 1;
    });
    chapterHealth = Object.keys(chapMap).map(t => ({
      topic: t,
      score: chapMap[t].score,
      max: chapMap[t].max,
      accuracy: chapMap[t].max > 0 ? Math.round((chapMap[t].score / chapMap[t].max) * 100) : 0,
      status: (chapMap[t].score / chapMap[t].max) >= 0.8 ? 'Strong' : (chapMap[t].score / chapMap[t].max) >= 0.6 ? 'Needs Work' : 'Weak',
      insight: "Review carefully."
    }));
  }

  const difficulty = ai.difficulty || {
    easy: { score: 0, max: 0, accuracy: 0 },
    medium: { score: 0, max: 0, accuracy: 0 },
    hard: { score: 0, max: 0, accuracy: 0 },
    insight: "Focus on hard application questions."
  };

  const recovery = ai.recovery || {
    easy: 2, moderate: 3, deep: 4,
    roi: ["Improve time management → +2 marks", "Revise core concepts → +3 marks"],
    potentialScore: `${totalObtained + 5}/${totalMax}`
  };

  const actionPlan = ai.actionPlan || [
    { priority: 1, topic: "General Revision", time: "30 min", actions: ["Review test mistakes", "Solve more application questions"] }
  ];

  // Personal Bests calculation (from this test)
  const bestChap = chapterHealth.reduce((prev, current) => (prev.accuracy > current.accuracy) ? prev : current, chapterHealth[0] || {topic:'N/A'});

  const displayTitle = (test.title && test.title !== 'Untitled' && test.title !== 'Untitled Test') 
    ? test.title : test.subjectId ? `${test.subjectId.charAt(0).toUpperCase() + test.subjectId.slice(1)} Practice Set` : 'Untitled Test';

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', animation: 'fade-in 0.5s ease', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', color: '#fff' }}>AI Performance Report</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem' }}>{displayTitle}</p>
      </div>

      {/* Overview Stats (Moved to top) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))', padding: '1.5rem 1rem', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
          <div style={{ color: '#10b981', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Score</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{totalObtained}<span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>/{totalMax}</span></div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.05))', padding: '1.5rem 1rem', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center' }}>
          <div style={{ color: '#3b82f6', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Accuracy</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{percentage}%</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.05))', padding: '1.5rem 1rem', borderRadius: '16px', border: '1px solid rgba(168,85,247,0.2)', textAlign: 'center' }}>
          <div style={{ color: '#a855f7', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Time Taken</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1.25 }}>{formatTime(result.totalTime || 0)}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))', padding: '1.5rem 1rem', borderRadius: '16px', border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: '#f59e0b', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Strongest Chapter</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{bestChap.topic}</div>
        </div>
      </div>

      {/* 1. AI Diagnosis */}
      <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Brain size={28} color="#60a5fa" />
          <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>AI Performance Diagnosis</h2>
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', borderLeft: '4px solid #3b82f6', paddingLeft: '1rem' }}>
          {diagnosis.summary}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', padding: '1rem', borderRadius: '12px' }}>
            <div style={{ color: '#10b981', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16}/> Strong</div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
              {(diagnosis.strong || []).map((s,i) => <li key={i} style={{marginBottom: '4px'}}>{s}</li>)}
            </ul>
          </div>
          <div style={{ background: 'rgba(234,179,8,0.1)', padding: '1rem', borderRadius: '12px' }}>
            <div style={{ color: '#eab308', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16}/> Needs Work</div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
              {(diagnosis.needs_work || []).map((s,i) => <li key={i} style={{marginBottom: '4px'}}>{s}</li>)}
            </ul>
          </div>
          <div style={{ background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '12px' }}>
            <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><XCircle size={16}/> Weak</div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
              {(diagnosis.weak || []).map((s,i) => <li key={i} style={{marginBottom: '4px'}}>{s}</li>)}
            </ul>
          </div>
        </div>
        
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ color: '#f87171', fontWeight: 700, marginBottom: '0.5rem' }}>🔴 Major Issue: {diagnosis.major_issue}</div>
          <div style={{ color: '#e2e8f0', fontSize: '1.05rem', lineHeight: 1.6 }}>{diagnosis.advice}</div>
        </div>
      </div>

      {/* 2. Chapter-wise Performance */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <BookOpen size={24} color="#a855f7" />
          <h2 style={{ fontSize: '1.3rem', margin: 0, color: '#fff' }}>Chapter Health</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                <th style={{ padding: '1rem' }}>Chapter</th>
                <th style={{ padding: '1rem' }}>Score</th>
                <th style={{ padding: '1rem' }}>Accuracy</th>
                <th style={{ padding: '1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {chapterHealth.map((ch, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#fff' }}>
                    {ch.topic}
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', marginTop: '4px' }}>{ch.insight}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{ch.score}/{ch.max}</td>
                  <td style={{ padding: '1rem' }}>{ch.accuracy}%</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700,
                      background: ch.accuracy >= 80 ? 'rgba(16,185,129,0.1)' : ch.accuracy >= 60 ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                      color: ch.accuracy >= 80 ? '#10b981' : ch.accuracy >= 60 ? '#eab308' : '#ef4444'
                    }}>
                      {ch.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid for Obj/Subj and Difficulty */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Objective vs Subjective */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Target size={24} color="#38bdf8" />
            <h2 style={{ fontSize: '1.3rem', margin: 0, color: '#fff' }}>Objective vs Subjective</h2>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, color: '#10b981' }}>Objective</span>
              <span style={{ fontWeight: 700, color: '#fff' }}>{objSubj.objective.accuracy}%</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>{objSubj.objective.insight}</div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, color: '#eab308' }}>Subjective</span>
              <span style={{ fontWeight: 700, color: '#fff' }}>{objSubj.subjective.accuracy}%</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>{objSubj.subjective.insight}</div>
          </div>

          <div style={{ background: 'rgba(56,189,248,0.1)', borderLeft: '3px solid #38bdf8', padding: '1rem', borderRadius: '8px', fontSize: '0.95rem' }}>
            <span style={{ fontWeight: 700, color: '#38bdf8' }}>Recommendation:</span> {objSubj.recommendation}
          </div>
        </div>

        {/* Difficulty Analysis */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Activity size={24} color="#f43f5e" />
            <h2 style={{ fontSize: '1.3rem', margin: 0, color: '#fff' }}>Difficulty Analysis</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {['easy', 'medium', 'hard'].map(level => {
              const data = difficulty[level] || { accuracy: 0, score: 0, max: 0 };
              const colors = { easy: '#10b981', medium: '#eab308', hard: '#ef4444' };
              const col = colors[level];
              return (
                <div key={level}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600, color: col }}>{level}</span>
                    <span style={{ fontWeight: 700 }}>{data.score}/{data.max} ({data.accuracy}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${data.accuracy}%`, background: col, borderRadius: '4px' }}></div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
            "{difficulty.insight}"
          </div>
        </div>
      </div>

      {/* Marks Recovery Analysis */}
      <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(5,150,105,0.1))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Zap size={24} color="#10b981" />
          <h2 style={{ fontSize: '1.3rem', margin: 0, color: '#fff' }}>Marks Recovery Analysis</h2>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 700 }}>Where can you gain marks?</div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', padding: '1rem', borderRadius: '12px', flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>+{recovery.easy}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Easy Recovery</div>
              </div>
              <div style={{ background: 'rgba(234,179,8,0.1)', padding: '1rem', borderRadius: '12px', flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#eab308' }}>+{recovery.moderate}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Moderate</div>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '12px', flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>+{recovery.deep}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Deep Revision</div>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>Potential Next Score: </span>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>{recovery.potentialScore}</span>
            </div>
          </div>
          
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 700 }}>Highest ROI Improvements</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(recovery.roi || []).map((r, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.95rem' }}>
                  <ArrowUpRight size={16} color="#10b981" /> {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Question-by-Question Mistake Analysis */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <ShieldAlert size={24} color="#f97316" />
          <h2 style={{ fontSize: '1.3rem', margin: 0, color: '#fff' }}>Questions You Lost Marks On</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeQuestions.map((q, idx) => {
            const marksObtained = parseFloat(result.responses[idx]) || 0;
            const max = q.marks || 1;
            if (marksObtained === max) return null; // Only show mistakes

            const isExpanded = expandedMistakes[idx];
            return (
              <div key={idx} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                <div onClick={() => toggleMistake(idx)} style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <div style={{ flex: 1, marginRight: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 800 }}>Q{idx + 1}</span>
                      <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 700 }}>{marksObtained}/{max} Marks</span>
                      <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', color: '#e2e8f0' }}>{q.topic || 'General'}</span>
                      <span style={{ background: q.difficulty === 'Easy' ? 'rgba(16,185,129,0.1)' : q.difficulty === 'Hard' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)', color: q.difficulty === 'Easy' ? '#10b981' : q.difficulty === 'Hard' ? '#ef4444' : '#eab308', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{q.difficulty || 'Medium'}</span>
                    </div>
                    <div className="custom-md" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60vw' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatMath((q.text || '').split('\\n')[0])}</ReactMarkdown>
                    </div>
                  </div>
                  <div>{isExpanded ? <ChevronUp size={20} color="rgba(255,255,255,0.5)"/> : <ChevronDown size={20} color="rgba(255,255,255,0.5)"/>}</div>
                </div>
                
                {isExpanded && (
                  <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="custom-md" style={{ color: '#fff', fontSize: '1rem', lineHeight: 1.5 }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatMath(q.text)}</ReactMarkdown>
                    </div>
                    
                    {q.type === 'objective' && q.options && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {q.options.map((opt, oIdx) => {
                           const isCorrect = oIdx === q.correctOptionIndex;
                           return (
                             <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isCorrect ? '#10b981' : 'rgba(255,255,255,0.1)'}`, padding: '0.75rem', borderRadius: '8px' }}>
                               <div style={{ fontWeight: 700, color: isCorrect ? '#10b981' : '#fff' }}>{String.fromCharCode(65+oIdx)}</div>
                               <div className="custom-md" style={{ color: '#e2e8f0', flex: 1 }}><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatMath(opt)}</ReactMarkdown></div>
                             </div>
                           )
                        })}
                      </div>
                    )}
                    
                    <div style={{ background: 'rgba(59,130,246,0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                      <div style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Expected Answer / Explanation</div>
                      <div className="custom-md" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatMath(q.explanation || q.answer || "No explanation provided.")}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {activeQuestions.every((q, idx) => (parseFloat(result.responses[idx]) || 0) === (q.marks || 1)) && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#10b981', background: 'rgba(16,185,129,0.05)', borderRadius: '12px' }}>
              <CheckCircle size={32} style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: 700 }}>Perfect Score! No mistakes found.</div>
            </div>
          )}
        </div>
      </div>

      {/* Personalized Action Plan */}
      <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(217,70,239,0.05))', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <PlayCircle size={28} color="#c084fc" />
          <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>Your Next Study Plan</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {(actionPlan || []).map((ap, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1.5rem', borderLeft: `4px solid ${ap.priority === 1 ? '#ef4444' : ap.priority === 2 ? '#eab308' : '#10b981'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  <span style={{ color: ap.priority === 1 ? '#ef4444' : ap.priority === 2 ? '#eab308' : '#10b981', marginRight: '0.5rem' }}>Priority {ap.priority}</span> 
                  — {ap.topic}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} /> Time: {ap.time}
                </div>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'rgba(255,255,255,0.8)', fontSize: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(ap.actions || []).map((act, idx) => <li key={idx}>{act}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>



      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={() => navigate('/term-practice')}
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '1rem 2rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.15)'; }}
          onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; }}
        >
          Return to Term Practice Sets
        </button>
      </div>
    </div>
  );
}
