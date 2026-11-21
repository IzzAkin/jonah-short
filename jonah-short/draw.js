// Drawing library: maths, camera, light, and the stickman rig.
const PI = Math.PI, TAU = PI * 2;
const OUT = '#3d2d24';           // outline ink
const LW = 5;                    // outline weight at scale 1 (measured: ink line = 0.035 x head diameter)
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => (k = clamp(k), k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const sstep = (t, a, b) => ease(seg(t, a, b));
const mod = (a, n) => ((a % n) + n) % n;

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Keyframes: [[t, {x,y,z}], ...]; travels ease in/out, repeated values hold.
// Render state set by main.js for each frame.
let NOW = 0;          // absolute film time used for idle motion, blinks, particles (frozen during holds)
let CUT_T = null;     // local time of an in-shot camera cut being dissolved
let CAM_SIDE = null;  // 'before' | 'after' while rendering the two sides of that dissolve
let SHOT_N = 1;
const PUSH = 0.062;   // constant push-in: +4.5 % scale per second (Rick's Clips median +0.15 %/frame)
const DRIFT = 42;     // slow lateral drift, world px per second (about 1 px/frame on screen)

// Keyframes: [[t, {x,y,z}], ...]; travels ease in/out, repeated values hold.
// A key with a third element ('cut') starts a new camera setup; main.js dissolves across it.
// Every setup gets a constant slow push-in and sideways drift on top, so the camera never sits still.
function kf(t, keys) {
  const segs = [[]];
  keys.forEach(k => { if (k[2] && segs[segs.length - 1].length) segs.push([]); segs[segs.length - 1].push(k); });
  const ref = CUT_T != null ? (CAM_SIDE === 'before' ? CUT_T - 1e-4 : CUT_T + 1e-4) : t;
  let si = 0;
  for (let i = 1; i < segs.length; i++) if (ref >= segs[i][0][0]) si = i;
  const ks = segs[si];
  let o = { ...ks[ks.length - 1][1] };
  if (t <= ks[0][0]) o = { ...ks[0][1] };
  else for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) {
      const k = ease((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])); o = {};
      for (const key in ks[i][1]) o[key] = lerp(ks[i - 1][1][key], ks[i][1][key], k);
      break;
    }
  }
  const s0 = si === 0 ? Math.min(0, ks[0][0]) : ks[0][0];
  const dt = Math.max(0, t - s0);
  if (o.z !== undefined) {
    o.z *= Math.pow(1 + PUSH, dt);
    o.x += ((SHOT_N + si) % 2 ? 1 : -1) * DRIFT * dt / o.z;
  }
  return o;
}

function hashStr(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; }
// Blink schedule per character: eyes pop shut for 2-3 frames every ~1.3-3.5 s, sometimes a double blink.
function blinkClosed(id, t, crowd) {
  const r = rng(hashStr(id));
  let bt = r() * 1.8;
  while (bt <= t) {
    const dur = (r() < 0.55 ? 2 : 3) / 30;
    if (t < bt + dur) return true;
    if (r() < 0.22) { const b2 = bt + dur + 0.2 + r() * 0.25; if (t >= b2 && t < b2 + 2 / 30) return true; bt = b2; }
    bt += crowd ? 6 + r() * 6 : 3.3 + r() * 3.6;   // tuned so the whole film lands near 20-25 blinks/min, like the reference
  }
  return false;
}
// Drifting light motes / dust in screen space: keeps something moving in every frame.
function motes(g, t, cfg) {
  if (!cfg) return;
  const [rgb, n0, size0, vy] = cfg, r = rng(99), n = Math.round(n0 * 1.1), size = size0 * 1.4;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, y0 = r() * H, sp = 0.5 + r(), ph = r() * TAU, rr = size * (0.6 + r() * 0.9);
    const x = mod(x0 + Math.sin(t * 1.4 * sp + ph) * 60 + t * 30 * sp, W + 40) - 20;
    const y = mod(y0 - t * (vy * 3 + 20) * sp, H + 40) - 20;
    const a = 0.5 + 0.45 * Math.sin(t * 7 * sp + ph);   // twinkle
    const gr = g.createRadialGradient(x, y, 0, x, y, rr * 3);
    gr.addColorStop(0, rgba(rgb, a)); gr.addColorStop(0.3, rgba(rgb, a * 0.6)); gr.addColorStop(1, rgba(rgb, 0));
    g.fillStyle = gr; g.fillRect(x - rr * 3, y - rr * 3, rr * 6, rr * 6);
  }
  g.restore();
}
// A pennant on a pole, waving.
function flag(g, x, y, col, len = 90, ph = 0) {
  line(g, x, y, x, y - 170, 7); line(g, x, y, x, y - 170, 3, '#7a4f2c');
  const top = [], bot = [];
  for (let i = 0; i <= 10; i++) {
    const k = i / 10, wv = Math.sin(NOW * 6.5 - k * 4.5 + ph) * 10 * k;
    top.push([x + len * k, y - 170 + wv + k * 22]); bot.push([x + len * k, y - 116 + wv - k * 22]);
  }
  poly(g, top.concat(bot.reverse())); fs(g, col, 5);
}

// Camera: (cam.x, cam.y) is the world point at screen centre, cam.z the zoom.
// depth 1 = the action plane; <1 farther (moves less), >1 nearer (moves more).
function withCam(g, cam, depth, fn) {
  g.save();
  g.translate(W / 2, H / 2);
  const z = 1 + (cam.z - 1) * depth;
  g.scale(z, z);
  g.translate(-(W / 2 + (cam.x - W / 2) * depth), -(H / 2 + (cam.y - H / 2) * depth));
  fn();
  g.restore();
}

function stroke(g, w = LW, c = OUT) { g.lineWidth = w; g.strokeStyle = c; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
function fill(g, c) { g.fillStyle = c; g.fill(); }
function fs(g, c, w = LW) { fill(g, c); if (w) stroke(g, w); }
function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); }
function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function poly(g, pts, close = true) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); if (close) g.closePath(); }
function line(g, x1, y1, x2, y2, w = LW, c = OUT) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); stroke(g, w, c); }

function vgrad(g, y0, y1, stops) { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function rgba(rgb, a) { return `rgba(${rgb},${a})`; }

function glow(g, x, y, r, rgb, a = 1) {
  if (a <= 0) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(rgb, a)); gr.addColorStop(0.35, rgba(rgb, a * 0.45)); gr.addColorStop(1, rgba(rgb, 0));
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore();
}
function beam(g, x1, y1, w1, x2, y2, w2, rgb, a) {
  if (a <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(x1, y1, x2, y2);
  gr.addColorStop(0, rgba(rgb, a)); gr.addColorStop(1, rgba(rgb, 0));
  g.fillStyle = gr; poly(g, [[x1 - w1 / 2, y1], [x1 + w1 / 2, y1], [x2 + w2 / 2, y2], [x2 - w2 / 2, y2]]); g.fill(); g.restore();
}
function shadow(g, x, y, rx, a = 0.25, skew = 0) {
  g.save(); g.fillStyle = `rgba(30,15,5,${a})`;
  if (skew) { g.beginPath(); g.ellipse(x + skew / 2, y, rx + Math.abs(skew) / 2, rx * 0.22, 0, 0, TAU); g.fill(); }
  else { ell(g, x, y, rx, rx * 0.2); g.fill(); }
  g.restore();
}
function cloud(g, x, y, s, col = '#ffffff', shade = '#d6dfe8', ink = 'rgba(42,31,25,0.35)') {
  const b = [[-110, 10, 70], [-40, -30, 95], [50, -20, 85], [120, 15, 62], [0, 25, 80]];
  x += NOW * 9;
  g.save(); g.translate(x, y); g.scale(s, s);
  b.forEach(([bx, by, r]) => { circle(g, bx, by, r + 4); fill(g, ink); });
  b.forEach(([bx, by, r]) => { circle(g, bx, by, r); fill(g, col); });
  g.save(); g.beginPath(); b.forEach(([bx, by, r]) => { g.moveTo(bx + r, by); g.arc(bx, by, r, 0, TAU); }); g.clip();
  g.fillStyle = shade; g.fillRect(-200, 45, 400, 100); g.restore();
  g.restore();
}
function vignette(g, a = 0.4) {
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.72);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
function sparkle(g, x, y, r, a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter'; g.fillStyle = '#fff8dc';
  g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r * 0.35, y); g.quadraticCurveTo(x, y, x, y + r);
  g.quadraticCurveTo(x, y, x - r * 0.35, y); g.quadraticCurveTo(x, y, x, y - r);
  g.moveTo(x - r * 0.8, y); g.quadraticCurveTo(x, y, x, y - r * 0.25); g.quadraticCurveTo(x, y, x + r * 0.8, y);
  g.quadraticCurveTo(x, y, x, y + r * 0.25); g.quadraticCurveTo(x, y, x - r * 0.8, y); g.fill();
  g.restore(); glow(g, x, y, r * 1.6, '255,240,200', a * 0.5);
}

// ---------------------------------------------------------------- stickman rig
// Origin = between the feet on the ground. Arms: [upper, lower] angles in degrees,
// 0 = straight down, +90 = straight out to that side, 180 = straight up, negative = across the body.
const HEAD = '#fdf6f0';   // measured daylight head fill (253,246,240)

// ---- Character lighting, measured from the reference (see ricks-clips-style/CHARACTERS.md).
// x, y: direction the key light comes FROM in screen space. shade: colour of the shaded side of the head
// (measured shade/lit luma ~0.70). frac: share of the head in shade (day ~0.1, single-source night ~0.3).
// rim: thin light line outside the ink on the light side. robeShade: overlay giving cloth ~0.6 of lit luma.
// tint: multiplies the whole character (scene light colour) when drawn through charTint().
const LIGHTS = {
  day:    { x: -0.6, y: -0.8, shade: '#b9aba4', frac: 0.10, rim: '255,252,240', rimA: 0.35, robeShade: 'rgba(40,22,50,0.36)', tint: '#ffffff' },
  golden: { x: 0.8, y: -0.4, shade: '#d99a5e', frac: 0.24, rim: '255,205,130', rimA: 0.85, robeShade: 'rgba(70,25,30,0.40)', tint: '#ffe8c8' },
  candle: { x: 0.9, y: 0.2, shade: '#aea3d4', frac: 0.30, rim: '255,190,120', rimA: 0.75, robeShade: 'rgba(30,20,70,0.45)', tint: '#efe0e5' },
  fire:   { x: 0.7, y: 0.1, shade: '#d6be85', frac: 0.16, rim: '255,170,80', rimA: 0.70, robeShade: 'rgba(70,30,10,0.40)', tint: '#fdeebc' },
  storm:  { x: -0.3, y: -0.9, shade: '#7d86a8', frac: 0.30, rim: '200,220,255', rimA: 0.45, robeShade: 'rgba(15,20,45,0.45)', tint: '#c9d3e6' },
  night:  { x: 0.6, y: -0.6, shade: '#b29390', frac: 0.34, rim: '215,228,255', rimA: 0.9, robeShade: 'rgba(12,12,35,0.62)', tint: '#dcd6e8' },   // samurai short: shade/lit 0.67, 34 % in shade, strong moon rim, cloth 0.26-0.44
};
let CHAR_LIGHT = LIGHTS.day;
const hexA = (hex, a) => { const c = parseInt(hex.slice(1), 16); return `rgba(${c >> 16 & 255},${c >> 8 & 255},${c & 255},${a})`; };
const lightDir = () => { const L = CHAR_LIGHT, n = Math.hypot(L.x, L.y) || 1; return [L.x / n, L.y / n]; };
// Rim light: the same outline drawn in the rim colour, nudged toward the light, before the ink stroke.
function rimStroke(g, pathFn, w = 3) {
  const L = CHAR_LIGHT; if (!L.rimA) return;
  const [lx, ly] = lightDir();
  g.save(); g.translate(lx * 3.5, ly * 3.5); pathFn(); stroke(g, w, `rgba(${L.rim},${L.rimA})`); g.restore();
}
function person(g, o) {
  const d = Object.assign({
    x: 0, y: 0, s: 1, dir: 1, rot: 0, pose: 'stand', walk: null, lift: 0,
    robe: '#8a7a6a', stripes: null, trim: null, tunic: false, sack: false,
    arms: { l: [12, 6], r: [12, 6] }, head: null, headCol: '#d9c08f', beard: null, beardCol: '#3a2a20',
    eyes: 'dot', brows: null, mouth: 'line', look: 0, back: false, red: false, bow: 0,
    belt: null, satchel: false, upper: null, upperStripe: null, armor: null, apron: null, collar: null, shoes: null, sweat: false, seaweed: false, hold: null, holdL: null,
    id: null, crowd: false, xb: null, idle: true, mustache: false,
  }, o);
  const id = d.id || `${d.robe}|${d.head}|${d.headCol}|${d.s.toFixed(2)}|${d.beard}`;
  const ph = (hashStr(id) % 1000) / 1000 * TAU;
  d.blink = blinkClosed(id, NOW, d.crowd) || (d.xb || []).some(x => NOW >= x && NOW < x + 2 / 30);
  if (d.blink && !d.back && (d.eyes === 'dot' || d.eyes === 'wide' || d.eyes === 'angry')) (window.BLINK_LOG = window.BLINK_LOG || new Set()).add(id + '@' + Math.round(NOW * 30));
  const bob = d.idle ? Math.sin(NOW * 3.0 + ph) * 5 : 0;
  const sway = d.idle ? Math.sin(NOW * 2.1 + ph * 1.3) * 7 : 0;
  g.save(); g.translate(d.x, d.y); if (d.rot) g.rotate(d.rot); g.scale(d.s, d.s);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const sit = d.pose === 'kneel' || d.pose === 'sit' || d.pose === 'hands';
  // Proportions measured from the reference, in head diameters D (= 2R = 140):
  // total height ~3.5 D, robe 2.0 D (tunic 1.6 D), legs 0.45 D (tunic 0.75 D), shoulders 0.8 D, hem 1.1 D,
  // head overlaps the top of the body by 0.08 D.
  const R = 70, D = 140;
  // v3 (measured on the priest and the samurai): capsule body, nearly straight sides 0.86-0.89 D,
  // shoulder corners rounded 0.3 D, hem corners 0.15 D; robe 2.2 D + legs 0.5 D; tunic 1.4 D + legs 1.0 D.
  const legH = (d.tunic ? 1.0 : 0.5) * D, bodyH = (d.tunic ? 1.4 : 2.2) * D * (sit ? 0.72 : 1);
  const hemY = sit ? -24 : -legH;
  const shY = d.pose === 'hands' ? -150 : hemY - bodyH;
  const topW = 0.44 * D, botW = 0.45 * D + (sit ? 18 : 0);
  const hx = d.bow * 46 * d.dir + (d.pose === 'hands' ? d.dir * 120 : 0);
  const hy = shY - R + 0.08 * D + d.bow * 30 + (d.pose === 'hands' ? 40 : 0);

  // legs
  const leg = (x0, y0, x1, y1) => {
    line(g, x0, y0, x1, y1, 5);
    ell(g, x1 + d.dir * 6, y1 - 4, 13, 6); fs(g, d.shoes || '#3a2a24', 3);
  };
  if (!sit) {
    const sw = d.walk == null ? 0 : Math.sin(d.walk) * 30;
    const up = d.walk == null ? 0 : Math.max(0, Math.cos(d.walk)) * 10;
    leg(-18, hemY - 4, -24 - sw, -up);
    leg(18, hemY - 4, 24 + sw, -Math.max(0, -Math.cos(d.walk ?? PI / 2)) * 10 - d.lift);
  } else if (d.pose === 'hands') {
    leg(-d.dir * 20, -40, -d.dir * 95, -4);
    leg(-d.dir * 5, -40, -d.dir * 70, -4);
  } else {
    ell(g, -d.dir * 70, -8, 18, 8); fs(g, '#7a4a2a', 4);
  }

  // back arm drawn behind the body when hands-and-knees
  const sx = topW - 6, sy = shY + 0.2 * D;
  const armPts = (side, a) => {
    const r = PI / 180;
    const ex = side * sx + side * Math.sin(a[0] * r) * 0.68 * D, ey = sy + Math.cos(a[0] * r) * 0.68 * D;
    return [ex, ey, ex + side * Math.sin(a[1] * r) * 0.62 * D, ey + Math.cos(a[1] * r) * 0.62 * D];
  };
  const drawArm = (side, a, item) => {
    const [ex, ey, hx2, hy2] = armPts(side, a);
    g.beginPath(); g.moveTo(side * sx, sy); g.lineTo(ex, ey); g.lineTo(hx2, hy2); stroke(g, 5);
    if (item) item(hx2, hy2);
    circle(g, hx2, hy2, 7); fill(g, OUT);
  };

  // body (breathing bob lifts everything above the legs)
  g.translate(0, -Math.abs(bob));
  g.save();
  if (d.pose === 'hands') { g.translate(0, -10); g.rotate(d.dir * 1.05); g.translate(0, 60); }
  const bodyPath = () => {
    const rt = 0.3 * D, rb = 0.15 * D;
    g.beginPath();
    g.moveTo(-topW + rt, shY);
    g.lineTo(topW - rt, shY);
    g.quadraticCurveTo(topW, shY, topW, shY + rt);
    g.lineTo(botW, hemY - rb);
    g.quadraticCurveTo(botW, hemY, botW - rb, hemY);
    g.lineTo(-botW + rb, hemY);
    g.quadraticCurveTo(-botW, hemY, -botW, hemY - rb);
    g.lineTo(-topW, shY + rt);
    g.quadraticCurveTo(-topW, shY, -topW + rt, shY);
    g.closePath();
  };
  bodyPath(); fill(g, d.sack ? '#8b6b47' : d.robe);
  g.save(); bodyPath(); g.clip();
  if (d.stripes) { for (let i = -6; i < 7; i++) { g.fillStyle = d.stripes[(i + 60) % d.stripes.length]; g.fillRect(i * 22 - 11, shY - 10, 22, bodyH + 40); } }
  // Layered attire (measured placement, in D): upper vestment over the top 45 %, hem band 0.08 D,
  // centre trim 0.1 D wide, armour panel with dot rows on the torso, collar V 0.25 D deep, apron with pockets.
  if (d.upper) { g.fillStyle = d.upper; g.fillRect(-200, shY - 10, 400, bodyH * 0.45 + 10); if (d.upperStripe) { g.fillStyle = d.upperStripe; [-0.16, 0.16].forEach(x => g.fillRect(x * D - 5, shY, 10, bodyH * 0.45)); } line(g, -200, shY + bodyH * 0.45, 200, shY + bodyH * 0.45, 4); }
  if (d.trim) { g.fillStyle = d.trim; g.fillRect(-0.05 * D, shY, 0.1 * D, bodyH + 30); g.fillRect(-200, hemY - 0.08 * D, 400, 0.08 * D + 4); line(g, -200, hemY - 0.08 * D, 200, hemY - 0.08 * D, 3, 'rgba(61,45,36,0.6)'); }
  if (d.armor) {
    const ay0 = shY + 0.16 * D, ay1 = shY + bodyH * 0.62;
    g.fillStyle = d.armor; g.fillRect(-200, ay0, 400, ay1 - ay0);
    for (let yy = ay0 + 14; yy < ay1 - 6; yy += 22) { line(g, -200, yy + 8, 200, yy + 8, 2.5, 'rgba(30,15,15,0.55)'); for (let xx = -topW + 12; xx < topW; xx += 17) { circle(g, xx, yy, 3.2); fill(g, '#f1e2c4'); } }
    line(g, -200, ay1, 200, ay1, 4);
  }
  if (d.apron) {
    rrect(g, -0.36 * D, shY + 0.25 * D, 0.72 * D, bodyH * 0.78, [0.08 * D, 0.08 * D, 0.12 * D, 0.12 * D]); fs(g, d.apron, 4);
    [-1, 1].forEach(sd => { rrect(g, sd * 0.2 * D - 0.11 * D, shY + bodyH * 0.55, 0.22 * D, 0.2 * D, 6); stroke(g, 3.5); });
    line(g, -0.3 * D, shY + 0.25 * D, -0.36 * D, shY, 4); line(g, 0.3 * D, shY + 0.25 * D, 0.36 * D, shY, 4);
  }
  if (d.collar) { poly(g, [[-0.22 * D, shY], [0, shY + 0.25 * D], [0.22 * D, shY]], false); stroke(g, 0.12 * D, OUT); stroke(g, 0.12 * D - 8, d.collar); }
  if (d.sack) {
    g.strokeStyle = 'rgba(60,40,20,0.35)'; g.lineWidth = 2;
    for (let i = -10; i < 10; i++) { line(g, i * 14, shY, i * 14 + 30, hemY + 10, 2, 'rgba(60,40,20,0.3)'); }
    line(g, -100, shY + bodyH * 0.45, 100, shY + bodyH * 0.45, 3, 'rgba(60,40,20,0.35)');
  }
  // shade side of the cloth, away from the light (measured cloth shade ~0.6 of lit luma)
  { const sd = lightDir()[0] <= 0 ? 1 : -1, gr = g.createLinearGradient(-sd * botW, 0, sd * botW, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(0.64, CHAR_LIGHT.robeShade); gr.addColorStop(1, CHAR_LIGHT.robeShade);
    g.fillStyle = gr; g.fillRect(-220, shY - 10, 440, bodyH + 60);
    const hg = g.createLinearGradient(0, hemY - 40, 0, hemY + 10); hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(1, 'rgba(30,15,30,0.18)');
    g.fillStyle = hg; g.fillRect(-220, hemY - 40, 440, 60); }
  g.restore();
  rimStroke(g, bodyPath);
  bodyPath(); stroke(g);
  if (d.sack) { // ragged hem
    g.beginPath(); for (let i = 0; i <= 10; i++) { const x = lerp(-botW, botW, i / 10); g.lineTo(x, hemY - 2 + (i % 2 ? 8 : 0)); } stroke(g, 4);
  }
  const by = shY + bodyH * 0.44, bw = topW + (botW - topW) * 0.44;
  if (d.satchel) {
    line(g, -topW + 8, shY + 4, bw - 4, by + 18, 14); line(g, -topW + 8, shY + 4, bw - 4, by + 18, 8, '#7b4b2a');
  }
  if (d.belt) {
    line(g, -bw, by, bw, by, 14); line(g, -bw, by, bw, by, 8, d.belt);
    const kx = -d.dir * 14; circle(g, kx, by, 7); fs(g, d.belt, 3);
    line(g, kx, by, kx - 4, by + 26, 5, OUT); line(g, kx, by, kx - 4, by + 26, 2, d.belt);
  }
  if (d.satchel) { rrect(g, bw - 22, by + 6, 52, 44, 8); fs(g, '#8a5530', 5); line(g, bw - 22, by + 22, bw + 30, by + 22, 4); }
  g.restore();

  // arms
  const items = { r: d.hold, l: d.holdL };
  if (d.pose === 'hands') {
    const hx0 = d.dir * 70, hy0 = -120;
    line(g, hx0, hy0, hx0 + d.dir * 30, -4, 8); circle(g, hx0 + d.dir * 30, -6, 7); fill(g, OUT);
    line(g, hx0 - d.dir * 16, hy0 + 6, hx0 + d.dir * 8, -4, 8); circle(g, hx0 + d.dir * 8, -6, 7); fill(g, OUT);
  } else {
    drawArm(-1, [d.arms.l[0] + sway, d.arms.l[1] + sway * 0.7], items.l);
    drawArm(1, [d.arms.r[0] - sway, d.arms.r[1] - sway * 0.7], items.r);
  }

  // head
  drawHead(g, hx, hy, R, d);
  g.restore();
}

function drawHead(g, hx, hy, R, d) {
  const dir = d.dir;
  // things behind the head
  if (d.head === 'veil') {
    g.beginPath(); g.moveTo(hx - R - 16, hy + 70); g.bezierCurveTo(hx - R - 30, hy - R - 60, hx + R + 30, hy - R - 60, hx + R + 16, hy + 70);
    g.quadraticCurveTo(hx, hy + 90, hx - R - 16, hy + 70); fs(g, d.headCol);
  }
  circle(g, hx, hy, R); fill(g, d.red ? '#e4573f' : HEAD);
  { // soft shade on the side away from the light
    const [lx, ly] = lightDir(), sh = d.red ? '#a8302a' : CHAR_LIGHT.shade, s0 = clamp(1 - 2 * CHAR_LIGHT.frac);
    g.save(); circle(g, hx, hy, R - 1); g.clip();
    const gr = g.createLinearGradient(hx + lx * R, hy + ly * R, hx - lx * R, hy - ly * R);
    gr.addColorStop(0, hexA(sh, 0)); gr.addColorStop(clamp(s0 - 0.2), hexA(sh, 0)); gr.addColorStop(clamp(s0 + 0.08), hexA(sh, 0.85)); gr.addColorStop(1, hexA(sh, 1));
    g.fillStyle = gr; g.fillRect(hx - R, hy - R, 2 * R, 2 * R); g.restore(); }
  rimStroke(g, () => circle(g, hx, hy, R));
  circle(g, hx, hy, R); stroke(g);

  const fx = d.back ? 0 : dir * 16;
  // beard
  if (!d.back && d.beard === 'short' || d.beard === 'full') {
    // simple, robust beard: chin crescent plus optional drop
    g.beginPath();
    const a0 = 0.2 * PI, a1 = 0.8 * PI;
    g.arc(hx + fx * 0.4, hy, R + 2, a0, a1);
    g.quadraticCurveTo(hx + fx * 0.4, hy + 44, hx + fx * 0.4 + (R + 2) * Math.cos(a0), hy + (R + 2) * Math.sin(a0));
    if (d.beard === 'full') { g.moveTo(hx + fx * 0.4 - 50, hy + 50); g.quadraticCurveTo(hx + fx * 0.4, hy + 130, hx + fx * 0.4 + 50, hy + 50); }
    fs(g, d.beardCol, 5);
  }
  if (d.beard === 'curly') {
    // long beard in tight curls: tapered from cheek to cheek down to a rounded point, strand rows, curled moustache
    const bx = hx + fx * 0.5, top = hy + 30, bot = hy + 165;
    g.beginPath(); g.moveTo(bx - 56, top - 6);
    g.bezierCurveTo(bx - 62, top + 60, bx - 40, bot - 20, bx, bot);
    g.bezierCurveTo(bx + 40, bot - 20, bx + 62, top + 60, bx + 56, top - 6);
    g.quadraticCurveTo(bx, top + 22, bx - 56, top - 6); fs(g, '#2b2527', 5);
    g.save(); g.clip();
    for (let r = 0; r < 6; r++) for (let c = -3; c <= 3; c++) { const cx2 = bx + c * 17 + (r % 2) * 8, cy2 = top + 26 + r * 22; g.beginPath(); g.arc(cx2, cy2, 6, 0.15 * PI, 1.25 * PI); stroke(g, 3, '#5a5155'); }
    g.restore();
    g.beginPath(); g.moveTo(bx, top - 2); g.bezierCurveTo(bx - 14, top - 14, bx - 38, top - 10, bx - 44, top + 4); g.bezierCurveTo(bx - 30, top - 2, bx - 14, top + 4, bx, top + 2);
    g.bezierCurveTo(bx + 14, top + 4, bx + 30, top - 2, bx + 44, top + 4); g.bezierCurveTo(bx + 38, top - 10, bx + 14, top - 14, bx, top - 2); fs(g, '#2b2527', 3);
  }
  // headwear (top of head)
  const back = -dir;
  const tails = (col, len) => {
    const kx = d.back ? hx : hx + back * (R - 10), ky = d.back ? hy + 30 : hy - 40;
    poly(g, [[kx, ky], [kx + (d.back ? -10 : back * 22), ky + len], [kx + (d.back ? 18 : back * 44), ky + len - 12]]); fs(g, col, 5);
    poly(g, [[kx, ky], [kx + (d.back ? -30 : back * 40), ky + len * (d.back ? 0.9 : 0.7)], [kx + (d.back ? -8 : back * 58), ky + len * (d.back ? 0.95 : 0.55)]]); fs(g, col, 5);
    circle(g, kx, ky, 13); fs(g, col, 5);
  };
  const cap = (col, a = 0.06) => {
    g.beginPath(); g.arc(hx, hy, R + 4, PI + a * PI, TAU - a * PI);
    g.quadraticCurveTo(hx, hy - 4 - R * Math.sin(a * PI) + 10, hx - (R + 4) * Math.cos(a * PI), hy - (R + 4) * Math.sin(a * PI));
    fs(g, col);
  };
  if (d.head === 'wrap') { if (d.back) { circle(g, hx, hy, R + 3); fs(g, d.headCol); g.beginPath(); g.arc(hx, hy + 60, R + 10, 1.2 * PI, 1.8 * PI); stroke(g, 3, 'rgba(120,90,50,0.5)'); } else { cap(d.headCol, 0.2); line(g, hx - R + 12, hy - 50, hx + R - 12, hy - 50, 3, 'rgba(120,90,50,0.5)'); } tails(d.headCol, 70); }
  if (d.head === 'scarf') { cap('#c8423a', 0.02); tails('#c8423a', 100); }
  if (d.head === 'cap') { cap('#3d68b5', 0.22); line(g, hx + dir * 10, hy - 22, hx + dir * 80, hy - 18, 8); line(g, hx + dir * 10, hy - 22, hx + dir * 80, hy - 18, 4, '#3d68b5'); }
  if (d.head === 'headband') {
    g.save(); circle(g, hx, hy, R); g.clip(); g.fillStyle = '#3f9a5a'; g.fillRect(hx - R, hy - 44, 2 * R, 22); g.restore();
    line(g, hx - R + 4, hy - 44, hx + R - 4, hy - 44, 4); line(g, hx - R + 2, hy - 22, hx + R - 2, hy - 22, 4); tails('#3f9a5a', 60);
  }
  if (d.head === 'hair') { for (let i = -2; i <= 2; i++) { circle(g, hx + i * 22, hy - R + 6 - (2 - Math.abs(i)) * 4, 18); fs(g, d.headCol, 4); } }
  if (d.head === 'crown') drawCrown(g, hx, hy - R + 14);
  if (d.head === 'veil') { g.beginPath(); g.arc(hx, hy, R + 6, PI + 0.05, TAU - 0.05); g.quadraticCurveTo(hx, hy - 30, hx - R - 6, hy - 4); fs(g, d.headCol); }

  if (d.back) return;

  // face
  // measured: eyes at head centre height, 0.27 D apart, dot 0.075 D; brows 0.19 D wide x 0.06 D thick, 0.17 D above the eyes
  const ey = hy + 3, ex1 = hx + fx - 19, ex2 = hx + fx + 19;
  if (!d.red) [ex1, ex2].forEach(ex => { const cg = g.createRadialGradient(ex - dir * 2, ey + 20, 0, ex - dir * 2, ey + 20, 13); cg.addColorStop(0, 'rgba(170,150,190,0.40)'); cg.addColorStop(1, 'rgba(170,150,190,0)'); g.fillStyle = cg; g.fillRect(ex - 16, ey + 6, 32, 28); });
  const eye = ex => {
    if (d.blink && (d.eyes === 'dot' || d.eyes === 'wide' || d.eyes === 'angry')) { line(g, ex - 9, ey, ex + 9, ey, 4.5); return; }
    if (d.eyes === 'dot' || d.eyes === 'angry') { ell(g, ex + d.look * 1.5, ey, 5, 5.8); fill(g, OUT); circle(g, ex - 1.4 + d.look * 1.5, ey - 2, 1.4); fill(g, '#fff'); }
    else if (d.eyes === 'wide') { circle(g, ex, ey, 11); fs(g, '#fff', 3.2); circle(g, ex + d.look * 4, ey + 1, 5); fill(g, OUT); }
    else if (d.eyes === 'closed') { g.beginPath(); g.arc(ex, ey - 5, 8.5, 0.2 * PI, 0.8 * PI); stroke(g, 4.5); }
    else if (d.eyes === 'happy') { g.beginPath(); g.arc(ex, ey + 4, 8, 1.15 * PI, 1.85 * PI); stroke(g, 4.5); }
    else if (d.eyes === 'smug') { ell(g, ex + d.look * 1.5, ey + 1.5, 5, 4.5); fill(g, OUT); line(g, ex - 9, ey - 3, ex + 9, ey - 3, 4); }      // half-lidded: lid line over a dot
    else if (d.eyes === 'stars') { const st = (cx, cy, r) => { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, rr = k % 2 ? r * 0.45 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); }; circle(g, ex, ey, 9); fill(g, OUT); st(ex, ey, 7.5); fill(g, '#ffd34a'); glow(g, ex, ey, 22, '255,210,90', 0.5); }
    else if (d.eyes === 'glow') { circle(g, ex, ey, 6); fill(g, '#ff3b2f'); glow(g, ex, ey, 26, '255,60,40', 0.9); }
  };
  eye(ex1); eye(ex2);
  const brow = (ex, side) => {
    const b = d.brows || 'soft', by = ey - 24;
    let o, i, arch = -3;
    if (b === 'worried') { o = [ex - side * 13, by + 5]; i = [ex + side * 12, by - 7]; arch = -2; }
    if (b === 'angry') { o = [ex - side * 14, by - 7]; i = [ex + side * 12, by + 6]; arch = 1; }
    if (b === 'flat') { o = [ex - side * 13, by]; i = [ex + side * 12, by]; arch = -1; }
    if (b === 'raised') { o = [ex - side * 13, by - 6]; i = [ex + side * 12, by - 9]; arch = -5; }
    if (b === 'soft') { o = [ex - side * 13, by + 1]; i = [ex + side * 12, by - 1]; arch = -4; }
    if (b === 'skeptic') { const up = side === dir; o = [ex - side * 13, by + (up ? -8 : 2)]; i = [ex + side * 12, by + (up ? -6 : 4)]; arch = up ? -5 : 0; }
    // tapered: thin at the outer end (3.5), thick at the inner end (0.06 D = 8.4)
    const mx2 = (o[0] + i[0]) / 2, my2 = (o[1] + i[1]) / 2 + arch;
    g.beginPath(); g.moveTo(o[0], o[1] - 1.7); g.quadraticCurveTo(mx2, my2 - 3.5, i[0], i[1] - 4.2);
    g.lineTo(i[0], i[1] + 4.2); g.quadraticCurveTo(mx2, my2 + 2.5, o[0], o[1] + 1.7); g.closePath(); fill(g, OUT);
  };
  brow(ex1, 1); brow(ex2, -1);
  const mx = hx + fx * (d.beard === 'curly' ? 0.5 : 1), my = hy + (d.beard === 'curly' ? 44 : 35);
  if (d.mustache) { const mc = d.beardCol || OUT; g.beginPath(); g.moveTo(mx, my - 12); g.bezierCurveTo(mx - 10, my - 20, mx - 30, my - 14, mx - 34, my - 2); g.bezierCurveTo(mx - 24, my - 8, mx - 12, my - 4, mx, my - 6); g.bezierCurveTo(mx + 12, my - 4, mx + 24, my - 8, mx + 34, my - 2); g.bezierCurveTo(mx + 30, my - 14, mx + 10, my - 20, mx, my - 12); fill(g, mc); }
  switch (d.mouth) {
    case 'line': line(g, mx - 12, my, mx + 12, my, 5); break;
    case 'smile': g.beginPath(); g.arc(mx, my - 10, 15, 0.2 * PI, 0.8 * PI); stroke(g, 5); break;
    case 'frown': g.beginPath(); g.arc(mx, my + 14, 14, 1.2 * PI, 1.8 * PI); stroke(g, 5); break;
    case 'o': ell(g, mx, my + 2, 8, 10); fs(g, '#5a2420', 4); break;
    case 'open': g.beginPath(); g.moveTo(mx - 20, my - 6); g.lineTo(mx + 20, my - 6); g.quadraticCurveTo(mx + 20, my + 26, mx, my + 26); g.quadraticCurveTo(mx - 20, my + 26, mx - 20, my - 6); fs(g, '#5a2420', 4); break;
    case 'grit': rrect(g, mx - 26, my - 10, 52, 22, 6); fs(g, '#fff', 4); for (let i = -1; i <= 1; i++) line(g, mx + i * 13, my - 10, mx + i * 13, my + 12, 3); line(g, mx - 26, my + 1, mx + 26, my + 1, 3); break;
    case 'grin': g.beginPath(); g.moveTo(mx - 26, my - 6); g.quadraticCurveTo(mx, my - 2, mx + 26, my - 6); g.quadraticCurveTo(mx + 20, my + 22, mx, my + 22); g.quadraticCurveTo(mx - 20, my + 22, mx - 26, my - 6); fs(g, '#fff', 4); for (let i = -2; i <= 2; i++) line(g, mx + i * 9, my - 4, mx + i * 9, my + 7, 2.5); line(g, mx - 24, my + 6, mx + 24, my + 6, 2.5); break;
    case 'smirk': g.beginPath(); g.moveTo(mx - 12, my + 2); g.quadraticCurveTo(mx + 4, my + 6, mx + dir * 15, my - 6); stroke(g, 4.5); break;
    case 'laugh': g.beginPath(); g.moveTo(mx - 24, my - 6); g.lineTo(mx + 24, my - 6); g.quadraticCurveTo(mx + 22, my + 30, mx, my + 30); g.quadraticCurveTo(mx - 22, my + 30, mx - 24, my - 6); fs(g, '#5a2420', 4); g.save(); g.clip(); ell(g, mx, my + 28, 14, 9); fill(g, '#d9606a'); g.restore(); rrect(g, mx - 20, my - 6, 40, 8, 3); fill(g, '#fff'); break;
    case 'wobbly': g.beginPath(); g.moveTo(mx - 16, my); for (let i = 1; i <= 4; i++) g.lineTo(mx - 16 + i * 8, my + (i % 2 ? -4 : 3)); stroke(g, 4.5); break;
  }
  if (d.sweat) { const sx2 = hx + dir * (R - 2), sy2 = hy - 34; g.beginPath(); g.moveTo(sx2, sy2 - 18); g.quadraticCurveTo(sx2 + 13, sy2 + 4, sx2, sy2 + 8); g.quadraticCurveTo(sx2 - 13, sy2 + 4, sx2, sy2 - 18); fs(g, '#8fd3f4', 4); }
  if (d.seaweed) {
    [[-40, 0.9], [5, 1.2], [45, 1]].forEach(([ox, l], i) => {
      g.beginPath(); g.moveTo(hx + ox - 20, hy - R + 4);
      g.bezierCurveTo(hx + ox, hy - R - 30, hx + ox + 40, hy - R + 10, hx + ox + 30 + i * 6, hy - R + 70 * l);
      stroke(g, 15); stroke(g, 9, '#4a9a3c');
    });
  }
}

function drawCrown(g, x, y) {
  poly(g, [[x - 46, y], [x + 46, y], [x + 52, y - 104], [x - 52, y - 104]]); fs(g, '#b5302d');
  [[y - 18, 16], [y - 104, 18]].forEach(([yy, h]) => { rrect(g, x - 54, yy, 108, h, 4); fs(g, '#e8b63c', 4); });
  for (let i = -1; i <= 1; i++) { circle(g, x + i * 28, y - 58, 9); fs(g, '#e8b63c', 4); }
}

// ---------------------------------------------------------------- the great fish
// Local frame: head to +x, body centre at origin. mouth: 0 closed .. 1 wide open.
function fish(g, x, y, s, rot, mouth = 0, flip = 1) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s * flip, s);
  // tail
  poly(g, [[-560, 0], [-820, -230], [-760, 0], [-820, 230]]); fs(g, '#5d7584', 8);
  // fins
  g.beginPath(); g.moveTo(-120, -270); g.quadraticCurveTo(-60, -420, 80, -290); fs(g, '#5d7584', 8);
  // body
  const body = () => { g.beginPath(); g.ellipse(0, 0, 620, 300, 0, 0, TAU); };
  body(); fill(g, '#6f8796');
  g.save(); body(); g.clip();
  g.fillStyle = '#dbe4e2'; ell(g, 60, 250, 640, 190); g.fill();
  g.fillStyle = 'rgba(230,240,240,0.55)';
  [[-300, -150, 26], [-180, -210, 20], [-60, -170, 24], [-380, -60, 18], [-230, -80, 16], [80, -230, 18], [-470, -170, 14]].forEach(([a, b, r]) => { circle(g, a, b, r); g.fill(); });
  // mouth
  if (mouth > 0.01) {
    g.fillStyle = '#2b1420'; g.beginPath(); g.ellipse(560, 40, 260 * mouth + 40, 230 * mouth, 0, 0, TAU); g.fill();
    g.fillStyle = '#7a3346'; g.beginPath(); g.ellipse(600, 40 + 120 * mouth, 160 * mouth, 70 * mouth, 0, 0, TAU); g.fill();
  }
  g.restore();
  body(); stroke(g, 8);
  if (mouth > 0.01) { g.beginPath(); g.ellipse(560, 40, 260 * mouth + 40, 230 * mouth, 0, PI * 0.5, PI * 1.5); stroke(g, 8); }
  else { g.beginPath(); g.moveTo(620, 40); g.quadraticCurveTo(520, 90, 430, 60); stroke(g, 8); }
  // gill + pectoral fin
  g.beginPath(); g.arc(290, 20, 120, 0.7 * PI, 1.3 * PI); stroke(g, 6, 'rgba(42,31,25,0.6)');
  g.beginPath(); g.moveTo(180, 120); g.quadraticCurveTo(120, 260, 30, 210); g.quadraticCurveTo(110, 170, 180, 120); fs(g, '#5d7584', 6);
  // eye: small, calm, round
  circle(g, 420, -110, 20); fs(g, '#fff', 5); circle(g, 424, -108, 11); fill(g, OUT); circle(g, 420, -113, 4); fill(g, '#fff');
  g.restore();
}

// ---------------------------------------------------------------- environment props
function ribs(g, t, cx, cy, light = 1) {
  const bg = g.createRadialGradient(cx, cy - 200, 50, cx, cy, 1500);
  bg.addColorStop(0, '#3a2433'); bg.addColorStop(0.5, '#1e1526'); bg.addColorStop(1, '#0b0a12');
  g.fillStyle = bg; g.fillRect(-2000, -2000, 6000, 6000);
  const ks = [0.36, 0.48, 0.62, 0.8, 1.02, 1.3];
  ks.forEach((k, i) => {
    const a = 0.25 + i * 0.13;
    g.beginPath(); g.ellipse(cx, cy + 420 * k, 640 * k, 1250 * k, 0, PI * 1.02, PI * 1.98);
    g.lineWidth = 64 * k + 10; g.strokeStyle = OUT; g.globalAlpha = a; g.stroke();
    g.lineWidth = 64 * k; g.strokeStyle = '#cdb99c'; g.stroke();
    g.lineWidth = 18 * k; g.strokeStyle = '#efe0c6'; g.globalAlpha = a * 0.6; g.stroke();
    g.globalAlpha = 1;
  });
  // floor puddle
  ell(g, cx, cy + 560, 620, 120); fill(g, '#16323a');
  ell(g, cx, cy + 560, 620, 120); stroke(g, 6, 'rgba(120,220,210,0.35)');
}
function drips(g, t, xs, top, bottom) {
  xs.forEach((x, i) => {
    const per = 1.3 + i * 0.37, ph = mod(t + i * 0.53, per) / per;
    const y = lerp(top, bottom, ph * ph);
    ell(g, x, y, 7, 11); fill(g, 'rgba(160,235,225,0.85)');
    const rp = mod(t + i * 0.53 + per * 0.02, per) / per;
    if (rp < 0.35) { g.beginPath(); g.ellipse(x, bottom + 8, 20 + rp * 120, 5 + rp * 22, 0, 0, TAU); stroke(g, 3, `rgba(160,235,225,${0.6 * (1 - rp / 0.35)})`); }
  });
}
function rain(g, t, n = 160, a = 0.45) {
  const r = rng(7);
  g.save(); g.strokeStyle = `rgba(200,220,255,${a})`; g.lineWidth = 3; g.beginPath();
  for (let i = 0; i < n; i++) {
    const x0 = r() * 1400 - 160, y0 = r() * 2100, sp = 2400 + r() * 900;
    const y = mod(y0 + t * sp, 2100) - 100, x = x0 - (y + 100) * 0.25;
    g.moveTo(x, y); g.lineTo(x - 18, y + 70);
  }
  g.stroke(); g.restore();
}
function flashAmt(t, times) {
  let v = 0;
  times.forEach(lt => { const d = t - lt; if (d >= 0 && d < 0.45) v = Math.max(v, (1 - d / 0.45) * (d < 0.08 || (d > 0.14 && d < 0.2) ? 1 : 0.55)); });
  return v;
}
function bolt(g, x, y0, y1, seed, a) {
  if (a <= 0) return;
  const r = rng(seed); const pts = []; let x0 = x;
  for (let y = y0; y <= y1; y += 70) { pts.push([x0, y]); x0 += (r() - 0.5) * 110; }
  g.save(); g.globalAlpha = a;
  poly(g, pts, false); stroke(g, 18, 'rgba(180,200,255,0.5)'); stroke(g, 6, '#ffffff'); g.restore();
}
function waves(g, t, y, col, crest, amp = 30, len = 220, speed = 1, x0 = -600, x1 = 3200) {
  g.beginPath(); g.moveTo(x0, y + 2000);
  for (let x = x0; x <= x1; x += 20) g.lineTo(x, y + Math.sin(x / len * TAU + t * speed) * amp + Math.sin(x / (len * 0.43) - t * speed * 1.3) * amp * 0.35);
  g.lineTo(x1, y + 2000); g.closePath(); fill(g, col);
  if (crest) {
    g.beginPath();
    for (let x = x0; x <= x1; x += 20) g.lineTo(x, y + Math.sin(x / len * TAU + t * speed) * amp + Math.sin(x / (len * 0.43) - t * speed * 1.3) * amp * 0.35);
    stroke(g, 8, crest);
  }
}
function textSign(g, txt, x, y, size, col = '#fff8e8', weight = 800) {
  g.font = `${weight} ${size}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = col; g.fillText(txt, x, y);
}

// Draw fn() on a scratch canvas and multiply it by the scene light colour (characters take the scene's tint).
const _tintC = document.createElement('canvas'), _maskC = document.createElement('canvas');
function charTint(g, w, h, tint, fn) {
  if (!tint || tint === '#ffffff') { fn(g); return; }
  _tintC.width = _maskC.width = w; _tintC.height = _maskC.height = h;
  const t = _tintC.getContext('2d'), m = _maskC.getContext('2d');
  fn(t); m.drawImage(_tintC, 0, 0);                       // keep the character's alpha as a mask
  t.globalCompositeOperation = 'multiply'; t.fillStyle = tint; t.fillRect(0, 0, w, h);
  t.globalCompositeOperation = 'destination-in'; t.drawImage(_maskC, 0, 0);
  g.drawImage(_tintC, 0, 0);
}
