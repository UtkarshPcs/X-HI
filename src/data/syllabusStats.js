/**
 * Pure helpers for computing syllabus progress at every level
 * (global / section / subject / chapter).
 *
 * Two metrics per scope:
 *   • completed — topics the monitor/admin marked done (green bar)
 *   • checked   — topics the student verified in their own copy (yellow bar)
 *
 * IMPORTANT edge-case rule: a student's "checked" only counts when the topic
 * is ALSO currently "completed". This keeps the data honest if a monitor
 * later un-completes a topic — orphaned checks are silently ignored rather
 * than inflating the checked bar above the completed bar.
 */

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10; // one decimal
}

/**
 * Compute { total, completed, checked, completedPct, checkedPct } for a flat
 * list of topic objects ({ topicId, … }).
 *
 * @param {Array<{topicId:string}>} topics
 * @param {Set<string>} completedSet
 * @param {Set<string>} checkedSet
 */
export function statsForTopics(topics, completedSet, checkedSet) {
  const total = topics.length;
  let completed = 0;
  let checked = 0;
  for (const t of topics) {
    const isCompleted = completedSet.has(t.topicId);
    if (isCompleted) {
      completed++;
      // Only count checked when also completed (see rule above).
      if (checkedSet.has(t.topicId)) checked++;
    }
  }
  return {
    total,
    completed,
    checked,
    completedPct: pct(completed, total),
    checkedPct: pct(checked, total),
  };
}

/** Flattens a chapter's topics. */
export function chapterTopics(chapter) {
  return chapter.topics || [];
}

/** Flattens all topics within a subject. */
export function subjectTopics(subject) {
  return (subject.chapters || []).flatMap((c) => c.topics || []);
}

/** Flattens all topics within a section. */
export function sectionTopics(section) {
  return (section.subjects || []).flatMap((s) => subjectTopics(s));
}

/** Flattens every topic across the whole syllabus. */
export function allTopics(sections) {
  return (sections || []).flatMap((s) => sectionTopics(s));
}

/** Convenience: build the Sets once from arrays. */
export function toSets(completedList = [], checkedList = []) {
  return {
    completedSet: new Set(completedList),
    checkedSet: new Set(checkedList),
  };
}
