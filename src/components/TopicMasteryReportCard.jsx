import { useState, useEffect, useMemo } from 'react';
import { Sparkles, BookOpen, TrendingUp, AlertTriangle, CheckCircle, Lock, Loader2, Info } from 'lucide-react';
import {
  getAllTestsForSubject,
  computeConceptStats,
  classifyConceptStats,
  getSubjectReportCard,
  saveSubjectReportCard,
} from '../services/periodicPredictedService';

/**
 * Generates a short, stable hash string from conceptStats for cache invalidation.
 * Uses btoa on a sorted JSON string so the hash changes whenever stats change.
 */
function hashConceptStats(stats) {
  const sorted = Object.keys(stats).sort().reduce((acc, k) => {
    acc[k] = stats[k];
    return acc;
  }, {});
  try {
    return btoa(JSON.stringify(sorted)).slice(0, 40);
  } catch {
    return String(Date.now());
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TopicPill({ item, color, bgColor }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.6rem 0.85rem',
      background: bgColor,
      border: `1px solid ${color}30`,
      borderRadius: '10px',
      gap: '0.75rem',
    }}>
      <span style={{
        fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0',
        flex: 1, lineHeight: 1.3,
      }}>
        {item.concept}
      </span>
      <span style={{
        fontSize: '0.8rem', fontWeight: 800, color: color,
        flexShrink: 0, minWidth: '38px', textAlign: 'right',
      }}>
        {item.pct}%
      </span>
    </div>
  );
}

function TopicColumn({ title, items, color, bgColor, emptyMsg, icon: Icon }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${color}20`,
      borderTop: `3px solid ${color}`,
      borderRadius: '14px',
      padding: '1rem',
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
        <Icon size={15} color={color} />
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700,
          background: `${color}20`, color, padding: '2px 8px', borderRadius: '20px',
        }}>
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', margin: 0, fontStyle: 'italic' }}>
          {emptyMsg}
        </p>
      ) : (
        items.map((item) => (
          <TopicPill key={item.concept} item={item} color={color} bgColor={bgColor} />
        ))
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * TopicMasteryReportCard
 *
 * Displayed inside the ReportCardTab's subject detail view.
 * Handles its own data fetching and AI narrative generation.
 *
 * Unlock logic:
 *  - Shows locked banner until student has attempted EVERY set (1..adminMax)
 *  - Once unlocked (cache exists in Firestore), STAYS visible even if new sets are added
 *  - Shows "New set available" banner when adminMax > student's max completed set
 */
export default function TopicMasteryReportCard({ subject, attempts, meta, userId }) {
  const adminMax = meta?.[subject] || 0;

  // ── Status state machine ──────────────────────────────────────────────────
  // 'init'      — fetching Firestore cache to determine if unlocked
  // 'locked'    — not unlocked, showing locked banner
  // 'computing' — unlocked, fetching test docs + computing stats
  // 'ready'     — stats computed, showing report (AI may still be loading)
  // 'error'     — something went badly wrong
  const [status, setStatus] = useState('init');
  const [categories, setCategories] = useState(null);  // { strong, medium, weak }
  const [narrative, setNarrative] = useState('');
  const [studyTips, setStudyTips] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [hasNewSet, setHasNewSet] = useState(false); // new set added since unlock

  // Stable dependency: latest timestamp across all attempts (re-runs when retake happens)
  const latestTimestamp = useMemo(
    () => Math.max(...attempts.map(a => a.timestamp || 0), 0),
    [attempts]
  );

  const attemptedSets = useMemo(
    () => new Set(attempts.map(a => a.setNumber)),
    [attempts]
  );

  const hasAllCurrentSets = useMemo(() => {
    if (adminMax === 0) return false;
    for (let i = 1; i <= adminMax; i++) {
      if (!attemptedSets.has(i)) return false;
    }
    return true;
  }, [adminMax, attemptedSets]);

  // ── Main effect ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !subject) return;
    let active = true;
    setStatus('init');

    async function run() {
      try {
        // Step 1: Fetch Firestore cache (also acts as unlock token)
        const cached = await getSubjectReportCard(userId, subject);
        if (!active) return;

        const isUnlocked = hasAllCurrentSets || cached !== null;

        if (!isUnlocked) {
          setStatus('locked');
          return;
        }

        // Detect if new sets were added after unlock (adminMax > max set student attempted)
        const studentMax = Math.max(...Array.from(attemptedSets), 0);
        setHasNewSet(adminMax > studentMax);

        setStatus('computing');

        // Step 2: Fetch test docs + compute concept stats
        const allTests = await getAllTestsForSubject(subject);
        const stats = computeConceptStats(subject, allTests, attempts);
        const cats = classifyConceptStats(stats);
        if (!active) return;

        setCategories(cats);
        setStatus('ready');

        // Step 3: Check if cached AI narrative is still fresh
        const hash = hashConceptStats(stats);
        if (cached && cached.hash === hash) {
          setNarrative(cached.narrative || '');
          setStudyTips(Array.isArray(cached.studyTips) ? cached.studyTips : []);
          return;
        }

        // Step 4: Fetch fresh AI narrative
        if (!active) return;
        setAiLoading(true);
        try {
          const res = await fetch('/api/ai-periodic-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject,
              conceptStats: stats,
              completedSets: attemptedSets.size,
              weakTopics: cats.weak.map(w => w.concept),
              mediumTopics: cats.medium.map(m => m.concept),
              strongTopics: cats.strong.map(s => s.concept),
            }),
          });

          if (!res.ok) throw new Error(`AI API ${res.status}`);
          const aiData = await res.json();
          if (!active) return;

          setNarrative(aiData.narrative || '');
          setStudyTips(Array.isArray(aiData.studyTips) ? aiData.studyTips : []);

          // Save to Firestore cache
          await saveSubjectReportCard(userId, subject, {
            narrative: aiData.narrative || '',
            studyTips: aiData.studyTips || [],
            hash,
          });
        } catch (aiErr) {
          console.warn('[TopicMasteryReportCard] AI call failed (non-fatal):', aiErr.message);
          // Silently skip — topic grid still renders without narrative
        } finally {
          if (active) setAiLoading(false);
        }
      } catch (err) {
        console.error('[TopicMasteryReportCard] Fatal error:', err);
        if (active) setStatus('error');
      }
    }

    run();
    return () => { active = false; };
  }, [subject, userId, latestTimestamp, hasAllCurrentSets]);

  // ── Renders ───────────────────────────────────────────────────────────────

  if (status === 'init' || status === 'computing') {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.4)', padding: '2rem 0' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.9rem' }}>
            {status === 'init' ? 'Checking report status...' : 'Computing topic mastery...'}
          </span>
        </div>
      </div>
    );
  }

  if (status === 'locked') {
    const done = attemptedSets.size;
    const remaining = adminMax - done;
    return (
      <div style={{
        ...containerStyle,
        border: '1px dashed rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.01)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '0.75rem', padding: '2.5rem 1.5rem', textAlign: 'center',
      }}>
        <Lock size={28} color="rgba(255,255,255,0.2)" />
        <div>
          <p style={{ margin: '0 0 0.3rem', fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
            Topic Mastery Report Locked
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)' }}>
            Complete {remaining} more set{remaining !== 1 ? 's' : ''} to unlock your personalised topic breakdown.
          </p>
        </div>
        <div style={{
          display: 'flex', gap: '0.4rem', marginTop: '0.25rem',
        }}>
          {Array.from({ length: adminMax }, (_, i) => (
            <div key={i} style={{
              width: '28px', height: '6px', borderRadius: '3px',
              background: attemptedSets.has(i + 1) ? '#10b981' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)' }}>
          {done}/{adminMax} sets completed
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ ...containerStyle, padding: '1.5rem', color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>
        Failed to load Topic Mastery data. Please try again later.
      </div>
    );
  }

  // ── status === 'ready' ────────────────────────────────────────────────────

  const totalConcepts = (categories.strong.length + categories.medium.length + categories.weak.length);

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem',
      }}>
        <div>
          <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.05rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="#a855f7" />
            Topic Mastery Report
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Based on {attemptedSets.size} completed set{attemptedSets.size !== 1 ? 's' : ''} · {totalConcepts} topic{totalConcepts !== 1 ? 's' : ''} tracked
          </p>
        </div>
        {hasNewSet && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '20px', padding: '0.3rem 0.75rem',
            fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b',
          }}>
            <Info size={12} />
            New set available — attempt it to include
          </div>
        )}
      </div>

      {/* AI Narrative */}
      {(narrative || aiLoading) && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          borderRadius: '12px', padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
        }}>
          {aiLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(168, 85, 247, 0.8)' }}>
              <Sparkles size={15} style={{ animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>AI is writing your performance diagnosis...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <Sparkles size={15} color="#a855f7" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#d1d5db', lineHeight: 1.65, fontStyle: 'italic' }}>
                {narrative}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3-Column Topic Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.75rem',
        marginBottom: categories.weak.length > 0 ? '1.25rem' : 0,
      }}>
        <TopicColumn
          title="Weak"
          items={categories.weak}
          color="#ef4444"
          bgColor="rgba(239, 68, 68, 0.06)"
          emptyMsg="No weak topics!"
          icon={AlertTriangle}
        />
        <TopicColumn
          title="Medium"
          items={categories.medium}
          color="#f59e0b"
          bgColor="rgba(245, 158, 11, 0.06)"
          emptyMsg="No medium topics"
          icon={BookOpen}
        />
        <TopicColumn
          title="Strong"
          items={categories.strong}
          color="#10b981"
          bgColor="rgba(16, 185, 129, 0.06)"
          emptyMsg="Keep practicing!"
          icon={CheckCircle}
        />
      </div>

      {/* Perfect score case */}
      {categories.weak.length === 0 && categories.medium.length === 0 && categories.strong.length > 0 && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '12px', padding: '1rem', textAlign: 'center',
          color: '#10b981', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem',
        }}>
          <CheckCircle size={20} style={{ display: 'block', margin: '0 auto 0.5rem' }} />
          Excellent mastery across all topics! Keep practising to maintain this level.
        </div>
      )}

      {/* Study Tips */}
      {studyTips.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '14px', padding: '1rem 1.25rem',
        }}>
          <h4 style={{
            margin: '0 0 0.85rem', fontSize: '0.88rem', fontWeight: 800,
            color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <BookOpen size={14} color="#f59e0b" /> Study Tips
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {studyTips.map((tip, i) => (
              <div key={i} style={{
                display: 'flex', gap: '0.85rem', alignItems: 'flex-start',
                padding: '0.75rem 1rem',
                background: 'rgba(239, 68, 68, 0.04)',
                border: '1px solid rgba(239, 68, 68, 0.12)',
                borderLeft: '3px solid #ef4444',
                borderRadius: '10px',
              }}>
                <div style={{ flexShrink: 0 }}>
                  <span style={{
                    display: 'inline-block', width: '20px', height: '20px',
                    background: 'rgba(239, 68, 68, 0.15)', borderRadius: '50%',
                    fontSize: '0.7rem', fontWeight: 800, color: '#ef4444',
                    textAlign: 'center', lineHeight: '20px',
                  }}>
                    {i + 1}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.8rem', fontWeight: 700, color: '#ef4444' }}>
                    {tip.concept}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                    {tip.tip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const containerStyle = {
  background: 'rgba(168, 85, 247, 0.03)',
  border: '1px solid rgba(168, 85, 247, 0.15)',
  borderRadius: '16px',
  padding: '1.5rem',
  marginTop: '1.5rem',
};
