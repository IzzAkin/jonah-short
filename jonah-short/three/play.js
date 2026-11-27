// Playable 2.5D character in the existing harbour set.
// Fixed 60 Hz physics (continuous velocity, acceleration curve, friction, slope momentum), continuously
// blended states, spring-damper secondary motion (head-wrap tails, arms, tunic hem), squash & stretch,
// smear frames. Drawn as 2D ink on a high-DPI canvas texture on a camera-facing plane that casts real shadows.
// Motion constants are the measured platformer values (ricks-clips-style/MOTION.md), in metres for a 1.65 m figure.
const PH = (() => {
  const H = 1.65;
  return {
    H, dt: 1 / 60,
    vmax: 6.0 * H,            // measured top run speed ~5-7 H/s
    accel: 18 * H,            // ground acceleration at rest (falls off toward vmax); measured p90 ~30 H/s^2 peak
    skidDecel: 26 * H,        // braking while pushing against motion
    friction: 9 * H,          // no input
    slideFriction: 1.6 * H,   // low slide
    airAccel: 9 * H,
    g: 12.8 * H,              // measured gravity
    jumpV: 5.6 * H,           // measured take-off speed -> airtime 0.87 s, apex 1.22 H
    jumpCut: 2.2,             // extra gravity while rising with the button released (variable height)
    slopeRun: 0.55, slopeSlide: 1.0,   // share of along-slope gravity applied when running / sliding
    step: 0.45, snap: 0.32, coyote: 0.09, buffer: 0.11,
    lane: -2.4,               // z of the play lane through the harbour (quay -> gangplank -> ship deck)
  };
})();

// ---------------------------------------------------------------- ground probing on the existing set
const RAY = new T3.Raycaster(); const RAY_DOWN = new T3.Vector3(0, -1, 0);
let SOLIDS = [];
function collectSolids(scene, exclude) {
  SOLIDS = [];
  scene.traverse(o => {
    if (!o.isMesh || exclude.has(o) || o.isSprite) return;
    const m = o.material;
    if (m === OUTLINE_MAT || o.userData.update || m.blending === T3.AdditiveBlending || m.fog === false || (m.map && m.map.isCanvasTexture && m.alphaTest > 0)) return;
    SOLIDS.push(o);
  });
}
function probe(x, yTop, z, solids = SOLIDS, floor = null) {
  const fl = floor != null && yTop >= floor ? { y: floor, nx: 0, ny: 1 } : null;
  if (!solids.length) return fl;
  RAY.set(new T3.Vector3(x, yTop, z), RAY_DOWN); RAY.far = 40;
  const hits = RAY.intersectObjects(solids, false);
  for (const h of hits) {
    const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : new T3.Vector3(0, 1, 0);
    if (n.y < 0) n.negate();
    if (n.y > 0.45) return fl && fl.y > h.point.y ? fl : { y: h.point.y, nx: n.x, ny: Math.hypot(n.y, n.z) };
  }
  return fl;
}

// ---------------------------------------------------------------- the controller
function makeRunner(x0, y0) {
  return {
    x: x0, y: y0, vx: 0, vy: 0, s: 0, ground: true, nx: 0, ny: 1, facing: 1, faceT: 1, faceVis: 1,
    coyote: 0, buffer: 0, skid: false, slide: false, rollT: 0, airT: 0, landImpact: 0, landAge: 9, takeoffAge: 9,
    prev: { x: x0, y: y0, faceVis: 1 }, ax: 0, ay: 0,
  };
}
function stepRunner(R, inp) {
  const P = inp.cap ? { ...PH, vmax: inp.cap, accel: PH.accel * 0.5 } : PH, dt = P.dt;
  R.prev = { x: R.x, y: R.y, faceVis: R.faceVis };
  const vx0 = R.vx, vy0 = R.vy;
  const ix = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  if (inp.jumpPressed) R.buffer = P.buffer; else R.buffer = Math.max(0, R.buffer - dt);
  R.landAge += dt; R.takeoffAge += dt; R.rollT = Math.max(0, R.rollT - dt);
  if (R.ground) {
    const tx = R.ny, ty = -R.nx;                     // unit tangent along +x
    let s = R.vx * tx + R.vy * ty;
    const gT = -P.g * ty;                            // gravity along the slope
    R.skid = false;
    if (inp.down && Math.abs(s) > 2.6) R.slide = true;
    if (R.slide && (!inp.down || Math.abs(s) < 1.0)) R.slide = false;
    let a = 0;
    if (R.slide) a = -Math.sign(s) * P.slideFriction + gT * P.slopeSlide;
    else {
      if (ix !== 0 && (Math.sign(ix) === Math.sign(s) || Math.abs(s) < 0.6)) a = ix * P.accel * Math.max(0.05, 1 - (Math.abs(s) / P.vmax) ** 2);
      else if (ix !== 0) { a = ix * P.skidDecel; R.skid = Math.abs(s) > 1.2; }
      else a = -Math.sign(s) * Math.min(P.friction, Math.abs(s) / dt);
      a += gT * P.slopeRun;
    }
    s += a * dt;
    s = clamp(s, -P.vmax * 1.7, P.vmax * 1.7);
    if (!ix && !R.slide && Math.abs(s) < 0.05 && Math.abs(gT) < 3) s = 0;
    let nx = R.x + s * tx * dt;
    const gh = probe(nx, R.y + P.step + 0.6, R.lane ?? P.lane, R.solids || SOLIDS, R.floor);
    if (gh && gh.y > R.y + P.step) { nx = R.x; s = 0; }               // wall: too high to step
    R.x = nx;
    if (gh && gh.y >= R.y - P.snap - Math.abs(s) * dt * 0.6) {           // stay glued to the ground, follow slopes
      R.y = gh.y; R.nx = gh.nx; R.ny = gh.ny;
      R.vx = s * R.ny; R.vy = s * -R.nx;
    } else {                                                              // ran off an edge or crest: momentum carries on
      R.ground = false; R.vx = s * tx; R.vy = s * ty; R.coyote = P.coyote; R.airT = 0;
    }
    R.s = s;
    if (R.buffer > 0 && (R.ground || R.coyote > 0)) {
      R.ground = false; R.vy = Math.max(R.vy, 0) + (inp.jumpV || P.jumpV); R.buffer = 0; R.coyote = 0; R.airT = 0; R.takeoffAge = 0; R.slide = false;
    }
  } else {
    R.coyote = Math.max(0, R.coyote - dt); R.airT += dt;
    if (R.buffer > 0 && R.coyote > 0) { R.vy = P.jumpV; R.buffer = 0; R.coyote = 0; R.takeoffAge = 0; }
    R.vy -= P.g * dt * (R.vy > 0 && !inp.jumpHeld ? 1 + P.jumpCut : 1);
    if (ix) R.vx += ix * P.airAccel * dt * (Math.sign(ix) !== Math.sign(R.vx) ? 1.4 : Math.max(0, 1 - Math.abs(R.vx) / P.vmax));
    R.vx = clamp(R.vx, -P.vmax * 1.7, P.vmax * 1.7);
    let nx = R.x + R.vx * dt, ny = R.y + R.vy * dt;
    const wall = probe(nx, R.y + P.step + 0.6, R.lane ?? P.lane, R.solids || SOLIDS, R.floor);
    if (wall && wall.y > R.y + P.step && wall.y > ny + 0.05) { nx = R.x; R.vx = 0; }
    const gh = probe(nx, Math.max(R.y, ny) + 0.6, R.lane ?? P.lane, R.solids || SOLIDS, R.floor);
    if (gh && R.vy <= 0 && ny <= gh.y) {                                // land, keeping momentum along the slope
      const tx = gh.ny, ty = -gh.nx, s = R.vx * tx + R.vy * ty;
      R.landImpact = -R.vy; R.landAge = 0;
      R.ground = true; R.y = gh.y; R.nx = gh.nx; R.ny = gh.ny; R.s = s; R.vx = s * tx; R.vy = s * ty;
      if (inp.down && Math.abs(s) > 1.5) R.rollT = 0.5;
    } else { R.x = nx; R.y = ny; }
    R.s = R.vx;
    if (R.y < -3 && !R.noRespawn) Object.assign(R, makeRunner(-12, 0.05));            // fell in the sea: respawn on the quay
  }
  // facing: turn only when not braking; the visible turn is a continuous squeeze through edge-on (no flip pop)
  const sp = R.ground ? R.s : R.vx;
  if (ix && !R.skid && (Math.sign(ix) === Math.sign(sp) || Math.abs(sp) < 1.5 || !R.ground)) R.faceT = ix;
  if (inp.faceTo) R.faceT = inp.faceTo;
  R.faceVis += (R.faceT - R.faceVis) * (1 - Math.exp(-dt * 16));
  R.facing = R.faceVis >= 0 ? 1 : -1;
  R.ax = (R.vx - vx0) / dt; R.ay = (R.vy - vy0) / dt;
}

// ---------------------------------------------------------------- animation: weights, springs, squash, smears
function makeAnim() {
  return {
    w: { idle: 1, run: 0, skid: 0, slide: 0, air: 0, roll: 0, land: 0 }, phase: 0, t: 0,
    arms: { F: [12, -8, 0, 0], B: [-12, -8, 0, 0] },            // angle, elbow, vel, elbowVel
    lean: 0, leanV: 0, rot: 0, rotV: 0,
    hem: [0, 0, 0, 0], q: 0, qv: 0,                               // hem offset+vel, squash scalar+vel
    chain: null, hist: { handF: [], handB: [], footF: [], footB: [], head: [] },
  };
}
const UNITS = 300 / PH.H;                                          // figure units per metre
function addPose(acc, p, w) { for (const k in p) { const v = p[k]; if (typeof v !== 'number' && !Array.isArray(v)) continue; if (Array.isArray(v)) { acc[k] = acc[k] || v.map(() => 0); v.forEach((x, i) => (acc[k][i] += x * w)); } else acc[k] = (acc[k] || 0) + v * w; } }
function stepAnim(A, R, inp) {
  const dt = PH.dt; A.t += dt;
  const sp = R.ground ? R.s : R.vx, as = Math.abs(sp), f = R.facing;
  // 1. continuous state weights (critically-damped toward targets, never cut)
  const T = { idle: 0, run: 0, skid: 0, slide: 0, air: 0, roll: 0, land: 0 };
  if (!R.ground) T.air = 1;
  else if (R.rollT > 0) T.roll = 1;
  else if (R.slide) T.slide = 1;
  else if (R.skid) T.skid = 1;
  else if (R.landAge < 0.16) T.land = 1;
  else if (as > 0.35) T.run = 1;
  else T.idle = 1;
  const rates = { idle: 7, run: 10, skid: 13, slide: 12, air: 14, roll: 16, land: 22 };
  let tot = 0;
  for (const k in A.w) { A.w[k] += (T[k] - A.w[k]) * (1 - Math.exp(-dt * rates[k])); tot += A.w[k]; }
  for (const k in A.w) A.w[k] /= tot;
  // 2. gait phase from distance travelled (no foot sliding); walk -> run by speed
  const stride = lerp(2.2, 4.6, clamp(as / PH.vmax));
  A.phase += as * dt / stride * TAU;
  const kRun = smooth5(clamp((as - 1.5) / 4));
  const gait = mixPose(walkPose(A.phase), runPose(A.phase), kRun);
  const airP = airPose(R.vy / PH.H);
  const slideP = { lean: -24, aF: [70, 30], aB: [-60, -20], lF: [80, -10], lB: [55, -95], air: 0 };
  const rollP = { lean: 40, aF: [60, 120], aB: [50, 125], lF: [95, -150], lB: [90, -150], air: 0.6 };
  const landP = mixPose(POSES.land, POSES.crouch, clamp(R.landImpact / (PH.jumpV * 1.3)));
  const P = {}; addPose(P, alive(POSES.idle, A.t, 1), A.w.idle); addPose(P, gait, A.w.run); addPose(P, POSES.skid, A.w.skid);
  addPose(P, slideP, A.w.slide); addPose(P, airP, A.w.air); addPose(P, rollP, A.w.roll); addPose(P, landP, A.w.land);
  // 3. body lean: velocity-driven forward lean, backward when braking (skid pose), slope alignment via rotation
  const leanT = 16 * clamp(sp * f / PH.vmax, -1, 1) * (1 - A.w.skid - A.w.slide) - 6 * clamp(R.ax * f / 60, -1, 1) * A.w.run;
  const kL = 140, cL = 2 * Math.sqrt(kL) * 0.6;
  A.leanV += (kL * (leanT - A.lean) - cL * A.leanV) * dt; A.lean += A.leanV * dt;
  P.lean = (P.lean || 0) + A.lean;
  const slopeRot = R.ground ? Math.atan2(R.nx, R.ny) * -1 : 0;           // canvas rotation (+ = clockwise)
  const rotT = slopeRot * 0.45 + (A.w.roll > 0.05 ? 0 : 0);
  const kR = 90, cR = 2 * Math.sqrt(kR) * 0.8;
  A.rotV += (kR * (rotT - A.rot) - cR * A.rotV) * dt; A.rot += A.rotV * dt;
  // scripted tumble while airborne; on the ground it settles to the nearest full turn (no unwinding)
  if (inp.tumble && !R.ground) A.tumble = (A.tumble || 0) + inp.tumble * dt;
  else if (A.tumble) A.tumble += (Math.round(A.tumble / TAU) * TAU - A.tumble) * (1 - Math.exp(-dt * 14));
  A.spin = R.rollT > 0 ? (1 - R.rollT / 0.5) * TAU * f : (A.spin || 0) * Math.exp(-dt * 30);
  // 4. arms on springs (Hooke): lag behind acceleration, whip forward when stopping
  const aF = R.ax * f;                                               // acceleration along facing, m/s^2
  ['F', 'B'].forEach(k => {
    const tgt = P['a' + k], s = A.arms[k], K = 230, C = 2 * Math.sqrt(K) * 0.32, KA = 4.2, KE = 2.6;
    s[2] += (K * (tgt[0] - s[0]) - C * s[2] - KA * aF - (k === 'F' ? 1 : -1) * 0.8 * R.ay * (A.w.air ? 1 : 0)) * dt; s[0] += s[2] * dt;
    s[3] += (K * (tgt[1] - s[1]) - C * s[3] - KE * aF) * dt; s[1] += s[3] * dt;
    P['a' + k] = [s[0], s[1]];
  });
  // 5. tunic hem: 2D spring driven by the opposite of acceleration (flaps back when sprinting off, forward on braking)
  const kH = 160, cH = 2 * Math.sqrt(kH) * 0.3;
  A.hem[2] += (-kH * A.hem[0] - cH * A.hem[2] - 1.1 * aF) * dt; A.hem[0] += A.hem[2] * dt;
  A.hem[3] += (-kH * A.hem[1] - cH * A.hem[3] + 0.9 * R.ay) * dt; A.hem[1] += A.hem[3] * dt;
  // 6. head-wrap tail chain: verlet nodes under gravity, inertia (−acceleration) and airflow (−velocity)
  const nN = 4, L0 = 17;
  if (!A.chain) A.chain = Array.from({ length: nN }, (_, i) => ({ x: -i * L0 * 0.6, y: i * L0 * 0.8, px: -i * L0 * 0.6, py: i * L0 * 0.8 }));
  const fx = -R.ax * f * 1.1 - R.vx * f * 30 - 40, fy = R.ay * 1.1 + 170 + R.vy * 26;   // local units/s^2 (+y down): inertia, airflow, gravity
  for (let i = 1; i < nN; i++) { const n = A.chain[i], vx = (n.x - n.px) * 0.985, vy = (n.y - n.py) * 0.985; n.px = n.x; n.py = n.y; n.x += vx + fx * 0.6 * dt * dt * 60; n.y += vy + fy * 0.6 * dt * dt * 60; }
  for (let it = 0; it < 4; it++) for (let i = 1; i < nN; i++) { const a = A.chain[i - 1], b = A.chain[i], dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy) || 1, k = (dd - L0) / dd; if (i === 1) { b.x -= dx * k; b.y -= dy * k; } else { a.x += dx * k * 0.5; a.y += dy * k * 0.5; b.x -= dx * k * 0.5; b.y -= dy * k * 0.5; } A.chain[0].x = 0; A.chain[0].y = 0; }
  // 7. squash & stretch: landing impulse compresses (spring overshoots back), take-off stretches
  if (R.landAge === 0 || (R.landAge < PH.dt * 0.5)) A.qv -= clamp(R.landImpact / PH.jumpV, 0, 1.6) * 3.2;
  if (R.takeoffAge < PH.dt * 0.5) A.qv += 2.4;
  const kQ = 260, cQ = 2 * Math.sqrt(kQ) * 0.38;
  A.qv += (-kQ * A.q - cQ * A.qv) * dt; A.q += A.qv * dt;
  // story acting: a named pose (or pose object) blended in on a spring weight; fades out the same way
  if (inp.act) { A.actPose = typeof inp.act === 'string' ? POSES[inp.act] : inp.act; A.actName = typeof inp.act === 'string' ? inp.act : 'custom'; }
  A.actW = (A.actW || 0) + ((inp.act ? 1 : 0) - (A.actW || 0)) * (1 - Math.exp(-dt * (inp.actRate || 8)));
  if (A.actPose && A.actW > 0.002) {
    const ap = alive(A.actPose, A.t, inp.actLife ?? 1); const keep = { aF: P.aF, aB: P.aB };
    const m = mixPose(P, ap, smooth5(A.actW));
    // arms keep their spring state but chase the acted pose
    m.aF = mixPose({ a: keep.aF }, { a: ap.aF }, smooth5(A.actW)).a; m.aB = mixPose({ a: keep.aB }, { a: ap.aB }, smooth5(A.actW)).a;
    Object.assign(P, m);
  }
  A.pose = P;
}

// draw the runner onto its card canvas: squash/stretch transform, the figure, then smears from joint history
// Character style for the film: 'rick' = the Rick's Clips rig (draw.js person), 'sketch' = the jointed stick figure.
let CHAR_STYLE = 'rick';
// Drive the Rick's Clips rig from the physics/animation state: arms and legs follow the blended pose, lean tilts the
// figure, acted kneel/sit/pray poses switch the rig's body pose. Returns joint positions for smears.
function rickFigure(g, sc, f, A, R, opts) {
  const P = A.pose || POSES.idle, s = sc * 300 / 507 * (opts.k || 1);
  const arm = (a, side) => side ? [a[0], a[0] + a[1]] : [-a[0], -(a[0] + a[1])];
  const front = f > 0, arms = front ? { r: arm(P.aF, 1), l: arm(P.aB, 0) } : { l: arm(P.aF, 1), r: arm(P.aB, 0) };
  const act = A.actW > 0.5 ? A.actName : null;
  const pose = act === 'kneel' || act === 'pray' || act === 'cower' ? 'kneel' : act === 'sit' || act === 'sitBow' || act === 'perch' ? 'sit' : 'stand';
  const bow = act === 'pray' ? 0.55 : act === 'sitBow' ? 0.35 : act === 'cower' ? 0.4 : 0;
  const lean = (P.lean || 0) * PI / 180 * 0.45 * f;
  const fc = opts.face || {};
  return person(g, { ...rigLook(opts.look || LOOKS.jonah), x: 0, y: 0, s, dir: f, id: opts.id || 'J', idle: false, rot: lean + (opts.shake ? Math.sin(NOW * 70) * 0.03 : 0),
    pose, bow, arms, legAng: pose === 'stand' ? { F: P.lF, B: P.lB } : null, back: opts.back, seaweed: opts.seaweed,
    eyes: fc.eyes || 'dot', brows: fc.brows || null, mouth: fc.mouth || 'line', sweat: fc.sweat, red: fc.red, tears: fc.tears, blush: fc.blush });
}
function rickFigureSteam(g, J, s) { for (let i = 0; i < 4; i++) { const p = mod(NOW * 1.6 + i / 4, 1), side = i % 2 ? 1 : -1; circle(g, J.head[0] + side * (80 + p * 60) * s, J.head[1] - (50 + p * 170) * s, (14 + p * 30) * s); fill(g, `rgba(255,255,255,${0.9 * (1 - p)})`); } }
function drawRunner(g, card, R, A, sc, light, opts = {}) {
  const W = card.w, H = card.h, ox = card.ax, oy = card.ay;
  g.clearRect(0, 0, W, H);
  const sp = Math.hypot(R.vx, R.vy), f = R.facing, face = Math.max(0.12, Math.abs(R.faceVis));
  g.save();
  g.translate(ox, oy);
  { const pv = sc * 150 * (opts.k || 1); g.translate(0, -pv); g.rotate(A.rot + (A.spin || 0) + (A.tumble || 0)); g.translate(0, pv); }   // spin about mid-body
  // stretch along the motion vector at speed (in figure space), squash/stretch vertically from the spring
  const k = clamp((sp - 0.55 * PH.vmax) / (0.6 * PH.vmax), 0, 1) * 0.1;
  const ang = Math.atan2(-R.vy, R.vx);
  g.rotate(ang); g.scale(1 + k, 1 - k * 0.6); g.rotate(-ang);
  const q = clamp(A.q, -0.32, 0.3);
  g.scale((1 - q * 0.65) * face, 1 + q);
  const J = CHAR_STYLE === 'rick' ? rickFigure(g, sc, f, A, R, opts) : sketchman(g, { x: 0, y: 0, s: sc * (opts.k || 1), dir: f, pose: A.pose || POSES.idle, look: opts.look || LOOKS.jonah, id: opts.id || 'J', back: opts.back, seaweed: opts.seaweed, shake: opts.shake || 0, vel: [R.vx / PH.H, R.vy / PH.H], hemOff: [A.hem[0], A.hem[1]],
    tailChain: A.chain ? A.chain.map(n => [n.x, n.y]) : undefined, face: { eyes: R.ground && A.w.skid > 0.5 ? 'wide' : 'dot', brows: A.w.skid > 0.5 ? 'worried' : 'soft', mouth: A.w.air > 0.5 ? 'o' : A.w.skid > 0.5 ? 'wobbly' : 'line', ...(opts.face || {}) } });
  g.restore();
  // smear frames: tapered ink arcs from recent tip positions when a limb or the body moves fast
  const HIST = A.hist;
  for (const key of ['handF', 'handB', 'footF', 'footB', 'head']) {
    const h = HIST[key]; h.unshift(J[key]); if (h.length > 5) h.pop();
    if (h.length < 5) continue;
    const v = Math.hypot(h[0][0] - h[1][0], h[0][1] - h[1][1]) / sc;     // figure units per frame
    const thr = key === 'head' ? 9 : 11;
    if (v < thr) continue;
    const a = clamp((v - thr) / 14, 0, 1);
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {                                           // tapered strokes, thinner and fainter toward the tail
      g.beginPath(); g.moveTo(h[i][0], h[i][1]); g.quadraticCurveTo(h[i + 1][0], h[i + 1][1], (h[i + 1][0] + h[i + 2][0]) / 2, (h[i + 1][1] + h[i + 2][1]) / 2);
      g.lineWidth = (key === 'head' ? 6 : 7) * sc * (1 - i * 0.28); g.strokeStyle = `rgba(35,29,27,${0.42 * a * (1 - i * 0.3)})`; g.stroke();
    }
    if (key !== 'head') {                                                   // elongated limb ghost from the joint to the old tip
      const base = key.startsWith('hand') ? J[key === 'handF' ? 'elbowF' : 'elbowB'] : J[key === 'footF' ? 'kneeF' : 'kneeB'];
      g.beginPath(); g.moveTo(base[0], base[1]); g.quadraticCurveTo(h[1][0], h[1][1], h[2][0], h[2][1]); g.lineWidth = 5 * sc; g.strokeStyle = `rgba(35,29,27,${0.22 * a})`; g.stroke();
    }
    g.restore();
  }
  // speed lines behind the body in a sprint
  if (sp > 0.8 * PH.vmax) { const a = clamp((sp - 0.8 * PH.vmax) / (0.4 * PH.vmax), 0, 1); g.save(); g.strokeStyle = `rgba(35,29,27,${0.35 * a})`; g.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const y = J.hip[1] - (i - 1) * 46 * sc / 3, x = J.hip[0] - f * (70 + i * 18) * sc / 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x - f * (120 + i * 30) * sc / 3 * a, y); g.lineWidth = 4 * sc / 2; g.stroke(); } g.restore(); }
  // landing / skid dust
  if (R.landAge < 0.6 && R.landImpact > 4) dustPuff(g, J.hip[0], oy, R.landAge / 0.6, sc * 0.9, 4);
  if (R.skid && R.ground) dustPuff(g, ox - f * 30 * sc, oy, mod(A.t * 4, 1), sc * 0.6, 2);
}

// ---------------------------------------------------------------- page bootstrap
window.PLAY = (() => {
  let set, scene, camera, card, R, A, sun, hemi, keys = {}, prevJump = false, acc = 0, last = 0, t = 0, demo = null, camS = null;
  const inputNow = () => {
    if (demo) return demo(t);
    const j = !!(keys.KeyZ || keys.Space || keys.ArrowUp || keys.KeyW);
    const o = { left: !!(keys.ArrowLeft || keys.KeyA), right: !!(keys.ArrowRight || keys.KeyD), down: !!(keys.ArrowDown || keys.KeyS), jumpHeld: j, jumpPressed: j && !prevJump };
    prevJump = j; return o;
  };
  function init(opts = {}) {
    set = makeHarbor(); scene = set.scene;
    NOW = 0.3; set(0.3); set.J.hide(); set.S.hide(); set.coins.forEach(c => (c.visible = false));
    camera = newCam(); camera.fov = 42; camera.near = 0.05;
    scene.traverse(o => { if (o.isDirectionalLight) sun = o; if (o.isHemisphereLight) hemi = o; });
    // high-DPI ink card: 1600x2000 px for a 2.4 m x 3 m plane (~667 px per metre)
    card = new Card(scene, { w: 1600, h: 2000, ax: 800, ay: 1800, pxm: 667, face: 'cam', blob: 0.9 });
    card.tex.generateMipmaps = true; card.tex.minFilter = T3.LinearMipmapLinearFilter;
    const exclude = new Set([card.mesh, card.shadowM]);
    collectSolids(scene, exclude);
    const g0 = probe(-12, 5, PH.lane);
    R = makeRunner(-12, g0 ? g0.y : 0); A = makeAnim();
    demo = opts.demo || null;
    camS = { x: R.x + 1.5, y: R.y + 1.7, vx: 0, vy: 0 };
    if (opts.size) { R3.setSize(opts.size[0], opts.size[1], false); camera.aspect = opts.size[0] / opts.size[1]; camera.updateProjectionMatrix(); }
    return { R, A };
  }
  function physicsStep() {
    const inp = inputNow(); stepRunner(R, inp); stepAnim(A, R, inp); t += PH.dt;
    // camera: critically damped follow, stepped with the physics so it never lags on slow devices
    const tx = R.x + clamp(R.vx * 0.22, -2.2, 2.2), ty = R.y + 1.45, w = 5, dt = PH.dt;
    camS.vx += (w * w * (tx - camS.x) - 2 * w * camS.vx) * dt; camS.x += camS.vx * dt;
    camS.vy += (w * w * (ty - camS.y) - 2 * w * camS.vy) * dt; camS.y += camS.vy * dt;
  }
  function render(alpha = 1) {
    NOW = 0.3 + t;
    const x = lerp(R.prev.x, R.x, alpha), y = lerp(R.prev.y, R.y, alpha);
    camera.position.set(camS.x, camS.y + 0.15, PH.lane + 5.0); camera.lookAt(camS.x, camS.y - 0.25, PH.lane); camera.updateMatrixWorld();
    // match the scene light: key-light direction projected into screen space, tint from sun + sky colour
    const sd = sun.position.clone().sub(sun.target.position).normalize();
    const right = new T3.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), up = new T3.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const tint = sun.color.clone().multiplyScalar(0.55).add(hemi.color.clone().multiplyScalar(0.45));
    CHAR_LIGHT = { ...LIGHTS.golden, x: sd.dot(right), y: -sd.dot(up), tint: '#' + tint.getHexString() };
    card.mat.color.set(CHAR_LIGHT.tint);
    drawRunner(card.g, card, R, A, card.pxm * PH.H / 300, CHAR_LIGHT);
    card.tex.needsUpdate = true;
    card.at(x, y, PH.lane, camera);
    R3.render(scene, camera);
  }
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000 || 0); last = now; acc += dt;
    let n = 0; while (acc >= PH.dt && n < 6) { physicsStep(); acc -= PH.dt; n++; }
    render(acc / PH.dt);
    requestAnimationFrame(loop);
  }
  function start() {
    document.body.appendChild(R3.domElement);
    const fit = () => { R3.setPixelRatio(Math.min(2, devicePixelRatio || 1)); R3.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
    addEventListener('resize', fit); fit();
    addEventListener('keydown', e => { keys[e.code] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); });
    addEventListener('keyup', e => { keys[e.code] = false; });
    requestAnimationFrame(loop);
  }
  // deterministic stepping for recording: n physics steps then one render
  function advance(n) { for (let i = 0; i < n; i++) physicsStep(); render(1); }
  return { init, start, advance, get R() { return R; }, get A() { return A; }, get _keys() { return keys; }, setKeys: k => { Object.assign(keys, k); } };
})();
