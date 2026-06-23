export const ROLES = {
  ADMIN:   'ADMIN',
  MONITOR: 'MONITOR',
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
};

const MONITORS = [1, 9, 35, 37];
const ADMINS   = [23];

export function getUserRole(rollNo) {
  const roll = parseInt(rollNo, 10);
  if (!roll || roll <= 0) return ROLES.STUDENT;
  if (ADMINS.includes(roll))   return ROLES.ADMIN;
  if (MONITORS.includes(roll)) return ROLES.MONITOR;
  return ROLES.STUDENT;
}
