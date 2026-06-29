import {
  collection, doc, addDoc, getDocs, deleteDoc,
  setDoc, query, orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// Firestore layout:
//   records/{tableId}          — table definition
//   record_entries/{tableId}_{rollNo} — per-student row values

const TABLES = 'records';
const ENTRIES = 'record_entries';

export async function createTable({ title, description, sensitive, columns }) {
  const ref = await addDoc(collection(db, TABLES), {
    title: title.trim(),
    description: description.trim(),
    sensitive: !!sensitive,
    columns, // [{ id, label, type: 'check'|'text'|'number' }]
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTables() {
  const snap = await getDocs(query(collection(db, TABLES), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteTable(tableId) {
  await deleteDoc(doc(db, TABLES, tableId));
}

export async function getEntries(tableId) {
  const q = query(collection(db, ENTRIES), where('tableId', '==', tableId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getMyEntries(rollNo) {
  const q = query(collection(db, ENTRIES), where('rollNo', '==', rollNo));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setCellValue(tableId, rollNo, colId, value) {
  const docId = `${tableId}_${rollNo}`;
  await setDoc(doc(db, ENTRIES, docId), {
    tableId,
    rollNo,
    values: { [colId]: value },
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
