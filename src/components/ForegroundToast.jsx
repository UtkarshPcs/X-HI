import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { onForegroundMessage } from '../services/pushService';

/**
 * Shows an in-app toast when a push arrives while the app is open and focused
 * (FCM suppresses the system notification in the foreground). Auto-dismisses
 * after a few seconds; clicking it navigates to the message's target URL.
 */
export default function ForegroundToast() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null); // { title, body, url }

  useEffect(() => {
    if (!currentUser) return;
    let unsub = () => {};
    let timer;

    onForegroundMessage((msg) => {
      setToast(msg);
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 6000);
    }).then((fn) => { unsub = fn; });

    return () => { unsub(); clearTimeout(timer); };
  }, [currentUser]);

  if (!toast) return null;

  function handleClick() {
    const url = toast.url || '/';
    setToast(null);
    // Internal links → client-side nav; external → full navigation.
    if (url.startsWith('http')) window.location.href = url;
    else navigate(url);
  }

  return (
    <div className="fg-toast" onClick={handleClick} role="alert">
      <div className="fg-toast-icon"><Bell size={18} /></div>
      <div className="fg-toast-text">
        <strong>{toast.title}</strong>
        {toast.body && <span>{toast.body}</span>}
      </div>
      <button
        className="fg-toast-close"
        onClick={(e) => { e.stopPropagation(); setToast(null); }}
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
