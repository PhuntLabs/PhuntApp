import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: 'whisperchat-nji1a',
  appId: '1:573071858350:web:a5468e942427157ead2b3f',
  storageBucket: 'whisperchat-nji1a.firebasestorage.app',
  apiKey: 'AIzaSyB-gF2x3t0W65DaTcVXilGmEqA_Pkg_pyk',
  authDomain: 'whisperchat-nji1a.firebaseapp.com',
  messagingSenderId: '573071858350',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
