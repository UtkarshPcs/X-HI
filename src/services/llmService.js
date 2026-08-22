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

export async function processSyllabusChatQuery(query, syllabusData, trackingConfig) {
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
Your job is to parse the user's message indicating what chapters they have completed today, and map those to the exact chapterIds from the provided syllabus data. Additionally, extract WHICH tasks they completed for those chapters based on the task list below.

Here is the syllabus structure in JSON:
${JSON.stringify(minifiedSyllabus)}

Here are the available checklist tasks (global config):
${JSON.stringify(trackingConfig)}

Rules:
1. Extract the chapters the user claims to have studied.
2. Extract the SPECIFIC tasks they claim to have done (e.g. if they say "read ncert", that maps to the "ncert-reading" task. If they say "watched lecture", map to "class-notes").
3. If they don't specify any tasks and just say they finished the chapter, you can return "ALL". But if they specify tasks, ONLY return those exact taskIds.
4. If they just say "I read NCERT for chapter 3 History", only check "ncert-reading" for chapter 3 History.

Return a STRICT JSON object in this format:
{
  "updates": [
    {
      "chapterId": "chapterId-here",
      "taskIds": ["ncert-reading", "class-notes"] // or "ALL" if they completed the whole chapter
    }
  ],
  "message": "A friendly confirmation message to the user acknowledging exactly what was marked."
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

export async function transcribeAudio(audioBlob) {
  if (!AI_API_KEY) {
    throw new Error("Groq API Key is missing. Please set GROQ_API_KEY in your local environment.");
  }
  
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3-turbo');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_API_KEY}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to transcribe audio');
  }

  const data = await response.json();
  return data.text;
}

export async function parseDictatedHomework(transcript) {
  const systemPrompt = `You are an assistant that extracts homework tasks from a dictation.
Return a JSON object with a single key "tasks" which is an array of task objects.
Each task object must have:
- "subject": string (e.g., Math, Science)
- "description": string (the actual task)

CRITICAL INSTRUCTION:
1. Group all tasks by subject. There must be ONLY ONE object per subject.
2. If there are multiple tasks for the same subject, combine them into the same "description" string, separated by a line break (\\n).
3. Capitalization: Always capitalize the first letter of the first word in the description.
4. Voice: Write the task description in an active, imperative voice (e.g., "Revise Chapter 2", "Solve Page 12"). Do NOT use passive voice.
5. Hindi Translation: If the subject is "Hindi", you MUST translate the entire description into the Hindi language (Devanagari script), even if it was dictated in English.

For example, if you hear "Math do chapter 5 and also Math solve page 12", return:
{"tasks": [{"subject": "Math", "description": "Do chapter 5.\\nSolve page 12."}]}
If you hear "Hindi read chapter 2", return:
{"tasks": [{"subject": "Hindi", "description": "अध्याय 2 पढ़ें।"}]}

Return ONLY the JSON object.`;

  const rawOutput = await callLLM(systemPrompt, transcript);
  const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.tasks || [];
    } catch (e) {
      console.error("Failed to parse homework JSON:", e);
      return [];
    }
  }
  return [];
}

export async function parseDictatedClasswork(transcript, scheduleList) {
  const systemPrompt = `You are an assistant that extracts classwork notes for specific subjects or periods from a dictation.
Here is the current schedule for the day:
${JSON.stringify(scheduleList)}
Based on the dictated text, fill in the "note" for the corresponding subjects or periods.
Return a JSON object with a single key "notes" where keys inside it are the exact period labels from the schedule (e.g., "1st", "2nd", "3rd") and values are the notes.

CRITICAL INSTRUCTION:
1. Capitalization: Always capitalize the first letter of the first word in the note.
2. Voice: Write the note in an active, past-tense voice (e.g., "Completed Chapter 5", "Read Page 20"). Do NOT use passive voice.
3. Hindi Translation: If the subject for that period is "Hindi", you MUST translate the entire note into the Hindi language (Devanagari script), even if it was dictated in English.

Example: {"notes": {"1st": "Completed Chapter 5.", "3rd": "Read Page 20."}}
If the 2nd period is Hindi and dictation says "taught grammar", return:
{"notes": {"2nd": "व्याकरण पढ़ाया।"}}

Return ONLY the JSON object. Do not output anything else.`;

  const rawOutput = await callLLM(systemPrompt, transcript);
  const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.notes || {};
    } catch (e) {
      console.error("Failed to parse classwork JSON:", e);
      return {};
    }
  }
  return {};
}

export async function generateTermPracticeReport(test, result, questions, userAnswers) {
  const systemPrompt = `You are an expert AI coach for 10th-grade Indian students (CBSE pattern).
Your goal is to analyze a student's performance on a Term Practice Test and generate a highly personalized, actionable diagnostic report.

You will receive JSON containing:
- The questions, their topics, types (objective/subjective), difficulty, and max marks.
- The student's score for each question.
- The total score.

Output MUST be a valid JSON matching this schema exactly:
{
  "diagnosis": {
    "summary": "Short punchy sentence summarizing the biggest issue (e.g., 'Your biggest issue isn't knowledge — it's answer execution.')",
    "strong": ["List of strong areas"],
    "needs_work": ["Areas needing work"],
    "weak": ["Weak areas"],
    "major_issue": "The main reason they are losing marks",
    "advice": "1-2 sentences of specific advice."
  },
  "chapterHealth": [
    {
      "topic": "Topic Name",
      "score": 10,
      "max": 15,
      "accuracy": 66,
      "status": "Needs Work",
      "insight": "1 sentence insight on what went wrong here"
    }
  ],
  "difficulty": {
    "easy": { "score": 10, "max": 10, "accuracy": 100 },
    "medium": { "score": 15, "max": 20, "accuracy": 75 },
    "hard": { "score": 5, "max": 10, "accuracy": 50 },
    "insight": "1 sentence summarizing difficulty performance"
  },
  "objSubj": {
    "objective": { "accuracy": 90, "insight": "Your conceptual recognition is strong." },
    "subjective": { "accuracy": 60, "insight": "You understand the concepts but lose marks while expressing them." },
    "recommendation": "Focus Area: Practice 3–5 mark answers rather than doing more MCQs."
  },
  "recovery": {
    "easy": 4,
    "moderate": 3,
    "deep": 5,
    "roi": ["Improve subjective answers → +3 marks", "Revise Excretion → +2 marks"],
    "potentialScore": "72-74/80"
  },
  "actionPlan": [
    {
      "priority": 1,
      "topic": "Topic Name",
      "time": "30 min",
      "actions": ["Revise concept", "Solve 5 questions"]
    }
  ]
}

CRITICAL: Return ONLY valid JSON. No markdown formatting, no comments.`;

  const userPrompt = JSON.stringify({
    title: test.title,
    subject: test.subjectId,
    totalScore: result.score,
    maxScore: result.total,
    performance: questions.map((q, idx) => ({
      qIdx: idx + 1,
      topic: q.topic || 'General',
      type: q.type || (q.marks === 1 ? 'objective' : 'subjective'),
      difficulty: q.difficulty || 'Medium',
      marksAvailable: q.marks || 1,
      marksObtained: userAnswers[idx] || 0
    }))
  });

  const rawOutput = await callLLM(systemPrompt, userPrompt, 'json');
  try {
    const parsed = JSON.parse(rawOutput.match(/\{[\s\S]*\}/)[0]);
    return parsed;
  } catch (e) {
    console.error("Failed to parse report JSON:", e);
    return null;
  }
}

export async function generateQuizExplanation(question, options, correctOptionIndex) {
  try {
    const vectorResponse = await fetch('https://pdf-rag-vercel-api.vercel.app/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question })
    });
    
    let contextResults = "";
    if (vectorResponse.ok) {
      const vectorData = await vectorResponse.json();
      contextResults = vectorData.results || "";
    }

    const correctOptionText = options[correctOptionIndex];
    let optionsText = options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');

    const synthesisSystemPrompt = `You are an expert AI tutor. A student just completed a quiz question.
Your task is to explain WHY the correct answer is correct.

Question: ${question}
Options:
${optionsText}

Correct Answer: ${String.fromCharCode(65 + correctOptionIndex)}. ${correctOptionText}

STRICT RULES:
1. Explain clearly and concisely why this answer is the correct one.
2. If applicable, briefly explain why the other options are incorrect.
3. Use the provided context below if it helps, but you can also use your general academic knowledge to explain the concept.
4. Format the output in clean, readable markdown with headings, bullet points, and bold text where appropriate. Use LaTeX for math equations.

--- Context ---
${contextResults}`;

    const finalAnswer = await callLLM(synthesisSystemPrompt, question);
    return finalAnswer;
  } catch (error) {
    console.error("Quiz Explanation Error:", error);
    return "Failed to generate explanation. Please try again.";
  }
}
