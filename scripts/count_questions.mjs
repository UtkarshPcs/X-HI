import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./balmy-nuance-472404-q9-firebase-adminsdk-fbsvc-c26d120cb3.json', 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const chapterId = 'maths-0-c5';
  console.log(`Finding questions for chapterId: ${chapterId}`);
  
  const questionsRef = db.collection('starBatchQuestions');
  const snapshot = await questionsRef.where('chapterId', '==', chapterId).get();
  
  console.log(`Found ${snapshot.size} questions.`);
  
  process.exit(0);
}
run();
