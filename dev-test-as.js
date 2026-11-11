/* =========================================================
   SEMENTARA — Mode Uji Role (khusus admin)
   Tombol di pojok kanan bawah untuk melihat LMS/TMS sebagai role lain
   dan/atau sebagai email karyawan lain (atasan, mentor, karyawan di TMS).
   Untuk menghapus fitur ini: hapus file ini + blok "SEMENTARA" di firebase-shared.js.
   ========================================================= */
import { db, getTestAs, setTestAs } from './firebase-shared.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

let mounted = false;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function mountTestAs({ realEmail }) {
  if (mounted || !document.body) return;
  mounted = true;
  const t = getTestAs();
  const active = !!(t && (t.role || t.email));
  const st = document.createElement('style');
  st.textContent = `
    .tas-btn { position: fixed; right: 16px; bottom: 16px; z-index: 9999; border: none; border-radius: 999px; padding: 8px 14px; font: 600 12px Inter, system-ui, sans-serif; cursor: pointer;
      background: ${active ? '#F59E0B' : 'rgba(30,30,35,.82)'}; color: #fff; box-shadow: 0 6px 18px rgba(0,0,0,.18); }
    .tas-panel { position: fixed; right: 16px; bottom: 60px; z-index: 9999; width: 330px; background: #fff; border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,.2); padding: 16px; font: 13px Inter, system-ui, sans-serif; color: #1a1a1a; }
    .tas-panel h4 { margin: 0 0 2px; font-size: 14px; }
    .tas-panel .m { color: #6b6b6b; font-size: 11.5px; line-height: 1.45; }
    .tas-panel label { display: block; font-weight: 600; font-size: 12px; margin: 12px 0 4px; }
    .tas-panel select, .tas-panel input { width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid #ddd; border-radius: 8px; font: inherit; margin: 0; }
    .tas-panel .row { display: flex; gap: 8px; margin-top: 14px; }
    .tas-panel .row button { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #ddd; background: #fff; font: 600 12px Inter, system-ui, sans-serif; cursor: pointer; }
    .tas-panel .row button.p { background: #E6007A; border-color: #E6007A; color: #fff; }
    .tas-banner { position: fixed; left: 50%; transform: translateX(-50%); top: 0; z-index: 9998; background: #F59E0B; color: #fff; font: 600 11.5px Inter, system-ui, sans-serif; padding: 3px 12px; border-radius: 0 0 8px 8px; pointer-events: none; }`;
  document.head.appendChild(st);

  const roleLbl = { admin: 'Admin', trainer: 'Trainer', trainee: 'Trainee' };
  const btn = document.createElement('button');
  btn.className = 'tas-btn';
  btn.textContent = active ? `Testing: ${t.email ? (t.nama || t.email) : ''}${t.role ? (t.email ? ' · ' : '') + roleLbl[t.role] : ''}` : 'Test as…';
  document.body.appendChild(btn);
  if (active) {
    const bn = document.createElement('div'); bn.className = 'tas-banner';
    bn.textContent = 'TEST MODE · data access still uses your admin account';
    document.body.appendChild(bn);
  }

  let panel = null;
  btn.addEventListener('click', async () => {
    if (panel) { panel.remove(); panel = null; return; }
    panel = document.createElement('div'); panel.className = 'tas-panel';
    panel.innerHTML = `
      <h4>Test As (temporary)</h4>
      <div class="m">Preview the app as another role or employee. You are still signed in as ${esc(realEmail)}; data access stays admin.</div>
      <label>LMS role</label>
      <select id="tasRole">
        <option value="">Auto (selected person's role)</option>
        <option value="admin">Admin</option>
        <option value="trainer">Trainer</option>
        <option value="trainee">Trainee</option>
      </select>
      <label>View as employee (TMS: manager, mentor, employee)</label>
      <select id="tasEmp"><option value="">Myself</option></select>
      <div class="m" style="margin-top:6px;">Pick a manager to see My Team, a mentor for My Mentees, or an employee for IDP Saya. Leave LMS role on Auto to see exactly what that person sees.</div>
      <div class="m" id="tasNoEmail" style="margin-top:6px; color:#a15c00; display:none;"></div>
      <div class="row"><button id="tasReset">Reset</button><button class="p" id="tasApply">Apply</button></div>`;
    document.body.appendChild(panel);
    const cur = getTestAs() || {};
    panel.querySelector('#tasRole').value = cur.role || '';
    const sel = panel.querySelector('#tasEmp');
    let emps = [];
    const draw = () => {
      const ok = emps.filter(e => e.email), noMail = emps.filter(e => !e.email);
      sel.innerHTML = `<option value="">Myself</option>` + ok.map(e =>
        `<option value="${esc(e.email)}" ${e.email === cur.email ? 'selected' : ''}>${esc(e.nama)} · ${esc(e.jabatan || e.level || '')}</option>`).join('');
      const note = panel.querySelector('#tasNoEmail');
      if (noMail.length) {
        note.style.display = 'block';
        note.textContent = `Not listed (no email in Employees): ${noMail.slice(0, 6).map(e => e.nama).join(', ')}${noMail.length > 6 ? ` +${noMail.length - 6} more` : ''}. TMS links people by email, so add an email (a dummy one is fine for testing) in Employees, then click "Refresh Manager Access" in Performance Data.`;
      }
    };
    const goHome = () => { if (/\/tms\//.test(location.pathname)) location.href = 'index.html'; else location.reload(); };
    panel.querySelector('#tasApply').addEventListener('click', () => {
      const role = panel.querySelector('#tasRole').value;
      const email = (sel.value || '').toLowerCase();
      const nama = email ? (emps.find(e => e.email === email)?.nama || '') : '';
      setTestAs(role || email ? { role, email, nama } : null);
      try { sessionStorage.removeItem('tmsNavCache2'); } catch {}
      goHome();
    });
    panel.querySelector('#tasReset').addEventListener('click', () => { setTestAs(null); try { sessionStorage.removeItem('tmsNavCache2'); } catch {} goHome(); });
    try {
      const snap = await getDocs(collection(db, 'employees'));
      snap.forEach(d => { const e = d.data(); emps.push({ nik: d.id, nama: e.nama || d.id, jabatan: e.jabatan || '', level: e.level || '', email: (e.email || '').toLowerCase() }); });
      emps.sort((a, b) => a.nama.localeCompare(b.nama));
      if (panel) draw();
    } catch (err) { console.error('Mode uji: gagal baca employees', err.code, err.message); }
  });
}
