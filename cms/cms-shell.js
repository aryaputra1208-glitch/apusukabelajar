// Sidebar navigasi CMS (Competency Management System) — KHUSUS admin.
// Dipasang dengan: <script type="module" src="./cms-shell.js?v=..."></script> sebelum </body>.
// Isi menu disimpan di sessionStorage (cmsNavCache) dan dipasang lebih dulu oleh skrip inline di awal <body> (tanpa kedip).
// Memakai class yang sama dengan sidebar admin LMS (admin-sidebar) supaya ikut gaya glass & animasi lensa.

import { db, onAuth, ensureUserProfile } from '../firebase-shared.js';
import { iconSvg } from '../lms-icons.js';

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


function render(nav, roleLabel) {
  const cur = here();
  const inner = `<a class="as-logo" href="index.html">anteraja CMS</a><div class="as-role">${roleLabel}</div>` +
    nav.filter(g => g.items.length).map(g => `<div class="as-group">${g.group}</div>` + g.items.map(it =>
      `<a class="as-item" href="${it.href}">${iconSvg(it.icon, { size: 16 })}<span>${it.label}</span>${it.badge ? `<span class="as-badge">${it.badge}</span>` : ''}</a>`
    ).join('')).join('');
  const sig = String(inner.length) + ':' + inner.slice(-200);
  const html = `<nav class="admin-sidebar" aria-label="CMS menu">${inner}</nav>`;
  try { sessionStorage.setItem('cmsNavCache', JSON.stringify({ html, css: CSS, sig })); } catch {}
  if (!document.getElementById('cms-shell-css')) { const style = document.createElement('style'); style.id = 'cms-shell-css'; style.textContent = CSS; document.head.appendChild(style); }
  let aside = document.querySelector('.admin-sidebar');
  // sidebar dari cache (tms-shell-early.js) dipertahankan; isinya hanya diganti kalau menu berubah — tanpa kedip
  if (!aside) { aside = document.createElement('nav'); aside.className = 'admin-sidebar'; aside.setAttribute('aria-label', 'CMS menu'); document.body.prepend(aside); }
  if (aside.dataset.sig !== sig) {
    // ganti isi tanpa membuang elemen lensa animasi (dipasang lms-motion.js)
    const lens = aside.querySelector(':scope > .lens');
    aside.innerHTML = inner; aside.dataset.sig = sig;
    if (lens) aside.prepend(lens);
  }
  aside.querySelectorAll('a.as-item').forEach(a => a.classList.toggle('active', a.getAttribute('href') === cur));
  document.body.classList.add('has-admin-sidebar');
}

function unrender() {
  try { sessionStorage.removeItem('cmsNavCache'); } catch {}
  document.querySelector('.admin-sidebar')?.remove();
  document.getElementById('cms-shell-css')?.remove();
  document.body.classList.remove('has-admin-sidebar');
}

let authSeq = 0;
onAuth(async (user) => {
  const seq = ++authSeq;
  if (!user || user.isAnonymous || !user.email) { unrender(); return; }
  try {
    const profile = await ensureUserProfile(user);
    if (seq !== authSeq) return;
    if (profile.role !== 'admin') { unrender(); return; } // CMS hanya untuk admin
    const nav = [
      { group: 'General', items: [{ href: 'index.html', icon: 'home', label: 'Dashboard' }] },
      { group: 'Competency', items: [
        { href: 'dictionary.html', icon: 'books', label: 'Competency Dictionary' },
        { href: 'job-families.html', icon: 'layout-grid', label: 'Job Families' },
        { href: 'matrix.html', icon: 'check', label: 'Competency Matrix' },
      ] },
      { group: 'People', items: [{ href: 'coverage.html', icon: 'user-check', label: 'Employee Coverage' }] },
      { group: 'Other Apps', items: [
        { href: '../index.html', icon: 'arrow-right', label: 'LMS' },
        { href: '../tms/index.html', icon: 'arrow-right', label: 'TMS' },
      ] },
    ];
    render(nav, 'Admin');
  } catch (err) { console.error('Sidebar CMS: gagal memuat', err.code, err.message); }
});
