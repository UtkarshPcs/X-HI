import {
  doc, getDoc, setDoc, collection, addDoc,
  getDocs, query, orderBy, where,
} from 'firebase/firestore';
import { db } from '../firebase';

const CONFIG_DOC  = 'appConfig/ctaBanner';
const CLICKS_COL  = 'ctaBannerClicks';

/**
 * Fetch the current CTA banner config.
 * Returns { enabled, message, buttonText, buttonUrl } or null if not set.
 */
export async function getCTABannerConfig() {
  const snap = await getDoc(doc(db, CONFIG_DOC));
  return snap.exists() ? snap.data() : null;
}

/**
 * Save / update the CTA banner config (admin only — no server validation here,
 * the admin panel is already access-controlled).
 */
export async function saveCTABannerConfig({ enabled, message, buttonText, buttonUrl }) {
  await setDoc(doc(db, CONFIG_DOC), {
    enabled:    !!enabled,
    message:    message    || '',
    buttonText: buttonText || 'OK',
    buttonUrl:  buttonUrl  || '',   // empty = stay on page
    updatedAt:  Date.now(),
  });
}

/**
 * Record that a user clicked the CTA button.
 * Upserts so a single student only counts once per banner instance.
 * Uses rollNo as document id so repeated clicks just overwrite.
 */
export async function recordCTAClick({ rollNo, name, phone }) {
  await setDoc(
    doc(db, CLICKS_COL, String(rollNo || phone || 'anon')),
    {
      rollNo:    rollNo  || null,
      name:      name    || 'Unknown',
      phone:     phone   || null,
      clickedAt: Date.now(),
    },
    { merge: true }
  );
}

/**
 * Fetch all CTA click records, newest first.
 */
export async function getCTAClicks() {
  const snap = await getDocs(
    query(collection(db, CLICKS_COL), orderBy('clickedAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Check if this user has already clicked (to avoid duplicate tracking noise).
 */
export async function hasCTAClicked(rollNo, phone) {
  const id = String(rollNo || phone || 'anon');
  const snap = await getDoc(doc(db, CLICKS_COL, id));
  return snap.exists();
}
