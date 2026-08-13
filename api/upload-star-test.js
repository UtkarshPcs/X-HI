import { adminDb } from './_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { syllabusData } from '../src/data/syllabusData.js';

export default async function handler(req, res) {
  // ── CORS headers ────────────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const getFriendlyTitle = (chapterId, isSubjective) => {
    if (!chapterId) return 'Unknown Chapter Upload';
    for (const sec of syllabusData) {
      for (const sub of sec.subjects) {
        for (const chap of sub.chapters) {
          if (chap.chapterId === chapterId) {
            const suffix = isSubjective ? 'Subjective Test' : 'Test';
            return `${sub.subjectName} - ${chap.chapterName} ${suffix}`;
          }
        }
      }
    }
    return `${chapterId} Upload`;
  };

  try {
    let json = body;

    // Auto-wrap if it's an array of questions rather than a test object/array of tests
    if (Array.isArray(json) && json.length > 0 && (json[0].question || json[0].text || json[0].answerSteps || json[0].options)) {
      const isSubjective = !!json[0].answerSteps;
      json = [{
        chapterId: json[0].chapterId || 'Unknown',
        subjectId: json[0].subjectId || 'Unknown',
        sectionId: json[0].sectionId || 'Unknown',
        title: getFriendlyTitle(json[0].chapterId, isSubjective),
        questions: json.map(q => {
          if (q.question && !q.text) {
            q.text = q.question;
          }
          return q;
        })
      }];
    }
    
    // Ensure we are working with an array of tests
    if (!Array.isArray(json)) {
      json = [json];
    }

    const db = adminDb();
    const results = [];

    for (const testData of json) {
      if (!testData.chapterId) {
        throw new Error("Missing chapterId in JSON");
      }
      if (!testData.questions || !Array.isArray(testData.questions) || testData.questions.length === 0) {
        throw new Error("Test must have a questions array");
      }

      // Detect type from the first question
      const sample = testData.questions[0];
      const isSubjective = !!sample.answerSteps;
      const collectionName = isSubjective ? 'starBatchSubjectiveTests' : 'starBatchTests';

      const existingQuery = await db.collection(collectionName).where('chapterId', '==', testData.chapterId).limit(1).get();
      
      const getQKey = (q) => {
        const text = (q.text || q.questionText || '').trim().toLowerCase();
        const img = (q.imageUrl || '').trim();
        return `${text}|${img}`;
      };

      if (!existingQuery.empty) {
        const existingDoc = existingQuery.docs[0];
        const existingData = existingDoc.data();
        const existingTestId = existingDoc.id;

        const existingKeys = new Set((existingData.questions || []).map(getQKey));
        const newUniqueQuestions = [];

        for (const q of testData.questions) {
          const key = getQKey(q);
          if (key !== '|' && !existingKeys.has(key)) {
            existingKeys.add(key);
            newUniqueQuestions.push(q);
          }
        }

        if (newUniqueQuestions.length > 0) {
          await db.collection(collectionName).doc(existingTestId).set({
            questions: [...(existingData.questions || []), ...newUniqueQuestions],
            title: testData.title || existingData.title || getFriendlyTitle(testData.chapterId, isSubjective)
          }, { merge: true });
        }
        results.push({ 
          id: existingTestId, 
          chapterId: testData.chapterId, 
          action: 'merged', 
          addedQuestions: newUniqueQuestions.length, 
          type: isSubjective ? 'subjective' : 'objective' 
        });
      } else {
        const docRef = await db.collection(collectionName).add({
          chapterId: testData.chapterId,
          subjectId: testData.subjectId || 'Unknown',
          sectionId: testData.sectionId || 'Unknown',
          title: testData.title || getFriendlyTitle(testData.chapterId, isSubjective),
          type: isSubjective ? 'subjective' : 'objective',
          questions: testData.questions,
          createdAt: FieldValue.serverTimestamp()
        });
        results.push({ 
          id: docRef.id, 
          chapterId: testData.chapterId, 
          action: 'created', 
          addedQuestions: testData.questions.length, 
          type: isSubjective ? 'subjective' : 'objective' 
        });
      }
    }

    return res.status(200).json({ ok: true, results });

  } catch (error) {
    console.error('[upload-star-test] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
