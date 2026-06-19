import { ensureBroadcastKey } from '../auth/authService';
import { sendNotification } from './pushService';
import { ROLES } from '../auth/roles';

/**
 * High-level "send a push to the whole class" helper used by the admin UI and
 * by auto-triggers (new notice / homework / syllabus update).
 *
 * Only an admin can actually send — the serverless endpoint re-validates this,
 * but we also short-circuit on the client to avoid pointless requests.
 *
 * Auto-trigger calls should be fire-and-forget: a push failure must never
 * block or fail the underlying action (posting a notice, etc.). Use
 * notifyClassSafe() for that.
 */

function isAdmin(user) {
  return user && (user.isAdmin || user.role === ROLES.ADMIN);
}

/**
 * Sends a class-wide notification. Throws on failure (use in the manual
 * broadcast UI where the admin should see errors).
 */
export async function notifyClass(user, { title, body = '', url = '/', type = 'broadcast' }) {
  if (!isAdmin(user)) throw new Error('Only admins can send notifications.');
  const broadcastKey = await ensureBroadcastKey(user.phone);
  return sendNotification({ phone: user.phone, broadcastKey, title, body, url, type });
}

/**
 * Fire-and-forget variant for auto-triggers. Never throws; logs on failure.
 * Returns a promise that always resolves.
 */
export async function notifyClassSafe(user, opts) {
  try {
    if (!isAdmin(user)) return null;
    return await notifyClass(user, opts);
  } catch (err) {
    console.warn('Auto-notification failed (non-blocking):', err);
    return null;
  }
}
