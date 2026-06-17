import { CALENDAR_EVENTS } from './calendarData';

// ── Configuration ──────────────────────────────────────────────
// The academic session begins on this date. Attendance is counted
// from here up to (and including) the current day.
export const SESSION_START = '2026-04-16';

// Event types that mean school is CLOSED → not counted for attendance.
const NON_WORKING_EVENT_TYPES = new Set(['SUNDAY', 'HOLIDAY_VACATION']);

// ── Date helpers (all local-time, IST-safe) ────────────────────
// We deliberately avoid toISOString() because it converts to UTC and
// shifts the date back by one day in IST (UTC+5:30).

/**
 * Format a date into a local "YYYY-MM-DD" key.
 * Accepts either a Date object: toDateKey(date)
 * or numeric parts (0-indexed month): toDateKey(year, month, day)
 */
export function toDateKey(yearOrDate, month, day) {
  let y, m, d;
  if (yearOrDate instanceof Date) {
    y = yearOrDate.getFullYear();
    m = yearOrDate.getMonth();
    d = yearOrDate.getDate();
  } else {
    y = yearOrDate;
    m = month;
    d = day;
  }
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Parse a "YYYY-MM-DD" key into a local Date at midnight. */
export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Today's date key (local). */
export function todayKey() {
  return toDateKey(new Date());
}

// ── Working-day logic ──────────────────────────────────────────

/**
 * Normalizes a closedDays argument (array or Set) into a Set for fast
 * lookups. Returns an empty Set if nothing is provided.
 */
function toClosedSet(closedDays) {
  if (!closedDays) return EMPTY_SET;
  return closedDays instanceof Set ? closedDays : new Set(closedDays);
}
const EMPTY_SET = new Set();

/**
 * A working day is any calendar date that is NOT a Sunday, NOT a
 * holiday/vacation, and NOT an admin-declared closed day. Exams,
 * periodic tests, and celebrations count as school-open days unless
 * the admin overrides them via `closedDays`.
 *
 * @param {string} dateKey - "YYYY-MM-DD"
 * @param {Set<string>|string[]} [closedDays] - admin-declared closures
 */
export function isWorkingDay(dateKey, closedDays) {
  const closed = toClosedSet(closedDays);
  if (closed.has(dateKey)) return false;
  const eventType = CALENDAR_EVENTS[dateKey];
  if (eventType && NON_WORKING_EVENT_TYPES.has(eventType)) return false;
  // Fallback: treat any actual Sunday as non-working.
  if (fromDateKey(dateKey).getDay() === 0) return false;
  return true;
}

/**
 * Returns a sorted array of working-day date keys in the inclusive
 * range [startKey, endKey], excluding admin-declared closed days.
 *
 * @param {string} startKey - "YYYY-MM-DD" (defaults to SESSION_START)
 * @param {string} endKey   - "YYYY-MM-DD" (defaults to today)
 * @param {Set<string>|string[]} [closedDays] - admin-declared closures
 */
export function getWorkingDays(startKey = SESSION_START, endKey = todayKey(), closedDays) {
  const closed = toClosedSet(closedDays);
  const start = fromDateKey(startKey);
  const end = fromDateKey(endKey);
  if (end < start) return [];

  const days = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = toDateKey(cursor);
    if (isWorkingDay(key, closed)) days.push(key);
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/**
 * Computes attendance stats given a list of absent date keys.
 * Only absences that fall on actual working days within the session
 * window are counted (defensive against stale/invalid keys).
 *
 * @param {string[]} absentKeys - array of "YYYY-MM-DD" the student was absent
 * @param {string} [endKey] - end of the counting window (defaults to today)
 * @param {Set<string>|string[]} [closedDays] - admin-declared closures
 * @returns {{ totalDays:number, presentDays:number, absentDays:number, percentage:number }}
 */
export function calcAttendance(absentKeys = [], endKey = todayKey(), closedDays) {
  const closed = toClosedSet(closedDays);
  const workingDays = getWorkingDays(SESSION_START, endKey, closed);
  const workingSet = new Set(workingDays);

  // Count only valid absences (must be a working day in range).
  const validAbsent = absentKeys.filter((k) => workingSet.has(k));
  const absentCount = new Set(validAbsent).size; // de-dupe

  const totalDays = workingDays.length;
  const presentDays = Math.max(0, totalDays - absentCount);
  const percentage = totalDays === 0 ? 100 : Math.round((presentDays / totalDays) * 1000) / 10; // 1 decimal

  return {
    totalDays,
    presentDays,
    absentDays: absentCount,
    percentage,
  };
}
