/**
 * CampaignModal.jsx
 * Renders modal-type campaigns.
 * Currently handles the 'whats-new' variant. New announcement modals = new variant.
 *
 * Usage:
 *   <CampaignModal campaignId="whats-new-v1" onStartTour={() => setRunTour(true)} />
 */

import { useState } from 'react';
import { X, Check, BellRing, Sparkles } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useUX } from '../UXProvider';
import { getCampaign } from '../campaignConfig';
import {
  isPushSupportedSync, isIosNeedsInstall, permissionState, requestPermissionAndToken,
} from '../../services/pushService';

/**
 * @param {{
 *   campaignId: string,
 *   onStartTour?: () => void,
 * }} props
 */
export default function CampaignModal({ campaignId, onStartTour }) {
  const { currentUser } = useAuth();
  const { isActive, complete } = useUX();
  const [notifState, setNotifState] = useState('idle'); // idle | working | done | unavailable

  if (!isActive(campaignId)) return null;

  const campaign = getCampaign(campaignId);
  if (!campaign) return null;

  const { content } = campaign;
  const notifAlreadyOn = permissionState() === 'granted';
  const BadgeIcon = content.badge;

  async function handleEnableNotifications() {
    if (!isPushSupportedSync() || isIosNeedsInstall()) {
      setNotifState('unavailable'); return;
    }
    setNotifState('working');
    try {
      const token = await requestPermissionAndToken(currentUser);
      setNotifState(token ? 'done' : 'unavailable');
    } catch {
      setNotifState('unavailable');
    }
  }

  function handleClose() {
    complete(campaignId);
  }

  function handleTour() {
    complete(campaignId);
    onStartTour?.();
  }

  // ── What's New variant ────────────────────────────────────────────────────
  if (content.variant === 'whats-new') {
    return (
      <div className="whatsnew-overlay" onClick={handleClose}>
        <div className="whatsnew-modal spring-up" onClick={e => e.stopPropagation()}>
          <button className="whatsnew-close" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </button>

          {BadgeIcon && (
            <div className="whatsnew-badge"><BadgeIcon size={26} /></div>
          )}
          <h2 className="whatsnew-title">
            Welcome to <span className="text-gradient">{content.title}</span>
          </h2>
          <p className="whatsnew-sub">{content.subtitle}</p>

          {/* Feature list */}
          {content.features && (
            <div className="whatsnew-features">
              {content.features.map(({ icon: FIcon, color, bg, title, body }) => (
                <div key={title} className="whatsnew-feature">
                  <span className="whatsnew-feature-icon" style={{ background: bg, color }}>
                    <FIcon size={18} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <span>{body}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Enable notifications */}
          {!notifAlreadyOn && notifState !== 'done' && (
            <button
              className="whatsnew-notif-btn"
              onClick={handleEnableNotifications}
              disabled={notifState === 'working'}
            >
              <BellRing size={16} />
              {notifState === 'working'      ? 'Enabling…'
               : notifState === 'unavailable' ? 'Notifications unavailable on this device'
               : 'Enable notifications to stay updated'}
            </button>
          )}
          {(notifAlreadyOn || notifState === 'done') && (
            <p className="whatsnew-notif-on">
              <Check size={15} /> Notifications are on — you're all set!
            </p>
          )}

          <div className="whatsnew-actions">
            <button className="auth-btn secondary" onClick={handleClose}>Maybe later</button>
            {content.tourSteps && content.tourSteps.length > 0 && (
              <button className="auth-btn primary" onClick={handleTour}>Take a tour</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Generic modal fallback ────────────────────────────────────────────────
  return (
    <div className="whatsnew-overlay" onClick={handleClose}>
      <div className="whatsnew-modal spring-up" onClick={e => e.stopPropagation()}>
        <button className="whatsnew-close" onClick={handleClose} aria-label="Close">
          <X size={18} />
        </button>
        <h2 className="whatsnew-title">{content.title}</h2>
        {content.subtitle && <p className="whatsnew-sub">{content.subtitle}</p>}
        <div className="whatsnew-actions">
          <button className="auth-btn primary" onClick={handleClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
