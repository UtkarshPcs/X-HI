import { doc, setDoc, deleteDoc, getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const LAUNCHES_COL = 'featureLaunches';

export async function getFeatureLaunches() {
  const q = query(collection(db, LAUNCHES_COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createFeatureLaunch(config) {
  const id = Date.now().toString();
  const data = {
    imageUrl:     config.imageUrl || '',
    markdownText: config.markdownText || '',
    buttonText:   config.buttonText || 'Check it out!',
    redirectPage: config.redirectPage || '/',
    createdAt:    Date.now(),
  };
  await setDoc(doc(db, LAUNCHES_COL, id), data);
}

export async function deleteFeatureLaunch(id) {
  await deleteDoc(doc(db, LAUNCHES_COL, id));
}
