// Frame-by-frame captures of every kind of switch in Meera's rig, at 60 fps, from the Rive CLI.
// Run: node rive/rig/switch-strips.js <name>   (writes rive/contact/switches-<name>.png)
// Each strip starts just before the switch and shows 26 frames, 16.7 ms apart.
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const name = process.argv[2] ?? 'now';
const SHEET = path.join(BUILD, `strips-${name}`);
// MAKE_RIG picks another generator, to capture an older rig for a before and after.
const MAKE_RIG = process.env.MAKE_RIG ?? path.join(__dirname, 'make-rig.js');
const SHOTS = path.join(SHEET, 'shots');
const FRAMES = 26, STEP = 1000 / 60;
const FACE = [60, 90, 208, 208]; // her face, in tile coordinates
const FULL = [0, 0, 328, 430];

// [label, setup steps before the switch, the switch's own data steps, crop]
const ALL_SWITCHES = [
  ['mood: listening to skeptical', ['mood=listening', 600], ['mood=skeptical']],
  ['mood: listening to talking', ['mood=listening', 'lipSync=true', 'viseme=open', 'mouthOpen=40', 600], ['mood=talking']],
  ['mood: talking to listening', ['mood=talking', 'lipSync=true', 'viseme=open', 'mouthOpen=40', 900], ['mood=listening']],
  ['mood: listening to thinking', ['mood=listening', 600], ['mood=thinking']],
  ['reaction in: smile', ['mood=listening', 600], ['smile=1']],
  ['reaction out: smile (1.29 s in)', ['mood=listening', 600, 'smile=1', 1240], []],
  ['eyes: laugh in (open to happy)', ['mood=listening', 600], ['laugh=1']],
  ['eyes: laugh out (happy to open)', ['mood=listening', 600, 'laugh=1', 1440], []],
  ['mouth: viseme open to round', ['mood=talking', 'lipSync=true', 'viseme=open', 'mouthOpen=40', 700], ['viseme=round']],
  ['arm: handUp in', ['mood=listening', 'reducedMotion=false', 600], ['handUp=1'], FULL],
  ['arm: handUp out', ['mood=listening', 'reducedMotion=false', 600, 'handUp=1', 1270], [], FULL],
  ['arm: checkWatch in', ['mood=listening', 'reducedMotion=false', 600], ['checkWatch=1'], FULL],
  ['arm: checkWatch out', ['mood=listening', 'reducedMotion=false', 600, 'checkWatch=1', 1470], [], FULL],
  ['blink during a reaction: browRaise', ['mood=listening', 600], ['browRaise=1']],
];
// ONLY=arm captures just the rows whose label starts with "arm".
const SWITCHES = process.env.ONLY ? ALL_SWITCHES.filter(([l]) => l.startsWith(process.env.ONLY)) : ALL_SWITCHES;

fs.rmSync(SHOTS, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });
execFileSync('node', [MAKE_RIG, '--out', path.join(SHEET, 'meera.rml')], { stdio: 'inherit' });
fs.writeFileSync(path.join(SHEET, 'rive.yaml'), 'name: meera-strips\nmain: Meera\n');
const commands = ['fit contain', 'viewport 656x860'];
const files = SWITCHES.map((s, i) => Array.from({ length: FRAMES }, (_, f) => path.join(SHOTS, `s${i}_${String(f).padStart(2, '0')}.png`)));
SWITCHES.forEach(([, setup, change], i) => {
  commands.push('reload', 'data reducedMotion=true'); // no breathing or talking loop, so only the switch moves
  for (const st of setup) commands.push(typeof st === 'number' ? `advance ${st}ms` : `data ${st}`);
  commands.push(`advance ${Math.round(2 * STEP)}ms`, `screenshot ${files[i][0]}`, `advance ${Math.round(STEP)}ms`, `screenshot ${files[i][1]}`);
  for (const ch of change) commands.push(`data ${ch}`);
  for (let f = 2; f < FRAMES; f++) commands.push(`advance ${STEP.toFixed(3)}ms`, `screenshot ${files[i][f]}`);
});
commands.push('quit');
const run = spawnSync('rive', [SHEET, '--commands'], { input: commands.join('\n') + '\n', encoding: 'utf8' });
if (run.status !== 0 || run.stdout.split('\n').some((l) => l.startsWith('err'))) {
  console.error(run.stdout.split('\n').filter((l) => l.startsWith('err')).join('\n'), run.stderr.slice(-2000));
  throw new Error('Capture failed');
}

const strips = SWITCHES.map(([label, , , crop], i) => ({ label, crop: crop ?? FACE, frames: files[i].map((f) => path.basename(f)) }));
const page = `<!doctype html><body style="margin:0;padding:20px;background:#F9F8F5;font-family:Inter,system-ui,sans-serif;color:#0B051D;width:${FRAMES * 76 + 40}px">
<div style="font:700 20px sans-serif">Meera rig switches, ${name}: 60 fps, 16.7 ms a frame</div>
<div style="font:13px sans-serif;color:#615F6D;margin:4px 0 12px">Each row starts two frames before the switch (the third frame is where it's triggered). Reduced motion is on so only the switch moves (off for the arm rows, so the body dip shows).</div>
<div id="o"></div><script>
const strips = ${JSON.stringify(strips)};
(async () => {
  const o = document.getElementById('o');
  for (const s of strips) {
    const h = document.createElement('div'); h.textContent = s.label; h.style.cssText = 'font:600 13px sans-serif;margin:10px 0 4px'; o.appendChild(h);
    const r = document.createElement('div'); r.style.cssText = 'display:flex;gap:2px'; o.appendChild(r);
    const [x, y, w, hh] = s.crop;
    for (const src of s.frames) {
      const img = await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
      const c = document.createElement('canvas'); c.width = w * 2; c.height = hh * 2;
      c.getContext('2d').drawImage(img, x * 2, y * 2, w * 2, hh * 2, 0, 0, w * 2, hh * 2);
      c.style.cssText = 'width:74px;height:' + Math.round(74 * hh / w) + 'px;border-radius:4px';
      r.appendChild(c);
    }
  }
  document.body.dataset.done = '1';
})();
</script></body>`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const p = await b.newPage({ viewport: { width: FRAMES * 76 + 80, height: 800 } });
  const html = path.join(SHOTS, 'strips.html');
  fs.writeFileSync(html, page);
  await p.goto('file://' + html);
  await p.waitForFunction(() => document.body.dataset.done === '1', null, { timeout: 120000 });
  const out = path.join(ROOT, 'contact', `switches-${name}.png`);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
  console.log(`wrote ${path.relative(process.cwd(), out)}`);
})();
