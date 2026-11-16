// Sidebar navigasi LMS untuk SEMUA role (admin, trainer, trainee) — menunya menyesuaikan role.
// Dipasang dengan: <script type="module" src="./admin-shell.js?v=..."></script> sebelum </body>.
// Sama seperti sidebar TMS: isi menu disimpan di sessionStorage (lmsNavCache) dan dipasang lebih dulu oleh
// skrip inline di awal <body> (lihat lms-shell-early), jadi pindah halaman tidak berkedip.
// Admin harus lolos DUA cek: profil users/{uid}.role === 'admin' DAN email ada di whitelist admins.

import { db, onAuth } from './firebase-shared.js';
import { iconSvg } from './lms-icons.js';
import { doc, getDoc, collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const CACHE_KEY = 'lmsNavCache';

const CSS = `
  body.has-admin-sidebar { padding-left: 232px; }
  .admin-sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: 232px; background: var(--surface); border-right: 1px solid var(--border); padding: 18px 12px; overflow-y: auto; z-index: 40; box-sizing: border-box; }
  .admin-sidebar .as-logo { font-family: var(--font-display); font-weight: 700; font-size: 18px; color: var(--pink); padding: 0 10px 6px; display: block; text-decoration: none; }
  .admin-sidebar .as-role { font-size: 11px; color: var(--text-3); padding: 0 10px 8px; }
  .admin-sidebar .as-group { font-size: 11px; font-weight: 700; color: var(--text-3); margin: 16px 10px 6px; }
  .admin-sidebar a.as-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--r-control); color: var(--text-2); font-size: 13px; font-weight: 500; text-decoration: none; margin-bottom: 2px; }
  .admin-sidebar a.as-item:hover { background: var(--surface-2); }
  .admin-sidebar a.as-item.active { background: var(--pink-bg); color: var(--pink-dark); font-weight: 700; }
  .admin-sidebar .as-badge { margin-left: auto; background: var(--red-bg); color: var(--red); font-size: 11px; font-weight: 700; border-radius: var(--r-pill); padding: 1px 7px; }
  body.has-admin-sidebar .topbar .sidebar-logo, body.has-admin-sidebar .topbar a[href="index.html"] { display: none !important; }
  body.has-admin-sidebar .topbar > :last-child { margin-left: auto; }
  @media (max-width: 900px) { body.has-admin-sidebar .topbar .sidebar-logo, body.has-admin-sidebar .topbar a[href="index.html"] { display: flex !important; } body.has-admin-sidebar { padding-left: 0; } .admin-sidebar { display: none; } }
`;

const here = () => location.pathname.split('/').pop() || 'index.html';

function navFor(role, { nApproval = 0, nSubmissions = 0, tms = null } = {}) {
  if (role === 'admin') return [
    { group: 'General', items: [{ href: 'index.html', icon: 'home', label: 'Home' }] },
    { group: 'Content', items: [
      { href: 'admin-approval.html', icon: 'check', label: 'Module Approval', badge: nApproval },
      { href: 'admin-trainings.html', icon: 'layout-grid', label: 'All Trainings' },
      { href: 'trainer-create-module.html', icon: 'plus', label: 'Create Module' },
      { href: 'trainee-library.html', icon: 'books', label: 'Module Library' },
    ] },
    { group: 'People', items: [
      { href: 'admin-users.html', icon: 'users', label: 'Manage Users' },
      { href: 'admin-trainer.html', icon: 'user-check', label: 'Manage Trainers' },
      { href: 'trainer-submissions.html', icon: 'file-text', label: 'Grade Submissions', badge: nSubmissions },
    ] },
    { group: 'Reports', items: [
      { href: 'trainer-analytics.html', icon: 'chart-bar', label: 'Module Analytics' },
      { href: 'training-dashboard-v2.html', icon: 'chart-bar', label: 'Training Dashboard' },
    ] },
    { group: 'Other Apps', items: [{ href: 'tms/index.html', icon: 'arrow-right', label: 'TMS' }] },
  ];
  if (role === 'trainer') return [
    { group: 'General', items: [{ href: 'index.html', icon: 'home', label: 'Home' }] },
    { group: 'Content', items: [
      { href: 'trainer-create-module.html', icon: 'plus', label: 'Create Module' },
      { href: 'trainee-library.html', icon: 'books', label: 'Module Library' },
    ] },
    { group: 'Review', items: [
      { href: 'trainer-submissions.html', icon: 'file-text', label: 'Grade Submissions', badge: nSubmissions },
      { href: 'trainer-analytics.html', icon: 'chart-bar', label: 'Module Analytics' },
    ] },
    { group: 'Other Apps', items: tms ? [{ href: tms.href, icon: 'arrow-right', label: tms.label }] : [] },
  ];
  // trainee: halaman trainee berbahasa Indonesia
  return [
    { group: 'Umum', items: [
      { href: 'index.html', icon: 'home', label: 'Beranda' },
      { href: 'trainee-library.html', icon: 'books', label: 'Library Modul' },
    ] },
    { group: 'Aplikasi Lain', items: tms ? [{ href: tms.href, icon: 'arrow-right', label: tms.label }] : [] },
  ];
}

function render(nav, roleLabel) {
  const inner = `<a class="as-logo" href="index.html">anteraja LMS</a><div class="as-role">${roleLabel}</div>` +
    nav.filter(g => g.items.length).map(g => `<div class="as-group">${g.group}</div>` + g.items.map(it =>
      `<a class="as-item" href="${it.href}">${iconSvg(it.icon, { size: 16 })}<span>${it.label}</span>${it.badge ? `<span class="as-badge">${it.badge}</span>` : ''}</a>`
    ).join('')).join('');
  const sig = String(inner.length) + ':' + inner.slice(-200);
  const html = `<nav class="admin-sidebar" aria-label="LMS menu">${inner}</nav>`;
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ html, css: CSS, sig })); } catch {}
  if (!document.getElementById('lms-shell-css')) { const st = document.createElement('style'); st.id = 'lms-shell-css'; st.textContent = CSS; document.head.appendChild(st); }
  let aside = document.querySelector('.admin-sidebar');
  if (!aside) { aside = document.createElement('nav'); aside.className = 'admin-sidebar'; aside.setAttribute('aria-label', 'LMS menu'); document.body.prepend(aside); }
  // sidebar dari cache dipertahankan; isinya hanya diganti kalau menu berubah (tanpa kedip, lensa animasi tetap)
  if (aside.dataset.sig !== sig) {
    const lens = aside.querySelector(':scope > .lens');
    aside.innerHTML = inner; aside.dataset.sig = sig;
    if (lens) aside.prepend(lens);
  }
  const cur = here();
  aside.querySelectorAll('a.as-item').forEach(a => a.classList.toggle('active', a.getAttribute('href') === cur));
  document.body.classList.add('has-admin-sidebar');
}

function unrender() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch {}
  document.querySelector('.admin-sidebar')?.remove();
  document.getElementById('lms-shell-css')?.remove();
  document.body.classList.remove('has-admin-sidebar');
}

const count = async (q, label) => { try { return (await getDocs(q)).size; } catch (err) { console.error('Sidebar LMS: gagal cek', label, err.code, err.message); return 0; } };

let authSeq = 0;
onAuth(async (user) => {
  const seq = ++authSeq;
  if (!user || user.isAnonymous || !user.email) { unrender(); return; }
  try {
    const email = user.email.toLowerCase();
    const [prof, wl] = await Promise.all([getDoc(doc(db, 'users', user.uid)), getDoc(doc(db, 'admins', user.email)).catch(() => null)]);
    if (seq !== authSeq) return; // sudah ganti akun selagi menunggu
    let role = prof.exists() ? prof.data().role : null;
    if (!role) return; // profil belum dibuat (halaman yang membuatnya akan memanggil ensureUserProfile)
    if (role === 'admin' && !wl?.exists()) role = 'trainee';
    let opts = {};
    if (role === 'admin') {
      const [nApproval, nSubmissions] = await Promise.all([
        count(query(collection(db, 'modules'), where('status', '==', 'pending_approval')), 'approval'),
        count(query(collection(db, 'submissions'), where('score', '==', null)), 'submissions'),
      ]);
      opts = { nApproval, nSubmissions };
    } else {
      const [isViewer, hasIdp] = await Promise.all([
        count(query(collection(db, 'assessments'), where('viewerEmails', 'array-contains', email), limit(1)), 'viewer'),
        count(query(collection(db, 'developmentPlans'), where('email', '==', email), limit(1)), 'idp'),
      ]);
      const id = role === 'trainee';
      opts.tms = isViewer ? { href: 'tms/index.html', label: id ? 'TMS: Tim Anda' : 'TMS: Your Team' }
               : hasIdp ? { href: 'tms/my-idp.html', label: id ? 'IDP Saya' : 'My IDP' } : null;
    }
    if (seq !== authSeq) return;
    render(navFor(role, opts), role === 'admin' ? 'Admin' : role === 'trainer' ? 'Trainer' : 'Trainee');
  } catch (err) { console.error('Sidebar LMS: gagal memuat', err.code, err.message); }
});
