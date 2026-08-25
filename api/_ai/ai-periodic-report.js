/**
 * /api/ai-periodic-report.js
 * ──────────────────────────
 * POST endpoint for the Periodic Predicted Topic Mastery Report Card.
 *
 * Accepts pre-computed concept stats (NOT raw questions) and returns:
 *  - narrative: A 2–3 sentence personalised performance diagnosis
 *  - studyTips: One specific actionable tip per weak concept
 *
 * Token cost is tiny: the payload is a small JSON of concept accuracy stats.
 * Raw question text is NEVER sent to the AI.
 *
 * Security: API key lives in Vercel env (GROQ_API_KEY) — never exposed to client.
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.error('[ai-periodic-report] No API key configured');
    return new Response(JSON.stringify({ error: 'AI provider not configured' }), { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { subject, conceptStats, completedSets, weakTopics = [], mediumTopics = [], strongTopics = [] } = body;

  if (!subject || !conceptStats) {
    return new Response(JSON.stringify({ error: 'Missing required fields: subject, conceptStats' }), { status: 400 });
  }

  const weakList   = weakTopics.length   > 0 ? weakTopics.join(', ')   : 'None';
  const mediumList = mediumTopics.length > 0 ? mediumTopics.join(', ') : 'None';
  const strongList = strongTopics.length > 0 ? strongTopics.join(', ') : 'None';

  const prompt = `
You are an expert academic coach for a 10th-grade student in India.
The student just completed all ${completedSets || 'several'} Periodic Predicted test set(s) for the subject: ${subject}.

Here is the student's performance per concept (correct answers out of total questions attempted):
${JSON.stringify(conceptStats, null, 2)}

Classification Summary:
- Strong (≥75% accuracy): ${strongList}
- Medium (40–74% accuracy): ${mediumList}  
- Weak (<40% accuracy): ${weakList}

Your task:
1. Write a "narrative" — exactly 2 to 3 sentences. Be specific and personal. Reference actual topic names and patterns you see in the data. Do NOT be generic or fluffy.
2. Write a "studyTips" array — provide exactly ONE sharp, specific, actionable study tip for EACH weak concept only. If there are no weak concepts, return an empty array.

Rules:
- Do NOT repeat the accuracy numbers in the narrative.
- Do NOT say "Great job!" or use filler praise.
- Do NOT invent information not present in the data.
- The study tip must be specific to the concept name, not generic advice like "practice more".
- Return ONLY a valid JSON object — no markdown fences, no explanation text.

Required JSON shape:
{
  "narrative": "string",
  "studyTips": [
    { "concept": "exact concept name from weak list", "tip": "specific actionable tip" }
  ]
}
`.trim();

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`[ai-periodic-report] Groq API error ${response.status}: ${errText.slice(0, 200)}`);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('[ai-periodic-report] Failed to parse AI JSON:', content.slice(0, 200));
      parsed = {};
    }

    return new Response(
      JSON.stringify({
        narrative: parsed.narrative || '',
        studyTips: Array.isArray(parsed.studyTips) ? parsed.studyTips : [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[ai-periodic-report] Error:', error);
    // Graceful degradation — return empty narrative, no crash
    return new Response(
      JSON.stringify({ narrative: '', studyTips: [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
