---
name: subjective-test-generator
description: Generate Subjective Test JSON files for the Star Batch system with proper schema and valid IDs.
---

# Subjective Test JSON Generator

This skill instructs you on how to generate Subjective Test JSON files for the Star Batch Test Module.

## JSON Schema Requirements

The subjective test JSON must follow this exact structure and typing:

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
      "diagram": {
        "template": "triangle",
        "points": ["A", "B", "C"],
        "equalSides": ["AB=AC"]
      },
      "marks": 3,
      "difficulty": "Medium",
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

### Explicit Field Specifications:
1. **`sectionId`** *(Exact String)*: Must strictly be one of the top-level section IDs listed below (e.g., `"science"`, `"sst"`). No arbitrary strings.
2. **`subjectId`** *(Exact String)*: Must strictly match the subject ID under the chosen section (e.g., `"science-0"`). No arbitrary strings.
3. **`chapterId`** *(Exact String)*: Must strictly match the chapter ID under the chosen subject (e.g., `"science-0-c1"`). No arbitrary strings.
4. **`title`** *(Free Text String)*: Format strictly as: `"[Subject Name] Ch [Chapter Number] - [Chapter Name]"` (e.g., `"Physics Ch 2 - Force and Laws of Motion"`). Do NOT use IDs like "science-0-c1" here.
5. **`type`** *(Exact String)*: Must ALWAYS be exactly `"subjective"`.
6. **`questions`** *(Array of Objects)*: Must contain a list of subjective questions.
7. **`questions[i].text`** *(Free Text String)*: The question itself. You can type any arbitrary string here. Use Markdown for formatting. **CRITICAL:** Do NOT hardcode question numbers (e.g., "1.", "Q1.") at the start of the text. The system auto-numbers questions during rendering.
8. **`questions[i].marks`** *(Integer)*: Must strictly be one of: `1, 2, 3, 4, 5`. Note: 5-mark questions are generally Case-Based or long descriptive questions.
9. **`questions[i].difficulty`** *(Exact String)*: Must strictly be one of: `"Easy"`, `"Medium"`, `"Hard"`, `"Super Difficult"`.
10. **`questions[i].topic`** *(Free Text String)*: The sub-topic of the chapter. You can type any arbitrary string here (e.g., `"Ohm's Law"`, `"Quadratic Formula"`).
11. **`questions[i].answerSteps`** *(Array of Objects)*: Provide a clear, step-by-step marking scheme. The sum of `marks` inside `answerSteps` MUST exactly equal the total `marks` of the question.
12. **`questions[i].answerSteps[j].stepText`** *(Free Text String)*: The exact step or logic required to earn the marks. You can type any arbitrary string here. Use Markdown.
13. **`questions[i].answerSteps[j].marks`** *(Integer or Float)*: The marks awarded for this specific step (e.g., `1`, `0.5`, `1.5`).
14. **`questions[i].diagram`** *(Object, Optional)*: Use this to generate procedural SVG diagrams. Do NOT invent templates. The following are the ONLY supported templates. Always use the specified IDs for highlighting or referencing in questions:

# Mathematics SVG Library Documentation

## ParallelLines
- **Highlight IDs**: `line-l`, `line-m`, `transversal-t`
- **Pointer References**: Pointer 1 (Intersection of l and t), Pointer 2 (Intersection of m and t)

## CoordinatePlane
- **Highlight IDs**: `x-axis`, `y-axis`, `origin`
- **Pointer References**: Pointer 1 (First quadrant region)

## NumberLine
- **Highlight IDs**: `line`, `tick--4` to `tick-4`
- **Pointer References**: Pointer 1 (Origin 0)

## LineSegment
- **Highlight IDs**: `segment-AB`, `point-A`, `point-B`
- **Pointer References**: Pointer 1 (Midpoint of AB)

## Angle
- **Highlight IDs**: `angle-AOB`, `ray-OA`, `ray-OB`, `point-O`
- **Pointer References**: Pointer 1 (Angle interior)

## Quadrilateral
- **Highlight IDs**: `quad-ABCD`, `side-AB`, `side-BC`, `side-CD`, `side-DA`, `point-A`, `point-B`, `point-C`, `point-D`
- **Pointer References**: Pointer 1 (Interior of quadrilateral)

## Polygon
- **Highlight IDs**: `polygon-ABCDE`, `point-A`, `point-B`, `point-C`, `point-D`, `point-E`
- **Pointer References**: Pointer 1 (Interior of polygon)

## Construction
- **Highlight IDs**: `line-segment`, `arc-top`, `arc-bottom`, `perpendicular-bisector`, `point-A`, `point-B`, `point-M`
- **Pointer References**: Pointer 1 (Perpendicular bisector above AB)


# Physics SVG Library Documentation

This document describes the 6 Physics SVG templates available in `src/svg-library/physics/`.

## 1. ConcaveMirrorRay
**Description**: Shows ray diagram for a concave mirror with object, image, focal point, and center of curvature.
- **Highlight IDs**: `principal-axis`, `mirror`, `incident-ray`, `reflected-ray`, `normal`, `object`, `image`, `pole`, `focus`, `center-of-curvature`
- **Pointer References**: 
  - 1: Object position
  - 2: Center of curvature
  - 3: Focus

## 2. ConvexMirrorRay
**Description**: Shows ray diagram for a convex mirror with virtual image formation.
- **Highlight IDs**: `principal-axis`, `mirror`, `incident-ray`, `reflected-ray`, `virtual-ray`, `normal`, `object`, `image`, `pole`, `focus`, `center-of-curvature`
- **Pointer References**: 
  - 1: Object position
  - 2: Pole
  - 3: Virtual Focus

## 3. ConcaveLensRay
**Description**: Shows ray diagram for a concave (diverging) lens with virtual image formation.
- **Highlight IDs**: `principal-axis`, `lens`, `optical-center`, `incident-ray`, `incident-ray-2`, `refracted-ray`, `virtual-ray`, `object`, `image`, `focus-1`, `focus-2`, `center-1`, `center-2`
- **Pointer References**: 
  - 1: Object position
  - 2: Optical Center
  - 3: Virtual Image

## 4. MirrorSignConvention
**Description**: Cartesian sign convention diagram for spherical mirrors.
- **Highlight IDs**: `x-axis`, `y-axis`, `mirror`, `incident-direction`, `negative-dist`, `positive-dist`, `positive-height`, `negative-height`, `pole`
- **Pointer References**: 
  - 1: Pole (Origin)
  - 2: Positive Height
  - 3: Positive Distance

## 5. LensSignConvention
**Description**: Cartesian sign convention diagram for spherical lenses.
- **Highlight IDs**: `x-axis`, `y-axis`, `lens`, `incident-direction`, `negative-dist`, `positive-dist`, `positive-height`, `negative-height`, `optical-center`
- **Pointer References**: 
  - 1: Optical Center (Origin)
  - 2: Positive Height
  - 3: Positive Distance

## 6. EyeDefect
**Description**: Shows a myopic eye defect where light focuses in front of the retina.
- **Highlight IDs**: `eye`, `cornea`, `eye-lens`, `retina`, `incident-ray`, `refracted-ray`, `defect-focus`
- **Pointer References**: 
  - 1: Focus Point
  - 2: Cornea
  - 3: Eye Lens


# Biology SVG Components Documentation

This document lists the available templates in `src/svg-library/biology/`.

## 1. HumanDigestiveSystem.jsx
- **Highlight IDs**: `esophagus`, `stomach`, `liver`, `large-intestine`, `small-intestine`
- **Pointer References**: 1 (Esophagus), 2 (Stomach), 3 (Liver)

## 2. HumanHeart.jsx
- **Highlight IDs**: `right-atrium`, `right-ventricle`, `left-atrium`, `left-ventricle`, `aorta`
- **Pointer References**: 1 (Right Atrium), 2 (Left Ventricle)

## 3. HumanRespiratorySystem.jsx
- **Highlight IDs**: `trachea`, `bronchi`, `left-lung`, `right-lung`, `diaphragm`
- **Pointer References**: 1 (Trachea), 2 (Right Lung), 3 (Diaphragm)

## 4. Nephron.jsx
- **Highlight IDs**: `glomerulus`, `bowmans-capsule`, `proximal-tubule`, `loop-of-henle`, `distal-tubule`, `collecting-duct`
- **Pointer References**: 1 (Glomerulus), 2 (Loop of Henle), 3 (Collecting Duct)

## 5. Stomata.jsx
- **Highlight IDs**: `guard-cells`, `stomatal-pore`, `epidermal-cells`
- **Pointer References**: 1 (Guard Cells), 2 (Stomatal Pore), 3 (Epidermal Cells)

## 6. HumanBrain.jsx
- **Highlight IDs**: `cerebrum`, `cerebellum`, `brain-stem`
- **Pointer References**: 1 (Cerebrum), 2 (Cerebellum), 3 (Brain Stem)

## 7. Neuron.jsx
- **Highlight IDs**: `dendrites`, `cell-body`, `nucleus`, `axon`, `myelin-sheath`, `axon-terminals`
- **Pointer References**: 1 (Dendrites), 2 (Nucleus), 3 (Axon Terminals)

## 8. ReflexArc.jsx
- **Highlight IDs**: `receptor`, `sensory-neuron`, `interneuron`, `spinal-cord`, `motor-neuron`, `effector-muscle`
- **Pointer References**: 1 (Receptor), 2 (Spinal Cord), 3 (Effector Muscle)


# Chemistry SVG Components Documentation

This document contains the exact documentation for the newly created Chemistry SVG components in \`src/svg-library/chemistry/\`.

## 1. ElectrolysisSetup
- **Component Path**: \`src/svg-library/chemistry/ElectrolysisSetup.jsx\`
- **Highlight IDs**:
  - \`anode\`: Highlights the anode electrode and its wire.
  - \`cathode\`: Highlights the cathode electrode and its wire.
  - \`electrolyte\`: Highlights the fluid inside the beaker.
  - \`battery\`: Highlights the battery symbol.
  - \`beaker\`: Highlights the beaker rim and body.
- **Pointer References**:
  1. Points to Anode
  2. Points to Cathode
  3. Points to Electrolyte
  4. Points to Battery

## 2. PhScale
- **Component Path**: \`src/svg-library/chemistry/PhScale.jsx\`
- **Highlight IDs**:
  - \`acidic\`: Highlights the acidic pH range (0-6).
  - \`neutral\`: Highlights the neutral point (7).
  - \`alkaline\`: Highlights the alkaline pH range (8-14).
- **Pointer References**:
  1. Points to Acidic region (around pH 2)
  2. Points to Neutral point (pH 7)
  3. Points to Alkaline region (around pH 12)

## 3. UniversalIndicator
- **Component Path**: \`src/svg-library/chemistry/UniversalIndicator.jsx\`
- **Highlight IDs**:
  - \`red\`: pH 0-3 (Strong Acid)
  - \`orange\`: pH 4-5 (Weak Acid)
  - \`yellow\`: pH 6 (Weak Acid)
  - \`green\`: pH 7 (Neutral)
  - \`blue\`: pH 8-10 (Weak Alkali)
  - \`violet\`: pH 11-14 (Strong Alkali)
- **Pointer References**:
  1. Points to the Universal Indicator bottle label color strips.
  2. Points to the Strong Acid label.
  3. Points to the Strong Alkali label.




### LaTeX & Double Escaping Rule:
**CRITICAL:** Because you are generating JSON, you MUST double-escape all backslashes in free text fields (`text`, `stepText`, etc). For example, to render `\sqrt{2}`, the JSON string must be `"$\\sqrt{2}$"`. If you only use one backslash (like `"$\sqrt{2}$"`), the JSON parser will fail or the LaTeX won't render correctly. This applies to all LaTeX commands (e.g. `\\frac{a}{b}`, `\\pi`, `\\angle`).

## CBSE Style & Case-Based Questions
**CRITICAL:** Ensure all questions feel like real, high-quality CBSE board questions. 
- A 4-mark or 5-mark question must have the depth, leverage, and multi-part complexity of a true CBSE long-answer or case-based question. 
- You MUST include at least one **Case-Based Question** (5 marks). Frame it with a paragraph/scenario followed by sub-questions (e.g. (a), (b), (c)) inside the `text` field.
- The marking scheme (`answerSteps`) must be granular (e.g., 0.5 or 1 mark for formula, 1 mark for substitution, 1 mark for final answer with units), exactly as CBSE evaluates.

## Question Qualification Criteria
You must strictly evaluate and qualify a question's difficulty based on these exact parameters:
- **Easy**: Direct recall, definitions, straightforward formula applications, or identifying basic facts.
- **Medium**: Requires understanding and applying concepts, 2-step calculations, or explaining "why/how" for standard phenomena.
- **Hard**: Application in novel situations, multi-concept synthesis, complex numericals, or analytical reasoning. 
- **Super Difficult**: Requires deep conceptual mastery, deriving complex relationships, solving non-standard edge cases, or high-level critical thinking (HOTS).

## Allowed Difficulties

You must use one of the following exact string values for `difficulty`:
- `"Easy"`
- `"Medium"`
- `"Hard"`
- `"Super Difficult"`

## Valid IDs

When constructing the JSON, you MUST use the exact IDs for the `sectionId`, `subjectId`, and `chapterId` from the following list:


### Section: Science (ID: `science`)
- **Subject:** Physics (ID: `science-0`)
  - Chapter: Light - Reflection and Refraction (ID: `science-0-c0`)
  - Chapter: Human Eye and Colourful World (ID: `science-0-c1`)
  - Chapter: Electricity (ID: `science-0-c2`)
  - Chapter: Magnetic Effects of Electric Current (ID: `science-0-c3`)
- **Subject:** Chemistry (ID: `science-1`)
  - Chapter: Chemical Reactions and Equations (ID: `science-1-c0`)
  - Chapter: Acids, Bases and Salts (ID: `science-1-c1`)
  - Chapter: Metals and Non-Metals (ID: `science-1-c2`)
  - Chapter: Carbon and Its Compounds (ID: `science-1-c3`)
  - Chapter: Periodic Classification of Elements (ID: `science-1-c4`)
- **Subject:** Biology (ID: `science-2`)
  - Chapter: Life Processes (ID: `science-2-c0`)
  - Chapter: Control and Coordination (ID: `science-2-c1`)
  - Chapter: How Do Organisms Reproduce? (ID: `science-2-c2`)
  - Chapter: Heredity and Evolution (ID: `science-2-c3`)
  - Chapter: Our Environment (ID: `science-2-c4`)
  - Chapter: Sustainable Management of Natural Resources (ID: `science-2-c5`)

### Section: SST (ID: `sst`)
- **Subject:** History (ID: `sst-0`)
  - Chapter: The Rise of Nationalism in Europe (ID: `sst-0-c0`)
  - Chapter: Nationalism in India (ID: `sst-0-c1`)
  - Chapter: The Making of a Global World (ID: `sst-0-c2`)
  - Chapter: The Age of Industrialisation (ID: `sst-0-c3`)
  - Chapter: Print Culture and the Modern World (ID: `sst-0-c4`)
- **Subject:** Geography (ID: `sst-1`)
  - Chapter: Resources and Development (ID: `sst-1-c0`)
  - Chapter: Forest and Wildlife Resources (ID: `sst-1-c1`)
  - Chapter: Water Resources (ID: `sst-1-c2`)
  - Chapter: Agriculture (ID: `sst-1-c3`)
  - Chapter: Minerals and Energy Resources (ID: `sst-1-c4`)
  - Chapter: Manufacturing Industries (ID: `sst-1-c5`)
  - Chapter: Lifelines of National Economy (ID: `sst-1-c6`)
- **Subject:** Political Science (Civics) (ID: `sst-2`)
  - Chapter: Power Sharing (ID: `sst-2-c0`)
  - Chapter: Federalism (ID: `sst-2-c1`)
  - Chapter: Gender Religion and Caste (ID: `sst-2-c2`)
  - Chapter: Political Parties (ID: `sst-2-c3`)
  - Chapter: Outcomes of Democracy (ID: `sst-2-c4`)
- **Subject:** Economics (ID: `sst-3`)
  - Chapter: Development (ID: `sst-3-c0`)
  - Chapter: Sectors of the Indian Economy (ID: `sst-3-c1`)
  - Chapter: Money and Credit (ID: `sst-3-c2`)
  - Chapter: Globalisation and the Indian Economy (ID: `sst-3-c3`)
  - Chapter: Consumer Rights (ID: `sst-3-c4`)

### Section: Maths (ID: `maths`)
- **Subject:** Mathematics (ID: `maths-0`)
  - Chapter: Real Numbers (ID: `maths-0-c0`)
  - Chapter: Polynomials (ID: `maths-0-c1`)
  - Chapter: Pair of Linear Equations in Two Variables (ID: `maths-0-c2`)
  - Chapter: Quadratic Equations (ID: `maths-0-c3`)
  - Chapter: Arithmetic Progressions (ID: `maths-0-c4`)
  - Chapter: Triangles (ID: `maths-0-c5`)
  - Chapter: Coordinate Geometry (ID: `maths-0-c6`)
  - Chapter: Introduction to Trigonometry (ID: `maths-0-c7`)
  - Chapter: Applications of Trigonometry (ID: `maths-0-c8`)
  - Chapter: Circles (ID: `maths-0-c9`)
  - Chapter: Areas Related to Circles (ID: `maths-0-c10`)
  - Chapter: Surface Areas and Volumes (ID: `maths-0-c11`)
  - Chapter: Statistics (ID: `maths-0-c12`)
  - Chapter: Probability (ID: `maths-0-c13`)

### Section: English (ID: `english`)
- **Subject:** Reading Skills (ID: `english-0`)
  - Chapter: Unseen Passage (ID: `english-0-c0`)
- **Subject:** Writing Skills (ID: `english-1`)
  - Chapter: Article Writing (ID: `english-1-c0`)
  - Chapter: Speech Writing (ID: `english-1-c1`)
  - Chapter: Debate Writing (ID: `english-1-c2`)
  - Chapter: Letter Writing (ID: `english-1-c3`)
  - Chapter: Story Writing (ID: `english-1-c4`)
- **Subject:** Grammar (ID: `english-2`)
  - Chapter: Tenses (ID: `english-2-c0`)
  - Chapter: Modals (ID: `english-2-c1`)
  - Chapter: Subject Verb Agreement (ID: `english-2-c2`)
  - Chapter: Determiners (ID: `english-2-c3`)
  - Chapter: Reported Speech (ID: `english-2-c4`)
  - Chapter: Active and Passive Voice (ID: `english-2-c5`)
  - Chapter: Editing and Omission (ID: `english-2-c6`)
- **Subject:** Literature (ID: `english-3`)
  - Chapter: Two Gentlemen of Verona (ID: `english-3-c0`)
  - Chapter: Mrs Packletides Tiger (ID: `english-3-c1`)
  - Chapter: The Letter (ID: `english-3-c2`)
  - Chapter: A Shady Plot (ID: `english-3-c3`)
  - Chapter: Patol Babu Film Star (ID: `english-3-c4`)
  - Chapter: Virtually True (ID: `english-3-c5`)
  - Chapter: The Frog and the Nightingale (ID: `english-3-c6`)
  - Chapter: Mirror (ID: `english-3-c7`)
  - Chapter: Not Marble Nor the Gilded Monuments (ID: `english-3-c8`)
  - Chapter: Ozymandias (ID: `english-3-c9`)
  - Chapter: The Rime of the Ancient Mariner (ID: `english-3-c10`)
  - Chapter: Snake (ID: `english-3-c11`)
  - Chapter: The Dear Departed (ID: `english-3-c12`)
  - Chapter: Julius Caesar (ID: `english-3-c13`)

### Section: IT (ID: `it`)
- **Subject:** Employability Skills (ID: `it-0`)
  - Chapter: Communication Skills (ID: `it-0-c0`)
  - Chapter: Self Management Skills (ID: `it-0-c1`)
  - Chapter: ICT Skills (ID: `it-0-c2`)
  - Chapter: Entrepreneurial Skills (ID: `it-0-c3`)
  - Chapter: Green Skills (ID: `it-0-c4`)
- **Subject:** Vocational Skills (ID: `it-1`)
  - Chapter: Digital Documentation Advanced (ID: `it-1-c0`)
  - Chapter: Electronic Spreadsheet Advanced (ID: `it-1-c1`)
  - Chapter: Database Management System (ID: `it-1-c2`)
  - Chapter: Web Applications and Security (ID: `it-1-c3`)

### Section: Hindi (ID: `hindi`)
- **Subject:** Sparsh (ID: `hindi-0`)
  - Chapter: बड़े भाई साहब (ID: `hindi-0-c0`)
  - Chapter: डायरी का एक पन्ना (ID: `hindi-0-c1`)
  - Chapter: तताँरा-वामीरो कथा (ID: `hindi-0-c2`)
  - Chapter: तीसरी कसम के शिल्पकार शैलेन्द्र (ID: `hindi-0-c3`)
  - Chapter: अब कहाँ दूसरे के दुख से दुखी होने वाले (ID: `hindi-0-c4`)
  - Chapter: पतझर में टूटी पत्तियाँ (ID: `hindi-0-c5`)
  - Chapter: कारतूस (ID: `hindi-0-c6`)
- **Subject:** Sparsh Poetry (ID: `hindi-1`)
  - Chapter: साखी (ID: `hindi-1-c0`)
  - Chapter: पद (ID: `hindi-1-c1`)
  - Chapter: मनुष्यता (ID: `hindi-1-c2`)
  - Chapter: पर्वत प्रदेश में पावस (ID: `hindi-1-c3`)
  - Chapter: तोप (ID: `hindi-1-c4`)
  - Chapter: कर चले हम फ़िदा (ID: `hindi-1-c5`)
  - Chapter: आत्मत्राण (ID: `hindi-1-c6`)
- **Subject:** Sanchayan (ID: `hindi-2`)
  - Chapter: हरिहर काका (ID: `hindi-2-c0`)
  - Chapter: सपनों के से दिन (ID: `hindi-2-c1`)
  - Chapter: टोपी शुक्ला (ID: `hindi-2-c2`)
- **Subject:** Grammar (ID: `hindi-3`)
  - Chapter: पद परिचय (ID: `hindi-3-c0`)
  - Chapter: रचना के आधार पर वाक्य भेद (ID: `hindi-3-c1`)
  - Chapter: वाच्य (ID: `hindi-3-c2`)
  - Chapter: अलंकार (ID: `hindi-3-c3`)
  - Chapter: समास (ID: `hindi-3-c4`)
  - Chapter: मुहावरे (ID: `hindi-3-c5`)
  - Chapter: अपठित गद्यांश (ID: `hindi-3-c6`)
  - Chapter: अपठित पद्यांश (ID: `hindi-3-c7`)
  - Chapter: पत्र लेखन (ID: `hindi-3-c8`)
  - Chapter: अनुच्छेद लेखन (ID: `hindi-3-c9`)
  - Chapter: सूचना लेखन (ID: `hindi-3-c10`)
  - Chapter: लघुकथा लेखन (ID: `hindi-3-c11`)
  - Chapter: विज्ञापन लेखन (ID: `hindi-3-c12`)
  - Chapter: ई-मेल लेखन (ID: `hindi-3-c13`)

