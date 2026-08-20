import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Crown, Medal, Filter, Star, BookOpen, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getGlobalLeaderboard } from '../services/globalQuizLeaderboardService';

export default function GlobalQuizLeaderboardPage({ embedded = false }) {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('total'); // total, subject, difficulty
  const [filterValue, setFilterValue] = useState('');
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaders() {
      setLoading(true);
      try {
        const data = await getGlobalLeaderboard(filterType, filterValue);
        setLeaders(data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaders();
  }, [filterType, filterValue]);

  const RANK_MEDALS = ['🥇', '🥈', '🥉'];
  const RANK_COLORS = ['#fbbf24', '#cbd5e1', '#b45309'];
  const RANK_GLOWS = ['rgba(251,191,36,0.1)', 'rgba(203,213,225,0.05)', 'rgba(180,83,9,0.05)'];

  function getInitials(name) {
    return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  return (
    <div className={!embedded ? "as-container" : ""} style={{ paddingBottom: embedded ? '0' : '3rem', minHeight: embedded ? 'auto' : '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      {!embedded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
          <button className="as-icon-btn" onClick={() => navigate(-1)} style={{ background: 'var(--surface)' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="as-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown color="#fbbf24" size={28} /> Global Quiz Leaderboard
          </h1>
        </div>
      )}

      <p className="as-muted" style={{ marginBottom: '2rem' }}>
        See who is dominating the Elite Star Batch Room Quizzes. Rankings are updated in real-time when quizzes finish.
      </p>

      {/* Filters */}
      <div className="as-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
          <Filter size={18} /> Filters
        </div>

        <select
          className="as-input"
          style={{ width: 'auto', minWidth: '150px' }}
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setFilterValue('');
          }}
        >
          <option value="total">Overall Total Wins</option>
          <option value="subject">By Subject</option>
          <option value="difficulty">By Difficulty</option>
        </select>

        {filterType === 'subject' && (
          <select
            className="as-input"
            style={{ width: 'auto', minWidth: '150px' }}
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          >
            <option value="">Select Subject</option>
            <option value="science">Science</option>
            <option value="math">Mathematics</option>
            <option value="sst">Social Science</option>
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
          </select>
        )}

        {filterType === 'difficulty' && (
          <select
            className="as-input"
            style={{ width: 'auto', minWidth: '150px' }}
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          >
            <option value="">Select Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Legendary">Legendary</option>
          </select>
        )}
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          Loading leaderboard...
        </div>
      ) : leaders.length === 0 ? (
        <div className="as-card" style={{ textAlign: 'center', padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Trophy size={48} color="var(--border)" />
          <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>No winners found for this category yet.</h3>
          <p style={{ margin: 0, opacity: 0.6 }}>Start a room quiz and be the first to claim the throne!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {leaders.map((s, i) => {
            const r = i;
            const rankColor = RANK_COLORS[r] || 'rgba(255,255,255,0.2)';

            return (
              <div
                key={s.id}
                className="as-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  gap: '1rem',
                  ...(r < 3 ? { 
                    borderLeft: `4px solid ${rankColor}`,
                    background: RANK_GLOWS[r],
                    borderColor: rankColor
                  } : {
                    borderLeft: '4px solid transparent'
                  }),
                }}
              >
                {/* Rank */}
                <div style={{ width: '40px', textAlign: 'center', fontWeight: 800, fontSize: r < 3 ? '1.5rem' : '1.1rem', color: rankColor }}>
                  {r < 3 ? RANK_MEDALS[r] : `#${r + 1}`}
                </div>

                {/* Avatar */}
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: r < 3 ? RANK_GLOWS[r] : 'var(--surface-light)',
                  border: `2px solid ${r < 3 ? rankColor : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: r < 3 ? rankColor : 'var(--text-muted)',
                  fontWeight: 800
                }}>
                  {getInitials(s.name)}
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.name}
                  </div>
                  {r === 0 && <div style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Crown size={12}/> Reigning Champion</div>}
                </div>

                {/* Score */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {s.displayScore}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {s.displayScore === 1 ? 'Win' : 'Wins'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
