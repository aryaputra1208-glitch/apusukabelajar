// Ikon inline SVG (bukan webfont, bukan emoji) — sumber: Tabler Icons (MIT license),
// ditempel langsung supaya TIDAK bergantung ke CDN font eksternal manapun.
// Dipakai: icon('nama', { size: 18, className: '...' }) -> string SVG siap di-inject ke innerHTML.

const RAW = {
  settings: '<path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"/><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/>',
  user: '<path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"/><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/>',
  'user-check': '<path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"/><path d="M6 21v-2a4 4 0 0 1 4 -4h3.5"/><path d="M15 19l2 2l4 -4"/>',
  'file-text': '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"/><path d="M9 9h1"/><path d="M9 13h6"/><path d="M9 17h6"/>',
  'file-off': '<path d="M12.5 3h-6.5a2 2 0 0 0 -2 2v14c0 .551 .223 1.05 .584 1.412"/><path d="M21 16.008v-6.008l-5 -5h-4"/><path d="M3 3l18 18"/>',
  link: '<path d="M9 15l6 -6"/><path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464"/><path d="M13 18l-.463 .536a5 5 0 0 1 -7.071 -7.072l.534 -.464"/>',
  plus: '<path d="M12 5l0 14"/><path d="M5 12l14 0"/>',
  trash: '<path d="M4 7l16 0"/><path d="M10 11l0 6"/><path d="M14 11l0 6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/>',
  check: '<path d="M5 12l5 5l10 -10"/>',
  x: '<path d="M18 6l-12 12"/><path d="M6 6l12 12"/>',
  upload: '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"/><path d="M7 9l5 -5l5 5"/><path d="M12 4l0 12"/>',
  'lock-open': '<path d="M5 11m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z"/><path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0"/><path d="M8 11v-4a4 4 0 0 1 7.601 -1.75"/>',
  lock: '<path d="M5 11m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z"/><path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0"/><path d="M8 11v-5a4 4 0 0 1 8 0v5"/>',
  'chevron-down': '<path d="M6 9l6 6l6 -6"/>',
  search: '<path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/><path d="M21 21l-6 -6"/>',
  home: '<path d="M5 12l-2 0l9 -9l9 9l-2 0"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7"/><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6"/>',
  books: '<path d="M5 4h4a3 3 0 0 1 3 3v13a2 2 0 0 0 -2 -2h-5v-14a1 1 0 0 1 1 -1z"/><path d="M19 4h-4a3 3 0 0 0 -3 3v13a2 2 0 0 1 2 -2h5v-14a1 1 0 0 0 -1 -1z"/>',
  users: '<path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"/>',
  'chart-bar': '<path d="M3 3v18h18"/><path d="M20 18v3"/><path d="M16 16v5"/><path d="M12 13v8"/><path d="M8 16v5"/>',
  'layout-grid': '<path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M14 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/>',
  'player-play': '<path d="M7 4v16l13 -8z"/>',
  sparkles: '<path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z"/><path d="M3 6l1 0"/><path d="M17 4l0 2"/><path d="M4 8l0 -2"/><path d="M11 10l-1 1"/><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>',
  'arrow-right': '<path d="M5 12l14 0"/><path d="M13 18l6 -6"/><path d="M13 6l6 6"/>',
  inbox: '<path d="M4 4m0 1a1 1 0 0 1 1 -1h14a1 1 0 0 1 1 1v0a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1z" transform="translate(0 -1)" opacity="0"/><path d="M4 12l4 0l2 3l4 0l2 -3l4 0"/><path d="M5.45 5.11l-2.45 6.89v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2 -2v-6l-2.45 -6.89a2 2 0 0 0 -1.9 -1.11h-9.3a2 2 0 0 0 -1.9 1.11z"/>',
  'device-floppy': '<path d="M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2"/><path d="M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M14 4l0 4l-6 0l0 -4"/>',
  refresh: '<path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/>',
};

export function iconSvg(name, { size = 18, className = '', stroke = 2 } = {}) {
  const path = RAW[name];
  if (!path) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}
