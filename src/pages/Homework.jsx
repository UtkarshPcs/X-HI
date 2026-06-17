import { Calendar, Lock, Loader2, Share2, Download } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useEffect, useState, useRef, useCallback } from 'react';
import { toBlob } from 'html-to-image';
import { getHomework } from '../services/homeworkService';
import ShareCard from '../components/ShareCard';

function useSharingCard() {
  const [sharing, setSharing] = useState(null); // { id, date, tasks }
  const cardRef = useRef(null);

  const share = useCallback(async (day) => {
    setSharing({ id: day.id, date: day.date, tasks: day.tasks || [] });

    // Wait a tick for the ShareCard to mount and fonts to render
    await new Promise((r) => setTimeout(r, 80));

    try {
      const blob = await toBlob(cardRef.current, { pixelRatio: 2 });
      if (!blob) throw new Error('Capture failed');

      const file = new File([blob], `homework-${day.date}.png`, { type: 'image/png' });
      const shareData = {
        title: `Homework – ${day.date}`,
        text: `📚 10th HI Homework\n${day.date}\n\n${(day.tasks || []).map(t => `• ${t.subject}: ${t.description}`).join('\n')}\n\n🔗 xhiportal.vercel.app`,
        files: [file],
      };

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else if (navigator.share) {
        // Files not supported — share text only
        await navigator.share({ title: shareData.title, text: shareData.text });
      } else {
        // Desktop fallback — download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share failed', err);
    } finally {
      setSharing(null);
    }
  }, []);

  return { sharing, cardRef, share };
}

export default function Homework() {
  const { currentUser, openModal } = useAuth();
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { sharing, cardRef, share } = useSharingCard();

  useEffect(() => {
    if (currentUser) {
      getHomework()
        .then((data) => setHomeworkList(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="animate-fade-in fade-in-up" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <Lock size={48} color="var(--tertiary)" style={{ margin: '0 auto 1rem auto' }} />
        <h1 className="page-title text-gradient">Locked Portal</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          You must be logged in to access the Homework portal.
        </p>
        <button className="auth-btn primary" onClick={openModal} style={{ margin: '0 auto' }}>
          Login / Register
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in fade-in-up">
      <h1 className="page-title text-gradient">Homework</h1>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div className="task-list">
          {homeworkList.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>No homework available.</p>
          ) : (
            homeworkList.map((day) => (
              <div key={day.id} className="glass-card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 className="section-title text-gradient" style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={20} className="text-primary" />
                    {day.date?.replace(/_/g, '').replace(/Date:/i, '').trim()}
                  </h2>
                  <button
                    onClick={() => share(day)}
                    disabled={sharing?.id === day.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      background: 'var(--surface-hover)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      padding: '0.4rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      opacity: sharing?.id === day.id ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    {sharing?.id === day.id
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Capturing…</>
                      : navigator.share ? <><Share2 size={14} /> Share</> : <><Download size={14} /> Save</>
                    }
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {(!day.tasks || day.tasks.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No homework details found.</p>
                  ) : day.tasks.map((task, idx) => (
                    <div key={idx} style={{
                      padding: '0.9rem 1.1rem',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: '4px solid var(--primary)',
                    }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                        {task.subject}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                        {task.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Off-screen ShareCard — mounted only while capturing */}
      {sharing && (
        <ShareCard ref={cardRef} date={sharing.date} tasks={sharing.tasks} />
      )}
    </div>
  );
}
