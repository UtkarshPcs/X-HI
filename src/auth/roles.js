export const ROLES = {
  ADMIN: 'ADMIN',
  MONITOR: 'MONITOR',
  STUDENT: 'STUDENT',
  OUTSIDER: 'OUTSIDER',
};

const MONITORS = [1, 9, 35, 37];
const ADMINS = [23];

export function getUserRole(rollNo) {
  if (rollNo === null || rollNo === undefined) return ROLES.OUTSIDER;
  const roll = parseInt(rollNo, 10);
  if (roll === 0) return ROLES.OUTSIDER;
  if (ADMINS.includes(roll)) return ROLES.ADMIN;
  if (MONITORS.includes(roll)) return ROLES.MONITOR;
  return ROLES.STUDENT;
}
