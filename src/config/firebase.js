// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD5-4Wb2S_y5H99oL9CdTkoq4WlHuj3qrA",
  authDomain: "tour-project-4e881.firebaseapp.com",
  projectId: "tour-project-4e881",
  storageBucket: "tour-project-4e881.firebasestorage.app",
  messagingSenderId: "907583131726",
  appId: "1:907583131726:web:5629abf67c39b6ad66731f",
  measurementId: "G-8E2SMZG0EB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app);
export const storage = getStorage(app);