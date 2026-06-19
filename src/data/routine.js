import { fromDateKey } from './attendanceUtils';

/**
 * Weekly class routine — 6 periods per day, Monday–Saturday.
 * Index 0 = Sunday (no school). Indices 1–6 = Mon–Sat to match
 * JavaScript's Date.getDay() (0=Sun … 6=Sat).
 */
export const PERIOD_LABELS = ['1st', '2nd', '3rd', '4th', '5th', '6th'];

export const WEEKLY_ROUTINE = {
  1: ['Hindi', 'Physics', 'IT', 'Civics', 'Maths', 'English'],          // Monday
  2: ['Hindi', 'Physics', 'IT', 'Civics', 'Maths', 'English'],          // Tuesday
  3: ['Hindi', 'Physics', 'Sports', 'History', 'Maths', 'Economics'],   // Wednesday
  4: ['IT', 'Chemistry', 'Biology', 'History', 'Maths', 'Economics'],   // Thursday
  5: ['Hindi', 'Chemistry', 'Biology', 'Geography', 'Maths', 'English'],// Friday
  6: ['Hindi', 'Chemistry', 'Biology', 'Geography', 'Maths', 'English'],// Saturday
};

// Display version (short day labels) used by the Class Info table.
export const ROUTINE_TABLE = [
  { day: 'Mon', periods: WEEKLY_ROUTINE[1] },
  { day: 'Tue', periods: WEEKLY_ROUTINE[2] },
  { day: 'Wed', periods: WEEKLY_ROUTINE[3] },
  { day: 'Thu', periods: WEEKLY_ROUTINE[4] },
  { day: 'Fri', periods: WEEKLY_ROUTINE[5] },
  { day: 'Sat', periods: WEEKLY_ROUTINE[6] },
];

/**
 * Returns the period list for a given date key ("YYYY-MM-DD") as
 * [{ period: '1st', subject: 'Hindi' }, …]. Sundays (no routine) return [].
 */
export function getPeriodsForDate(dateKey) {
  const weekday = fromDateKey(dateKey).getDay();
  const subjects = WEEKLY_ROUTINE[weekday];
  if (!subjects) return [];
  return subjects.map((subject, i) => ({ period: PERIOD_LABELS[i], subject }));
}

/** Human weekday name for a date key. */
export function weekdayName(dateKey) {
  return fromDateKey(dateKey).toLocaleDateString('en-IN', { weekday: 'long' });
}
