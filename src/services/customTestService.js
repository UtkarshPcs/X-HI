import { collection, doc, setDoc, addDoc, getDocs, getDoc, query, where, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ── Tests ──

export async function createCustomTest(testData) {
  const ref = collection(db, 'starBatchCustomTests');
  const docRef = await addDoc(ref, {
    title: testData.title || 'Untitled Test',
    description: testData.description || '',
    syllabus: testData.syllabus || '',
    timer: testData.timer || { type: 'none' },
    questions: testData.questions || [],
    isPrivate: testData.isPrivate !== undefined ? testData.isPrivate : true,
    allowMultipleAttempts: testData.allowMultipleAttempts !== undefined ? testData.allowMultipleAttempts : true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateCustomTest(testId, updates) {
  const ref = doc(db, 'starBatchCustomTests', testId);
  await setDoc(ref, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getCustomTests() {
  const q = query(collection(db, 'starBatchCustomTests'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getCustomTestById(testId) {
  const ref = doc(db, 'starBatchCustomTests', testId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Custom test not found");
  return { id: snap.id, ...snap.data() };
}

export async function deleteCustomTest(testId) {
  const ref = doc(db, 'starBatchCustomTests', testId);
  await deleteDoc(ref);
}

// ── Attempts ──

export async function submitCustomTestAttempt(attemptData) {
  const ref = collection(db, 'starBatchCustomTestAttempts');
  const docRef = await addDoc(ref, {
    testId: attemptData.testId,
    // For logged-in users, we use userId. For public anonymous users, we use publicUser object.
    userId: attemptData.userId || null,
    publicUser: attemptData.publicUser || null, 
    score: attemptData.score,
    total: attemptData.total,
    responses: attemptData.responses,
    totalTime: attemptData.totalTime || 0,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function getCustomTestAttempts(testId) {
  const q = query(collection(db, 'starBatchCustomTestAttempts'), where('testId', '==', testId));
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  return docs.sort((a, b) => {
    const timeA = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
    const timeB = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
    return timeB - timeA;
  });
}

export async function getUserCustomTestAttempts(testId, userId) {
  if (!userId) return []; // public users can't fetch their past attempts reliably
  
  const q = query(
    collection(db, 'starBatchCustomTestAttempts'), 
    where('testId', '==', testId),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  return docs.sort((a, b) => {
    const timeA = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
    const timeB = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
    return timeB - timeA;
  });
}
