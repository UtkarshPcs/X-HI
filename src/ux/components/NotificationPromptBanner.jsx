/**
 * NotificationPromptBanner.jsx
 * UX-system-aware notification permission prompt.
 * Replaces NotificationPrompt.jsx logic with campaign-driven dismissal.
 */

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useUX } from '../UXProvider';
import {
  isPushSupportedSync, isIosNeedsInstall, permissionState,
  requestPermissionAndToken, saveToken,
} from '../../services/pushService';
import { getToken } from 'firebase/messaging';
import { getMessagingIfSupported, VAPID_KEY } from '../../firebase';

export default function NotificationPromptBanner() {
  const { currentUser } = useAuth();
  const { isActive, dismiss } = useUX();
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy]     = useState(false);

  // Silently refresh token if already granted
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

  const canShow =
    !hidden &&
    isActive('notif-prompt-v1') &&
    isPushSupportedSync() &&
    !isIosNeedsInstall() &&
    permissionState() === 'default';

  if (!canShow) return null;

  async function handleEnable() {
    setBusy(true);
    try {
      const token = await requestPermissionAndToken(currentUser);
      if (!token) dismiss('notif-prompt-v1');
      setHidden(true);
    } catch {
      // silent
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="notif-prompt">
      <div className="notif-prompt-icon"><Bell size={18} /></div>
      <div className="notif-prompt-text">
        <strong>Turn on notifications</strong>
        <span>Get notified about new notices, homework &amp; updates.</span>
      </div>
      <div className="notif-prompt-actions">
        <button className="notif-prompt-enable" onClick={handleEnable} disabled={busy}>
          {busy ? 'Enabling…' : 'Enable'}
        </button>
        <button className="notif-prompt-dismiss" onClick={() => dismiss('notif-prompt-v1')} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
