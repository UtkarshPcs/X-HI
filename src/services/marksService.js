import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ── Complaints ─────────────────────────────────────────────────
// Schema: marksComplaints/{id} → { phone, rollNo, name, test, claimedMarks, currentMarks, reason, status, createdAt }
// status: 'pending' | 'approved' | 'rejected'

export async function fileComplaint({ phone, rollNo, name, test, claimedMarks, currentMarks, reason }) {
  return addDoc(collection(db, 'marksComplaints'), {
    phone, rollNo, name, test, claimedMarks, currentMarks,
    reason: reason || '',
    status: 'pending',
    createdAt: Date.now(),
  });
}

export async function getComplaints() {
  const snap = await getDocs(query(collection(db, 'marksComplaints'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateComplaintStatus(id, status) {
  await updateDoc(doc(db, 'marksComplaints', id), { status, resolvedAt: Date.now() });
}

export async function deleteComplaint(id) {
  await deleteDoc(doc(db, 'marksComplaints', id));
}

// ── Mark Overrides ─────────────────────────────────────────────
// When admin approves a complaint, override is written here.
// Schema: marksOverrides/{rollNo} → { test1?: number, test2?: number }

export async function applyOverride(rollNo, test, marks) {
  const ref = doc(db, 'marksOverrides', String(rollNo));
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : {};
  await setDoc(ref, { ...existing, [test]: marks });
}

export async function getOverrides() {
  const snap = await getDocs(collection(db, 'marksOverrides'));
  const result = {};
  snap.docs.forEach(d => { result[Number(d.id)] = d.data(); });
  return result;
}

export async function getMyComplaint(phone) {
  const snap = await getDocs(query(collection(db, 'marksComplaints'), where('phone', '==', phone)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
