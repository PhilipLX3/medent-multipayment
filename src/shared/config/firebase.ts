import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

// Firebase設定（プロジェクト: medent-9167b）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAWLYlgCw_c5HHOAZ4BpHwqCP_7fQGIsdg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "medent-9167b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "medent-9167b",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "medent-9167b.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1086029753574",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1086029753574:web:4f9d9051cfd5bbda1c5f27",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-CKZ7XWVVQT"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Firebase Auth
export const auth = getAuth(app);

// Firebase Functions
export const functions = getFunctions(app, 'asia-northeast1'); // 東京リージョン

export default app;