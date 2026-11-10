const m = require('./meera.js'); const rig = require('./rig.js'); const fs = require('fs');
// playwright if installed, else playwright-core with the local Chrome (what the app repo has).
const { chromium } = (() => { try { return require('playwright'); } catch { const pw = require('playwright-core'); const launch = pw.chromium.launch.bind(pw.chromium); return { chromium: { launch: (o = {}) => launch({ executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ...o }) } }; } })();
const S = require('../rig/svg.js');
const out = __dirname + '/..'; fs.mkdirSync(out + '/reference', { recursive: true });
const key = n => n.toLowerCase().replace(/\s+(\w)/g, (_, c) => c.toUpperCase());
const json = {
  about: "Meera's rig values. Units are artboard px and degrees. Artboard 400 x 440. Values are offsets from the neutral pose in meera-parts.svg.",
  controls: {
    head: { rot: 'degrees around pivot 200 300, positive is clockwise' },
    blush: { opacity: '0 to 1, applies to blush_L and blush_R' },
    brow_L: { ty: 'px, negative is up', rot: 'degrees around the brow pivot, world space', arch: '0 to 1 blend between brow shapes arch_min and arch_max' },
    lid_upper_L: { ty: 'px from neutral, positive is down. 42.32 is fully closed', rot: 'degrees around the lid pivot' },
    lid_lower_L: { ty: 'px, negative is up (cheek push)', line: 'opacity of lid_lower_line' },
    lash_flick_L: { ty: 'px' },
    pupil_L: { tx: 'px', ty: 'px', scale: 'around the pupil pivot' },
    eye_L: 'open | happy | closed: which of eye_open_L, eye_happy_L, eye_closed_L is visible',
    mouth: 'the one mouth layer that is visible',
  },
  browShapes: { arch_min: rig.browPath(rig.ARCH_MIN), neutral: rig.browPath(0), arch_max: rig.browPath(rig.ARCH_MAX), neutralArch: Math.round((0 - rig.ARCH_MIN) / (rig.ARCH_MAX - rig.ARCH_MIN) * 100) / 100, note: 'Path is in brow-local space. brow_shape_R is the same path mirrored with scale(-1 1).' },
  blink: { lid_upper_ty: 42.32, closeMs: 70, holdMs: 30, openMs: 110 },
  neutral: rig.NEUTRAL,
  expressions: Object.fromEntries(rig.expressionValues.map(e => [key(e.name), e.values])),
  visemes: m.VISEMES.map(v => ({ id: v, layer: `viseme_${v}`, sounds: m.VISEME_HINT[v] })),
  expressionMouths: ['mouth_neutral','mouth_smile','mouth_laugh','mouth_flat','mouth_soft','mouth_expect','mouth_oh','mouth_ooh','mouth_hmm'],
};
fs.writeFileSync(out + '/expressions.json', JSON.stringify(json, null, 2));
fs.writeFileSync(out + '/parts/meera-parts.svg', rig.pose(rig.NEUTRAL));

// Static Meera for screens outside the call: the neutral pose, head and a little shoulder,
// lavender filling the whole square. Hidden layers (other mouths, closed eyes) are left out.
// Written to rive/static/meera.svg and copied to the app's public/meera.svg.
function staticMeera() {
  const tree = S.parseXml(rig.pose(rig.NEUTRAL));
  const isIdentity = (t) => S.parseTransform(t).every((n, i) => Math.abs(n - S.I[i]) < 1e-9);
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const write = (e) => {
    if (e.attrs.opacity === '0' || e.attrs.id === 'halo') return '';
    const attrs = Object.entries(e.attrs)
      .filter(([k, v]) => !k.startsWith('data-') && !(k === 'opacity' && v === '1') && !(k === 'transform' && isIdentity(v)))
      .map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
    const kids = e.children.map(write).join('');
    return kids ? `<${e.tag}${attrs}>${kids}</${e.tag}>` : `<${e.tag}${attrs}/>`;
  };
  const meera = tree.children.find((c) => c.attrs.id === 'meera');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="50 20 300 300" width="300" height="300" role="img" aria-label="Meera"><rect x="50" y="20" width="300" height="300" fill="${m.C.halo}"/>${write(meera)}</svg>\n`;
}
fs.mkdirSync(out + '/static', { recursive: true });
fs.writeFileSync(out + '/static/meera.svg', staticMeera());
fs.mkdirSync(out + '/../public', { recursive: true });
fs.copyFileSync(out + '/static/meera.svg', out + '/../public/meera.svg');
(async () => {
  const crop = s => s.replace('viewBox="0 0 400 440" width="400" height="440"','viewBox="80 40 240 240" width="200" height="200"');
  const tiles = rig.expressionValues.map(e => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;font:600 14px Inter,sans-serif;color:#0B051D"><div style="background:#0B051D;border-radius:16px;padding:6px">${crop(rig.pose(e.values))}</div>${key(e.name)}</div>`).join('');
  const vis = m.VISEMES.map(v => `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;font:600 13px Inter,sans-serif;color:#0B051D">${rig.pose({...rig.NEUTRAL, mouth:'viseme_'+v}).replace('viewBox="0 0 400 440" width="400" height="440"','viewBox="160 212 80 80" width="96" height="96"')}viseme_${v}</div>`).join('');
  const html = `<body style="margin:0;padding:24px;background:#F9F8F5;width:1340px;font-family:Inter,sans-serif"><div style="font:700 22px Inter;margin-bottom:6px">Meera rig reference</div><div style="font:14px Inter;color:#615F6D;margin-bottom:18px">Rendered from meera-parts.svg + expressions.json. The Rive contact sheet should match this.</div><div style="display:flex;flex-wrap:wrap;gap:16px">${tiles}</div><div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:24px">${vis}</div></body>`;
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1390, height: 900 } });
  await pg.setContent(html); await pg.screenshot({ path: out + '/reference/expressions.png', fullPage: true });
  await pg.setContent(`<body style="margin:0;background:#0B051D">${rig.pose(rig.NEUTRAL)}</body>`); await pg.setViewportSize({width:400,height:440}); await pg.screenshot({ path: out + '/reference/neutral.png' });
  await b.close();
})();
