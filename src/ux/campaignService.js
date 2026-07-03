/**
 * campaignService.js
 * Unified read/write/subscribe for UX campaign state.
 *
 * Storage strategies per campaign:
 *   'local'    - localStorage only (device-scoped, survives sessions)
 *   'session'  - sessionStorage only (clears on tab close)
 *   'firestore'- Firestore user doc only (cross-device)
 *   'both'     - localStorage (instant) + Firestore (cross-device sync) — most robust
 *
 * All keys are namespaced by phone to avoid cross-user collisions on shared devices.
 */

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ── Helpers ─────────────────────────────────────────────────────────────────

function localKey(campaignId, phone) {
  return `ux_${campaignId}_${phone}`;
}

function sessionKey(campaignId, phone) {
  return `ux_session_${campaignId}_${phone}`;
}

function firestoreField(campaignId) {
  // Map campaign IDs to Firestore field names.
  // Existing legacy fields are mapped here so no migration is needed.
  const LEGACY_MAP = {
    'onboarding-v1':  'onboardingCompleted',
    'whats-new-v1':   'whatsNewSeen_v1',
    'merge-banner-v1':'mergeBannerSeen',
  };
  return LEGACY_MAP[campaignId] || `ux_${campaignId}`;
}

function userRef(phone) {
  return doc(db, 'users', phone);
}

// ── Read ─────────────────────────────────────────────────────────────────────

/**
 * Returns true if a campaign has been dismissed/completed by this user.
 * Checks the appropriate storage based on strategy.
 *
 * @param {string} campaignId
 * @param {string} phone - current user phone
 * @param {'local'|'session'|'firestore'|'both'} strategy
 * @param {object|null} firestoreUser - already-loaded user doc (avoids extra fetch)
 */
export function isCampaignSeen(campaignId, phone, strategy, firestoreUser = null) {
  if (!phone) return false;

  if (strategy === 'session') {
    return !!sessionStorage.getItem(sessionKey(campaignId, phone));
  }

  if (strategy === 'local' || strategy === 'both') {
    if (localStorage.getItem(localKey(campaignId, phone))) return true;
  }

  if ((strategy === 'firestore' || strategy === 'both') && firestoreUser) {
    const field = firestoreField(campaignId);
    if (firestoreUser[field]) return true;
  }

  return false;
}

// ── Write ────────────────────────────────────────────────────────────────────

/**
 * Marks a campaign as seen/completed.
 * Writes to the correct storage(s) based on strategy.
 *
 * @param {string} campaignId
 * @param {string} phone
 * @param {'local'|'session'|'firestore'|'both'} strategy
 */
export async function markCampaignSeen(campaignId, phone, strategy) {
  if (!phone) return;

  if (strategy === 'session') {
    sessionStorage.setItem(sessionKey(campaignId, phone), '1');
    return;
  }

  if (strategy === 'local' || strategy === 'both') {
    localStorage.setItem(localKey(campaignId, phone), '1');
  }

  if (strategy === 'firestore' || strategy === 'both') {
    try {
      await updateDoc(userRef(phone), { [firestoreField(campaignId)]: true });
    } catch (err) {
      console.warn(`[UX] Failed to persist campaign ${campaignId} to Firestore:`, err);
    }
  }
}

/**
 * Resets a campaign — removes all storage so it shows again.
 * Used by admin tools and test account reset.
 *
 * @param {string} campaignId
 * @param {string} phone
 * @param {'local'|'session'|'firestore'|'both'} strategy
 */
export async function resetCampaign(campaignId, phone, strategy) {
  if (!phone) return;

  localStorage.removeItem(localKey(campaignId, phone));
  sessionStorage.removeItem(sessionKey(campaignId, phone));

  if (strategy === 'firestore' || strategy === 'both') {
    try {
      await updateDoc(userRef(phone), { [firestoreField(campaignId)]: false });
    } catch (err) {
      console.warn(`[UX] Failed to reset campaign ${campaignId} in Firestore:`, err);
    }
  }
}

/**
 * Resets ALL campaigns for a user (used by admin "reset test account").
 * @param {string} phone
 * @param {Array<{id: string, storage: string}>} campaigns
 */
export async function resetAllCampaigns(phone, campaigns) {
  await Promise.allSettled(
    campaigns.map(c => resetCampaign(c.id, phone, c.storage))
  );
}

/**
 * Snooze the notes tour for 7 days.
 * Writes a timestamp to Firestore so the condition can check it cross-device.
 */
export async function snoozeNotesTour(phone) {
  if (!phone) return;
  const until = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now
  localStorage.setItem(`ux_notes-tour-v1_${phone}`, `snooze_${until}`);
  try {
    await updateDoc(userRef(phone), { 'ux_notes-tour-v1_snooze': until });
  } catch (err) {
    console.warn('[UX] Failed to write notes tour snooze:', err);
  }
}

