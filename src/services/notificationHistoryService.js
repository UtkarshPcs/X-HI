import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Notification history.
 *
 * Every push sent via /api/send-notification also writes a record to the
 * `notifications` collection:
 *   { title, body, url, type, sentBy, sentAt }
 *
 * This is the source of truth for the history view, independent of whether a
 * given device actually received the push.
 */
const NOTIFS = 'notifications';

export async function getNotificationHistory(max = 50) {
  const q = query(collection(db, NOTIFS), orderBy('sentAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
