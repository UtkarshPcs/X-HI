import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { hash, images, metadata } = req.body;

    // 1. Check exact hash match
    const notesRef = db.collection('notes');
    const q = await notesRef.where('fileHash', '==', hash).limit(1).get();
    if (!q.empty) {
      return res.status(200).json({ 
        duplicate_detected: true, 
        approved: false, 
        decision: 'Exact duplicate hash found.' 
      });
    }

    // 2. Call Groq
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.6-27b',
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI verifying user-uploaded study notes. Return ONLY a JSON object.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Verify these notes against metadata:
Subject: ${metadata.subject}
Chapter: ${metadata.chapter}
Section: ${metadata.section}
Title: ${metadata.title}
Desc: ${metadata.desc}

Respond in STRICT JSON with:
{
  "approved": boolean,
  "duplicate_detected": boolean,
  "chapter_match": boolean,
  "section_match": boolean,
  "subject_match": boolean,
  "confidence": number,
  "reason": string,
  "decision": string
}`
              },
              ...images.map(imgBase64 => ({
                type: 'image_url',
                image_url: { url: imgBase64 }
              }))
            ]
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const data = await groqResponse.json();
    if (data.error) {
      throw new Error(data.error.message || 'Groq API error');
    }

    let resultJson;
    try {
      resultJson = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      // fallback parsing if not strict JSON
      const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
      resultJson = jsonMatch ? JSON.parse(jsonMatch[0]) : { approved: false, reason: 'AI parsing failed' };
    }

    return res.status(200).json(resultJson);

  } catch (err) {
    console.error('[verify-note]', err);
    return res.status(500).json({ error: err.message || 'Verification failed.' });
  }
}
