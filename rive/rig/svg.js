// Reads meera-parts.svg into a tree, and turns SVG geometry into Rive geometry.
// Only what the parts file uses: g, defs, clipPath, path, circle, ellipse, rect,
// translate/rotate/scale transforms, and the path commands M L H V Q q C c Z.

// ---------- XML ----------
function parseXml(text) {
  text = text.replace(/<\?xml[\s\S]*?\?>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<metadata[\s\S]*?<\/metadata>/g, '');
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const re = /<\/?([a-zA-Z][\w:-]*)((?:\s+[\w:-]+\s*=\s*"[^"]*")*)\s*(\/?)>/g;
  let m;
  while ((m = re.exec(text))) {
    const [whole, tag, attrText, selfClose] = m;
    if (whole.startsWith('</')) {
      stack.pop();
      continue;
    }
    const attrs = {};
    for (const a of attrText.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) attrs[a[1]] = a[2];
    const el = { tag, attrs, children: [] };
    stack[stack.length - 1].children.push(el);
    if (!selfClose) stack.push(el);
  }
  return root.children[0];
}

// ---------- affine matrices: [a b c d e f], x' = a x + c y + e, y' = b x + d y + f ----------
const I = [1, 0, 0, 1, 0, 0];
const mul = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
const inv = (m) => {
  const det = m[0] * m[3] - m[1] * m[2];
  return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det];
};
const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const translate = (x, y) => [1, 0, 0, 1, x, y];
const rotateDeg = (deg) => {
  const r = (deg * Math.PI) / 180;
  return [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0];
};
const scale = (sx, sy = sx) => [sx, 0, 0, sy, 0, 0];

function parseTransform(t) {
  let m = I;
  if (!t) return m;
  for (const [, fn, args] of t.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const a = args.trim().split(/[\s,]+/).map(Number);
    if (fn === 'translate') m = mul(m, translate(a[0], a[1] ?? 0));
    else if (fn === 'scale') m = mul(m, scale(a[0], a[1] ?? a[0]));
    else if (fn === 'rotate') {
      if (a.length === 3) m = mul(m, mul(translate(a[1], a[2]), mul(rotateDeg(a[0]), translate(-a[1], -a[2]))));
      else m = mul(m, rotateDeg(a[0]));
    } else throw new Error(`Unsupported transform ${fn}`);
  }
  return m;
}

/** Splits a matrix into Rive's x, y, rotation (radians), scaleX, scaleY. No skew in these parts. */
function decompose(m) {
  const sx = Math.hypot(m[0], m[1]);
  const det = m[0] * m[3] - m[1] * m[2];
  const sy = det / sx;
  return { x: m[4], y: m[5], rotation: Math.atan2(m[1], m[0]), scaleX: sx, scaleY: sy };
}
/** The same decomposition, with a mirrored X read as scaleX -1 rather than a half turn. */
function decomposeMirror(m) {
  const det = m[0] * m[3] - m[1] * m[2];
  if (det < 0 && m[0] < 0) {
    const d = decompose(mul(m, scale(-1, 1)));
    return { ...d, scaleX: -d.scaleX };
  }
  return decompose(m);
}

// ---------- paths ----------
/** Absolute segments per subpath: { start, segs: [{ type: 'L'|'C', c1, c2, p }], closed }. */
function parsePath(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g);
  const subpaths = [];
  let i = 0, cmd = null, cur = [0, 0], start = [0, 0], sp = null;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const pt = () => {
      const x = num(), y = num();
      return rel ? [cur[0] + x, cur[1] + y] : [x, y];
    };
    if (C === 'M') {
      cur = pt(); start = cur;
      sp = { start: cur, segs: [], closed: false };
      subpaths.push(sp);
      cmd = rel ? 'l' : 'L'; // Extra pairs after M are lines.
    } else if (C === 'L') {
      const p = pt(); sp.segs.push({ type: 'L', p }); cur = p;
    } else if (C === 'H') {
      const x = num(); const p = [rel ? cur[0] + x : x, cur[1]]; sp.segs.push({ type: 'L', p }); cur = p;
    } else if (C === 'V') {
      const y = num(); const p = [cur[0], rel ? cur[1] + y : y]; sp.segs.push({ type: 'L', p }); cur = p;
    } else if (C === 'Q') {
      const q = pt(), p = pt();
      // Quadratic to cubic: handles two thirds of the way to the control point.
      const c1 = [cur[0] + (2 / 3) * (q[0] - cur[0]), cur[1] + (2 / 3) * (q[1] - cur[1])];
      const c2 = [p[0] + (2 / 3) * (q[0] - p[0]), p[1] + (2 / 3) * (q[1] - p[1])];
      sp.segs.push({ type: 'C', c1, c2, p }); cur = p;
    } else if (C === 'C') {
      const c1 = pt(), c2 = pt(), p = pt();
      sp.segs.push({ type: 'C', c1, c2, p }); cur = p;
    } else if (C === 'Z') {
      sp.closed = true; cur = start;
      continue;
    } else throw new Error(`Unsupported path command ${cmd}`);
  }
  return subpaths;
}

/**
 * Rive vertices for one subpath, with every point mapped through m.
 * Each vertex: { x, y, in: [x, y] | null, out: [x, y] | null } in the target space.
 */
function subpathVertices(sp, m) {
  const pts = [{ p: sp.start, in: null, out: null }];
  for (const s of sp.segs) {
    const last = pts[pts.length - 1];
    if (s.type === 'C') last.out = s.c1;
    pts.push({ p: s.p, in: s.type === 'C' ? s.c2 : null, out: null });
  }
  // A closed path that returns to its start: the last point is the first one.
  const first = pts[0], end = pts[pts.length - 1];
  if (sp.closed && pts.length > 1 && Math.hypot(end.p[0] - first.p[0], end.p[1] - first.p[1]) < 1e-6) {
    first.in = end.in;
    pts.pop();
  }
  return pts.map((v) => {
    const [x, y] = apply(m, v.p);
    return { x, y, in: v.in ? apply(m, v.in) : null, out: v.out ? apply(m, v.out) : null };
  });
}

/** Rotation and distance of a handle from its vertex, as Rive stores them. */
function handle(v, h) {
  if (!h) return { rotation: 0, distance: 0 };
  const dx = h[0] - v.x, dy = h[1] - v.y;
  return { rotation: Math.atan2(dy, dx), distance: Math.hypot(dx, dy) };
}

module.exports = { parseXml, parseTransform, decompose, decomposeMirror, parsePath, subpathVertices, handle, mul, inv, apply, translate, I };
