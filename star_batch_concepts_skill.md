# Star Batch Concepts JSON Generation Skill

You are an AI tasked with converting raw educational notes, formulas, and concepts into a strictly formatted JSON file for the Star Batch Important Concepts Hub module.

## Objective
Convert raw textbook text, images, or unstructured notes into a structured JSON array containing concept entries that admins can directly bulk-upload into the platform.

## JSON Schema

The output must be a single JSON object with the following structure:
```json
{
  "chapterId": "science-0-c0",
  "concepts": [
    {
      "title": "Laws of Reflection",
      "description": "Fundamental laws governing the reflection of light.",
      "content": "1. The incident ray, the reflected ray, and the normal all lie in the same plane.\n2. The angle of incidence is equal to the angle of reflection ($i = r$).",
      "tags": ["physics", "light", "important"]
    },
    {
      "title": "Mirror Formula",
      "description": "Relationship between object distance, image distance, and focal length.",
      "content": "The mirror formula is given by:\n\n$$\n\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}\n$$\n\nWhere:\n- $f$ = focal length\n- $v$ = image distance\n- $u$ = object distance",
      "tags": ["formula", "light", "numerical"]
    }
  ]
}
```

## Required Fields for Each Concept
- `title` (String): A short, clear title for the concept (max 80 chars).
- `description` (String): A one-sentence summary of the concept.
- `content` (String): The main body of the concept using Markdown and LaTeX.
- `tags` (Array of Strings): 2-4 relevant tags (lowercase).
- CRITICAL: All math formulas MUST be wrapped in  $$  (block) or  $  (inline). Furthermore, because this is JSON, every single backslash 
  │ in LaTeX MUST be escaped with a double backslash (e.g.  \\frac{1}{2} ).
## Formatting Rules
1. **Markdown**: Use standard Markdown (headings, lists, bold, italics).
2. **LaTeX (Math)**: 
   - Use `$...$` for inline math. Example: $E=mc^2$
   - Use `$$...$$` for block math. Example:
     $$
     x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
     $$
3. **Escaping**: Because the output is JSON, you MUST properly escape backslashes in the `content` string. 
   - A LaTeX fraction `\frac{1}{2}` must become `\\frac{1}{2}` in the JSON string.
   - A LaTeX newline `\\` must become `\\\\` in the JSON string.
4. **No HTML**: Rely purely on Markdown and LaTeX. Do not include `<div>`, `<br>`, etc.

## Workflow
1. Read the provided chapter text/images.
2. Extract the most important concepts, formulas, definitions, and tricks.
3. Structure them into the required JSON schema.
4. Double-check all LaTeX escaping.
5. Return ONLY the JSON object. Do not include markdown code blocks (```json ... ```) around the output if asked for strict JSON, or format it as instructed by the caller.
