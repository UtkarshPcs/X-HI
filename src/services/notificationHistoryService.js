import { collection, getDocs, addDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase';

const NOTIFS = 'notifications';
const STUDENT_NOTIFS = 'student_notifications';

export async function getNotificationHistory(max = 50, rollNo = null) {
  const q = query(collection(db, NOTIFS), orderBy('sentAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  const classNotifs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (!rollNo) return classNotifs;

  const qStudent = query(collection(db, STUDENT_NOTIFS), where('rollNo', '==', rollNo));
  const snapStudent = await getDocs(qStudent);
  const studentNotifs = snapStudent.docs.map((d) => ({ id: d.id, ...d.data() }));

  const combined = [...classNotifs, ...studentNotifs].sort((a, b) => b.sentAt - a.sentAt);
  return combined.slice(0, max);
}

export async function addStudentNotification({ rollNo, title, body, type }) {
  await addDoc(collection(db, STUDENT_NOTIFS), {
    rollNo,
    title,
    body,
    type,
    sentAt: Date.now(),
  });
}
