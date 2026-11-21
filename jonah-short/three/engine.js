// 3D engine: three.js sets + 2D character cards. Units are metres, y is up, the ground is y = 0.
const T3 = THREE;
const R3 = new T3.WebGLRenderer({ canvas: document.createElement('canvas'), antialias: true, preserveDrawingBuffer: true });
R3.setPixelRatio(1);
R3.setSize(W, H, false);
R3.shadowMap.enabled = true;
R3.shadowMap.type = T3.PCFSoftShadowMap;
R3.outputColorSpace = T3.SRGBColorSpace;
R3.toneMapping = T3.NoToneMapping;

const INK = '#3d2d24';
const col = c => new T3.Color(c);

// ------------------------------------------------------------------ textures
function canvasTex(w, h, draw, repeat) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new T3.CanvasTexture(cv); t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = T3.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const TEX = {};
function noiseFill(g, w, h, base, n, a, seed) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const r = rng(seed);
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(255,255,255,${a * r()})` : `rgba(60,35,15,${a * r()})`; const s = 2 + r() * 10; g.fillRect(r() * w, r() * h, s, s * (0.4 + r())); }
}
function texTiles(base, line, rep) {
  return canvasTex(512, 512, (g, w, h) => {
    noiseFill(g, w, h, base, 900, 0.10, 3);
    g.strokeStyle = line; g.lineWidth = 5;
    for (let r = 0; r < 4; r++) { g.beginPath(); g.moveTo(0, r * 128); g.lineTo(w, r * 128); g.stroke();
      for (let c = 0; c < 4; c++) { const x = c * 128 + (r % 2) * 64; g.beginPath(); g.moveTo(x, r * 128); g.lineTo(x, r * 128 + 128); g.stroke(); } }
  }, rep);
}
function texPlanks(base, line, rep) {
  return canvasTex(512, 512, (g, w, h) => {
    noiseFill(g, w, h, base, 600, 0.08, 5);
    const r = rng(9);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = `rgba(${r() < 0.5 ? '255,230,200' : '60,30,10'},${0.06 + r() * 0.08})`; g.fillRect(0, i * 64, w, 64);
      g.strokeStyle = line; g.lineWidth = 4; g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke();
      const x = r() * w; g.beginPath(); g.moveTo(x, i * 64); g.lineTo(x, i * 64 + 64); g.stroke();
      for (let k = 0; k < 3; k++) { g.strokeStyle = 'rgba(60,30,10,0.18)'; g.lineWidth = 2; g.beginPath(); const y = i * 64 + 10 + r() * 44; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 3); g.stroke(); }
    }
  }, rep);
}
function texBricks(base, line, rep) {
  return canvasTex(512, 512, (g, w, h) => {
    noiseFill(g, w, h, base, 700, 0.10, 7);
    g.strokeStyle = line; g.lineWidth = 3;
    for (let r = 0; r < 16; r++) { g.beginPath(); g.moveTo(0, r * 32); g.lineTo(w, r * 32); g.stroke();
      for (let c = 0; c < 8; c++) { const x = c * 64 + (r % 2) * 32; g.beginPath(); g.moveTo(x, r * 32); g.lineTo(x, r * 32 + 32); g.stroke(); } }
  }, rep);
}
function texSpeckle(base, rep, n = 2500, a = 0.12, seed = 11) { return canvasTex(512, 512, (g, w, h) => noiseFill(g, w, h, base, n, a, seed), rep); }
function texStripes(c1, c2, n) { return canvasTex(512, 64, (g, w, h) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? c2 : c1; g.fillRect(i * w / n, 0, w / n + 1, h); } }); }
function texRadial(inner, outer) { return canvasTex(256, 256, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, w, w); }); }
function texVGrad(stops, w = 64, h = 512) { return canvasTex(w, h, (g) => { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); }
function texSign(text, bg, fg, w = 1024, h = 256, arrow = 0) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    noiseFill(g, w, h, 'rgba(0,0,0,0)', 300, 0.12, 4);
    g.strokeStyle = 'rgba(60,30,10,0.5)'; g.lineWidth = 3; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); }
    g.font = `900 ${Math.round(h * 0.5)}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = 'rgba(60,30,10,0.6)'; g.strokeText(text, w / 2 + arrow * w * 0.06, h / 2 + 4);
    g.fillStyle = fg; g.fillText(text, w / 2 + arrow * w * 0.06, h / 2 + 4);
  });
}

// ------------------------------------------------------------------ materials and props
const MATS = {};
function mat(c, o = {}) {
  const key = c + JSON.stringify(o, (k, v) => (v && v.isTexture ? v.uuid : v));
  if (MATS[key]) return MATS[key];
  const m = o.basic ? new T3.MeshBasicMaterial({ color: col(c), ...o.args }) : new T3.MeshLambertMaterial({ color: col(c), ...(o.args || {}) });
  if (o.map) m.map = o.map;
  if (o.emissive) { m.emissive = col(o.emissive); m.emissiveIntensity = o.ei ?? 1; }
  if (o.side) m.side = o.side;
  return (MATS[key] = m);
}
const OUTLINE_MAT = new T3.MeshBasicMaterial({ color: col(INK), side: T3.BackSide });
// Ink outline: an enlarged back-face hull (works for convex primitives).
function outline(mesh, w = 0.03) {
  mesh.geometry.computeBoundingBox();
  const b = mesh.geometry.boundingBox, s = new T3.Vector3(); b.getSize(s);
  const o = new T3.Mesh(mesh.geometry, OUTLINE_MAT);
  o.scale.set(1 + 2 * w / Math.max(s.x, 1e-3), 1 + 2 * w / Math.max(s.y, 1e-3), 1 + 2 * w / Math.max(s.z, 1e-3));
  const c = new T3.Vector3(); b.getCenter(c);   // keep the hull centred on geometry that is offset from its origin
  o.position.set(-c.x * (o.scale.x - 1), -c.y * (o.scale.y - 1), -c.z * (o.scale.z - 1));
  o.castShadow = false; o.receiveShadow = false;
  mesh.add(o); return mesh;
}
function place(m, p, r) { if (p) m.position.set(p[0], p[1], p[2]); if (r) m.rotation.set(r[0] || 0, r[1] || 0, r[2] || 0); m.castShadow = true; m.receiveShadow = true; return m; }
function box(parent, w, h, d, c, p, o = {}) {
  const m = place(new T3.Mesh(new T3.BoxGeometry(w, h, d), o.m || mat(c, o)), p, o.r);
  if (o.ol !== false) outline(m, o.ol ?? 0.025);
  if (o.shadow === false) m.castShadow = false;
  parent.add(m); return m;
}
function cyl(parent, r1, r2, h, c, p, o = {}) {
  const m = place(new T3.Mesh(new T3.CylinderGeometry(r1, r2, h, o.seg || 20, 1, !!o.open), o.m || mat(c, o)), p, o.r);
  if (o.ol !== false) outline(m, o.ol ?? 0.02);
  parent.add(m); return m;
}
function sph(parent, r, c, p, o = {}) {
  const m = place(new T3.Mesh(new T3.SphereGeometry(r, o.seg || 20, o.seg2 || 14), o.m || mat(c, o)), p, o.r);
  if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]);
  if (o.ol) outline(m, o.ol);
  parent.add(m); return m;
}
function ground(parent, w, d, c, o = {}) {
  const m = new T3.Mesh(new T3.PlaneGeometry(w, d), o.m || mat(c, o));
  m.rotation.x = -PI / 2; m.position.set(o.x || 0, o.y || 0, o.z || 0); m.receiveShadow = true;
  parent.add(m); return m;
}
function extrude(parent, shapePts, depth, c, p, o = {}) {
  const sh = new T3.Shape(); shapePts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
  const geo = new T3.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 16 });
  geo.translate(0, 0, -depth / 2);
  const m = place(new T3.Mesh(geo, o.m || mat(c, o)), p, o.r);
  if (o.ol !== false) outline(m, o.ol ?? 0.03);
  parent.add(m); return m;
}
function arch(parent, w, h, depth, c, p, o = {}) {
  const sh = new T3.Shape(); const r = w / 2;
  sh.moveTo(-r, 0); sh.lineTo(-r, h - r); sh.absarc(0, h - r, r, PI, 0, true); sh.lineTo(r, 0); sh.lineTo(-r, 0);
  const geo = new T3.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 24 }); geo.translate(0, 0, -depth / 2);
  const m = place(new T3.Mesh(geo, o.m || mat(c, o)), p, o.r); parent.add(m); return m;
}

// ------------------------------------------------------------------ sky, sun, clouds, light shafts, water
function skyTex(stops) { return texVGrad(stops, 16, 512); }
function setSky(scene, stops) { scene.background = skyTex(stops); }
function sunSprite(parent, p, size, inner = 'rgba(255,250,230,1)', outer = 'rgba(255,200,120,0)') {
  const s = new T3.Sprite(new T3.SpriteMaterial({ map: texRadial(inner, outer), blending: T3.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
  s.position.set(p[0], p[1], p[2]); s.scale.set(size, size, 1); parent.add(s); return s;
}
function cloud3(parent, p, s, c = '#ffffff', seed = 1) {
  const g = new T3.Group(); const r = rng(seed);
  const m = new T3.MeshLambertMaterial({ color: col(c), emissive: col(c), emissiveIntensity: 0.35, fog: false });
  [[-1.6, 0, 0, 1.1], [-0.5, 0.5, 0.2, 1.5], [0.8, 0.3, -0.1, 1.3], [1.8, -0.1, 0.1, 0.9], [0.2, -0.3, 0.5, 1.2]].forEach(([x, y, z, rr]) => {
    const k = new T3.Mesh(new T3.SphereGeometry(rr * (0.9 + r() * 0.2), 18, 12), m); k.position.set(x, y, z); k.scale.y = 0.85; g.add(k);
  });
  g.position.set(p[0], p[1], p[2]); g.scale.setScalar(s); parent.add(g); return g;
}
const SHAFT_TEX = texVGrad([[0, 'rgba(255,255,255,0)'], [0.15, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']], 8, 256);
function shaft(parent, p, h, r1, r2, c, op, rot) {
  const m = new T3.Mesh(new T3.CylinderGeometry(r1, r2, h, 24, 1, true),
    new T3.MeshBasicMaterial({ color: col(c), map: SHAFT_TEX, transparent: true, opacity: op, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false }));
  m.position.set(p[0], p[1], p[2]); if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0); parent.add(m); return m;
}
function water(parent, w, d, c, o = {}) {
  const geo = new T3.PlaneGeometry(w, d, o.seg || 80, o.seg || 80); geo.rotateX(-PI / 2);
  const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ color: col(c), emissive: col(o.em || c), emissiveIntensity: o.ei ?? 0.25, transparent: !!o.op, opacity: o.op || 1, side: o.side || T3.FrontSide }));
  m.position.set(o.x || 0, o.y || 0, o.z || 0); m.receiveShadow = true; parent.add(m);
  const base = geo.attributes.position.array.slice();
  m.userData.update = (t, amp = o.amp ?? 0.12, len = o.len ?? 3, sp = o.sp ?? 1) => {
    const a = geo.attributes.position.array;
    for (let i = 0; i < a.length; i += 3) { const x = base[i], z = base[i + 2]; a[i + 1] = Math.sin(x / len + t * sp) * amp + Math.sin((z + x * 0.5) / (len * 0.6) - t * sp * 1.3) * amp * 0.6; }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
  };
  m.userData.update(0); return m;
}
function lights(scene, o) {
  const hemi = new T3.HemisphereLight(col(o.sky || '#dfefff'), col(o.ground || '#8a6a48'), o.hemi ?? 1.4); scene.add(hemi);
  const sun = new T3.DirectionalLight(col(o.sun || '#fff1d6'), o.sunI ?? 2.0);
  sun.position.set(...(o.dir || [-10, 14, 8])); sun.target.position.set(...(o.target || [0, 0, 0]));
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  const e = o.extent || 20; Object.assign(sun.shadow.camera, { left: -e, right: e, top: e, bottom: -e, near: 0.5, far: 200 });
  scene.add(sun); scene.add(sun.target);
  return { hemi, sun };
}

// ------------------------------------------------------------------ 2D character cards
const BLOB = texRadial('rgba(20,10,5,0.55)', 'rgba(20,10,5,0)');
class Card {
  // A flat 2D drawing standing in the 3D world. (ax, ay) is the canvas pixel placed at the card's origin (the feet).
  constructor(parent, o = {}) {
    Object.assign(this, { w: 1024, h: 1536, ax: 512, ay: 1460, pxm: 470, face: 'yaw', blob: 0.9 }, o);
    this.cv = document.createElement('canvas'); this.cv.width = this.w; this.cv.height = this.h;
    this.g = this.cv.getContext('2d');
    this.tex = new T3.CanvasTexture(this.cv); this.tex.colorSpace = T3.SRGBColorSpace; this.tex.anisotropy = 8;
    const geo = new T3.PlaneGeometry(this.w / this.pxm, this.h / this.pxm);
    geo.translate(-(this.ax - this.w / 2) / this.pxm, (this.ay - this.h / 2) / this.pxm, 0);
    this.mat = new T3.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.03, side: T3.DoubleSide, fog: false });
    this.mesh = new T3.Mesh(geo, this.mat);
    this.mesh.castShadow = this.castShadow ?? true;
    this.mesh.customDepthMaterial = new T3.MeshDepthMaterial({ depthPacking: T3.RGBADepthPacking, map: this.tex, alphaTest: 0.5 });
    this.group = new T3.Group(); this.group.add(this.mesh);
    if (this.blob) {
      this.shadowM = new T3.Mesh(new T3.PlaneGeometry(1, 1), new T3.MeshBasicMaterial({ map: BLOB, transparent: true, depthWrite: false, fog: false }));
      this.shadowM.rotation.x = -PI / 2; this.shadowM.position.y = 0.012; this.shadowM.scale.set(this.blob, this.blob * 0.4, 1);
      this.group.add(this.shadowM);
    }
    parent.add(this.group);
  }
  draw(fn) { this.g.clearRect(0, 0, this.w, this.h); fn(this.g, this); this.tex.needsUpdate = true; return this; }
  // a standing character from the 2D rig; s = relative size (1 = adult)
  person(opts, s = 1, extra) {
    this.mat.color.set(CHAR_LIGHT.tint);   // characters take the scene light colour (measured tints)
    return this.draw(g => { person(g, { ...opts, x: this.ax, y: this.ay, s: (this.base || 1.9) * s * (opts.s || 1) }); if (extra) extra(g, this); });
  }
  at(x, y, z, cam, k = 1) {
    this.group.position.set(x, y, z); this.group.scale.setScalar(k); this.group.visible = true;
    if (this.face === 'yaw') { this.mesh.rotation.set(0, Math.atan2(cam.position.x - x, cam.position.z - z), 0); }
    else if (this.face === 'cam') { this.mesh.quaternion.copy(cam.quaternion); if (this.roll) this.mesh.rotateZ(this.roll); }
    return this;
  }
  hide() { this.group.visible = false; return this; }
  tint(c) { this.mat.color.set(c); return this; }
}

// ------------------------------------------------------------------ 3D camera rig with cuts, constant dolly push and drift
const PUSH3 = 0.06;     // dolly in so the subject grows ~5 %/s (Rick's Clips median push)
const DRIFT3 = 0.16;    // sideways truck, m/s
function cam3(camera, t, keys, o = {}) {
  const segs = [[]];
  keys.forEach(k => { if (k[2] && segs[segs.length - 1].length) segs.push([]); segs[segs.length - 1].push(k); });
  const ref = CUT_T != null ? (CAM_SIDE === 'before' ? CUT_T - 1e-4 : CUT_T + 1e-4) : t;
  let si = 0; for (let i = 1; i < segs.length; i++) if (ref >= segs[i][0][0]) si = i;
  const ks = segs[si];
  const val = k => [...k[1].p, ...k[1].l, k[1].fov ?? 50];
  let v = val(ks[ks.length - 1]);
  if (t <= ks[0][0]) v = val(ks[0]);
  else for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) { const a = val(ks[i - 1]), b = val(ks[i]), e = ease((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])); v = a.map((x, j) => lerp(x, b[j], e)); break; }
  const s0 = si === 0 ? Math.min(0, ks[0][0]) : ks[0][0], dt = Math.max(0, t - s0);
  const p = new T3.Vector3(v[0], v[1], v[2]), l = new T3.Vector3(v[3], v[4], v[5]);
  const dir = l.clone().sub(p);
  if (!o.noPush) p.addScaledVector(dir, (1 - Math.pow(1 + PUSH3, -dt)));
  const right = new T3.Vector3().crossVectors(dir, new T3.Vector3(0, 1, 0)).normalize();
  const dr = ((SHOT_N + si) % 2 ? 1 : -1) * (o.drift ?? DRIFT3) * dt;
  p.addScaledVector(right, dr); l.addScaledVector(right, dr * 0.6);
  if (o.shake) { p.x += o.shake[0]; p.y += o.shake[1]; }
  camera.position.copy(p); camera.fov = v[6]; camera.updateProjectionMatrix(); camera.lookAt(l);
  camera.updateMatrixWorld();
  return camera;
}
function newCam() { return new T3.PerspectiveCamera(50, W / H, 0.05, 600); }
function toScreen(v, camera) { const p = new T3.Vector3(...v).project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; }

// ------------------------------------------------------------------ procedural town (instanced, outlined)
// Fills a rectangle with varied mud-brick buildings: flat roofs with parapets, some domes and towers, doors,
// windows (lit warm when o.lit), rooftop jars and awnings. Instanced so dozens of buildings stay cheap.
function town(parent, o) {
  const r = rng(o.seed || 1), n = o.n || 40;
  const [x0, x1] = o.x, [z0, z1] = o.z;
  const pal = o.pal || ['#ecd3a5', '#e3c28d', '#d6ad75', '#f0dcb4', '#dcb27c', '#e8c99a'];
  const faceTo = o.face || 1;                         // which way fronts point along z (+1 toward +z)
  const items = { box: [], dome: [], door: [], win: [], jar: [], awn: [], tower: [] };
  const placed = [];
  for (let k = 0; k < n * 4 && placed.length < n; k++) {
    const w = (o.w || [2.4, 4.2])[0] + r() * ((o.w || [2.4, 4.2])[1] - (o.w || [2.4, 4.2])[0]);
    const d = 2.2 + r() * 2.2, h = (o.h || [2.2, 6])[0] + r() * ((o.h || [2.2, 6])[1] - (o.h || [2.2, 6])[0]);
    const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0);
    if (o.avoid && o.avoid(x, z)) continue;
    if (placed.some(p => Math.abs(p.x - x) < (p.w + w) / 2 + 0.25 && Math.abs(p.z - z) < (p.d + d) / 2 + 0.25)) continue;
    const c = pal[Math.floor(r() * pal.length)];
    placed.push({ x, z, w, d, h });
    items.box.push([x, h / 2, z, w, h, d, c]);
    items.box.push([x, h + 0.14, z, w + 0.12, 0.28, d + 0.12, c]);                         // parapet cap
    const fz = z + faceTo * (d / 2 + 0.02);
    items.door.push([x + (r() - 0.5) * w * 0.4, 0.8, fz, 0.75, 1.6]);
    const rows = Math.max(1, Math.floor((h - 1.4) / 1.5));
    for (let ro = 0; ro < rows; ro++) for (let cI = 0; cI < Math.max(1, Math.floor(w / 1.6)); cI++)
      if (r() < 0.75) items.win.push([x - w / 2 + 0.8 + cI * 1.6 + (r() - 0.5) * 0.2, 2.2 + ro * 1.5, fz + faceTo * 0.01, 0.45, 0.55]);
    if (r() < 0.22) items.dome.push([x, h + 0.28, z, Math.min(w, d) * 0.38, o.domeCol || (r() < 0.5 ? '#f3ead8' : '#5f9fc0')]);
    else if (r() < 0.3) items.tower.push([x + (r() - 0.5) * w * 0.4, h + 1.0, z + (r() - 0.5) * d * 0.4, 1.0, 2.0, 1.0, c]);
    if (r() < 0.35) for (let j = 0; j < 1 + Math.floor(r() * 3); j++) items.jar.push([x + (r() - 0.5) * w * 0.7, h + 0.55, z + (r() - 0.5) * d * 0.7]);
    if (r() < 0.25) items.awn.push([x, 2.1, fz + faceTo * 0.45, Math.min(w * 0.7, 2.4), ['#c94b3a', '#3f8a9a', '#e1a23c', '#7a5aa8'][Math.floor(r() * 4)]]);
  }
  const dm = new T3.Object3D(), tex = texSpeckle('#ffffff', [1, 1], 900, 0.14, o.seed || 3);
  const inst = (geo, list, setFn, matOpts = {}, outlineW = 0.04, shadow = true) => {
    if (!list.length) return null;
    const m = new T3.InstancedMesh(geo, new T3.MeshLambertMaterial({ map: matOpts.map, ...(matOpts.basic ? {} : {}) }), list.length);
    if (matOpts.basic) m.material = new T3.MeshBasicMaterial({ color: col(matOpts.basic), fog: true });
    const ol = outlineW ? new T3.InstancedMesh(geo, OUTLINE_MAT, list.length) : null;
    list.forEach((it, i) => {
      const [sx, sy, sz, c] = setFn(it, dm); dm.updateMatrix(); m.setMatrixAt(i, dm.matrix);
      if (c) m.setColorAt(i, col(c));
      if (ol) { dm.scale.set(sx + 2 * outlineW, sy + 2 * outlineW, sz + 2 * outlineW); dm.updateMatrix(); ol.setMatrixAt(i, dm.matrix); }
    });
    m.castShadow = shadow; m.receiveShadow = true; parent.add(m); if (ol) parent.add(ol); return m;
  };
  const B = new T3.BoxGeometry(1, 1, 1), S = new T3.SphereGeometry(1, 16, 10, 0, TAU, 0, PI / 2), P = new T3.PlaneGeometry(1, 1);
  if (faceTo < 0) P.rotateY(PI);
  inst(B, items.box, (b, d) => { d.position.set(b[0], b[1], b[2]); d.rotation.set(0, 0, 0); d.scale.set(b[3], b[4], b[5]); return [b[3], b[4], b[5], b[6]]; }, { map: tex }, 0.05);
  inst(B, items.tower, (b, d) => { d.position.set(b[0], b[1], b[2]); d.rotation.set(0, 0, 0); d.scale.set(b[3], b[4], b[5]); return [b[3], b[4], b[5], b[6]]; }, { map: tex }, 0.05);
  inst(S, items.dome, (b, d) => { d.position.set(b[0], b[1], b[2]); d.rotation.set(0, 0, 0); d.scale.set(b[3], b[3] * 0.9, b[3]); return [b[3], b[3] * 0.9, b[3], b[4]]; }, {}, 0.05);
  inst(P, items.door, (b, d) => { d.position.set(b[0], b[1], b[2]); d.rotation.set(0, 0, 0); d.scale.set(b[3], b[4], 1); return [b[3], b[4], 1]; }, { basic: '#4a2f1e' }, 0, false);
  inst(P, items.win, (b, d) => { d.position.set(b[0], b[1], b[2]); d.rotation.set(0, 0, 0); d.scale.set(b[3], b[4], 1); return [b[3], b[4], 1]; }, { basic: o.lit ? '#ffcf6a' : '#4a2f1e' }, 0, false);
  inst(new T3.CylinderGeometry(0.16, 0.12, 0.5, 10), items.jar, (b, d) => { d.position.set(b[0], b[1], b[2]); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1); return [0.32, 0.5, 0.32, '#b8673a']; }, {}, 0.025);
  inst(B, items.awn, (b, d) => { d.position.set(b[0], b[1], b[2]); d.rotation.set(faceTo * 0.35, 0, 0); d.scale.set(b[3], 0.06, 0.95); return [b[3], 0.06, 0.95, b[4]]; }, {}, 0.025);
  return placed;
}
