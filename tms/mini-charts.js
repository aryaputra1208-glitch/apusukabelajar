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
.dash-card { background: rgba(255,255,255,.62); border: 1px solid var(--border); border-radius: 16px; padding: 16px 18px 18px; min-width: 0; display: flex; flex-direction: column; }
.dash-card > :last-child { flex: 1; min-height: 0; }
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
.mc-vb { display: flex; gap: 10px; height: 100%; min-height: 170px; }
.mc-vb .col { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.mc-vb .ba { flex: 1; display: flex; align-items: flex-end; justify-content: center; padding-top: 34px; border-bottom: 1px solid rgba(120,120,128,.25); }
.mc-vb .bar { width: 100%; max-width: 46px; border-radius: 8px 8px 2px 2px; position: relative; }
.mc-vb .bar.zero { height: 0 !important; }
.mc-vb .bar em { position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%); font-style: normal; text-align: center; white-space: nowrap; line-height: 1.15; }
.mc-vb .bar em b { display: block; font-size: 12.5px; }
.mc-vb .bar em small { display: block; font-size: 10px; color: var(--text-3); font-weight: 500; }
.mc-vb .lb { height: 26px; font-size: 10.5px; color: var(--text-3); margin: 6px -4px 0; text-align: center; line-height: 1.2; overflow: visible; }
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
  const m = Math.max(...cols.map(c => c.v), 0), tot = cols.reduce((n, c) => n + c.v, 0);
  if (!m) return empty('No data for this filter.');
  // label di bawah selalu 2 baris → semua batang berdiri di garis dasar yang sama
  return `<div class="mc-vb">${cols.map(c => `<div class="col"><div class="ba"><div class="bar ${c.v ? '' : 'zero'}" style="height:${c.v / m * 100}%; background:${c.color};" title="${esc(c.label)}: ${c.v}">
    <em><b>${c.v}</b>${c.v ? `<small>${Math.round(c.v / tot * 100)}%</small>` : ''}</em></div></div><div class="lb">${esc(c.label)}</div></div>`).join('')}</div>`;
}

export const avg = arr => { const v = arr.filter(x => x != null && !isNaN(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
export const f2 = n => n == null ? '-' : (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');

/* ===== Kurva normal (histogram + kurva normal hasil fit + zona rating) ===== */
const BC_CSS = `
.bc-wrap { display: grid; grid-template-columns: minmax(0, 2.2fr) minmax(240px, 1fr); gap: 22px; align-items: start; }
.bc-svg { width: 100%; height: auto; display: block; overflow: visible; }
.bc-svg text { font-family: inherit; }
.bc-stats { display: flex; gap: 18px; flex-wrap: wrap; font-size: 12px; color: var(--text-3); margin-top: 8px; }
.bc-stats b { color: var(--text); font-size: 13px; }
.bc-tbl { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.bc-tbl th { text-align: right; font-size: 11px; color: var(--text-3); font-weight: 600; padding: 0 0 6px; }
.bc-tbl th:first-child, .bc-tbl td:first-child { text-align: left; }
.bc-tbl td { padding: 7px 0; border-top: 1px solid var(--border); text-align: right; }
.bc-tbl i { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 7px; vertical-align: 0; }
.bc-diff { font-size: 11px; font-weight: 700; margin-left: 6px; }
@media (max-width: 1000px) { .bc-wrap { grid-template-columns: 1fr; } }
`;
if (!document.getElementById('mini-charts-bc-css')) { const st = document.createElement('style'); st.id = 'mini-charts-bc-css'; st.textContent = BC_CSS; document.head.appendChild(st); }

const erf = x => { // Abramowitz-Stegun 7.1.26
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
};
const ncdf = (x, mu, sd) => 0.5 * (1 + erf((x - mu) / (sd * Math.SQRT2)));
const nf = (v, d = 2) => v == null || isNaN(v) ? '-' : v.toFixed(d).replace('.', ',');

/**
 * scores: angka Skor Final; bands: [{ label, min, color }] urut naik (min = batas bawah zona)
 * opts: { lo = 1, hi = 5, step = 0.2 }
 */
export function bellCurve(scores, bands, opts = {}) {
  const lo = opts.lo ?? 1, hi = opts.hi ?? 5, step = opts.step ?? 0.2;
  const xs = scores.filter(v => v != null && !isNaN(v)).map(v => Math.min(hi, Math.max(lo, +v)));
  const n = xs.length;
  if (!n) return empty('No data for this filter.');
  const mu = xs.reduce((a, b) => a + b, 0) / n;
  const sd = n > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - mu) ** 2, 0) / (n - 1)) : 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const med = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const skew = n > 2 && sd > 0 ? xs.reduce((a, b) => a + ((b - mu) / sd) ** 3, 0) / n : 0;

  // histogram
  const nb = Math.round((hi - lo) / step);
  const bins = Array.from({ length: nb }, (_, i) => ({ x0: lo + i * step, c: 0 }));
  xs.forEach(v => { const i = Math.min(nb - 1, Math.floor((v - lo) / step + 1e-9)); bins[i].c++; });
  const pdf = x => sd > 0 ? Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI)) : 0;
  const curveAt = x => n * step * pdf(x);
  const curveMax = sd > 0 ? curveAt(mu) : 0;
  const cMax = Math.max(1, ...bins.map(b => b.c), curveMax);
  const tickStep = Math.max(1, Math.ceil(cMax / 4)), nTicks = Math.ceil(cMax / tickStep);
  const yMax = nTicks * tickStep * 1.22; // ruang di atas untuk label Mean

  // geometri
  const W = 720, H = 270, L = 34, R = 10, T = 30, B = 30, pw = W - L - R, ph = H - T - B;
  const X = v => L + (v - lo) / (hi - lo) * pw, Y = c => T + ph - c / yMax * ph;
  const bandOf = v => { let b = bands[0]; bands.forEach(x => { if (v >= x.min - 1e-9) b = x; }); return b; };
  const zones = bands.map((b, i) => ({ ...b, a: Math.max(lo, i ? b.min : lo), z: Math.min(hi, bands[i + 1] ? bands[i + 1].min : hi) })).filter(z => z.z > z.a);
  const actual = zones.map(z => xs.filter(v => bandOf(v).label === z.label).length);
  const expected = zones.map((z, i) => sd > 0 ? (ncdf(i === zones.length - 1 ? Infinity : z.z, mu, sd) - ncdf(i === 0 ? -Infinity : z.a, mu, sd)) * 100 : null);

  let svg = `<svg class="bc-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Final score distribution with normal curve">`;
  // zona rating
  zones.forEach((z, i) => {
    svg += `<rect x="${X(z.a)}" y="${T}" width="${X(z.z) - X(z.a)}" height="${ph}" fill="${z.color}" opacity="0.07"/>`;
    if (i) svg += `<line x1="${X(z.a)}" x2="${X(z.a)}" y1="${T}" y2="${T + ph}" stroke="${z.color}" stroke-opacity=".35" stroke-dasharray="3 3"/>`;
    const cx = (X(z.a) + X(z.z)) / 2, wide = X(z.z) - X(z.a) > 70;
    svg += `<text x="${cx}" y="${T - 15}" text-anchor="middle" font-size="${wide ? 11 : 9.5}" font-weight="700" fill="${z.color}">${esc(z.label)}</text>
            <text x="${cx}" y="${T - 3}" text-anchor="middle" font-size="10.5" fill="currentColor" opacity=".65">${Math.round(actual[i] / n * 100)}%</text>`;
  });
  // grid & sumbu
  for (let k = 0; k <= nTicks; k++) { const c = k * tickStep, y = Y(c); svg += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="currentColor" stroke-opacity=".07"/><text x="${L - 6}" y="${y + 3.5}" text-anchor="end" font-size="10" fill="currentColor" opacity=".45">${Math.round(c)}</text>`; }
  for (let v = Math.ceil(lo); v <= hi; v++) svg += `<text x="${X(v)}" y="${H - 10}" text-anchor="middle" font-size="11" fill="currentColor" opacity=".6">${v}</text><line x1="${X(v)}" x2="${X(v)}" y1="${T + ph}" y2="${T + ph + 4}" stroke="currentColor" stroke-opacity=".3"/>`;
  svg += `<line x1="${L}" x2="${W - R}" y1="${T + ph}" y2="${T + ph}" stroke="currentColor" stroke-opacity=".3"/>`;
  // histogram
  bins.forEach(b => { if (!b.c) return; const x = X(b.x0) + 1.5, w = X(b.x0 + step) - X(b.x0) - 3, col = bandOf(b.x0 + step / 2).color;
    svg += `<rect x="${x}" y="${Y(b.c)}" width="${w}" height="${T + ph - Y(b.c)}" rx="3" fill="${col}" opacity=".78"><title>${nf(b.x0)}–${nf(b.x0 + step)}: ${b.c} people</title></rect>`; });
  // kurva normal
  if (sd > 0) {
    let d = ''; for (let k = 0; k <= 160; k++) { const v = lo + (hi - lo) * k / 160; d += `${k ? 'L' : 'M'}${X(v).toFixed(1)},${Y(curveAt(v)).toFixed(1)}`; }
    svg += `<path d="${d}" fill="none" stroke="#E6007A" stroke-width="2.5" stroke-linejoin="round"/>`;
    [-1, 1].forEach(k => { const v = mu + k * sd; if (v > lo && v < hi) svg += `<line x1="${X(v)}" x2="${X(v)}" y1="${Y(curveAt(v))}" y2="${T + ph}" stroke="#E6007A" stroke-opacity=".45" stroke-dasharray="2 3"/><text x="${X(v)}" y="${Y(curveAt(v)) - 5}" text-anchor="middle" font-size="9.5" fill="#E6007A" opacity=".8">${k < 0 ? '−1σ' : '+1σ'}</text>`; });
  }
  // garis rata-rata
  svg += `<line x1="${X(mu)}" x2="${X(mu)}" y1="${T + 2}" y2="${T + ph}" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 3" opacity=".7"/>
          <rect x="${X(mu) - 34}" y="${T + 6}" width="68" height="17" rx="8" fill="currentColor" opacity=".85"/>
          <text x="${X(mu)}" y="${T + 18}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff">Mean ${nf(mu)}</text>`;
  svg += `</svg>`;

  const tbl = `<table class="bc-tbl"><thead><tr><th>Rating</th><th>People</th><th>Actual</th><th title="Share expected if scores followed the normal curve">Normal curve</th></tr></thead><tbody>
    ${zones.map((z, i) => { const a = actual[i] / n * 100, e = expected[i], d = e == null ? null : a - e;
      return `<tr><td><i style="background:${z.color}"></i>${esc(z.label)}</td><td>${actual[i]}</td><td><b>${Math.round(a)}%</b></td>
        <td>${e == null ? '-' : Math.round(e) + '%'}${d != null && Math.abs(d) >= 5 ? `<span class="bc-diff" style="color:${d > 0 ? '#B45309' : '#2563EB'}">${d > 0 ? '+' : ''}${Math.round(d)}</span>` : ''}</td></tr>`; }).reverse().join('')}
    </tbody></table>`;

  return `<div class="bc-wrap"><div>${svg}
      <div class="bc-stats"><span>People <b>${n}</b></span><span>Mean <b>${nf(mu)}</b></span><span>Median <b>${nf(med)}</b></span><span>SD <b>${nf(sd)}</b></span><span>Skew <b>${nf(skew)}</b></span>
        <span><i style="display:inline-block; width:14px; height:3px; background:#E6007A; vertical-align:3px; margin-right:5px; border-radius:2px;"></i>normal curve</span></div></div>
    <div>${tbl}</div></div>`;
}
