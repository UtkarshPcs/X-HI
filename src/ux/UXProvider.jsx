/**
 * UXProvider.jsx + useUX (exported at bottom)
 *
 * Central context that:
 * 1. Evaluates all campaigns against the current user on login
 * 2. Maintains a priority-sorted queue of active campaigns
 * 3. Exposes dismiss / mark-complete for any campaign
 * 4. Provides a toast queue for imperative toasts (ForegroundToast, verified, etc.)
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import CAMPAIGNS from './campaignConfig';
import { isCampaignSeen, markCampaignSeen, resetCampaign, resetAllCampaigns } from './campaignService';

const UXContext = createContext(null);

export function UXProvider({ children }) {
  const { currentUser } = useAuth();

  // Active campaigns: sorted array of campaign objects whose condition returns true
  const [queue, setQueue] = useState([]);

  // Dismissed set this session (React state, in addition to persistent storage)
  const [dismissed, setDismissed] = useState(new Set());

  // Toast queue: [{ id, title, body, url, type }]
  const [toasts, setToasts] = useState([]);
  const toastTimers = useRef({});

  // ── Evaluate campaigns whenever user changes ─────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      setQueue([]);
      setDismissed(new Set());
      return;
    }

    const active = CAMPAIGNS
      .filter(c => {
        // Skip if already dismissed this session
        if (dismissed.has(c.id)) return false;
        // Skip if stored as seen
        if (isCampaignSeen(c.id, currentUser.phone, c.storage, currentUser)) return false;
        // Evaluate dynamic condition
        try { return c.condition(currentUser); } catch { return false; }
      })
      .sort((a, b) => b.priority - a.priority);

    setQueue(active);
  }, [
    currentUser?.phone,
    currentUser?.onboardingCompleted,
    currentUser?.whatsNewSeen_v1,
    currentUser?.mergedAt,
    currentUser?.mergeBannerSeen,
    currentUser?.email,
    currentUser?.['ux_marks-banner-v1'],
    currentUser?.['ux_notif-prompt-v1'],
    currentUser?.['ux_pwa-install-v1'],
    currentUser?.['ux_notes-tour-v1'],
    currentUser?.['ux_study-together-announcement-v1'],
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Campaign actions ──────────────────────────────────────────────────────

  /**
   * Dismiss a campaign (user closed it without completing).
   * Writes to persistent storage and removes from queue.
   */
  const dismiss = useCallback(async (campaignId) => {
    const campaign = CAMPAIGNS.find(c => c.id === campaignId);
    if (!campaign || !currentUser) return;

    setDismissed(prev => new Set([...prev, campaignId]));
    setQueue(prev => prev.filter(c => c.id !== campaignId));
    await markCampaignSeen(campaignId, currentUser.phone, campaign.storage);
  }, [currentUser]);

  /**
   * Mark a campaign as complete (user finished it — same effect as dismiss but
   * semantically clearer for tours/modals).
   */
  const complete = useCallback(async (campaignId) => {
    await dismiss(campaignId);
  }, [dismiss]);

  /**
   * Reset a campaign for the current user (admin / testing).
   */
  const reset = useCallback(async (campaignId) => {
    const campaign = CAMPAIGNS.find(c => c.id === campaignId);
    if (!campaign || !currentUser) return;
    await resetCampaign(campaignId, currentUser.phone, campaign.storage);
    setDismissed(prev => { const n = new Set(prev); n.delete(campaignId); return n; });
    // Re-evaluate queue
    setQueue(prev => {
      const already = prev.find(c => c.id === campaignId);
      if (already) return prev;
      try {
        if (campaign.condition(currentUser)) {
          return [...prev, campaign].sort((a, b) => b.priority - a.priority);
        }
      } catch {}
      return prev;
    });
  }, [currentUser]);

  /**
   * Reset ALL campaigns (for test account / admin).
   */
  const resetAll = useCallback(async () => {
    if (!currentUser) return;
    await resetAllCampaigns(currentUser.phone, CAMPAIGNS);
    setDismissed(new Set());
    // Re-evaluate
    const active = CAMPAIGNS
      .filter(c => { try { return c.condition(currentUser); } catch { return false; } })
      .sort((a, b) => b.priority - a.priority);
    setQueue(active);
  }, [currentUser]);

  // ── Toast system ──────────────────────────────────────────────────────────

  /**
   * Push an imperative toast.
   * @param {{ title: string, body?: string, url?: string, type?: string, duration?: number }} toast
   */
  const pushToast = useCallback(({ title, body, url, type = 'info', duration = 6000 }) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, title, body, url, type }]);

    if (duration > 0) {
      toastTimers.current[id] = setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
    return id;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissToast = useCallback((id) => {
    clearTimeout(toastTimers.current[id]);
    delete toastTimers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(toastTimers.current).forEach(clearTimeout);
    };
  }, []);

  // ── isActive helper ───────────────────────────────────────────────────────
  /** Returns true if a campaign is in the active queue */
  const isActive = useCallback((campaignId) => {
    return queue.some(c => c.id === campaignId);
  }, [queue]);

  const value = {
    queue,           // sorted array of active campaign objects
    dismiss,         // (id) => void — dismiss & persist
    complete,        // (id) => void — same as dismiss, semantic alias
    reset,           // (id) => void — admin: re-show a campaign
    resetAll,        // () => void — admin: reset all campaigns
    isActive,        // (id) => bool
    // Toast API
    toasts,
    pushToast,
    dismissToast,
    // All campaign definitions (for admin panel)
    allCampaigns: CAMPAIGNS,
  };

  return <UXContext.Provider value={value}>{children}</UXContext.Provider>;
}

/**
 * useUX — access the UX management system from any component.
 */
export function useUX() {
  const ctx = useContext(UXContext);
  if (!ctx) throw new Error('useUX must be used inside <UXProvider>');
  return ctx;
}
