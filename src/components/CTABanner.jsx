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
 * One-time display — cross-device + local storage optimization:
 *   We check Local Storage first to prevent UI flashing. 
 *   If not in Local Storage, we check currentUser.seenCtaBannerId.
 *   On click or dismiss, writes `seenCtaBannerId` to the user's Firestore doc and Local Storage.
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

        if (!cfg || !cfg.enabled || !cfg.id) {
          setConfig(false);
          return;
        }

        // Check Local Storage first for immediate dismissal (prevents flashing)
        const localSeen = localStorage.getItem('seenCtaBannerId');
        if (localSeen === cfg.id) {
          setConfig(false);
          return;
        }

        // Check Cloud State
        if (currentUser && currentUser.seenCtaBannerId === cfg.id) {
          // Keep Local Storage in sync for next time
          localStorage.setItem('seenCtaBannerId', cfg.id);
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
   *  1. Save to Local Storage immediately.
   *  2. Update in-memory currentUser instantly (no flicker on re-render).
   *  3. Persist to Firestore in the background (non-blocking).
   */
  function permanentlyClose() {
    setVisible(false);
    localStorage.setItem('seenCtaBannerId', config.id);
    if (currentUser?.phone) {
      updateCurrentUser({ seenCtaBannerId: config.id });
      markBannerSeen(currentUser.phone, config.id).catch(() => {});
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
