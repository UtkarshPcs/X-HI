const admin = require('firebase-admin');
const serviceAccount = require('./balmy-nuance-472404-q9-firebase-adminsdk-fbsvc-c26d120cb3.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('rollNumber', '==', '85').get();
    if (snapshot.empty) {
        const snapshot2 = await usersRef.where('rollNumber', '==', 85).get();
        if (snapshot2.empty) {
             console.log('No matching documents.');
        } else {
             snapshot2.forEach(doc => {
               console.log(doc.id, '=>', doc.data());
             });
        }
    } else {
        snapshot.forEach(doc => {
          console.log(doc.id, '=>', doc.data());
        });
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
