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

## Concept Field — Canonical Names (REQUIRED)

The `concept` field MUST use **exactly** one of the strings listed below for the target subject.
Using exact canonical names ensures the Topic Mastery Report Card correctly tracks student weaknesses.

**Maths:**
`Prime Factorisation` | `HCF and LCM (Prime Factorisation Method)` | `HCF × LCM Relationship Formula` | `Numbers Ending with Digit 0 (Analysis)` | `Composite Number Verification` | `HCF/LCM Applied Word Problems` | `Prime Divisibility Theorem` | `Irrationality Proofs (√2, √3, √5)` | `Rational + Irrational Combinations` | `Degrees and Classification of Polynomials` | `Zeroes of a Polynomial` | `Geometric Representation of Polynomials` | `Sum and Product of Zeroes` | `Forming Quadratic Polynomial from Zeroes`

**Science:**
`Chemical Reactions and Equations` | `Balancing Chemical Equations` | `Combination Reactions` | `Decomposition Reactions` | `Displacement Reactions` | `Double Displacement Reactions` | `Oxidation and Reduction` | `Oxidising and Reducing Agents` | `Corrosion` | `Rancidity` | `Life Processes and Nutrition` | `Human Digestive System` | `Respiration (Aerobic and Anaerobic)` | `Human Respiratory System` | `Transportation and Circulatory System` | `Human Heart and Double Circulation` | `Blood Components and Blood Vessels` | `Lymph` | `Transport in Plants (Xylem and Phloem)` | `Transpiration` | `Excretion and Excretory System` | `Nephron and Urine Formation` | `Dialysis (Artificial Kidney)` | `Laws of Reflection` | `Spherical Mirrors and Image Formation` | `Mirror Formula and Magnification` | `Sign Convention and Ray Diagrams` | `Refraction of Light` | `Refractive Index and Snell's Law` | `Lenses (Convex and Concave)` | `Lens Formula and Magnification` | `Power of a Lens` | `Numerical Problems on Light`

**IT:**
`Methods and Types of Communication` | `Communication Process and Body Language` | `Feedback in Communication` | `Principles of Effective Communication` | `Barriers in Communication` | `Parts of Speech and Capitalisation` | `Punctuation` | `Sentence Construction and Types` | `Parts of a Sentence` | `Active and Passive Voice` | `Paragraph Writing` | `Styles in a Document` | `Inserting and Managing Images` | `Document Templates` | `Table of Contents (ToC)` | `Track Changes and Document Review`

**Hindi:**
`पदबंध (परिभाषा और भेद)` | `संज्ञा पदबंध` | `सर्वनाम पदबंध` | `विशेषण पदबंध` | `क्रिया पदबंध` | `क्रिया-विशेषण पदबंध` | `साखी — भावार्थ` | `साखी — काव्य-सौंदर्य` | `कबीर की भक्ति भावना` | `मीरा के पद — भावार्थ` | `मीरा के पद — काव्य-सौंदर्य` | `मीराबाई की भक्ति भावना` | `बड़े भाई साहब — विषयवस्तु और पात्र` | `बड़े भाई साहब — भाषा और शैली` | `डायरी का एक पन्ना — विषयवस्तु` | `डायरी का एक पन्ना — भाषा और शैली`

For **English & SST**, put the name of the exact concept from which the question is drawn — by yourself (no canonical list defined yet).
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
