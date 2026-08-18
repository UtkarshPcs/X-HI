import { collection, doc, setDoc, addDoc, getDocs, getDoc, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// ── Tests ──

export async function uploadTermPracticeTest(testData) {
  const ref = collection(db, 'termPracticeTests');
  const docRef = await addDoc(ref, {
    subjectId: testData.subjectId || 'Unknown',
    title: testData.title || 'Untitled Test',
    questions: testData.questions || [],
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function getTermPracticeTestsBySubject(subjectId) {
  const q = query(collection(db, 'termPracticeTests'), where('subjectId', '==', subjectId));
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Sort descending by createdAt in JS
  return docs.sort((a, b) => {
    const timeA = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
    const timeB = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
    return timeB - timeA;
  });
}

export async function getTermPracticeTestById(testId) {
  const ref = doc(db, 'termPracticeTests', testId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Test not found");
  return { id: snap.id, ...snap.data() };
}

// ── Attempts ──

export async function submitTermPracticeAttempt(attemptData) {
  const ref = collection(db, 'termPracticeTestAttempts');
  const docRef = await addDoc(ref, {
    userId: attemptData.userId,
    testId: attemptData.testId,
    subjectId: attemptData.subjectId,
    score: attemptData.score,
    total: attemptData.total,
    responses: attemptData.responses,
    totalTime: attemptData.totalTime || 0,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function getUserTermPracticeHistory(userId) {
  const q = query(collection(db, 'termPracticeTestAttempts'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  return docs.sort((a, b) => {
    const timeA = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
    const timeB = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
    return timeB - timeA;
  });
}
