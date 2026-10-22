// Definisi bersama untuk Kamus Kompetensi & Data Karyawan (Fase 1 TMS).
// Dipakai: admin-competencies.html, admin-employees.html, trainer-create-module.html.
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
