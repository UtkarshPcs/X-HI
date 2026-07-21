import { doc, getDoc, getDocs, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function createPage(pageId, data) {
  const ref = doc(db, 'custom_pages', pageId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    throw new Error('A page with this ID already exists.');
  }
  await setDoc(ref, {
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
}

export async function updatePage(pageId, data) {
  const ref = doc(db, 'custom_pages', pageId);
  await setDoc(ref, {
    ...data,
    updatedAt: Date.now()
  }, { merge: true });
}

export async function getPage(pageId) {
  const ref = doc(db, 'custom_pages', pageId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getAllPages() {
  const snap = await getDocs(collection(db, 'custom_pages'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function deletePage(pageId) {
  await deleteDoc(doc(db, 'custom_pages', pageId));
}
