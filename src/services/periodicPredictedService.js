import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, query, where, orderBy, deleteDoc, limit } from 'firebase/firestore';
import { resolveToCanonical } from '../data/periodicTopicTaxonomy';

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

  // Fetch all subsequent sets for this subject to shift them down
  const testsRef = collection(db, COLLECTION_TESTS);
  const q = query(testsRef, where('subject', '==', subject));
  const snapshot = await getDocs(q);
  
  const setsToShift = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.setNumber > setNumber) {
      setsToShift.push({ id: docSnap.id, ...data });
    }
  });

  // Sort ascending so we process Set 3 -> Set 2, then Set 4 -> Set 3
  setsToShift.sort((a, b) => a.setNumber - b.setNumber);

  for (const test of setsToShift) {
    const newSetNumber = test.setNumber - 1;
    const newTestId = `${subject}_Set${newSetNumber}`;
    
    const newData = { ...test };
    delete newData.id;
    newData.setNumber = newSetNumber;
    
    // Create the shifted doc
    await setDoc(doc(db, COLLECTION_TESTS, newTestId), newData);
    
    // Delete the old doc
    await deleteDoc(doc(db, COLLECTION_TESTS, test.id));
  }
}

/**
 * Repairs the sequence of tests for a given subject (fixes any missing gaps).
 */
export async function repairPeriodicTestSequence(subject) {
  const testsRef = collection(db, COLLECTION_TESTS);
  const q = query(testsRef, where('subject', '==', subject));
  const snapshot = await getDocs(q);
  
  const allSets = [];
  snapshot.forEach(docSnap => {
    allSets.push({ id: docSnap.id, ...docSnap.data() });
  });

  allSets.sort((a, b) => a.setNumber - b.setNumber);

  let expectedSetNumber = 1;
  for (const test of allSets) {
    if (test.setNumber !== expectedSetNumber) {
      const newTestId = `${subject}_Set${expectedSetNumber}`;
      
      const newData = { ...test };
      delete newData.id;
      newData.setNumber = expectedSetNumber;
      
      await setDoc(doc(db, COLLECTION_TESTS, newTestId), newData);
      await deleteDoc(doc(db, COLLECTION_TESTS, test.id));
    }
    expectedSetNumber++;
  }
}

/**
 * Fetch the most recent periodic test attempts across all users.
 */
export async function getAllRecentPeriodicAttempts(limitCount = 30) {
  const attemptsRef = collection(db, COLLECTION_ATTEMPTS);
  const q = query(attemptsRef, orderBy('timestamp', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  
  const attempts = [];
  snapshot.forEach(docSnap => {
    attempts.push({ id: docSnap.id, ...docSnap.data() });
  });
  
  return attempts;
}

const CONFIG_DOC = 'periodic_predicted_config/main';

export async function getPeriodicConfig() {
  const docRef = doc(db, 'system_configs', 'periodic_predicted');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return { isHidden: false };
}

export async function setPeriodicConfig(config) {
  const docRef = doc(db, 'system_configs', 'periodic_predicted');
  await setDoc(docRef, config, { merge: true });
}

// ─── Topic Mastery Report Card ───────────────────────────────────────────────

/**
 * Fetch all test documents for a subject, keyed by setNumber.
 * Used to resolve wrongIndices → concept names for the topic mastery report.
 *
 * @param {string} subject
 * @returns {Object} { 1: testDoc, 2: testDoc, ... }
 */
export async function getAllTestsForSubject(subject) {
  const testsRef = collection(db, COLLECTION_TESTS);
  const q = query(testsRef, where('subject', '==', subject));
  const snapshot = await getDocs(q);
  const tests = {};
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    tests[data.setNumber] = data;
  });
  return tests;
}

import { PERIODIC_TOPIC_TAXONOMY } from '../data/periodicTopicTaxonomy';

/**
 * Compute per-concept wrong answer stats using the most-recent attempt per set.
 * Pre-seeds ALL canonical topics for the subject so they are always displayed.
 * Groups wrong answers by their canonical concept name from the taxonomy.
 *
 * @param {string} subject
 * @param {Object} allTests  - { setNumber: testDoc } from getAllTestsForSubject
 * @param {Array}  attempts  - all attempts for this subject (any order)
 * @returns {Object} { "Prime Factorisation": { wrong: 2 }, ... }
 */
export function computeConceptStats(subject, allTests, attempts) {
  const conceptStats = {};
  
  // Pre-seed all canonical topics for this subject
  const topics = PERIODIC_TOPIC_TAXONOMY[subject] || [];
  topics.forEach(t => {
    conceptStats[t] = { wrong: 0 };
  });

  // Pick the most-recent attempt per set number
  const latestPerSet = {};
  attempts.forEach(attempt => {
    const prev = latestPerSet[attempt.setNumber];
    if (!prev || attempt.timestamp > prev.timestamp) {
      latestPerSet[attempt.setNumber] = attempt;
    }
  });

  Object.entries(latestPerSet).forEach(([setNum, attempt]) => {
    const testData = allTests[parseInt(setNum)];
    if (!testData) return;

    const allQuestions = (testData.questions || []).filter(q => !q.isDeleted);
    const wrongSet = new Set(attempt.wrongIndices || []);

    allQuestions.forEach((q, originalIdx) => {
      if (wrongSet.has(originalIdx)) {
        const raw = q.concept || q.topic || 'General';
        const canonical = resolveToCanonical(subject, raw);
        if (!conceptStats[canonical]) conceptStats[canonical] = { wrong: 0 };
        conceptStats[canonical].wrong += 1;
      }
    });
  });

  return conceptStats;
}

/**
 * Classify concept stats into Strong / Medium / Weak tiers based on absolute wrong counts.
 *
 * Thresholds:
 *  Strong:  0 wrong
 *  Medium:  1 to 3 wrong
 *  Weak:    > 3 wrong
 *
 * @param {Object} conceptStats - from computeConceptStats
 * @returns {{ strong: Array, medium: Array, weak: Array }}
 */
export function classifyConceptStats(conceptStats) {
  const strong = [], medium = [], weak = [];

  Object.entries(conceptStats).forEach(([concept, { wrong }]) => {
    // Ignore legacy "General" or alias topics if they ended up with 0 wrong,
    // so we don't clutter the board with "Number System" holding 0 wrong.
    // We only want the canonical 14 topics if they have 0 wrong.
    const isCanonical = Object.values(PERIODIC_TOPIC_TAXONOMY).flat().includes(concept);
    if (!isCanonical && wrong === 0) return;

    const item = { concept, wrong };
    if (wrong === 0) strong.push(item);
    else if (wrong <= 3) medium.push(item);
    else weak.push(item);
  });

  // Sort by wrong count: weak (highest wrong first), medium (highest wrong first), strong (alphabetical)
  strong.sort((a, b) => a.concept.localeCompare(b.concept));
  medium.sort((a, b) => b.wrong - a.wrong);
  weak.sort((a, b) => b.wrong - a.wrong);

  return { strong, medium, weak };
}

/**
 * Read the cached Topic Mastery Report Card for a user + subject from Firestore.
 * Returns null if not found.
 * The cache document also acts as an "unlock token" — its existence means the
 * student has previously completed all sets for this subject.
 *
 * @param {string} userId
 * @param {string} subject
 * @returns {Object|null}
 */
export async function getSubjectReportCard(userId, subject) {
  const docRef = doc(db, 'periodic_report_cards', `${userId}_${subject}`);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}

/**
 * Save / update the Topic Mastery Report Card cache for a user + subject.
 *
 * @param {string} userId
 * @param {string} subject
 * @param {Object} payload  - { narrative, studyTips, hash }
 */
export async function saveSubjectReportCard(userId, subject, payload) {
  const docRef = doc(db, 'periodic_report_cards', `${userId}_${subject}`);
  await setDoc(docRef, { ...payload, updatedAt: Date.now() });
}
