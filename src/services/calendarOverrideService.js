import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Admin-managed calendar overrides.
 *
 * Stored in a single Firestore config document: config/calendarOverride
 * {
 *   closedDays: string[]  // extra holidays declared by admin (YYYY-MM-DD)
 * }
 *
 * These are days the base calendar treats as working, but the school
 * later declared closed (e.g. unplanned holidays). They are excluded
 * from attendance for everyone.
 */
const CONFIG_COLLECTION = 'config';
const CONFIG_DOC = 'calendarOverride';

function configRef() {
  return doc(db, CONFIG_COLLECTION, CONFIG_DOC);
}

/** Returns the array of admin-declared closed-day keys (YYYY-MM-DD). */
export async function getClosedDays() {
  const snap = await getDoc(configRef());
  if (!snap.exists()) return [];
  return snap.data().closedDays || [];
}

/** Overwrites the closed-days list (de-duped + sorted). */
export async function setClosedDays(closedDays) {
  const cleaned = Array.from(new Set(closedDays)).sort();
  await setDoc(configRef(), { closedDays: cleaned }, { merge: true });
  return cleaned;
}

/** Adds a single closed day; returns the updated list. */
export async function addClosedDay(dateKey) {
  const current = await getClosedDays();
  if (current.includes(dateKey)) return current;
  return setClosedDays([...current, dateKey]);
}

/** Removes a single closed day; returns the updated list. */
export async function removeClosedDay(dateKey) {
  const current = await getClosedDays();
  return setClosedDays(current.filter((d) => d !== dateKey));
}
