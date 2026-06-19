// Build script: normalizes the raw syllabus JSON files in
// "Real DATA/Syllabus" into a single src/data/syllabusData.js module.
//
// Handles three quirks in the source data:
//   1. Some files concatenate multiple JSON root objects (e.g. Science.json
//      has Physics in one object and Chemistry+Biology in another).
//   2. Inconsistent nesting depth: Maths has chapters directly under the
//      section (no subject layer); English Literature has an extra grouping
//      level (Fiction/Poetry/Drama) above chapters.
//   3. Underscored keys ("Reading_Skills") that need humanising.
//
// Output model (uniform 4 levels): Section -> Subject -> Chapter -> Topic
// IDs are globally-unique and hierarchical, e.g. "science-0-c1-t3".
//
// Run with:  node scripts/buildSyllabus.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SYLLABUS_DIR = join(ROOT, 'Real DATA', 'Syllabus');

// File -> we don't trust folder names; we map by the JSON's own top-level key.
const FILES = [
  'Science/Science.json',
  'SST/Sst.json',
  'maths/maths.json',
  'English/Egnlish.json',
  'hindi/hindi.json',
  'IT/It.json',
];

// Map the raw top-level key in each JSON to our canonical section.
// Order here defines section display order on the dashboard/page.
const SECTION_MAP = [
  { rawKey: 'Science',     sectionId: 'science', sectionName: 'Science' },
  { rawKey: 'SST',         sectionId: 'sst',     sectionName: 'SST' },
  { rawKey: 'Mathematics', sectionId: 'maths',   sectionName: 'Maths' },
  { rawKey: 'English',     sectionId: 'english', sectionName: 'English' },
  { rawKey: 'IT_402',      sectionId: 'it',      sectionName: 'IT' },
  { rawKey: 'Hindi',       sectionId: 'hindi',   sectionName: 'Hindi' },
];

// ── Tolerant multi-object JSON parsing ─────────────────────────
// Splits a string containing one OR MORE top-level JSON objects into
// individual objects by tracking brace depth (string-aware).
function extractJsonObjects(text) {
  const objects = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (escaped) { escaped = false; }
      else if (ch === '\\') { escaped = true; }
      else if (ch === '"') { inStr = false; }
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        objects.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return objects.map((o) => JSON.parse(o));
}

// Deep-merge plain objects (arrays are replaced, not merged).
function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (
      v && typeof v === 'object' && !Array.isArray(v) &&
      target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])
    ) {
      deepMerge(target[k], v);
    } else {
      target[k] = v;
    }
  }
  return target;
}

function humanise(key) {
  // Underscores -> spaces; collapse repeated whitespace.
  return key.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

// Recursively collect chapters from a subject subtree. A node whose value
// is an array is a chapter {name, topics}. A node whose value is an object
// is a grouping (e.g. Fiction/Poetry/Drama) whose leaves are flattened into
// chapters under the same subject.
function collectChapters(obj) {
  const chapters = [];
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      chapters.push({ name: humanise(k), topics: v.map((t) => String(t)) });
    } else if (v && typeof v === 'object') {
      chapters.push(...collectChapters(v));
    }
  }
  return chapters;
}

// ── Build ──────────────────────────────────────────────────────
const merged = {};
for (const rel of FILES) {
  const full = join(SYLLABUS_DIR, rel);
  const text = readFileSync(full, 'utf8');
  const objects = extractJsonObjects(text);
  for (const obj of objects) deepMerge(merged, obj);
}

const sections = [];
for (const { rawKey, sectionId, sectionName } of SECTION_MAP) {
  const sectionObj = merged[rawKey];
  if (!sectionObj) {
    console.warn(`⚠️  Section key "${rawKey}" not found in source data.`);
    continue;
  }

  // Determine subjects. If the section's direct children are arrays, there is
  // no subject layer (Maths) — synthesise a single subject named after the
  // section. Otherwise each direct child object is a subject.
  const directChildrenAreArrays = Object.values(sectionObj).some((v) => Array.isArray(v));

  let subjectEntries; // [ [subjectName, chapters[]] ]
  if (directChildrenAreArrays) {
    subjectEntries = [[sectionName === 'Maths' ? 'Mathematics' : sectionName, collectChapters(sectionObj)]];
  } else {
    subjectEntries = Object.entries(sectionObj).map(([subjKey, subjVal]) => [
      humanise(subjKey),
      collectChapters(subjVal),
    ]);
  }

  const subjects = subjectEntries.map(([subjectName, chapters], si) => {
    const subjectId = `${sectionId}-${si}`;
    return {
      subjectId,
      subjectName,
      chapters: chapters.map((ch, ci) => {
        const chapterId = `${subjectId}-c${ci}`;
        return {
          chapterId,
          chapterName: ch.name,
          topics: ch.topics.map((topicName, ti) => ({
            topicId: `${chapterId}-t${ti}`,
            topicName,
          })),
        };
      }),
    };
  });

  sections.push({ sectionId, sectionName, subjects });
}

// ── Stats + write ──────────────────────────────────────────────
let topicCount = 0, chapterCount = 0, subjectCount = 0;
for (const s of sections) {
  for (const subj of s.subjects) {
    subjectCount++;
    for (const ch of subj.chapters) {
      chapterCount++;
      topicCount += ch.topics.length;
    }
  }
}

const header = `// AUTO-GENERATED by scripts/buildSyllabus.mjs — do not edit by hand.
// Source: Real DATA/Syllabus/*.json
// Model: Section -> Subject -> Chapter -> Topic, with globally-unique
// hierarchical IDs (e.g. "science-0-c1-t3"). Monitors may append new topics
// to chapters at runtime (stored in Firestore), so topic IDs are append-safe.
//
// Sections: ${sections.length} | Subjects: ${subjectCount} | Chapters: ${chapterCount} | Topics: ${topicCount}

export const syllabusData = ${JSON.stringify(sections, null, 2)};

// Total topic count in the seed (handy for percentage math / sanity checks).
export const SEED_TOTAL_TOPICS = ${topicCount};
`;

const outPath = join(ROOT, 'src', 'data', 'syllabusData.js');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, header, 'utf8');

console.log('✅ Wrote', outPath);
console.log(`   Sections: ${sections.length}, Subjects: ${subjectCount}, Chapters: ${chapterCount}, Topics: ${topicCount}`);
for (const s of sections) {
  const subj = s.subjects.map((x) => x.subjectName).join(', ');
  console.log(`   • ${s.sectionName}: ${subj}`);
}
