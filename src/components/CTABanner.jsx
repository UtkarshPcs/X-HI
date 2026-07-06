import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getCTABannerConfig, recordCTAClick } from '../services/ctaBannerService';
import { markBannerSeen } from '../auth/authService';

/**
 * CTABanner
 * ─────────
 * Globally-mounted configurable announcement banner.
 * Admin controls: message, button label, optional URL.
 *
 * One-time display — cross-device:
 *   On click or dismiss, writes `seenBannerVersion = updatedAt` to the
 *   user's Firestore doc. Since the user doc is fetched at login and
 *   stored in currentUser, no extra network call is needed to check it.
 *   If admin saves a new config (new updatedAt), it resets for everyone.
 *
 * Unauthenticated users: banner is shown but click is not tracked.
 */
export default function CTABanner() {
  const { currentUser, updateCurrentUser } = useAuth();
  // null = loading | false = nothing to show | object = config
  const [config, setConfig] = useState(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy]       = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cfg = await getCTABannerConfig();
        if (!active) return;

        if (!cfg || !cfg.enabled) {
          setConfig(false);
          return;
        }

        // Already permanently dismissed this version (cross-device via Firestore)
        if (currentUser && currentUser.seenBannerVersion === cfg.updatedAt) {
          setConfig(false);
          return;
        }

        setConfig(cfg);
        setVisible(true);
      } catch {
        if (active) setConfig(false);
      }
    })();
    return () => { active = false; };
  }, [currentUser]);

  if (!config || !visible) return null;

  /**
   * Permanently hide this banner version:
   *  1. Update in-memory currentUser instantly (no flicker on re-render).
   *  2. Persist to Firestore in the background (non-blocking).
   */
  function permanentlyClose() {
    setVisible(false);
    if (currentUser?.phone) {
      // Instant in-memory patch — zero latency for the user
      updateCurrentUser({ seenBannerVersion: config.updatedAt });
      // Background Firestore write — cross-device persistence
      markBannerSeen(currentUser.phone, config.updatedAt).catch(() => {});
    }
  }

  async function handleClick() {
    if (busy) return;
    setBusy(true);

    // Track the click in Firestore (best-effort)
    if (currentUser) {
      try {
        await recordCTAClick({
          rollNo: currentUser.rollNo,
          name:   currentUser.name,
          phone:  currentUser.phone,
        });
      } catch { /* never block the user */ }
    }

    // Navigate if a URL was set
    if (config.buttonUrl && config.buttonUrl.trim()) {
      const url = config.buttonUrl.trim();
      if (url.startsWith('/')) {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener');
      }
    }

    permanentlyClose();
    setBusy(false);
  }

  return (
    <div className="cta-banner" role="region" aria-label="Announcement">
      <p className="cta-banner-msg">{config.message}</p>
      <div className="cta-banner-actions">
        <button
          className="cta-banner-btn"
          onClick={handleClick}
          disabled={busy}
        >
          {config.buttonText || 'OK'}
        </button>
        <button
          className="cta-banner-close"
          onClick={permanentlyClose}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
