import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./balmy-nuance-472404-q9-firebase-adminsdk-fbsvc-c26d120cb3.json', 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const questionsRef = db.collection('starBatchQuestions');
  const snapshot = await questionsRef.limit(1).get();
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
  
  // also try to find one with chapter Triangles
  const trianglesSnapshot = await questionsRef.where('chapter', '==', 'Triangles').limit(1).get();
  console.log("--- Triangles ---");
  trianglesSnapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
  
  process.exit(0);
}
run();
