import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./balmy-nuance-472404-q9-firebase-adminsdk-fbsvc-c26d120cb3.json', 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const t1 = await db.collection('starBatchSubjectiveTests').doc('VlK3oFetIwn7e67hcr4x').get();
  console.log('Subjective Test Title:', t1.data().title, '| Questions count:', t1.data().questions?.length);
  
  const t2 = await db.collection('starBatchTests').doc('qs7MZUO1OxtL5UbUZZ2n').get();
  console.log('Objective Test Title:', t2.data().title, '| Questions count:', t2.data().questions?.length);
  
  process.exit(0);
}
run();
