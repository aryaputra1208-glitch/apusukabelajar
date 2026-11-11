/* =========================================================
   TMS — komponen IDP bersama untuk halaman user (Tim Saya, Mentee Saya, IDP Saya)
   - timeline update progres
   - dialog update progres (mentor / atasan)
   - dialog catatan (minta revisi)
   ========================================================= */
import { db, auth } from '../firebase-shared.js';
import { escapeHtml, IDP_STATUS, IDP_STATUS_ID, PROGRESS_STATUS, daysUntil } from '../competency-shared.js?v=20261111b';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const CSS = `
.idp-dlg-back { position: fixed; inset: 0; background: rgba(20,20,30,.28); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
.idp-dlg { width: 100%; max-width: 480px; background: rgba(255,255,255,.92); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,.18); padding: 22px; }
.idp-dlg h3 { margin: 0 0 4px; font-size: 16px; }
.idp-dlg .seg { display: flex; gap: 6px; margin: 14px 0; flex-wrap: wrap; }
.idp-dlg .seg button { flex: 1; min-width: 90px; }
.idp-dlg .seg button.on { background: var(--pink); color: #fff; box-shadow: none; }
.idp-dlg textarea, .idp-dlg input { width: 100%; }
.idp-dlg .acts { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
.tl { list-style: none; margin: 8px 0 0; padding: 0 0 0 14px; border-left: 2px solid var(--border); }
.tl li { position: relative; padding: 0 0 10px 10px; font-size: 12.5px; }
.tl li::before { content: ''; position: absolute; left: -20px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: #fff; border: 2px solid var(--pink); }
.tl .who { font-weight: 600; }
.pbar { height: 6px; border-radius: 99px; background: rgba(0,0,0,.07); overflow: hidden; }
.pbar > span { display: block; height: 100%; background: var(--pink); border-radius: 99px; }
.overdue { color: var(--red); font-weight: 600; }
`;
if (!document.getElementById('idp-ui-css')) { const st = document.createElement('style'); st.id = 'idp-ui-css'; st.textContent = CSS; document.head.appendChild(st); }

export const STATUS_BADGE = { rencana: 'badge-gray', berjalan: 'badge-purple', selesai: 'badge-green', batal: 'badge-red' };

export function fmtDate(d, lang = 'en') {
  if (!d) return '';
  const x = new Date(d);
  return isNaN(x) ? String(d) : x.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Teks target + tanda lewat target. */
export function targetHtml(item, status, lang = 'en') {
  if (!item.targetTanggal) return '';
  const n = daysUntil(item.targetTanggal);
  const late = n !== null && n < 0 && !['selesai', 'batal'].includes(status);
  const lbl = lang === 'id' ? 'target' : 'target';
  return late
    ? `<span class="overdue">${lbl} ${escapeHtml(fmtDate(item.targetTanggal, lang))} · ${lang === 'id' ? `lewat ${-n} hari` : `${-n}d overdue`}</span>`
    : `${lbl} ${escapeHtml(fmtDate(item.targetTanggal, lang))}`;
}

export function isOverdue(item, status) {
  const n = daysUntil(item.targetTanggal);
  return n !== null && n < 0 && !['selesai', 'batal'].includes(status);
}

/** Timeline update progres (terbaru di atas). */
export function timelineHtml(updates, lang = 'en') {
  if (!updates?.length) return '';
  const L = lang === 'id' ? IDP_STATUS_ID : IDP_STATUS;
  return `<ul class="tl">${updates.map(u => `<li>
    <span class="who">${escapeHtml(u.byNama || u.byEmail)}</span> <span class="text-meta">(${escapeHtml(u.byRole || '')}) · ${escapeHtml(fmtDate(u.at, lang))}</span>
    · <span class="badge ${STATUS_BADGE[u.status] || 'badge-gray'}" style="font-size:10.5px;">${escapeHtml(L[u.status] || u.status)}</span>
    ${u.note ? `<div>${escapeHtml(u.note)}</div>` : ''}
    ${u.evidenceUrl ? `<div><a href="${escapeHtml(u.evidenceUrl)}" target="_blank" rel="noopener">${lang === 'id' ? 'Lihat bukti' : 'View evidence'}</a></div>` : ''}
  </li>`).join('')}</ul>`;
}

export function progressBar(done, total) {
  const pct = total ? Math.round(done / total * 100) : 0;
  return `<div style="display:flex; align-items:center; gap:8px;"><div class="pbar" style="flex:1;"><span style="width:${pct}%"></span></div><span class="text-meta" style="min-width:64px; text-align:right;">${done}/${total} done</span></div>`;
}

function dialog(inner) {
  const back = document.createElement('div');
  back.className = 'idp-dlg-back';
  back.innerHTML = `<div class="idp-dlg" role="dialog" aria-modal="true">${inner}</div>`;
  document.body.appendChild(back);
  const close = () => back.remove();
  back.addEventListener('click', e => { if (e.target === back) close(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  return { el: back, close };
}

/**
 * Dialog update progres. ctx = { title, subtitle, current } → resolve { status, note, evidenceUrl } atau null.
 */
export function askProgress(ctx) {
  return new Promise(resolve => {
    let status = ctx.current && ctx.current !== 'batal' ? ctx.current : 'berjalan';
    const d = dialog(`
      <h3>Update Progress</h3>
      <div class="text-meta">${escapeHtml(ctx.title || '')}${ctx.subtitle ? ' · ' + escapeHtml(ctx.subtitle) : ''}</div>
      <div class="seg">${PROGRESS_STATUS.map(k => `<button type="button" class="btn btn-sm ${k === status ? 'on' : ''}" data-s="${k}">${IDP_STATUS[k]}</button>`).join('')}</div>
      <label>What happened? (visible to the employee)</label>
      <textarea id="idpNote" rows="3" placeholder="e.g. 2nd session done: reviewed the weekly plan together, next step is leading the briefing alone"></textarea>
      <label style="margin-top:8px;">Evidence link (optional)</label>
      <input type="url" id="idpEvidence" placeholder="https://… (OneDrive / Google Drive)">
      <div class="acts"><button class="btn btn-outline" data-x>Cancel</button><button class="btn btn-primary" data-ok>Save Update</button></div>`);
    d.el.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => {
      status = b.dataset.s; d.el.querySelectorAll('[data-s]').forEach(x => x.classList.toggle('on', x === b));
    }));
    d.el.querySelector('[data-x]').addEventListener('click', () => { d.close(); resolve(null); });
    d.el.querySelector('[data-ok]').addEventListener('click', () => {
      const note = d.el.querySelector('#idpNote').value.trim();
      const evidenceUrl = d.el.querySelector('#idpEvidence').value.trim();
      if (!note) { d.el.querySelector('#idpNote').focus(); d.el.querySelector('#idpNote').style.borderColor = 'var(--red)'; return; }
      if (evidenceUrl && !/^https?:\/\//i.test(evidenceUrl)) { d.el.querySelector('#idpEvidence').style.borderColor = 'var(--red)'; return; }
      d.close(); resolve({ status, note, evidenceUrl });
    });
    setTimeout(() => d.el.querySelector('#idpNote').focus(), 30);
  });
}

/** Dialog catatan (minta revisi / approve dengan catatan). */
export function askNote({ title, label, placeholder, okText, required = true }) {
  return new Promise(resolve => {
    const d = dialog(`
      <h3>${escapeHtml(title)}</h3>
      <label style="margin-top:12px;">${escapeHtml(label)}</label>
      <textarea id="idpNote2" rows="4" placeholder="${escapeHtml(placeholder || '')}"></textarea>
      <div class="acts"><button class="btn btn-outline" data-x>Cancel</button><button class="btn btn-primary" data-ok>${escapeHtml(okText)}</button></div>`);
    d.el.querySelector('[data-x]').addEventListener('click', () => { d.close(); resolve(null); });
    d.el.querySelector('[data-ok]').addEventListener('click', () => {
      const v = d.el.querySelector('#idpNote2').value.trim();
      if (required && !v) { d.el.querySelector('#idpNote2').style.borderColor = 'var(--red)'; return; }
      d.close(); resolve(v);
    });
    setTimeout(() => d.el.querySelector('#idpNote2').focus(), 30);
  });
}

/**
 * Simpan update progres ke idpUpdates.
 * src = { planId, nik, periode, menteeEmail, atasanEmail, viewerEmails } ; item = aksi IDP (butuh id, jenis, kompetensiId, mentorEmail)
 */
export async function postUpdate({ src, item, status, note, evidenceUrl, byRole, profile }) {
  const hasMentorship = ['mentoring', 'coaching'].includes(item.jenis) && !!item.mentorEmail;
  const data = {
    planId: src.planId, itemId: item.id, nik: src.nik, periode: src.periode, kompetensiId: item.kompetensiId || '',
    status, note, evidenceUrl: evidenceUrl || '',
    at: new Date().toISOString(), createdAt: serverTimestamp(),
    byEmail: (auth.currentUser?.email || profile.email || '').toLowerCase(), byNama: profile.displayName || profile.email, byRole,
    menteeEmail: src.menteeEmail || '', atasanEmail: src.atasanEmail || '',
    mentorEmail: hasMentorship ? item.mentorEmail : '', viewerEmails: src.viewerEmails || [],
  };
  await addDoc(collection(db, 'idpUpdates'), data);
  return data;
}
