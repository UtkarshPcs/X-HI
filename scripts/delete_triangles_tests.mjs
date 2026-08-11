import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./balmy-nuance-472404-q9-firebase-adminsdk-fbsvc-c26d120cb3.json', 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  // Delete the Triangles Subjective Test
  await db.collection('starBatchSubjectiveTests').doc('VlK3oFetIwn7e67hcr4x').delete();
  console.log('Deleted Triangles subjective test document (VlK3oFetIwn7e67hcr4x)');
  
  // Delete the Triangles Objective Test
  await db.collection('starBatchTests').doc('qs7MZUO1OxtL5UbUZZ2n').delete();
  console.log('Deleted Triangles objective test document (qs7MZUO1OxtL5UbUZZ2n)');
  
  process.exit(0);
}
run();
