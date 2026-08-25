import { PAPER_BLUEPRINTS } from '../data/testConfig';

/**
 * Core algorithm to generate a dynamic paper matching exactly 80 marks according to the blueprint.
 * Incorporates spaced-repetition logic by weighting questions based on past performance.
 */
export function generatePaper(subject, availableQuestions, userHistory) {
  const isMapQuestion = q => q['sub-type'] === 'Map-Based' || (q.topic || '').toLowerCase().includes('map') || (q.subtopic || '').toLowerCase().includes('map');

  const blueprint = PAPER_BLUEPRINTS[subject.toUpperCase()];
  if (!blueprint) {
    throw new Error(`No blueprint found for subject: ${subject}`);
  }

  const chapterUsage = {}; 
  const selectedQuestions = [];

  const pickQuestion = (subSubjectId, type, marks, count, isMap = false, subType = null) => {
    let candidates = availableQuestions.filter(q => 
        (subSubjectId === 'math-all' || q.subjectId === subSubjectId) && 
        q.type === type && 
        q.marks === marks &&
        !selectedQuestions.find(sq => (sq.question_id || sq.id) === (q.question_id || q.id))
    );

    if (isMap) {
       candidates = candidates.filter(isMapQuestion);
    } else {
       candidates = candidates.filter(q => !isMapQuestion(q));
    }
    
    if (subType === 'Assertion-Reason') {
       candidates = candidates.filter(q => q['sub-type'] === 'Assertion-Reason');
    } else if (subType === 'MCQ') {
       candidates = candidates.filter(q => q['sub-type'] !== 'Assertion-Reason');
    }

    if (candidates.length < count) {
      console.warn(`Not enough questions for ${subSubjectId} - Type: ${type}, Marks: ${marks}, SubType: ${subType}. Need ${count}, found ${candidates.length}.`);
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

  // 1. Gather all required questions without pushing directly to the final array order
  Object.entries(blueprint).forEach(([subSubjectId, reqs]) => {
    if (reqs.mcq > 0) pickQuestion(subSubjectId, 'objective', 1, reqs.mcq, false, 'MCQ');
    if (reqs.ar > 0) pickQuestion(subSubjectId, 'objective', 1, reqs.ar, false, 'Assertion-Reason');
    if (reqs.vsa > 0) pickQuestion(subSubjectId, 'subjective', 2, reqs.vsa);
    if (reqs.sa > 0) pickQuestion(subSubjectId, 'subjective', 3, reqs.sa);
    if (reqs.la > 0) pickQuestion(subSubjectId, 'subjective', 5, reqs.la);
    if (reqs.case > 0) pickQuestion(subSubjectId, 'subjective', 4, reqs.case);
    if (reqs.map > 0) pickQuestion(subSubjectId, 'subjective', reqs.map, 1, true); 
  });

  // 2. Sort and structure into sections according to CBSE layout
  const orderedQuestions = [];

  const addSection = (sectionName, filterFn, sortFn = null) => {
    let qs = selectedQuestions.filter(filterFn);
    if (sortFn) {
      qs = qs.sort(sortFn);
    }
    if (qs.length > 0) {
      qs[0].sectionTitle = sectionName; // Tag the first question of this block
      orderedQuestions.push(...qs);
    }
  };

  const sortARLast = (a, b) => {
    const isAR_A = a['sub-type'] === 'Assertion-Reason' ? 1 : 0;
    const isAR_B = b['sub-type'] === 'Assertion-Reason' ? 1 : 0;
    return isAR_A - isAR_B;
  };

  addSection('Section A (Multiple Choice Questions - 1 Mark each)', q => q.type === 'objective' && q.marks === 1 && !isMapQuestion(q), sortARLast);
  addSection('Section B (Very Short Answer - 2 Marks each)', q => q.type === 'subjective' && q.marks === 2 && !isMapQuestion(q));
  addSection('Section C (Short Answer - 3 Marks each)', q => q.type === 'subjective' && q.marks === 3 && !isMapQuestion(q));
  addSection('Section D (Long Answer - 5 Marks each)', q => q.type === 'subjective' && q.marks === 5 && !isMapQuestion(q));
  addSection('Section E (Case-based Questions - 4 Marks each)', q => q.type === 'subjective' && q.marks === 4 && !isMapQuestion(q));
  addSection('Section F (Map Skill-Based Questions)', isMapQuestion);

  return {
    id: `generated-${subject.toLowerCase()}-${Date.now()}`,
    title: `Dynamic ${subject.toUpperCase()} Term Practice Set`,
    subjectId: subject.toLowerCase(),
    questions: orderedQuestions
  };
}
