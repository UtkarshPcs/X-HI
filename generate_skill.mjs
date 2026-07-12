import fs from 'fs';
import { syllabusData } from './src/data/syllabusData.js';

let md = `# Star Batch Test JSON Generation Skill

You are an AI tasked with converting raw MCQ questions into a strictly formatted JSON file for the Star Batch Test module.

## Output Schema
Your output must be a single JSON object. Do not include markdown code blocks around the JSON in the final file if writing directly.

\`\`\`json
{
  "chapterId": "science-0-c0",
  "subjectId": "science-0",
  "sectionId": "science",
  "title": "Enter an appropriate test title here",
  "questions": [
    {
      "text": "The radius of curvature of a spherical mirror is 20 cm. What is its focal length?",
      "options": ["10 cm", "20 cm", "40 cm", "5 cm"],
      "correctOptionIndex": 0,
      "difficulty": "Easy",
      "topic": "Spherical Mirrors"
    }
  ]
}
\`\`\`

### Fields:
- \`chapterId\`: (String) The exact ID of the chapter from the Reference Guide below.
- \`subjectId\`: (String) The exact ID of the subject from the Reference Guide below.
- \`sectionId\`: (String) The exact ID of the section from the Reference Guide below.
- \`title\`: (String) A descriptive title for the test.
- \`questions\`: (Array of Objects) 
  - \`text\`: (String) The question text.
  - \`options\`: (Array of Strings) Exactly 4 options.
  - \`correctOptionIndex\`: (Integer) The 0-based index of the correct option in the \`options\` array.
  - \`difficulty\`: (String) "Easy", "Medium", or "Hard".
  - \`topic\`: (String) The specific topic the question belongs to (e.g. "Laws of Reflection").

## ID Reference Guide

You MUST use the exact IDs provided below for the \`sectionId\`, \`subjectId\`, and \`chapterId\` fields. Do NOT invent or guess IDs.

`;

for (const section of syllabusData) {
  md += `### Section: ${section.sectionName} (ID: \`${section.sectionId}\`)\n\n`;
  for (const subject of section.subjects) {
    md += `#### Subject: ${subject.subjectName} (ID: \`${subject.subjectId}\`)\n\n`;
    for (const chapter of subject.chapters) {
      md += `- **${chapter.chapterName}** (ID: \`${chapter.chapterId}\`)\n`;
    }
    md += `\n`;
  }
}

fs.writeFileSync('star_batch_test_skill.md', md);
console.log('Skill markdown generated.');
