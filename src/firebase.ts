import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyADeNZ-j6P43uNOpe2H7_2zEFUl3nBjaDQ",
  authDomain: "minor-project-64ad1.firebaseapp.com",
  projectId: "minor-project-64ad1",
  storageBucket: "minor-project-64ad1.firebasestorage.app",
  messagingSenderId: "499345594003",
  appId: "1:499345594003:web:07a3b44bea02e5c2be9f66",
  measurementId: "G-D2G5EYR4F1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
