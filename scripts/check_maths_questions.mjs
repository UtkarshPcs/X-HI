import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./balmy-nuance-472404-q9-firebase-adminsdk-fbsvc-c26d120cb3.json', 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const questionsRef = db.collection('starBatchQuestions');
  const snapshot = await questionsRef.where('subjectId', '==', 'maths-0').limit(2).get();
  
  if (snapshot.empty) {
      console.log('No maths-0 questions found.');
  } else {
      snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
      });
  }
  process.exit(0);
}
run();
