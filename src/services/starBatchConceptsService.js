import { collection, doc, setDoc, getDocs, query, where, orderBy, limit, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

const CONCEPTS_COLLECTION = 'starBatchConcepts';

/**
 * Get all approved concepts for a chapter.
 */
export async function getConceptsByChapter(chapterId) {
  const q = query(
    collection(db, CONCEPTS_COLLECTION),
    where('chapterId', '==', chapterId)
  );
  const snap = await getDocs(q);
  const allDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Filter and sort in memory to prevent Firestore missing composite index errors
  const approvedDocs = allDocs.filter(d => d.approved === true);
  approvedDocs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  
  return approvedDocs;
}

/**
 * Get recent concepts for a chapter.
 */
export async function getRecentConcepts(chapterId, maxCount = 10) {
  const allApproved = await getConceptsByChapter(chapterId);
  return allApproved.slice(0, maxCount);
}

/**
 * Upload a single concept.
 */
export async function uploadConcept(data, currentUser) {
  const isAdmin = currentUser.activeRole === 'ADMIN' || currentUser.rollNo === 0;
  const conceptRef = doc(collection(db, CONCEPTS_COLLECTION));
  
  const conceptData = {
    chapterId: data.chapterId,
    title: data.title,
    description: data.description || '',
    content: data.content || '',
    imageUrl: data.imageUrl || null,
    tags: data.tags || [],
    contributorId: currentUser.id || currentUser.phone,
    contributorName: isAdmin ? 'Admin' : currentUser.name,
    contributorRole: isAdmin ? 'ADMIN' : 'STUDENT',
    approved: isAdmin ? true : false, // Admins auto-approved, students might need approval (or auto-approve for now)
    createdAt: serverTimestamp(),
  };

  // For the sake of this feature, let's auto-approve user uploads as well so they show up immediately,
  // or we can stick to false if we want strict moderation. The prompt says "approved entries count".
  // Let's assume auto-approve for simplicity, but admins can delete.
  conceptData.approved = true;

  await setDoc(conceptRef, conceptData);
  return { id: conceptRef.id, ...conceptData };
}

/**
 * Bulk upload concepts from JSON.
 */
export async function bulkUploadConcepts(chapterId, conceptsArray, currentUser) {
  if (!Array.isArray(conceptsArray)) throw new Error('Expected an array of concepts');
  
  const batch = writeBatch(db);
  
  for (const concept of conceptsArray) {
    const ref = doc(collection(db, CONCEPTS_COLLECTION));
    batch.set(ref, {
      chapterId: chapterId,
      title: concept.title || 'Untitled',
      description: concept.description || '',
      content: concept.content || '',
      imageUrl: concept.imageUrl || null,
      tags: concept.tags || [],
      contributorId: currentUser.id || currentUser.phone,
      contributorName: 'Admin',
      contributorRole: 'ADMIN',
      approved: true,
      createdAt: serverTimestamp() // Note: in batch, serverTimestamp is fine
    });
  }
  
  await batch.commit();
}

/**
 * Calculate contribution stats for a chapter.
 */
export async function getContributionStats(chapterId) {
  const concepts = await getConceptsByChapter(chapterId);
  if (concepts.length === 0) return [];

  const counts = {};
  let total = 0;

  concepts.forEach(c => {
    total++;
    const id = c.contributorId;
    if (!counts[id]) {
      counts[id] = {
        id: id,
        name: c.contributorName,
        role: c.contributorRole,
        count: 0
      };
    }
    counts[id].count++;
  });

  const stats = Object.values(counts).map(c => ({
    ...c,
    percentage: Math.round((c.count / total) * 100)
  }));

  // Sort: Admin first, then by count descending
  stats.sort((a, b) => {
    if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
    if (b.role === 'ADMIN' && a.role !== 'ADMIN') return 1;
    return b.count - a.count;
  });

  return stats;
}
