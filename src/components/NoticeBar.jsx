import { useEffect, useState } from 'react';
import NoticeText from './NoticeText';
import CopyWhatsAppButton from './CopyWhatsAppButton';
import { Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
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

export default function NoticeBar() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="glass-card notice-bar">
      <div className="notice-bar-head"><Megaphone size={15} /> Notices</div>
      <div className="notice-item">
        <NoticeText>{notices[0].body}</NoticeText>
        <div className="notice-item-meta">
          <span>— {notices[0].authorName}</span>
          <span>{formatDate(notices[0].createdAtMs)}</span>
        </div>
        <CopyWhatsAppButton body={notices[0].body} shareLink={`${window.location.origin}/api/notice-share?id=${notices[0].id}`} style={{ marginTop: '0.5rem' }} />
      </div>
      {notices.length > 1 && (
        <Link to="/notices" className="auth-link" style={{ alignSelf: 'flex-start' }}>
          View all {notices.length} notices →
        </Link>
      )}
    </div>
  );
}
