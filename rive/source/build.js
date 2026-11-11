// Rebuilds Meera's rig inputs from rive/source (v2):
//   rive/parts/meera-parts.svg, rive/expressions.json, rive/reference/*.png,
//   rive/static/meera.svg and public/meera.svg.
// Run: node rive/source/build.js
const m = require('./meera.js'); const rig = require('./rig.js'); const fs = require('fs');
// playwright if installed, else playwright-core with the local Chrome (what the app repo has).
const { chromium } = (() => { try { return require('playwright'); } catch { const pw = require('playwright-core'); const launch = pw.chromium.launch.bind(pw.chromium); return { chromium: { launch: (o = {}) => launch({ executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ...o }) } }; } })();
const S = require('../rig/svg.js');
const out = __dirname + '/..'; fs.mkdirSync(out + '/reference', { recursive: true }); fs.mkdirSync(out + '/parts', { recursive: true });
const key = n => n.toLowerCase().replace(/\s+(\w)/g, (_, c) => c.toUpperCase());
const json = {
  about: "Meera's rig values (v2). Units are drawing px and degrees. The artboard is the 328 x 430 call tile; the whole drawing sits in group 'meera', offset by (-36, -30), and every pivot below is in the drawing's own coordinates inside that group. Values are offsets from the neutral pose in meera-parts.svg.",
  artboard: { width: rig.TILE.w, height: rig.TILE.h, drawingOffset: [-rig.TILE.x, -rig.TILE.y] },
  controls: {
    head: { rot: 'degrees around pivot 200 300, positive is clockwise' },
    turn: 'head turn, -1 to 1 (about ±4°). Drives the parallax values below; keep them in step',
    parallax: { features: 'tx', nose: 'tx', face: 'tx', hair_front: 'tx', hair_back: 'tx', ear_L: 'tx, sx (narrows when it is the far ear)', ear_R: 'tx, sx', rates: rig.PARALLAX },
    lock_L: { rot: 'degrees around 128 236: hair follow-through' }, lock_R: { rot: 'degrees around 272 236' },
    blush: { opacity: '0 to 1, applies to blush_L and blush_R' },
    brow_L: { ty: 'px, negative is up', rot: 'degrees around the brow pivot, world space', arch: '0 to 1 blend between brow shapes arch_min and arch_max' },
    lid_upper_L: { ty: 'px from neutral, positive is down. 42.32 is fully closed', rot: 'degrees around the lid pivot' },
    lid_lower_L: { ty: 'px, negative is up (cheek push)', line: 'opacity of lid_lower_line' },
    lash_flick_L: { ty: 'px' },
    pupil_L: { tx: 'px', ty: 'px', scale: 'around the pupil pivot' },
    eye_L: 'open | happy | closed: which of eye_open_L, eye_happy_L, eye_closed_L is visible',
    mouth: 'the one mouth layer that is visible',
    arm: "pose: rest | writing | hold | watch. rest and writing move arm_R (tx, ty); hold and watch swap to arm_hold or arm_watch and hide arm_R",
  },
  browShapes: { arch_min: rig.browPath(rig.ARCH_MIN), neutral: rig.browPath(0), arch_max: rig.browPath(rig.ARCH_MAX), neutralArch: Math.round((0 - rig.ARCH_MIN) / (rig.ARCH_MAX - rig.ARCH_MIN) * 100) / 100, note: 'Path is in brow-local space. brow_shape_R is the same path mirrored with scale(-1 1).' },
  blink: { lid_upper_ty: 42.32, closeMs: 70, holdMs: 30, openMs: 110 },
  neutral: rig.NEUTRAL,
  expressions: Object.fromEntries(rig.expressionValues.map(e => [key(e.name), e.values])),
  armPoses: rig.armPoses,
  writingPath: rig.writingPath(),
  visemes: m.VISEMES.map(v => ({ id: v, layer: `viseme_${v}`, sounds: m.VISEME_HINT[v] })),
  expressionMouths: ['mouth_neutral', 'mouth_smile', 'mouth_laugh', 'mouth_flat', 'mouth_soft', 'mouth_expect', 'mouth_oh', 'mouth_ooh', 'mouth_hmm'],
};
fs.writeFileSync(out + '/expressions.json', JSON.stringify(json, null, 2));
fs.writeFileSync(out + '/parts/meera-parts.svg', rig.pose(rig.NEUTRAL));

// Static Meera for screens outside the call: the neutral head and a little shoulder,
// lavender filling the square. Hidden layers, the background, arms and clipboard are left out.
// Written to rive/static/meera.svg and copied to the app's public/meera.svg.
function staticMeera() {
  const tree = S.parseXml(rig.pose(rig.NEUTRAL));
  const skip = new Set(['bg', 'arm_R', 'arm_watch', 'arm_hold', 'clipboard', 'hand_L']);
  const isIdentity = (t) => S.parseTransform(t).every((n, i) => Math.abs(n - S.I[i]) < 1e-9);
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const write = (e, top = false) => {
    if (e.attrs.opacity === '0' || skip.has(e.attrs.id)) return '';
    const attrs = Object.entries(e.attrs)
      .filter(([k, v]) => !k.startsWith('data-') && !(k === 'opacity' && v === '1') && !(k === 'transform' && (top || isIdentity(v))))
      .map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
    const kids = e.children.map((c) => write(c)).join('');
    return kids ? `<${e.tag}${attrs}>${kids}</${e.tag}>` : `<${e.tag}${attrs}/>`;
  };
  const meera = tree.children.find((c) => c.attrs.id === 'meera');
  // The static image uses drawing coordinates directly, so the tile offset on 'meera' is dropped.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="50 60 300 300" width="300" height="300" role="img" aria-label="Meera"><rect x="50" y="60" width="300" height="300" fill="${m.C.halo}"/>${write(meera, true)}</svg>\n`;
}
fs.mkdirSync(out + '/static', { recursive: true });
fs.writeFileSync(out + '/static/meera.svg', staticMeera());
if (fs.existsSync(out + '/../public')) fs.copyFileSync(out + '/static/meera.svg', out + '/../public/meera.svg');

(async () => {
  const W = rig.TILE.w, Hh = rig.TILE.h;
  const fit = (s, w, h) => s.replace(`width="${W}" height="${Hh}"`, `width="${w}" height="${h}"`);
  const head = (s, w) => s.replace(`viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}"`, `viewBox="20 44 288 288" width="${w}" height="${w}"`);
  const tiles = rig.expressionValues.map(e => `<div style="display:flex;flex-direction:column;gap:6px;font:600 14px Inter,sans-serif;color:#0B051D"><div style="border-radius:16px;overflow:hidden;width:200px;height:200px">${head(rig.pose(e.values), 200)}</div>${key(e.name)}</div>`).join('');
  const arms = Object.entries(rig.armPoses).map(([n, v]) => `<div style="display:flex;flex-direction:column;gap:6px;font:600 14px Inter,sans-serif;color:#0B051D"><div style="border-radius:16px;overflow:hidden;width:200px;height:262px">${fit(rig.pose(v), 200, 262)}</div>arm: ${n}</div>`).join('');
  const sway = [['still', 0, 0], ['lag', -6, 4], ['overshoot', -6, -2.5], ['settle', -6, 0]].map(([n, tilt, sw]) => `<div style="display:flex;flex-direction:column;gap:6px;font:600 13px Inter,sans-serif;color:#0B051D"><div style="border-radius:14px;overflow:hidden;width:150px;height:150px">${head(rig.pose(rig.rigValues({ tilt, sway: sw }, 'mouth_neutral')), 150)}</div>sway: ${n}</div>`).join('');
  const vis = m.VISEMES.map(v => `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;font:600 13px Inter,sans-serif;color:#0B051D">${rig.pose({ ...rig.NEUTRAL, mouth: 'viseme_' + v }).replace(`viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}"`, 'viewBox="124 182 80 80" width="96" height="96"')}viseme_${v}</div>`).join('');
  const html = `<body style="margin:0;padding:24px;background:#F9F8F5;width:1340px;font-family:Inter,sans-serif"><div style="font:700 22px Inter;margin-bottom:6px">Meera rig reference · v2</div><div style="font:14px Inter;color:#615F6D;margin-bottom:18px">Rendered from meera-parts.svg + expressions.json. The Rive contact sheet should match this.</div><div style="display:flex;flex-wrap:wrap;gap:16px">${tiles}</div><div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:24px">${arms}</div><div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:24px">${sway}</div><div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:24px">${vis}</div></body>`;
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1390, height: 900 } });
  await pg.setContent(html); await pg.screenshot({ path: out + '/reference/expressions.png', fullPage: true });
  await pg.setViewportSize({ width: W, height: Hh });
  await pg.setContent(`<body style="margin:0">${rig.pose(rig.NEUTRAL)}</body>`); await pg.screenshot({ path: out + '/reference/neutral.png' });
  await b.close();
})();
