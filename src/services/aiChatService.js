import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

// --- Admin Settings for Allowed Chapters ---
export async function getAllowedChapters() {
  const docRef = doc(db, 'settings', 'aichat');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data().allowedChapters || [];
  }
  return [];
}

export async function addAllowedChapter(chapterName) {
  const docRef = doc(db, 'settings', 'aichat');
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    await setDoc(docRef, { allowedChapters: [chapterName] });
  } else {
    await updateDoc(docRef, {
      allowedChapters: arrayUnion(chapterName)
    });
  }
}

export async function removeAllowedChapter(chapterName) {
  const docRef = doc(db, 'settings', 'aichat');
  await updateDoc(docRef, {
    allowedChapters: arrayRemove(chapterName)
  });
}

// --- User Chat History (Limit 10) ---
export async function getAiChats(userId) {
  if (!userId) return [];
  const q = query(
    collection(db, 'users', userId, 'aichats'),
    orderBy('timestamp', 'desc'),
    limit(10)
  );
  const snap = await getDocs(q);
  // Return ascending order for chat UI
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
}

export async function saveAiChat(userId, userMessage, aiResponse) {
  if (!userId) return null;
  const timestamp = Date.now();
  const id = timestamp.toString();
  const chatData = {
    id,
    userMessage,
    aiResponse,
    timestamp
  };
  await setDoc(doc(db, 'users', userId, 'aichats', id), chatData);
  
  // Cleanup if more than 10
  const q = query(collection(db, 'users', userId, 'aichats'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  if (snap.docs.length > 10) {
    const toDelete = snap.docs.slice(10);
    for (const d of toDelete) {
      await deleteDoc(doc(db, 'users', userId, 'aichats', d.id));
    }
  }
  
  return chatData;
}

export async function deleteAiChat(userId, chatId) {
  if (!userId || !chatId) return;
  await deleteDoc(doc(db, 'users', userId, 'aichats', chatId));
}

// --- Bookmarks ---
export async function getBookmarkedAiChats(userId) {
  if (!userId) return [];
  const q = query(collection(db, 'users', userId, 'aichat_bookmarks'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function bookmarkAiChat(userId, chatData) {
  if (!userId || !chatData) return;
  const bookmarkRef = doc(db, 'users', userId, 'aichat_bookmarks', chatData.id);
  await setDoc(bookmarkRef, {
    ...chatData,
    bookmarkedAt: Date.now()
  });
}

export async function removeBookmarkAiChat(userId, chatId) {
  if (!userId || !chatId) return;
  await deleteDoc(doc(db, 'users', userId, 'aichat_bookmarks', chatId));
}
