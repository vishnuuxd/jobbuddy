// Renders every rig state with the Rive CLI and lays them out on one contact sheet,
// each beside its reference pose and a diff. Run: node rive/rig/contact-sheet.js [stage]
// The reference for each state is drawn by rive/source/rig.js pose(), the code that made
// reference/expressions.png, from the values that state should produce.
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { chromium } = require('playwright-core');
const rig = require('../source/rig.js');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const SHOTS = path.join(BUILD, 'shots');
const stage = process.argv[2] ?? 'stage1';
const X = JSON.parse(fs.readFileSync(path.join(ROOT, 'expressions.json'), 'utf8'));
const E = X.expressions;
const SCALE = 2; // captures at 800 x 880

// ---------- what to capture ----------
const clone = (v) => JSON.parse(JSON.stringify(v));
const withEyes = (base, from) => {
  const v = clone(base);
  for (const s of ['L', 'R']) for (const k of [`lid_upper_${s}`, `lid_lower_${s}`, `lash_flick_${s}`, `pupil_${s}`, `eye_${s}`]) v[k] = clone(from[k]);
  return v;
};
const checkWatchFace = (() => {
  const v = clone(E.listening);
  for (const s of ['L', 'R']) {
    v[`pupil_${s}`] = { tx: 0.6 * 7, ty: 0.8 * 7, scale: 1 };
    v[`lid_upper_${s}`] = { ty: 14.72, rot: 0 };
    v[`lash_flick_${s}`] = { ty: 14.4 };
  }
  return v;
})();
const blinkFace = (() => {
  const v = clone(E.listening);
  for (const s of ['L', 'R']) {
    v[`lid_upper_${s}`] = { ty: X.blink.lid_upper_ty, rot: 0 };
    v[`lash_flick_${s}`] = { ty: 42 };
  }
  return v;
})();
const talkingWith = (viseme) => ({ ...clone(E.talking), mouth: `viseme_${viseme}` });

const FACE = [80, 40, 240, 240]; // the reference sheet's crop
const MOUTH = [160, 212, 80, 80];
const FULL = [0, 0, 400, 440];
const settle = 700;
const still = [0, 'reducedMotion=true']; // no breathing, so a pose lines up with its reference
const at = (mood) => [still, [0, `mood=${mood}`], [400]];
const fire = (trigger, ms) => [[0, `${trigger}=1`], [ms]];
const VISEMES = ['rest', 'closed', 'teeth', 'open', 'wide', 'round', 'pucker', 'fv', 'lth'];
// steps: [ms, data] pairs run in order before the capture.
const STATES = [
  { group: 'Moods', name: 'idle', note: 'listening', steps: [still, [0, 'mood=idle'], [settle]], ref: E.listening },
  { group: 'Moods', name: 'intake', note: 'expectant', steps: [still, [0, 'mood=intake'], [settle]], ref: E.expectant },
  { group: 'Moods', name: 'listening', note: 'listening', steps: [still, [0, 'mood=listening'], [settle]], ref: E.listening },
  { group: 'Moods', name: 'skeptical', note: 'skeptical', steps: [still, [0, 'mood=skeptical'], [settle]], ref: E.skeptical },
  { group: 'Moods', name: 'writing', note: 'writing', steps: [still, [0, 'mood=writing'], [settle]], ref: E.writing },
  { group: 'Moods', name: 'talking', note: 'talking, viseme open', steps: [still, [0, 'mood=talking'], [0, 'lipSync=true'], [0, 'viseme=open'], [0, 'mouthOpen=50'], [settle]], ref: E.talking },
  { group: 'Triggers', name: 'smile', note: 'warmSmile, mid hold', steps: [...at('listening'), ...fire('smile', 700)], ref: E.warmSmile },
  { group: 'Triggers', name: 'browRaise', note: 'interested, mid hold', steps: [...at('listening'), ...fire('browRaise', 600)], ref: E.interested },
  { group: 'Triggers', name: 'expectant', note: 'expectant, holding', steps: [...at('listening'), ...fire('expectant', 1000)], ref: E.expectant },
  { group: 'Triggers', name: 'expectant, she speaks', note: 'hands over to talking', steps: [...at('listening'), ...fire('expectant', 600), [0, 'lipSync=true'], [0, 'viseme=open'], [0, 'mouthOpen=50'], [0, 'mood=talking'], [settle]], ref: E.talking },
  { group: 'Triggers', name: 'glanceDown', note: 'writing eyes only, mid hold', steps: [...at('listening'), ...fire('glanceDown', 600)], ref: withEyes(E.listening, E.writing) },
  { group: 'Triggers', name: 'leanIn', note: 'interested eyes, mid hold', steps: [...at('listening'), ...fire('leanIn', 900)], ref: withEyes(E.listening, E.interested) },
  { group: 'Triggers', name: 'checkWatch', note: 'pupils 0.6, 0.8, lids 0.6', steps: [...at('listening'), ...fire('checkWatch', 900)], ref: checkWatchFace },
  { group: 'Triggers', name: 'blink', note: 'closed, mid hold of the first blink', steps: [still, [0, 'mood=listening'], [4065]], ref: blinkFace },
  { group: 'Triggers', name: 'nod, reduced motion', note: 'no movement', steps: [...at('listening'), ...fire('nod', 180)], ref: E.listening },
  ...VISEMES.map((v) => ({
    group: 'Visemes', name: `viseme_${v}`, note: 'talking face', crop: MOUTH,
    steps: [still, [0, 'mood=talking'], [0, 'lipSync=true'], [0, `viseme=${v}`], [0, 'mouthOpen=50'], [settle]], ref: talkingWith(v),
  })),
  // Whole figure: motions the reference sheet can't show, so no reference.
  { group: 'Motion', name: 'rest', note: 'listening, breathing', crop: FULL, steps: [[0, 'mood=listening'], [settle]] },
  { group: 'Motion', name: 'nod', note: 'at the bottom, 180 ms', crop: FULL, steps: [[0, 'mood=listening'], [400], ...fire('nod', 180)] },
  { group: 'Motion', name: 'leanIn', note: 'head 1.04, down 4 px', crop: FULL, steps: [[0, 'mood=listening'], [400], ...fire('leanIn', 900)] },
  { group: 'Motion', name: 'handUp', note: 'arm up 40 px, -10°', crop: FULL, steps: [[0, 'mood=listening'], [400], ...fire('handUp', 800)] },
  { group: 'Motion', name: 'checkWatch arm', note: 'arm up 30 px, mid hold', crop: FULL, steps: [[0, 'mood=listening'], [400], ...fire('checkWatch', 900)] },
  { group: 'Motion', name: 'sitUp', note: 'up 3 px, brows 2 px, stays', crop: FULL, steps: [[0, 'mood=listening'], [400], ...fire('sitUp', 3000)] },
  { group: 'Motion', name: 'writing hand', note: 'strokes, 5 a second', crop: FULL, steps: [[0, 'mood=writing'], [settle]] },
];

// ---------- capture ----------
fs.rmSync(SHOTS, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });
execFileSync('node', [path.join(__dirname, 'make-rig.js'), '--backdrop', '0B051D', '--out', path.join(BUILD, 'sheet/meera.rml')], { stdio: 'inherit' });
fs.writeFileSync(path.join(BUILD, 'sheet/rive.yaml'), 'name: meera-sheet\nmain: Meera\n');
const file = (s) => path.join(SHOTS, `${s.group}_${s.name}`.replace(/\W+/g, '_') + '.png');
const commands = [`viewport ${400 * SCALE}x${440 * SCALE}`, 'fit contain'];
for (const s of STATES) {
  commands.push('reload');
  for (const [ms, data] of s.steps) {
    if (data) commands.push(`data ${data}`);
    if (ms) commands.push(`advance ${ms}ms`);
  }
  commands.push(`screenshot ${file(s)}`);
}
commands.push('quit');
const run = spawnSync('rive', [path.join(BUILD, 'sheet'), '--commands'], { input: commands.join('\n') + '\n', encoding: 'utf8' });
const errors = run.stdout.split('\n').filter((l) => l.startsWith('err'));
if (run.status !== 0 || errors.length) {
  console.error(run.stdout, run.stderr);
  throw new Error('Capture failed');
}

// ---------- compose ----------
const refSvg = (values) => rig.pose(values);
const tiles = STATES.map((s) => ({
  ...s,
  crop: s.crop ?? FACE,
  rive: 'data:image/png;base64,' + fs.readFileSync(file(s)).toString('base64'),
  ref: s.ref ? 'data:image/svg+xml;base64,' + Buffer.from(refSvg(s.ref).replace('<svg ', '<svg style="background:#0B051D" ')).toString('base64') : null,
}));

const page = `<!doctype html><meta charset="utf-8"><body style="margin:0;padding:24px;background:#F9F8F5;width:1500px;font-family:Inter,system-ui,sans-serif;color:#0B051D">
<div style="font:700 22px Inter,sans-serif">Meera rig: ${stage}</div>
<div id="sum" style="font:14px Inter,sans-serif;color:#615F6D;margin:6px 0 18px">Rive capture, reference pose, and the pixels that differ (red). Reference poses come from rive/source/rig.js, the code behind reference/expressions.png.</div>
<div id="out"></div>
<script>
const tiles = ${JSON.stringify(tiles)};
const S = ${SCALE};
const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
function cropCanvas(img, [x, y, w, h], size, scaleSrc) {
  const c = document.createElement('canvas'); c.width = size[0]; c.height = size[1];
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  g.drawImage(img, x * scaleSrc, y * scaleSrc, w * scaleSrc, h * scaleSrc, 0, 0, size[0], size[1]);
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
    const full = w === 400;
    const size = full ? [200, 220] : w === 80 ? [120, 120] : [200, 200];
    const px = [w * S, h * S];
    const rive = await load(t.rive);
    const cell = document.createElement('div'); cell.style.cssText = 'display:flex;flex-direction:column;gap:6px';
    const imgs = document.createElement('div'); imgs.style.cssText = 'display:flex;gap:6px';
    const show = (c) => { c.style.cssText = 'width:' + size[0] + 'px;height:' + size[1] + 'px;border-radius:12px;background:#0B051D'; imgs.appendChild(c); };
    const riveC = cropCanvas(rive, t.crop, px, S);
    show(riveC);
    let line = '';
    if (t.ref) {
      const ref = await load(t.ref);
      const refC = cropCanvas(ref, t.crop, px, 1);
      // The SVG draws at its own 400 x 440; draw it again at the capture's scale.
      const big = document.createElement('canvas'); big.width = 400 * S; big.height = 440 * S;
      big.getContext('2d').drawImage(ref, 0, 0, 400 * S, 440 * S);
      const refS = cropCanvas(big, t.crop, px, S);
      show(refS);
      const a = riveC.getContext('2d').getImageData(0, 0, px[0], px[1]).data;
      const b = refS.getContext('2d').getImageData(0, 0, px[0], px[1]).data;
      const d = document.createElement('canvas'); d.width = px[0]; d.height = px[1];
      const dg = d.getContext('2d'); const di = dg.createImageData(px[0], px[1]);
      let diff = 0;
      for (let i = 0; i < a.length; i += 4) {
        const m = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]));
        const g = (b[i] + b[i + 1] + b[i + 2]) / 3;
        const bad = m > 48;
        if (bad) diff++;
        di.data[i] = bad ? 255 : g * 0.35; di.data[i + 1] = bad ? 40 : g * 0.35; di.data[i + 2] = bad ? 60 : g * 0.35; di.data[i + 3] = 255;
      }
      dg.putImageData(di, 0, 0); show(d);
      const pct = (100 * diff) / (px[0] * px[1]);
      results.push({ name: t.name, pct });
      line = pct.toFixed(2) + '% differ';
    }
    cell.appendChild(imgs);
    const label = document.createElement('div');
    label.innerHTML = '<b>' + t.name + '</b> <span style="color:#615F6D">' + t.note + (line ? ' · ' + line : '') + '</span>';
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
  await pg.waitForFunction(() => document.body.dataset.done === '1', null, { timeout: 60000 });
  const results = await pg.evaluate(() => window.results);
  fs.mkdirSync(path.join(ROOT, 'contact'), { recursive: true });
  const outPng = path.join(ROOT, 'contact', `${stage}.png`);
  await pg.screenshot({ path: outPng, fullPage: true });
  await browser.close();
  for (const r of results) console.log(`${r.name.padEnd(16)} ${r.pct.toFixed(2)}% differ`);
  console.log(`wrote ${path.relative(process.cwd(), outPng)}`);
})();
