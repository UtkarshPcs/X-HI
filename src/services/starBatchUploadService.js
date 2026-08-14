import { db } from './firebase';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';

export async function getUploadHistory() {
  try {
    const q = query(collection(db, 'starBatchUploadTracker'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('Error fetching upload history:', err);
    throw err;
  }
}

export async function deleteUpload(uploadId) {
  try {
    // 1. Delete questions from starBatchTests
    const objectiveSnapshot = await getDocs(collection(db, 'starBatchTests'));
    for (const d of objectiveSnapshot.docs) {
      const data = d.data();
      if (!data.questions || !Array.isArray(data.questions)) continue;

      const filteredQuestions = data.questions.filter(q => q.uploadId !== uploadId);
      if (filteredQuestions.length !== data.questions.length) {
        if (filteredQuestions.length === 0) {
          // Document is empty, delete it
          await deleteDoc(d.ref);
        } else {
          // Update document
          await updateDoc(d.ref, { questions: filteredQuestions });
        }
      }
    }

    // 2. Delete questions from starBatchSubjectiveTests
    const subjectiveSnapshot = await getDocs(collection(db, 'starBatchSubjectiveTests'));
    for (const d of subjectiveSnapshot.docs) {
      const data = d.data();
      if (!data.questions || !Array.isArray(data.questions)) continue;

      const filteredQuestions = data.questions.filter(q => q.uploadId !== uploadId);
      if (filteredQuestions.length !== data.questions.length) {
        if (filteredQuestions.length === 0) {
          // Document is empty, delete it
          await deleteDoc(d.ref);
        } else {
          // Update document
          await updateDoc(d.ref, { questions: filteredQuestions });
        }
      }
    }

    // 3. Delete the tracker document
    await deleteDoc(doc(db, 'starBatchUploadTracker', uploadId));

  } catch (err) {
    console.error('Error deleting upload:', err);
    throw err;
  }
}
