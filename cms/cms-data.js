/* =========================================================
   CMS — data & aturan bersama (khusus kompetensi TECHNICAL; Core/Managerial/Values ada di TMS)
   - Kamus: koleksi competencies dengan kategori 'Technical'; grup = kategori kompetensi technical (mis. IT, Sales); deskripsi per level kemahiran 1-5 (profisiensi)
   - Job family: settings/jobFamilies = { families: [{ id, nama, deskripsi }], jabatanMap: { "<Jabatan>": familyId } }
   - Competency matrix: competencyMatrix/{familyId} = { req: { <LEVEL_KEY>: { <compId>: 1-5 } } }  (level kemahiran yang dibutuhkan per level jabatan)
   - "Sudah ditrain" = lulus modul LMS online yang membangun kompetensi itu (post-test ≥ 70)
                       ATAU aktivitas IDP untuk kompetensi itu sudah Done (IDP approved).
   ========================================================= */
import { db } from '../firebase-shared.js';
import { LEVEL_COLUMNS, isPassed, planApproval, itemProgress } from '../competency-shared.js?v=20261119b';
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

export const BASELINE = '_all';
export { LEVEL_COLUMNS };

const grab = async (ref, label) => {
  try { const s = await getDocs(ref); const o = []; s.forEach(d => o.push({ _id: d.id, ...d.data() })); return o; }
  catch (err) { console.error('CMS: gagal baca', label, err.code, err.message); loadErrors.push(`${label}: ${err.code || err.message}`); return []; }
};
/** Daftar koleksi yang gagal dibaca (ditampilkan ke admin, bukan diam-diam kosong). */
export const loadErrors = [];

export async function loadFamilies() {
  try { const s = await getDoc(doc(db, 'settings', 'jobFamilies')); const d = s.exists() ? s.data() : {}; return { families: d.families || [], jabatanMap: d.jabatanMap || {} }; }
  catch (err) { console.error('CMS: gagal baca settings/jobFamilies', err.code, err.message); loadErrors.push(`settings/jobFamilies: ${err.code || err.message}`); return { families: [], jabatanMap: {} }; }
}
/** Dokumen matrix lengkap: { familyId: { req, comps: [compId yang dipilih untuk job family ini] } } */
export async function loadMatrixDocs() {
  const rows = await grab(collection(db, 'competencyMatrix'), 'competencyMatrix');
  const m = {}; rows.forEach(r => m[r._id] = { req: r.req || {}, comps: r.comps || [] }); return m;
}
export async function loadMatrix() {
  const rows = await grab(collection(db, 'competencyMatrix'), 'competencyMatrix');
  const m = {}; rows.forEach(r => m[r._id] = r.req || {}); return m;
}
/** CMS hanya mengelola kompetensi Technical (Core, Managerial & Values ada di TMS). */
export async function loadCompetencies() {
  return (await grab(collection(db, 'competencies'), 'competencies'))
    .filter(c => c.kategori === 'Technical')
    .map(c => ({ ...c, id: c._id }))
    // dikelompokkan per kategori (grup), yang belum berkategori di akhir
    .sort((a, b) => (a.grup ? 0 : 1) - (b.grup ? 0 : 1) || String(a.grup || '').localeCompare(String(b.grup || '')) || ((a.urutan ?? 999) - (b.urutan ?? 999)) || String(a.nama).localeCompare(String(b.nama)));
}
// kolom teks dipaksa jadi string yang sudah di-trim (Excel kadang menyimpan angka / spasi berlebih)
const TEXT = ['nama', 'jabatan', 'level', 'divisi', 'departemen', 'email', 'jobFamily', 'status'];
export const loadEmployees = () => grab(collection(db, 'employees'), 'employees').then(l => l.map(e => {
  const o = { ...e, nik: e._id };
  TEXT.forEach(k => { if (o[k] != null) o[k] = String(o[k]).trim(); });
  return o;
}));
export const loadModules = () => grab(collection(db, 'modules'), 'modules');
// percobaan lama mungkin hanya menyimpan uid → lengkapi email dari profil users supaya bisa dicocokkan ke karyawan
export async function loadAttempts() {
  const [atts, users] = await Promise.all([grab(collection(db, 'attempts'), 'attempts'), grab(collection(db, 'users'), 'users')]);
  const mail = {}; users.forEach(u => { if (u.email) mail[u._id] = u.email; });
  return atts.map(a => (a.email || !a.uid || !mail[a.uid]) ? a : { ...a, email: mail[a.uid] });
}
export const loadPlans = () => grab(collection(db, 'developmentPlans'), 'developmentPlans');
export const loadUpdates = () => grab(collection(db, 'idpUpdates'), 'idpUpdates');

// sama dengan TMS Employees: status Aktif dan belum lewat tanggal resign
export const isActive = e => (e.status || 'Aktif') === 'Aktif' && !(e.tanggalResign && e.tanggalResign <= new Date().toISOString().slice(0, 10));
export const levelLabelOf = key => LEVEL_COLUMNS.find(c => c.key === key)?.label || key || '(Unmapped level)';

/** Job family karyawan: dari pemetaan jabatan; kalau belum dipetakan, dari kolom Job Family karyawan (bila namanya cocok). */
export function familyOf(emp, cfg) {
  const id = cfg.jabatanMap[emp.jabatan || ''];
  if (id && cfg.families.some(f => f.id === id)) return id;
  if (emp.jobFamily) { const f = cfg.families.find(x => x.nama.toLowerCase() === String(emp.jobFamily).toLowerCase()); if (f) return f.id; }
  return null;
}

/** Level kemahiran (proficiency) kompetensi Technical. Kamus: competencies/{id}.profisiensi = { "1": "...", …, "5": "..." } */
export const PROFICIENCY = [
  { lv: 1, label: 'Basic' },
  { lv: 2, label: 'Developing' },
  { lv: 3, label: 'Proficient' },
  { lv: 4, label: 'Advanced' },
  { lv: 5, label: 'Expert' },
];
export const profLabel = n => { const p = PROFICIENCY.find(x => x.lv === Number(n)); return p ? `${p.lv} · ${p.label}` : '-'; };

/** Kompetensi Technical wajib { compId: levelKemahiran(1-5) } untuk job family + level jabatan (dari matrix job family itu). */
export function requiredFor(familyId, levelKey, matrix) {
  if (!levelKey || !familyId) return {};
  const out = {};
  Object.entries((matrix[familyId] || {})[levelKey] || {}).forEach(([k, v]) => { const n = Number(v); if (n > 0) out[k] = Math.min(5, n); });
  return out;
}

/**
 * Indeks bukti training per karyawan: { nik: { compId: [{ via: 'LMS'|'IDP', judul, tanggal }] } }.
 * LMS: percobaan post-test yang lulus pada modul online yang membangun kompetensi itu.
 * IDP: aktivitas (IDP approved) untuk kompetensi itu yang statusnya selesai (training dihitung lewat post-test).
 */
export function buildTrainedIndex({ employees, modules, attempts, plans, updates }) {
  const byEmail = {}, byNik = {};
  employees.forEach(e => { if (e.email) byEmail[String(e.email).toLowerCase()] = e.nik; byNik[e.nik] = e.nik; });
  const modById = {}; modules.forEach(m => modById[m._id] = m);
  const idx = {};
  const add = (nik, comp, ev) => { if (!nik || !comp) return; ((idx[nik] = idx[nik] || {})[comp] = idx[nik][comp] || []).push(ev); };
  const toDate = t => { if (!t) return ''; if (typeof t.seconds === 'number') return new Date(t.seconds * 1000).toISOString().slice(0, 10); const d = new Date(t); return isNaN(d) ? '' : d.toISOString().slice(0, 10); };
  // LMS online
  const seen = new Set();
  attempts.forEach(a => {
    const m = modById[a.moduleId]; if (!m || (m.mode || 'online') !== 'online' || !isPassed(a)) return;
    const nik = (a.nik && byNik[a.nik]) || byEmail[String(a.email || '').toLowerCase()]; if (!nik) return;
    (m.kompetensiIds || []).forEach(c => { const k = nik + '|' + c + '|' + a.moduleId; if (seen.has(k)) return; seen.add(k); add(nik, c, { via: 'LMS', judul: m.judul || 'Module', tanggal: toDate(a.submittedAt) }); });
  });
  // IDP
  const upByPlan = {}; updates.forEach(u => (upByPlan[u.planId] = upByPlan[u.planId] || []).push(u));
  plans.forEach(p => {
    if (planApproval(p).status !== 'approved') return;
    const planId = p._id;
    const empAttempts = attempts.filter(a => a.nik === p.nik || (p.email && a.email === p.email));
    (p.items || []).forEach(it => {
      if (it.jenis === 'training') return; // training dihitung dari LMS di atas
      const prog = itemProgress(it, empAttempts, upByPlan[planId] || []);
      if (prog.status !== 'selesai') return;
      add(p.nik, it.kompetensiId, { via: 'IDP', judul: it.deskripsi || it.jenis || 'IDP activity', tanggal: String(prog.last?.doneDate || prog.last?.at || it.statusAt || '').slice(0, 10) });
    });
  });
  return idx;
}

/** Ringkasan satu karyawan: daftar kompetensi wajib dengan status trained/not. */
export function coverageFor(emp, cfg, matrix, trainedIdx) {
  const fam = familyOf(emp, cfg);
  const req = requiredFor(fam, emp.levelKey, matrix);
  const ev = trainedIdx[emp.nik] || {};
  const items = Object.entries(req).map(([comp, lvl]) => ({ comp, lvl, evidence: ev[comp] || [], trained: !!(ev[comp] || []).length }));
  return { fam, items, nReq: items.length, nTrained: items.filter(i => i.trained).length };
}

/* =========================================================
   PENILAIAN TECHNICAL (Atasan & HC) → level kemahiran akhir
   - technicalRatings/{auto}: { nik, compId, jalur: 'atasan'|'hc', level 1-5, jenis, tanggal 'yyyy-mm-dd', catatan, createdAt, createdBy }
   - settings/technicalAssessment: aturan yang bisa diubah admin (lihat ASSESS_DEFAULTS)
   ========================================================= */
export const ASSESS_DEFAULTS = {
  labels: { 1: 'Basic', 2: 'Developing', 3: 'Proficient', 4: 'Advanced', 5: 'Expert' },
  rule: 'lowest',          // 'lowest' | 'average' (dibulatkan ke bawah) | 'weighted'
  weightAtasan: 60,        // % (rule 'weighted'); HC = 100 - weightAtasan
  singleSource: 'use',     // 'use' = 1 sumber tetap dipakai (ditandai) | 'require' = level akhir baru ada kalau Atasan & HC lengkap
  calibrationGap: 2,       // selisih Atasan vs HC ≥ ini → "perlu kalibrasi"
  lmsAsHc: true,           // lulus post-test modul LMS (yang punya level) dihitung sebagai nilai HC "Test (LMS)"
  hcTypes: ['Test', 'Practical Test', 'Assessment Center', 'Certification', 'Interview'],
};
export async function loadAssessSettings() {
  try { const s = await getDoc(doc(db, 'settings', 'technicalAssessment')); const d = s.exists() ? s.data() : {}; return { ...ASSESS_DEFAULTS, ...d, labels: { ...ASSESS_DEFAULTS.labels, ...(d.labels || {}) }, hcTypes: d.hcTypes?.length ? d.hcTypes : ASSESS_DEFAULTS.hcTypes }; }
  catch (err) { console.error('CMS: gagal baca settings/technicalAssessment', err.code, err.message); loadErrors.push(`settings/technicalAssessment: ${err.code || err.message}`); return { ...ASSESS_DEFAULTS }; }
}
export const lvLabel = (n, st) => { n = Number(n); return n >= 1 && n <= 5 ? `${n} · ${(st?.labels || ASSESS_DEFAULTS.labels)[n]}` : '-'; };
export const loadRatings = () => grab(collection(db, 'technicalRatings'), 'technicalRatings');

/** Nilai terbaru per { nik: { compId: { atasan, hc } } }. Nilai HC = terbaru antara input HC dan lulus post-test LMS (kalau diaktifkan). */
export function buildRatingIndex({ ratings, employees, modules, attempts }, st) {
  const idx = {};
  const later = (a, b) => !a ? b : (String(b.tanggal) > String(a.tanggal) || (String(b.tanggal) === String(a.tanggal) && String(b._order || '') > String(a._order || '')) ? b : a);
  const put = (nik, comp, jalur, r) => { const o = ((idx[nik] = idx[nik] || {})[comp] = idx[nik][comp] || { atasan: null, hc: null, history: [] }); o[jalur] = later(o[jalur], r); o.history.push({ ...r, jalur }); };
  ratings.forEach(r => { const lv = Number(r.level); if (!r.nik || !r.compId || !(lv >= 1 && lv <= 5) || !['atasan', 'hc'].includes(r.jalur)) return;
    put(r.nik, r.compId, r.jalur, { level: lv, jenis: r.jenis || (r.jalur === 'atasan' ? 'Supervisor Rating' : 'HC'), tanggal: String(r.tanggal || '').slice(0, 10), catatan: r.catatan || '', _id: r._id, _order: r.createdAt?.seconds ? String(r.createdAt.seconds) : '' }); });
  if (st.lmsAsHc) {
    const byEmail = {}, byNik = {}; employees.forEach(e => { if (e.email) byEmail[String(e.email).toLowerCase()] = e.nik; byNik[e.nik] = e.nik; });
    const modById = {}; modules.forEach(m => modById[m._id] = m);
    attempts.forEach(a => {
      const m = modById[a.moduleId]; if (!m || !isPassed(a)) return;
      const nik = (a.nik && byNik[a.nik]) || byEmail[String(a.email || '').toLowerCase()]; if (!nik) return;
      const tgl = a.submittedAt?.seconds ? new Date(a.submittedAt.seconds * 1000).toISOString().slice(0, 10) : '';
      Object.entries(m.kompetensiLevel || {}).forEach(([comp, lv]) => { lv = Number(lv); if (lv >= 1 && lv <= 5 && (m.kompetensiIds || []).includes(comp)) put(nik, comp, 'hc', { level: lv, jenis: 'Test (LMS)', tanggal: tgl, catatan: m.judul || '', lms: true }); });
    });
  }
  return idx;
}

/** Gabungkan Atasan & HC sesuai aturan admin → { final, sources, calibrate } */
export function combine(atasan, hc, st) {
  const a = atasan?.level, h = hc?.level;
  if (a && h) {
    let f;
    if (st.rule === 'average') f = Math.floor((a + h) / 2 + 1e-9);
    else if (st.rule === 'weighted') { const w = Math.min(100, Math.max(0, Number(st.weightAtasan) || 0)) / 100; f = Math.floor(a * w + h * (1 - w) + 1e-9); }
    else f = Math.min(a, h);
    return { final: Math.max(1, Math.min(5, f)), sources: 2, calibrate: Math.abs(a - h) >= (Number(st.calibrationGap) || 99) };
  }
  if (a || h) return { final: st.singleSource === 'require' ? null : (a || h), sources: 1, calibrate: false };
  return { final: null, sources: 0, calibrate: false };
}

/** Profil kemahiran satu karyawan: kompetensi wajib (matrix) + nilai Atasan/HC + level akhir + status. */
export function proficiencyFor(emp, cfg, matrix, ratingIdx, st) {
  const fam = familyOf(emp, cfg);
  const req = requiredFor(fam, emp.levelKey, matrix);
  const mine = ratingIdx[emp.nik] || {};
  const items = Object.entries(req).map(([comp, need]) => {
    const r = mine[comp] || { atasan: null, hc: null, history: [] };
    const c = combine(r.atasan, r.hc, st);
    const status = c.final == null ? 'pending' : c.final >= need ? 'meet' : 'below';
    return { comp, need, atasan: r.atasan, hc: r.hc, history: r.history, ...c, gap: c.final == null ? null : Math.max(0, need - c.final), status };
  });
  return { fam, items, nReq: items.length, nMeet: items.filter(i => i.status === 'meet').length, nBelow: items.filter(i => i.status === 'below').length, nPending: items.filter(i => i.status === 'pending').length, nCal: items.filter(i => i.calibrate).length };
}
/** Pakai label level dari pengaturan admin untuk PROFICIENCY / profLabel di seluruh halaman. */
export function applyLabels(st) { PROFICIENCY.forEach(p => { if (st?.labels?.[p.lv]) p.label = st.labels[p.lv]; }); }
