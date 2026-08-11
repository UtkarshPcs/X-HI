import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./balmy-nuance-472404-q9-firebase-adminsdk-fbsvc-c26d120cb3.json', 'utf-8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function run() {
  try {
    const usersRef = db.collection('users');
    // The field is rollNo and it is an integer
    let snapshot = await usersRef.where('rollNo', '==', 85).get();
    
    if (snapshot.empty) {
        // Also check if it's stored as a string just in case
        snapshot = await usersRef.where('rollNo', '==', '85').get();
        if (snapshot.empty) {
             console.log('No user found with rollNo 85.');
             process.exit(0);
        }
    }
    
    const newPasswordHash = sha256('Blue-Falcon-84!');
    
    let updatedCount = 0;
    for (const doc of snapshot.docs) {
      await usersRef.doc(doc.id).update({ passwordHash: newPasswordHash });
      console.log(`Updated password for user doc ID: ${doc.id}`);
      updatedCount++;
    }
    console.log(`Password reset successfully for ${updatedCount} user(s).`);
  } catch (err) {
    console.error('Error updating password:', err);
  }
  process.exit(0);
}

run();
