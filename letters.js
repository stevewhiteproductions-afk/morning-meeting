/* Letter recognizer for the Letter of the Day slide.
   Two complementary matchers, combined:
   1. $P point-cloud matching (Vatavu, Anthony & Wobbrock 2012) – ignores stroke order, direction and count.
   2. Chamfer matching on a small bitmap – compares the overall drawn shape, forgiving wobbly lines.
   Templates cover the common ways children finger-draw each letter (upper and lower case), and each one
   is pre-stretched / slanted a little so narrow, wide and tilted writing all have a close match.
   Output is case-insensitive: 'a' and 'A' both mean letter A. */
(function () {
  'use strict';
  const N = 40;          // points per glyph for $P
  const G = 24;          // bitmap size for chamfer

  // ---- template helpers (0..100 box, y down; angles in degrees, 0 = right, 90 = down) ----
  const arc = (cx, cy, rx, ry, a0, a1, steps) => {
    steps = steps || Math.max(8, Math.round(Math.abs(a1 - a0) / 12));
    const out = [];
    for (let i = 0; i <= steps; i++) {
      const a = (a0 + (a1 - a0) * i / steps) * Math.PI / 180;
      out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return out;
  };
  const S = (...parts) => { const out = []; parts.forEach(p => Array.isArray(p[0]) ? out.push(...p) : out.push(p)); return out; };
  const ell = (cx, cy, rx, ry) => arc(cx, cy, rx, ry, -90, 270, 30);

  const T = {
    A: [[S([0, 100], [50, 0], [100, 100]), S([22, 60], [78, 60])],
        [S([5, 100], [50, 0]), S([50, 0], [95, 100]), S([25, 58], [75, 58])],
        [S([0, 100], [35, 0], [65, 0], [100, 100]), S([18, 60], [82, 60])]],            // flat-topped A
    B: [[S([0, 0], [0, 100]), S([0, 0], [50, 0], arc(50, 25, 28, 25, -90, 90), [0, 50], [55, 50], arc(55, 75, 32, 25, -90, 90), [0, 100])],
        [S([0, 100], [0, 0], arc(20, 25, 45, 25, -90, 90), arc(20, 75, 50, 25, -90, 90), [0, 100])],    // one stroke, round bumps
        [S([0, 0], [0, 100]), arc(0, 25, 50, 25, -90, 90), arc(0, 75, 55, 25, -90, 90)]],
    C: [[arc(55, 50, 50, 50, -40, -320)], [arc(60, 50, 55, 50, -55, -305)]],
    D: [[S([0, 0], [0, 100]), S([0, 0], [35, 0], arc(35, 50, 60, 50, -90, 90), [0, 100])],
        [S([0, 0], [0, 100]), arc(0, 50, 95, 50, -90, 90)],                               // stem + one big bump
        [S([0, 100], [0, 0], arc(10, 50, 85, 50, -90, 90), [0, 100])]],
    E: [[S([90, 0], [0, 0], [0, 100], [90, 100]), S([0, 50], [75, 50])],
        [S([0, 0], [0, 100]), S([0, 0], [90, 0]), S([0, 50], [70, 50]), S([0, 100], [90, 100])]],
    F: [[S([90, 0], [0, 0], [0, 100]), S([0, 48], [70, 48])],
        [S([0, 0], [0, 100]), S([0, 0], [90, 0]), S([0, 48], [70, 48])]],
    G: [[S(arc(55, 50, 50, 50, -40, -360), [105, 50], [60, 50])], [S(arc(55, 50, 50, 50, -40, -360)), S([105, 55], [60, 55])],
        [S(arc(55, 50, 50, 50, -40, -355), [105, 100])],                                  // C with a stem going down
        [S(arc(55, 50, 50, 50, -40, -360), [60, 50])]],                                   // C curling in
    H: [[S([0, 0], [0, 100]), S([90, 0], [90, 100]), S([0, 50], [90, 50])]],
    I: [[S([50, 0], [50, 100])], [S([50, 0], [50, 100]), S([15, 0], [85, 0]), S([15, 100], [85, 100])]],
    J: [[S([70, 0], [70, 72], arc(40, 72, 30, 28, 0, 170))], [S([70, 0], [70, 72], arc(40, 72, 30, 28, 0, 170)), S([35, 0], [100, 0])],
        [S([60, 0], [60, 65], arc(30, 65, 30, 35, 0, 180))]],
    K: [[S([0, 0], [0, 100]), S([80, 0], [0, 58], [85, 100])], [S([0, 0], [0, 100]), S([80, 0], [0, 58]), S([25, 42], [85, 100])],
        [S([0, 0], [0, 100]), S([80, 0], [5, 50]), S([5, 50], [85, 100])]],
    L: [[S([0, 0], [0, 100], [70, 100])]],
    M: [[S([0, 100], [0, 0], [50, 65], [100, 0], [100, 100])], [S([0, 100], [15, 0], [50, 70], [85, 0], [100, 100])],
        [S([0, 100], [0, 0], [50, 100], [100, 0], [100, 100])],                           // middle reaches the bottom
        [S([0, 100], [0, 0]), S([0, 0], [50, 60], [100, 0]), S([100, 0], [100, 100])]],
    N: [[S([0, 100], [0, 0], [80, 100], [80, 0])], [S([0, 0], [0, 100]), S([0, 0], [80, 100]), S([80, 100], [80, 0])]],
    O: [[ell(50, 50, 45, 50)], [ell(50, 50, 50, 50)]],
    P: [[S([0, 100], [0, 0]), S([0, 0], [45, 0], arc(45, 25, 30, 25, -90, 90), [0, 50])],
        [S([0, 100], [0, 0], arc(0, 27, 60, 27, -90, 90))],                              // one stroke, round bowl
        [S([0, 0], [0, 100]), arc(0, 30, 65, 30, -90, 90)]],
    Q: [[ell(50, 50, 45, 50), S([55, 70], [100, 108])], [ell(50, 50, 45, 50), S([60, 85], [95, 115])]],
    R: [[S([0, 100], [0, 0]), S([0, 0], [45, 0], arc(45, 25, 30, 25, -90, 90), [0, 50], [80, 100])],
        [S([0, 100], [0, 0], arc(0, 27, 60, 27, -90, 90), [75, 100])],
        [S([0, 0], [0, 100]), arc(0, 27, 60, 27, -90, 90), S([10, 54], [80, 100])]],
    S: [[S(arc(50, 25, 38, 25, -20, -270), arc(50, 75, 38, 25, -90, 160))],
        [S(arc(50, 25, 40, 25, 0, -260), arc(45, 74, 42, 26, -80, 170))]],
    T: [[S([0, 0], [100, 0]), S([50, 0], [50, 100])]],
    U: [[S([0, 0], [0, 62], arc(45, 62, 45, 38, 180, 0), [90, 0])], [S(arc(45, 45, 45, 55, 180, 0))]],
    V: [[S([0, 0], [50, 100], [100, 0])], [S([0, 0], [42, 95], arc(50, 90, 9, 10, 150, 30), [100, 0])]],
    W: [[S([0, 0], [25, 100], [50, 25], [75, 100], [100, 0])], [S([0, 0], [20, 100], [50, 0], [80, 100], [100, 0])],
        [S([0, 0], arc(25, 70, 25, 30, 180, 0), arc(75, 70, 25, 30, 180, 0), [100, 0])]],
    X: [[S([0, 0], [100, 100]), S([100, 0], [0, 100])]],
    Y: [[S([0, 0], [50, 50]), S([100, 0], [50, 50], [50, 100])], [S([0, 0], [50, 50]), S([100, 0], [10, 100])],
        [S([0, 0], [50, 50], [100, 0]), S([50, 50], [50, 100])]],
    Z: [[S([0, 0], [100, 0], [0, 100], [100, 100])], [S([0, 0], [100, 0]), S([100, 0], [0, 100]), S([0, 100], [100, 100])]],
    // lowercase variants (mapped to the same letters)
    a: [[ell(40, 68, 36, 30), S([76, 38], [76, 100])], [S(arc(40, 68, 36, 30, -10, -370), [76, 40], [76, 100])],
        [S(arc(45, 22, 35, 20, -160, 0), [80, 100]), ell(45, 72, 35, 26)], [ell(40, 50, 40, 45), S([82, 5], [82, 100])]],
    b: [[S([0, 0], [0, 100]), ell(35, 70, 35, 30)], [S([0, 0], [0, 100], arc(30, 70, 30, 30, 180, -180))]],
    d: [[ell(38, 70, 36, 30), S([75, 0], [75, 100])], [S(arc(40, 70, 36, 30, 0, -360), [76, 0], [76, 100])]],
    e: [[S([5, 68], [90, 68], arc(48, 68, 43, 32, 0, -320))], [S([5, 55], [90, 55], arc(48, 55, 43, 45, 0, -320))]],
    f: [[S(arc(70, 22, 28, 22, -10, -180), [42, 22], [42, 100]), S([15, 48], [75, 48])]],
    g: [[ell(40, 32, 35, 28), S([75, 5], [75, 85], arc(45, 85, 30, 18, 0, 160))], [ell(40, 30, 38, 28), S([78, 5], [78, 75], arc(48, 75, 30, 25, 0, 170))]],
    h: [[S([0, 0], [0, 100]), S([0, 62], arc(35, 62, 35, 25, 180, 360), [70, 100])], [S([0, 0], [0, 100], [0, 62], arc(35, 62, 35, 25, 180, 360), [70, 100])]],
    i: [[S([50, 35], [50, 100]), S([50, 8], [51, 12])]],
    j: [[S([60, 35], [60, 95], arc(38, 95, 22, 15, 0, 170)), S([60, 8], [61, 12])]],
    k: [[S([0, 0], [0, 100]), S([65, 38], [0, 72], [70, 100])]],
    m: [[S([0, 40], [0, 100]), S([0, 58], arc(22, 58, 22, 16, 180, 360), [44, 100]), S([44, 58], arc(66, 58, 22, 16, 180, 360), [88, 100])],
        [S([0, 100], [0, 40], arc(22, 55, 22, 15, 180, 360), [44, 100], [44, 55], arc(66, 55, 22, 15, 180, 360), [88, 100])]],
    n: [[S([0, 40], [0, 100]), S([0, 62], arc(35, 62, 35, 22, 180, 360), [70, 100])], [S([0, 100], [0, 40], [0, 60], arc(35, 60, 35, 22, 180, 360), [70, 100])]],
    p: [[S([0, 30], [0, 100]), ell(30, 48, 30, 18)]],
    q: [[ell(35, 48, 32, 18), S([68, 30], [68, 100])]],
    r: [[S([0, 40], [0, 100]), S([0, 62], arc(35, 62, 35, 22, 180, 310))], [S([0, 100], [0, 40], [0, 60], arc(35, 60, 35, 22, 180, 315))]],
    t: [[S([40, 0], [40, 82], arc(60, 82, 20, 16, 180, 60)), S([10, 30], [75, 30])], [S([40, 0], [40, 100]), S([5, 35], [75, 35])]],
    u: [[S([0, 40], [0, 75], arc(35, 75, 35, 25, 180, 0), [70, 40]), S([70, 40], [70, 100])], [S([0, 40], [0, 75], arc(35, 75, 35, 25, 180, 0), [70, 40], [70, 100])]],
    y: [[S([0, 0], [50, 55]), S([100, 0], [20, 100])], [S([0, 0], [0, 40], arc(35, 40, 35, 25, 180, 0)), S([70, 0], [70, 85], arc(40, 85, 30, 15, 0, 160))]]
  };

  // ---- shared geometry ----
  const pathLen = pts => { let d = 0; for (let i = 1; i < pts.length; i++) if (pts[i].id === pts[i - 1].id) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return d; };
  function resample(pts, n) {
    const I = pathLen(pts) / (n - 1); let D = 0;
    if (!I) return Array.from({ length: n }, () => ({ ...pts[0] }));
    const src = pts.map(p => ({ ...p })), out = [{ ...src[0] }];
    for (let i = 1; i < src.length; i++) {
      if (src[i].id !== src[i - 1].id) continue;
      const d = Math.hypot(src[i].x - src[i - 1].x, src[i].y - src[i - 1].y);
      if (D + d >= I) {
        const t = (I - D) / d, q = { x: src[i - 1].x + t * (src[i].x - src[i - 1].x), y: src[i - 1].y + t * (src[i].y - src[i - 1].y), id: src[i].id };
        out.push(q); src.splice(i, 0, q); D = 0;
      } else D += d;
    }
    while (out.length < n) out.push({ ...src[src.length - 1] });
    return out.slice(0, n);
  }
  function bbox(strokes) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    strokes.forEach(s => s.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }));
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  }
  // drop tiny accidental marks (but keep dots on i / j)
  function tidy(strokes) {
    const b = bbox(strokes), big = Math.max(b.w, b.h) || 1;
    return strokes.filter(s => { const sb = bbox([s]); return s.length > 0 && (Math.max(sb.w, sb.h) > big * 0.04 || strokes.length <= 3); });
  }

  // ---- $P ----
  function cloud(strokes) {
    let pts = [];
    strokes.forEach((s, id) => s.forEach(p => pts.push({ x: p[0], y: p[1], id })));
    strokes.forEach((s, id) => { if (s.length === 1) pts.push({ x: s[0][0] + 1, y: s[0][1] + 1, id }); });
    pts = resample(pts, N);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
    const sc = Math.max(maxX - minX, maxY - minY) || 1;
    pts.forEach(p => { p.x = (p.x - minX) / sc; p.y = (p.y - minY) / sc; });
    const cx = pts.reduce((a, p) => a + p.x, 0) / N, cy = pts.reduce((a, p) => a + p.y, 0) / N;
    pts.forEach(p => { p.x -= cx; p.y -= cy; });
    return pts;
  }
  function cloudDist(a, b, start, cutoff) {
    const matched = new Uint8Array(N); let sum = 0, i = start;
    do {
      let best = Infinity, idx = -1;
      for (let j = 0; j < N; j++) if (!matched[j]) { const dx = a[i].x - b[j].x, dy = a[i].y - b[j].y, d = dx * dx + dy * dy; if (d < best) { best = d; idx = j; } }
      matched[idx] = 1;
      sum += (1 - ((i - start + N) % N) / N) * Math.sqrt(best);
      if (sum > cutoff) return sum;
      i = (i + 1) % N;
    } while (i !== start);
    return sum;
  }
  function pDist(a, b, cutoff) {
    const step = Math.floor(Math.sqrt(N)); let min = cutoff;
    for (let i = 0; i < N; i += step) { min = Math.min(min, cloudDist(a, b, i, min), cloudDist(b, a, i, min)); }
    return min;
  }

  // ---- chamfer on a small bitmap ----
  function raster(strokes) {
    const b = bbox(strokes), sc = (G - 5) / (Math.max(b.w, b.h) || 1);
    const ox = (G - b.w * sc) / 2 - b.x0 * sc, oy = (G - b.h * sc) / 2 - b.y0 * sc;
    const on = new Uint8Array(G * G);
    const plot = (x, y) => { const ix = Math.round(x), iy = Math.round(y); if (ix >= 0 && iy >= 0 && ix < G && iy < G) on[iy * G + ix] = 1; };
    strokes.forEach(s => {
      if (s.length === 1) plot(s[0][0] * sc + ox, s[0][1] * sc + oy);
      for (let i = 1; i < s.length; i++) {
        const ax = s[i - 1][0] * sc + ox, ay = s[i - 1][1] * sc + oy, bx = s[i][0] * sc + ox, by = s[i][1] * sc + oy;
        const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 2));
        for (let k = 0; k <= n; k++) plot(ax + (bx - ax) * k / n, ay + (by - ay) * k / n);
      }
    });
    // distance transform (two-pass chamfer 3-4)
    const dt = new Float32Array(G * G);
    for (let i = 0; i < G * G; i++) dt[i] = on[i] ? 0 : 1e6;
    const at = (x, y) => (x < 0 || y < 0 || x >= G || y >= G) ? 1e6 : dt[y * G + x];
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
      const i = y * G + x; dt[i] = Math.min(dt[i], at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4);
    }
    for (let y = G - 1; y >= 0; y--) for (let x = G - 1; x >= 0; x--) {
      const i = y * G + x; dt[i] = Math.min(dt[i], at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4);
    }
    const idx = []; for (let i = 0; i < G * G; i++) if (on[i]) idx.push(i);
    return { dt, idx };
  }
  const half = (a, b) => { let s = 0; for (const i of a.idx) s += b.dt[i]; return s / (a.idx.length || 1) / 3; };
  const cDist = (a, b) => (half(a, b) + half(b, a)) / 2;

  // ---- build templates: every shape at a few widths and slants ----
  let LEARN_BONUS = 0.8;   // the class's own drawings count a little extra
  const P_SCALE = 0.86, C_SCALE = 0.56, SPLIT_PENALTY = 1.12;
  const WIDTHS = [0.7, 1, 1.35], SLANTS = [-0.18, 0, 0.18];
  const TEMPLATES = [];
  Object.keys(T).forEach(k => T[k].forEach(strokes => WIDTHS.forEach(w => SLANTS.forEach(sl => {
    const st = strokes.map(s => s.map(([x, y]) => [x * w + sl * (100 - y), y]));
    TEMPLATES.push({ letter: k.toUpperCase(), pts: cloud(st), ras: raster(st) });
  }))));

  // score every letter for one glyph (lower = better), blending the two matchers
  function scoreGlyph(strokes) {
    strokes = tidy(strokes);
    const pts = cloud(strokes), ras = raster(strokes);
    const bp = {}, bc = {};
    TEMPLATES.forEach(t => {
      const c = cDist(ras, t.ras) * (t.learned ? LEARN_BONUS : 1); if (bc[t.letter] == null || c < bc[t.letter]) bc[t.letter] = c;
    });
    // $P only for the most promising letters (fast)
    const shortlist = Object.keys(bc).sort((a, b) => bc[a] - bc[b]).slice(0, 12);
    TEMPLATES.forEach(t => {
      if (!shortlist.includes(t.letter)) return;
      const d = pDist(pts, t.pts, bp[t.letter] == null ? Infinity : bp[t.letter] / (t.learned ? LEARN_BONUS : 1)) * (t.learned ? LEARN_BONUS : 1);
      if (bp[t.letter] == null || d < bp[t.letter]) bp[t.letter] = d;
    });
    // absolute score: both distances scaled by their typical value for a good match (~1 each)
    const out = {};
    shortlist.forEach(L => { out[L] = (bp[L] / P_SCALE + bc[L] / C_SCALE) / 2; });
    return out;
  }
  // try reading the strokes as one letter, or as two side-by-side letters ("Aa"), and keep the best fit
  function recognize(strokes, boxWidth) {
    strokes = strokes.filter(s => s && s.length);
    if (!strokes.length) return [];
    const items = strokes.map(s => { const b = bbox([s]); return { s, x0: b.x0, x1: b.x1, cx: (b.x0 + b.x1) / 2 }; }).sort((a, b) => a.cx - b.cx);
    const all = bbox(strokes), tol = all.w * 0.12;
    const cache = new Map();
    const score = group => { const key = group.map(i => items.indexOf(i)).join(','); if (!cache.has(key)) cache.set(key, scoreGlyph(group.map(i => i.s))); return cache.get(key); };
    const hyps = [{ sc: score(items), glyphs: [items.map(i => i.s)] }];
    for (let k = 1; k < items.length && items.length <= 9; k++) {
      const L = items.slice(0, k), R = items.slice(k);
      const lx1 = Math.max(...L.map(i => i.x1)), rx0 = Math.min(...R.map(i => i.x0));
      if (lx1 > rx0 + tol) continue;                                  // the two halves overlap: not two letters
      const a = score(L), b = score(R), both = {};
      Object.keys(a).forEach(Lt => { if (b[Lt] != null) both[Lt] = (a[Lt] + b[Lt]) / 2 * SPLIT_PENALTY; });
      if (Object.keys(both).length) hyps.push({ sc: both, glyphs: [L.map(i => i.s), R.map(i => i.s)] });
    }
    const best = {};
    hyps.forEach(h => Object.keys(h.sc).forEach(L => { if (!best[L] || h.sc[L] < best[L].score) best[L] = { letter: L, score: h.sc[L], glyphs: h.glyphs }; }));
    return Object.values(best).sort((a, b) => a.score - b.score);
  }

  // ---- several drawings of the same letter (e.g. "Hh" + "H" + "h"): decide together ----
  function combine(lists) {
    lists = lists.filter(l => l && l.length);
    if (!lists.length) return [];
    const letters = new Set(); lists.forEach(l => l.forEach(r => letters.add(r.letter)));
    const out = [];
    letters.forEach(L => {
      let sum = 0;
      lists.forEach(l => { const r = l.find(x => x.letter === L); sum += r ? r.score : l[l.length - 1].score + 0.6; });
      out.push({ letter: L, score: sum / lists.length });
    });
    return out.sort((a, b) => a.score - b.score);
  }

  // ---- learning: drawings the class agreed on become extra templates ----
  function packGlyph(strokes) {          // shrink to a 0..100 box, few points per stroke, whole numbers
    const b = bbox(strokes), sc = 100 / (Math.max(b.w, b.h) || 1);
    return strokes.map(s => {
      const pts = s.map(([x, y]) => [Math.round((x - b.x0) * sc), Math.round((y - b.y0) * sc)]), out = [pts[0]];
      pts.forEach(p => { const q = out[out.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= 6) out.push(p); });
      if (out.length > 1 || pts.length === 1) { const last = pts[pts.length - 1]; if (out[out.length - 1] !== last) out.push(last); }
      return out;
    });
  }
  function addLearned(letter, glyph) {
    [0.85, 1, 1.18].forEach(w => {
      const st = glyph.map(s => s.map(([x, y]) => [x * w, y]));
      TEMPLATES.push({ letter, pts: cloud(st), ras: raster(st), learned: true });
    });
  }
  function setLearned(data) {
    for (let i = TEMPLATES.length - 1; i >= 0; i--) if (TEMPLATES[i].learned) TEMPLATES.splice(i, 1);
    Object.keys(data || {}).forEach(L => (data[L] || []).forEach(g => addLearned(L, g)));
  }
  const api = { recognize, combine, packGlyph, setLearned, _T: T, _bonus: v => { LEARN_BONUS = v; } };
  if (typeof window !== 'undefined') window.LetterRec = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
