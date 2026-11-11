// Konfigurasi & helper Firebase yang dipakai bareng di semua halaman LMS.
// Import ini dari halaman lain: import { auth, db, loginWithGoogle, logout, ensureUserProfile } from './firebase-shared.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit
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

/** Dipakai Forms offline — login diam-diam di background, trainee tidak lihat apapun. */
export function loginAnonymously() {
  return signInAnonymously(auth);
}

export function logout() {
  return signOut(auth);
}

/**
 * Dipakai halaman LMS (index, trainer-*, admin-*, trainee-*) — SENGAJA
 * mengabaikan sesi anonim (yang dipakai khusus Forms offline). Kalau
 * Firebase masih "inget" sesi anonim dari kunjungan ke training-forms.html
 * sebelumnya, halaman LMS akan menganggap itu "belum login", bukan crash
 * waktu coba cari profil buat akun tanpa email.
 */
export function onAuth(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user && user.isAnonymous) {
      signOut(auth).finally(() => callback(null));
      return;
    }
    if (user) user = await applyTestAs(user); // SEMENTARA: mode uji role (lihat dev-test-as.js)
    callback(user);
  });
}

/* ===== SEMENTARA — mode uji role untuk admin. Hapus blok ini + dev-test-as.js kalau sudah tidak dipakai. =====
   Admin bisa melihat LMS/TMS sebagai role lain (admin/trainer/trainee) dan/atau sebagai email karyawan lain
   (untuk TMS: atasan, mentor, karyawan). Hak akses Firestore tetap hak akses admin asli. */
const TEST_AS_KEY = 'lmsTestAs';
export function getTestAs() { try { return JSON.parse(localStorage.getItem(TEST_AS_KEY) || 'null'); } catch { return null; } }
export function setTestAs(v) { try { v ? localStorage.setItem(TEST_AS_KEY, JSON.stringify(v)) : localStorage.removeItem(TEST_AS_KEY); } catch {} }
async function applyTestAs(user) {
  let isRealAdmin = false;
  try { const s = await getDoc(doc(db, 'users', user.uid)); isRealAdmin = s.exists() && s.data().role === 'admin'; } catch {}
  if (!isRealAdmin) { if (getTestAs()) setTestAs(null); return user; }
  import('./dev-test-as.js?v=20261111e').then(m => m.mountTestAs({ realEmail: user.email })).catch(err => console.error('Mode uji gagal dimuat:', err));
  const t = getTestAs();
  if (!t || (!t.role && !t.email)) return user;
  return {
    uid: user.uid, displayName: user.displayName, photoURL: user.photoURL, isAnonymous: false,
    email: (t.email || user.email || '').toLowerCase(), realEmail: user.email, __testAs: t,
  };
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
  if (snap.exists() && user.__testAs) {
    const real = snap.data(), t = user.__testAs;
    let nama = '';
    if (t.email) { try { const q = await getDocs(query(collection(db, 'employees'), where('email', '==', t.email), limit(1))); q.forEach(d => nama = d.data().nama || ''); } catch {} }
    // role kosong + pilih karyawan = pakai role LMS orang itu (kalau belum pernah login: trainee)
    let role = t.role;
    if (!role && t.email) {
      role = 'trainee';
      try { const q = await getDocs(query(collection(db, 'users'), where('email', '==', t.email), limit(1))); q.forEach(d => role = d.data().role || 'trainee'); } catch {}
    }
    return { ...real, role: role || real.role, email: user.email, displayName: `${nama || (t.email ? t.email : real.displayName)} (test)` };
  }
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
