---
name: pdf-test-extractor
description: Automatically extracts questions from a PDF and categorizes them into two proper Star Batch JSON files (Objective and Subjective) using exact schema rules.
---

# PDF Test Extractor

This skill instructs you on how to extract test questions from a raw PDF document and output them into **two separate JSON files** for the Star Batch system:
1. `objective_test.json` (for MCQs)
2. `subjective_test.json` (for descriptive questions with marking schemes)

## General Rules for Extraction
1. Read the provided PDF document thoroughly.
2. Separate the questions into two lists: Objective (has multiple-choice options) and Subjective (requires a written answer or proof).
3. Do NOT hardcode question numbers (e.g., "1.", "Q1.") at the start of the `text`. The system auto-numbers questions.
4. Format all math equations in LaTeX notation using `$` or `$$`.
5. Group the output into strictly valid JSON files.

---

## 1. Objective JSON Schema
If a question has multiple-choice options (e.g. (a), (b), (c), (d)), it goes here.

```json
{
  "chapterId": "maths-0-c0",
  "subjectId": "maths-0",
  "sectionId": "maths",
  "title": "Real Numbers - Objective Test",
  "type": "objective",
  "questions": [
    {
      "text": "What is the square root of 4?",
      "options": ["1", "2", "3", "4"],
      "correctOptionIndex": 1,
      "difficulty": "Medium",
      "topic": "Basic Math"
    }
  ]
}
```
**Rules:**
- `options`: Must be an array of exactly 4 strings.
- `correctOptionIndex`: Integer (0-3) indicating the correct option. Determine this logically if the PDF doesn't have an answer key.
- `difficulty`: `"Easy"`, `"Medium"`, `"Hard"`, or `"Super Difficult"`.
- `type`: Must be `"objective"`.

---

## 2. Subjective JSON Schema
If a question requires a written answer, proof, or steps, it goes here.

```json
{
  "chapterId": "maths-0-c0",
  "subjectId": "maths-0",
  "sectionId": "maths",
  "title": "Real Numbers - Subjective Test",
  "type": "subjective",
  "questions": [
    {
      "text": "Prove that $\\sqrt{2}$ is irrational.",
      "marks": 3,
      "difficulty": "Hard",
      "topic": "Irrational Numbers",
      "answerSteps": [
        {
          "stepText": "Assume $\\sqrt{2}$ is rational, so $\\sqrt{2} = a/b$ where $a$ and $b$ are coprime.",
          "marks": 1
        },
        {
          "stepText": "Squaring both sides gives $2 = a^2/b^2$, which means $a^2 = 2b^2$.",
          "marks": 2
        }
      ]
    }
  ]
}
```
**Rules:**
- `marks`: Integer (e.g., 1, 2, 3, 4, 5). Determine logically based on standard CBSE/NCERT marking schemes if not provided.
- `answerSteps`: Must be an array of objects (`stepText` and `marks`). The sum of `marks` in `answerSteps` must exactly equal the question's total `marks`. Write clear, step-by-step logic for the answer.
- `type`: Must be `"subjective"`.

---

## Output Requirements
When invoked, you must output **ONLY** the two JSON files enclosed in markdown code blocks. 

Provide:
1. `objective_test.json` code block
2. `subjective_test.json` code block

Make sure the JSON is 100% valid. Do not omit any questions from the PDF.
