import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generatePaper } from './coreGenerator';
import { fetchActiveSyllabus, fetchQuestionsByChapters, fetchUserQuestionHistory } from './testGenerationService';

/**
 * Orchestrates the generation of a dynamic test and saves it to Firestore.
 * Returns the generated test ID so the player can load it.
 */
export async function createAndSaveDynamicTest(subject, userId) {
  try {
    // 1. Fetch syllabus
    const syllabus = await fetchActiveSyllabus(subject);
    if (!syllabus || syllabus.length === 0) {
      throw new Error(`No active syllabus found for ${subject}.`);
    }

    // 2. Fetch available questions
    const availableQuestions = await fetchQuestionsByChapters(subject, syllabus);
    if (!availableQuestions || availableQuestions.length === 0) {
      throw new Error(`No questions found for the active syllabus chapters of ${subject}.`);
    }

    // 3. Fetch user history for spaced repetition
    const userHistory = await fetchUserQuestionHistory(userId);

    // 4. Generate the paper
    const generatedTest = generatePaper(subject, availableQuestions, userHistory);

    // 5. Save to Firestore so the player can fetch it via testId
    // Assuming termPracticeService uses a collection called 'term_practice_tests'
    const docRef = await addDoc(collection(db, 'term_practice_tests'), {
      title: generatedTest.title,
      subjectId: generatedTest.subjectId,
      questions: generatedTest.questions,
      createdAt: new Date().toISOString(),
      isDynamic: true,
      userId: userId // optional, to link it to the user who generated it
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating dynamic test:", error);
    throw error;
  }
}
