/* E-DITRENDUK V13 — shared UX layer: loading, offline/error feedback, safe actions, accessibility. */
(() => {
  'use strict';
  const root = document.documentElement;
  let pending = 0;
  const setBusy = value => {
    pending = Math.max(0, pending + value);
    root.classList.toggle('app-busy', pending > 0);
    root.setAttribute('aria-busy', pending > 0 ? 'true' : 'false');
  };
  window.addEventListener('editrenduk:request-start', () => setBusy(1));
  window.addEventListener('editrenduk:request-end', () => setBusy(-1));
  window.addEventListener('offline', () => window.ED?.toast('Koneksi terputus. Perubahan belum dapat dikirim ke server.'));
  window.addEventListener('online', () => window.ED?.toast('Koneksi kembali tersambung.'));

  document.addEventListener('click', event => {
    const close = event.target.closest('[data-close]');
    if (close) window.ED?.close(close.dataset.close);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.modal-wrap.open').forEach(modal => modal.classList.remove('open'));
  });

  const markEmptyTables = () => {
    document.querySelectorAll('tbody').forEach(body => {
      const table = body.closest('table');
      if (!table || body.children.length) return;
      const cols = table.querySelectorAll('thead th').length || 1;
      const row = document.createElement('tr');
      row.className = 'ux-empty-row';
      row.innerHTML = `<td colspan="${cols}"><div class="ux-empty"><strong>Belum ada data yang ditampilkan</strong><span>Coba ubah pencarian/filter atau tambahkan data baru.</span></div></td>`;
      body.appendChild(row);
    });
  };
  setTimeout(markEmptyTables, 500);

  document.querySelectorAll('button, a, input, select, textarea').forEach(el => {
    if (!el.getAttribute('aria-label') && el.title) el.setAttribute('aria-label', el.title);
  });
})();
