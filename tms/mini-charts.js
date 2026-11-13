/* =========================================================
   TMS — chart ringan (SVG/CSS, tanpa library) untuk dashboard admin:
   donut, bar horizontal, kolom vertikal. Dipakai Performance Data & Competency Profile.
   ========================================================= */
const CSS = `
.dash-grid { display: grid; gap: 16px; margin-bottom: 16px; }
.dash-grid.g3 { grid-template-columns: 1fr 1fr 1fr; }
.dash-grid.g2 { grid-template-columns: 1.4fr 1fr; }
.dash-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
.dk { background: rgba(255,255,255,.62); border: 1px solid var(--border); border-radius: 16px; padding: 16px 18px; }
.dk .n { font-size: 26px; font-weight: 700; color: var(--pink); font-family: var(--font-display); line-height: 1.15; }
.dk .l { font-size: 12.5px; font-weight: 600; margin-top: 2px; }
.dk .s { font-size: 11.5px; color: var(--text-3); margin-top: 3px; }
.dash-card { background: rgba(255,255,255,.62); border: 1px solid var(--border); border-radius: 16px; padding: 16px 18px 18px; min-width: 0; }
.dash-card h3 { margin: 0 0 2px; font-size: 14.5px; font-weight: 700; }
.dash-card .hint { font-size: 11.5px; color: var(--text-3); margin-bottom: 12px; }
.mc-donut { display: flex; align-items: center; gap: 18px; }
.mc-dn { position: relative; flex: none; }
.mc-dn .c { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; color: var(--text-3); }
.mc-dn .c b { font-size: 20px; color: var(--text); line-height: 1.1; }
.mc-lg { display: grid; gap: 6px; font-size: 12.5px; flex: 1; min-width: 0; }
.mc-lg div { display: flex; align-items: center; gap: 8px; }
.mc-lg i { width: 10px; height: 10px; border-radius: 3px; flex: none; }
.mc-lg b { margin-left: auto; }
.mc-hb { display: grid; gap: 9px; }
.mc-hb .r .t { display: flex; justify-content: space-between; gap: 10px; font-size: 12.5px; margin-bottom: 3px; }
.mc-hb .r .t span:first-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mc-hb .r .t span:last-child { flex: none; color: var(--text-3); }
.mc-hb .r .t b { color: var(--text); }
.mc-hb .trk { position: relative; height: 9px; border-radius: 99px; background: rgba(120,120,128,.13); }
.mc-hb .trk > span { display: block; height: 100%; border-radius: 99px; }
.mc-hb .trk .mk { position: absolute; top: -3px; bottom: -3px; width: 2px; background: var(--text); opacity: .55; border-radius: 2px; }
.mc-vb { display: flex; align-items: flex-end; gap: 10px; height: 150px; padding-top: 18px; }
.mc-vb .col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; min-width: 0; }
.mc-vb .bar { width: 100%; max-width: 46px; border-radius: 8px 8px 3px 3px; min-height: 2px; position: relative; }
.mc-vb .bar em { position: absolute; top: -17px; left: 50%; transform: translateX(-50%); font-style: normal; font-size: 11.5px; font-weight: 700; }
.mc-vb .lb { font-size: 10.5px; color: var(--text-3); margin-top: 6px; text-align: center; line-height: 1.2; }
.mc-empty { font-size: 12.5px; color: var(--text-3); padding: 18px 0; }
.dash-sec { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 28px 0 12px; flex-wrap: wrap; }
.dash-sec h2 { margin: 0; font-size: 18px; }
@media (max-width: 1000px) { .dash-grid.g3, .dash-grid.g2 { grid-template-columns: 1fr; } .dash-kpis { grid-template-columns: repeat(2, 1fr); } }
`;
if (!document.getElementById('mini-charts-css')) { const st = document.createElement('style'); st.id = 'mini-charts-css'; st.textContent = CSS; document.head.appendChild(st); }

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const PALETTE = ['#DC2626', '#F59E0B', '#3B82F6', '#16A34A', '#8B5CF6', '#E6007A', '#0EA5E9', '#64748B'];
export const empty = msg => `<div class="mc-empty">${esc(msg)}</div>`;

/** parts = [{ label, v, color }] */
export function donut(parts, center, size = 128) {
  const R = size / 2 - 10, C = 2 * Math.PI * R, tot = parts.reduce((n, x) => n + x.v, 0);
  if (!tot) return empty('No data for this filter.');
  let off = 0;
  const segs = parts.filter(x => x.v > 0).map(x => {
    const len = x.v / tot * C;
    const el = `<circle cx="${size/2}" cy="${size/2}" r="${R}" fill="none" stroke="${x.color}" stroke-width="16" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size/2} ${size/2})"><title>${esc(x.label)}: ${x.v}</title></circle>`;
    off += len; return el;
  }).join('');
  return `<div class="mc-donut"><div class="mc-dn" style="width:${size}px;height:${size}px;"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${R}" fill="none" stroke="rgba(120,120,128,.12)" stroke-width="16"/>${segs}</svg><div class="c">${center}</div></div>
    <div class="mc-lg">${parts.map(x => `<div><i style="background:${x.color}"></i>${esc(x.label)}<b>${x.v}</b></div>`).join('')}</div></div>`;
}

/** rows = [{ label, value, max, color, right (html), marker (0..max) }] */
export function hbars(rows, { max, marker } = {}) {
  if (!rows.length) return empty('No data for this filter.');
  const m = max || Math.max(...rows.map(r => r.value), 1);
  return `<div class="mc-hb">${rows.map(r => `<div class="r"><div class="t"><span title="${esc(r.label)}">${esc(r.label)}</span><span>${r.right ?? ''}</span></div>
    <div class="trk"><span style="width:${Math.max(0, Math.min(100, r.value / m * 100))}%; background:${r.color || 'var(--pink)'}"></span>${marker != null ? `<i class="mk" style="left:${marker / m * 100}%"></i>` : ''}</div></div>`).join('')}</div>`;
}

/** cols = [{ label, v, color }] */
export function vbars(cols) {
  const m = Math.max(...cols.map(c => c.v), 0);
  if (!m) return empty('No data for this filter.');
  return `<div class="mc-vb">${cols.map(c => `<div class="col"><div class="bar" style="height:${c.v / m * 100}%; background:${c.color};"><em>${c.v}</em></div><div class="lb">${esc(c.label)}</div></div>`).join('')}</div>`;
}

export const avg = arr => { const v = arr.filter(x => x != null && !isNaN(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
export const f2 = n => n == null ? '-' : (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
