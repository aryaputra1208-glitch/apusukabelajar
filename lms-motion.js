/* =========================================================
   LMS & TMS — Motion: liquid-glass lens (kaca pembesar) + cahaya kartu
   Port dari OD Hub / JD Generator, warna disesuaikan untuk tema terang.
   - Sidebar admin: lensa mengikuti kursor (hover saja)
   - Tab (segmented control): lensa = knob aktif, meluncur antar pilihan
   - Baris tabel/daftar di dalam panel: lensa menggantikan hover datar
   - Kartu: cahaya lembut mengikuti kursor
   Hanya aktif di perangkat dengan mouse; menghormati "reduce motion".
   ========================================================= */
(function () {
  if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  function ensurePositioned(el) { if (getComputedStyle(el).position === 'static') el.style.position = 'relative'; }

  function lens(box, itemSel, activeSel, opts) {
    if (!box || box._rest) return;
    opts = opts || {};
    ensurePositioned(box);
    box.classList.add('lz');
    var L = document.createElement('div'); L.className = 'lens'; box.insertBefore(L, box.firstChild);
    var items = function () { return Array.prototype.slice.call(box.querySelectorAll(itemSel)); };
    function place(el, show) {
      if (!el || !el.offsetParent) { L.classList.remove('on'); return; }
      var b = box.getBoundingClientRect(), r = el.getBoundingClientRect();
      var appear = !L.classList.contains('on'); if (appear) L.style.transition = 'opacity .1s linear';
      L.style.width = r.width + 'px'; L.style.height = r.height + 'px';
      L.style.transform = 'translate(' + (r.left - b.left + box.scrollLeft) + 'px,' + (r.top - b.top + box.scrollTop) + 'px)';
      if (appear) { void L.offsetWidth; L.style.transition = ''; }
      L.classList.toggle('on', show !== false);
    }
    function mag(el) { items().forEach(function (x) { x.classList.add('li'); x.classList.toggle('mag', x === el); }); }
    function rest() {
      var a = activeSel ? box.querySelector(activeSel) : null; mag(null);
      if (opts.hoverOnly || !a) { L.classList.remove('on'); return; } place(a);
    }
    box.addEventListener('mouseover', function (e) { var it = e.target.closest(itemSel); if (!it || !box.contains(it)) return; place(it); mag(it); });
    box.addEventListener('mouseleave', rest);
    box.addEventListener('mousemove', function (e) {
      var r = L.getBoundingClientRect(); if (!r.width) return;
      L.style.setProperty('--mx', (e.clientX - r.left) + 'px'); L.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
    box.addEventListener('click', function () { setTimeout(rest, 0); });
    box._rest = rest;
    requestAnimationFrame(function () { L.style.transition = 'none'; rest(); void L.offsetWidth; L.style.transition = ''; });
  }
  function restAll() { document.querySelectorAll('.lz').forEach(function (b) { b._rest && b._rest(); }); }

  function setup() {
    lens(document.querySelector('.admin-sidebar'), 'a.as-item', null, { hoverOnly: true });
    document.querySelectorAll('.tabs').forEach(function (t) { lens(t, '.tab-btn', '.tab-btn.active'); });
  }

  /* ---- baris di dalam panel/kartu: satu lensa per panel, aman walau daftar di-render ulang ---- */
  var ROWS = '.data-table tbody tr, .u-row[data-email], .ah-row, .rec-row, .act, .gap-row, .comp-row, .ms-opt';
  var HOST = '.panel, .card, .ms-panel';
  var cur = null;
  function rowLens(host) {
    var L = host.querySelector(':scope>.lens.row');
    if (!L) { L = document.createElement('div'); L.className = 'lens row'; host.insertBefore(L, host.firstChild); host.classList.add('rows-lz'); ensurePositioned(host); }
    return L;
  }
  function placeRow(row) {
    var host = row.closest(HOST); if (!host) return;
    var L = rowLens(host);
    var b = host.getBoundingClientRect(), r = row.getBoundingClientRect();
    var pad = Math.min(8, Math.max(0, r.left - b.left - 4));
    var appear = !L.classList.contains('on'); if (appear) L.style.transition = 'opacity .1s linear';
    L.style.width = (r.width + pad * 2) + 'px'; L.style.height = r.height + 'px';
    L.style.transform = 'translate(' + (r.left - b.left - pad + host.scrollLeft) + 'px,' + (r.top - b.top + host.scrollTop) + 'px)';
    if (appear) { void L.offsetWidth; L.style.transition = ''; }
    L.classList.add('on'); if (cur && cur !== L) cur.classList.remove('on'); cur = L;
  }
  document.addEventListener('mouseover', function (e) {
    var row = e.target.closest && e.target.closest(ROWS);
    if (row && row.offsetHeight && row.closest(HOST)) { placeRow(row); return; }
    if (cur) { cur.classList.remove('on'); cur = null; }
  });

  /* ---- cahaya lembut yang mengikuti kursor di setiap kartu ---- */
  var G = '.card, .panel, .stat-card, .menu-card, .module-card, .kpi-card2, .score-card', raf = 0, ev = null;
  document.addEventListener('pointermove', function (e) {
    ev = e; if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0; var t = ev.target; if (!t.closest) return;
      var el = t.closest(G);
      if (el) { var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (ev.clientX - r.left) + 'px'); el.style.setProperty('--my', (ev.clientY - r.top) + 'px'); }
      if (cur) { var lr = cur.getBoundingClientRect(); cur.style.setProperty('--mx', (ev.clientX - lr.left) + 'px'); cur.style.setProperty('--my', (ev.clientY - lr.top) + 'px'); }
    });
  }, { passive: true });

  /* sidebar admin & tab dibuat setelah login/render → pasang lensa saat muncul */
  var pending = 0;
  new MutationObserver(function () { if (pending) return; pending = requestAnimationFrame(function () { pending = 0; setup(); }); })
    .observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('resize', restAll);
  document.addEventListener('DOMContentLoaded', function () { setup(); setTimeout(restAll, 600); });
  if (document.readyState !== 'loading') setup();
})();
