import { useState } from 'react';
import { CheckCircle, XCircle, Sparkles, AlertCircle, BookOpen, Clock, Activity, Target, ChevronUp, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { formatMath } from '../utils/formatMath';
import DiagramRenderer from './DiagramRenderer';

export default function SubjectiveTestAnalyticsDashboard({ result, activeQuestions, averageScore, test }) {
  const [expandedMistakes, setExpandedMistakes] = useState({});
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [expandedObjMistakes, setExpandedObjMistakes] = useState({});
  const [showAllObjQuestions, setShowAllObjQuestions] = useState(false);

  const toggleMistake = (idx) => {
    setExpandedMistakes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };
  const toggleObjMistake = (idx) => {
    setExpandedObjMistakes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const { marksObtained, totalMarks, responses, aiReview, difficultyStats, topicStats, totalTime, mixedObjResult } = result;
  
  const isMixed = !!mixedObjResult;
  const objRes = mixedObjResult || {};

  const finalMarksObtained = marksObtained + (isMixed ? (objRes.score || 0) : 0);
  const finalTotalMarks = totalMarks + (isMixed ? (objRes.total || 0) : 0);
  const finalTotalTime = (totalTime || 0) + (isMixed ? (objRes.totalTime || 0) : 0);

  // Calculate accuracy based on total marks
  const accuracy = finalTotalMarks > 0 ? Math.round((finalMarksObtained / finalTotalMarks) * 100) : 0;
  
  let badge = "Needs Improvement";
  let badgeColor = "#ef4444";
  if (accuracy >= 90) { badge = "Excellent"; badgeColor = "#10b981"; }
  else if (accuracy >= 70) { badge = "Good"; badgeColor = "#3b82f6"; }
  else if (accuracy >= 50) { badge = "Average"; badgeColor = "#fbbf24"; }

  // Mistake Analysis (any question where user got less than full marks)
  const allQsWithScores = activeQuestions.map((q, idx) => ({ ...q, userMarks: responses[idx] || 0, idx }));
  const mistakes = allQsWithScores.filter(q => q.userMarks < q.marks);

  const objQsWithScores = (isMixed && objRes.activeQuestions) ? objRes.activeQuestions.map((q, idx) => {
    const userAns = objRes.responses ? objRes.responses[idx] : undefined;
    const isCorrect = userAns === q.correctOptionIndex;
    return { ...q, userAns, isCorrect, idx };
  }) : [];
  const objMistakes = objQsWithScores.filter(q => !q.isCorrect);

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

  if (isMixed) {
      if (objRes.difficultyStats) {
          Object.entries(objRes.difficultyStats).forEach(([diff, stat]) => {
              const d = diff || 'Medium';
              if (!difficultyStatsCalc[d]) difficultyStatsCalc[d] = {m:0, t:0};
              difficultyStatsCalc[d].t += stat.total;
              difficultyStatsCalc[d].m += stat.correct;
          });
      }
      if (objRes.topicStats) {
          Object.entries(objRes.topicStats).forEach(([topic, stat]) => {
              const t = topic || 'General';
              if (!topicStatsCalc[t]) topicStatsCalc[t] = {m:0, t:0};
              topicStatsCalc[t].t += stat.total;
              topicStatsCalc[t].m += stat.correct;
          });
      }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'slideUp 0.5s ease', width: '100%' }}>
      {/* 1. Score Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>🏆 Score</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>{finalMarksObtained}<span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.3)' }}>/{finalTotalMarks}</span></div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>⏱️ Time</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>
            {finalTotalTime ? `${Math.floor(finalTotalTime / 60)}m ${finalTotalTime % 60}s` : '--'}
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

      {isMixed && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
             <h3 style={{ margin: '0 0 1rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               Objective vs Subjective Marks
             </h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                   <span style={{ color: 'rgba(255,255,255,0.8)' }}>Objective</span>
                   <span style={{ fontWeight: 700, color: '#60a5fa' }}>{objRes.score || 0} / {objRes.total || 0} Marks</span>
                 </div>
                 {renderProgressBar(objRes.score || 0, objRes.total || 0, '#60a5fa')}
               </div>
               <div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                   <span style={{ color: 'rgba(255,255,255,0.8)' }}>Subjective</span>
                   <span style={{ fontWeight: 700, color: '#c084fc' }}>{marksObtained || 0} / {totalMarks || 0} Marks</span>
                 </div>
                 {renderProgressBar(marksObtained || 0, totalMarks || 0, '#c084fc')}
               </div>
             </div>
          </div>
          <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
             <h3 style={{ margin: '0 0 1rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               Objective vs Subjective Time
             </h3>
             <div style={{ display: 'flex', gap: '1rem', height: '80px', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                   <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa' }}>{objRes.totalTime ? `${Math.floor(objRes.totalTime / 60)}m ${objRes.totalTime % 60}s` : '--'}</span>
                   <div style={{ height: `${finalTotalTime > 0 ? (objRes.totalTime / finalTotalTime)*100 : 0}%`, minHeight: '10px', background: '#60a5fa', width: '30px', borderRadius: '4px 4px 0 0' }}></div>
                   <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Objective</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                   <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c084fc' }}>{totalTime ? `${Math.floor(totalTime / 60)}m ${totalTime % 60}s` : '--'}</span>
                   <div style={{ height: `${finalTotalTime > 0 ? (totalTime / finalTotalTime)*100 : 0}%`, minHeight: '10px', background: '#c084fc', width: '30px', borderRadius: '4px 4px 0 0' }}></div>
                   <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Subjective</span>
                </div>
             </div>
          </div>
        </div>
      )}

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

      {/* Objective Question Review */}
      {isMixed && objQsWithScores.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={18} color="#60a5fa"/> Objective Review</h3>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.2rem' }}>
              <button 
                onClick={() => setShowAllObjQuestions(false)} 
                style={{ background: !showAllObjQuestions ? 'rgba(255,255,255,0.1)' : 'transparent', color: !showAllObjQuestions ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Mistakes ({objMistakes.length})
              </button>
              <button 
                onClick={() => setShowAllObjQuestions(true)} 
                style={{ background: showAllObjQuestions ? 'rgba(255,255,255,0.1)' : 'transparent', color: showAllObjQuestions ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                All ({objQsWithScores.length})
              </button>
            </div>
          </div>

          {(!showAllObjQuestions && objMistakes.length === 0) ? (
            <div style={{ textAlign: 'center', color: '#10b981', padding: '2rem', background: 'rgba(16,185,129,0.05)', borderRadius: '12px' }}>
              <CheckCircle size={32} style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Perfect execution in the Objective section!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(showAllObjQuestions ? objQsWithScores : objMistakes).map((q, i) => {
                const isExpanded = expandedObjMistakes[q.idx];
                return (
                  <div key={i} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                    <div 
                      onClick={() => toggleObjMistake(q.idx)}
                      style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 700 }}>Q{q.idx + 1}</span>
                          {q.isCorrect ? (
                             <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700 }}><CheckCircle size={12}/> Correct</span>
                          ) : (
                             <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700 }}><XCircle size={12}/> Incorrect</span>
                          )}
                          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', color: '#e2e8f0', marginLeft: '0.2rem' }}>{q.topic || 'General'}</span>
                          <span style={{ background: q.difficulty === 'Easy' ? '#10b98120' : q.difficulty === 'Medium' ? '#fbbf2420' : '#ef444420', color: q.difficulty === 'Easy' ? '#10b981' : q.difficulty === 'Medium' ? '#fbbf24' : '#ef4444', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem' }}>{q.difficulty || 'Medium'}</span>
                          {objRes.questionTimes && objRes.questionTimes[q.idx] !== undefined && (
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.5rem' }}><Clock size={12} /> {objRes.questionTimes[q.idx]}s</span>
                          )}
                        </div>
                        <div style={{ color: '#fff', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
                           <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatMath((q.text || '').split('\n')[0])}</ReactMarkdown>
                        </div>
                      </div>
                      <div>{isExpanded ? <ChevronUp size={20} color="rgba(255,255,255,0.5)"/> : <ChevronDown size={20} color="rgba(255,255,255,0.5)"/>}</div>
                    </div>
                    
                    {isExpanded && (
                      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.5 }} className="custom-md">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {formatMath(q.text)}
                          </ReactMarkdown>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                          {(q.options || []).map((opt, oIdx) => {
                            const isCorrect = oIdx === q.correctOptionIndex;
                            const isSelected = oIdx === q.userAns;
                            let bgColor = 'rgba(255,255,255,0.03)';
                            let borderColor = 'rgba(255,255,255,0.08)';
                            let textColor = '#e2e8f0';
                            let icon = null;

                            if (isCorrect) {
                              bgColor = 'rgba(16,185,129,0.1)';
                              borderColor = 'rgba(16,185,129,0.3)';
                              textColor = '#10b981';
                              icon = <CheckCircle size={16} color="#10b981" />;
                            } else if (isSelected) {
                              bgColor = 'rgba(239,68,68,0.1)';
                              borderColor = 'rgba(239,68,68,0.3)';
                              textColor = '#ef4444';
                              icon = <XCircle size={16} color="#ef4444" />;
                            }

                            return (
                              <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: bgColor, border: `1px solid ${borderColor}`, padding: '0.75rem 1rem', borderRadius: '12px' }}>
                                 <div style={{ color: textColor, fontWeight: 700, width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${borderColor}`, borderRadius: '50%' }}>
                                   {String.fromCharCode(65 + oIdx)}
                                 </div>
                                 <div style={{ color: textColor, flex: 1, fontSize: '0.95rem' }}>
                                   <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className="custom-md-opt">
                                     {formatMath(opt)}
                                   </ReactMarkdown>
                                 </div>
                                 {icon && <div>{icon}</div>}
                                 {isSelected && !isCorrect && <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>Your Answer</span>}
                              </div>
                            );
                          })}
                          {q.userAns === undefined && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <AlertCircle size={14} /> You did not answer this question.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subjective Question Review (Mistakes vs All) */}
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
                         <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatMath((q.text || '').split('\n')[0])}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.5 }} className="custom-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {formatMath(q.text)}
                        </ReactMarkdown>
                      </div>
                      
                      {q.diagram && (
                        <div style={{ margin: '1rem 0' }}>
                          <DiagramRenderer diagram={q.diagram} />
                        </div>
                      )}
                      
                      <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16,185,129,0.05)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#10b981', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Step Marking Scheme</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {(q.answerSteps || []).map((step, sIdx) => (
                            <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                              <div style={{ flex: 1, color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.5 }} className="custom-md-opt">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {formatMath(step.stepText || step.step || step.text)}
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
