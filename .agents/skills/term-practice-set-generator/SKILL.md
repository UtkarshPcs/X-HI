---
name: term-practice-set-generator
description: Extracts or generates a full 80-mark Term Practice Set JSON (Half Yearly Examination) combining objective, subjective, and case-based questions into a single valid JSON file.
---

# Term Practice Set Generator

This skill instructs you on how to format and generate full-length 80-mark practice papers for the **Term Practice Set** feature. Unlike chapter-wise tests, these tests span multiple chapters (the Half Yearly syllabus) and combine both **Objective** and **Subjective** questions into a single, unified JSON file.

## Core Rules
1. **Single JSON Output**: Output exactly ONE valid JSON file representing the entire 80-mark question paper.
2. **Follow the Syllabus**: The test must only contain questions from the specific chapters included in the Half Yearly Examination syllabus provided to you by the user.
3. **Format Support**: All text fields (`text`, `stepText`, `options`) fully support **Markdown** and **LaTeX** notation (`$math$` or `$$math$$`). Because it's JSON, you MUST double-escape backslashes (e.g., `"$\\sqrt{2}$"`).
4. **Sections**: The paper must be divided into sections (e.g., Section A (1 Mark), Section B (2 Marks), etc.). You MUST define the `sectionTitle` on the VERY FIRST question of that section. The test player will automatically render this title as a heading before that question.
5. **Question Numbering**: Provide sequential numbering using the `question_number` field. Do NOT hardcode "1.", "Q1.", etc. in the `text` field.
6. **Diagrams**: For geometry/physics/biology diagrams, strictly use the JSXGraph and SVG templates defined below, just like the Star Batch tests.
7. **Marks**: The total sum of the `marks` field across all questions must perfectly equal **80**.

---

## Unified JSON Schema

```json
{
  "subjectId": "science",
  "title": "Science Half Yearly Practice Set 1",
  "questions": [
    {
      "sectionTitle": "Section A - Objective Type (1 Mark each)",
      "question_number": 1,
      "type": "objective",
      "chapterId": "science-0-c0",
      "topic": "Reflection",
      "text": "What is the angle of reflection if the incident angle is $30^\\circ$?",
      "options": ["$30^\\circ$", "$45^\\circ$", "$60^\\circ$", "$90^\\circ$"],
      "correctOptionIndex": 0,
      "marks": 1,
      "difficulty": "Easy",
      "explanation": "According to the law of reflection, angle of incidence = angle of reflection."
    },
    {
      "question_number": 2,
      "type": "objective",
      "chapterId": "science-1-c1",
      "topic": "Acids and Bases",
      "text": "Which of the following is a strong acid?",
      "options": ["HCl", "Acetic Acid", "Citric Acid", "Water"],
      "correctOptionIndex": 0,
      "marks": 1,
      "difficulty": "Medium",
      "explanation": "HCl completely dissociates in water."
    },
    {
      "sectionTitle": "Section B - Very Short Answer Type (2 Marks each)",
      "question_number": 21,
      "type": "subjective",
      "chapterId": "science-2-c0",
      "topic": "Photosynthesis",
      "text": "Write the balanced chemical equation for photosynthesis.",
      "marks": 2,
      "difficulty": "Medium",
      "answerSteps": [
        {
          "stepText": "$6CO_2 + 12H_2O \\xrightarrow{\\text{Light, Chlorophyll}} C_6H_{12}O_6 + 6O_2 + 6H_2O$",
          "marks": 1.5
        },
        {
          "stepText": "Balancing and conditions explicitly mentioned.",
          "marks": 0.5
        }
      ]
    }
  ]
}
```

### Field Requirements
- **`subjectId`**: Must be the top-level string representing the subject: `"science"`, `"math"`, `"sst"`, `"english"`, `"hindi"`, or `"it"`.
- **`sectionTitle`**: ONLY add this string to the FIRST question of a new section. Omit this field entirely for the subsequent questions in the same section.
- **`type`**: Must be `"objective"` or `"subjective"`.
- **`marks`**: Integer or Float representing the total marks for the question.
- **`difficulty`**: MUST be one of `"Easy"`, `"Medium"`, or `"Hard"`. This field is mandatory for AI diagnosis.
- **`topic`**: A short 2-4 word string indicating the specific concept/topic tested (e.g., `"Acids and Bases"`, `"Photosynthesis"`). Mandatory for Chapter Health.
- **`answerSteps` (Subjective Only)**: Must provide a step-by-step marking scheme where the sum of `marks` inside `answerSteps` equals the question's total `marks`.
- **`options` and `correctOptionIndex` (Objective Only)**: Array of 4 strings, and a 0-based integer representing the correct answer.
- **`chapterId`**: MUST use the exact Chapter Code from the Valid IDs list below.

---

## Valid IDs (Subjects & Chapters)

You must map each question to the correct `chapterId` using this list.

### Science (`subjectId`: "science")
- **Physics (`science-0`)**
  - Light - Reflection and Refraction: `science-0-c0`
  - Human Eye and Colourful World: `science-0-c1`
  - Electricity: `science-0-c2`
  - Magnetic Effects of Electric Current: `science-0-c3`
- **Chemistry (`science-1`)**
  - Chemical Reactions and Equations: `science-1-c0`
  - Acids, Bases and Salts: `science-1-c1`
  - Metals and Non-Metals: `science-1-c2`
  - Carbon and Its Compounds: `science-1-c3`
  - Periodic Classification of Elements: `science-1-c4`
- **Biology (`science-2`)**
  - Life Processes: `science-2-c0`
  - Control and Coordination: `science-2-c1`
  - How Do Organisms Reproduce?: `science-2-c2`
  - Heredity and Evolution: `science-2-c3`
  - Our Environment: `science-2-c4`
  - Sustainable Management of Natural Resources: `science-2-c5`

### Social Science (`subjectId`: "sst")
- **History (`sst-0`)**
  - The Rise of Nationalism in Europe: `sst-0-c0`
  - Nationalism in India: `sst-0-c1`
  - The Making of a Global World: `sst-0-c2`
  - The Age of Industrialisation: `sst-0-c3`
  - Print Culture and the Modern World: `sst-0-c4`
- **Geography (`sst-1`)**
  - Resources and Development: `sst-1-c0`
  - Forest and Wildlife Resources: `sst-1-c1`
  - Water Resources: `sst-1-c2`
  - Agriculture: `sst-1-c3`
  - Minerals and Energy Resources: `sst-1-c4`
  - Manufacturing Industries: `sst-1-c5`
  - Lifelines of National Economy: `sst-1-c6`
- **Civics (`sst-2`)**
  - Power Sharing: `sst-2-c0`
  - Federalism: `sst-2-c1`
  - Gender Religion and Caste: `sst-2-c2`
  - Political Parties: `sst-2-c3`
  - Outcomes of Democracy: `sst-2-c4`
- **Economics (`sst-3`)**
  - Development: `sst-3-c0`
  - Sectors of the Indian Economy: `sst-3-c1`
  - Money and Credit: `sst-3-c2`
  - Globalisation and the Indian Economy: `sst-3-c3`
  - Consumer Rights: `sst-3-c4`

### Mathematics (`subjectId`: "math")
- Real Numbers: `maths-0-c0`
- Polynomials: `maths-0-c1`
- Pair of Linear Equations in Two Variables: `maths-0-c2`
- Quadratic Equations: `maths-0-c3`
- Arithmetic Progressions: `maths-0-c4`
- Triangles: `maths-0-c5`
- Coordinate Geometry: `maths-0-c6`
- Introduction to Trigonometry: `maths-0-c7`
- Applications of Trigonometry: `maths-0-c8`
- Circles: `maths-0-c9`
- Areas Related to Circles: `maths-0-c10`
- Surface Areas and Volumes: `maths-0-c11`
- Statistics: `maths-0-c12`
- Probability: `maths-0-c13`

### English (`subjectId`: "english")
- Reading Skills: `english-0-c0` (Unseen Passage)
- Writing Skills: `english-1-c0` to `english-1-c4` (Article, Speech, Debate, Letter, Story)
- Grammar: `english-2-c0` to `english-2-c6`
- Literature: `english-3-c0` to `english-3-c13`

### IT (`subjectId`: "it")
- Employability Skills: `it-0-c0` to `it-0-c4`
- Vocational Skills: `it-1-c0` to `it-1-c3`

### Hindi (`subjectId`: "hindi")
- Sparsh: `hindi-0-c0` to `hindi-0-c6`
- Sparsh Poetry: `hindi-1-c0` to `hindi-1-c6`
- Sanchayan: `hindi-2-c0` to `hindi-2-c2`
- Grammar: `hindi-3-c0` to `hindi-3-c13`

---

## Diagrams & Case Studies
- **LaTeX TikZ**: Use the `tikz` template for any geometric, mathematical, or scientific diagrams that require high precision and are better represented with TikZ. Provide pure, self-contained standard LaTeX TikZ code inside the `tikz_code` field. Ensure you use standard TikZ (`\usepackage{tikz}`) and avoid complex external packages like `pgfplots` or `tkz-euclide` to guarantee compatibility with web rendering.
  ```json
  "diagram": {
    "template": "tikz",
    "tikz_code": "\\begin{tikzpicture}\n\\draw (0,0) -- (1,1);\n\\end{tikzpicture}"
  }
  ```
- **JSXGraph and SVG**: You can still use the **JSXGraph** template or standard SVGs for other procedural drawings if preferred.
- Insert the `diagram` object directly into the question object.
- **Case-Based Questions (4 or 5 marks)**: These should be categorized as `"subjective"`. Write the common scenario/paragraph at the beginning of the `text`, then list sub-questions (i), (ii), (iii) inside the same `text`. The `answerSteps` must explicitly map to these sub-questions. If a diagram is needed for the case study, include the `diagram` object in that question.

## Checklist before Final Output
1. Are there exactly 80 total marks?
2. Are backslashes for LaTeX double-escaped?
3. Is `sectionTitle` only applied to the *first* question of each section?
4. Do `chapterId` tags match the Valid IDs list?
