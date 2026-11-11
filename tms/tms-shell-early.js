// Pasang sidebar TMS dari cache SEBELUM halaman pertama kali digambar (script biasa, bukan module),
// supaya pindah halaman tidak berkedip/terasa seperti membuka aplikasi baru.
// tms-shell.js nanti memverifikasi role & memperbarui isinya setelah login terbaca.
(function () {
  try {
    var c = JSON.parse(sessionStorage.getItem('tmsNavCache2') || 'null');
    if (!c || !c.html) return;
    var st = document.createElement('style'); st.id = 'tms-shell-css'; st.textContent = c.css; document.head.appendChild(st);
    var box = document.createElement('div'); box.innerHTML = c.html;
    var nav = box.firstElementChild;
    if (c.sig) nav.setAttribute('data-sig', c.sig);
    var cur = location.pathname.split('/').pop() || 'index.html';
    nav.querySelectorAll('a.as-item').forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === cur); });
    document.body.prepend(nav);
    document.body.classList.add('has-admin-sidebar');
  } catch (e) {}
})();
