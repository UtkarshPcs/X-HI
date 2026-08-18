import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, limit, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const GLOBAL_LEADERBOARD_COL = 'globalQuizLeaderboard';
const GLOBAL_QUIZ_MATCHES = 'globalQuizMatches';

/**
 * Records a quiz match globally. Only the room admin should call this when a quiz finishes.
 * It also increments the global win counters for the winners (all users who tied for Rank 1).
 */
export async function recordGlobalQuizResult(quizId, quizMetadata, scores) {
  if (!quizId || scores.length === 0) return;

  // Check if we already recorded this quiz to avoid duplicates
  const matchRef = doc(db, GLOBAL_QUIZ_MATCHES, quizId);
  const matchSnap = await getDoc(matchRef);
  if (matchSnap.exists()) return;

  // Determine winners (Dense Rank 1)
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  if (sorted.length === 0) return;
  
  const maxScore = sorted[0].score;
  const winners = sorted.filter(s => s.score === maxScore);

  // Record the match
  await setDoc(matchRef, {
    quizId,
    subject: quizMetadata.subjectId || 'science',
    difficulty: quizMetadata.difficulty || 'Medium',
    timestamp: serverTimestamp(),
    winners: winners.map(w => ({ id: w.id, name: w.name, score: w.score }))
  });

  // Increment global leaderboards for each winner
  const subjectId = quizMetadata.subjectId || 'science';
  const diff = quizMetadata.difficulty || 'Medium';

  for (const w of winners) {
    const userRef = doc(db, GLOBAL_LEADERBOARD_COL, w.id);
    await setDoc(userRef, {
      name: w.name,
      totalWins: increment(1),
      [`wins_subject_${subjectId}`]: increment(1),
      [`wins_difficulty_${diff}`]: increment(1),
      lastWinAt: serverTimestamp()
    }, { merge: true });
  }
}

/**
 * Fetches the global leaderboard.
 * @param {string} filterType 'total', 'subject', 'difficulty'
 * @param {string} filterValue the specific subject or difficulty to sort by
 */
export async function getGlobalLeaderboard(filterType = 'total', filterValue = '') {
  let sortField = 'totalWins';
  if (filterType === 'subject' && filterValue) {
    sortField = `wins_subject_${filterValue}`;
  } else if (filterType === 'difficulty' && filterValue) {
    sortField = `wins_difficulty_${filterValue}`;
  }

  const q = query(collection(db, GLOBAL_LEADERBOARD_COL), orderBy(sortField, 'desc'), limit(50));
  const snap = await getDocs(q);
  
  const results = [];
  snap.forEach(d => {
    const data = d.data();
    if (data[sortField] > 0) {
      results.push({
        id: d.id,
        ...data,
        displayScore: data[sortField]
      });
    }
  });

  return results;
}
