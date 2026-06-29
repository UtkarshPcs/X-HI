import {
  collection, doc, addDoc, getDoc, getDocs, deleteDoc,
  setDoc, query, orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// Firestore layout:
//   mathTests/{testId}                 — dynamic test definition
//   mathTestMarks/{testId}_{rollNo}    — one student's mark for a test
//
// Phase 1: this data is collected by teachers but NOT yet surfaced to
// students. Legacy Test 1 & 2 remain in src/data/mathMarks.js untouched.

const TESTS = 'mathTests';
const MARKS = 'mathTestMarks';

export async function getTests() {
  const snap = await getDocs(query(collection(db, TESTS), orderBy('order', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createTest({ name, maxMarks, createdBy }) {
  // Next order = current count + 3 (reserving 1 & 2 for the legacy tests)
  const existing = await getTests();
  const nextOrder = existing.length ? Math.max(...existing.map(t => t.order || 0)) + 1 : 3;
  const ref = await addDoc(collection(db, TESTS), {
    name: name.trim(),
    maxMarks: Number(maxMarks),
    order: nextOrder,
    createdBy: createdBy || null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteTest(testId) {
  // Remove the test definition and every mark belonging to it.
  const marks = await getTestMarks(testId);
  await Promise.all(marks.map(m => deleteDoc(doc(db, MARKS, `${testId}_${m.rollNo}`))));
  await deleteDoc(doc(db, TESTS, testId));
}

export async function getTestMarks(testId) {
  const q = query(collection(db, MARKS), where('testId', '==', testId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setStudentMark(testId, rollNo, marks) {
  // Single document per test+student. Read-modify-write keeps it simple
  // and unambiguous (no dot-notation merge pitfalls).
  const docRef = doc(db, MARKS, `${testId}_${rollNo}`);
  await setDoc(docRef, {
    testId,
    rollNo,
    marks, // number or "Ab"
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStudentMark(testId, rollNo) {
  await deleteDoc(doc(db, MARKS, `${testId}_${rollNo}`));
}
