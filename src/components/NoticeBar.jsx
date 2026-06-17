import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Megaphone, ChevronDown, ChevronUp } from 'lucide-react';
import { getNotices } from '../services/noticeService';

function formatDate(ms) {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Read-only notice feed shown on the student dashboard.
 * Shows the latest notice expanded; older ones collapse behind a toggle.
 */
export default function NoticeBar() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;
    getNotices()
      .then((data) => { if (active) setNotices(data); })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="glass-card notice-bar">
        <div className="notice-bar-head"><Megaphone size={15} /> Notices</div>
        <p className="notice-empty">Loading notices…</p>
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className="glass-card notice-bar">
        <div className="notice-bar-head"><Megaphone size={15} /> Notices</div>
        <p className="notice-empty">No notices right now. You're all caught up! 🎉</p>
      </div>
    );
  }

  const visible = showAll ? notices : notices.slice(0, 1);

  return (
    <div className="glass-card notice-bar">
      <div className="notice-bar-head"><Megaphone size={15} /> Notices</div>
      {visible.map((n) => (
        <div key={n.id} className="notice-item">
          <div className="markdown-content">
            <ReactMarkdown>{n.body}</ReactMarkdown>
          </div>
          <div className="notice-item-meta">
            <span>— {n.authorName}</span>
            <span>{formatDate(n.createdAtMs)}{n.updatedAtMs && n.updatedAtMs !== n.createdAtMs ? ' (edited)' : ''}</span>
          </div>
        </div>
      ))}
      {notices.length > 1 && (
        <button
          className="auth-link"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll
            ? <>Show less <ChevronUp size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /></>
            : <>View all {notices.length} notices <ChevronDown size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /></>}
        </button>
      )}
    </div>
  );
}
