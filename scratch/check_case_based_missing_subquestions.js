// READ-ONLY investigation script.
// Scans `question_bank` for SCIENCE subjective questions (4 or 5 marks — the
// case-based / long-answer range) and reports how many are missing a
// populated `sub_question` array. Does NOT write/delete anything.
//
// Run with: node scratch/check_case_based_missing_subquestions.js

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

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

function truncate(str, n = 100) {
  if (!str) return '';
  const s = String(str).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function toMillis(ts) {
  if (!ts) return null;
  if (typeof ts === 'string') {
    const t = Date.parse(ts);
    return Number.isNaN(t) ? null : t;
  }
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  return null;
}

async function main() {
  const q = query(collection(db, 'question_bank'), where('subject', '==', 'SCIENCE'));
  const snap = await getDocs(q);

  const all = [];
  snap.forEach(d => all.push({ id: d.id, ...d.data() }));

  // Case-based / long-form subjective range: 4 and 5 marks.
  const caseLike = all.filter(q => q.type === 'subjective' && (q.marks === 4 || q.marks === 5));

  const corrupt = caseLike.filter(q => {
    const sub = q.sub_question;
    return !Array.isArray(sub) || sub.length === 0;
  });

  const healthy = caseLike.length - corrupt.length;

  // Group corrupt ones by upload time bucket (rounded to the minute) to see
  // if they cluster into specific upload batches.
  const buckets = {};
  corrupt.forEach(q => {
    const ms = toMillis(q.uploadedAt);
    const key = ms ? new Date(Math.floor(ms / 60000) * 60000).toISOString() : 'unknown_upload_time';
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(q);
  });

  console.log('==================================================');
  console.log('SCIENCE question_bank — Case-Based Corruption Report');
  console.log('==================================================');
  console.log(`Total SCIENCE questions in bank:        ${all.length}`);
  console.log(`Total SCIENCE subjective 4/5-mark (case-like): ${caseLike.length}`);
  console.log(`  - Healthy (has sub_question array):   ${healthy}`);
  console.log(`  - CORRUPT (missing/empty sub_question): ${corrupt.length}`);
  console.log('');

  console.log('--- Corrupt questions grouped by upload batch (minute-rounded) ---');
  const sortedBuckets = Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0]));
  sortedBuckets.forEach(([bucket, qs]) => {
    console.log(`\n[${bucket}]  ${qs.length} corrupt question(s)`);
    qs.forEach(q => {
      console.log(`  - ${q.question_id || q.id} | marks=${q.marks} | chapter=${q.chapterId || 'N/A'} | topic=${q.topic || 'N/A'}`);
      console.log(`      "${truncate(q.question_text || q.text, 120)}"`);
    });
  });

  console.log('\n--- Summary ---');
  console.log(`Corrupt questions found in ${sortedBuckets.length} distinct upload batch(es).`);
  console.log('If this number is small (1-2), the "bad upload batch" theory holds.');
  console.log('If corruption is spread across many batches/timestamps, it points to a');
  console.log('systemic extraction issue rather than isolated bad uploads.');
}

main().catch(err => {
  console.error('Investigation script failed:', err);
  process.exit(1);
});
