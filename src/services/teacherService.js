import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const COL = collection(db, 'teachers');
const ref = id => doc(db, 'teachers', id);

export async function getTeachers() {
  const snap = await getDocs(COL);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getTeacher(id) {
  const snap = await getDoc(ref(id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addTeacher({ name, subject, period, password }) {
  const passwordHash = await sha256(password);
  return addDoc(COL, { name, subject, period, passwordHash, createdAt: Date.now() });
}

export async function updateTeacherPassword(id, password) {
  const passwordHash = await sha256(password);
  await updateDoc(ref(id), { passwordHash });
}

export async function deleteTeacher(id) {
  await deleteDoc(ref(id));
}

export async function loginTeacher(id, password) {
  const teacher = await getTeacher(id);
  if (!teacher) return null;
  const hash = await sha256(password);
  if (hash !== teacher.passwordHash) return null;
  return teacher;
}
