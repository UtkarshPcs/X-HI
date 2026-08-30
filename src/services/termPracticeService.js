import { collection, doc, setDoc, addDoc, getDocs, getDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { findReplacementCandidates, isMapQuestion } from './coreGenerator';

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

// ── Report & Replace (dynamic tests only) ──

/**
 * Reports a corrupt question inside a dynamically-generated Term Practice test:
 *  1. Finds a fresh replacement of the same subjectId/type/marks/sub-type from
 *     `question_bank`, excluding every question already in this paper plus any
 *     already-rejected in this session.
 *  2. Atomically (single batch): swaps the question into the test doc at
 *     `questionIndex`, and permanently deletes the reported question's doc
 *     from `question_bank`.
 *
 * @param {string} testId
 * @param {number} questionIndex - index into test.questions[] of the reported question
 * @param {string[]|Set<string>} rejectedIds - IDs already rejected earlier this session (to avoid re-serving them)
 * @returns {Promise<object>} the replacement question that was inserted
 */
export async function reportAndReplaceQuestion(testId, questionIndex, rejectedIds = []) {
  const testRef = doc(db, 'termPracticeTests', testId);
  const testSnap = await getDoc(testRef);
  if (!testSnap.exists()) throw new Error('Test not found');

  const test = testSnap.data();
  const questions = test.questions || [];
  const reported = questions[questionIndex];
  if (!reported) throw new Error('Question not found at the given index');

  const reportedId = reported.question_id || reported.id;
  if (!reportedId) throw new Error('Reported question has no identifiable ID');

  // Build the exclusion set: every question currently in the paper + anything
  // already rejected earlier this session (so we never re-serve a duplicate).
  const excludeIds = new Set(
    questions.map(q => q.question_id || q.id).filter(Boolean)
  );
  const rejectedArr = rejectedIds instanceof Set ? Array.from(rejectedIds) : rejectedIds;
  rejectedArr.forEach(id => excludeIds.add(id));

  // Fetch the candidate pool from question_bank, scoped to the reported
  // question's broad subject (SCIENCE / SST / MATH / etc).
  const subject = (reported.subject || test.subjectId || '').toString().toUpperCase();
  const bankQuery = query(collection(db, 'question_bank'), where('subject', '==', subject));
  const bankSnap = await getDocs(bankQuery);
  const availableQuestions = [];
  bankSnap.forEach(d => availableQuestions.push({ ...d.data(), id: d.id }));

  const subType = reported['sub-type'] || null;
  const candidates = findReplacementCandidates(availableQuestions, {
    subSubjectId: reported.subjectId || null,
    type: reported.type,
    marks: reported.marks,
    isMap: isMapQuestion(reported),
    subType,
    excludeIds
  });

  if (candidates.length === 0) {
    throw new Error('No replacement question available with matching marks/type. Cannot report this question right now.');
  }

  const replacement = candidates[0];

  // Preserve section tagging so the paper layout doesn't shift.
  const newQuestion = { ...replacement };
  if (reported.sectionTitle) newQuestion.sectionTitle = reported.sectionTitle;

  const newQuestions = [...questions];
  newQuestions[questionIndex] = newQuestion;

  const batch = writeBatch(db);
  batch.update(testRef, { questions: newQuestions });
  batch.delete(doc(db, 'question_bank', reportedId));
  await batch.commit();

  return newQuestion;
}
