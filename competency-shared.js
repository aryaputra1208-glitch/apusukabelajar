// Definisi bersama untuk Kamus Kompetensi & Data Karyawan (Fase 1 TMS).
// Dipakai: tms/*.html (Karyawan, Kamus, Performa, Profil, IDP) dan trainer-create-module.html.
// Nanti juga dipakai halaman profiling (Fase 2) — jadi aturan level cukup diubah di sini saja.

/** Kolom level di kamus kompetensi, urut dari terendah ke tertinggi. */
export const LEVEL_COLUMNS = [
  { key: 'STAFF',  label: 'Staff' },
  { key: 'COORD',  label: 'Coordinator' },
  { key: 'SPV_M',  label: 'Supervisor (Memiliki Bawahan)' },
  { key: 'SPV_I',  label: 'Supervisor (Tanpa Bawahan)' },
  { key: 'SH_M',   label: 'Section Head (Memiliki Bawahan)' },
  { key: 'SH_I',   label: 'Section Head (Tanpa Bawahan)' },
  { key: 'DH',     label: 'Department Head' },
  { key: 'AVP',    label: 'AVP' },
  { key: 'DIVH',   label: 'Division Head (VP dan SVP)' },
];

export const KATEGORI_ORDER = ['Core', 'Managerial', 'Values'];

/** Skala penilaian default (dari PA kualitatif). Bisa diubah admin di halaman Kamus Kompetensi. */
export const DEFAULT_SCALE = {
  standar: 3,
  skala: [
    { skor: 1, label: 'POOR', rentang: '0 - 1', deskripsi: 'Perilaku jarang terlihat. Meskipun sudah diberi arahan, hasilnya belum sesuai standar levelnya.', kataKunci: 'Jarang/tidak terlihat • Belum memenuhi standar • Tetap tidak sesuai meski diarahkan' },
    { skor: 2, label: 'LOW', rentang: '2.00 - 2.95', deskripsi: 'Perilaku muncul di sebagian dalam situasi tertentu, tetapi masih perlu arahan rutin dari atasan untuk mencapai standar.', kataKunci: 'Muncul pada sebagian situasi • Belum konsisten • Perlu arahan rutin' },
    { skor: 3, label: 'GOOD', rentang: '3.00 - 3.75', deskripsi: 'Perilaku muncul secara konsisten dalam situasi kerja normal sesuai standar levelnya. Bantuan hanya diperlukan pada situasi baru atau kompleks.', kataKunci: 'Konsisten pada situasi normal • Sesuai standar level • Mandiri; bantuan hanya untuk situasi baru/kompleks' },
    { skor: 4, label: 'VERY GOOD', rentang: '3.8 - 4.75', deskripsi: 'Perilaku muncul secara konsisten, termasuk dalam situasi sulit, dilakukan secara mandiri, dan hasilnya melampaui ekspektasi levelnya.', kataKunci: 'Konsisten termasuk situasi sulit • Mandiri • Melampaui ekspektasi level' },
    { skor: 5, label: 'OUTSTANDING', rentang: '4.75 - 5', deskripsi: 'Selalu melampaui ekspektasi, dan dampaknya terasa di luar dirinya: dijadikan contoh, membimbing orang lain, atau memperbaiki cara kerja tim.', kataKunci: 'Selalu melampaui ekspektasi • Berdampak di luar diri • Menjadi teladan/membimbing • Memperbaiki cara kerja tim' },
  ],
};

/**
 * Level jabatan (seperti di Kelola User) → kolom kamus kompetensi.
 * Supervisor & Section Head bercabang tergantung punya bawahan atau tidak.
 * 'Admin' dan 'Leader' belum ada kolomnya di kamus → return null (ditandai di UI, belum ditebak).
 */
export function levelKeyFor(level, punyaBawahan) {
  const l = String(level || '').trim().toLowerCase();
  if (l === 'staff') return 'STAFF';
  if (l === 'coordinator') return 'COORD';
  if (l === 'supervisor') return punyaBawahan ? 'SPV_M' : 'SPV_I';
  if (l === 'section head') return punyaBawahan ? 'SH_M' : 'SH_I';
  if (l === 'department head') return 'DH';
  if (l === 'avp') return 'AVP';
  if (l === 'vp' || l === 'svp' || l === 'division head') return 'DIVH';
  return null;
}

export function levelLabel(key) {
  return LEVEL_COLUMNS.find(c => c.key === key)?.label || '';
}

/** Cocokkan judul kolom Excel ke key level. Return null kalau bukan kolom level. */
export function matchLevelHeader(header) {
  const h = String(header || '').toLowerCase();
  const tanpa = h.includes('tanpa');
  if (h.includes('division head') || h.includes('svp')) return 'DIVH';
  if (h.includes('avp')) return 'AVP';
  if (h.includes('department')) return 'DH';
  if (h.includes('section head')) return tanpa ? 'SH_I' : 'SH_M';
  if (h.includes('supervisor')) return tanpa ? 'SPV_I' : 'SPV_M';
  if (h.includes('coordinator')) return 'COORD';
  if (h.includes('staff')) return 'STAFF';
  return null;
}

/** "Analysis & Decision Making" → "analysis-decision-making" (dipakai sebagai ID dokumen). */
export function slugify(text) {
  return String(text || '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, ' ')
    .trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ============================================================
   FASE 2 — Performa, gap, dan rekomendasi training
   ============================================================ */

/** Level yang boleh melihat skor bawahannya (Department Head ke atas). */
export const VIEWER_LEVEL_KEYS = ['DH', 'AVP', 'DIVH'];

/** Bobot default skor final kalau admin belum mengatur. KPI & PA diasumsikan sama-sama skala 1–5. */
export const DEFAULT_WEIGHTS = { pa: 50, kpi: 50 };

/**
 * Normalisasi periode: "2026" → "2026" (tahunan), "2026 S1" / "S1-2026" / "2026-1" → "2026-S1".
 * Return null kalau tidak ada tahunnya.
 */
export function normalizePeriode(v) {
  const s = String(v ?? '').trim().toUpperCase();
  const year = (s.match(/(20\d{2})/) || [])[1];
  if (!year) return null;
  const rest = s.replace(year, '');
  const sem = (rest.match(/S(?:EM(?:ESTER)?)?\s*-?\s*([12])/) || rest.match(/(?:^|[^0-9])([12])(?:[^0-9]|$)/) || [])[1];
  return sem ? `${year}-S${sem}` : year;
}

/** Untuk urutan: 2026-S1 < 2026-S2 < 2026 (tahunan dianggap paling akhir di tahun itu). */
export function periodeRank(p) {
  const m = String(p || '').match(/^(\d{4})(?:-S([12]))?$/);
  if (!m) return 0;
  return Number(m[1]) * 10 + (m[2] ? Number(m[2]) : 3);
}

export function periodeLabel(p) {
  const m = String(p || '').match(/^(\d{4})(?:-S([12]))?$/);
  if (!m) return p || '-';
  return m[2] ? `Semester ${m[2]} ${m[1]}` : `Tahunan ${m[1]}`;
}

/**
 * Label skor berdasarkan batas BAWAH tiap kategori (0, 2, 3, 3.8, 4.75 dari skala PA).
 * Cara ini menutup celah rentang di skala aslinya: 1,5 → POOR, 2,97 → LOW, 3,77 → GOOD, 4,75 → OUTSTANDING.
 */
export function scoreLabel(score, scale) {
  if (score == null || isNaN(score)) return null;
  const items = (scale?.skala || []).map(s => ({ label: s.label, min: parseFloat(String((String(s.rentang).match(/\d+(?:[.,]\d+)?/) || [s.skor])[0]).replace(',', '.')) }))
    .filter(s => !isNaN(s.min)).sort((a, b) => a.min - b.min);
  let label = items[0]?.label || null;
  items.forEach(s => { if (score >= s.min - 1e-9) label = s.label; });
  return label;
}

export function round2(n) { return n == null || isNaN(n) ? null : Math.round(n * 100) / 100; }

/**
 * Hitung skor final:
 *  - ada kolom Skor Final di import → pakai itu (sumber: import)
 *  - tidak ada KPI → final = skor PA (model: PA saja)
 *  - ada KPI → rata-rata berbobot sesuai level (model: PA + KPI)
 */
export function computeFinal({ skorPA, skorKPI, skorFinalImport, levelKey, weights }) {
  if (skorFinalImport != null && !isNaN(skorFinalImport)) {
    return { skorFinal: round2(skorFinalImport), skorFinalSumber: 'import', modelSkor: skorKPI != null ? 'PA + KPI' : 'PA saja', bobot: null };
  }
  if (skorKPI == null || isNaN(skorKPI)) {
    return { skorFinal: round2(skorPA), skorFinalSumber: 'hitung', modelSkor: 'PA saja', bobot: null };
  }
  const w = (weights?.perLevel?.[levelKey]) || weights?.default || DEFAULT_WEIGHTS;
  const total = (Number(w.pa) || 0) + (Number(w.kpi) || 0) || 100;
  const final = skorPA == null ? skorKPI : (skorPA * w.pa + skorKPI * w.kpi) / total;
  return { skorFinal: round2(final), skorFinalSumber: 'hitung', modelSkor: 'PA + KPI', bobot: { pa: Number(w.pa), kpi: Number(w.kpi) } };
}

/** Email semua atasan di garis ke atas yang levelnya DH ke atas (yang boleh lihat skor). */
export function viewerEmailsFor(nik, employeesByNik) {
  const out = [];
  const seen = new Set([nik]);
  let cur = employeesByNik[nik]?.atasanNik;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const boss = employeesByNik[cur];
    if (!boss) break;
    if (boss.email && VIEWER_LEVEL_KEYS.includes(boss.levelKey)) out.push(boss.email);
    cur = boss.atasanNik;
  }
  return out;
}

/** Kompetensi di bawah standar → [{ id, skor, gap }] urut gap terbesar. */
export function gapsFor(kompetensiScores, standar = 3) {
  return Object.entries(kompetensiScores || {})
    .filter(([, s]) => s != null && !isNaN(s) && s < standar)
    .map(([id, s]) => ({ id, skor: s, gap: round2(standar - s) }))
    .sort((a, b) => b.gap - a.gap);
}

/** Apakah modul ditujukan untuk karyawan ini (target level & divisi kosong = semua). Sama seperti logika "Wajib untuk Anda". */
export function moduleTargetsEmployee(m, emp) {
  const lvlOk = !m.targetLevel?.length || m.targetLevel.includes(emp.level);
  const divOk = !m.targetDivisi?.length || m.targetDivisi.some(d => (emp.divisi || '').toLowerCase().includes(String(d).toLowerCase()));
  return lvlOk && divOk;
}

/**
 * Training needed: modul published yang membangun kompetensi ber-gap dan ditujukan untuk level/divisi karyawan.
 * Return [{ moduleId, judul, kategori, mode, kompetensiIds (yang cocok dengan gap) }], urut dari yang menutup gap terbesar.
 */
export function recommendModules(gaps, modules, emp) {
  const gapRank = {}; gaps.forEach((g, i) => gapRank[g.id] = { i, gap: g.gap });
  return modules
    .filter(m => m.status === 'published' && moduleTargetsEmployee(m, emp))
    .map(m => {
      const cocok = (m.kompetensiIds || []).filter(id => gapRank[id]);
      return { moduleId: m.id, judul: m.judul || '', kategori: m.kategori || '', mode: m.mode || 'online', kompetensiIds: cocok,
        _score: cocok.reduce((s, id) => s + gapRank[id].gap, 0) };
    })
    .filter(r => r.kompetensiIds.length)
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...r }) => r);
}

/* ============================================================
   Status gap 3 tahap: Gap terbuka → Dalam pengembangan → Closed (tervalidasi PA berikutnya)
   ============================================================ */

/** Nilai minimal post-test supaya training dianggap lulus. Post-test tanpa soal bernilai (skor kosong) = dianggap selesai. */
export const PASSING_SCORE = 70;

export function isPassed(attempt) {
  return attempt.score == null || Number(attempt.score) >= PASSING_SCORE;
}

function tsSeconds(t) {
  if (!t) return null;
  if (typeof t.seconds === 'number') return t.seconds;
  const d = new Date(t); return isNaN(d) ? null : d.getTime() / 1000;
}

/**
 * Status tiap kompetensi untuk satu penilaian.
 * - closed      : periode sebelumnya gap, sekarang sudah ≥ standar (tervalidasi lewat PA)
 * - development : masih gap, tapi sudah lulus post-test modul yang membangun kompetensi itu
 *                 (hanya training yang dikerjakan SETELAH hasil penilaian ini masuk)
 * - open        : masih gap, belum ada training yang lulus
 * - ok / strength / unrated
 * Return { [kompetensiId]: { status, gap?, modules?: [{moduleId, judul, score}], closedFrom? } }
 */
export function gapStatuses({ assessment, previous, attempts, modules, standar = 3, idpItems = [] }) {
  const out = {};
  const after = tsSeconds(assessment.updatedAt);
  const passedByModule = {};
  (attempts || []).forEach(t => {
    const sec = tsSeconds(t.submittedAt);
    if (after != null && sec != null && sec < after) return;
    if (!isPassed(t)) return;
    const cur = passedByModule[t.moduleId];
    if (!cur || (t.score ?? -1) > (cur.score ?? -1)) passedByModule[t.moduleId] = t;
  });
  const modById = {}; (modules || []).forEach(m => modById[m.id] = m);
  const prevGaps = new Set(previous ? gapsFor(previous.kompetensi, standar).map(g => g.id) : []);
  Object.keys({ ...(assessment.kompetensi || {}), ...Object.fromEntries([...prevGaps].map(id => [id, 1])) }).forEach(id => {
    const s = assessment.kompetensi?.[id];
    if (s == null) { out[id] = { status: 'unrated' }; return; }
    if (s >= standar) {
      out[id] = prevGaps.has(id) ? { status: 'closed', closedFrom: previous.periode } : { status: s >= 4 ? 'strength' : 'ok' };
      return;
    }
    const mods = Object.values(passedByModule)
      .filter(t => (modById[t.moduleId]?.kompetensiIds || []).includes(id))
      .map(t => ({ moduleId: t.moduleId, judul: modById[t.moduleId]?.judul || '', score: t.score ?? null }));
    // Aksi IDP non-training (mentoring, coaching, penugasan, ...) yang sudah ditandai selesai juga menghitung.
    const aksi = (idpItems || []).filter(it => it.kompetensiId === id && it.jenis !== 'training' && it.status === 'selesai')
      .map(it => ({ moduleId: null, judul: `${IDP_JENIS[it.jenis] || it.jenis}: ${it.deskripsi || ''}`.trim(), score: null }));
    const all = [...mods, ...aksi];
    out[id] = { status: all.length ? 'development' : 'open', gap: round2(standar - s), modules: all };
  });
  return out;
}

/* ============================================================
   IDP (Individual Development Plan) — dikelola HR/OD di TMS
   ============================================================ */
export const IDP_JENIS = { training: 'Training', mentoring: 'Mentoring', coaching: 'Coaching', penugasan: 'Penugasan / Proyek', lainnya: 'Lainnya' };
export const IDP_STATUS = { rencana: 'Rencana', berjalan: 'Berjalan', selesai: 'Selesai', batal: 'Batal' };

/**
 * Status efektif satu item IDP. Item training mengikuti hasil post-test di LMS
 * (lulus → selesai, sudah ikut tapi belum lulus → berjalan); item lain mengikuti status yang diisi HR/OD.
 */
export function idpItemStatus(item, attempts) {
  if (item.jenis !== 'training' || !item.moduleId) return { status: item.status || 'rencana', auto: false };
  if (item.status === 'batal') return { status: 'batal', auto: false };
  const mine = (attempts || []).filter(t => t.moduleId === item.moduleId);
  const best = mine.reduce((b, t) => (!b || (t.score ?? -1) > (b.score ?? -1)) ? t : b, null);
  if (!best) return { status: item.status || 'rencana', auto: false };
  return isPassed(best) ? { status: 'selesai', auto: true, score: best.score ?? null } : { status: 'berjalan', auto: true, score: best.score ?? null };
}
