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
You are an expert, encouraging high school academic coach. 
The student just completed an Elite Star Batch MCQ test.

Here are the results:
Score: ${score} out of ${total}
Topics they struggled with (answered incorrectly): ${weakTopics && weakTopics.length > 0 ? weakTopics.join(', ') : 'None, great job!'}
Difficulty of wrong answers: ${wrongDifficulties && wrongDifficulties.length > 0 ? wrongDifficulties.join(', ') : 'N/A'}

Write a short, highly motivating, and highly personalized review (max 4-5 sentences) summarizing their performance. 
- If the score is high, praise them and advise them to keep it up.
- If they made mistakes on 'Easy' questions, gently remind them to avoid silly mistakes and read carefully.
- If they struggled on 'Hard' questions, encourage them that these are meant to be challenging and point out the specific topics to revise.
- Keep the tone elite, professional, yet warm. 
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
