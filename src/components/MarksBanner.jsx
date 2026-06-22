import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const STORAGE_KEY = (phone) => `marks_banner_v1_${phone}`;

export default function MarksBanner() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (!currentUser || currentUser.rollNo === 0) return null;

  const seen = dismissed || localStorage.getItem(STORAGE_KEY(currentUser.phone));
  if (seen) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY(currentUser.phone), '1');
    setDismissed(true);
  }

  return (
    <div className="marks-banner">
      <BarChart2 size={18} className="marks-banner-icon" />
      <div className="marks-banner-body">
        <strong>Your Maths test scores are here!</strong>
        <p>Check your Test 1 & Test 2 marks — and report if anything looks wrong.</p>
        <button className="auth-btn" style={{ marginTop: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          onClick={() => { dismiss(); navigate('/test-scores'); }}>
          View My Scores
        </button>
      </div>
      <button className="merge-banner-close" onClick={dismiss} aria-label="Dismiss"><X size={16} /></button>
    </div>
  );
}
