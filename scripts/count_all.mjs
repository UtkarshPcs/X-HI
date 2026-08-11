import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./balmy-nuance-472404-q9-firebase-adminsdk-fbsvc-c26d120cb3.json', 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const questionsRef = db.collection('starBatchQuestions');
  const snapshot = await questionsRef.get();
  console.log(`Total questions: ${snapshot.size}`);
  
  let chapterMap = {};
  snapshot.forEach(doc => {
      const cId = doc.data().chapterId;
      chapterMap[cId] = (chapterMap[cId] || 0) + 1;
  });
  console.log("Chapters:", chapterMap);
  
  process.exit(0);
}
run();
