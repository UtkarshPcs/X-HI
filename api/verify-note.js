import { adminDb } from './_lib/firebaseAdmin.js';

const db = adminDb();

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
Subject: ${metadata.subjectName}
Chapter: ${metadata.chapterName}
Section: ${metadata.sectionName}
Title: ${metadata.title}
Desc: ${metadata.description}

Write the "reason" professionally in 1 or 2 short sentences. Do not over-explain.

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
        temperature: 0.1
      })
    });

    const data = await groqResponse.json();
    if (data.error) {
      throw new Error(data.error.message || 'Groq API error');
    }

    let resultJson;
    let content = data.choices[0].message.content.trim();
    
    // Aggressively strip markdown code block backticks
    if (content.startsWith('```')) {
      content = content.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
    }

    try {
      resultJson = JSON.parse(content);
    } catch (e) {
      // Fallback: extract the first complete { ... } block ignoring greedy trailing brackets
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        try {
          resultJson = JSON.parse(content.substring(start, end + 1));
        } catch (err) {
          console.error('JSON Extraction failed:', content);
          resultJson = { approved: false, reason: 'AI generated invalid formatting.' };
        }
      } else {
        resultJson = { approved: false, reason: 'AI failed to generate a verification response.' };
      }
    }

    return res.status(200).json(resultJson);

  } catch (err) {
    console.error('[verify-note]', err);
    return res.status(500).json({ error: err.message || 'Verification failed.' });
  }
}
