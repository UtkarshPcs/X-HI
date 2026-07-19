/**
 * /src/data/periodicTopicTaxonomy.js
 * ─────────────────────────────────────
 * Canonical topic taxonomy for the Periodic Predicted Topic Mastery Report Card.
 *
 * PURPOSE:
 *  1. Constrains the `concept` field in generated questions to consistent names.
 *  2. Used by resolveToCanonical() to normalise raw concept strings from older questions.
 *
 * HOW TO ADD NEW SUBJECTS / UPDATE TOPICS:
 *  - Add or edit the arrays below.
 *  - Also update periodic_predicted_skill.md so new question sets use the canonical names.
 */

export const PERIODIC_TOPIC_TAXONOMY = {

  // ─── MATHS ──────────────────────────────────────────────────────────────────
  Maths: [
    // Chapter 1: Real Numbers — Fundamental Theorem of Arithmetic
    'Prime Factorisation',
    'HCF and LCM (Prime Factorisation Method)',
    'HCF × LCM Relationship Formula',
    'Numbers Ending with Digit 0 (Analysis)',
    'Composite Number Verification',
    'HCF/LCM Applied Word Problems',
    // Chapter 1: Real Numbers — Irrational Numbers
    'Prime Divisibility Theorem',
    'Irrationality Proofs (√2, √3, √5)',
    'Rational + Irrational Combinations',
    // Chapter 2: Polynomials
    'Degrees and Classification of Polynomials',
    'Zeroes of a Polynomial',
    'Geometric Representation of Polynomials',
    'Sum and Product of Zeroes',
    'Forming Quadratic Polynomial from Zeroes',
  ],

  // ─── SCIENCE ────────────────────────────────────────────────────────────────
  Science: [
    // Chemistry: Chemical Reactions and Equations
    'Chemical Reactions and Equations',
    'Balancing Chemical Equations',
    'Combination Reactions',
    'Decomposition Reactions',
    'Displacement Reactions',
    'Double Displacement Reactions',
    'Oxidation and Reduction',
    'Oxidising and Reducing Agents',
    'Corrosion',
    'Rancidity',
    // Biology: Life Processes
    'Life Processes and Nutrition',
    'Human Digestive System',
    'Respiration (Aerobic and Anaerobic)',
    'Human Respiratory System',
    'Transportation and Circulatory System',
    'Human Heart and Double Circulation',
    'Blood Components and Blood Vessels',
    'Lymph',
    'Transport in Plants (Xylem and Phloem)',
    'Transpiration',
    'Excretion and Excretory System',
    'Nephron and Urine Formation',
    'Dialysis (Artificial Kidney)',
    // Physics: Light — Reflection and Refraction
    'Laws of Reflection',
    'Spherical Mirrors and Image Formation',
    'Mirror Formula and Magnification',
    'Sign Convention and Ray Diagrams',
    'Refraction of Light',
    'Refractive Index and Snell\'s Law',
    'Lenses (Convex and Concave)',
    'Lens Formula and Magnification',
    'Power of a Lens',
    'Numerical Problems on Light',
  ],

  // ─── IT ─────────────────────────────────────────────────────────────────────
  IT: [
    // Part A: Communication Skills
    'Methods and Types of Communication',
    'Communication Process and Body Language',
    'Feedback in Communication',
    'Principles of Effective Communication',
    'Barriers in Communication',
    'Parts of Speech and Capitalisation',
    'Punctuation',
    'Sentence Construction and Types',
    'Parts of a Sentence',
    'Active and Passive Voice',
    'Paragraph Writing',
    // Part B: Digital Documentation (Advanced)
    'Styles in a Document',
    'Inserting and Managing Images',
    'Document Templates',
    'Table of Contents (ToC)',
    'Track Changes and Document Review',
  ],

  // ─── TO BE ADDED ────────────────────────────────────────────────────────────
  // Report card still works without these — raw concept field values are shown as-is.
  SST: [],
  English: [],
  Hindi: [],
};

const ALIASES = {
  Maths: {
    'Number System': 'Real Numbers (General)',
    'Algebra': 'Polynomials (General)',
  }
};

/**
 * Resolves a raw `concept` string from a question to the canonical taxonomy name.
 *
 * Resolution order:
 *  1. Alias match (for mapping older broad topics to nicer names)
 *  2. Exact match  → return canonical name
 *  3. Case-insensitive match → return canonical name (preserves casing)
 *  4. No match → return the raw string as-is (graceful fallback for unknown concepts)
 *
 * @param {string} subject    - e.g. 'Maths', 'Science'
 * @param {string} rawConcept - the concept value from the question document
 * @returns {string}
 */
export function resolveToCanonical(subject, rawConcept) {
  if (!rawConcept) return 'General';
  
  // 1. Check for known legacy aliases
  if (ALIASES[subject]) {
    // Check case-insensitive alias match
    const lowerRaw = rawConcept.toLowerCase();
    const aliasKey = Object.keys(ALIASES[subject]).find(k => k.toLowerCase() === lowerRaw);
    if (aliasKey) {
      return ALIASES[subject][aliasKey];
    }
  }

  const list = PERIODIC_TOPIC_TAXONOMY[subject] || [];
  if (list.length === 0) return rawConcept; // no taxonomy for this subject yet

  // 2. Exact match
  if (list.includes(rawConcept)) return rawConcept;

  // 3. Case-insensitive match
  const lower = rawConcept.toLowerCase();
  const ciMatch = list.find(t => t.toLowerCase() === lower);
  if (ciMatch) return ciMatch;

  // 4. Fallback — show the raw concept (still useful information for the student)
  return rawConcept;
}
