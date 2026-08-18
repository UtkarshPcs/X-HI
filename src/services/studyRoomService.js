/**
 * studyRoomService.js
 * Firestore service for the "Study Together" feature.
 *
 * Collections:
 *   studyRooms/                    - room documents
 *   studyRooms/{roomId}/messages   - sub-collection: chat messages
 *   studyRooms/{roomId}/presence   - sub-collection: online member heartbeats
 *
 * Firestore rules (add to your rules file):
 *   match /studyRooms/{roomId} { allow read, write: if request.auth != null || true; }
 *   match /studyRooms/{roomId}/messages/{msgId} { allow read, write: if true; }
 *   match /studyRooms/{roomId}/presence/{userId} { allow read, write: if true; }
 */

import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, deleteDoc, onSnapshot,
  query, orderBy, limit, where,
  serverTimestamp, setDoc,
  arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';

const ROOMS_COL = 'studyRooms';
const MESSAGES_COL = 'messages';
const PRESENCE_COL = 'presence';

// ── YouTube URL helpers ─────────────────────────────────────────────────────

/**
 * Extracts a YouTube video/live ID from any valid YouTube URL.
 * Supports:
 *  - https://www.youtube.com/watch?v=ID
 *  - https://youtu.be/ID
 *  - https://www.youtube.com/live/ID
 *  - https://www.youtube.com/embed/ID
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // youtu.be short URLs
  const shortMatch = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/live/ID
  const liveMatch = trimmed.match(/youtube\.com\/live\/([A-Za-z0-9_-]{11})/);
  if (liveMatch) return liveMatch[1];

  // youtube.com/embed/ID
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // youtube.com/watch?v=ID
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v && v.length === 11) return v;
    }
  } catch (_) { /* not a valid URL */ }

  return null;
}

/**
 * Returns true if the URL is a recognisable YouTube URL with a valid video ID.
 */
export function isValidYouTubeUrl(url) {
  return extractYouTubeId(url) !== null;
}

// ── Room ID generation ──────────────────────────────────────────────────────

/**
 * Generates a human-readable 6-char alphanumeric room code (uppercase).
 * Collision probability is negligible for a classroom-scale app.
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Room CRUD ───────────────────────────────────────────────────────────────

/**
 * Creates a new study room.
 * @param {{ name: string, youtubeUrl: string, password?: string, ownerPhone: string, ownerName: string }} params
 * @returns {Promise<{ roomId: string, roomCode: string }>}
 */
export async function createRoom({ name, youtubeUrl, password, ownerPhone, ownerName }) {
  const activeRooms = await getActiveRooms();
  if (activeRooms.length >= 3) {
    throw new Error('Maximum of 3 active study rooms allowed at a time.');
  }

  let videoId = null;
  let mode = 'chat';
  if (youtubeUrl && youtubeUrl.trim()) {
    videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) throw new Error('Invalid YouTube URL.');
    mode = 'video';
  }

  const roomCode = generateRoomCode();

  const docRef = await addDoc(collection(db, ROOMS_COL), {
    name: name.trim(),
    youtubeUrl: youtubeUrl ? youtubeUrl.trim() : null,
    videoId,
    mode,
    coHostPhones: [],
    password: password?.trim() || null,
    ownerPhone,
    ownerName,
    roomCode,
    isActive: true,
    isLocked: false,
    memberCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return { roomId: docRef.id, roomCode };
}

/**
 * Fetches a single room by Firestore document ID.
 * @param {string} roomId
 * @returns {Promise<object|null>}
 */
export async function getRoomById(roomId) {
  const snap = await getDoc(doc(db, ROOMS_COL, roomId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Fetches a room by its 6-char room code.
 * @param {string} code
 * @returns {Promise<object|null>}
 */
export async function getRoomByCode(code) {
  const q = query(
    collection(db, ROOMS_COL),
    where('roomCode', '==', code.toUpperCase()),
    where('isActive', '==', true),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/**
 * Returns all currently active rooms, ordered newest-first.
 * @returns {Promise<object[]>}
 */
export async function getActiveRooms() {
  const q = query(
    collection(db, ROOMS_COL),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);
  const rooms = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Sort descending by createdAt
  return rooms.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * Real-time listener for all active rooms.
 * @param {function} callback - called with an array of room objects
 * @returns {function} unsubscribe
 */
export function subscribeToActiveRooms(callback) {
  const q = query(
    collection(db, ROOMS_COL),
    where('isActive', '==', true)
  );
  return onSnapshot(q, snap => {
    const rooms = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    rooms.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(rooms);
  });
}

/**
 * Real-time listener for a single room document.
 * @param {string} roomId
 * @param {function} callback - called with room object or null
 * @returns {function} unsubscribe
 */
export function subscribeToRoom(roomId, callback) {
  return onSnapshot(doc(db, ROOMS_COL, roomId), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

// ── Owner actions ───────────────────────────────────────────────────────────

/**
 * Changes the YouTube URL/videoId in an active room (owner only).
 * @param {string} roomId
 * @param {string} newUrl
 */
export async function updateRoomVideo(roomId, newUrl) {
  const videoId = extractYouTubeId(newUrl);
  if (!videoId) throw new Error('Invalid YouTube URL.');
  await updateDoc(doc(db, ROOMS_COL, roomId), {
    youtubeUrl: newUrl.trim(),
    videoId,
    mode: 'video',
    updatedAt: Date.now(),
    'quizState.status': 'finished',
  });
}

/**
 * Adds a co-host to the room.
 * @param {string} roomId 
 * @param {string} phone 
 */
export async function addCoHost(roomId, phone) {
  await updateDoc(doc(db, ROOMS_COL, roomId), { coHostPhones: arrayUnion(phone), updatedAt: Date.now() });
}

/**
 * Removes a co-host from the room.
 * @param {string} roomId 
 * @param {string} phone 
 */
export async function removeCoHost(roomId, phone) {
  await updateDoc(doc(db, ROOMS_COL, roomId), { coHostPhones: arrayRemove(phone), updatedAt: Date.now() });
}

/**
 * Starts a quiz, setting the room mode to 'quiz' and initializing quiz state.
 * @param {string} roomId 
 * @param {object} quizState 
 */
export async function startQuiz(roomId, quizState) {
  const roomRef = doc(db, ROOMS_COL, roomId);
  const qIds = quizState.questions ? quizState.questions.map(q => q.originalIndex) : [];
  
  const updates = {
    mode: 'quiz',
    quizState,
    updatedAt: Date.now(),
  };

  if (qIds.length > 0) {
    updates.askedQuestionIds = arrayUnion(...qIds);
  }

  await updateDoc(roomRef, updates);
}

/**
 * Updates the current quiz state (e.g. progressing to next question)
 */
export async function updateQuizState(roomId, newStatePartial) {
  // To avoid race conditions, we can use dot notation for nested fields,
  // or just pass the whole new state map if we compute it client side.
  // We'll pass an object with dot-notation keys, e.g. { "quizState.currentQuestionIndex": 1 }
  await updateDoc(doc(db, ROOMS_COL, roomId), {
    ...newStatePartial,
    updatedAt: Date.now(),
  });
}

/**
 * Toggles the room's locked state (owner only).
 * A locked room rejects new joins.
 * @param {string} roomId
 * @param {boolean} locked
 */
export async function setRoomLocked(roomId, locked) {
  await updateDoc(doc(db, ROOMS_COL, roomId), { isLocked: locked, updatedAt: Date.now() });
}

/**
 * Clears the active video or quiz, returning the room to chat-only mode.
 * @param {string} roomId
 */
export async function clearRoomScreen(roomId) {
  await updateDoc(doc(db, ROOMS_COL, roomId), {
    mode: 'chat',
    youtubeUrl: null,
    videoId: null,
    updatedAt: Date.now(),
    'quizState.status': 'finished'
  });
}

/**
 * Ends the room — sets isActive=false, persists the record for history.
 * @param {string} roomId
 */
export async function endRoom(roomId) {
  await updateDoc(doc(db, ROOMS_COL, roomId), { isActive: false, updatedAt: Date.now(), endedAt: Date.now() });
}

/**
 * Removes a participant from the presence sub-collection.
 * The participant's client will detect the removal and redirect them out.
 * @param {string} roomId
 * @param {string} memberPhone - the phone/userId of the member to remove
 */
export async function removeMember(roomId, memberPhone) {
  await deleteDoc(doc(db, ROOMS_COL, roomId, PRESENCE_COL, memberPhone));
}

/**
 * Answers a quiz question. Handles transactions for 'fastest' mode.
 */
import { runTransaction } from 'firebase/firestore';

export async function answerQuizQuestion(roomId, quizId, qIndex, userId, optionIndex, mode) {
  if (mode === 'fastest') {
    const qRef = doc(db, ROOMS_COL, roomId, `quizAnswers_${quizId}`, `q_${qIndex}`);
    await runTransaction(db, async (t) => {
      const qDoc = await t.get(qRef);
      if (!qDoc.exists()) {
        t.set(qRef, { winnerId: userId, optionIndex, timestamp: serverTimestamp() });
      } else {
        throw new Error('Someone else answered first!');
      }
    });
  } else {
    // mode === 'all'
    const userAnsRef = doc(db, ROOMS_COL, roomId, `quizAnswers_${quizId}`, `q_${qIndex}_${userId}`);
    await setDoc(userAnsRef, { userId, optionIndex, timestamp: serverTimestamp() }, { merge: true });
  }
}

/**
 * Subscribes to the answers for a specific question (used for revealing).
 */
export function subscribeToQuizAnswers(roomId, quizId, callback) {
  const q = collection(db, ROOMS_COL, roomId, `quizAnswers_${quizId}`);
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

/**
 * Subscribes to quiz scores.
 */
export function subscribeToQuizScores(roomId, quizId, callback) {
  const q = collection(db, ROOMS_COL, roomId, `quizScores_${quizId}`);
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function submitQuizScore(roomId, quizId, userId, scoreData) {
  const ref = doc(db, ROOMS_COL, roomId, `quizScores_${quizId}`, userId);
  await setDoc(ref, scoreData, { merge: true });
}

// ── Presence ────────────────────────────────────────────────────────────────

const HEARTBEAT_INTERVAL_MS = 15_000; // 15 seconds
const PRESENCE_STALE_MS     = 35_000; // consider offline after 35 s

/**
 * Registers the current user in the presence sub-collection.
 * Must be called when entering a room. Returns a cleanup function that:
 *  1. Clears the heartbeat interval
 *  2. Deletes the presence doc (user left)
 *
 * @param {string} roomId
 * @param {{ phone: string, name: string }} user
 * @returns {function} cleanup
 */
export function joinPresence(roomId, user, sessionId) {
  const ref = doc(db, ROOMS_COL, roomId, PRESENCE_COL, user.phone);

  const heartbeat = () =>
    setDoc(ref, {
      phone: user.phone,
      name: user.name,
      sessionId: sessionId || null,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    }, { merge: true }).catch(() => {});

  heartbeat(); // immediate first write
  const intervalId = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);

  return () => {
    clearInterval(intervalId);
    getDoc(ref).then(snap => {
      if (snap.exists() && snap.data().sessionId === (sessionId || null)) {
        deleteDoc(ref).catch(() => {});
      }
    }).catch(() => {});
  };
}

/**
 * Real-time listener for online members (presence docs updated within PRESENCE_STALE_MS).
 * @param {string} roomId
 * @param {function} callback - called with array of member objects
 * @returns {function} unsubscribe
 */
export function subscribeToPresence(roomId, callback) {
  const ref = collection(db, ROOMS_COL, roomId, PRESENCE_COL);
  return onSnapshot(ref, snap => {
    const now = Date.now();
    const online = snap.docs
      .map(d => d.data())
      .filter(m => (now - (m.lastSeen || 0)) < PRESENCE_STALE_MS)
      .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
    callback(online);
  });
}

// ── Chat ────────────────────────────────────────────────────────────────────

const MAX_MESSAGES = 200; // only subscribe to latest 200 messages

/**
 * Sends a chat message.
 * @param {string} roomId
 * @param {{ phone: string, name: string }} user
 * @param {string} text
 */
export async function sendMessage(roomId, user, text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await addDoc(collection(db, ROOMS_COL, roomId, MESSAGES_COL), {
    senderPhone: user.phone,
    senderName: user.name,
    text: trimmed,
    createdAt: Date.now(),
    // serverTimestamp for future ordering stability
    ts: serverTimestamp(),
  });
}

/**
 * Pins a message to the room.
 * @param {string} roomId
 * @param {object} message
 */
export async function pinMessage(roomId, message) {
  await updateDoc(doc(db, ROOMS_COL, roomId), {
    pinnedMessage: message
  });
}

/**
 * Unpins the current message.
 * @param {string} roomId
 */
export async function unpinMessage(roomId) {
  await updateDoc(doc(db, ROOMS_COL, roomId), {
    pinnedMessage: null
  });
}

/**
 * Real-time listener for chat messages (latest MAX_MESSAGES, ordered by createdAt asc).
 * @param {string} roomId
 * @param {function} callback - called with message array
 * @returns {function} unsubscribe
 */
export function subscribeToMessages(roomId, callback) {
  const q = query(
    collection(db, ROOMS_COL, roomId, MESSAGES_COL),
    orderBy('createdAt', 'desc'),
    limit(MAX_MESSAGES),
  );
  return onSnapshot(q, snap => {
    // Reverse so oldest is at top
    const msgs = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .reverse();
    callback(msgs);
  });
}
