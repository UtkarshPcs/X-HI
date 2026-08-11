import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./balmy-nuance-472404-q9-firebase-adminsdk-fbsvc-c26d120cb3.json', 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const testsRef = db.collection('starBatchSubjectiveTests');
  const snapshot = await testsRef.where('chapterId', '==', 'maths-0-c5').get();
  
  console.log(`Found ${snapshot.size} tests in starBatchSubjectiveTests for maths-0-c5.`);
  snapshot.forEach(doc => {
      console.log('Test ID:', doc.id);
  });
  
  const objTestsRef = db.collection('starBatchTests');
  const objSnapshot = await objTestsRef.where('chapterId', '==', 'maths-0-c5').get();
  console.log(`Found ${objSnapshot.size} tests in starBatchTests for maths-0-c5.`);
  objSnapshot.forEach(doc => {
      console.log('Test ID:', doc.id);
  });
  
  process.exit(0);
}
run();
