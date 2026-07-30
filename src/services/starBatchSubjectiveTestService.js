import { collection, doc, setDoc, addDoc, getDocs, getDoc, query, where, orderBy, limit, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// ── Subjective Tests ──

export async function processSingleSubjectiveTest(testData) {
  if (!testData.chapterId) throw new Error("Missing chapterId in JSON");
  if (!testData.questions || !Array.isArray(testData.questions) || testData.questions.length === 0) {
    throw new Error("Test must have questions array");
  }

  const existingTest = await getSubjectiveTestByChapter(testData.chapterId);
  
  if (existingTest) {
    const ref = doc(db, 'starBatchSubjectiveTests', existingTest.id);
    
    const getQKey = (q) => {
      const text = (q.text || q.questionText || '').trim().toLowerCase();
      const img = (q.imageUrl || '').trim();
      return `${text}|${img}`;
    };

    const existingKeys = new Set(existingTest.questions.map(getQKey));
    const newUniqueQuestions = [];

    for (const q of testData.questions) {
      const key = getQKey(q);
      if (key !== '|' && !existingKeys.has(key)) {
        existingKeys.add(key);
        newUniqueQuestions.push(q);
      }
    }

    if (newUniqueQuestions.length > 0) {
      await setDoc(ref, {
        questions: [...existingTest.questions, ...newUniqueQuestions],
        title: testData.title || existingTest.title
      }, { merge: true });
    }
    return existingTest.id;
  }

  const ref = collection(db, 'starBatchSubjectiveTests');
  const docRef = await addDoc(ref, {
    chapterId: testData.chapterId,
    subjectId: testData.subjectId || 'Unknown',
    sectionId: testData.sectionId || 'Unknown',
    title: testData.title || 'Untitled Subjective Test',
    type: 'subjective',
    questions: testData.questions,
    createdAt: serverTimestamp()
  });
  
  return docRef.id;
}

export async function uploadSubjectiveTestJSON(testData) {
  if (Array.isArray(testData)) {
    const results = [];
    for (const test of testData) {
      results.push(await processSingleSubjectiveTest(test));
    }
    return results;
  } else {
    return await processSingleSubjectiveTest(testData);
  }
}

export async function getAllSubjectiveTests() {
  const q = query(collection(db, 'starBatchSubjectiveTests'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getSubjectiveTestByChapter(chapterId) {
  const q = query(collection(db, 'starBatchSubjectiveTests'), where('chapterId', '==', chapterId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function getSubjectiveTestById(testId) {
  const ref = doc(db, 'starBatchSubjectiveTests', testId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Subjective Test not found");
  return { id: snap.id, ...snap.data() };
}

// ── Attempts ──

export async function submitSubjectiveTestAttempt(attemptData) {
  const ref = collection(db, 'starBatchSubjectiveTestAttempts');
  const docRef = await addDoc(ref, {
    userId: attemptData.userId,
    testId: attemptData.testId,
    chapterId: attemptData.chapterId,
    marksObtained: attemptData.marksObtained,
    totalMarks: attemptData.totalMarks,
    responses: attemptData.responses, // Array of marks per question index
    seenIndices: attemptData.seenIndices || [],
    difficultyStats: attemptData.difficultyStats || null,
    topicStats: attemptData.topicStats || null,
    totalTime: attemptData.totalTime || 0,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function getAllSubjectiveTestAttempts() {
  const q = query(collection(db, 'starBatchSubjectiveTestAttempts'));
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => {
    const timeA = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
    const timeB = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
    return timeB - timeA;
  });
}

export async function getUserSubjectiveTestAttemptsForTest(userId, testId) {
  const q = query(
    collection(db, 'starBatchSubjectiveTestAttempts'), 
    where('userId', '==', userId),
    where('testId', '==', testId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeToUserSubjectiveHistory(userId, callback) {
  const q = query(collection(db, 'starBatchSubjectiveTestAttempts'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    docs.sort((a, b) => {
      const timeA = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });
    callback(docs);
  }, (error) => {
    console.error("Error in subjective history subscription:", error);
  });
}
