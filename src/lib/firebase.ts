import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: 'whisperchat-nji1a',
  appId: '1:573071858350:web:a5468e942427157ead2b3f',
  storageBucket: 'whisperchat-nji1a.appspot.com',
  apiKey: 'AIzaSyB-gF2x3t0W65DaTcVXilGmEqA_Pkg_pyk',
  authDomain: 'whisperchat-nji1a.firebaseapp.com',
  messagingSenderId: '573071858350',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
