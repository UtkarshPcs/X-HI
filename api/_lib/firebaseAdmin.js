import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

/**
 * Initialises the Firebase Admin SDK exactly once (serverless functions can
 * be re-invoked on a warm instance, so guard against double init).
 *
 * Credentials come from Vercel environment variables — NEVER commit these:
 *   FIREBASE_SA_PROJECT_ID
 *   FIREBASE_SA_CLIENT_EMAIL
 *   FIREBASE_SA_PRIVATE_KEY   (paste the full key; \n escapes are handled)
 */
function ensureApp() {
  if (getApps().length) return;

  const projectId = process.env.FIREBASE_SA_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_SA_CLIENT_EMAIL;
  // Vercel stores the private key with literal "\n"; convert back to newlines.
  const privateKey = (process.env.FIREBASE_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase service-account env vars.');
  }

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export function adminDb() {
  ensureApp();
  return getFirestore();
}

export function adminMessaging() {
  ensureApp();
  return getMessaging();
}
