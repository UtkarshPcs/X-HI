import { collection, addDoc, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function createPYQTest(userId, config) {
  const { chapterId, mode, difficulty, count, marks, objCount, objLevel, subjMarks, subjLevel } = config;

  try {
    const qbRef = collection(db, 'question_bank');
    // Fetch all questions for the selected chapter
    const q = query(qbRef, where('chapterId', '==', chapterId));
    const snapshot = await getDocs(q);
    
    let allQuestions = [];
    snapshot.forEach(doc => {
      allQuestions.push({ id: doc.id, ...doc.data() });
    });

    if (allQuestions.length === 0) {
      throw new Error('No questions found for this chapter in the Universal Database.');
    }

    let finalQuestions = [];

    // Helper to filter, shuffle, and slice questions
    const selectQuestions = (qList, limit, isByMarks) => {
      // Shuffle
      const shuffled = [...qList].sort(() => 0.5 - Math.random());
      
      if (!isByMarks) {
        return shuffled.slice(0, limit);
      } else {
        let selected = [];
        let currentMarks = 0;
        for (const q of shuffled) {
          const qMarks = q.marks || (q.type === 'objective' ? 1 : 2); // Default fallback marks
          if (currentMarks + qMarks <= limit) {
            selected.push(q);
            currentMarks += qMarks;
          }
          if (currentMarks === limit) break;
        }
        return selected;
      }
    };

    if (mode === 'objective') {
      const difficultyName = ['Easy', 'Medium', 'Hard'][difficulty - 1];
      const pool = allQuestions.filter(q => q.type === 'objective' && q.difficulty === difficultyName);
      if (pool.length === 0) throw new Error(`No objective questions found for difficulty ${difficultyName}.`);
      finalQuestions = selectQuestions(pool, count, false);
      
    } else if (mode === 'subjective') {
      const difficultyName = ['Easy', 'Medium', 'Hard'][difficulty - 1];
      const pool = allQuestions.filter(q => q.type !== 'objective' && q.difficulty === difficultyName);
      if (pool.length === 0) throw new Error(`No subjective questions found for difficulty ${difficultyName}.`);
      finalQuestions = selectQuestions(pool, marks, true);
      
    } else if (mode === 'mixed') {
      const objDiffName = ['Easy', 'Medium', 'Hard'][objLevel - 1];
      const subjDiffName = ['Easy', 'Medium', 'Hard'][subjLevel - 1];
      
      const objPool = allQuestions.filter(q => q.type === 'objective' && q.difficulty === objDiffName);
      const subjPool = allQuestions.filter(q => q.type !== 'objective' && q.difficulty === subjDiffName);
      
      if (objPool.length === 0 || subjPool.length === 0) {
        throw new Error('Not enough objective and subjective questions for the selected difficulties.');
      }
      
      const selectedObj = selectQuestions(objPool, objCount, false);
      const selectedSubj = selectQuestions(subjPool, subjMarks, true);
      
      finalQuestions = [...selectedObj, ...selectedSubj];
    }

    if (finalQuestions.length === 0) {
      throw new Error('Could not generate test with the specified limits. Please try lowering the limits.');
    }

    const testDoc = {
      chapterId,
      mode,
      difficulty: mode !== 'mixed' ? difficulty : null,
      config,
      questions: finalQuestions,
      createdAt: new Date().toISOString(),
      userId,
      isPYQ: true
    };

    const docRef = await addDoc(collection(db, 'pyq_tests'), testDoc);
    return docRef.id;

  } catch (error) {
    console.error("Error creating PYQ test:", error);
    throw error;
  }
}

export async function getPYQTestById(testId) {
  const docRef = doc(db, 'pyq_tests', testId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() };
  }
  throw new Error('PYQ Test not found.');
}

export async function savePYQAttempt(userId, attemptData) {
  const docRef = await addDoc(collection(db, 'users', userId, 'pyq_history'), attemptData);
  return docRef.id;
}
