import { useState } from 'react';
import { CheckCircle, XCircle, Sparkles, AlertCircle, BookOpen, Clock, Activity, Crosshair, ChevronDown, ChevronUp, BarChart2, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function PeriodicTestAnalyticsDashboard({ result, activeQuestions, answers }) {
  const [expandedMistakes, setExpandedMistakes] = useState({});
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  const toggleMistake = (idx) => {
    setExpandedMistakes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const { score, total, aiReview, difficultyStats, topicStats } = result;
  const accuracy = Math.round((score / total) * 100) || 0;
  
  let badge = "Needs Improvement";
  let badgeColor = "#ef4444";
  if (accuracy >= 90) { badge = "Excellent"; badgeColor = "#10b981"; }
  else if (accuracy >= 70) { badge = "Good"; badgeColor = "#3b82f6"; }
  else if (accuracy >= 50) { badge = "Average"; badgeColor = "#fbbf24"; }

  // Mistake Analysis
  const mistakes = activeQuestions.map((q, idx) => ({ ...q, userAns: answers[idx], idx })).filter(q => q.userAns !== q.correctOptionIndex);

  // Topic Sort
  const sortedTopics = Object.entries(topicStats || {}).map(([topic, stats]) => ({
    topic,
    accuracy: Math.round((stats.correct / stats.total) * 100),
    ...stats
  })).sort((a, b) => a.accuracy - b.accuracy);

  // Priorities
  const priorities = sortedTopics.map(t => {
    let level = "Low", color = "#10b981", icon = <CheckCircle size={16} color="#10b981"/>;
    let reason = "Quick revision only";
    let time = 5;
    if (t.accuracy <= 50) {
      level = "High"; color = "#ef4444"; icon = <AlertCircle size={16} color="#ef4444"/>;
      reason = `${t.total - t.correct} incorrect answers`;
      time = 20;
    } else if (t.accuracy < 80) {
      level = "Medium"; color = "#fbbf24"; icon = <AlertCircle size={16} color="#fbbf24"/>;
      reason = "Concept confusion";
      time = 10;
    }
    return { ...t, level, color, reason, time, icon };
  }).filter(t => t.accuracy < 100);

  // Strengths & Weaknesses
  const strengths = [];
  const weaknesses = [];
  
  if (accuracy >= 90) strengths.push("Excellent overall accuracy");
  if (difficultyStats && difficultyStats.Easy && difficultyStats.Easy.correct === difficultyStats.Easy.total && difficultyStats.Easy.total > 0) {
    strengths.push("100% Easy Accuracy");
  } else if (difficultyStats && difficultyStats.Easy && (difficultyStats.Easy.correct / difficultyStats.Easy.total) < 0.7) {
    weaknesses.push("Careless mistakes on Easy questions");
  }
  
  if (difficultyStats && difficultyStats.Hard && (difficultyStats.Hard.correct / difficultyStats.Hard.total) < 0.5) {
    weaknesses.push("Difficulty with application-based (Hard) questions");
  } else if (difficultyStats && difficultyStats.Hard && difficultyStats.Hard.correct === difficultyStats.Hard.total && difficultyStats.Hard.total > 0) {
    strengths.push("Strong problem-solving on Hard questions");
  }
  
  const perfectTopics = sortedTopics.filter(t => t.accuracy === 100 && t.total >= 2);
  perfectTopics.forEach(t => strengths.push(`Strong conceptual understanding of ${t.topic}`));
  
  const weakTopics = sortedTopics.filter(t => t.accuracy <= 50);
  weakTopics.forEach(t => weaknesses.push(`Needs serious review in ${t.topic}`));

  if (mistakes.length === 0) strengths.push("No mistakes made. Flawless execution.");

  let summary = `You answered ${score} out of ${total} questions correctly. `;
  if (mistakes.length === 0) {
    summary += "Your performance is flawless. You have mastered all topics covered in this test.";
  } else {
    if (difficultyStats && difficultyStats.Easy && difficultyStats.Easy.correct === difficultyStats.Easy.total && difficultyStats.Easy.total > 0) {
      summary += "Your fundamentals are strong, with perfect performance in Easy questions. ";
    }
    if (weakTopics.length > 0) {
      summary += `The main area for improvement is ${weakTopics[0].topic}, where accuracy dropped. `;
    }
  }

  let mission = null;
  if (priorities.length > 0) {
    mission = {
      topic: priorities[0].topic,
      goal: `Increase ${priorities[0].topic} Accuracy`,
      time: priorities[0].time,
      currentAcc: priorities[0].accuracy,
      targetAcc: 80
    };
  } else {
    mission = {
      topic: "Advanced Concepts",
      goal: "Maintain 100% Accuracy",
      time: 15,
      currentAcc: 100,
      targetAcc: 100
    };
  }

  const renderProgressBar = (correct, total, color) => (
    <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '8px', overflow: 'hidden', marginTop: '0.5rem' }}>
      <div style={{ width: `${(correct/total)*100}%`, background: color, height: '100%', borderRadius: '4px' }}></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'slideUp 0.5s ease', width: '100%' }}>
      {/* 1. Score Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>🏆 Score</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>{score}<span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.3)' }}>/{total}</span></div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>⏱️ Time</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>
            {result.totalTime ? `${Math.floor(result.totalTime / 60)}m ${result.totalTime % 60}s` : '--'}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* 2. Topic Performance */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BookOpen size={18} color="#a855f7"/> Topic Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sortedTopics.map(t => (
              <div key={t.topic}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#e2e8f0' }}>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '70%' }}>{t.topic}</span>
                  <span style={{ fontWeight: 600 }}>{t.correct}/{t.total} ({t.accuracy}%)</span>
                </div>
                {renderProgressBar(t.correct, t.total, t.accuracy >= 80 ? '#10b981' : t.accuracy >= 50 ? '#fbbf24' : '#ef4444')}
              </div>
            ))}
          </div>
        </div>
        
        {/* 3. Strengths & Weaknesses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '1.5rem', flex: 1 }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={18}/> Verified Strengths</h3>
            {strengths.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {strengths.map((s, i) => <li key={i} style={{ color: '#e2e8f0', fontSize: '0.95rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}><CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }}/> {s}</li>)}
              </ul>
            ) : <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Keep practicing to build your strengths!</div>}
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '1.5rem', flex: 1 }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18}/> Areas to Improve</h3>
            {weaknesses.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {weaknesses.map((w, i) => <li key={i} style={{ color: '#e2e8f0', fontSize: '0.95rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}><XCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }}/> {w}</li>)}
              </ul>
            ) : <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>No major weaknesses detected!</div>}
          </div>
        </div>
      </div>

      {/* 4. AI Insights */}
      <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '16px', padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sparkles size={18}/> AI Insights</h3>
        <div style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {Array.isArray(aiReview) && aiReview.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {aiReview.map((insight, i) => (
                <li key={i}>
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className="custom-md-opt">{insight}</ReactMarkdown>
                </li>
              ))}
            </ul>
          ) : (
             typeof aiReview === 'string' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className="custom-md-opt">{aiReview}</ReactMarkdown>
             ) : <p style={{ margin: 0 }}>Keep up the great work and review your mistakes carefully.</p>
          )}
        </div>
      </div>

      {/* 5. Question Review */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={18} color="#ef4444"/> Question Review</h3>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.2rem' }}>
            <button 
              onClick={() => setShowAllQuestions(false)} 
              style={{ background: !showAllQuestions ? 'rgba(255,255,255,0.1)' : 'transparent', color: !showAllQuestions ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Mistakes Only ({mistakes.length})
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
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Perfect test. No mistakes found.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(showAllQuestions ? activeQuestions.map((q, idx) => ({ ...q, userAns: answers[idx], idx })) : mistakes).map((q, i) => {
              const isExpanded = expandedMistakes[q.idx];
              return (
                <div key={i} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                  <div 
                    onClick={() => toggleMistake(q.idx)}
                    style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 700 }}>Q{q.idx + 1}</span>
                        {q.userAns === q.correctOptionIndex ? (
                           <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700 }}><CheckCircle size={12}/> Correct</span>
                        ) : (
                           <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700 }}><XCircle size={12}/> Incorrect</span>
                        )}
                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', color: '#e2e8f0', marginLeft: '0.2rem' }}>{q.topic || 'General'}</span>
                        <span style={{ background: q.difficulty === 'Easy' ? '#10b98120' : q.difficulty === 'Medium' ? '#fbbf2420' : '#ef444420', color: q.difficulty === 'Easy' ? '#10b981' : q.difficulty === 'Medium' ? '#fbbf24' : '#ef4444', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem' }}>{q.difficulty || 'Medium'}</span>
                        {result.questionTimes && result.questionTimes[q.idx] !== undefined && (
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.5rem' }}><Clock size={12} /> {result.questionTimes[q.idx]}s</span>
                        )}
                      </div>
                      <div style={{ color: '#fff', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60vw' }}>
                         <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{(q.text || q.question || q.Question || q.questionText || '').split('\n')[0]}</ReactMarkdown>
                      </div>
                    </div>
                    <div>{isExpanded ? <ChevronUp size={20} color="rgba(255,255,255,0.5)"/> : <ChevronDown size={20} color="rgba(255,255,255,0.5)"/>}</div>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className="custom-md">
                          {q.text || q.question || q.Question || q.questionText || "*Question text missing*"}
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
                                   {opt}
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

                      {(q.explanation || q.concept || q.misconception) && (
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #3b82f6', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {q.concept && (
                            <div>
                              <span style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Concept: </span>
                              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className="custom-md-opt">
                                  {q.concept}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                          {q.explanation && (
                            <div>
                              <span style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Explanation: </span>
                              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className="custom-md-opt">
                                  {q.explanation}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                          {q.misconception && (
                            <div>
                              <span style={{ color: '#f43f5e', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Common Misconception: </span>
                              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className="custom-md-opt">
                                  {q.misconception}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
