import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import DiagramRenderer from '../DiagramRenderer';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { formatMath } from '../../utils/formatMath';
import { Clock, Trophy, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

export default function LiveQuizPlayer({
  quizState, isActingAdmin, timeRemaining, answers, scores,
  submitAnswer, nextQuestion, startTimer, endQuiz, updateMyScore, currentUser
}) {
  const { status, currentQuestionIndex, questions, quizMode } = quizState;
  const currentQuestion = questions[currentQuestionIndex];
  
  // Find if current user has answered
  const myAnswerRecord = answers.find(a => (a.winnerId || a.userId) === currentUser.phone);
  const mySelectedOption = myAnswerRecord ? myAnswerRecord.optionIndex : null;

  // Has ANYONE answered in fastest mode?
  const fastestWinner = quizMode === 'fastest' ? answers[0] : null;

  // On reveal, calculate scores if not calculated yet
  const [scoreCalculatedForQ, setScoreCalculatedForQ] = useState(-1);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  useEffect(() => {
    if (status === 'revealing' && currentQuestionIndex !== scoreCalculatedForQ) {
      if (mySelectedOption !== null) {
        const isCorrect = mySelectedOption === currentQuestion.correctOptionIndex;
        // My current score data
        const myData = scores.find(s => s.id === currentUser.phone) || { score: 0, correctCount: 0, wrongCount: 0, totalTime: 0 };
        updateMyScore(
          isCorrect ? myData.correctCount + 1 : myData.correctCount,
          !isCorrect ? myData.wrongCount + 1 : myData.wrongCount,
          isCorrect ? myData.score + 2 : myData.score - 1, // +2 for correct, -1 for wrong
          myData.totalTime + (quizState.timePerQuestion - timeRemaining)
        );
      }
      setScoreCalculatedForQ(currentQuestionIndex);
    }
  }, [status, currentQuestionIndex, mySelectedOption, currentQuestion, scores, currentUser, updateMyScore, scoreCalculatedForQ, quizState.timePerQuestion, timeRemaining]);

  if (status === 'finished') {
    return <QuizReportCard scores={scores} onEndQuiz={endQuiz} isActingAdmin={isActingAdmin} />;
  }

  return (
    <div style={styles.container}>
      {/* Header Info */}
      <div style={styles.header}>
        <div style={styles.qIndex}>Question {currentQuestionIndex + 1} of {questions.length}</div>
        <div style={styles.timer(timeRemaining)}>
          <Clock size={18} /> 00:{timeRemaining < 10 ? `0${timeRemaining}` : timeRemaining}
        </div>
      </div>

      {/* Live Leaderboard Toggle */}
      <div style={{ marginBottom: '1.5rem', background: 'var(--surface)', borderRadius: '0.75rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div 
          style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'var(--surface-hover)' }}
          onClick={() => setShowLeaderboard(!showLeaderboard)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            <Trophy size={16} color="#fbbf24" /> Live Scores
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {showLeaderboard ? 'Hide' : 'Show'}
          </div>
        </div>
        {showLeaderboard && (
          <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
            {scores.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '0.5rem 0' }}>No scores yet</div>
            ) : (
              [...scores].sort((a, b) => b.score - a.score).map((s, i) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '0.25rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', width: '24px', fontWeight: 500 }}>#{i + 1}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{s.name} {s.id === currentUser.phone && <span style={{opacity: 0.5}}>(You)</span>}</span>
                  </div>
                  <div style={{ fontWeight: 'bold', color: s.score > 0 ? '#10b981' : (s.score < 0 ? '#ef4444' : 'var(--text-primary)') }}>
                    {s.score} pts
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {status === 'reading' ? (
        <div style={styles.centerBox}>
          <h2>Get Ready!</h2>
          <p>Read the question carefully. Timer will start soon.</p>
          {isActingAdmin && (
            <button className="auth-btn primary" onClick={startTimer} style={{ marginTop: '1rem' }}>
              Start Timer
            </button>
          )}
        </div>
      ) : (
        <div style={styles.qCard}>
          <div className="markdown-body custom-md" style={{ marginBottom: '1.5rem', color: '#fff', fontSize: '1.1rem' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {formatMath(currentQuestion.text)}
            </ReactMarkdown>
            {currentQuestion.diagram && <DiagramRenderer diagram={currentQuestion.diagram} />}
          </div>

          <div style={styles.optionsList}>
            {currentQuestion.options.map((opt, idx) => {
              const isSelectedByMe = mySelectedOption === idx;
              
              let optStateClass = '';
              let badgeText = '';

              if (status === 'revealing') {
                if (idx === currentQuestion.correctOptionIndex) optStateClass = 'correct';
                else if (isSelectedByMe) optStateClass = 'wrong';
                
                // Show who won in fastest mode
                if (quizMode === 'fastest' && fastestWinner?.optionIndex === idx) {
                   badgeText = fastestWinner.winnerId === currentUser.phone ? 'You locked first!' : 'Someone locked first!';
                }
              } else {
                // Active mode
                if (quizMode === 'fastest' && fastestWinner) {
                  if (fastestWinner.optionIndex === idx) {
                    optStateClass = fastestWinner.winnerId === currentUser.phone ? 'locked-mine' : 'locked-other';
                    badgeText = fastestWinner.winnerId === currentUser.phone ? 'You Locked!' : 'Locked!';
                  }
                } else if (isSelectedByMe) {
                  optStateClass = 'selected';
                }
              }

              const disabled = status === 'revealing' || mySelectedOption !== null || (quizMode === 'fastest' && fastestWinner);

              return (
                <div 
                  key={idx} 
                  style={{ ...styles.option, ...styles[optStateClass] }} 
                  onClick={() => !disabled && submitAnswer(currentQuestionIndex, idx)}
                >
                  <div style={{ ...styles.optCircle, ...styles[`circle_${optStateClass}`] }}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div className="markdown-body custom-md" style={{ flex: 1, margin: 0 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {formatMath(opt)}
                    </ReactMarkdown>
                  </div>
                  {badgeText && <span style={styles.badge}>{badgeText}</span>}
                  {status === 'revealing' && idx === currentQuestion.correctOptionIndex && <CheckCircle color="#10b981" size={20} />}
                  {status === 'revealing' && isSelectedByMe && idx !== currentQuestion.correctOptionIndex && <XCircle color="#ef4444" size={20} />}
                </div>
              );
            })}
          </div>

          {status === 'revealing' && isActingAdmin && (
            <button className="auth-btn primary" onClick={nextQuestion} style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }}>
              {currentQuestionIndex >= questions.length - 1 ? 'See Results' : 'Next Question'} <ChevronRight size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function QuizReportCard({ scores, onEndQuiz, isActingAdmin }) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return (
    <div style={styles.container}>
      <div style={styles.reportCard}>
        <Trophy size={48} color="#fbbf24" style={{ margin: '0 auto 1rem', display: 'block' }} />
        <h2 style={{ textAlign: 'center', margin: '0 0 2rem' }}>Quiz Results</h2>
        
        {winner ? (
          <div style={styles.winnerBox}>
            <h3>{winner.name} won!</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Score: {winner.score} pts</p>
          </div>
        ) : (
          <p style={{ textAlign: 'center' }}>No scores recorded.</p>
        )}

        <div style={styles.leaderboard}>
          {sorted.map((s, i) => (
            <div key={s.id} style={styles.lbRow}>
              <span style={{ width: 30, fontWeight: 700, color: i === 0 ? '#fbbf24' : 'inherit' }}>#{i + 1}</span>
              <span style={{ flex: 1 }}>{s.name}</span>
              <span style={{ color: '#10b981', margin: '0 10px' }}>{s.correctCount}✔</span>
              <span style={{ color: '#ef4444', margin: '0 10px' }}>{s.wrongCount}✖</span>
              <span style={{ fontWeight: 700 }}>{s.score} pts</span>
            </div>
          ))}
        </div>

        {isActingAdmin && (
          <button className="auth-btn secondary" onClick={onEndQuiz} style={{ marginTop: '2rem', width: '100%' }}>
            End Quiz & Return to Chat
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100%', display: 'flex', flexDirection: 'column', 
    background: '#0f172a', padding: '1.5rem', borderRadius: '12px', overflowY: 'auto'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  qIndex: { fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' },
  timer: (rem) => ({
    display: 'flex', alignItems: 'center', gap: '0.4rem', 
    background: rem <= 5 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.1)',
    color: rem <= 5 ? '#ef4444' : '#fff',
    padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 700,
    animation: rem <= 5 ? 'pulse 1s infinite' : 'none'
  }),
  centerBox: { margin: 'auto', textAlign: 'center', color: '#fff' },
  qCard: { flex: 1, display: 'flex', flexDirection: 'column' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  option: {
    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', 
    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s'
  },
  optCircle: {
    width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)'
  },
  selected: { background: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.4)' },
  circle_selected: { borderColor: '#fbbf24', color: '#fbbf24' },
  locked_mine: { background: 'rgba(59,130,246,0.1)', borderColor: '#3b82f6' },
  circle_locked_mine: { borderColor: '#3b82f6', color: '#3b82f6' },
  locked_other: { opacity: 0.5 },
  correct: { background: 'rgba(16,185,129,0.1)', borderColor: '#10b981' },
  circle_correct: { borderColor: '#10b981', color: '#10b981', background: '#10b981' },
  wrong: { background: 'rgba(239,68,68,0.1)', borderColor: '#ef4444' },
  circle_wrong: { borderColor: '#ef4444', color: '#ef4444', background: '#ef4444' },
  badge: { fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' },
  reportCard: { maxWidth: 500, margin: 'auto', width: '100%', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' },
  winnerBox: { textAlign: 'center', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' },
  leaderboard: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  lbRow: { display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }
};
