import { collection, doc, getDoc, getDocs, setDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { weekdayName } from '../data/routine';

/**
 * Daily classwork records — what was actually taught/done in each period.
 *
 * Firestore model (collection `classwork`, doc id = date key "YYYY-MM-DD"):
 * {
 *   date: "2026-06-19",
 *   weekday: "Friday",
 *   periods: [ { period: "1st", subject: "Hindi", note: "..." }, … ],
 *   updatedBy: "Utkarsh",
 *   updatedAt: 1700000000000,
 * }
 *
 * The `periods` come pre-filled from the weekly routine; the monitor/admin
 * only fills in the `note` (what was covered). A day is considered to "have
 * classwork" if at least one period note is non-empty.
 */
const CLASSWORK = 'classwork';

function classworkRef(dateKey) {
  return doc(db, CLASSWORK, dateKey);
}

/** Returns the classwork doc for a date, or null if none recorded. */
export async function getClasswork(dateKey) {
  const snap = await getDoc(classworkRef(dateKey));
  return snap.exists() ? snap.data() : null;
}

/**
 * Returns all classwork records, newest first, as an array including the
 * date key. Used by the calendar (dot markers) and the Classwork tab.
 */
export async function getAllClasswork() {
  const q = query(collection(db, CLASSWORK), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Saves classwork for a date. Strips empty-note periods on write so a day
 * with no filled notes simply isn't recorded (keeps the calendar honest).
 * Returns the saved doc, or null if nothing to save.
 */
export async function setClasswork(dateKey, periods, user, isTest = false) {
  const cleaned = (periods || [])
    .map((p) => ({ period: p.period, subject: p.subject, note: (p.note || '').trim() }))
    .filter((p) => p.note.length > 0);

  const payload = {
    date: dateKey,
    weekday: weekdayName(dateKey),
    periods: cleaned,
    updatedBy: user?.name || 'Unknown',
    updatedAt: Date.now(),
    ...(isTest && { isTest: true }),
  };
  await setDoc(classworkRef(dateKey), payload);
  return payload;
}

/** True if a classwork record actually has any filled period notes. */
export function hasClasswork(record) {
  return !!record && Array.isArray(record.periods) && record.periods.length > 0;
}
