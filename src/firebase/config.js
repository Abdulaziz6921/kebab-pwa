import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <-- 1. GET_AUTH IMPORT QILINDI

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

let app = null;
let db = null;
let auth = null; // <-- 2. AUTH VAQTINCHALIK O'ZGARUVCHISI

export const initializeFirebase = () => {
  if (!app && firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app); // <-- 3. AUTH SHU YERDA ISHGA TUSHIRILADI
  }
  return { app, db, auth };
};

export const getFirebaseApp = () => app;

export const getFirestoreDB = () => {
  if (!db) initializeFirebase();
  return db;
};

// 4. AUTH INSTANCE-NI XAVFSIZ OLISH UCHUN YANGI FUNKSIYA
export const getFirebaseAuth = () => {
  if (!auth) initializeFirebase();
  return auth;
};

export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
  );
};

export const COLLECTIONS = {
  ORDERS: "orders",
  CUSTOMERS: "customers",
  MENU_ITEMS: "menuItems",
  RESTAURANTS: "restaurants",
  USERS: "users",
};

// Dastlabki yuklanishda avtomatik ishga tushirish (Auth ishlashi uchun)
initializeFirebase();

// 5. EXPORT QISMI
export { app, db, auth };
