/* =========================================================
   TMS — filter Level bersama.
   Pilihan level diingat selama sesi browser (sessionStorage), jadi ikut terbawa
   saat pindah menu: Dashboard, Employees, Performance Data, Competency Profile, IDP.
   ========================================================= */
export const LEVEL_ORDER = ['SVP', 'VP', 'Division Head', 'AVP', 'Department Head', 'Section Head', 'Supervisor', 'Coordinator', 'Leader', 'Staff', 'Admin'];
const KEY = 'tmsLevelFilter';
const NONE = '(No level)';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const getLevel = () => { try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; } };
export const setLevel = v => { try { v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY); } catch {} };
export const levelName = v => (v && String(v).trim()) || NONE;
export const sortLevels = arr => [...arr].sort((a, b) => {
  const ia = LEVEL_ORDER.indexOf(a), ib = LEVEL_ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || String(a).localeCompare(String(b));
});

/**
 * Isi <select> level dari daftar level yang ada di data, pilih level yang tersimpan.
 * Level tersimpan yang tidak ada di data tetap ditampilkan (supaya filter tidak diam-diam hilang).
 * @returns level yang sedang dipilih ('' = semua)
 */
export function fillLevelSelect(sel, levels) {
  const cur = getLevel();
  const list = sortLevels([...new Set([...levels.map(levelName), ...(cur ? [cur] : [])])]);
  sel.innerHTML = '<option value="">All levels</option>' + list.map(l => `<option ${l === cur ? 'selected' : ''}>${esc(l)}</option>`).join('');
  sel.value = cur;
  return cur;
}

/** Pasang handler: simpan pilihan lalu jalankan render. */
export function bindLevelSelect(sel, onChange) {
  sel.addEventListener('change', () => { setLevel(sel.value); onChange(); });
}

export const matchLevel = (level, cur) => !cur || levelName(level) === cur;
