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

export const DEFAULT_GLOBAL_CHECKLIST = [
  { id: 'ncert-reading', label: 'NCERT Reading' },
  { id: 'ncert-exercise', label: 'NCERT Exercise' },
  { id: 'class-notes', label: 'Class Notes' },
  { id: 'formula-revision', label: 'Formula / Important Points Revision' },
  { id: 'pyq', label: 'PYQ Practice' },
  { id: 'qb', label: 'Question Bank Practice' },
  { id: 'advanced-q', label: 'Advanced Questions Practice' },
  { id: 'sample-paper', label: 'Sample Paper Questions' },
  { id: 'revision-1', label: 'Revision 1' },
  { id: 'revision-2', label: 'Revision 2' },
  { id: 'doubts', label: 'Doubts Cleared' },
];

export async function getTrackingConfig() {
  const snap = await getDoc(doc(db, 'settings', 'starBatchTrackingConfig'));
  if (snap.exists()) {
    return snap.data();
  }
  return { globalChecklist: DEFAULT_GLOBAL_CHECKLIST, sectionChecklists: {} };
}

export async function saveTrackingConfig(config) {
  await setDoc(doc(db, 'settings', 'starBatchTrackingConfig'), config);
}
