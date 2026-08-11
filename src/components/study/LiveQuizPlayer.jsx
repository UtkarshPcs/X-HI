import React, { useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import DiagramRenderer from '../DiagramRenderer';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { formatMath } from '../../utils/formatMath';
import { Clock, Trophy, ChevronRight, CheckCircle, XCircle, Zap, TrendingUp, TrendingDown, Minus, Crown, BookOpen, Hash, Users, ListOrdered, RefreshCw, Star, Bookmark } from 'lucide-react';
import { addBookmark, removeBookmark, checkIsBookmarked } from '../../services/starBatchBookmarkService';

// ── Medal / rank helpers ─────────────────────────────────────────────────────
const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['#F5C542', '#cbd5e1', '#b45309'];
const RANK_GLOWS = [
  'rgba(245,197,66,0.2)',
  'rgba(203,213,225,0.1)',
  'rgba(180,83,9,0.1)'
];

function getInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Compact score strip (shown during active questions) ──────────────────────
function CompactScoreStrip({ scores, currentUserPhone }) {
  const sorted = useMemo(() => [...scores].sort((a, b) => b.score - a.score), [scores]);
  const myRank = sorted.findIndex(s => s.id === currentUserPhone);
  const myScore = sorted[myRank];

  if (scores.length === 0) return null;

  return (
    <div style={stripStyles.root}>
      {/* Top 3 mini avatars */}
      <div style={stripStyles.podium}>
        {sorted.slice(0, 3).map((s, i) => (
          <div key={s.id} style={{
            ...stripStyles.miniAvatar,
            background: RANK_GLOWS[i],
            border: `1.5px solid ${RANK_COLORS[i] || 'rgba(255,255,255,0.1)'}`,
            ...(s.id === currentUserPhone ? { boxShadow: `0 0 0 2px ${RANK_COLORS[i]}` } : {}),
          }} title={`#${i + 1} ${s.name}: ${s.score}pts`}>
            <span style={{ fontSize: '0.55rem', fontWeight: 700, color: RANK_COLORS[i] || '#fff' }}>
              {getInitials(s.name)}
            </span>
          </div>
        ))}
        {sorted.length > 3 && (
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.15rem' }}>
            +{sorted.length - 3}
          </span>
        )}
      </div>

      {/* My rank + score */}
      {myScore && (
        <div style={stripStyles.myInfo}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>You</span>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700,
            color: myRank < 3 ? RANK_COLORS[myRank] : '#fff',
          }}>
            #{myRank + 1}
          </span>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700,
            color: myScore.score > 0 ? '#10b981' : myScore.score < 0 ? '#ef4444' : 'rgba(255,255,255,0.6)',
          }}>
            {myScore.score}pts
          </span>
        </div>
      )}
    </div>
  );
}

const stripStyles = {
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.4rem 0.75rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    marginBottom: '1rem',
  },
  podium: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  miniAvatar: {
    width: 26, height: 26, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  myInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
};

// ── Full leaderboard panel (shown during reading/revealing) ──────────────────
function LeaderboardPanel({ scores, currentUserPhone, compact = false }) {
  const sorted = useMemo(() => [...scores].sort((a, b) => b.score - a.score), [scores]);
  const maxScore = sorted.length > 0 ? Math.max(sorted[0]?.score || 1, 1) : 1;

  if (scores.length === 0) {
    return (
      <div style={lbStyles.empty}>
        <Trophy size={20} style={{ opacity: 0.3 }} />
        <span>Scores will appear here after the first question</span>
      </div>
    );
  }

  return (
    <div style={{ ...lbStyles.root, ...(compact ? { padding: '0.5rem' } : {}) }}>
      {/* Title */}
      <div style={lbStyles.titleRow}>
        <div style={lbStyles.titleLeft}>
          <Crown size={16} color="#fbbf24" />
          <span style={lbStyles.titleText}>Leaderboard</span>
        </div>
        <span style={lbStyles.playerCount}>{sorted.length} player{sorted.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Entries */}
      <div style={lbStyles.list}>
        {sorted.map((s, i) => {
          const isMe = s.id === currentUserPhone;
          const barWidth = Math.max(((s.score / maxScore) * 100), 8);
          const rankColor = RANK_COLORS[i] || 'rgba(255,255,255,0.3)';

          return (
            <div
              key={s.id}
              style={{
                ...lbStyles.entry,
                ...(isMe ? lbStyles.entryMe : {}),
                ...(i < 3 ? { borderLeft: `3px solid ${rankColor}` } : {}),
                animationDelay: `${i * 60}ms`,
              }}
              className="animate-fade-in"
            >
              {/* Rank */}
              <div style={{ ...lbStyles.rank, color: rankColor }}>
                {i < 3 ? (
                  <span style={{ fontSize: '1.1rem' }}>{RANK_MEDALS[i]}</span>
                ) : (
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>#{i + 1}</span>
                )}
              </div>

              {/* Avatar + Name */}
              <div style={lbStyles.nameCol}>
                <div style={{
                  ...lbStyles.avatar,
                  background: i < 3 ? RANK_GLOWS[i] : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${i < 3 ? rankColor : 'rgba(255,255,255,0.1)'}`,
                }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: i < 3 ? rankColor : 'rgba(255,255,255,0.5)' }}>
                    {getInitials(s.name)}
                  </span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    ...lbStyles.name,
                    ...(isMe ? { color: '#fff', fontWeight: 700 } : {}),
                  }}>
                    {s.name} {isMe && <span style={lbStyles.youBadge}>YOU</span>}
                  </div>
                  {/* Score bar */}
                  <div style={lbStyles.barTrack}>
                    <div style={{
                      ...lbStyles.barFill,
                      width: `${Math.max(barWidth, 0)}%`,
                      background: s.score > 0
                        ? `linear-gradient(90deg, ${i < 3 ? rankColor : '#7C5CFF'}, ${i < 3 ? rankColor + '88' : '#7C5CFF88'})`
                        : s.score < 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)',
                    }} />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={lbStyles.statsCol}>
                <div style={lbStyles.scoreValue}>
                  {s.score > 0 && <TrendingUp size={12} color="#22C55E" />}
                  {s.score < 0 && <TrendingDown size={12} color="#EF4444" />}
                  {s.score === 0 && <Minus size={12} color="rgba(255,255,255,0.3)" />}
                  <span style={{
                    fontWeight: 800, fontSize: '0.95rem',
                    color: s.score > 0 ? '#22C55E' : s.score < 0 ? '#EF4444' : 'rgba(255,255,255,0.5)',
                  }}>
                    {s.score}
                  </span>
                </div>
                <div style={lbStyles.statsMini}>
                  <span style={{ color: '#22C55E' }}>{s.correctCount || 0}✓</span>
                  <span style={{ color: '#EF4444' }}>{s.wrongCount || 0}✗</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const lbStyles = {
  root: {
    background: '#151B2E',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '0.75rem',
    overflow: 'hidden',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 0.25rem 0.6rem',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '0.5rem',
  },
  titleLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  titleText: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  playerCount: {
    fontSize: '0.72rem',
    color: 'rgba(255,255,255,0.35)',
    fontWeight: 500,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    maxHeight: '220px',
    overflowY: 'auto',
  },
  entry: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.55rem 0.6rem',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    transition: 'background 0.2s',
    borderLeft: '3px solid transparent',
  },
  entryMe: {
    background: 'rgba(124,92,255,0.08)',
    border: '1px solid rgba(124,92,255,0.2)',
  },
  rank: {
    width: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nameCol: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  avatar: {
    width: 30, height: 30, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  name: {
    fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  youBadge: {
    fontSize: '0.55rem',
    fontWeight: 700,
    color: '#7C5CFF',
    background: 'rgba(124,92,255,0.15)',
    padding: '0.05rem 0.3rem',
    borderRadius: '4px',
    letterSpacing: '0.05em',
  },
  barTrack: {
    height: 3,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    marginTop: '0.2rem',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.5s ease',
  },
  statsCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.1rem',
    flexShrink: 0,
  },
  scoreValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.2rem',
  },
  statsMini: {
    display: 'flex',
    gap: '0.4rem',
    fontSize: '0.65rem',
    fontWeight: 600,
    opacity: 0.7,
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '1.5rem',
    color: 'rgba(255,255,255,0.3)',
    fontSize: '0.85rem',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '14px',
    border: '1px dashed rgba(255,255,255,0.08)',
  },
};

// ── Main Quiz Player ─────────────────────────────────────────────────────────
export default function LiveQuizPlayer({
  quizState, isActingAdmin, timeRemaining, answers, scores,
  submitAnswer, nextQuestion, startTimer, endQuiz, updateMyScore, replaceCurrentQuestion, currentUser
}) {
  const { status, currentQuestionIndex, questions, quizMode } = quizState;
  const currentQuestion = questions[currentQuestionIndex];

  // Filter answers to only the CURRENT question
  const currentAnswers = answers.filter(a => {
    if (quizMode === 'fastest') {
      return a.id === `q_${currentQuestionIndex}`;
    }
    return a.id.startsWith(`q_${currentQuestionIndex}_`);
  });

  // Find if current user has answered THIS question
  const myAnswerRecord = currentAnswers.find(a => (a.winnerId || a.userId) === currentUser.phone);
  const mySelectedOption = myAnswerRecord ? myAnswerRecord.optionIndex : null;

  // Has ANYONE answered the CURRENT question in fastest mode?
  const fastestWinner = quizMode === 'fastest' ? currentAnswers[0] || null : null;

  // Optimistic local selection — shows instantly before Firestore confirms
  const [optimisticOption, setOptimisticOption] = useState(null);
  const [optimisticForQ, setOptimisticForQ] = useState(null);

  // Bookmark state
  const [bookmarking, setBookmarking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!currentQuestion || !currentUser || !quizState.testId) return;
    const docId = `${quizState.chapterId}_${currentQuestion.originalIndex}`;
    checkIsBookmarked(currentUser.id || currentUser.phone, docId)
      .then(setIsBookmarked)
      .catch(console.error);
  }, [currentQuestion, currentUser, quizState.testId, quizState.chapterId]);

  async function handleToggleBookmark() {
    if (!currentQuestion || !currentUser || bookmarking) return;
    setBookmarking(true);
    const userId = currentUser.id || currentUser.phone;
    const docId = `${quizState.chapterId}_${currentQuestion.originalIndex}`;
    
    try {
      if (isBookmarked) {
        await removeBookmark(userId, docId);
        setIsBookmarked(false);
      } else {
        await addBookmark(userId, {
          chapterId: quizState.chapterId,
          testId: quizState.testId,
          questionIndex: currentQuestion.originalIndex,
          questionText: currentQuestion.text,
          options: currentQuestion.options,
          correctOptionIndex: currentQuestion.correctOptionIndex,
          topic: currentQuestion.topic || '',
          difficulty: currentQuestion.difficulty || 'Medium',
          testTitle: quizState.chapterTitle || '',
          type: 'objective'
        });
        setIsBookmarked(true);
      }
    } catch(e) {
      console.error(e);
    }
    setBookmarking(false);
  }

  // Reset optimistic state when question or quiz changes
  useEffect(() => {
    const qKey = `${quizState.quizId}_${currentQuestionIndex}`;
    if (qKey !== optimisticForQ) {
      setOptimisticOption(null);
      setOptimisticForQ(qKey);
    }
  }, [currentQuestionIndex, quizState.quizId, optimisticForQ]);

  // Merge: use server-confirmed answer if available, otherwise use optimistic
  let effectiveSelectedOption = null;
  if (quizMode === 'fastest') {
    if (fastestWinner?.winnerId === currentUser.phone) {
      effectiveSelectedOption = fastestWinner.optionIndex;
    } else if (!fastestWinner && optimisticOption !== null) {
      effectiveSelectedOption = optimisticOption;
    }
  } else {
    effectiveSelectedOption = optimisticOption !== null ? optimisticOption : mySelectedOption;
  }

  // On reveal, calculate scores if not calculated yet
  const [scoreCalculatedForQ, setScoreCalculatedForQ] = useState(-1);

  useEffect(() => {
    if (status === 'revealing' && currentQuestionIndex !== scoreCalculatedForQ) {
      if (effectiveSelectedOption !== null) {
        const isCorrect = effectiveSelectedOption === currentQuestion.correctOptionIndex;
        const myData = scores.find(s => s.id === currentUser.phone) || { score: 0, correctCount: 0, wrongCount: 0, totalTime: 0, scoredIndices: [] };
        
        if (!myData.scoredIndices?.includes(currentQuestionIndex)) {
          const newScoredIndices = [...(myData.scoredIndices || []), currentQuestionIndex];
          updateMyScore(
            isCorrect ? myData.correctCount + 1 : myData.correctCount,
            !isCorrect ? myData.wrongCount + 1 : myData.wrongCount,
            isCorrect ? myData.score + 2 : myData.score - 1,
            myData.totalTime + (quizState.timePerQuestion - timeRemaining),
            newScoredIndices
          );
        }
      }
      setScoreCalculatedForQ(currentQuestionIndex);
    }
  }, [status, currentQuestionIndex, effectiveSelectedOption, currentQuestion, scores, currentUser, updateMyScore, scoreCalculatedForQ, quizState.timePerQuestion, timeRemaining]);

  if (status === 'finished') {
    return <QuizReportCard scores={scores} onEndQuiz={endQuiz} isActingAdmin={isActingAdmin} currentUserPhone={currentUser.phone} />;
  }

  // Should the full leaderboard show? Only during reading/revealing (not during active answering)
  const showFullLeaderboard = status === 'reading' || status === 'revealing';

  return (
    <div style={styles.container}>
      {/* Header Info */}
      <div style={styles.header}>
        <div style={styles.qIndex}>Question {currentQuestionIndex + 1} of {questions.length}</div>
        <div style={styles.timer(timeRemaining)}>
          <Clock size={18} /> 00:{timeRemaining < 10 ? `0${timeRemaining}` : timeRemaining}
        </div>
      </div>

      {/* During active questions: compact score strip only */}
      {status === 'active' && (
        <CompactScoreStrip scores={scores} currentUserPhone={currentUser.phone} />
      )}

      {status === 'reading' ? (
        <div style={styles.readingLayout}>
          {/* Get Ready message */}
          <div style={styles.readyBox}>
            <div style={styles.readyIcon}>
              <Zap size={28} color="#fbbf24" />
            </div>
            <h2 style={styles.readyTitle}>
              {currentQuestionIndex === 0 ? "Quiz Starting!" : "Get Ready!"}
            </h2>
            <p style={styles.readySub}>Read the question carefully. Timer will start soon.</p>

            {currentQuestionIndex === 0 && (
              <div style={styles.metaCard}>
                <div style={styles.metaItem}>
                  <BookOpen size={16} color="var(--primary)" />
                  <div style={styles.metaText}>
                    <span style={styles.metaLabel}>Subject</span>
                    <span style={styles.metaValue}>{quizState.subject || 'N/A'}</span>
                  </div>
                </div>
                <div style={styles.metaItem}>
                  <Hash size={16} color="var(--primary)" />
                  <div style={styles.metaText}>
                    <span style={styles.metaLabel}>Chapter</span>
                    <span style={styles.metaValue} title={quizState.chapterTitle || 'N/A'}>{quizState.chapterTitle || 'N/A'}</span>
                  </div>
                </div>
                <div style={styles.metaItem}>
                  <Users size={16} color="var(--primary)" />
                  <div style={styles.metaText}>
                    <span style={styles.metaLabel}>Mode</span>
                    <span style={styles.metaValue}>{quizState.quizMode === 'fastest' ? 'Fastest Finger First' : 'All Players'}</span>
                  </div>
                </div>
                <div style={styles.metaItem}>
                  <Star size={16} color="var(--primary)" />
                  <div style={styles.metaText}>
                    <span style={styles.metaLabel}>Difficulty</span>
                    <span style={styles.metaValue}>{quizState.difficulty || 'Medium'}</span>
                  </div>
                </div>
                <div style={styles.metaItem}>
                  <ListOrdered size={16} color="var(--primary)" />
                  <div style={styles.metaText}>
                    <span style={styles.metaLabel}>Questions</span>
                    <span style={styles.metaValue}>{questions.length}</span>
                  </div>
                </div>
                <div style={styles.metaItem}>
                  <Clock size={16} color="var(--primary)" />
                  <div style={styles.metaText}>
                    <span style={styles.metaLabel}>Time Limit</span>
                    <span style={styles.metaValue}>{quizState.timePerQuestion}s / Q</span>
                  </div>
                </div>
              </div>
            )}

            {isActingAdmin && (
              <button className="auth-btn primary" onClick={startTimer} style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={16} /> Start Timer
              </button>
            )}
          </div>

          {/* Full leaderboard alongside */}
          {scores.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <LeaderboardPanel scores={scores} currentUserPhone={currentUser.phone} />
            </div>
          )}
        </div>
      ) : (
        <div style={styles.qCard}>
          {/* Question Header & Bookmark */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div className="markdown-body custom-md" style={{ flex: 1, color: '#fff', fontSize: '1.1rem' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {formatMath(currentQuestion.text)}
              </ReactMarkdown>
              {currentQuestion.diagram && <DiagramRenderer diagram={currentQuestion.diagram} />}
            </div>
            
            <button 
              onClick={handleToggleBookmark} 
              disabled={bookmarking}
              style={{ 
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                color: isBookmarked ? '#F5C542' : 'rgba(255,255,255,0.5)', 
                cursor: bookmarking ? 'default' : 'pointer', 
                padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                transition: 'all 0.2s', marginLeft: '1rem', flexShrink: 0
              }}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark Question"}
            >
              <Bookmark size={18} fill={isBookmarked ? '#F5C542' : 'none'} />
            </button>
          </div>

          {/* Options */}
          <div style={styles.optionsList}>
            {currentQuestion.options.map((opt, idx) => {
              const isSelectedByMe = effectiveSelectedOption === idx;
              
              let optStateClass = '';
              let badgeText = '';

              if (status === 'revealing') {
                if (idx === currentQuestion.correctOptionIndex) optStateClass = 'correct';
                else if (isSelectedByMe) optStateClass = 'wrong';
                
                if (quizMode === 'fastest' && fastestWinner?.optionIndex === idx) {
                   badgeText = fastestWinner.winnerId === currentUser.phone ? 'You locked first!' : 'Someone locked first!';
                }
              } else {
                if (quizMode === 'fastest' && fastestWinner) {
                  if (fastestWinner.optionIndex === idx) {
                    optStateClass = fastestWinner.winnerId === currentUser.phone ? 'locked_mine' : 'locked_other';
                    badgeText = fastestWinner.winnerId === currentUser.phone ? 'You Locked!' : 'Locked!';
                  }
                } else if (isSelectedByMe) {
                  optStateClass = 'selected';
                }
              }

              const disabled = status === 'revealing' || (quizMode === 'fastest' && (fastestWinner || effectiveSelectedOption !== null));

              return (
                <div 
                  key={idx} 
                  style={{ ...styles.option, ...styles[optStateClass] }} 
                  onClick={() => {
                    if (disabled) return;
                    const newOption = effectiveSelectedOption === idx ? null : idx;
                    setOptimisticOption(newOption);
                    setOptimisticForQ(currentQuestionIndex);
                    submitAnswer(currentQuestionIndex, newOption);
                  }}
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

          {/* Admin Replace Question Button */}
          {isActingAdmin && status === 'active' && (
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <button 
                className="auth-btn secondary" 
                onClick={() => {
                  if (window.confirm("Replace this question with a new one?")) {
                    replaceCurrentQuestion();
                  }
                }} 
                style={{ 
                  background: 'rgba(239,68,68,0.08)', color: '#EF4444', 
                  border: '1px solid rgba(239,68,68,0.2)', padding: '0.6rem 1.2rem', 
                  fontSize: '0.85rem', display: 'flex', alignItems: 'center', borderRadius: '8px' 
                }}
              >
                <RefreshCw size={14} style={{ marginRight: '8px' }} />
                Replace Question
              </button>
            </div>
          )}

          {/* Reveal phase: show leaderboard + next button */}
          {status === 'revealing' && (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <LeaderboardPanel scores={scores} currentUserPhone={currentUser.phone} />
              {isActingAdmin && (
                <button className="auth-btn primary" onClick={nextQuestion} style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  {currentQuestionIndex >= questions.length - 1 ? 'See Results' : 'Next Question'} <ChevronRight size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Final Report Card ────────────────────────────────────────────────────────
function QuizReportCard({ scores, onEndQuiz, isActingAdmin, currentUserPhone }) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  const myIndex = sorted.findIndex(s => s.id === currentUserPhone);
  const myData = myIndex >= 0 ? sorted[myIndex] : null;
  const myRank = myIndex >= 0 ? myIndex + 1 : '-';
  
  const totalAnswered = myData ? ((myData.correctCount || 0) + (myData.wrongCount || 0)) : 0;
  const avgTime = (myData && totalAnswered > 0 && myData.totalTime) ? (myData.totalTime / totalAnswered).toFixed(1) + 's' : '-';
  const accuracy = (myData && totalAnswered > 0) ? Math.round((myData.correctCount / totalAnswered) * 100) + '%' : '-';

  return (
    <div style={styles.container}>
      <div style={styles.reportCard}>
        {/* Trophy + confetti vibes */}
        <div style={styles.reportHeader}>
          <div style={styles.trophyGlow}>
            <Trophy size={36} color="#fbbf24" strokeWidth={1.5} />
          </div>
          <h2 style={styles.reportTitle}>Quiz Complete!</h2>
        </div>
        
        {winner ? (
          <div style={styles.winnerBox}>
            <div style={styles.winnerMedal}>🏆</div>
            <h3 style={styles.winnerName}>{winner.name}</h3>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              {winner.score} points · {winner.correctCount || 0} correct
            </p>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No scores recorded.</p>
        )}

        {/* YOUR STATS CARD */}
        {myData && (
          <div style={styles.myStatsCard}>
            <div style={styles.myStatsHeader}>Your Stats</div>
            <div style={styles.myStatsGrid}>
              <div style={styles.statBox}>
                <div style={styles.statValueRank}>#{myRank}</div>
                <div style={styles.statLabel}>Rank</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValueScore}>{myData.score}</div>
                <div style={styles.statLabel}>Score</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValueCorrect}>{myData.correctCount || 0}</div>
                <div style={styles.statLabel}>Correct</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValueAcc}>{accuracy}</div>
                <div style={styles.statLabel}>Accuracy</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValueTime}>{avgTime}</div>
                <div style={styles.statLabel}>Avg Time</div>
              </div>
            </div>
          </div>
        )}

        {/* Full leaderboard */}
        <LeaderboardPanel scores={scores} currentUserPhone={currentUserPhone} />

        {isActingAdmin && (
          <button className="auth-btn secondary" onClick={onEndQuiz} style={{ marginTop: '0.5rem', width: '100%', padding: '1rem', background: '#27272a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600 }}>
            End Quiz & Return to Chat
          </button>
        )}
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  container: {
    height: '100%', display: 'flex', flexDirection: 'column', 
    background: '#0B1220', padding: '1.5rem', borderRadius: '12px', overflowY: 'auto'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  qIndex: { fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' },
  timer: (rem) => ({
    display: 'flex', alignItems: 'center', gap: '0.4rem', 
    background: rem <= 5 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.1)',
    color: rem <= 5 ? '#EF4444' : '#fff',
    padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 700,
    animation: rem <= 5 ? 'pulse 1s infinite' : 'none'
  }),

  // Reading state
  readingLayout: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  readyBox: {
    textAlign: 'center',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  readyIcon: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'rgba(245,197,66,0.1)',
    border: '1px solid rgba(245,197,66,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '0.25rem',
  },
  readyTitle: {
    fontSize: '1.4rem',
    fontWeight: 800,
    margin: 0,
    fontFamily: 'Outfit, sans-serif',
  },
  readySub: {
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
    maxWidth: 300,
  },
  metaCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    background: '#151B2E',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem',
    marginTop: '0.75rem',
    width: '100%',
    maxWidth: 320,
    textAlign: 'left'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  metaText: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flex: 1
  },
  metaLabel: {
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.1rem'
  },
  metaValue: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  // Question card
  qCard: { flex: 1, display: 'flex', flexDirection: 'column' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  option: {
    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
    background: '#151B2E', border: '1px solid rgba(255,255,255,0.06)', 
    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s'
  },
  optCircle: {
    width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)'
  },
  selected: { background: 'rgba(245,197,66,0.1)', borderColor: 'rgba(245,197,66,0.4)' },
  circle_selected: { borderColor: '#F5C542', color: '#F5C542' },
  locked_mine: { background: 'rgba(124,92,255,0.1)', borderColor: '#7C5CFF' },
  circle_locked_mine: { borderColor: '#7C5CFF', color: '#7C5CFF' },
  locked_other: { opacity: 0.5 },
  correct: { background: 'rgba(34,197,94,0.1)', borderColor: '#22C55E' },
  circle_correct: { borderColor: '#22C55E', color: '#22C55E', background: '#22C55E' },
  wrong: { background: 'rgba(239,68,68,0.1)', borderColor: '#EF4444' },
  circle_wrong: { borderColor: '#EF4444', color: '#EF4444', background: '#EF4444' },
  badge: { fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' },

  // Report card
  reportCard: {
    maxWidth: 500, margin: 'auto', width: '100%',
    background: '#151B2E',
    padding: '2rem', borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex', flexDirection: 'column', gap: '1.25rem',
  },
  reportHeader: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
  },
  trophyGlow: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'rgba(245,197,66,0.1)',
    border: '1px solid rgba(245,197,66,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  reportTitle: {
    textAlign: 'center', margin: 0, fontSize: '1.4rem', fontWeight: 800,
    fontFamily: 'Outfit, sans-serif', color: '#fff',
  },
  winnerBox: {
    textAlign: 'center',
    background: 'linear-gradient(135deg, rgba(245,197,66,0.08), rgba(245,197,66,0.02))',
    border: '1px solid rgba(245,197,66,0.2)',
    padding: '1.25rem', borderRadius: '14px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
  },
  winnerMedal: {
    fontSize: '2rem', lineHeight: 1, marginBottom: '0.25rem',
  },
  winnerName: {
    margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#F5C542',
  },
  
  // My Stats Card
  myStatsCard: {
    background: '#151B2E',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '1rem',
  },
  myStatsHeader: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 700,
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
    textAlign: 'center'
  },
  myStatsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '1rem',
    textAlign: 'center'
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.2rem',
    minWidth: '60px'
  },
  statLabel: {
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase'
  },
  statValueRank: { fontSize: '1.1rem', fontWeight: 700, color: '#F5C542' },
  statValueScore: { fontSize: '1.1rem', fontWeight: 700, color: '#7C5CFF' },
  statValueCorrect: { fontSize: '1.1rem', fontWeight: 700, color: '#22C55E' },
  statValueAcc: { fontSize: '1.1rem', fontWeight: 700, color: '#7C5CFF' },
  statValueTime: { fontSize: '1.1rem', fontWeight: 700, color: '#fff' },
};

