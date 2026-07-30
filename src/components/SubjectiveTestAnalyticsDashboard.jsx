import { useState } from 'react';
import { CheckCircle, XCircle, Sparkles, AlertCircle, BookOpen, Clock, Activity, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function SubjectiveTestAnalyticsDashboard({ result, activeQuestions, averageScore, test }) {
  const [expandedMistakes, setExpandedMistakes] = useState({});
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  const toggleMistake = (idx) => {
    setExpandedMistakes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const { marksObtained, totalMarks, responses, aiReview, difficultyStats, topicStats, totalTime } = result;
  
  // Calculate accuracy based on total marks
  const accuracy = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
  
  let badge = "Needs Improvement";
  let badgeColor = "#ef4444";
  if (accuracy >= 90) { badge = "Excellent"; badgeColor = "#10b981"; }
  else if (accuracy >= 70) { badge = "Good"; badgeColor = "#3b82f6"; }
  else if (accuracy >= 50) { badge = "Average"; badgeColor = "#fbbf24"; }

  // Mistake Analysis (any question where user got less than full marks)
  const allQsWithScores = activeQuestions.map((q, idx) => ({ ...q, userMarks: responses[idx] || 0, idx }));
  const mistakes = allQsWithScores.filter(q => q.userMarks < q.marks);

  const renderProgressBar = (correct, total, color) => (
    <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '8px', overflow: 'hidden', marginTop: '0.5rem' }}>
      <div style={{ width: `${total > 0 ? (correct/total)*100 : 0}%`, background: color, height: '100%', borderRadius: '4px' }}></div>
    </div>
  );

  const topicStatsCalc = {};
  const difficultyStatsCalc = { 'Easy': {m:0, t:0}, 'Medium': {m:0, t:0}, 'Hard': {m:0, t:0}, 'Super Difficult': {m:0, t:0} };

  allQsWithScores.forEach(q => {
    const diff = q.difficulty || 'Medium';
    const topic = q.topic || 'General';
    
    if (!difficultyStatsCalc[diff]) difficultyStatsCalc[diff] = {m:0, t:0};
    difficultyStatsCalc[diff].t += q.marks;
    difficultyStatsCalc[diff].m += (q.userMarks || 0);

    if (!topicStatsCalc[topic]) topicStatsCalc[topic] = {m:0, t:0};
    topicStatsCalc[topic].t += q.marks;
    topicStatsCalc[topic].m += (q.userMarks || 0);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'slideUp 0.5s ease', width: '100%' }}>
      {/* 1. Score Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>🏆 Score</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>{marksObtained}<span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.3)' }}>/{totalMarks}</span></div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>⏱️ Time</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>
            {totalTime ? `${Math.floor(totalTime / 60)}m ${totalTime % 60}s` : '--'}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>📈 Accuracy</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: badgeColor }}>{accuracy}%</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Performance</div>
          <div style={{ background: badgeColor + '20', color: badgeColor, border: `1px solid ${badgeColor}50`, padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 800, fontSize: '1.1rem' }}>
            {badge}
          </div>
        </div>
      </div>

      {/* 2. Topic & Difficulty Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Difficulty Breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} color="#fbbf24" /> Difficulty Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(difficultyStatsCalc).filter(([k,v]) => v.t > 0).map(([diff, stats]) => {
               const color = diff === 'Easy' ? '#10b981' : diff === 'Medium' ? '#fbbf24' : '#ef4444';
               return (
                 <div key={diff}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                     <span style={{ color: 'rgba(255,255,255,0.8)' }}>{diff}</span>
                     <span style={{ fontWeight: 700, color }}>{stats.m} / {stats.t} Marks</span>
                   </div>
                   {renderProgressBar(stats.m, stats.t, color)}
                 </div>
               )
            })}
          </div>
        </div>

        {/* Topic Breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} color="#3b82f6" /> Topic Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(topicStatsCalc).sort((a,b) => b[1].t - a[1].t).map(([topic, stats]) => (
              <div key={topic}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                   <span style={{ color: 'rgba(255,255,255,0.8)' }}>{topic}</span>
                   <span style={{ fontWeight: 700, color: '#3b82f6' }}>{stats.m} / {stats.t} Marks</span>
                 </div>
                 {renderProgressBar(stats.m, stats.t, '#3b82f6')}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Question Review (Mistakes vs All) */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={18} color="#ef4444"/> Subjective Review</h3>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.2rem' }}>
            <button 
              onClick={() => setShowAllQuestions(false)} 
              style={{ background: !showAllQuestions ? 'rgba(255,255,255,0.1)' : 'transparent', color: !showAllQuestions ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Lost Marks ({mistakes.length})
            </button>
            <button 
              onClick={() => setShowAllQuestions(true)} 
              style={{ background: showAllQuestions ? 'rgba(255,255,255,0.1)' : 'transparent', color: showAllQuestions ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              All Questions ({activeQuestions.length})
            </button>
          </div>
        </div>

        {(!showAllQuestions && mistakes.length === 0) ? (
          <div style={{ textAlign: 'center', color: '#10b981', padding: '2rem', background: 'rgba(16,185,129,0.05)', borderRadius: '12px' }}>
            <CheckCircle size={32} style={{ margin: '0 auto 1rem' }} />
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Perfect test! You got full marks on everything.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(showAllQuestions ? allQsWithScores : mistakes).map((q, i) => {
              const isExpanded = expandedMistakes[q.idx];
              const gotFullMarks = q.userMarks === q.marks;
              return (
                <div key={i} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                  <div 
                    onClick={() => toggleMistake(q.idx)}
                    style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 700 }}>Q{q.idx + 1}</span>
                        {gotFullMarks ? (
                           <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700 }}><CheckCircle size={12}/> Full Marks</span>
                        ) : (
                           <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700 }}><AlertCircle size={12}/> Marks Lost</span>
                        )}
                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', color: '#e2e8f0', marginLeft: '0.2rem' }}>{q.topic || 'General'}</span>
                        <span style={{ background: q.difficulty === 'Easy' ? '#10b98120' : q.difficulty === 'Medium' ? '#fbbf2420' : '#ef444420', color: q.difficulty === 'Easy' ? '#10b981' : q.difficulty === 'Medium' ? '#fbbf24' : '#ef4444', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem' }}>{q.difficulty || 'Medium'}</span>
                        <div style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '0.9rem', color: gotFullMarks ? '#10b981' : '#fbbf24' }}>
                          {q.userMarks} / {q.marks} Marks
                        </div>
                      </div>
                      <div style={{ color: '#fff', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
                         <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{(q.text || '').split('\n')[0]}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.5 }} className="custom-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {q.text}
                        </ReactMarkdown>
                      </div>
                      
                      <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16,185,129,0.05)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#10b981', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Step Marking Scheme</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {(q.answerSteps || []).map((step, sIdx) => (
                            <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                              <div style={{ flex: 1, color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.5 }} className="custom-md-opt">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {step.stepText || step.step || step.text}
                                </ReactMarkdown>
                              </div>
                              <div style={{ fontWeight: 600, color: '#fbbf24', fontSize: '0.85rem', flexShrink: 0 }}>
                                [{step.marks} mark{step.marks > 1 ? 's' : ''}]
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
