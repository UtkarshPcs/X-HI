export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI provider not configured' }), { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { subject, questions, topics } = body;
  if (!subject || !questions || !topics || questions.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const prompt = `
You are an expert ${subject} teacher. Classify each of the following questions into EXACTLY ONE of the provided canonical topics.

Allowed Canonical Topics:
${topics.map(t => `- ${t}`).join('\n')}

Questions to Classify:
${questions.map(q => `ID [${q.id}]: ${q.text}`).join('\n\n')}

Rules:
1. You MUST pick a topic EXACTLY as written in the allowed list above.
2. Return ONLY a valid JSON object where keys are the question IDs and values are the exact topic strings.
3. No explanation, no markdown formatting. Just the JSON object.

Example JSON output:
{
  "q_0_0": "Prime Factorisation",
  "q_0_1": "Zeroes of a Polynomial"
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
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ai-backfill-concepts] Groq error:`, errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    return new Response(JSON.stringify({ mapping: parsed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ai-backfill-concepts] Fatal:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
