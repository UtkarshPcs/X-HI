import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Read and evaluate homeworkData.js
import fs from "fs";
const fileContent = fs.readFileSync("./src/data/homeworkData.js", "utf-8");
const jsonStr = fileContent.replace("export const homeworkData = ", "").trim().replace(/;$/, "");
const homeworkData = eval(jsonStr); // using eval to safely parse JS object if there are quirks

const firebaseConfig = {
  apiKey: "AIzaSyDYbxAGYrvgMaVwqYZ4pvg07XC5cqr_k80",
  authDomain: "balmy-nuance-472404-q9.firebaseapp.com",
  projectId: "balmy-nuance-472404-q9",
  storageBucket: "balmy-nuance-472404-q9.firebasestorage.app",
  messagingSenderId: "976473529250",
  appId: "1:976473529250:web:9957553992382e8f0b70fb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  let count = 0;
  for (const hw of homeworkData) {
    let dateParts = (hw.date || "").split(', ');
    let dateString = dateParts.length > 1 ? dateParts[1] : hw.date;
    let dateObj = new Date(dateString);
    let timestamp = dateObj.getTime();
    
    if (isNaN(timestamp)) {
       timestamp = Date.now() - (hw.id * 100000);
    }
    
    try {
      await setDoc(doc(db, 'homework', hw.id.toString()), {
        ...hw,
        timestamp: timestamp
      });
      count++;
      console.log(`Migrated ${count}/${homeworkData.length}`);
    } catch (e) {
      console.error("Error migrating:", e.code || e.message);
      break;
    }
  }
  console.log("Done. Migrated:", count);
  process.exit(0);
}
run();
