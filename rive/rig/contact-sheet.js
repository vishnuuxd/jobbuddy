// Renders every rig state with the Rive CLI and lays them out on one contact sheet, each beside
// its reference pose and a diff. Run: node rive/rig/contact-sheet.js [name]   (writes rive/contact/<name>.png)
// The reference for each state is drawn by rive/source/rig.js pose(), the code that made
// reference/expressions.png, from the values that state should produce.
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { chromium } = require('playwright-core');
const rig = require('../source/rig.js');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const SHEET = path.join(BUILD, 'sheet');
const SHOTS = path.join(BUILD, 'shots');
const name = process.argv[2] ?? 'v2';
const X = JSON.parse(fs.readFileSync(path.join(ROOT, 'expressions.json'), 'utf8'));
const E = X.expressions;
const ARM = X.armPoses;
const W = X.artboard.width, H = X.artboard.height;
const SCALE = 2;

// ---------- what each state should look like ----------
const clone = (v) => JSON.parse(JSON.stringify(v));
const R = X.controls.parallax.rates;
const withTurn = (v, t) => ({
  ...clone(v), turn: t,
  features: { tx: R.features * t }, nose: { tx: R.nose * t }, face: { tx: R.face * t }, hair_front: { tx: R.hair_front * t }, hair_back: { tx: R.hair_back * t },
  ear_L: { tx: R.ears * t, sx: t > 0 ? 1 - R.farEar * t : 1 }, ear_R: { tx: R.ears * t, sx: t < 0 ? 1 + R.farEar * t : 1 },
});
const IDLE = withTurn(E.listening, 0);
const asymBrowRaise = (() => {
  const v = clone(E.interested);
  v.brow_R = { ...v.brow_R, ty: -8, rot: 5 };
  v.brow_L = { ...v.brow_L, ty: 1 };
  return v;
})();
const skepticalDeep = (() => {
  const v = clone(E.skeptical);
  for (const s of ['L', 'R']) v[`lid_upper_${s}`].ty += 2;
  return v;
})();
const closedLids = (base) => {
  const v = clone(base);
  for (const s of ['L', 'R']) {
    v[`lid_upper_${s}`] = { ty: X.blink.lid_upper_ty, rot: 0 };
    v[`lash_flick_${s}`] = { ty: 42 };
  }
  return v;
};
// Writing: the arm is somewhere on writingPath. Capture at frame 19 (tx about -20).
const WF = 19, writingMs = Math.round((WF * 1000) / X.writingPath.fps) + 2;
const writingAt = (() => {
  const v = clone(E.writing);
  v.arm = { pose: 'writing', tx: X.writingPath.frames[WF].tx, ty: X.writingPath.frames[WF].ty };
  return v;
})();
const talkingWith = (viseme) => ({ ...clone(E.talking), mouth: `viseme_${viseme}` });

const FACE = [20, 44, 288, 288]; // the reference sheet's face crop
const MOUTH = [124, 182, 80, 80];
const FULL = [0, 0, W, H];
const still = [0, 'reducedMotion=true']; // no talking motion, darts or breathing: a pose lines up with its reference
const at = (mood) => [still, [0, `mood=${mood}`], [500]];
const fire = (t, ms) => [[0, `${t}=1`], [ms]];
const jaw1 = [0, 'mouthOpen=37.5']; // the jaw at scale 1
const VIS = ['rest', 'closed', 'teeth', 'open', 'wide', 'round', 'pucker', 'fv', 'lth'];
const STATES = [
  { group: 'Expressions', name: 'listening', note: 'mood listening, one loop in', steps: [still, [0, 'mood=listening'], [3600]], ref: E.listening },
  { group: 'Expressions', name: 'warmSmile', note: 'smile, mid hold', steps: [...at('listening'), ...fire('smile', 700)], ref: E.warmSmile },
  { group: 'Expressions', name: 'talking', note: 'mood talking, viseme open', steps: [still, [0, 'mood=talking'], [0, 'lipSync=true'], [0, 'viseme=open'], jaw1, [700]], ref: E.talking },
  { group: 'Expressions', name: 'expectant', note: 'mood intake', steps: [still, [0, 'mood=intake'], [700]], ref: E.expectant },
  { group: 'Expressions', name: 'interested', note: 'browRaise: asymmetric brows', steps: [...at('listening'), ...fire('browRaise', 600)], ref: asymBrowRaise },
  { group: 'Expressions', name: 'skeptical', note: 'mood skeptical, squint deepened', steps: [still, [0, 'mood=skeptical'], [2600]], ref: skepticalDeep },
  { group: 'Expressions', name: 'writing', note: `mood writing, path frame ${WF}`, steps: [still, [0, 'mood=writing'], [writingMs]], ref: writingAt },
  { group: 'Expressions', name: 'thinking', note: 'mood thinking, the held second', steps: [still, [0, 'mood=thinking'], [900]], ref: E.thinking },
  { group: 'Expressions', name: 'impressed', note: 'impressed, mid hold', steps: [...at('listening'), ...fire('impressed', 600)], ref: E.impressed },
  { group: 'Expressions', name: 'laughing', note: 'laugh, mid hold', steps: [...at('listening'), ...fire('laugh', 700)], ref: E.laughing },
  { group: 'Expressions', name: 'reassuring', note: 'reassure, mid hold', steps: [...at('listening'), ...fire('reassure', 700)], ref: E.reassuring },
  { group: 'Expressions', name: 'surprised', note: 'surprised, mid hold', steps: [...at('listening'), ...fire('surprised', 500)], ref: E.surprised },
  { group: 'Arm poses', name: 'arm: rest', note: 'mood idle', crop: FULL, steps: [still, [0, 'mood=idle'], [700]], ref: IDLE },
  { group: 'Arm poses', name: 'arm: writing', note: `writingPath frame ${WF}`, crop: FULL, steps: [still, [0, 'mood=writing'], [writingMs]], ref: writingAt },
  { group: 'Arm poses', name: 'arm: hold', note: 'handUp, mid hold', crop: FULL, steps: [...at('listening'), ...fire('handUp', 700)], ref: ARM.hold },
  { group: 'Arm poses', name: 'arm: watch', note: 'checkWatch, mid hold', crop: FULL, steps: [...at('listening'), ...fire('checkWatch', 800)], ref: ARM.watch },
  ...['still', 'lag', 'overshoot', 'settle'].map((s, i) => ({
    group: 'Sway', name: `sway: ${s}`, note: 'Sway artboard', artboard: 'Sway', tile: i,
    ref: rig.rigValues({ tilt: [0, -6, -6, -6][i], sway: [0, 4, -2.5, 0][i] }, 'mouth_neutral'),
  })),
  { group: 'Blinks', name: 'reaction blink', note: 'nod, 95 ms in: lids shut', steps: [...at('listening'), ...fire('nod', 95)], ref: closedLids(E.listening) },
  { group: 'Blinks', name: 'timer blink', note: 'first blink, mid hold', steps: [still, [0, 'mood=listening'], [4060]], ref: closedLids(E.listening) },
  ...VIS.map((v) => ({
    group: 'Visemes', name: `viseme_${v}`, note: 'talking face', crop: MOUTH,
    steps: [still, [0, 'mood=talking'], [0, 'lipSync=true'], [0, `viseme=${v}`], jaw1, [700]], ref: talkingWith(v),
  })),
];

// ---------- capture ----------
fs.rmSync(SHOTS, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(SHEET, { recursive: true });
execFileSync('node', [path.join(__dirname, 'make-rig.js'), '--out', path.join(SHEET, 'meera.rml')], { stdio: 'inherit' });
fs.writeFileSync(path.join(SHEET, 'rive.yaml'), 'name: meera-sheet\nmain: Meera\n');
const file = (s) => path.join(SHOTS, `${s.group}_${s.name}`.replace(/\W+/g, '_') + '.png');
const swayFile = path.join(SHOTS, 'sway.png');
const commands = ['fit contain', `viewport ${W * 4 * SCALE}x${H * SCALE}`, 'artboard Sway', 'reload', 'advance 50ms', `screenshot ${swayFile}`, 'artboard Meera', `viewport ${W * SCALE}x${H * SCALE}`];
for (const s of STATES.filter((x) => !x.artboard)) {
  commands.push('reload');
  for (const [ms, data] of s.steps) {
    if (data) commands.push(`data ${data}`);
    if (ms) commands.push(`advance ${ms}ms`);
  }
  commands.push(`screenshot ${file(s)}`);
}
commands.push('quit');
const run = spawnSync('rive', [SHEET, '--commands'], { input: commands.join('\n') + '\n', encoding: 'utf8' });
const errors = run.stdout.split('\n').filter((l) => l.startsWith('err'));
if (run.status !== 0 || errors.length) {
  console.error(run.stdout, run.stderr);
  throw new Error('Capture failed');
}

// ---------- compose ----------
const dataUrl = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const tiles = STATES.map((s) => ({
  group: s.group, name: s.name, note: s.note, crop: s.crop ?? FACE,
  rive: s.artboard ? dataUrl(swayFile) : dataUrl(file(s)),
  offsetX: s.artboard ? s.tile * W : 0,
  ref: 'data:image/svg+xml;base64,' + Buffer.from(rig.pose(s.ref)).toString('base64'),
}));

const page = `<!doctype html><meta charset="utf-8"><body style="margin:0;padding:24px;background:#F9F8F5;width:1500px;font-family:Inter,system-ui,sans-serif;color:#0B051D">
<div style="font:700 22px Inter,sans-serif">Meera rig: ${name}</div>
<div style="font:14px Inter,sans-serif;color:#615F6D;margin:6px 0 18px">Rive capture, reference pose, and the pixels that differ (red). Reference poses come from rive/source/rig.js, the code behind reference/expressions.png.</div>
<div id="out"></div>
<script>
const tiles = ${JSON.stringify(tiles)};
const S = ${SCALE};
const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
function crop(img, [x, y, w, h], ox, scale) {
  const c = document.createElement('canvas'); c.width = w * S; c.height = h * S;
  c.getContext('2d').drawImage(img, (x + ox) * scale, y * scale, w * scale, h * scale, 0, 0, w * S, h * S);
  return c;
}
(async () => {
  const out = document.getElementById('out');
  let group = null, row = null;
  const results = [];
  for (const t of tiles) {
    if (t.group !== group) {
      group = t.group;
      const h = document.createElement('div'); h.textContent = group; h.style.cssText = 'font:700 16px Inter,sans-serif;margin:18px 0 10px'; out.appendChild(h);
      row = document.createElement('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:18px'; out.appendChild(row);
    }
    const [x, y, w, h] = t.crop;
    const size = w === ${W} ? [150, 197] : w === 80 ? [110, 110] : [170, 170];
    const rive = await load(t.rive);
    const ref = await load(t.ref);
    const big = document.createElement('canvas'); big.width = ${W} * S; big.height = ${H} * S;
    big.getContext('2d').drawImage(ref, 0, 0, ${W} * S, ${H} * S);
    const a = crop(rive, t.crop, t.offsetX, S), b = crop(big, t.crop, 0, S);
    const da = a.getContext('2d').getImageData(0, 0, a.width, a.height).data, db = b.getContext('2d').getImageData(0, 0, b.width, b.height).data;
    const d = document.createElement('canvas'); d.width = a.width; d.height = a.height;
    const dg = d.getContext('2d'); const di = dg.createImageData(a.width, a.height);
    let diff = 0;
    for (let i = 0; i < da.length; i += 4) {
      const m = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      const g = (db[i] + db[i + 1] + db[i + 2]) / 3, bad = m > 48;
      if (bad) diff++;
      di.data[i] = bad ? 255 : g * 0.35; di.data[i + 1] = bad ? 40 : g * 0.35; di.data[i + 2] = bad ? 60 : g * 0.35; di.data[i + 3] = 255;
    }
    dg.putImageData(di, 0, 0);
    const pct = (100 * diff) / (a.width * a.height);
    results.push({ name: t.name, pct });
    const cell = document.createElement('div'); cell.style.cssText = 'display:flex;flex-direction:column;gap:6px';
    const imgs = document.createElement('div'); imgs.style.cssText = 'display:flex;gap:6px';
    for (const c of [a, b, d]) { c.style.cssText = 'width:' + size[0] + 'px;height:' + size[1] + 'px;border-radius:12px'; imgs.appendChild(c); }
    cell.appendChild(imgs);
    const label = document.createElement('div');
    label.innerHTML = '<b>' + t.name + '</b> <span style="color:#615F6D">' + t.note + ' · ' + pct.toFixed(2) + '% differ</span>';
    label.style.cssText = 'font:13px Inter,sans-serif';
    cell.appendChild(label); row.appendChild(cell);
  }
  window.results = results;
  document.body.dataset.done = '1';
})();
</script></body>`;

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const pg = await browser.newPage({ viewport: { width: 1548, height: 900 } });
  await pg.setContent(page);
  await pg.waitForFunction(() => document.body.dataset.done === '1', null, { timeout: 120000 });
  const results = await pg.evaluate(() => window.results);
  fs.mkdirSync(path.join(ROOT, 'contact'), { recursive: true });
  const outPng = path.join(ROOT, 'contact', `${name}.png`);
  await pg.screenshot({ path: outPng, fullPage: true });
  await browser.close();
  for (const r of results) console.log(`${r.name.padEnd(18)} ${r.pct.toFixed(2)}% differ`);
  console.log(`wrote ${path.relative(process.cwd(), outPng)}`);
})();
