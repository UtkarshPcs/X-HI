import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import {
  isPushSupportedSync,
  isIosNeedsInstall,
  permissionState,
  requestPermissionAndToken,
  saveToken,
} from '../services/pushService';
import { getToken } from 'firebase/messaging';
import { getMessagingIfSupported, VAPID_KEY } from '../firebase';

const DISMISSED_KEY = 'notif_prompt_dismissed';

/**
 * Slim banner that asks logged-in users to enable push notifications.
 *
 * Visibility rules:
 *   • only for logged-in users on push-capable browsers
 *   • hidden if already granted (but we still silently refresh the token)
 *   • hidden if the user dismissed it, or on iOS-not-installed
 */
export default function NotificationPrompt() {
  const { currentUser } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [hidden, setHidden] = useState(false); // hidden after a successful enable
  const [busy, setBusy] = useState(false);

  // Silently (re)save this device's token when permission is already granted.
  // This only talks to external systems (Firebase) — no render-state writes —
  // so it correctly belongs in an effect.
  useEffect(() => {
    if (!currentUser) return;
    if (!isPushSupportedSync() || isIosNeedsInstall()) return;
    if (permissionState() !== 'granted') return;
    let active = true;
    (async () => {
      try {
        const messaging = await getMessagingIfSupported();
        if (!messaging || !VAPID_KEY || !active) return;
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token && active) await saveToken(token, currentUser);
      } catch { /* noop */ }
    })();
    return () => { active = false; };
  }, [currentUser]);

  // Whether to show the banner is fully derivable from current state — no
  // effect/setState needed.
  const canShow =
    !!currentUser &&
    !dismissed &&
    !hidden &&
    isPushSupportedSync() &&
    !isIosNeedsInstall() &&
    permissionState() === 'default' &&
    !localStorage.getItem(DISMISSED_KEY);

  async function handleEnable() {
    setBusy(true);
    try {
      const token = await requestPermissionAndToken(currentUser);
      if (!token) {
        // Permission denied or unavailable — don't nag again this session.
        localStorage.setItem(DISMISSED_KEY, '1');
      }
      setHidden(true);
    } catch (err) {
      console.error('Enable notifications failed:', err);
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  }

  if (!canShow) return null;

  return (
    <div className="notif-prompt">
      <div className="notif-prompt-icon"><Bell size={18} /></div>
      <div className="notif-prompt-text">
        <strong>Turn on notifications</strong>
        <span>Get notified about new notices, homework & updates.</span>
      </div>
      <div className="notif-prompt-actions">
        <button className="notif-prompt-enable" onClick={handleEnable} disabled={busy}>
          {busy ? 'Enabling…' : 'Enable'}
        </button>
        <button className="notif-prompt-dismiss" onClick={dismiss} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
