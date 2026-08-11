import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./balmy-nuance-472404-q9-firebase-adminsdk-fbsvc-c26d120cb3.json', 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const questionsRef = db.collection('starBatchQuestions');
  const snapshot = await questionsRef.get();
  
  let found = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.questionText && data.questionText.toLowerCase().includes('triangle')) {
        console.log(doc.id, '=>', data.chapterId, data.subjectId);
        found++;
    }
  });
  console.log(`Found ${found} questions with 'triangle' in the text.`);
  process.exit(0);
}
run();
