// src/firebase.js

// 1. ADD THIS LINE: Import the 'getAuth' function
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB79Ulw8ssi5I8rzpcueoX3pcDOex2OtaY",
  authDomain: "kazilinks-95d1d.firebaseapp.com",
  projectId: "kazilinks-95d1d",
  storageBucket: "kazilinks-95d1d.firebasestorage.app",
  messagingSenderId: "448542748498",
  appId: "1:448542748498:web:bbaa6b46c32a86ad37d48b",
  measurementId: "G-50650X2SB9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2. ADD THIS LINE: Initialize Auth and export it
export const auth = getAuth(app);

// Export the app (optional, but good practice)
export default app;
