/**
 * ToastContainer.jsx
 * Renders the toast queue from UXProvider.
 * Replaces ForegroundToast.jsx (FCM push toasts) and the ad-hoc verifiedToast in ProfilePage.
 *
 * Also handles FCM foreground push — subscribes via onForegroundMessage and
 * pushes into the shared toast queue via useUX().
 *
 * Mount once in App.jsx (or UXRenderer).
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useUX } from '../UXProvider';
import { onForegroundMessage } from '../../services/pushService';

const TYPE_ICON = {
  push:    Bell,
  success: CheckCircle,
  info:    Info,
  warning: AlertTriangle,
};

const TYPE_COLOR = {
  push:    'var(--primary)',
  success: '#10b981',
  info:    'var(--primary)',
  warning: '#f59e0b',
};

function Toast({ toast, onDismiss }) {
  const navigate = useNavigate();
  const Icon = TYPE_ICON[toast.type] || Info;
  const color = TYPE_COLOR[toast.type] || 'var(--primary)';

  function handleClick() {
    onDismiss(toast.id);
    if (!toast.url) return;
    if (toast.url.startsWith('http')) window.location.href = toast.url;
    else navigate(toast.url);
  }

  return (
    <div
      className="fg-toast"
      onClick={toast.url ? handleClick : undefined}
      role="alert"
      style={{ cursor: toast.url ? 'pointer' : 'default' }}
    >
      <div className="fg-toast-icon" style={{ color }}>
        <Icon size={18} />
      </div>
      <div className="fg-toast-text">
        <strong>{toast.title}</strong>
        {toast.body && <span>{toast.body}</span>}
      </div>
      <button
        className="fg-toast-close"
        onClick={e => { e.stopPropagation(); onDismiss(toast.id); }}
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { currentUser } = useAuth();
  const { toasts, pushToast, dismissToast } = useUX();

  // Subscribe to FCM foreground messages and push them into the shared queue
  useEffect(() => {
    if (!currentUser) return;
    let unsub = () => {};

    onForegroundMessage((msg) => {
      pushToast({
        title: msg.title,
        body: msg.body,
        url: msg.url,
        type: 'push',
        duration: 6000,
      });
    }).then(fn => { unsub = fn; });

    return () => unsub();
  }, [currentUser, pushToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '1.25rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: 360,
        width: 'calc(100vw - 2.5rem)',
      }}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
