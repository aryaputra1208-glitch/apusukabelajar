// Konfigurasi & helper Firebase yang dipakai bareng di semua halaman LMS.
// Import ini dari halaman lain: import { auth, db, loginWithGoogle, logout, ensureUserProfile } from './firebase-shared.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAhOrjsZJZLPmu-MhqQ8FaHp05E-eIJ8wU",
  authDomain: "lms-anteraja.firebaseapp.com",
  projectId: "lms-anteraja",
  storageBucket: "lms-anteraja.firebasestorage.app",
  messagingSenderId: "1012108901126",
  appId: "1:1012108901126:web:96c79d04340c11bede7c87",
  measurementId: "G-C1868ZCX9L"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const msProvider = new OAuthProvider('microsoft.com');
// Kalau nanti dapat Tenant ID Anteraja dari IT, aktifkan baris ini supaya
// cuma akun Microsoft dalam tenant Anteraja yang muncul di picker login:
// msProvider.setCustomParameters({ tenant: 'GANTI_DENGAN_TENANT_ID_ANTERAJA' });

export function loginWithGoogle() {
  return signInWithPopup(auth, provider);
}

export function loginWithMicrosoft() {
  return signInWithPopup(auth, msProvider);
}

export function logout() {
  return signOut(auth);
}

export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Dipanggil tiap kali user login. Kalau dokumen users/{uid} belum ada,
 * dibuatkan dengan role yang di-validasi oleh Firestore Rules (client TIDAK
 * bisa klaim role sembarangan — rules yang cek admins/trainers whitelist).
 * Return profil user (termasuk role) buat dipakai halaman.
 */
export async function ensureUserProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data();
  }

  // Cek status email dia sendiri di whitelist (rules cuma izinkan cek diri sendiri)
  const adminSnap = await getDoc(doc(db, 'admins', user.email));
  const trainerSnap = await getDoc(doc(db, 'trainers', user.email));
  const approvedSnap = await getDoc(doc(db, 'approved_users', user.email));
  const role = adminSnap.exists() ? 'admin' : (trainerSnap.exists() ? 'trainer' : 'trainee');
  const approved = approvedSnap.exists() ? approvedSnap.data() : {};

  const profile = {
    email: user.email,
    displayName: user.displayName || approved.nama || '',
    photoURL: user.photoURL || '',
    role,
    jabatan: '',
    level: approved.level || '',
    divisi: approved.divisi || '',
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, profile);
  return profile;
}
