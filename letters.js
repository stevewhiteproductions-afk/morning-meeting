/* Letter recognizer for the Letter of the Day slide.
   $P point-cloud recognizer (Vatavu, Anthony & Wobbrock 2012): stroke order and direction don't matter,
   which suits children's handwriting. Templates are built from simple stroke descriptions below.
   Output is case-insensitive: 'a' and 'A' both mean letter A. */
(function () {
  'use strict';
  const N = 48;

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
    A: [[S([0, 100], [50, 0], [100, 100]), S([22, 60], [78, 60])]],
    B: [[S([0, 0], [0, 100]), S([0, 0], [50, 0], arc(50, 25, 28, 25, -90, 90), [0, 50], [55, 50], arc(55, 75, 32, 25, -90, 90), [0, 100])]],
    C: [[arc(55, 50, 50, 50, -40, -320)]],
    D: [[S([0, 0], [0, 100]), S([0, 0], [35, 0], arc(35, 50, 60, 50, -90, 90), [0, 100])]],
    E: [[S([90, 0], [0, 0], [0, 100], [90, 100]), S([0, 50], [75, 50])]],
    F: [[S([90, 0], [0, 0], [0, 100]), S([0, 48], [70, 48])]],
    G: [[S(arc(55, 50, 50, 50, -40, -360), [105, 50], [60, 50])], [S(arc(55, 50, 50, 50, -40, -360)), S([105, 55], [60, 55])]],
    H: [[S([0, 0], [0, 100]), S([90, 0], [90, 100]), S([0, 50], [90, 50])]],
    I: [[S([50, 0], [50, 100])], [S([50, 0], [50, 100]), S([15, 0], [85, 0]), S([15, 100], [85, 100])]],
    J: [[S([70, 0], [70, 72], arc(40, 72, 30, 28, 0, 170))], [S([70, 0], [70, 72], arc(40, 72, 30, 28, 0, 170)), S([35, 0], [100, 0])]],
    K: [[S([0, 0], [0, 100]), S([80, 0], [0, 58], [85, 100])], [S([0, 0], [0, 100]), S([80, 0], [0, 58]), S([25, 42], [85, 100])]],
    L: [[S([0, 0], [0, 100], [70, 100])]],
    M: [[S([0, 100], [0, 0], [50, 65], [100, 0], [100, 100])], [S([0, 100], [15, 0], [50, 70], [85, 0], [100, 100])]],
    N: [[S([0, 100], [0, 0], [80, 100], [80, 0])]],
    O: [[ell(50, 50, 45, 50)]],
    P: [[S([0, 100], [0, 0]), S([0, 0], [45, 0], arc(45, 25, 30, 25, -90, 90), [0, 50])]],
    Q: [[ell(50, 50, 45, 50), S([55, 70], [100, 108])]],
    R: [[S([0, 100], [0, 0]), S([0, 0], [45, 0], arc(45, 25, 30, 25, -90, 90), [0, 50], [80, 100])]],
    S: [[S(arc(50, 25, 38, 25, -20, -270), arc(50, 75, 38, 25, -90, 160))]],
    T: [[S([0, 0], [100, 0]), S([50, 0], [50, 100])]],
    U: [[S([0, 0], [0, 62], arc(45, 62, 45, 38, 180, 0), [90, 0])]],
    V: [[S([0, 0], [50, 100], [100, 0])]],
    W: [[S([0, 0], [25, 100], [50, 25], [75, 100], [100, 0])]],
    X: [[S([0, 0], [100, 100]), S([100, 0], [0, 100])]],
    Y: [[S([0, 0], [50, 50]), S([100, 0], [50, 50], [50, 100])], [S([0, 0], [50, 50]), S([100, 0], [10, 100])]],
    Z: [[S([0, 0], [100, 0], [0, 100], [100, 100])]],
    // lowercase variants (mapped to the same letters)
    a: [[ell(40, 68, 36, 30), S([76, 38], [76, 100])], [S(arc(40, 68, 36, 30, -10, -370), [76, 40], [76, 100])],
        [S(arc(45, 22, 35, 20, -160, 0), [80, 100]), ell(45, 72, 35, 26)]],
    b: [[S([0, 0], [0, 100]), ell(35, 70, 35, 30)]],
    d: [[ell(38, 70, 36, 30), S([75, 0], [75, 100])]],
    e: [[S([5, 68], [90, 68], arc(48, 68, 43, 32, 0, -320))]],
    f: [[S(arc(70, 22, 28, 22, -10, -180), [42, 22], [42, 100]), S([15, 48], [75, 48])]],
    g: [[ell(40, 32, 35, 28), S([75, 5], [75, 85], arc(45, 85, 30, 18, 0, 160))]],
    h: [[S([0, 0], [0, 100]), S([0, 62], arc(35, 62, 35, 25, 180, 360), [70, 100])]],
    i: [[S([50, 35], [50, 100]), S([50, 8], [51, 12])]],
    j: [[S([60, 35], [60, 95], arc(38, 95, 22, 15, 0, 170)), S([60, 8], [61, 12])]],
    k: [[S([0, 0], [0, 100]), S([65, 38], [0, 72], [70, 100])]],
    m: [[S([0, 40], [0, 100]), S([0, 58], arc(22, 58, 22, 16, 180, 360), [44, 100]), S([44, 58], arc(66, 58, 22, 16, 180, 360), [88, 100])]],
    n: [[S([0, 40], [0, 100]), S([0, 62], arc(35, 62, 35, 22, 180, 360), [70, 100])]],
    p: [[S([0, 30], [0, 100]), ell(30, 48, 30, 18)]],
    q: [[ell(35, 48, 32, 18), S([68, 30], [68, 100])]],
    r: [[S([0, 40], [0, 100]), S([0, 62], arc(35, 62, 35, 22, 180, 310))]],
    t: [[S([40, 0], [40, 82], arc(60, 82, 20, 16, 180, 60)), S([10, 30], [75, 30])]],
    u: [[S([0, 40], [0, 75], arc(35, 75, 35, 25, 180, 0), [70, 40]), S([70, 40], [70, 100])]],
    y: [[S([0, 0], [50, 55]), S([100, 0], [20, 100])], [S([0, 0], [0, 40], arc(35, 40, 35, 25, 180, 0)), S([70, 0], [70, 85], arc(40, 85, 30, 15, 0, 160))]]
  };

  // ---- $P core ----
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
  function normalize(strokes) {
    let pts = [];
    strokes.forEach((s, id) => s.forEach(p => pts.push({ x: p[0], y: p[1], id })));
    // a single-point stroke (a dot) still needs length: nudge it
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
  function cloudDist(a, b, start) {
    const matched = new Array(N).fill(false); let sum = 0, i = start;
    do {
      let best = Infinity, idx = -1;
      for (let j = 0; j < N; j++) if (!matched[j]) { const d = Math.hypot(a[i].x - b[j].x, a[i].y - b[j].y); if (d < best) { best = d; idx = j; } }
      matched[idx] = true;
      sum += (1 - ((i - start + N) % N) / N) * best;
      i = (i + 1) % N;
    } while (i !== start);
    return sum;
  }
  function greedy(a, b) {
    const step = Math.floor(Math.pow(N, 0.5)); let min = Infinity;
    for (let i = 0; i < N; i += step) min = Math.min(min, cloudDist(a, b, i), cloudDist(b, a, i));
    return min;
  }
  const TEMPLATES = [];
  // each template in several widths, so skinny and wide handwriting both match
  const WIDTHS = [0.7, 1, 1.3];
  Object.keys(T).forEach(k => T[k].forEach(strokes => WIDTHS.forEach(w =>
    TEMPLATES.push({ letter: k.toUpperCase(), pts: normalize(strokes.map(st => st.map(([x, y]) => [x * w, y]))) }))));

  // score every letter (lower = better) for one glyph made of strokes [[ [x,y],... ], ...]
  function scoreGlyph(strokes) {
    const pts = normalize(strokes), best = {};
    TEMPLATES.forEach(t => { const d = greedy(pts, t.pts); if (best[t.letter] == null || d < best[t.letter]) best[t.letter] = d; });
    return best;
  }
  // split strokes into side-by-side glyphs (e.g. "Pp"), by horizontal gaps
  function clusters(strokes, gap) {
    const boxes = strokes.map(s => { const xs = s.map(p => p[0]); return { s, x0: Math.min(...xs), x1: Math.max(...xs) }; }).sort((a, b) => a.x0 - b.x0);
    const out = [];
    boxes.forEach(b => {
      const c = out[out.length - 1];
      if (c && b.x0 < c.x1 + gap) { c.strokes.push(b.s); c.x1 = Math.max(c.x1, b.x1); } else out.push({ strokes: [b.s], x0: b.x0, x1: b.x1 });
    });
    return out;
  }
  // recognise the letter written as one or two glyphs; returns ranked [{letter, score}]
  function recognize(strokes, boxWidth) {
    if (!strokes.length) return [];
    const cs = clusters(strokes, (boxWidth || 300) * 0.06).slice(0, 2);
    const total = {};
    cs.forEach(c => { const sc = scoreGlyph(c.strokes); Object.keys(sc).forEach(L => total[L] = (total[L] || 0) + sc[L] / cs.length); });
    return Object.keys(total).map(L => ({ letter: L, score: total[L] })).sort((a, b) => a.score - b.score);
  }
  window.LetterRec = { recognize };
})();
