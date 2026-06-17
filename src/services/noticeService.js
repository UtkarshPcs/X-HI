import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const NOTICES = 'notices';

/**
 * Notice data model (Firestore collection `notices`):
 * {
 *   body: string,        // Markdown content
 *   authorName: string,  // display name of monitor/admin
 *   authorPhone: string, // author's phone (doc id reference)
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 * }
 */

export async function getNotices() {
  const q = query(collection(db, NOTICES), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      // Normalize timestamps to millis for easy rendering; handle the
      // brief window where serverTimestamp() hasn't resolved yet.
      createdAtMs: data.createdAt?.toMillis?.() ?? Date.now(),
      updatedAtMs: data.updatedAt?.toMillis?.() ?? null,
    };
  });
}

export async function addNotice({ body, authorName, authorPhone }) {
  const ref = await addDoc(collection(db, NOTICES), {
    body: body.trim(),
    authorName,
    authorPhone,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateNotice(id, { body }) {
  await updateDoc(doc(db, NOTICES, id), {
    body: body.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNotice(id) {
  await deleteDoc(doc(db, NOTICES, id));
}
