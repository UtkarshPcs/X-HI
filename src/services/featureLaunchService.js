import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const CONFIG_DOC = 'appConfig/featureLaunch';

export async function getFeatureLaunchConfig() {
  const snap = await getDoc(doc(db, CONFIG_DOC));
  return snap.exists() ? snap.data() : null;
}

export async function saveFeatureLaunchConfig(config, resetVisibility = false) {
  const data = {
    enabled:      !!config.enabled,
    imageUrl:     config.imageUrl || '',
    markdownText: config.markdownText || '',
    buttonText:   config.buttonText || 'Check it out!',
    redirectPage: config.redirectPage || '/',
    updatedAt:    resetVisibility ? Date.now() : (config.updatedAt || Date.now()),
  };
  await setDoc(doc(db, CONFIG_DOC), data);
}
