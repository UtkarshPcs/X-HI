# Periodic Predicted Analysis JSON Generation Skill

**Description:** Use this skill to generate tests for the "Periodic Predicted Analysis" module. This module expects an exact schema and strict rules to function correctly.

## Core Rules
1. The JSON MUST be an array containing exactly 20 objects. 
2. The subjects allowed are: `Science`, `Maths`, `SST`, `English`, `Hindi`, `IT`.
3. The `topic` field MUST be accurately filled based on the subject's sub-topics below to ensure the Analytics Dashboard generates accurate reports.

## Subject Sub-topics Mapping
Use only these exact strings for the `topic` field:
- **Science:** `Physics`, `Chemistry`, `Biology`
- **Maths:** `Algebra`, `Geometry`, `Trigonometry`, `Mensuration`, `Statistics & Probability`, `Number Systems`, `Coordinate Geometry`
- **SST:** `History`, `Geography`, `Political Science`, `Economics`
- **English:** `Reading Comprehension`, `Grammar`, `Literature`, `Writing Skills`
- **Hindi:** `Reading Comprehension`, `Grammar`, `Literature`, `Writing Skills`
- **IT:** `Computer Systems`, `Networking`, `Database`, `Programming`

## JSON Schema Example
Generate exactly 20 objects in this format inside a root array:

```json
[
  {
    "question": "What is the SI unit of Force?",
    "options": ["Joule", "Newton", "Pascal", "Watt"],
    "correctOptionIndex": 1,
    "topic": "Physics",
    "difficulty": "Easy",
    "explanation": "Force is defined as mass times acceleration. Its SI unit is kg·m/s², which is called Newton (N).",
    "concept": "Newton's Laws of Motion",
    "misconception": "Many confuse Joule (unit of Energy/Work) with Newton (unit of Force)."
  },
  {
    "question": "Calculate the area of a circle with radius 7cm. (Use π = 22/7)",
    "options": ["154 cm²", "44 cm²", "144 cm²", "22 cm²"],
    "correctOptionIndex": 0,
    "topic": "Mensuration",
    "difficulty": "Medium",
    "explanation": "Area = πr² = (22/7) * 7 * 7 = 154 cm².",
    "concept": "Area of Circles",
    "misconception": "Some students calculate the circumference (2πr) instead of the area."
  }
  // ... exactly 18 more questions
]
```

## Validation Checklist
- [ ] Is it a JSON Array?
- [ ] Does it have exactly 20 items?
- [ ] Are all `correctOptionIndex` values between 0 and 3?
- [ ] Are all `topic` strings exactly matching the allowed sub-topics for the target subject?
- [ ] Are `difficulty` values restricted to "Easy", "Medium", or "Hard"?
- [ ] Are math formulas formatted properly using LaTeX enclosed in `$` or `$$`?
- [ ] **CRITICAL JSON ESCAPING:** Did you double-escape all LaTeX backslashes? (e.g. `\\frac{1}{2}` instead of `\frac{1}{2}`, `\\sqrt{x}` instead of `\sqrt{x}`). Failure to double-escape will result in invalid JSON!
