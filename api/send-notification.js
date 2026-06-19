import { adminDb, adminMessaging } from './_lib/firebaseAdmin.js';

/**
 * POST /api/send-notification
 *
 * Body: { phone, broadcastKey, title, body, url?, type? }
 *
 * Security (the app uses custom phone+password auth, not Firebase Auth, so we
 * can't verify an ID token). Instead:
 *   1. Look up the user doc by `phone`.
 *   2. Require the user's roll number to be the admin roll (23).
 *   3. Require `broadcastKey` to match the secret stored on that user doc
 *      (issued once via ensureBroadcastKey() on the client).
 * Spoofing therefore requires the per-admin secret key, not just a phone.
 *
 * On success: sends a DATA message to every registered FCM token, prunes any
 * tokens FCM reports as unregistered, writes a `notifications/` history
 * record, and returns a delivery summary.
 */

const ADMIN_ROLL = 23;
const TOKENS = 'fcmTokens';
const USERS = 'users';
const NOTIFS = 'notifications';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }

  const { phone, broadcastKey, title, body, url = '/', type = 'broadcast' } = payload || {};

  if (!phone || !broadcastKey) return res.status(401).json({ error: 'Missing credentials' });
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

  let db, messaging;
  try {
    db = adminDb();
    messaging = adminMessaging();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server not configured for notifications.' });
  }

  // ── Authorise ────────────────────────────────────────────────
  const userSnap = await db.collection(USERS).doc(String(phone)).get();
  if (!userSnap.exists) return res.status(401).json({ error: 'Unauthorized' });
  const user = userSnap.data();

  const roll = parseInt(user.rollNo, 10);
  if (roll !== ADMIN_ROLL) return res.status(403).json({ error: 'Admins only' });
  if (!user.broadcastKey || user.broadcastKey !== broadcastKey) {
    return res.status(401).json({ error: 'Invalid broadcast key' });
  }

  // ── Collect tokens ───────────────────────────────────────────
  const tokensSnap = await db.collection(TOKENS).get();
  const tokenDocs = tokensSnap.docs.map((d) => ({ id: d.id, token: d.data().token || d.id }));
  const tokens = tokenDocs.map((t) => t.token);

  if (tokens.length === 0) {
    await writeHistory(db, { title, body, url, type, sentBy: user.name || 'Admin' });
    return res.status(200).json({ ok: true, sent: 0, failed: 0, message: 'No registered devices.' });
  }

  // DATA-only message so the service worker controls rendering everywhere.
  const message = {
    data: {
      title: String(title),
      body: String(body || ''),
      url: String(url || '/'),
      tag: `hi-${type}`,
    },
  };

  // ── Send in batches of 500 (FCM limit) + prune dead tokens ───
  let sent = 0;
  let failed = 0;
  const deadTokens = [];

  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const resp = await messaging.sendEachForMulticast({ ...message, tokens: batch });
    sent += resp.successCount;
    failed += resp.failureCount;
    resp.responses.forEach((r, idx) => {
      if (!r.success) {
        const code = r.error?.code || '';
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/invalid-argument'
        ) {
          deadTokens.push(batch[idx]);
        }
      }
    });
  }

  // Prune dead tokens (best-effort).
  await Promise.all(
    deadTokens.map((tok) => {
      const found = tokenDocs.find((t) => t.token === tok);
      return found ? db.collection(TOKENS).doc(found.id).delete().catch(() => {}) : null;
    })
  );

  // ── History record ───────────────────────────────────────────
  await writeHistory(db, { title, body, url, type, sentBy: user.name || 'Admin' });

  return res.status(200).json({ ok: true, sent, failed, pruned: deadTokens.length });
}

async function writeHistory(db, { title, body, url, type, sentBy }) {
  try {
    await db.collection(NOTIFS).add({
      title: String(title),
      body: String(body || ''),
      url: String(url || '/'),
      type: String(type || 'broadcast'),
      sentBy: String(sentBy || 'Admin'),
      sentAt: Date.now(),
    });
  } catch (err) {
    console.error('Failed to write notification history:', err);
  }
}
