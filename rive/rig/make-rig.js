// Generates Meera's rig as RML from rive/parts/meera-parts.svg and rive/expressions.json.
// Run: node rive/rig/make-rig.js   (writes rive/meera.rml)
// The spec is rive/RIG.md. Nothing here is drawn by hand: every shape comes from the parts file.
const fs = require('fs');
const path = require('path');
const S = require('./svg.js');

const ROOT = path.join(__dirname, '..');
const parts = S.parseXml(fs.readFileSync(path.join(ROOT, 'parts/meera-parts.svg'), 'utf8'));
const X = JSON.parse(fs.readFileSync(path.join(ROOT, 'expressions.json'), 'utf8'));

// ---------- the spec, in one place (RIG.md) ----------
const T = {
  blendMs: 250, // between expressions, ease in out
  mouthFadeMs: 40, // mouth swaps
  blink: { closeMs: X.blink.closeMs, holdMs: X.blink.holdMs, openMs: X.blink.openMs, closedTy: X.blink.lid_upper_ty, waitsMs: [2500, 3000, 3500, 4000, 4500, 5000, 5500], doubleWeight: 1, singleWeight: 9 },
  nod: { downMs: 180, upMs: 270, dy: 6, rotDeg: 2 },
  browRaise: { inMs: 150, holdMs: 900, outMs: 300 },
  glanceDown: { inMs: 150, holdMs: 800, outMs: 250 },
  checkWatch: { inMs: 300, holdMs: 1400, outMs: 250, armDy: -30, look: { x: 0.6, y: 0.8 }, lid: 0.6 },
  smile: { inMs: 200, holdMs: 1200, outMs: 400 },
  handUp: { inMs: 250, holdMs: 1200, outMs: 300, armDy: -40, armRotDeg: -10 },
  leanIn: { inMs: 300, holdMs: 1500, outMs: 250, scale: 1.04, dy: 4 },
  sitUp: { ms: 400, dy: -3, browDy: -2 },
  expectant: { holdMs: 2000 }, // or until she speaks
  breath: { periodMs: 4000, bodyDy: -1.5, headDy: -1.2, headLagMs: 120 },
  writing: { strokeMs: 200, dx: 2 }, // 5 strokes a second, ±2 px
  drift: { maxLook: 0.15 }, // of the pupil range
  pupilRange: 7, // px, from expressions.json: look x/y of 1 is 7 px
  mouthOpenScale: [0.92, 1.08],
  // When a chunk of her audio has no alignment, the viseme comes from mouthOpen (0 to 100):
  // below the first number rest, below the second teeth, otherwise open.
  fallbackBands: [8, 30],
};
// Everything in RIG.md's first build: day 1 (the four triggers and five visemes) plus day 2.
// The future triggers (think, impressed, laugh, reassure, surprised) stay out, as RIG.md says.
const SCOPE = {
  visemes: ['rest', 'closed', 'teeth', 'open', 'wide', 'round', 'pucker', 'fv', 'lth'],
  triggers: ['nod', 'smile', 'browRaise', 'glanceDown', 'handUp', 'checkWatch', 'sitUp', 'leanIn', 'expectant'],
};
const MOODS = ['idle', 'intake', 'listening', 'skeptical', 'writing', 'talking'];
const MOOD_EXPRESSION = { idle: 'listening', intake: 'expectant', listening: 'listening', skeptical: 'skeptical', writing: 'writing', talking: 'talking' };
const VISEMES = ['rest', 'closed', 'teeth', 'open', 'wide', 'round', 'pucker', 'fv', 'lth'];
const TRIGGERS = ['nod', 'smile', 'browRaise', 'glanceDown', 'handUp', 'checkWatch', 'sitUp', 'leanIn', 'expectant'];
const EXPRESSION_MOUTHS = X.expressionMouths;

// Extra nodes stacked inside a moving part, so each layer keys its own node and the motions add up.
// posture: sitUp, which stays. react: one-off triggers. breath: the breathing loop.
const WRAPPERS = {
  head: ['head_posture', 'head_react', 'head_breath'],
  body: ['body_posture', 'body_breath'],
  arm_R: ['arm_posture', 'arm_react', 'arm_breath'],
  brow_L: ['brow_L_posture'],
  brow_R: ['brow_R_posture'],
  pupil_L: ['pupil_L_drift'],
  pupil_R: ['pupil_R_drift'],
};

// ---------- ids and RML elements ----------
let nextId = 10;
const newId = () => `0:${nextId++}`;
const el = (tag, attrs = {}, children = []) => ({ tag, attrs, children });
const fmt = (n) => {
  if (typeof n !== 'number') return String(n);
  const r = Number(n.toFixed(4));
  return Object.is(r, -0) ? '0' : String(r);
};
function serialize(e, depth = 0) {
  const pad = '  '.repeat(depth);
  const attrs = Object.entries(e.attrs)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => ` ${k}="${fmt(v)}"`)
    .join('');
  if (!e.children.length) return `${pad}<${e.tag}${attrs}/>`;
  return `${pad}<${e.tag}${attrs}>\n${e.children.map((c) => serialize(c, depth + 1)).join('\n')}\n${pad}</${e.tag}>`;
}

// Everything an animation can key, by name: { id, rest: {...} }.
const reg = {};
const register = (name, id, rest) => {
  if (reg[name]) throw new Error(`Duplicate rig name ${name}`);
  reg[name] = { id, rest };
};

// ---------- SVG parts to Rive nodes and shapes ----------
const clipDefs = {};
(function collectClips(e) {
  if (e.tag === 'clipPath') clipDefs[e.attrs.id] = e.children[0];
  e.children.forEach(collectClips);
})(parts);

const color = (hex) => 'FF' + hex.replace('#', '').toUpperCase();
const linearOf = (m) => [m[0], m[1], m[2], m[3], 0, 0];

function placement(frameParent, frame) {
  return S.decomposeMirror(S.mul(S.inv(frameParent), frame));
}
function nodeAttrs(name, frameParent, frame, extra = {}) {
  const p = placement(frameParent, frame);
  const attrs = { x: p.x, y: p.y, name };
  if (Math.abs(p.rotation) > 1e-9) attrs.rotation = p.rotation;
  if (Math.abs(p.scaleX - 1) > 1e-9) attrs.scaleX = p.scaleX;
  if (Math.abs(p.scaleY - 1) > 1e-9) attrs.scaleY = p.scaleY;
  return { attrs: { ...attrs, ...extra }, rest: { x: p.x, y: p.y, rotation: p.rotation, scaleX: p.scaleX, scaleY: p.scaleY } };
}

function paints(svgEl, s) {
  const out = [];
  const fill = svgEl.attrs.fill ?? '#000000';
  if (fill !== 'none') out.push(el('Fill', { name: 'Fill' }, [el('SolidColor', { colorValue: color(fill), name: 'Color' })]));
  if (svgEl.attrs.stroke && svgEl.attrs.stroke !== 'none') {
    out.push(
      el('Stroke', { thickness: Number(svgEl.attrs['stroke-width'] ?? 1) * s, cap: svgEl.attrs['stroke-linecap'] ?? 'butt', join: svgEl.attrs['stroke-linejoin'] ?? 'miter', name: 'Stroke' }, [
        el('SolidColor', { colorValue: color(svgEl.attrs.stroke), name: 'Color' }),
      ]),
    );
  }
  return out;
}

/** A Rive Shape for one SVG shape element, in the coordinates of `frame`. Clip sources get no paint. */
function shapeFor(svgEl, ctm, frame, name, { clipSource = false, keyVertices = false } = {}) {
  const rel = S.mul(S.inv(frame), ctm);
  const s = Math.hypot(rel[0], rel[1]);
  const rot = Math.atan2(rel[1], rel[0]);
  const id = newId();
  const a = svgEl.attrs;
  const children = [];
  let x = 0, y = 0;
  if (svgEl.tag === 'circle' || svgEl.tag === 'ellipse') {
    [x, y] = S.apply(rel, [Number(a.cx), Number(a.cy)]);
    const rx = Number(a.r ?? a.rx), ry = Number(a.r ?? a.ry);
    children.push(el('Ellipse', { width: 2 * rx * s, height: 2 * ry * s, originX: 0.5, originY: 0.5, name: 'Path' }));
  } else if (svgEl.tag === 'rect') {
    const w = Number(a.width), h = Number(a.height);
    [x, y] = S.apply(rel, [Number(a.x) + w / 2, Number(a.y) + h / 2]);
    children.push(el('Rectangle', { width: w * s, height: h * s, originX: 0.5, originY: 0.5, cornerRadiusTL: Number(a.rx ?? 0) * s, name: 'Path' }));
  } else if (svgEl.tag === 'path') {
    S.parsePath(a.d).forEach((sp, k) => {
      const verts = S.subpathVertices(sp, rel).map((v, i) => {
        const hin = S.handle(v, v.in), hout = S.handle(v, v.out);
        const vName = `${name}_v${k ? k + '_' : ''}${i}`;
        const vid = keyVertices ? newId() : undefined;
        if (hin.distance < 1e-9 && hout.distance < 1e-9) return el('StraightVertex', { x: v.x, y: v.y, name: vName, id: vid });
        if (keyVertices) register(vName, vid, { x: v.x, y: v.y, ...hin, ...hout });
        return el('CubicDetachedVertex', { x: v.x, y: v.y, inRotation: hin.rotation, inDistance: hin.distance, outRotation: hout.rotation, outDistance: hout.distance, name: vName, id: vid });
      });
      children.push(el('PointsPath', { isClosed: sp.closed ? 'true' : 'false', name: `Path${k ? ' ' + k : ''}` }, verts));
    });
  } else throw new Error(`Unsupported shape <${svgEl.tag}>`);
  const attrs = { x, y, name, id };
  if (svgEl.tag !== 'path' && Math.abs(rot) > 1e-9) attrs.rotation = rot;
  if (a.opacity !== undefined && !clipSource) attrs.opacity = Number(a.opacity);
  if (!clipSource) children.push(...paints(svgEl, s));
  register(name, id, { x, y, rotation: attrs.rotation ?? 0, scaleX: 1, scaleY: 1, opacity: attrs.opacity ?? 1 });
  return el('Shape', attrs, children);
}

let anon = 0;
/** Converts SVG children into Rive children, front to back (Rive draws the first child on top). */
function convertChildren(svgParent, ctm, frame, parentName) {
  const out = [];
  for (const child of svgParent.children) {
    if (child.tag === 'defs' || child.tag === 'clipPath') continue;
    out.push(...convert(child, ctm, frame, parentName));
  }
  return out.reverse();
}

/** Returns the Rive elements for one SVG element, in back-to-front order (convertChildren reverses). */
function convert(svgEl, ctmParent, frameParent, parentName) {
  const a = svgEl.attrs;
  const name = a.id ?? `${parentName}_${svgEl.tag}${++anon}`;
  const ctm = S.mul(ctmParent, S.parseTransform(a.transform));
  const extraNodes = []; // clip sources sit beside the clipped node

  if (svgEl.tag === 'g') {
    // A group's frame: its pivot if it has one, else its own transform, else its parent's frame.
    let frame;
    if (a['data-pivot']) {
      const [px, py] = a['data-pivot'].split(/\s+/).map(Number);
      frame = S.mul(S.translate(px, py), linearOf(ctm));
    } else if (a.transform) frame = ctm;
    else frame = frameParent;
    const id = newId();
    const { attrs, rest } = nodeAttrs(name, frameParent, frame, { id });
    if (a.opacity !== undefined) attrs.opacity = Number(a.opacity);
    register(name, id, { ...rest, opacity: attrs.opacity ?? 1 });

    let children;
    if (name === 'mouth') {
      // Two sets inside the mouth: expression mouths, and the visemes that mouthOpen scales.
      const groupFor = (setName, filter) => {
        const gid = newId();
        register(setName, gid, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 });
        const kids = convertChildren({ children: svgEl.children.filter(filter) }, ctm, frame, setName);
        return el('Node', { x: 0, y: 0, name: setName, id: gid }, kids);
      };
      const talk = groupFor('mouth_talk', (c) => c.attrs.id?.startsWith('viseme_'));
      talk.attrs.opacity = 0;
      reg.mouth_talk.rest.opacity = 0;
      // mouthOpen (0 to 100) scales the visemes in Y around the mouth pivot.
      talk.children.unshift(el('DataBindContext', { sourcePathIds: `${VM.id}-${VM.props.mouthOpen.id}`, propertyKey: 17, converterId: CONVERTERS.mouthOpen }));
      children = [talk, groupFor('mouth_expr', (c) => c.attrs.id?.startsWith('mouth_'))];
    } else {
      children = convertChildren(svgEl, ctm, frame, name);
    }

    // Clipped group: a ClippingShape inside, and its source shape beside it in the same frame.
    const clipRef = a['clip-path']?.match(/url\(#([^)]+)\)/)?.[1];
    if (clipRef) {
      const srcName = `${name}_clipsrc_${clipRef}`;
      const src = shapeFor(clipDefs[clipRef], ctmParent, frameParent, srcName, { clipSource: true });
      extraNodes.push(src);
      children.unshift(el('ClippingShape', { sourceId: src.attrs.id, name: `Clip ${clipRef}` }));
    }

    // Stacked wrapper nodes for additive motion, each at the same pivot.
    for (const w of [...(WRAPPERS[name] ?? [])].reverse()) {
      const wid = newId();
      register(w, wid, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 });
      children = [el('Node', { x: 0, y: 0, name: w, id: wid }, children)];
    }
    return [...extraNodes, el('Node', attrs, children)];
  }

  // A shape with its own transform gets a node, so the transform can move.
  if (a.transform) {
    const frame = ctm;
    const id = newId();
    const { attrs, rest } = nodeAttrs(name, frameParent, frame, { id });
    register(name, id, { ...rest, opacity: 1 });
    const shape = shapeFor({ ...svgEl, attrs: { ...a, id: undefined } }, ctm, frame, `${name}_shape`, { keyVertices: name.startsWith('brow_shape_') });
    return [el('Node', attrs, [shape])];
  }
  return [shapeFor(svgEl, ctmParent, frameParent, name)];
}

// ---------- view model ----------
const VM = { id: newId(), instanceId: newId(), props: {}, enums: {} };
const enumOf = (enumName, keys) => {
  const id = newId();
  const values = Object.fromEntries(keys.map((k) => [k, newId()]));
  VM.enums[enumName] = { id, values, keys };
  return el('DataEnumCustom', { name: enumName, id }, keys.map((k) => el('DataEnumValue', { key: k, value: k, id: values[k] })));
};
const enums = [enumOf('Mood', MOODS), enumOf('Viseme', VISEMES)];
const prop = (name, tag, extra = {}) => (VM.props[name] = { id: newId(), tag, extra });
prop('mood', 'ViewModelPropertyEnumCustom', { enumId: VM.enums.Mood.id });
prop('viseme', 'ViewModelPropertyEnumCustom', { enumId: VM.enums.Viseme.id });
prop('mouthOpen', 'ViewModelPropertyNumber');
for (const t of TRIGGERS) prop(t, 'ViewModelPropertyTrigger');
// Not an InterviewVM value: the avatar component sets it from prefers-reduced-motion, like offline.
// It turns off breathing, nod and lean movement. Expressions and blinks stay (RIG.md).
prop('reducedMotion', 'ViewModelPropertyBoolean');
// InterviewVM.lipSync: true while the audio playing has alignment, so viseme is driven by letters.
// False, the rig picks the viseme from mouthOpen.
prop('lipSync', 'ViewModelPropertyBoolean');

const CONVERTERS = { mouthOpen: newId() };
const converters = [
  el('DataConverterRangeMapper', { minInput: 0, maxInput: 100, minOutput: T.mouthOpenScale[0], maxOutput: T.mouthOpenScale[1], clampLower: 'true', clampUpper: 'true', name: 'mouthOpen to scaleY', id: CONVERTERS.mouthOpen }),
];

function viewModel() {
  const props = Object.entries(VM.props).map(([name, p]) => el(p.tag, { ...p.extra, name, id: p.id }));
  const values = Object.entries(VM.props).map(([name, p]) => {
    if (name === 'mood') return el('ViewModelInstanceEnum', { propertyValue: VM.enums.Mood.values.idle, viewModelPropertyId: p.id });
    if (name === 'viseme') return el('ViewModelInstanceEnum', { propertyValue: VM.enums.Viseme.values.rest, viewModelPropertyId: p.id });
    if (p.tag === 'ViewModelPropertyNumber') return el('ViewModelInstanceNumber', { propertyValue: 0, viewModelPropertyId: p.id });
    if (p.tag === 'ViewModelPropertyBoolean') return el('ViewModelInstanceBoolean', { propertyValue: 'false', viewModelPropertyId: p.id });
    return el('ViewModelInstanceTrigger', { viewModelPropertyId: p.id });
  });
  return el('ViewModel', { defaultInstanceId: VM.instanceId, name: 'InterviewVM', id: VM.id }, [...props, el('ViewModelInstance', { exports: 'true', name: 'Default', id: VM.instanceId }, values)]);
}

// ---------- the scene ----------
const svgRoot = parts.children.find((c) => c.attrs.id === 'meera');
const artboardFrame = S.I;
const sceneChildren = convertChildren(svgRoot, S.I, artboardFrame, 'meera');

// Blink: each upper lid and lash flick is pulled to a closed target by a TransformConstraint.
// The blink layer keys only the constraint strength, so a blink closes the lid fully from
// whatever pose the expression left it in, and opens back to that pose.
function findEl(e, name) {
  if (e.attrs?.name === name) return e;
  for (const c of e.children ?? []) {
    const f = findEl(c, name);
    if (f) return f;
  }
  return null;
}
function parentOf(e, target) {
  for (const c of e.children ?? []) {
    if (c === target) return e;
    const f = parentOf(c, target);
    if (f) return f;
  }
  return null;
}
const sceneRoot = el('Root', {}, sceneChildren);
function addBlinkTarget(partName, closedDy) {
  const node = findEl(sceneRoot, partName);
  const parent = parentOf(sceneRoot, node);
  const r = reg[partName].rest;
  const tid = newId();
  parent.children.push(el('Node', { x: r.x, y: r.y + closedDy, name: `${partName}_closed`, id: tid }));
  const cid = newId();
  node.children.unshift(el('TransformConstraint', { targetId: tid, strength: 0, name: `${partName}_blink`, id: cid }));
  register(`${partName}_blink`, cid, { strength: 0 });
}
const closedFlick = X.blink.lid_upper_ty - 0.32; // the flick follows the outer lid edge: 42 px when closed
for (const s of ['L', 'R']) {
  addBlinkTarget(`lid_upper_${s}`, T.blink.closedTy);
  addBlinkTarget(`lash_flick_${s}`, closedFlick);
}

// ---------- poses ----------
const rad = (deg) => (deg * Math.PI) / 180;
const browVerts = (arch) => {
  const a = -3 + arch * 9; // arch_min a = -3, arch_max a = 6 (expressions.json browShapes)
  const d = `M-23 3 Q-6 ${-9 - a} 23 -1 Q25 4 21 6 Q-4 ${-1 - a} -21 8 Q-26 7 -23 3 Z`;
  return S.subpathVertices(S.parsePath(d)[0], S.I).map((v) => ({ in: S.handle(v, v.in), out: S.handle(v, v.out) }));
};

/** The keys for one expression's values. `only` limits them to some parts (glanceDown, checkWatch). */
function poseKeys(v, only) {
  const k = [];
  const set = (name, property, value) => {
    if (!reg[name]) throw new Error(`No rig part ${name}`);
    if (!only || only(name)) k.push({ name, property, value });
  };
  set('head', 'rotation', reg.head.rest.rotation + rad(v.head.rot));
  set('blush_L', 'opacity', v.blush.opacity);
  set('blush_R', 'opacity', v.blush.opacity);
  for (const s of ['L', 'R']) {
    const b = v[`brow_${s}`];
    set(`brow_${s}`, 'y', reg[`brow_${s}`].rest.y + b.ty);
    set(`brow_${s}`, 'rotation', rad(b.rot));
    browVerts(b.arch).forEach((h, i) => {
      const vn = `brow_shape_${s}_shape_v${i}`;
      set(vn, 'inRotation', h.in.rotation);
      set(vn, 'inDistance', h.in.distance);
      set(vn, 'outRotation', h.out.rotation);
      set(vn, 'outDistance', h.out.distance);
    });
    const lu = v[`lid_upper_${s}`];
    set(`lid_upper_${s}`, 'y', reg[`lid_upper_${s}`].rest.y + lu.ty);
    set(`lid_upper_${s}`, 'rotation', rad(lu.rot));
    const ll = v[`lid_lower_${s}`];
    set(`lid_lower_${s}`, 'y', reg[`lid_lower_${s}`].rest.y + ll.ty);
    set(`lid_lower_line_${s}`, 'opacity', ll.line);
    set(`lash_flick_${s}`, 'y', reg[`lash_flick_${s}`].rest.y + v[`lash_flick_${s}`].ty);
    const p = v[`pupil_${s}`];
    set(`pupil_${s}`, 'x', reg[`pupil_${s}`].rest.x + p.tx);
    set(`pupil_${s}`, 'y', reg[`pupil_${s}`].rest.y + p.ty);
    set(`pupil_${s}`, 'scaleX', p.scale);
    set(`pupil_${s}`, 'scaleY', p.scale);
    const mode = v[`eye_${s}`];
    set(`eye_open_${s}`, 'opacity', mode === 'open' ? 1 : 0);
    set(`eye_happy_${s}`, 'opacity', mode === 'happy' ? 1 : 0);
    set(`eye_closed_${s}`, 'opacity', mode === 'closed' ? 1 : 0);
  }
  // The expression's own mouth. A viseme here (talking) means the mouth comes from the viseme
  // layer, so the expression set rests on the neutral mouth.
  const mouth = EXPRESSION_MOUTHS.includes(v.mouth) ? v.mouth : 'mouth_neutral';
  for (const m of EXPRESSION_MOUTHS) set(m, 'opacity', m === mouth ? 1 : 0);
  set('hand_R', 'x', reg.hand_R.rest.x);
  set('hand_R', 'y', reg.hand_R.rest.y);
  return k;
}

// Lid values for an openness (0 shut, 1 wide), the same geometry as rive/source/rig.js.
function lidFor(openness) {
  const H = 46, neutralY = (1 - 0.92) * H; // lid edge below the eye top, neutral
  const y = (1 - openness) * H;
  return { lidTy: y - neutralY, flickTy: Math.max(y, 4) - Math.max(neutralY, 4) };
}

// ---------- animations ----------
const animations = [];
const animIds = {};
const FPS = 1000; // frames are milliseconds
function anim(name, duration, tracks, { loop = false } = {}) {
  const id = newId();
  animIds[name] = id;
  const byObj = new Map();
  for (const t of tracks) {
    if (!byObj.has(t.name)) byObj.set(t.name, []);
    byObj.get(t.name).push(t);
  }
  const keyed = [...byObj.entries()].map(([name, ts]) =>
    el('KeyedObject', { objectId: reg[name].id }, ts.map((t) =>
      el('KeyedProperty', { property: t.property }, (t.keys ?? [{ frame: 0, value: t.value }]).map((k) => {
        const attrs = { value: k.value, frame: k.frame, interpolationType: k.ease ? 'cubic' : k.linear ? 'linear' : 'hold' };
        const kids = k.ease ? [el('CubicEaseInterpolator', { x1: k.ease[0], y1: k.ease[1], x2: k.ease[2], y2: k.ease[3] })] : [];
        return el('KeyFrameDouble', attrs, kids);
      })),
    )),
  );
  animations.push(el('LinearAnimation', { fps: FPS, duration: Math.max(1, Math.round(duration)), loopValue: loop ? 'loop' : 'oneShot', name, id }, keyed));
  return id;
}
const EASE = [0.42, 0, 0.58, 1];
const EASE_OUT = [0, 0, 0.58, 1];
const EASE_IN = [0.42, 0, 1, 1];

// Face poses: one per mood, and the face part of each trigger.
const poses = {};
for (const mood of MOODS) {
  const keys = poseKeys(X.expressions[MOOD_EXPRESSION[mood]]);
  if (mood === 'writing') {
    // The hand writes: small strokes, 5 a second.
    const hand = keys.filter((k) => k.name === 'hand_R');
    const others = keys.filter((k) => k.name !== 'hand_R');
    const rx = reg.hand_R.rest.x, ry = reg.hand_R.rest.y, h = T.writing.strokeMs;
    poses[mood] = anim(`face_${mood}`, h, [
      ...others,
      { name: 'hand_R', property: 'x', keys: [{ frame: 0, value: rx - T.writing.dx, ease: EASE }, { frame: h / 2, value: rx + T.writing.dx, ease: EASE }, { frame: h, value: rx - T.writing.dx }] },
      { name: 'hand_R', property: 'y', keys: [{ frame: 0, value: ry, ease: EASE }, { frame: h / 4, value: ry - 1, ease: EASE }, { frame: (3 * h) / 4, value: ry + 1, ease: EASE }, { frame: h, value: ry }] },
    ], { loop: true });
    void hand;
  } else poses[mood] = anim(`face_${mood}`, 100, keys);
}
const eyesOnly = (n) => /^(lid_|lash_flick_|pupil_|eye_)/.test(n);
const triggerFace = {
  browRaise: { anim: anim('face_browRaise', T.browRaise.inMs + T.browRaise.holdMs, poseKeys(X.expressions.interested)), inMs: T.browRaise.inMs, outMs: T.browRaise.outMs },
  glanceDown: { anim: anim('face_glanceDown', T.glanceDown.inMs + T.glanceDown.holdMs, poseKeys(X.expressions.writing, eyesOnly)), inMs: T.glanceDown.inMs, outMs: T.glanceDown.outMs },
  checkWatch: (() => {
    const cw = T.checkWatch, lid = lidFor(cw.lid);
    const keys = [];
    for (const s of ['L', 'R']) {
      keys.push({ name: `pupil_${s}`, property: 'x', value: reg[`pupil_${s}`].rest.x + cw.look.x * T.pupilRange });
      keys.push({ name: `pupil_${s}`, property: 'y', value: reg[`pupil_${s}`].rest.y + cw.look.y * T.pupilRange });
      keys.push({ name: `lid_upper_${s}`, property: 'y', value: reg[`lid_upper_${s}`].rest.y + lid.lidTy });
      keys.push({ name: `lid_upper_${s}`, property: 'rotation', value: 0 });
      keys.push({ name: `lash_flick_${s}`, property: 'y', value: reg[`lash_flick_${s}`].rest.y + lid.flickTy });
    }
    return { anim: anim('face_checkWatch', cw.inMs + cw.holdMs, keys), inMs: cw.inMs, outMs: cw.outMs };
  })(),
  smile: { anim: anim('face_smile', T.smile.inMs + T.smile.holdMs, poseKeys(X.expressions.warmSmile)), inMs: T.smile.inMs, outMs: T.smile.outMs },
  leanIn: { anim: anim('face_leanIn', T.leanIn.inMs + T.leanIn.holdMs, poseKeys(X.expressions.interested, eyesOnly)), inMs: T.leanIn.inMs, outMs: T.leanIn.outMs },
  // Holds until she speaks (mood talking), or 2 s.
  expectant: { anim: anim('face_expectant', T.expectant.holdMs, poseKeys(X.expressions.expectant)), inMs: T.blendMs, outMs: T.blendMs, untilTalking: true },
};

// Pupil drift while idle or listening: a slow loop of small looks, each a quick move then a hold.
const driftR = T.drift.maxLook * T.pupilRange;
const driftPts = [[0, 0, 0], [1800, 0.8, -0.3], [4300, -0.6, 0.4], [6100, 0.3, 0.7], [8700, -0.9, -0.2], [11000, 0, 0]];
function driftTrack(s, axis) {
  const keys = [];
  driftPts.forEach(([t, x, y], i) => {
    const v = (axis === 'x' ? x : y) * driftR;
    if (i > 0) keys.push({ frame: t - 140, value: (axis === 'x' ? driftPts[i - 1][1] : driftPts[i - 1][2]) * driftR, ease: EASE });
    keys.push({ frame: t, value: v, ease: i < driftPts.length - 1 ? undefined : undefined });
  });
  return { name: `pupil_${s}_drift`, property: axis, keys };
}
const driftAnim = anim('drift_loop', 11000, ['L', 'R'].flatMap((s) => [driftTrack(s, 'x'), driftTrack(s, 'y')]), { loop: true });
const driftStill = anim('drift_still', 100, ['L', 'R'].flatMap((s) => [{ name: `pupil_${s}_drift`, property: 'x', value: 0 }, { name: `pupil_${s}_drift`, property: 'y', value: 0 }]));

// Blink: constraint strength 0 open, 1 closed.
const blinkParts = ['lid_upper_L', 'lid_upper_R', 'lash_flick_L', 'lash_flick_R'].map((p) => `${p}_blink`);
const blinkKeys = (times) => blinkParts.map((name) => ({ name, property: 'strength', keys: times }));
const b = T.blink;
const oneBlink = (t0) => [
  { frame: t0, value: 0, ease: EASE_IN },
  { frame: t0 + b.closeMs, value: 1 },
  { frame: t0 + b.closeMs + b.holdMs, value: 1, ease: EASE_OUT },
  { frame: t0 + b.closeMs + b.holdMs + b.openMs, value: 0 },
];
const blinkLen = b.closeMs + b.holdMs + b.openMs;
const blinkSingle = anim('blink', blinkLen, blinkKeys(oneBlink(0)));
const blinkDouble = anim('blink_double', 2 * blinkLen + 60, blinkKeys([...oneBlink(0), ...oneBlink(blinkLen + 60)]));
const blinkWaits = b.waitsMs.map((ms) => anim(`blink_wait_${ms}`, ms, blinkKeys([{ frame: 0, value: 0 }])));

// Mouth: which set shows. Talking shows the visemes; every other mood shows the expression mouth.
const mouthExpr = anim('mouth_expression', 100, [{ name: 'mouth_expr', property: 'opacity', value: 1 }, { name: 'mouth_talk', property: 'opacity', value: 0 }]);
const mouthTalk = anim('mouth_talking', 100, [{ name: 'mouth_expr', property: 'opacity', value: 0 }, { name: 'mouth_talk', property: 'opacity', value: 1 }]);
const visemeAnims = Object.fromEntries(
  SCOPE.visemes.map((v) => [v, anim(`viseme_${v}`, 100, VISEMES.map((w) => ({ name: `viseme_${w}`, property: 'opacity', value: w === v ? 1 : 0 })))]),
);

// Reactions on their own nodes, so they add to whatever the face is doing.
const headRest = anim('head_rest', 100, [
  { name: 'head_react', property: 'y', value: 0 },
  { name: 'head_react', property: 'rotation', value: 0 },
  { name: 'head_react', property: 'scaleX', value: 1 },
  { name: 'head_react', property: 'scaleY', value: 1 },
]);
const n = T.nod;
const headNod = anim('head_nod', n.downMs + n.upMs, [
  { name: 'head_react', property: 'y', keys: [{ frame: 0, value: 0, ease: EASE }, { frame: n.downMs, value: n.dy, ease: EASE }, { frame: n.downMs + n.upMs, value: 0 }] },
  { name: 'head_react', property: 'rotation', keys: [{ frame: 0, value: 0, ease: EASE }, { frame: n.downMs, value: rad(n.rotDeg), ease: EASE }, { frame: n.downMs + n.upMs, value: 0 }] },
  { name: 'head_react', property: 'scaleX', value: 1 },
  { name: 'head_react', property: 'scaleY', value: 1 },
]);
// In, hold, out, as keys on one property: rest -> peak -> rest.
const inHoldOut = (t, peak) => [
  { frame: 0, value: 0, ease: EASE },
  { frame: t.inMs, value: peak },
  { frame: t.inMs + t.holdMs, value: peak, ease: EASE },
  { frame: t.inMs + t.holdMs + t.outMs, value: 0 },
];
const li = T.leanIn;
const headLeanIn = anim('head_leanIn', li.inMs + li.holdMs + li.outMs, [
  { name: 'head_react', property: 'y', keys: inHoldOut(li, li.dy) },
  { name: 'head_react', property: 'rotation', value: 0 },
  { name: 'head_react', property: 'scaleX', keys: inHoldOut(li, li.scale - 1).map((k) => ({ ...k, value: 1 + k.value })) },
  { name: 'head_react', property: 'scaleY', keys: inHoldOut(li, li.scale - 1).map((k) => ({ ...k, value: 1 + k.value })) },
]);
const armRest = anim('arm_rest', 100, [{ name: 'arm_react', property: 'y', value: 0 }, { name: 'arm_react', property: 'rotation', value: 0 }]);
const cw = T.checkWatch;
const armCheckWatch = anim('arm_checkWatch', cw.inMs + cw.holdMs + cw.outMs, [
  { name: 'arm_react', property: 'y', keys: inHoldOut(cw, cw.armDy) },
  { name: 'arm_react', property: 'rotation', value: 0 },
]);
// handUp: "one second".
const hu = T.handUp;
const armHandUp = anim('arm_handUp', hu.inMs + hu.holdMs + hu.outMs, [
  { name: 'arm_react', property: 'y', keys: inHoldOut(hu, hu.armDy) },
  { name: 'arm_react', property: 'rotation', keys: inHoldOut(hu, rad(hu.armRotDeg)) },
]);

// Posture: sitUp lifts body, head and arm 3 px and the brows 2 px, then stays for the call.
const postureNodes = (dy, browDy) => [
  ...['body_posture', 'head_posture', 'arm_posture'].map((name) => ({ name, property: 'y', value: dy })),
  ...['brow_L_posture', 'brow_R_posture'].map((name) => ({ name, property: 'y', value: browDy })),
];
const postureRest = anim('posture_rest', 100, postureNodes(0, 0));
const postureSitUp = anim('posture_sitUp', 100, postureNodes(T.sitUp.dy, T.sitUp.browDy));

// Breathing: the body rises 1.5 px on a 4 s sine, the head follows 120 ms later by 1.2 px, the arm with the body.
const br = T.breath;
const sineKeys = (amp, lagMs) => {
  const keys = [];
  for (let t = 0; t <= br.periodMs; t += 100) {
    const phase = ((t - lagMs) / br.periodMs) * 2 * Math.PI;
    keys.push({ frame: t, value: (amp * (1 - Math.cos(phase))) / 2, linear: true });
  }
  return keys;
};
const breathLoop = anim('breath_loop', br.periodMs, [
  { name: 'body_breath', property: 'y', keys: sineKeys(br.bodyDy, 0) },
  { name: 'arm_breath', property: 'y', keys: sineKeys(br.bodyDy, 0) },
  { name: 'head_breath', property: 'y', keys: sineKeys(br.headDy, br.headLagMs) },
], { loop: true });
const breathStill = anim('breath_still', 100, ['body_breath', 'arm_breath', 'head_breath'].map((name) => ({ name, property: 'y', value: 0 })));

// ---------- state machine ----------
const easeInterp = () => el('CubicEaseInterpolator', { x1: EASE[0], y1: EASE[1], x2: EASE[2], y2: EASE[3] });
const enumCond = (prop, enumName, key, op = 'equal') =>
  el('TransitionViewModelCondition', { opValue: op }, [
    el('TransitionPropertyViewModelComparator', {}, [el('BindablePropertyEnum', {}, [el('DataBindContext', { sourcePathIds: `${VM.id}-${VM.props[prop].id}`, propertyKey: 637 })])]),
    el('TransitionValueEnumComparator', { value: VM.enums[enumName].values[key] }),
  ]);
const boolCond = (name, value) =>
  el('TransitionViewModelCondition', { opValue: 'equal' }, [
    el('TransitionPropertyViewModelComparator', {}, [el('BindablePropertyBoolean', {}, [el('DataBindContext', { sourcePathIds: `${VM.id}-${VM.props[name].id}`, propertyKey: 634 })])]),
    el('TransitionValueBooleanComparator', { value: value ? 'true' : 'false' }),
  ]);
const numCond = (name, op, value) =>
  el('TransitionViewModelCondition', { opValue: op }, [
    el('TransitionPropertyViewModelComparator', {}, [el('BindablePropertyNumber', {}, [el('DataBindContext', { sourcePathIds: `${VM.id}-${VM.props[name].id}`, propertyKey: 636 })])]),
    el('TransitionValueNumberComparator', { value }),
  ]);
const triggerCond = (name) =>
  el('TransitionViewModelCondition', {}, [
    el('TransitionPropertyViewModelComparator', {}, [el('BindablePropertyTrigger', {}, [el('DataBindContext', { sourcePathIds: `${VM.id}-${VM.props[name].id}`, propertyKey: 686 })])]),
    el('TransitionValueTriggerComparator', {}),
  ]);
const transition = (to, { ms = 0, ease = false, exit = false, conds = [] } = {}) => {
  const attrs = { stateToId: to };
  if (ms) attrs.duration = ms;
  if (ease) attrs.interpolationType = 'cubic';
  if (exit) Object.assign(attrs, { enableExitTime: 'true', exitTimeIsPercetange: 'true', exitTime: 100 });
  return el('StateTransition', attrs, [...(ease ? [easeInterp()] : []), ...conds]);
};
function layer(name, build) {
  const lid = newId();
  const states = [];
  const anyId = newId();
  const any = el('AnyState', { x: 0, y: -160, id: anyId });
  let col = 0;
  const state = (animationId, opts = {}) => {
    const id = newId();
    const s = el('AnimationState', { animationId, x: 180 + (col % 6) * 200, y: Math.floor(col / 6) * 160 + (col % 2) * 60, id, ...(opts.random ? { random: 'true' } : {}) });
    col++;
    states.push(s);
    return s;
  };
  const entry = el('EntryState', { x: 0, y: 0 });
  build({ state, any, entry });
  return el('StateMachineLayer', { name, id: lid }, [any, el('ExitState', { x: 0, y: -320 }), entry, ...states]);
}

const layers = [];
// 1. Face: moods, and the face part of triggers.
layers.push(layer('Face', ({ state, any, entry }) => {
  const moodState = Object.fromEntries(MOODS.map((m) => [m, state(poses[m])]));
  entry.children.push(transition(moodState.idle.attrs.id));
  for (const from of MOODS) for (const to of MOODS) {
    if (from !== to) moodState[from].children.push(transition(moodState[to].attrs.id, { ms: T.blendMs, ease: true, conds: [enumCond('mood', 'Mood', to)] }));
  }
  for (const t of SCOPE.triggers) {
    const f = triggerFace[t];
    if (!f) continue;
    const s = state(f.anim, {});
    s.attrs.reset = 'true';
    any.children.push(transition(s.attrs.id, { ms: f.inMs, ease: true, conds: [triggerCond(t)] }));
    // expectant leaves as soon as she speaks; every trigger leaves for the current mood when its hold ends.
    if (f.untilTalking) s.children.push(transition(moodState.talking.attrs.id, { ms: f.outMs, ease: true, conds: [enumCond('mood', 'Mood', 'talking')] }));
    for (const m of MOODS) s.children.push(transition(moodState[m].attrs.id, { ms: f.outMs, ease: true, exit: true, conds: [enumCond('mood', 'Mood', m)] }));
  }
}));
// 2. Pupil drift while idle or listening.
layers.push(layer('Drift', ({ state, entry }) => {
  const still = state(driftStill), drift = state(driftAnim);
  entry.children.push(transition(still.attrs.id));
  for (const m of ['idle', 'listening']) still.children.push(transition(drift.attrs.id, { ms: T.blendMs, ease: true, conds: [enumCond('mood', 'Mood', m)] }));
  drift.children.push(transition(still.attrs.id, { ms: T.blendMs, ease: true, conds: [enumCond('mood', 'Mood', 'idle', 'notEqual'), enumCond('mood', 'Mood', 'listening', 'notEqual')] }));
}));
// 3. Blink on its own timer: a random wait of 2.5 to 5.5 s, then a blink, 1 in 10 a double.
layers.push(layer('Blink', ({ state, entry }) => {
  const waits = blinkWaits.map((a) => state(a, { random: true }));
  const single = state(blinkSingle, { random: true }), dbl = state(blinkDouble, { random: true });
  entry.children.push(transition(waits[3].attrs.id));
  for (const w of waits) {
    const ts = transition(single.attrs.id, { exit: true }); ts.attrs.randomWeight = b.singleWeight;
    const td = transition(dbl.attrs.id, { exit: true }); td.attrs.randomWeight = b.doubleWeight;
    w.children.push(ts, td);
  }
  for (const bl of [single, dbl]) for (const w of waits) bl.children.push(transition(w.attrs.id, { exit: true }));
}));
// 4. Mouth set: visemes while talking, the expression's mouth otherwise.
layers.push(layer('Mouth', ({ state, entry }) => {
  const expr = state(mouthExpr), talk = state(mouthTalk);
  entry.children.push(transition(expr.attrs.id));
  expr.children.push(transition(talk.attrs.id, { ms: T.mouthFadeMs, conds: [enumCond('mood', 'Mood', 'talking')] }));
  talk.children.push(transition(expr.attrs.id, { ms: T.mouthFadeMs, conds: [enumCond('mood', 'Mood', 'talking', 'notEqual')] }));
}));
// 5. Viseme: one state per viseme, a 40 ms crossfade between them. With lipSync on, the viseme
// value picks the state. Off (no alignment for this audio), mouthOpen picks rest, teeth or open.
layers.push(layer('Viseme', ({ state, entry }) => {
  const vs = Object.fromEntries(SCOPE.visemes.map((v) => [v, state(visemeAnims[v])]));
  const [lo, hi] = T.fallbackBands;
  const bands = {
    rest: [numCond('mouthOpen', 'lessThan', lo)],
    teeth: [numCond('mouthOpen', 'greaterThanOrEqual', lo), numCond('mouthOpen', 'lessThan', hi)],
    open: [numCond('mouthOpen', 'greaterThanOrEqual', hi)],
  };
  const auto = Object.fromEntries(Object.keys(bands).map((v) => [v, state(visemeAnims[v])]));
  entry.children.push(transition(vs.rest.attrs.id));
  const on = boolCond('lipSync', true), off = () => boolCond('lipSync', false);
  for (const from of [...Object.values(vs), ...Object.values(auto)]) {
    for (const to of SCOPE.visemes) {
      if (from !== vs[to]) from.children.push(transition(vs[to].attrs.id, { ms: T.mouthFadeMs, conds: [boolCond('lipSync', true), enumCond('viseme', 'Viseme', to)] }));
    }
    for (const [band, conds] of Object.entries(bands)) {
      if (from !== auto[band]) from.children.push(transition(auto[band].attrs.id, { ms: T.mouthFadeMs, conds: [off(), ...conds] }));
    }
  }
  void on;
}));
// 6. Head reactions: nod and leanIn. Both are movement, so reduced motion skips them.
layers.push(layer('Head', ({ state, any, entry }) => {
  const rest = state(headRest);
  entry.children.push(transition(rest.attrs.id));
  for (const [trigger, a] of [['nod', headNod], ['leanIn', headLeanIn]]) {
    const s = state(a);
    s.attrs.reset = 'true';
    any.children.push(transition(s.attrs.id, { ms: 60, conds: [triggerCond(trigger), boolCond('reducedMotion', false)] }));
    s.children.push(transition(rest.attrs.id, { exit: true }));
  }
}));
// 7. Arm reactions: checkWatch and handUp.
layers.push(layer('Arm', ({ state, any, entry }) => {
  const rest = state(armRest);
  entry.children.push(transition(rest.attrs.id));
  for (const [trigger, a] of [['checkWatch', armCheckWatch], ['handUp', armHandUp]]) {
    const s = state(a);
    s.attrs.reset = 'true';
    any.children.push(transition(s.attrs.id, { ms: 60, conds: [triggerCond(trigger)] }));
    s.children.push(transition(rest.attrs.id, { exit: true }));
  }
}));
// 8. Posture: sitUp, then it stays for the call.
layers.push(layer('Posture', ({ state, entry }) => {
  const rest = state(postureRest), up = state(postureSitUp);
  entry.children.push(transition(rest.attrs.id));
  rest.children.push(transition(up.attrs.id, { ms: T.sitUp.ms, ease: true, conds: [triggerCond('sitUp')] }));
}));
// 9. Breathing, off with reduced motion.
layers.push(layer('Breath', ({ state, entry }) => {
  const breathe = state(breathLoop), still = state(breathStill);
  entry.children.push(transition(breathe.attrs.id));
  breathe.children.push(transition(still.attrs.id, { ms: T.blendMs, ease: true, conds: [boolCond('reducedMotion', true)] }));
  still.children.push(transition(breathe.attrs.id, { ms: T.blendMs, ease: true, conds: [boolCond('reducedMotion', false)] }));
}));

const smId = newId();
const stateMachine = el('StateMachine', { name: 'InterviewVM', id: smId }, layers);

// ---------- the file ----------
const styleId = newId();
// For the contact sheet only: `--backdrop 0B051D --out build/sheet/meera.rml` paints the artboard,
// so captures match the reference's dark tiles. The shipped rig stays transparent.
const arg = (flag) => { const i = process.argv.indexOf(flag); return i > 0 ? process.argv[i + 1] : undefined; };
const backdrop = arg('--backdrop');
const outFile = arg('--out') ? path.resolve(arg('--out')) : path.join(ROOT, 'meera.rml');
const artboard = el('Artboard', { defaultStateMachineId: smId, viewModelId: VM.id, viewModelInstanceId: VM.instanceId, styleId, width: 400, height: 440, name: 'Meera', id: newId() }, [
  el('LayoutComponentStyle', { name: 'Artboard Style', id: styleId }),
  ...(backdrop ? [el('Fill', { name: 'Sheet backdrop' }, [el('SolidColor', { colorValue: 'FF' + backdrop, name: 'Color' })])] : []),
  ...sceneRoot.children,
  stateMachine,
  ...animations,
]);
const doc = el('Rive', { version: 1, kind: 'fragment' }, [artboard, ...enums, ...converters, viewModel()]);
const header = '<!-- Generated by rive/rig/make-rig.js from parts/meera-parts.svg and expressions.json. Do not edit by hand. -->\n';
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, header + serialize(doc) + '\n');
console.log(`${path.relative(process.cwd(), outFile)}: ${Object.keys(reg).length} rig parts, ${animations.length} animations, ${layers.length} layers`);
