const AI_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const AI_API_KEY = import.meta.env.GROQ_API_KEY;
const MODEL_NAME = 'openai/gpt-oss-120b';

async function callLLM(systemPrompt, userPrompt, responseFormat = 'text') {
  if (!AI_API_KEY) {
    throw new Error("Groq API Key is missing. Please set GROQ_API_KEY in your local environment.");
  }
  
  const body = {
    model: MODEL_NAME,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  };

  if (responseFormat === 'json') {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error('Our servers are currently experiencing high traffic. Please try again in a moment.');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function processAiChatQuery(question, allowedChapters) {
  try {
    // Layer 1: Verification & Spelling Correction
    // The LLM checks if the question is academic AND corrects any spelling mistakes
    // (especially names of chapters, scientists, terms) so the vector DB gets clean input.
    const verificationSystemPrompt = `You are an academic classifier and spelling corrector for Indian 10th-grade textbooks.

Your tasks:
1. Check if the user's question is related to academics/studies.
2. If academic, correct any spelling mistakes in the question — especially chapter names, scientific terms, historical figures, places, and subject-specific vocabulary. Use standard Indian NCERT/state board terminology.
3. Produce a cleaned, corrected version of the question for vector database search.

Output STRICTLY in JSON format:
{"isAcademic": boolean, "correctedQuery": "the spelling-corrected version of the question", "topic": "extracted chapter/topic name or null"}

Do not output any other text.`;
    
    let verificationOutput;
    try {
      const rawOutput = await callLLM(verificationSystemPrompt, question, 'json');
      const cleanJson = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      verificationOutput = JSON.parse(cleanJson);
    } catch (err) {
      console.error("Verification parsing failed:", err);
      // Fallback: treat as academic with original question
      verificationOutput = { isAcademic: true, correctedQuery: question, topic: question }; 
    }

    if (!verificationOutput.isAcademic) {
      return "I'm sorry, but I can only assist with strictly academic-related queries.";
    }

    // Use the spelling-corrected query for the vector DB search
    const searchQuery = verificationOutput.correctedQuery || question;

    // Layer 2: Authorization — DISABLED for now
    // The chapter-matching logic is kept but bypassed. All academic questions
    // go directly to the vector DB. The synthesis LLM will handle cases where
    // the data doesn't exist by refusing to make things up.
    /*
    const extractedTopic = (verificationOutput.topic || "").toLowerCase();
    const isTopicAllowed = allowedChapters.some(chapter => 
      extractedTopic.includes(chapter.toLowerCase()) || chapter.toLowerCase().includes(extractedTopic)
    );
    
    if (allowedChapters.length > 0 && !isTopicAllowed && extractedTopic.length > 2) {
       return "I apologize, but I couldn't find verified textbook data for this specific topic in my current database.";
    }
    */

    // Layer 3: Vector Database Fetch (using corrected query)
    const vectorResponse = await fetch('https://pdf-rag-vercel-api.vercel.app/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery })
    });

    if (!vectorResponse.ok) {
      throw new Error('Our servers are currently experiencing high traffic. Please try again in a moment.');
    }

    const vectorData = await vectorResponse.json();
    const contextResults = vectorData.results || "";

    // Layer 4: Synthesis — with strict anti-hallucination guardrails
    const synthesisSystemPrompt = `You are a custom model designed by Utkarsh only. You are a trusted academic assistant for Indian 10th-grade students.

STRICT RULES:
1. Answer the user's question based ONLY on the provided context from the vector database below.
2. If the context is empty, irrelevant, or does not contain information to answer the question, you MUST say: "I couldn't find verified information about this topic in my current database. This chapter may not have been uploaded yet."
3. DO NOT guess, hallucinate, or use outside knowledge. If the context talks about a completely different topic than what the user asked, tell the user honestly.
4. If the context partially answers the question, provide what you can and clearly state what information is missing.
5. Format the final output in clean, readable markdown with headings, bullet points, and bold text where appropriate.

If asked who made you, reply ONLY: "I am a custom model designed by Utkarsh only."

--- Vector Database Context ---
${contextResults}`;

    const finalAnswer = await callLLM(synthesisSystemPrompt, question);
    return finalAnswer;

  } catch (error) {
    console.error("AI Chat Error:", error);
    if (error.message.includes('Our servers are currently experiencing high traffic')) {
      return error.message;
    }
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      return "I'm having trouble connecting to the verified database. This might be a temporary network issue or a CORS configuration error on the API server.";
    }
    return "I encountered an unexpected issue while processing your request. Please try again later.";
  }
}

export async function processSyllabusChatQuery(query, syllabusData) {
  try {
    const minifiedSyllabus = syllabusData.map(sec => ({
      sectionId: sec.sectionId,
      sectionName: sec.sectionName,
      subjects: sec.subjects.map(sub => ({
        subjectId: sub.subjectId,
        subjectName: sub.subjectName,
        chapters: sub.chapters.map(ch => ({
          chapterId: ch.chapterId,
          chapterName: ch.chapterName
        }))
      }))
    }));

    const systemPrompt = `You are a helpful AI assistant integrated into a student's Syllabus Tracker.
Your job is to parse the user's message indicating what chapters they have completed today, and map those to the exact chapterIds from the provided syllabus data.

Here is the syllabus structure in JSON (array of sections, containing subjects, containing chapters):
${JSON.stringify(minifiedSyllabus)}

Extract all chapters the user claims to have completed.
Return a STRICT JSON object in this format:
{
  "chaptersToUpdate": ["chapterId1", "chapterId2"],
  "message": "A friendly confirmation message to the user acknowledging the chapters they completed."
}
Do not output any other text besides the JSON.`;

    const rawOutput = await callLLM(systemPrompt, query, 'json');
    const cleanJson = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Syllabus Chat Error:", error);
    throw error;
  }
}
