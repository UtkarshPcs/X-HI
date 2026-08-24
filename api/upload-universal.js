import { adminDb } from './_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

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

  try {
    let json = body;

    // Support either { questions: [] } or [{ questions: [] }] or just [ {...question } ]
    let questionsArray = [];
    let title = 'AI Generated Upload';
    let subjectId = 'Unknown';
    let chapterId = 'Unknown';

    if (Array.isArray(json)) {
      if (json.length > 0 && json[0].questions) {
        questionsArray = json[0].questions;
        title = json[0].title || title;
        subjectId = json[0].subjectId || subjectId;
        chapterId = json[0].chapterId || chapterId;
      } else {
        questionsArray = json;
        if (json[0]) {
          subjectId = json[0].subjectId || subjectId;
          chapterId = json[0].chapterId || chapterId;
        }
      }
    } else if (json.questions) {
      questionsArray = json.questions;
      title = json.title || title;
      subjectId = json.subjectId || subjectId;
      chapterId = json.chapterId || chapterId;
    }

    if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
      return res.status(400).json({ error: 'No questions array found in payload.' });
    }

    // Sanitize and ensure format
    const normalizedQuestions = questionsArray.map(q => {
      let qObj = { ...q };
      if (qObj.question && !qObj.text) qObj.text = qObj.question;
      if (!qObj.chapterId) qObj.chapterId = chapterId;
      if (!qObj.subjectId) qObj.subjectId = subjectId;
      return qObj;
    });

    // 1. Generate hash
    const hash = crypto.createHash('sha256').update(JSON.stringify(normalizedQuestions)).digest('hex');

    const replaceNestedArrays = (obj, inArray = false) => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) {
        if (inArray) {
          const sanitizedObj = {};
          obj.forEach((val, idx) => {
            sanitizedObj[idx] = replaceNestedArrays(val, false);
          });
          return sanitizedObj;
        }
        return obj.map(val => replaceNestedArrays(val, true));
      }
      const newObj = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          newObj[key] = replaceNestedArrays(obj[key], false);
        }
      }
      return newObj;
    };

    const sanitizedPayload = replaceNestedArrays(normalizedQuestions);

    const db = adminDb();
    
    // 2. Check duplicates
    const existing = await db.collection('universal_api_uploads').where('hash', '==', hash).get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'Duplicate upload detected. This exact content has already been uploaded.' });
    }

    // 3. Compute marks breakdown
    let marksBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    normalizedQuestions.forEach(q => {
      if (q.marks) marksBreakdown[q.marks] = (marksBreakdown[q.marks] || 0) + 1;
    });

    // 4. Save to Firestore
    const docRef = await db.collection('universal_api_uploads').add({
      hash,
      status: 'pending',
      title,
      subjectId,
      chapterId,
      totalQuestions: normalizedQuestions.length,
      marksBreakdown,
      payload: sanitizedPayload,
      createdAt: FieldValue.serverTimestamp()
    });

    return res.status(200).json({ ok: true, message: 'Uploaded successfully. Pending confirmation.', id: docRef.id });

  } catch (error) {
    console.error('[upload-universal] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
