// Definisi bersama untuk Kamus Kompetensi & Data Karyawan (Fase 1 TMS).
// Dipakai: tms/*.html (Karyawan, Kamus, Performa, Profil, IDP) dan trainer-create-module.html.
// Nanti juga dipakai halaman profiling (Fase 2) — jadi aturan level cukup diubah di sini saja.

/** Kolom level di kamus kompetensi, urut dari terendah ke tertinggi. */
export const LEVEL_COLUMNS = [
  { key: 'STAFF',  label: 'Staff' },
  { key: 'COORD',  label: 'Coordinator' },
  { key: 'SPV_M',  label: 'Supervisor (With Reports)' },
  { key: 'SPV_I',  label: 'Supervisor (No Reports)' },
  { key: 'SH_M',   label: 'Section Head (With Reports)' },
  { key: 'SH_I',   label: 'Section Head (No Reports)' },
  { key: 'DH',     label: 'Department Head' },
  { key: 'AVP',    label: 'AVP' },
  { key: 'DIVH',   label: 'Division Head (VP & SVP)' },
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
  const tanpa = h.includes('tanpa') || h.includes('no report') || h.includes('without');
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
  return m[2] ? `Semester ${m[2]} ${m[1]}` : `Annual ${m[1]}`;
}

/** Versi Bahasa Indonesia untuk halaman karyawan (IDP Saya). */
export function periodeLabelId(p) {
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
export const IDP_JENIS = { training: 'Training', mentoring: 'Mentoring', coaching: 'Coaching', penugasan: 'Assignment / Project', lainnya: 'Other' };
export const IDP_STATUS = { rencana: 'Planned', berjalan: 'In Progress', selesai: 'Done', batal: 'Cancelled' };
// Label Bahasa Indonesia untuk halaman karyawan (IDP Saya). Key-nya sama — hanya label tampilan.
export const IDP_JENIS_ID = { training: 'Training', mentoring: 'Mentoring', coaching: 'Coaching', penugasan: 'Penugasan / Proyek', lainnya: 'Lainnya' };
export const IDP_STATUS_ID = { rencana: 'Rencana', berjalan: 'Berjalan', selesai: 'Selesai', batal: 'Batal' };

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

/* =========================================================
   IDP: approval, progres & reminder (TMS sisi user)
   - developmentPlans/{periode_nik}.approval = { status, byEmail, byNama, at, note, submittedAt }
     status: draft → pending (HR/OD submit) → approved | revision (atasan langsung)
   - developmentPlans.ack = { at } — karyawan menyatakan setuju dengan IDP yang sudah disetujui atasan
   - mentorships/{planId__itemId}  — salinan item mentoring/coaching untuk mentor (mentor TIDAK baca IDP lengkap)
   - idpUpdates/{auto}             — update progres oleh mentor/atasan/HR (sekaligus timeline/jejak audit)
   ========================================================= */
export const APPROVAL_STATUS = { draft: 'Draft', pending: 'Pending Approval', approved: 'Approved', revision: 'Revision Requested' };
export const APPROVAL_STATUS_ID = { draft: 'Disusun HR/OD', pending: 'Menunggu Persetujuan Atasan', approved: 'Disetujui', revision: 'Sedang Direvisi HR/OD' };
export const APPROVAL_BADGE = { draft: 'badge-gray', pending: 'badge-amber', approved: 'badge-green', revision: 'badge-red' };
/** Status yang bisa dipilih mentor/atasan saat update progres. */
export const PROGRESS_STATUS = ['rencana', 'berjalan', 'selesai'];

export const planIdOf = p => `${p.periode}_${p.nik}`;
export const mentorshipIdOf = (planId, itemId) => `${planId}__${itemId}`;

/** IDP lama (sebelum ada fitur approval) dianggap sudah disetujui supaya tidak hilang dari karyawan. */
export function planApproval(plan) {
  return plan?.approval?.status ? plan.approval : { status: 'approved', legacy: true };
}

/** Isi IDP yang kalau berubah perlu disetujui ulang (status & tanggal target tidak termasuk). */
export function planContentSignature(items, catatan) {
  return JSON.stringify([(items || []).map(it => [it.id, it.kompetensiId, it.jenis, it.moduleId || '', String(it.deskripsi || '').trim(), it.mentorNik || '']), String(catatan || '').trim()]);
}

/** Progres efektif satu item: training otomatis dari post-test; aksi lain = update terbaru (mentor/atasan) atau status dari HR/OD, mana yang lebih baru. */
export function itemProgress(item, attempts, updates) {
  const mine = (updates || []).filter(u => u.itemId === item.id).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const last = mine[0] || null;
  const base = idpItemStatus(item, attempts);
  if (base.auto || item.status === 'batal') return { ...base, last, updates: mine };
  if (item.jenis !== 'training' && last && (!item.statusAt || String(last.at) > String(item.statusAt))) return { status: last.status, auto: false, last, updates: mine };
  return { status: item.status || 'rencana', auto: false, last, updates: mine };
}

const DAY_MS = 86400000;
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
/** Selisih hari target terhadap hari ini (positif = belum jatuh tempo). */
export function daysUntil(dateStr, today = new Date()) {
  if (!dateStr) return null;
  const d = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  if (isNaN(d)) return null;
  return Math.round((d - startOfDay(today)) / DAY_MS);
}
/** Logika reminder (sama dengan flow Tracking IDP): H-3, hari-H, lalu tiap 3 hari selama lewat target. */
export function reminderReason(target, today = new Date()) {
  const n = daysUntil(target, today);
  if (n === null) return null;
  if (n === 3) return { kind: 'h3', label: 'Due in 3 days', days: n };
  if (n === 0) return { kind: 'today', label: 'Due today', days: n };
  if (n < 0 && (-n) % 3 === 0) return { kind: 'overdue', label: `${-n} days overdue`, days: n };
  return null;
}

/** Siapa yang diingatkan untuk satu aksi: training → karyawan, mentoring/coaching → mentor, lainnya → atasan langsung. */
export function reminderRecipient(plan, item) {
  if (item.jenis === 'training') return { email: plan.email || '', nama: plan.nama || plan.nik, role: 'Employee' };
  if (['mentoring', 'coaching'].includes(item.jenis) && item.mentorEmail) return { email: item.mentorEmail, nama: item.mentorNama || item.mentorEmail, role: item.jenis === 'coaching' ? 'Coach' : 'Mentor' };
  return { email: plan.atasanEmail || '', nama: plan.atasanNama || plan.atasanNik || '', role: 'Manager' };
}

/**
 * Daftar reminder hari ini, digabung per penerima (satu pesan per orang).
 * plans: developmentPlans; updatesByPlan: { planId: [idpUpdates] }; attemptsFor: plan => attempts karyawan itu.
 * → [{ email, nama, role, items: [{ plan, item, reason }], approvals: [{ plan, days }] }]
 */
export function computeReminders({ plans, updatesByPlan = {}, attemptsFor = () => [], today = new Date() }) {
  const byEmail = new Map();
  const box = (r) => {
    const key = (r.email || '').toLowerCase() || `(no email) ${r.nama}`;
    if (!byEmail.has(key)) byEmail.set(key, { email: r.email || '', nama: r.nama, role: r.role, items: [], approvals: [] });
    return byEmail.get(key);
  };
  (plans || []).forEach(plan => {
    const appr = planApproval(plan);
    if (appr.status === 'pending' && appr.submittedAt) {
      const waited = -daysUntil(appr.submittedAt, today);
      if (waited >= 3 && waited % 3 === 0) box({ email: plan.atasanEmail, nama: plan.atasanNama || plan.atasanNik || '-', role: 'Manager' }).approvals.push({ plan, days: waited });
    }
    if (appr.status !== 'approved') return;
    const ups = updatesByPlan[planIdOf(plan)] || [];
    const att = attemptsFor(plan);
    (plan.items || []).forEach(item => {
      const st = itemProgress(item, att, ups).status;
      if (st === 'selesai' || st === 'batal') return;
      const reason = reminderReason(item.targetTanggal, today);
      if (reason) box(reminderRecipient(plan, item)).items.push({ plan, item, reason });
    });
  });
  return [...byEmail.values()].filter(r => r.items.length || r.approvals.length);
}

/** Teks email reminder (dipakai tombol "Open in Outlook"). */
export function reminderEmail(r, tmsUrl) {
  const lines = [`Halo ${r.nama},`, '', 'Berikut pengingat IDP (Individual Development Plan) yang perlu Anda tindak lanjuti:', ''];
  if (r.approvals.length) {
    lines.push('IDP menunggu persetujuan Anda:');
    r.approvals.forEach(a => lines.push(`- ${a.plan.nama} (${periodeLabelId(a.plan.periode)}) — menunggu ${a.days} hari`));
    lines.push('');
  }
  if (r.items.length) {
    lines.push('Aksi pengembangan:');
    const why = { h3: 'jatuh tempo 3 hari lagi', today: 'jatuh tempo hari ini', overdue: 'lewat target' };
    r.items.forEach(({ plan, item, reason }) => {
      const what = item.jenis === 'training' ? (item.judul || 'Training') : (item.deskripsi || IDP_JENIS_ID[item.jenis]);
      const who = r.role === 'Employee' ? '' : `${plan.nama} — `;
      lines.push(`- ${who}${what} [${item.kompetensiNama || ''}] · target ${item.targetTanggal} (${why[reason.kind]}${reason.kind === 'overdue' ? ' ' + (-reason.days) + ' hari' : ''})`);
    });
    lines.push('');
  }
  lines.push(r.role === 'Employee' ? `Lanjutkan belajar di LMS: ${tmsUrl.replace(/tms\/?$/, '')}` : `Update progres di TMS: ${tmsUrl}`, '', 'Terima kasih,', 'Tim HR/OD');
  return { subject: `[Reminder IDP] ${r.approvals.length ? r.approvals.length + ' persetujuan, ' : ''}${r.items.length} aksi perlu ditindaklanjuti`, body: lines.join('\n') };
}
