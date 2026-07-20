export const ROLES = {
  ADMIN:   'ADMIN',
  MONITOR: 'MONITOR',
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
};

export const TEST_PHONE = '9999999999';

export const DEFAULT_MONITORS = [1, 9, 35, 37];
const ADMINS   = [23];

export function getUserRole(rollNo, monitors = DEFAULT_MONITORS) {
  const roll = parseInt(rollNo, 10);
  // Star Batch is now an internal-only feature gated by the isStarBatch flag
  // and the admin allow-list (see starBatchService.js), not a separate role.
  // Any leftover accounts from the old external-signup flow (rollNo 85 or
  // 100-199) simply fall through to STUDENT below — they keep working, just
  // without special treatment.
  if (!roll || roll <= 0) return ROLES.STUDENT;
  if (ADMINS.includes(roll))   return ROLES.ADMIN;
  if (monitors.includes(roll)) return ROLES.MONITOR;
  return ROLES.STUDENT;
}
