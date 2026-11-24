// Jonah as a hand-drawn, jointed 2D stick figure, built from the motion measurements of a stick-figure
// platformer (see ricks-clips-style/MOTION.md). Our own design: head wrap with trailing tails, beard,
// striped tunic flaring over the thighs. Units: H = 300 = feet to top of head when standing.
const SK = {
  H: 300, hip: 0.40, torso: 0.31, neck: 0.03, headR: 0.105,
  upperArm: 0.19, foreArm: 0.18, thigh: 0.215, shin: 0.215,
  line: 8, ink: '#231d1b', head: '#fbfaf6',
  robe: ['#3f6fa8', '#d9c39a'], wrap: '#d9c08f', beard: '#3a2a20',
  // motion (measured): run step 0.25 s -> cycle 0.5 s; walk cycle ~0.9 s; gravity 12.8 H/s^2;
  // take-off v0 ~5.5-6 H/s; airtime ~0.9 s; peak 1.3-1.55 H; crouch to 0.75 H for 2 frames;
  // landing dip 0.08 H held ~5 frames, recovered over ~3; top run speed 5-7 H/s.
  runPeriod: 0.5, walkPeriod: 0.9, g: 12.8,
};
const D2R = PI / 180;
// Looks for the whole cast. robe: two stripe colours (same twice = plain); head: wrap | scarf | headband | cap |
// crown | veil | hair | bald; tails: tied cloth that trails on springs; beard: colour + style (short | full | curly).
const LOOKS = {
  jonah:   { robe: ['#3f6fa8', '#d9c39a'], head: 'wrap', headCol: '#d9c08f', tails: true, beard: '#3a2a20', beardStyle: 'short', belt: '#c49a5a' },
  sailor0: { robe: ['#b79f78', '#a68e68'], head: 'scarf', headCol: '#c8423a', tails: true, beard: null, belt: '#6b4428' },
  sailor1: { robe: ['#9b8466', '#8a7458'], head: 'cap', headCol: '#3d68b5', beard: '#3a2a20', beardStyle: 'stache', belt: '#6b4428' },
  sailor2: { robe: ['#7f8b69', '#717c5d'], head: 'bald', beard: '#6b4a2e', beardStyle: 'full', belt: '#6b4428' },
  sailor3: { robe: ['#a9845e', '#9a7752'], head: 'headband', headCol: '#3f9a5a', tails: true, beard: null, belt: '#6b4428' },
  king:    { robe: ['#8f1f24', '#a8282c'], head: 'crown', beard: '#1e1a1c', beardStyle: 'curly', belt: '#e0b03a', trim: '#e0b03a' },
  kingSack:{ robe: ['#8b6b47', '#7d6040'], sack: true, head: 'bald', beard: '#1e1a1c', beardStyle: 'curly', belt: null },
};
const TOWN = [
  { robe: ['#c94b3a', '#b8402f'], head: 'veil', headCol: '#e6c46a' }, { robe: ['#e1a23c', '#d0922e'], head: 'hair', headCol: '#2e2420', beard: '#2e2420', beardStyle: 'stache' },
  { robe: ['#4a8fc4', '#3f7fb2'], head: 'bald', beard: '#9a9a9a', beardStyle: 'full' }, { robe: ['#7a5aa8', '#6c4e98'], head: 'veil', headCol: '#5aa0c4' },
  { robe: ['#3f9a6a', '#358a5c'], head: 'hair', headCol: '#5a3d28', k: 0.66 }, { robe: ['#d6795a', '#c66a4c'], head: 'hair', headCol: '#5a3d28', beard: '#5a3d28', beardStyle: 'short' },
  { robe: ['#2f6f8f', '#285f7d'], head: 'veil', headCol: '#b8487a' }, { robe: ['#b8487a', '#a63d6c'], head: 'veil', headCol: '#8cbf4a', k: 0.62 },
  { robe: ['#9a7a3a', '#8a6c30'], head: 'scarf', headCol: '#3d68b5', tails: true },
];
const sackLook = L => ({ ...L, robe: ['#8b6b47', '#7d6040'], sack: true, trim: null, belt: null });

// smooth deterministic noise for the hand-drawn "boil" (redrawn every frame = animated on ones)
function hnoise(a, b) { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }
function wobblePath(g, pts, amp, seed) {
  const f = 0;               // measured: the reference's lines do not boil; keep a fixed hand-drawn irregularity
  g.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const jx = (hnoise(i + seed, f) - 0.5) * amp, jy = (hnoise(i + seed + 50, f) - 0.5) * amp;
    if (!i) g.moveTo(x + jx, y + jy);
    else {
      const [px, py] = pts[i - 1], mx = (px + x) / 2 + (hnoise(i + seed + 99, f) - 0.5) * amp * 1.4, my = (py + y) / 2 + (hnoise(i + seed + 7, f) - 0.5) * amp * 1.4;
      g.quadraticCurveTo(mx, my, x + jx, y + jy);
    }
  }
}
function limbStroke(g, pts, w0, w1, col = SK.ink) {
  const [a, b, c] = pts.length === 3 ? pts : [pts[0], [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2], pts[1]];
  const ctl = [2 * b[0] - (a[0] + c[0]) / 2, 2 * b[1] - (a[1] + c[1]) / 2], N = 14, L = [], Rr = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t, x = u * u * a[0] + 2 * u * t * ctl[0] + t * t * c[0], y = u * u * a[1] + 2 * u * t * ctl[1] + t * t * c[1];
    const dx = 2 * u * (ctl[0] - a[0]) + 2 * t * (c[0] - ctl[0]), dy = 2 * u * (ctl[1] - a[1]) + 2 * t * (c[1] - ctl[1]), n = Math.hypot(dx, dy) || 1;
    const w = lerp(w0, w1, t) / 2 * (1 + 0.08 * Math.sin(t * PI));
    L.push([x - dy / n * w, y + dx / n * w]); Rr.push([x + dy / n * w, y - dx / n * w]);
  }
  g.beginPath(); g.moveTo(L[0][0], L[0][1]); L.forEach(p => g.lineTo(p[0], p[1])); for (let i = Rr.length - 1; i >= 0; i--) g.lineTo(Rr[i][0], Rr[i][1]); g.closePath();
  g.fillStyle = col; g.fill(); circle(g, a[0], a[1], w0 / 2); g.fill(); circle(g, c[0], c[1], w1 / 2); g.fill();
}
function inkLine(g, pts, w, seed, col = SK.ink) { wobblePath(g, pts, 1.4, seed); g.lineWidth = w; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }

// ---- poses: angles in degrees. Arms/legs measured from straight down, + = toward the facing direction.
// arm: [shoulder, elbow-relative]; leg: [hip, knee-relative (negative = shin folds back)]
const POSES = {
  idle:    { lean: 2, aF: [12, -8], aB: [-12, -8], lF: [6, -4], lB: [-6, -4] },
  skid:    { lean: -14, aF: [75, 15], aB: [-85, -15], lF: [38, 0], lB: [-12, -55] },
  crouch:  { lean: 22, aF: [-35, -25], aB: [-45, -20], lF: [62, -115], lB: [50, -110] },
  rise:    { lean: 6, aF: [150, 20], aB: [125, 35], lF: [62, -105], lB: [28, -85], air: 1 },
  fall:    { lean: -6, aF: [165, 25], aB: [-160, -20], lF: [12, -25], lB: [-18, -40], air: 1 },
  land:    { lean: 20, aF: [55, 25], aB: [-50, -25], lF: [50, -100], lB: [40, -95] },
  kneel:   { lean: 6, aF: [38, 110], aB: [32, 115], lF: [88, -92], lB: [-18, -112] },
  pray:    { lean: 10, tilt: 14, aF: [34, 118], aB: [30, 122], lF: [88, -92], lB: [-18, -112] },
  arms:    { lean: 0, tilt: 6, aF: [34, 118], aB: [34, 120], lF: [8, -4], lB: [-8, -6] },
  sit:     { lean: -6, aF: [20, 30], aB: [-20, -30], lF: [86, -84], lB: [80, -80] },
  point:   { lean: 4, aF: [118, 6], aB: [-10, -10], lF: [8, -4], lB: [-8, -6] },
  proclaim:{ lean: -4, tilt: -8, aF: [162, 8], aB: [-18, -12], lF: [10, -2], lB: [-10, -6] },
  pay:     { lean: 6, aF: [78, 20], aB: [-8, -8], lF: [6, -4], lB: [-8, -6] },
  fury:    { lean: -10, tilt: -10, aF: [150, 55], aB: [-150, -55], lF: [10, -8], lB: [-12, -8] },
  stomp:   { lean: 12, aF: [135, 60], aB: [-135, -60], lF: [70, -95], lB: [-6, -6] },
  sink:    { lean: -10, aF: [170, 30], aB: [-165, -35], lF: [8, -30], lB: [-16, -45], air: 1 },
  sprawl:  { lean: 70, aF: [100, 10], aB: [-60, -20], lF: [-20, -40], lB: [-50, -30] },
  armsUp:  { lean: -6, tilt: -12, aF: [168, 12], aB: [-168, -12], lF: [8, -4], lB: [-8, -6] },
  plead:   { lean: 10, tilt: -6, aF: [52, 62], aB: [40, 70], lF: [8, -4], lB: [-8, -6] },
  shocked: { lean: -14, tilt: -10, aF: [55, 105], aB: [-48, -105], lF: [12, -4], lB: [-16, -10] },
  cower:   { lean: 18, tilt: 12, aF: [28, 125], aB: [24, 128], lF: [34, -50], lB: [20, -45] },
  sitBow:  { lean: 22, tilt: 18, aF: [26, 105], aB: [24, 108], lF: [86, -84], lB: [80, -80] },
  stare:   { lean: -6, tilt: -4, aF: [8, -4], aB: [-8, -4], lF: [8, -4], lB: [-8, -6] },
  perch:   { lean: 4, tilt: 6, aF: [24, 38], aB: [-24, -38], lF: [16, -4], lB: [-14, 4], air: 1 },
  wave:    { lean: 2, aF: [150, -40], aB: [-10, -10], lF: [6, -4], lB: [-6, -4] },
};
function mixPose(a, b, k) {
  const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va = a[key] ?? b[key], vb = b[key] ?? a[key];
    o[key] = Array.isArray(va) ? va.map((v, i) => lerp(v, vb[i], k)) : typeof va === 'number' ? lerp(va, vb, k) : (k < 0.5 ? va : vb);
  } return o;
}
function walkPose(ph) {
  const s = Math.sin(ph), c = Math.cos(ph);
  return { lean: 5, aF: [-24 * s, -14], aB: [24 * s, -14], lF: [26 * s, -Math.max(0, -c) * 45 - 4], lB: [-26 * s, -Math.max(0, c) * 45 - 4] };
}
function runPose(ph) {
  const s = Math.sin(ph), c = Math.cos(ph);
  return { lean: 15, aF: [-55 * s, 85], aB: [55 * s, 85], lF: [10 + 50 * s, -(25 + 75 * Math.max(0, -c))], lB: [10 - 50 * s, -(25 + 75 * Math.max(0, c))] };
}

// ---- the figure
function sketchman(g, o) {
  const d = Object.assign({ x: 0, y: 0, s: 1, dir: 1, pose: 'idle', air: 0, vel: [0, 0], rot: 0, face: {}, back: false, seaweed: false, id: 'J', shake: 0, look: LOOKS.jonah }, o);
  const LK = d.look;
  const H = SK.H, P = typeof d.pose === 'string' ? POSES[d.pose] : d.pose;
  const dir = d.dir;
  const br = Math.sin(NOW * 2.6) * 1.2;                          // breathing
  const ang = a => a * D2R;
  // limb end points relative to hip (screen: x right, y down); forward = dir
  const limb = (base, a1, a2, l1, l2) => {
    const t1 = ang(a1), t2 = ang(a1 + a2);
    const k = [base[0] + dir * Math.sin(t1) * l1 * H, base[1] + Math.cos(t1) * l1 * H];
    return [k, [k[0] + dir * Math.sin(t2) * l2 * H, k[1] + Math.cos(t2) * l2 * H]];
  };
  const lF = limb([0, 0], ...P.lF, SK.thigh, SK.shin), lB = limb([0, 0], ...P.lB, SK.thigh, SK.shin);
  // feet stay planted: the hip sits as high as the longer leg reaches (this gives the natural bob)
  const reach = Math.max(lF[1][1], lB[1][1]);
  const airK = clamp(+(P.air || 0));
  const hipY = -lerp(reach, SK.hip * H, airK) - d.air * H;
  const lean = ang(P.lean + (d.lean || 0)), tilt = ang((P.tilt || 0));
  const neck = [dir * Math.sin(lean) * SK.torso * H, -Math.cos(lean) * SK.torso * H + br];
  const shoulder = [neck[0] * 0.93, neck[1] * 0.93];
  const hc = [neck[0] + dir * Math.sin(lean + tilt) * (SK.neck + SK.headR) * H, neck[1] - Math.cos(lean + tilt) * (SK.neck + SK.headR) * H];
  const shk = d.shake ? Math.sin(NOW * 70) * d.shake : 0;
  const aF = limb(shoulder, P.aF[0] + shk, P.aF[1], SK.upperArm, SK.foreArm), aB = limb(shoulder, P.aB[0] - shk, P.aB[1], SK.upperArm, SK.foreArm);
  const R = SK.headR * H;

  g.save(); g.translate(d.x, d.y + hipY * d.s); g.scale(d.s, d.s); if (d.rot) g.rotate(d.rot);
  const back = (pts, seed) => limbStroke(g, pts, SK.line * 1.18, SK.line * 0.78);
  const hand = p => { ell(g, p[0], p[1], 6.2, 5.4); fill(g, SK.ink); };
  // back arm, back leg
  back([shoulder, aB[0], aB[1]], 1); hand(aB[1]);
  back([[0, 0], lB[0], lB[1]], 2); foot(lB, 22);
  // tunic over the thighs (flares toward the knees, follows the legs)
  const waist = [neck[0] * 0.22, neck[1] * 0.22];
  const fl = 0.075 * H, wl = 0.05 * H;
  const kF = lF[0], kB = lB[0];
  const outward = (k, other) => { const vx = k[0] - waist[0], vy = k[1] - waist[1], n = Math.hypot(vx, vy) || 1; let nx = -vy / n, ny = vx / n; if (nx * (k[0] - other[0]) + ny * (k[1] - other[1]) < 0) { nx = -nx; ny = -ny; } return [k[0] + nx * fl, k[1] + ny * fl]; };
  const kneeMid = [(kF[0] + kB[0]) / 2, Math.min(kF[1], kB[1]) - 0.02 * H];
  const right = kF[0] >= kB[0] ? kF : kB, left = right === kF ? kB : kF;
  const tun = [[waist[0] + wl, waist[1]], outward(right, left), kneeMid, outward(left, right), [waist[0] - wl, waist[1]]];
  if (d.hemOff) [1, 2, 3].forEach(i => { const k = i === 2 ? 0.55 : 1; tun[i] = [tun[i][0] + d.hemOff[0] * k * dir, tun[i][1] + d.hemOff[1] * k]; });
  const tunicPath = () => { g.beginPath(); tun.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
  // front leg drawn first under the tunic hem so the shin pokes out below
  back([lF[0], lF[1]], 3); foot(lF, 23);
  tunicPath(); g.save(); g.clip();
  for (let i = -8; i < 8; i++) { g.fillStyle = LK.robe[(i + 80) % 2]; g.fillRect(i * 22, -0.5 * H, 22, H); }
  if (LK.sack) for (let i = -10; i < 10; i++) { g.beginPath(); g.moveTo(i * 14, -0.5 * H); g.lineTo(i * 14 + 30, 0.5 * H); g.lineWidth = 2; g.strokeStyle = 'rgba(50,32,16,0.35)'; g.stroke(); }
  if (LK.trim) { g.fillStyle = LK.trim; g.fillRect(-7, -0.5 * H, 14, H); g.fillRect(-200, kneeMid[1] - 2, 400, 12); }
  if (typeof CHAR_LIGHT !== 'undefined') { const sd = lightDir()[0] <= 0 ? 1 : -1, gr = g.createLinearGradient(-sd * 80, 0, sd * 80, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.55, 'rgba(0,0,0,0)'); gr.addColorStop(1, CHAR_LIGHT.robeShade); g.fillStyle = gr; g.fillRect(-200, -200, 400, 400); }
  g.restore();
  [[0.3, 1], [0.7, 3]].forEach(([k, i]) => { const top = [waist[0] + (k - 0.5) * wl * 2, waist[1] + 4]; inkLine(g, [top, [lerp(top[0], tun[i][0], 0.55), lerp(top[1], tun[i][1], 0.55)], [lerp(top[0], tun[i][0], 0.85), lerp(top[1], tun[i][1], 0.85)]], 2.2, 31 + i, 'rgba(35,29,27,0.45)'); });
  wobblePath(g, [...tun, tun[0]], 1.6, 30); g.lineWidth = SK.line * 0.78; g.strokeStyle = SK.ink; g.lineJoin = 'round'; g.stroke();
  // belt knot at the waist
  if (LK.belt) { circle(g, waist[0], waist[1], 7); fill(g, LK.belt); g.lineWidth = 4; g.strokeStyle = SK.ink; g.stroke(); }
  // torso line
  limbStroke(g, [waist, [neck[0] * 0.6, neck[1] * 0.6], neck], SK.line * 1.25, SK.line * 1.0);
  // head-wrap tails: follow-through (trail opposite to motion, droop with gravity, streak at speed)
  const [vx, vy] = d.vel, sp = Math.hypot(vx, vy);
  const anchor = [hc[0] - dir * R * 0.85, hc[1] - R * 0.35];
  let tx, ty;
  if (d.tailA !== undefined) { tx = Math.cos(d.tailA); ty = Math.sin(d.tailA); }
  else { const tg = tailTarget(vx, vy, dir); tx = Math.cos(tg); ty = Math.sin(tg); }
  const wave = Math.sin(NOW * 9) * (0.06 + Math.min(1, sp / 5) * 0.18);
  if (!LK.tails) {} else if (d.tailChain) {
    [[0, 1], [10, 0.8]].forEach(([off, sc], ti) => {
      const pts = d.tailChain.map(([cx, cy], j) => [anchor[0] + cx * dir * sc + (j ? off * 0.3 : 0), anchor[1] + cy * sc + (j ? off * 0.15 : 0)]);
      const L = [], Rr = [];
      pts.forEach((p, j) => { const q = pts[Math.min(j + 1, pts.length - 1)], r = pts[Math.max(j - 1, 0)], tx = q[0] - r[0], ty = q[1] - r[1], n = Math.hypot(tx, ty) || 1, w = (9 - j * 2.2) * (ti ? 0.8 : 1);
        L.push([p[0] - ty / n * w, p[1] + tx / n * w]); Rr.push([p[0] + ty / n * w, p[1] - tx / n * w]); });
      g.beginPath(); g.moveTo(L[0][0], L[0][1]);
      for (let j = 1; j < L.length; j++) g.quadraticCurveTo(L[j - 1][0], L[j - 1][1], (L[j - 1][0] + L[j][0]) / 2, (L[j - 1][1] + L[j][1]) / 2);
      g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      for (let j = Rr.length - 1; j > 0; j--) g.quadraticCurveTo(Rr[j][0], Rr[j][1], (Rr[j - 1][0] + Rr[j][0]) / 2, (Rr[j - 1][1] + Rr[j][1]) / 2);
      g.closePath(); g.fillStyle = LK.headCol; g.fill(); g.lineWidth = 5; g.strokeStyle = SK.ink; g.lineJoin = 'round'; g.stroke();
    });
  } else if (LK.tails) [[1, 0.95], [0.75, 0.75]].forEach(([len, k], i) => {
    const L = (0.12 + 0.05 * Math.min(1, sp / 4)) * H * len;
    const a = Math.atan2(ty, tx) + (i ? 0.35 : -0.15) + wave * (i ? -1 : 1);
    const mid = [anchor[0] + Math.cos(a - wave * 0.6) * L * 0.5, anchor[1] + Math.sin(a - wave * 0.6) * L * 0.5];
    const end = [anchor[0] + Math.cos(a) * L, anchor[1] + Math.sin(a) * L];
    g.beginPath(); g.moveTo(anchor[0] - 6, anchor[1] - 5); g.quadraticCurveTo(mid[0], mid[1], end[0], end[1]); g.quadraticCurveTo(mid[0] + 8, mid[1] + 6, anchor[0] + 6, anchor[1] + 5); g.closePath();
    g.fillStyle = LK.headCol; g.fill(); g.lineWidth = 5; g.strokeStyle = SK.ink; g.stroke();
    if (sp > 3) for (let k2 = 0; k2 < 3; k2++) { const off = (k2 - 1) * 10; inkLine(g, [[end[0] + Math.cos(a) * 12, end[1] + Math.sin(a) * 12 + off], [end[0] + Math.cos(a) * (40 + sp * 5), end[1] + Math.sin(a) * (40 + sp * 5) + off]], 3, 60 + k2, 'rgba(35,29,27,0.6)'); }
  });
  // head: open circle, headwear, beard, small face
  if (LK.head === 'veil') { g.beginPath(); g.moveTo(hc[0] - R * 1.15, hc[1] + R * 1.5); g.bezierCurveTo(hc[0] - R * 1.4, hc[1] - R * 1.6, hc[0] + R * 1.4, hc[1] - R * 1.6, hc[0] + R * 1.15, hc[1] + R * 1.5); g.closePath(); fill(g, LK.headCol); g.lineWidth = 6; g.strokeStyle = SK.ink; g.stroke(); }
  circle(g, hc[0], hc[1], R); fill(g, d.face.red ? '#e4573f' : SK.head);
  if (typeof CHAR_LIGHT !== 'undefined' && !d.face.red) { const [lx, ly] = lightDir(); g.save(); circle(g, hc[0], hc[1], R - 1); g.clip(); const gr = g.createLinearGradient(hc[0] + lx * R, hc[1] + ly * R, hc[0] - lx * R, hc[1] - ly * R); gr.addColorStop(0, hexA(CHAR_LIGHT.shade, 0)); gr.addColorStop(clamp(1 - 2 * CHAR_LIGHT.frac), hexA(CHAR_LIGHT.shade, 0)); gr.addColorStop(1, hexA(CHAR_LIGHT.shade, 0.9)); g.fillStyle = gr; g.fillRect(hc[0] - R, hc[1] - R, 2 * R, 2 * R); g.restore(); }
  wobblePath(g, Array.from({ length: 13 }, (_, i) => [hc[0] + Math.cos(i / 12 * TAU) * R, hc[1] + Math.sin(i / 12 * TAU) * R]), 0.9, 40); g.lineWidth = 7; g.strokeStyle = SK.ink; g.stroke();
  const hw = LK.head, hcol = LK.headCol;
  const band = (h0, h1) => { g.save(); circle(g, hc[0], hc[1], R); g.clip(); g.fillStyle = hcol; g.fillRect(hc[0] - R, hc[1] - R, 2 * R, R * h0); g.restore(); inkLine(g, [[hc[0] - R * 0.97, hc[1] - R * h1], [hc[0], hc[1] - R * (h1 + 0.05)], [hc[0] + R * 0.97, hc[1] - R * h1]], 5, 41); };
  if (hw === 'wrap' || hw === 'scarf') band(0.55, 0.45);
  if (hw === 'headband') { g.save(); circle(g, hc[0], hc[1], R); g.clip(); g.fillStyle = hcol; g.fillRect(hc[0] - R, hc[1] - R * 0.62, 2 * R, R * 0.26); g.restore(); inkLine(g, [[hc[0] - R, hc[1] - R * 0.62], [hc[0] + R, hc[1] - R * 0.62]], 4, 42); inkLine(g, [[hc[0] - R, hc[1] - R * 0.36], [hc[0] + R, hc[1] - R * 0.36]], 4, 43); }
  if (hw === 'veil') band(0.5, 0.4);
  if (hw === 'hair') { g.save(); circle(g, hc[0], hc[1], R); g.clip(); g.fillStyle = hcol; g.fillRect(hc[0] - R, hc[1] - R, 2 * R, R * 0.5); g.restore(); for (let i = -2; i <= 2; i++) { circle(g, hc[0] + i * R * 0.38, hc[1] - R * 0.82 + Math.abs(i) * R * 0.1, R * 0.26); fill(g, hcol); g.lineWidth = 4; g.strokeStyle = SK.ink; g.stroke(); } }
  if (hw === 'cap') { g.beginPath(); g.arc(hc[0], hc[1], R + 3, PI + 0.18, TAU - 0.18); g.closePath(); fill(g, hcol); g.lineWidth = 6; g.strokeStyle = SK.ink; g.stroke(); const by = hc[1] - R * 0.52; g.beginPath(); g.moveTo(hc[0] - dir * R * 0.1, by); g.quadraticCurveTo(hc[0] + dir * R * 0.9, by - 3, hc[0] + dir * R * 1.45, by + 6); g.quadraticCurveTo(hc[0] + dir * R * 0.8, by + 10, hc[0] - dir * R * 0.1, by + 6); fill(g, '#2f5694'); g.lineWidth = 4; g.stroke(); }
  if (hw === 'crown') { const cy = hc[1] - R * 0.75; rrect(g, hc[0] - R * 0.62, cy - R * 1.25, R * 1.24, R * 1.3, 4); fill(g, '#b5302d'); g.lineWidth = 6; g.strokeStyle = SK.ink; g.stroke(); [cy - R * 0.1, cy - R * 1.25].forEach(y => { rrect(g, hc[0] - R * 0.68, y, R * 1.36, R * 0.2, 3); fill(g, '#e8b63c'); g.lineWidth = 4; g.stroke(); }); [-1, 0, 1].forEach(i => { circle(g, hc[0] + i * R * 0.35, cy - R * 0.6, R * 0.1); fill(g, '#e8b63c'); g.lineWidth = 3; g.stroke(); }); }
  if (LK.tails) { circle(g, anchor[0], anchor[1], 8); fill(g, hcol); g.lineWidth = 4; g.strokeStyle = SK.ink; g.stroke(); }
  if (!d.back) {
    const fx = hc[0] + dir * R * 0.25, fy = hc[1];
    const bc = LK.beard, bs = LK.beardStyle;
    if (bc && (bs === 'short' || bs === 'full')) { g.beginPath(); g.arc(fx - dir * 2, fy + 4, R * 0.78, 0.18 * PI, 0.82 * PI); g.quadraticCurveTo(fx - dir * 2, fy + R * (bs === 'full' ? 1.9 : 1.05), fx - dir * 2 + R * 0.78 * Math.cos(0.18 * PI), fy + 4 + R * 0.78 * Math.sin(0.18 * PI)); g.fillStyle = bc; g.fill(); }
    if (bc && bs === 'curly') { const bx = fx - dir * 1; g.beginPath(); g.moveTo(bx - R * 0.72, fy + R * 0.25); g.bezierCurveTo(bx - R * 0.8, fy + R * 1.4, bx - R * 0.3, fy + R * 2.2, bx, fy + R * 2.3); g.bezierCurveTo(bx + R * 0.3, fy + R * 2.2, bx + R * 0.8, fy + R * 1.4, bx + R * 0.72, fy + R * 0.25); g.quadraticCurveTo(bx, fy + R * 0.55, bx - R * 0.72, fy + R * 0.25); g.fillStyle = bc; g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 2.5; for (let r = 0; r < 5; r++) for (let c = -2; c <= 2; c++) { g.beginPath(); g.arc(bx + c * R * 0.26 + (r % 2) * R * 0.13, fy + R * 0.7 + r * R * 0.3, R * 0.09, 0.2, PI + 1); g.stroke(); } }
    if (bc && bs === 'stache') { const sx2 = fx + dir * 2, sy2 = fy + 8; g.beginPath(); g.moveTo(sx2, sy2 - 2); g.quadraticCurveTo(sx2 - 12, sy2 - 6, sx2 - 16, sy2 + 3); g.quadraticCurveTo(sx2 - 8, sy2 + 1, sx2, sy2 + 2); g.quadraticCurveTo(sx2 + 8, sy2 + 1, sx2 + 16, sy2 + 3); g.quadraticCurveTo(sx2 + 12, sy2 - 6, sx2, sy2 - 2); g.fillStyle = bc; g.fill(); }
    const f = d.face, blink = blinkClosed(d.id, NOW, false) && (f.eyes || 'dot') !== 'closed';
    const ex = [fx - 9, fx + 9].map(x => x + dir * 2), ey = fy - 6;
    ex.forEach((x, i) => {
      if (blink || f.eyes === 'closed') inkLine(g, [[x - 5, ey], [x + 5, ey + (f.eyes === 'closed' ? 2 : 0)]], 3.5, 70 + i);
      else if (f.eyes === 'wide') { circle(g, x, ey, 6.5); fill(g, '#fff'); g.lineWidth = 2.5; g.strokeStyle = SK.ink; g.stroke(); circle(g, x + dir * 1.5, ey, 2.8); fill(g, SK.ink); }
      else if (f.eyes === 'angry') { circle(g, x, ey + 1, 3.2); fill(g, SK.ink); }
      else { circle(g, x, ey, 3.4); fill(g, SK.ink); circle(g, x - 1, ey - 1.2, 1.1); fill(g, '#fff'); }
    });
    const br2 = f.brows || 'soft';
    ex.forEach((x, i) => { const side = i ? 1 : -1, inner = side * -dir; const dy = br2 === 'angry' ? [-14, -8] : br2 === 'worried' ? [-9, -15] : br2 === 'raised' ? [-17, -17] : [-13, -13];
      inkLine(g, [[x - 6, ey + (inner < 0 ? dy[1] : dy[0])], [x + 6, ey + (inner < 0 ? dy[0] : dy[1])]], 4, 80 + i); });
    const mx = fx + dir * 2, my = fy + 12, m = f.mouth || 'line';
    if (m === 'open' || m === 'o') { ell(g, mx, my, m === 'o' ? 4 : 7, m === 'o' ? 5 : 7); fill(g, '#5a2420'); }
    else if (m === 'grit') { rrect(g, mx - 9, my - 4, 18, 8, 2); fill(g, '#fff'); g.lineWidth = 2; g.strokeStyle = SK.ink; g.stroke(); }
    else if (m === 'smile') inkLine(g, [[mx - 6, my - 2], [mx, my + 2], [mx + 6, my - 2]], 3, 90);
    else if (m === 'frown' || m === 'wobbly') inkLine(g, [[mx - 6, my + 2], [mx, my - 1], [mx + 6, my + 2]], 3, 91);
    else inkLine(g, [[mx - 5, my], [mx + 5, my]], 3, 92);
    if (f.sweat) { const sx = hc[0] + dir * R * 0.9, sy = hc[1] - R * 0.5; g.beginPath(); g.moveTo(sx, sy - 12); g.quadraticCurveTo(sx + 9, sy + 3, sx, sy + 6); g.quadraticCurveTo(sx - 9, sy + 3, sx, sy - 12); fill(g, '#8fd3f4'); g.lineWidth = 2.5; g.strokeStyle = SK.ink; g.stroke(); }
    if (f.steam) for (let i = 0; i < 4; i++) { const p = mod(NOW * 1.6 + i / 4, 1), side = i % 2 ? 1 : -1; circle(g, hc[0] + side * (R + p * 40), hc[1] - R * 0.6 - p * 120, 10 + p * 22); fill(g, `rgba(255,255,255,${0.9 * (1 - p)})`); }
  }
  if (d.seaweed) [[-0.75, -1], [-0.2, -1], [0.45, 1]].forEach(([ox, side], i) => { const x0 = hc[0] + ox * R, y0 = hc[1] - R * 0.95; inkLine(g, [[x0, y0], [x0 + side * R * 0.35, y0 - R * 0.12], [x0 + side * R * 0.55, y0 + R * 0.35 + i * 6]], 5, 100 + i, '#4a9a3c'); });
  // front arm last; hands are just the line ends
  back([shoulder, aF[0], aF[1]], 5); hand(aF[1]);
  const M = g.getTransform(), mp = p => { const q = M.transformPoint(new DOMPoint(p[0], p[1])); return [q.x, q.y]; };
  const J = { handF: mp(aF[1]), handB: mp(aB[1]), elbowF: mp(aF[0]), elbowB: mp(aB[0]), footF: mp(lF[1]), footB: mp(lB[1]), kneeF: mp(lF[0]), kneeB: mp(lB[0]), shoulder: mp(shoulder), hip: mp([0, 0]), head: mp(hc), headR: R * Math.hypot(M.a, M.b) };
  g.restore();
  return J;

  function foot(l, seed) { const [k, f] = l; g.beginPath(); g.moveTo(f[0] - dir * 6, f[1] - 5); g.quadraticCurveTo(f[0] + dir * 6, f[1] - 9, f[0] + dir * 19, f[1] - 1); g.quadraticCurveTo(f[0] + dir * 21, f[1] + 4, f[0] + dir * 12, f[1] + 4); g.lineTo(f[0] - dir * 6, f[1] + 4); g.quadraticCurveTo(f[0] - dir * 10, f[1], f[0] - dir * 6, f[1] - 5); g.fillStyle = SK.ink; g.fill(); }
}

// dust puffs on landings and skids (age 0..1)
function dustPuff(g, x, y, age, s = 1, n = 3) {
  if (age < 0 || age > 1) return;
  for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1, k = (i + 1) / n;
    const px = x + side * (30 + age * 120 * k) * s, py = y - (6 + age * 30 * k) * s, r = (14 + 22 * age) * s * (1 - age * 0.4);
    circle(g, px, py, r); fill(g, `rgba(150,170,175,${0.75 * (1 - age)})`); g.lineWidth = 3 * s; g.strokeStyle = `rgba(35,29,27,${0.5 * (1 - age)})`; g.stroke(); }
}

// jump helper: returns { air (H), vy (H/s, + = up), pose } for a jump that leaves at t0 with v0 (measured g)
function jumpState(t, t0, v0 = 5.6) {
  const T = 2 * v0 / SK.g;                       // airtime (0.87 s for v0 5.6)
  if (t < t0 - 0.07) return { air: 0, vy: 0, pose: null };
  if (t < t0) return { air: 0, vy: 0, pose: 'crouch' };              // 2-frame anticipation crouch
  const u = t - t0;
  if (u < T) { const air = v0 * u - 0.5 * SK.g * u * u, vy = v0 - SK.g * u; return { air, vy, pose: vy > 1 ? 'rise' : 'fall' }; }
  const l = u - T;
  if (l < 0.17) return { air: 0, vy: 0, pose: 'land', land: l };     // landing dip ~5 frames
  if (l < 0.27) return { air: 0, vy: 0, pose: mixPose(POSES.land, POSES.idle, (l - 0.17) / 0.1), land: l };
  return { air: 0, vy: 0, pose: null, land: l };
}


// ================= fluid motion layer (measured: no held frames, pose changes ~0.4 s, max/median step <= ~2.5)
const smooth5 = k => { k = clamp(k); return k * k * k * (k * (6 * k - 15) + 10); };
const poseOf = (p, t) => typeof p === 'function' ? p(t) : typeof p === 'string' ? POSES[p] : p;
// keys: [[time, pose | name | fn(t), transition seconds (default 0.4)], ...]; each blend finishes at its key time
function poseTrack(keys, t) {
  let cur = poseOf(keys[0][1], t);
  for (let j = 1; j < keys.length; j++) {
    const tr = keys[j][2] ?? 0.4, k = smooth5((t - (keys[j][0] - tr)) / tr);
    if (k > 0) cur = mixPose(cur, poseOf(keys[j][1], t), k);
  }
  return cur;
}
// continuous life on top of any pose (breathing, weight shift, arm drift): ~1-1.4 %/frame of drawing change
function alive(p, t, amp = 1) {
  const q = JSON.parse(JSON.stringify(p)), sn = (f, ph) => Math.sin(t * f + ph);
  q.lean = (q.lean || 0) + 1.6 * amp * sn(2.1, 0.3);
  q.tilt = (q.tilt || 0) + 2.2 * amp * sn(1.5, 1.1);
  q.aF = [q.aF[0] + 4 * amp * sn(1.9, 2.0), q.aF[1] + 3 * amp * sn(2.6, 0.4)];
  q.aB = [q.aB[0] - 4 * amp * sn(1.7, 2.7), q.aB[1] - 3 * amp * sn(2.3, 1.7)];
  q.lF = [q.lF[0] + 1.2 * amp * sn(1.2, 0.9), q.lF[1]]; q.lB = [q.lB[0] + 1.2 * amp * sn(1.2, 0.9), q.lB[1]];
  return q;
}
// overlapping action: arms trail the body by 2 frames, the head tilt by ~1
function jonahPose(keys, t, life = 1) {
  const body = alive(poseTrack(keys, t), t, life);
  const arms = alive(poseTrack(keys, t - 0.067), t - 0.067, life);
  const head = alive(poseTrack(keys, t - 0.033), t - 0.033, life);
  body.aF = arms.aF; body.aB = arms.aB; body.tilt = head.tilt;
  return body;
}
// tails: target angle from velocity (vel = [horizontal, upward] in H/s), then a damped spring (lag, overshoot, settle)
function tailTarget(vx, vy, dir) { const tx = -dir * 0.45 - 0.32 * vx, ty = 1 + 0.28 * vy; return Math.atan2(ty, tx); }
function tailSpring(t, velFn, dir) {
  const w = 13, z = 0.35, dt = 1 / 60; let tt = t - 0.8;
  let v0 = velFn(tt), th = tailTarget(v0[0], v0[1], dir), om = 0;
  for (; tt < t; tt += dt) {
    const v = velFn(tt); let tg = tailTarget(v[0], v[1], dir);
    while (tg - th > PI) tg -= TAU; while (tg - th < -PI) tg += TAU;
    om += (-w * w * (th - tg) - 2 * z * w * om) * dt; th += om * dt;
  }
  return th;
}
// convenience: everything the card needs for one frame
function jonahFrame(t, keys, o = {}) {
  const vel = o.vel ? o.vel(t) : [0, 0], dir = o.dir ?? 1;
  return { ...o, dir, pose: jonahPose(keys, t, o.life ?? 1), vel, tailA: tailSpring(t, o.vel || (() => [0, 0]), dir) };
}
// airborne pose that blends continuously with vertical speed (rising -> falling)
const airPose = vy => mixPose(POSES.rise, POSES.fall, smooth5((2 - vy) / 4));
