import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, query, where, orderBy, deleteDoc } from 'firebase/firestore';

const COLLECTION_TESTS = 'periodic_predicted_tests';
const COLLECTION_ATTEMPTS = 'periodic_predicted_attempts';

/**
 * Uploads a new JSON test for a specific subject.
 * Automatically determines the next set number.
 */
export async function uploadPeriodicTest(subject, questions) {
  if (questions.length !== 20) {
    throw new Error('Test must contain exactly 20 questions.');
  }

  // Get current max set number for this subject
  const testsRef = collection(db, COLLECTION_TESTS);
  const q = query(testsRef, where('subject', '==', subject));
  const snapshot = await getDocs(q);
  
  let maxSet = 0;
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.setNumber > maxSet) {
      maxSet = data.setNumber;
    }
  });

  const nextSet = maxSet + 1;
  const testId = `${subject}_Set${nextSet}`;

  await setDoc(doc(db, COLLECTION_TESTS, testId), {
    subject,
    setNumber: nextSet,
    questions,
    createdAt: Date.now()
  });

  return nextSet;
}

/**
 * Get available set numbers per subject.
 * Returns an object: { "Science": 2, "Maths": 0, ... } (where value is max set available)
 */
export async function getPeriodicTestsMeta() {
  const testsRef = collection(db, COLLECTION_TESTS);
  const snapshot = await getDocs(testsRef);
  
  const meta = {
    'Science': 0,
    'Maths': 0,
    'SST': 0,
    'English': 0,
    'Hindi': 0,
    'IT': 0
  };

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.subject && data.setNumber > (meta[data.subject] || 0)) {
      meta[data.subject] = data.setNumber;
    }
  });

  return meta;
}

/**
 * Fetch a specific periodic test by subject and set number.
 */
export async function getPeriodicTest(subject, setNumber) {
  const testId = `${subject}_Set${setNumber}`;
  const docRef = doc(db, COLLECTION_TESTS, testId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Test not found');
  }
  return { id: docSnap.id, ...docSnap.data() };
}

/**
 * Submit a periodic test attempt (saves as a new entry).
 */
export async function submitPeriodicAttempt(userId, data) {
  const attemptsRef = collection(db, COLLECTION_ATTEMPTS);
  
  const attemptDoc = {
    userId,
    subject: data.subject,
    setNumber: data.setNumber,
    score: data.score,
    total: data.total,
    responses: data.responses,
    wrongIndices: data.wrongIndices || [],
    timeConsumed: data.timeConsumed,
    timestamp: Date.now()
  };

  await addDoc(attemptsRef, attemptDoc);
}

/**
 * Fetch all periodic test attempts for a user (for the Report Card).
 */
export async function getUserPeriodicAttempts(userId) {
  const attemptsRef = collection(db, COLLECTION_ATTEMPTS);
  const q = query(attemptsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  
  const attempts = [];
  snapshot.forEach(docSnap => {
    attempts.push({ id: docSnap.id, ...docSnap.data() });
  });
  
  // Sort descending by timestamp in frontend to avoid Firestore composite index
  attempts.sort((a, b) => b.timestamp - a.timestamp);
  
  return attempts;
}

/**
 * Delete a specific periodic test by subject and set number.
 */
export async function deletePeriodicTest(subject, setNumber) {
  const testId = `${subject}_Set${setNumber}`;
  const docRef = doc(db, COLLECTION_TESTS, testId);
  await deleteDoc(docRef);
}
