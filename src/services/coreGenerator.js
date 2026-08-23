import { PAPER_BLUEPRINTS } from '../data/testConfig';

/**
 * Core algorithm to generate a dynamic paper matching exactly 80 marks according to the blueprint.
 * Incorporates spaced-repetition logic by weighting questions based on past performance.
 */
export function generatePaper(subject, availableQuestions, userHistory) {
  const blueprint = PAPER_BLUEPRINTS[subject.toUpperCase()];
  if (!blueprint) {
    throw new Error(`No blueprint found for subject: ${subject}`);
  }

  const chapterUsage = {}; 
  const selectedQuestions = [];

  const pickQuestion = (subSubjectId, type, marks, count, isMap = false) => {
    let candidates = availableQuestions.filter(q => 
        (subSubjectId === 'math-all' || q.subjectId === subSubjectId) && 
        q.type === type && 
        q.marks === marks &&
        !selectedQuestions.find(sq => (sq.question_id || sq.id) === (q.question_id || q.id))
    );

    if (isMap) {
       candidates = candidates.filter(q => (q.topic || '').toLowerCase().includes('map') || (q.subtopic || '').toLowerCase().includes('map'));
    } else {
       candidates = candidates.filter(q => !(q.topic || '').toLowerCase().includes('map') && !(q.subtopic || '').toLowerCase().includes('map'));
    }

    if (candidates.length < count) {
      console.warn(`Not enough questions for ${subSubjectId} - Type: ${type}, Marks: ${marks}, Map: ${isMap}. Need ${count}, found ${candidates.length}.`);
    }

    // Sort candidates using Priority Scoring
    candidates.sort((a, b) => {
      const qIdA = a.question_id || a.id;
      const qIdB = b.question_id || b.id;
      const statusA = userHistory[qIdA];
      const statusB = userHistory[qIdB];
      const usageA = chapterUsage[a.chapterId] || 0;
      const usageB = chapterUsage[b.chapterId] || 0;

      const getScore = (status, usage) => {
        let score = 0;
        if (status === 'correct') score -= 1000;       // Heavily penalize correct questions to avoid repeating
        else if (status === 'incorrect') score += 500; // Prioritize incorrect questions
        else score += 100;                             // Unseen questions are secondary priority

        score -= (usage * 50);                         // Penalty for overused chapters to enforce variation
        return score + Math.random();                  // Add minor random noise for ties
      };

      return getScore(statusB, usageB) - getScore(statusA, usageA); // Sort descending
    });

    const picked = candidates.slice(0, count);
    picked.forEach(q => {
      chapterUsage[q.chapterId] = (chapterUsage[q.chapterId] || 0) + 1;
      selectedQuestions.push(q);
    });
  };

  // Iterate over blueprint sub-subjects (e.g., sci-phy, sci-chem, sci-bio)
  Object.entries(blueprint).forEach(([subSubjectId, reqs]) => {
    if (reqs.mcq > 0) pickQuestion(subSubjectId, 'objective', 1, reqs.mcq);
    if (reqs.vsa > 0) pickQuestion(subSubjectId, 'subjective', 2, reqs.vsa);
    if (reqs.sa > 0) pickQuestion(subSubjectId, 'subjective', 3, reqs.sa);
    if (reqs.la > 0) pickQuestion(subSubjectId, 'subjective', 5, reqs.la);
    if (reqs.case > 0) pickQuestion(subSubjectId, 'subjective', 4, reqs.case);
    if (reqs.map > 0) pickQuestion(subSubjectId, 'subjective', reqs.map, 1, true); // Map logic
  });

  return {
    id: `generated-${subject.toLowerCase()}-${Date.now()}`,
    title: `Dynamic ${subject.toUpperCase()} Term Practice Set`,
    subjectId: subject.toLowerCase(),
    questions: selectedQuestions
  };
}
