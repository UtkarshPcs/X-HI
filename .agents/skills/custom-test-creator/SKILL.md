# Custom Test JSON Generation Skill

You are an AI tasked with converting raw MCQ questions and test metadata into a strictly formatted JSON payload for the Custom Test Module.

## Output Schema
Your output must be a single JSON object. Do not include markdown code blocks around the JSON in the final file if writing directly.

```json
{
  "title": "General Science & GK Quiz",
  "description": "A quick 15-minute quiz to test your general awareness.",
  "syllabus": "Science, World History, Current Affairs",
  "timer": {
    "type": "countdown",
    "durationMinutes": 15
  },
  "questions": [
    {
      "text": "The radius of curvature of a spherical mirror is 20 cm. What is its focal length?",
      "options": ["10 cm", "20 cm", "40 cm", "5 cm"],
      "correctOptionIndex": 0,
      "difficulty": "Easy",
      "topic": "Spherical Mirrors"
    },
    {
      "text": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correctOptionIndex": 2,
      "difficulty": "Easy",
      "topic": "GK"
    }
  ]
}
```

### Fields:
- `title`: (String) A descriptive title for the test.
- `description`: (String) A short description explaining the test.
- `syllabus`: (String) A short string indicating what topics are covered.
- `timer`: (Object) Timer configuration.
  - `type`: (String) `"countdown"`, `"stopwatch"`, or `"none"`.
  - `durationMinutes`: (Integer) Required if `type` is `"countdown"`. The duration of the test in minutes.
- `questions`: (Array of Objects) 
  - `text`: (String) The question text. **IMPORTANT**: Use Markdown and LaTeX here! **CRITICAL: Do NOT hardcode question numbers (e.g., "1.", "Q1.") at the start of the text. The system auto-numbers questions.**
  - `options`: (Array of Strings) Exactly 4 options. Options fully support Markdown and LaTeX formulas.
  - `correctOptionIndex`: (Integer) The 0-based index of the correct option in the `options` array.
  - `difficulty`: (String) Must strictly be one of: `"Easy"`, `"Medium"`, `"Hard"`, or `"Super Difficult"`.
  - `topic`: (String) The specific topic the question belongs to (e.g. "Laws of Reflection").

### LaTeX & Double Escaping Rule:
**CRITICAL:** Because you are generating JSON, you MUST double-escape all backslashes in free text fields (`text`, `options`, etc). For example, to render `\sqrt{2}`, the JSON string must be `"$\\sqrt{2}$"`. If you only use one backslash (like `"$\sqrt{2}$"`), the JSON parser will fail or the LaTeX won't render correctly. This applies to all LaTeX commands (e.g. `\\frac{a}{b}`, `\\pi`, `\\angle`, `\\times`, `H_2O`). Wrap math and chemistry formulas in `$` (e.g. `"$567x + 693 \\times (-4)$"` or `"$H_2O$"`).
