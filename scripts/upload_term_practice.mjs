import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Assuming service account key is available in root
const serviceAccount = JSON.parse(fs.readFileSync('./balmy-nuance-472404-q9-firebase-adminsdk-fbsvc-c26d120cb3.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function upload() {
  try {
    const filePath = path.resolve('./Term Practive Set  /Science-SQP-answered.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileData);

    const testDoc = {
      subjectId: 'science',
      title: 'Science Set 1',
      questions: data.questions,
      createdAt: new Date()
    };

    const res = await db.collection('termPracticeTests').add(testDoc);
    console.log('Successfully uploaded test with ID:', res.id);
  } catch (err) {
    console.error('Error uploading:', err);
  }
}

upload();
