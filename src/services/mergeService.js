import { doc, getDoc, getDocs, collection, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

function mergeUserDocs(primary, secondary, dataChoice) {
  function union(field) {
    return Array.from(new Set([...(primary[field] || []), ...(secondary[field] || [])]));
  }

  return {
    name:       primary.name,
    phone:      primary.phone,
    rollNo:     primary.rollNo,
    createdAt:  Math.min(primary.createdAt || Date.now(), secondary.createdAt || Date.now()),
    passwordHash: null, // cleared — user must set a new password after merge

    attendance_absentDays:       union('attendance_absentDays'),
    completedHomework:           union('completedHomework'),
    checkedTopics:               union('checkedTopics'),
    completedHolidayHomework_v2: union('completedHolidayHomework_v2'),

    onboardingCompleted: !!(primary.onboardingCompleted || secondary.onboardingCompleted),
    whatsNewSeen_v1:     !!(primary.whatsNewSeen_v1     || secondary.whatsNewSeen_v1),
    broadcastKey:        primary.broadcastKey || secondary.broadcastKey || null,

    alternatePhone:  secondary.phone,
    mergedAt:        Date.now(),
    mergeBannerSeen: false,
  };
}

export async function fetchDuplicates(rollNo) {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(u => Number(u.rollNo) === Number(rollNo));
}

export async function mergeProfiles(primaryPhone, secondaryPhone) {
  const [primSnap, secSnap] = await Promise.all([
    getDoc(doc(db, 'users', primaryPhone)),
    getDoc(doc(db, 'users', secondaryPhone)),
  ]);
  if (!primSnap.exists() || !secSnap.exists()) throw new Error('One or both user documents not found.');

  const primary   = primSnap.data();
  const secondary = secSnap.data();
  const merged    = mergeUserDocs(primary, secondary);

  const [actPrimSnap, actSecSnap] = await Promise.all([
    getDoc(doc(db, 'activityLogs', primaryPhone)),
    getDoc(doc(db, 'activityLogs', secondaryPhone)),
  ]);
  const actPrim = actPrimSnap.exists() ? actPrimSnap.data() : { events: {}, lastSeen: 0 };
  const actSec  = actSecSnap.exists()  ? actSecSnap.data()  : { events: {}, lastSeen: 0 };
  const mergedEvents = { ...actSec.events };
  Object.entries(actPrim.events || {}).forEach(([k, v]) => {
    mergedEvents[k] = (mergedEvents[k] || 0) + v;
  });

  const batch = writeBatch(db);
  batch.set(doc(db, 'users', primaryPhone), merged);
  batch.set(doc(db, 'users', secondaryPhone), {
    ...secondary, mergedInto: primaryPhone, mergedAt: Date.now(),
  });
  batch.set(doc(db, 'activityLogs', primaryPhone), {
    lastSeen: Math.max(actPrim.lastSeen || 0, actSec.lastSeen || 0),
    events: mergedEvents,
  });
  await batch.commit();
  return merged;
}

export async function dismissMergeBanner(primaryPhone) {
  await updateDoc(doc(db, 'users', primaryPhone), { mergeBannerSeen: true });
}
