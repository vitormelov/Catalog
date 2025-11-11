// Firebase configuration
// IMPORTANTE: Substitua estas credenciais pelas suas do Firebase Console
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAedDmJBhvRneGkX3xZvxjdJlqPVOQ4zJA",
  authDomain: "catalog-50e77.firebaseapp.com",
  projectId: "catalog-50e77",
  storageBucket: "catalog-50e77.firebasestorage.app",
  messagingSenderId: "55845060019",
  appId: "1:55845060019:web:bf81b1d3d32e303dd6dfc6",
  measurementId: "G-83HEPQ3GL3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;

