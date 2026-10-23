// Sidebar navigasi untuk role ADMIN di semua halaman admin LMS.
// Dipasang dengan: <script type="module" src="./admin-shell.js?v=..."></script> sebelum </body>.
// Trainer/trainee yang membuka halaman yang sama TIDAK melihat sidebar ini.

import { db, onAuth } from './firebase-shared.js';
import { iconSvg } from './lms-icons.js';
import { doc, getDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const NAV = [
  { group: 'Umum', items: [
    { href: 'index.html', icon: 'home', label: 'Beranda' },
  ]},
  { group: 'Konten', items: [
    { href: 'admin-approval.html', icon: 'check', label: 'Approval Modul', badge: 'approval' },
    { href: 'admin-trainings.html', icon: 'layout-grid', label: 'Daftar Training' },
    { href: 'trainer-create-module.html', icon: 'plus', label: 'Buat Modul' },
    { href: 'trainee-library.html', icon: 'books', label: 'Library Modul' },
  ]},
  { group: 'Orang', items: [
    { href: 'admin-users.html', icon: 'users', label: 'Kelola User' },
    { href: 'admin-trainer.html', icon: 'user-check', label: 'Kelola Trainer' },
    { href: 'trainer-submissions.html', icon: 'file-text', label: 'Nilai Submission', badge: 'submissions' },
  ]},
  { group: 'Laporan', items: [
    { href: 'trainer-analytics.html', icon: 'chart-bar', label: 'Analitik Modul' },
    { href: 'training-dashboard-v2.html', icon: 'chart-bar', label: 'Training Dashboard' },
  ]},
  { group: 'Aplikasi Lain', items: [
    { href: 'tms/index.html', icon: 'arrow-right', label: 'TMS' },
  ]},
];

const CSS = `
  body.has-admin-sidebar { padding-left: 232px; }
  .admin-sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: 232px; background: var(--surface); border-right: 1px solid var(--border); padding: 18px 12px; overflow-y: auto; z-index: 40; box-sizing: border-box; }
  .admin-sidebar .as-logo { font-family: var(--font-display); font-weight: 700; font-size: 18px; color: var(--pink); padding: 0 10px 6px; display: block; text-decoration: none; }
  .admin-sidebar .as-role { font-size: 11px; color: var(--text-3); padding: 0 10px 8px; }
  .admin-sidebar .as-group { font-size: 11px; font-weight: 700; color: var(--text-3); letter-spacing: .04em; text-transform: uppercase; margin: 16px 10px 6px; }
  .admin-sidebar a.as-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--r-control); color: var(--text-2); font-size: 13px; font-weight: 500; text-decoration: none; margin-bottom: 2px; }
  .admin-sidebar a.as-item:hover { background: var(--surface-2); }
  .admin-sidebar a.as-item.active { background: var(--pink-bg); color: var(--pink-dark); font-weight: 700; }
  .admin-sidebar .as-badge { margin-left: auto; background: var(--red-bg); color: var(--red); font-size: 11px; font-weight: 700; border-radius: var(--r-pill); padding: 1px 7px; display: none; }
  body.has-admin-sidebar .topbar .sidebar-logo, body.has-admin-sidebar .topbar a[href="index.html"] { display: none !important; }
  body.has-admin-sidebar .topbar > :last-child { margin-left: auto; }
  @media (max-width: 900px) { body.has-admin-sidebar .topbar .sidebar-logo, body.has-admin-sidebar .topbar a[href="index.html"] { display: flex !important; } body.has-admin-sidebar { padding-left: 0; } .admin-sidebar { display: none; } }
`;

function currentFile() {
  const f = location.pathname.split('/').pop();
  return f || 'index.html';
}

function render() {
  if (document.querySelector('.admin-sidebar')) return;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const here = currentFile();
  const aside = document.createElement('nav');
  aside.className = 'admin-sidebar';
  aside.setAttribute('aria-label', 'Menu admin');
  aside.innerHTML = `<a class="as-logo" href="index.html">anteraja LMS</a><div class="as-role">Admin</div>` +
    NAV.map(g => `<div class="as-group">${g.group}</div>` + g.items.map(it =>
      `<a class="as-item ${it.href === here ? 'active' : ''}" href="${it.href}">${iconSvg(it.icon, { size: 16 })}<span>${it.label}</span>${it.badge ? `<span class="as-badge" data-badge="${it.badge}"></span>` : ''}</a>`
    ).join('')).join('');
  document.body.prepend(aside);
  document.body.classList.add('has-admin-sidebar');
}

async function loadBadges() {
  const set = (key, n) => {
    const el = document.querySelector(`.admin-sidebar [data-badge="${key}"]`);
    if (!el) return;
    el.textContent = n; el.style.display = n ? 'inline-block' : 'none';
  };
  try {
    const s = await getDocs(query(collection(db, 'modules'), where('status', '==', 'pending_approval')));
    set('approval', s.size);
  } catch (err) { console.error('Sidebar: gagal hitung approval', err.code, err.message); }
  try {
    const s = await getDocs(query(collection(db, 'submissions'), where('score', '==', null)));
    set('submissions', s.size);
  } catch (err) { console.error('Sidebar: gagal hitung submission', err.code, err.message); }
}

onAuth(async (user) => {
  if (!user) return;
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists() || snap.data().role !== 'admin') return;
    render();
    loadBadges();
  } catch (err) { console.error('Sidebar admin: gagal cek role', err.code, err.message); }
});
