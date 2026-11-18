/* =========================================================
   CMS — data & aturan bersama (khusus kompetensi TECHNICAL; Core/Managerial/Values ada di TMS)
   - Kamus: koleksi competencies dengan kategori 'Technical' (indikator per level jabatan)
   - Job family: settings/jobFamilies = { families: [{ id, nama, deskripsi }], jabatanMap: { "<Jabatan>": familyId } }
   - Competency matrix: competencyMatrix/{familyId} = { req: { <LEVEL_KEY>: { <compId>: 1 } } }  (1 = wajib)
   - "Sudah ditrain" = lulus modul LMS online yang membangun kompetensi itu (post-test ≥ 70)
                       ATAU aktivitas IDP untuk kompetensi itu sudah Done (IDP approved).
   ========================================================= */
import { db } from '../firebase-shared.js';
import { LEVEL_COLUMNS, isPassed, planApproval, itemProgress } from '../competency-shared.js?v=20261118a';
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
export async function loadMatrix() {
  const rows = await grab(collection(db, 'competencyMatrix'), 'competencyMatrix');
  const m = {}; rows.forEach(r => m[r._id] = r.req || {}); return m;
}
/** CMS hanya mengelola kompetensi Technical (Core, Managerial & Values ada di TMS). */
export async function loadCompetencies() {
  return (await grab(collection(db, 'competencies'), 'competencies'))
    .filter(c => c.kategori === 'Technical')
    .map(c => ({ ...c, id: c._id }))
    .sort((a, b) => ((a.urutan ?? 999) - (b.urutan ?? 999)) || String(a.nama).localeCompare(String(b.nama)));
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

/** Kompetensi Technical wajib { compId: 1 } untuk job family + level (dari matrix job family itu). */
export function requiredFor(familyId, levelKey, matrix) {
  if (!levelKey || !familyId) return {};
  const out = {};
  Object.entries((matrix[familyId] || {})[levelKey] || {}).forEach(([k, v]) => { if (Number(v) > 0) out[k] = 1; });
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
