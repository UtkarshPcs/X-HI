import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * We will store the tracking progress in:
 * users/{userId}/starBatchTracking/progress
 * 
 * The document will look like:
 * {
 *   completedTasks: {
 *     "chapterId-taskId": true,
 *     "science-0-c0-ncert-reading": true,
 *     ...
 *   }
 * }
 */

export async function getSyllabusProgress(userId) {
  if (!userId) return {};
  const docRef = doc(db, 'users', userId, 'starBatchTracking', 'progress');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data().completedTasks || {};
  }
  return {};
}

export async function toggleTaskCompletion(userId, chapterId, taskId, isCompleted) {
  if (!userId) return;
  const docRef = doc(db, 'users', userId, 'starBatchTracking', 'progress');
  
  const snap = await getDoc(docRef);
  let completedTasks = {};
  if (snap.exists()) {
    completedTasks = snap.data().completedTasks || {};
  }
  
  const key = `${chapterId}-${taskId}`;
  if (isCompleted) {
    completedTasks[key] = true;
  } else {
    delete completedTasks[key];
  }
  
  await setDoc(docRef, { completedTasks });
  return completedTasks;
}
