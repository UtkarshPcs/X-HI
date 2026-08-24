import { collection, getDocs, doc, getDoc, query, where, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Fetches the active syllabus (list of chapterIds) for a given subject.
 * Assumes a document in 'active_syllabus' collection named after the subject (e.g. 'SST').
 */
export async function fetchActiveSyllabus(subject) {
  try {
    const docRef = doc(db, 'active_syllabus', subject.toUpperCase());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().chapterIds) {
      return docSnap.data().chapterIds;
    }
    return [];
  } catch (error) {
    console.error("Error fetching active syllabus:", error);
    return [];
  }
}

/**
 * Fetches all questions from the 'question_bank' collection that belong to the given subject and chapters.
 * Note: Firestore 'in' query supports a maximum of 10 items.
 * If there are more than 10 chapters, we fetch all subject questions and filter client-side to avoid complex chunking for now.
 */
export async function fetchQuestionsByChapters(subject, chapterIds) {
  try {
    const q = query(
      collection(db, 'question_bank'),
      where('subject', '==', subject.toUpperCase())
    );
    const querySnapshot = await getDocs(q);
    const questions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (chapterIds.includes(data.chapterId)) {
        questions.push({ ...data, id: doc.id });
      }
    });
    return questions;
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
}

/**
 * Fetches the user's question history to see which questions they got correct/incorrect.
 * Returns a map of questionId -> 'correct' | 'incorrect'
 */
export async function fetchUserQuestionHistory(userId) {
  try {
    const historyRef = collection(db, 'users', userId, 'question_history');
    const snapshot = await getDocs(historyRef);
    const historyMap = {};
    snapshot.forEach(doc => {
      historyMap[doc.id] = doc.data().status;
    });
    return historyMap;
  } catch (error) {
    console.error("Error fetching user history:", error);
    return {};
  }
}

/**
 * Batch updates user's question history.
 * @param {string} userId 
 * @param {Array<{questionId: string, status: 'correct'|'incorrect'}>} results 
 */
export async function updateUserQuestionHistory(userId, results) {
  try {
    const batch = writeBatch(db);
    results.forEach(res => {
      const docRef = doc(db, 'users', userId, 'question_history', res.questionId);
      batch.set(docRef, { status: res.status, lastAttemptDate: new Date().toISOString() }, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error updating user question history:", error);
  }
}

/**
 * Uploads an array of questions to the 'question_bank' collection in Firestore.
 * Each question must have subjectId, chapterId, type, marks, etc.
 */
export async function uploadQuestionBankJSON(questionsArray) {
  if (!Array.isArray(questionsArray)) {
    throw new Error("Invalid format. Expected an array of question objects.");
  }

  // Upload in chunks of 500 (Firestore batch limit)
  let batch = writeBatch(db);
  let count = 0;
  
  // Utility to prevent Firestore "Nested arrays are not supported" error
  const replaceNestedArrays = (obj, inArray = false) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      if (inArray) {
        const sanitizedObj = {};
        obj.forEach((val, idx) => {
          sanitizedObj[idx] = replaceNestedArrays(val, false);
        });
        return sanitizedObj;
      }
      return obj.map(val => replaceNestedArrays(val, true));
    }
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = replaceNestedArrays(obj[key], false);
      }
    }
    return newObj;
  };

  for (const q of questionsArray) {
    if (!q.question_id) {
      q.question_id = 'qb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    }
    // ensure 'subject' field exists for filtering (derive from subjectId if missing)
    if (!q.subject && q.subjectId) {
      q.subject = (q.subjectId.split('-')[0] || q.subjectId).toUpperCase();
      if (q.subject === 'SST' || q.subjectId.startsWith('sst')) q.subject = 'SST';
      else if (q.subjectId.startsWith('sci')) q.subject = 'SCIENCE';
      else if (q.subjectId.startsWith('math')) q.subject = 'MATH';
    }

    const sanitizedQ = replaceNestedArrays(q, false);

    const docRef = doc(db, 'question_bank', q.question_id);
    batch.set(docRef, {
      ...sanitizedQ,
      uploadedAt: new Date().toISOString()
    });
    
    count++;
    if (count % 500 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  
  if (count % 500 !== 0) {
    await batch.commit();
  }
}

/**
 * Sets the active syllabus for a subject.
 */
export async function uploadActiveSyllabus(subject, chapterIdsArray) {
  const docRef = doc(db, 'active_syllabus', subject.toUpperCase());
  await setDoc(docRef, {
    chapterIds: chapterIdsArray,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Fetches pending API uploads for the Universal Practice Set.
 */
export async function fetchUniversalApiUploads() {
  try {
    const q = query(collection(db, 'universal_api_uploads'));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return docs.sort((a, b) => {
      const timeA = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error fetching universal API uploads:", error);
    return [];
  }
}

/**
 * Confirms a pending API upload by moving it to the question_bank collection
 * and updating the status to 'confirmed'.
 */
export async function confirmUniversalUpload(uploadId, payload) {
  try {
    // 1. Upload to the Universal Question Bank
    await uploadQuestionBankJSON(payload);
    
    // 2. Mark as confirmed
    const docRef = doc(db, 'universal_api_uploads', uploadId);
    await setDoc(docRef, { status: 'confirmed' }, { merge: true });
  } catch (error) {
    console.error("Error confirming universal upload:", error);
    throw error;
  }
}

/**
 * Fetches the division of questions for a selected chapter.
 */
export async function fetchChapterQuestionAnalytics(subject, chapterId) {
  try {
    const questions = await fetchQuestionsByChapters(subject, [chapterId]);
    let marksBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    questions.forEach(q => {
      if (q.marks && marksBreakdown[q.marks] !== undefined) {
        marksBreakdown[q.marks]++;
      }
    });
    return {
      totalEligible: questions.length,
      marksBreakdown
    };
  } catch (error) {
    console.error("Error fetching chapter analytics:", error);
    return null;
  }
}
