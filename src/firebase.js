import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Expose the raw config so the messaging service worker can be initialised
// with the same project (it can't read import.meta.env directly).
export const firebaseConfigPublic = firebaseConfig;

// VAPID public key for web push (safe to expose in the client bundle).
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Returns a Firebase Messaging instance, or null if the browser does not
 * support web push (e.g. iOS Safari when not installed as a PWA). Callers
 * must handle the null case gracefully.
 */
export async function getMessagingIfSupported() {
  try {
    if (!(await isSupported())) return null;
    return getMessaging(app);
  } catch (err) {
    console.warn('Firebase Messaging not supported:', err);
    return null;
  }
}
