export const config = {
  runtime: 'edge', // Edge function for speed
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.error('[ai-test-review] GROQ_API_KEY env variable is not set');
    return new Response(JSON.stringify({ error: 'AI provider not configured' }), { status: 500 });
  }

  try {
    const { score, total, weakTopics, wrongDifficulties } = await req.json();

    if (score === undefined || total === undefined) {
      return new Response(JSON.stringify({ error: 'Missing score or total' }), { status: 400 });
    }

    const prompt = `
You are an expert, analytical academic coach. 
The student just completed an Elite Star Batch MCQ test.

Here are the results:
Score: ${score} out of ${total}
Topics they struggled with (answered incorrectly): ${weakTopics && weakTopics.length > 0 ? weakTopics.join(', ') : 'None, great job!'}
Difficulty of wrong answers: ${wrongDifficulties && wrongDifficulties.length > 0 ? wrongDifficulties.join(', ') : 'N/A'}

Write a direct, highly analytical, and actionable review (max 4 sentences) summarizing their performance. 
- Do NOT be overly fluffy or purely encouraging. Focus on exactly what they need to fix.
- Explicitly tell the user which topics they need to focus on and revise based on their mistakes.
- If they made mistakes on 'Easy' questions, explicitly warn them about silly mistakes in those specific topics.
- If the score is perfect, you can briefly praise them and tell them they have mastered these topics.
Keep the tone elite, professional, and brutally helpful. 
Do NOT output markdown. Just plain text.
    `.trim();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ai-test-review] Groq API error ${response.status}: ${errText.slice(0, 200)}`);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const reviewText = data.choices?.[0]?.message?.content || 'Keep up the great work!';

    return new Response(JSON.stringify({ review: reviewText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[ai-test-review] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
