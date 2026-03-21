import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCB-LSCpM4fUdJLuLisqUWZDw0ppsaKPBk",
  authDomain: "dbltecnologia-de408.firebaseapp.com",
  projectId: "dbltecnologia-de408",
  storageBucket: "dbltecnologia-de408.firebasestorage.app",
  messagingSenderId: "859655267579",
  appId: "1:859655267579:web:a2f4dcf7f19b42c5c7bc5e",
  measurementId: "G-7QF9LLVG8B"
};

// Initialize Firebase securely
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Points to the specific database instance 'agenticxcrm'
const db: Firestore = getFirestore(app, 'agenticx-ia-crm');
const auth: Auth = getAuth(app);

export { db, auth };
