// The 11 shots as 3D sets with 2D character cards. Each set is built once; frame(t) poses it and returns
// { scene, camera, post } where post(g) draws 2D overlays (rain, flashes) on the composited frame.
const CREW = (parent, n) => new Card(parent, { w: 640, h: 960, ax: 320, ay: 900, pxm: 294, base: 0.96, blob: 0.85 });   // rig v3: 507 units tall -> 1.65 m
const LEAD = parent => new Card(parent, { base: 1.53, blob: 0.95 });

function flag3(parent, p, c, len = 1.4, hgt = 0.8, pole = 3.2) {
  const g = new T3.Group();
  cyl(g, 0.05, 0.06, pole, '#7a4f2c', [0, pole / 2, 0]);
  const geo = new T3.PlaneGeometry(len, hgt, 14, 2); geo.translate(len / 2, 0, 0);
  const m = new T3.Mesh(geo, mat(c, { side: T3.DoubleSide })); m.position.y = pole - hgt / 2; m.castShadow = true; g.add(m);
  const base = geo.attributes.position.array.slice(), ph = p[0] * 0.7;
  g.userData.update = t => { const a = geo.attributes.position.array; for (let i = 0; i < a.length; i += 3) { const x = base[i]; a[i + 2] = Math.sin(t * 6.5 - x * 3.2 + ph) * 0.22 * x / len; a[i + 1] = base[i + 1] - 0.12 * (x / len) ** 2; } geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); };
  g.position.set(p[0], p[1], p[2]); parent.add(g); return g;
}
function palm(parent, p, h = 5, lean = 0.15) {
  const g = new T3.Group();
  const tr = cyl(g, 0.12, 0.2, h, '#8a6440', [0, h / 2, 0], { map: texSpeckle('#8a6440', [1, 4]), ol: 0.02 });
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * TAU, leaf = new T3.Mesh(new T3.SphereGeometry(1, 12, 8), mat('#4f9a45'));
    leaf.scale.set(1.5, 0.12, 0.38); leaf.position.set(Math.cos(a) * 1.1, h - 0.15, Math.sin(a) * 1.1);
    leaf.rotation.set(0, -a, -0.45); leaf.castShadow = true; outline(leaf, 0.02); g.add(leaf);
  }
  g.rotation.z = lean; g.position.set(p[0], p[1], p[2]); parent.add(g); return g;
}
function house(parent, x, z, w, h, d, c, seed) {
  const r = rng(seed);
  box(parent, w, h, d, c, [x, h / 2, z], { map: texSpeckle(c, [w / 3, h / 3], 1500, 0.1, seed), ol: 0.035 });
  box(parent, w + 0.1, 0.25, d + 0.1, c, [x, h + 0.12, z], { ol: 0.03 });
  box(parent, 0.8, 1.6, 0.1, '#5a3a24', [x + (r() - 0.5) * w * 0.4, 0.8, z + d / 2 + 0.03], { ol: 0.02 });
  for (let i = 0; i < 2; i++) if (h > 2.6) box(parent, 0.5, 0.5, 0.1, '#5a3a24', [x - w / 4 + i * w / 2, h - 1, z + d / 2 + 0.03], { ol: 0.02 });
}
function barrel(parent, p) {
  const g = new T3.Group();
  cyl(g, 0.42, 0.42, 1.1, '#8d5a33', [0, 0.55, 0], { map: texPlanks('#8d5a33', 'rgba(40,20,10,0.6)', [2, 1]), ol: 0.025 });
  [0.2, 0.9].forEach(y => cyl(g, 0.44, 0.44, 0.08, '#5b5f66', [0, y, 0], { ol: false }));
  g.position.set(p[0], p[1], p[2]); parent.add(g); return g;
}
const dark = (g, a, c = '8,5,3') => { if (a > 0) { g.fillStyle = `rgba(${c},${a})`; g.fillRect(0, 0, W, H); } };

// ================================================================== inside the great fish (shots 1 and 6)
function makeFish() {
  const sc = new T3.Scene(); sc.background = col('#0c0910'); sc.fog = new T3.FogExp2('#150d19', 0.055);
  sc.add(new T3.HemisphereLight(col('#7a5a8e'), col('#1a3a40'), 0.9));
  const spot = new T3.SpotLight(col('#8ff5e0'), 90, 30, 0.42, 0.7, 1.2); spot.position.set(1.4, 8, 1.0); spot.target.position.set(0, 0, 0);
  spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); sc.add(spot); sc.add(spot.target);
  const flesh = new T3.Mesh(new T3.CylinderGeometry(4.2, 4.2, 40, 40, 1, true), mat('#4a2233', { map: texSpeckle('#4a2233', [6, 8], 3000, 0.2, 21), side: T3.BackSide }));
  flesh.rotation.x = PI / 2; flesh.scale.set(1, 1, 1.25); flesh.position.set(0, 0.6, -10); sc.add(flesh);
  const bone = mat('#e6d6b8', { map: texSpeckle('#e6d6b8', [4, 1], 800, 0.12, 2), emissive: '#3a2a30', ei: 1 });
  for (let i = 0; i < 11; i++) {
    const m = new T3.Mesh(new T3.TorusGeometry(3.25, 0.24, 10, 40, PI), bone);
    m.scale.set(1, 1.28, 1); m.position.set(0, 0, 3 - i * 2.2); m.castShadow = m.receiveShadow = true; outline(m, 0.035); sc.add(m);
  }
  water(sc, 9, 40, '#1c4a54', { y: 0.03, z: -10, amp: 0.02, len: 0.9, sp: 1.6, ei: 0.45 });
  const tally = [];
  for (let i = 0; i < 3; i++) { const m = box(sc, 0.05, 0.42, 0.05, '#f6ecd6', [-2.55 + i * 0.13, 2.1 - i * 0.05, 1.05], { r: [0, 0, 0.35], ol: 0.015 }); m.visible = false; tally.push(m); }
  shaft(sc, [0.5, 3.6, 0.3], 8, 0.25, 1.4, '#8ff5e0', 0.32, [0, 0, 0.1]);
  const drops = [0, 1, 2, 3].map(i => sph(sc, 0.05, '#a8f5ea', [0, 0, 0], { emissive: '#7fe8dc', ei: 0.8, s: [1, 1.5, 1] }));
  drops.forEach(d => (d.castShadow = false));
  const J = LEAD(sc), cam = newCam();
  const tick = t => { drops.forEach((d, i) => { const per = 1.3 + i * 0.37, ph = mod(t + i * 0.53, per) / per; d.position.set([-1.6, 1.3, 0.9, -0.6][i], lerp(4.2, 0.05, ph * ph), [-1, -3, 1.5, -5][i]); }); };
  return {
    shot1(t) {
      tick(t); tally.forEach(m => (m.visible = false));
      cam3(cam, t, [[0, { p: [0.14, 1.38, 1.25], l: [0, 1.36, 0] }], [0.7, { p: [0.14, 1.38, 1.25], l: [0, 1.36, 0] }], [3.9, { p: [0, 1.7, 6.6], l: [0, 1.25, -2] }]]);
      J.sketch({ ...jonahFrame(t, [[0, mixPose(POSES.idle, POSES.arms, 0.4)]], { dir: 1, life: 1.6 }), face: { eyes: 'wide', brows: 'worried', mouth: 'wobbly', sweat: true } }).at(0, 0, 0, cam);
      return { scene: sc, camera: cam };
    },
    pray(t, tDays, tNights, tPray) {
      tick(t); [tDays, tNights, tPray].forEach((tm, i) => (tally[i].visible = t >= tm));
      cam3(cam, t, [[0, { p: [0.35, 1.3, 5.6], l: [0, 1.0, 0] }], [3.0, { p: [0.1, 1.15, 3.7], l: [0, 0.9, 0] }]]);
      J.sketch({ ...jonahFrame(t, [[0, 'kneel'], [0.9, 'pray', 0.7]], { dir: 1, life: 0.7 }), face: { eyes: 'closed', brows: 'soft' } }).at(0, 0, 0, cam);
      return { scene: sc, camera: cam };
    },
  };
}

// ================================================================== Joppa harbour (shot 2)
function makeHarbor() {
  const sc = new T3.Scene(); setSky(sc, [[0, '#7fa8cf'], [0.42, '#f1c792'], [0.56, '#f6aa66'], [1, '#f6aa66']]);
  sc.fog = new T3.Fog(col('#f3c08c'), 45, 190);
  lights(sc, { sky: '#bcd6f0', ground: '#c89a62', hemi: 1.15, sun: '#ffcf9a', sunI: 2.7, dir: [-40, 13, 12], target: [2, 0, -2], extent: 26 });
  sunSprite(sc, [-150, 22, -80], 70, 'rgba(255,245,215,1)', 'rgba(255,190,120,0)');
  [[-30, 34, -110, 5], [25, 42, -130, 6], [80, 30, -110, 4.5]].forEach(([x, y, z, s], i) => cloud3(sc, [x, y, z], s, '#fde3c8', i + 1));
  ground(sc, 60, 70, '#e2bd86', { m: mat('#e2bd86', { map: texTiles('#e2bd86', 'rgba(120,80,40,0.35)', [18, 21]) }), x: -16, z: -20 });
  box(sc, 0.6, 1.4, 70, '#c9a46e', [14.2, -0.7, -20], { map: texBricks('#c9a46e', 'rgba(90,60,30,0.4)', [1, 20]) });
  const sea = water(sc, 260, 260, '#3f86aa', { x: 144, y: -0.8, z: -60, amp: 0.09, len: 2.4, ei: 0.35 });
  box(sc, 5, 0.22, 3.2, '#8a5a35', [16.6, -0.05, -1.5], { map: texPlanks('#8a5a35', 'rgba(40,20,10,0.6)', [2, 1]) });
  // ship
  const ship = new T3.Group(); ship.position.set(22.5, -0.8, -4.2); sc.add(ship);
  extrude(ship, [[-6, 2.8], [6.6, 2.8], [5.4, 0.2], [-4.6, 0], [-6.3, 1.5]], 4.2, '#8a5a35', [0, 0, 0], { map: texPlanks('#8a5a35', 'rgba(40,20,10,0.6)', [0.2, 0.3]) });
  box(ship, 11.6, 0.15, 3.9, '#a36c3c', [0.2, 2.8, 0], { map: texPlanks('#a36c3c', 'rgba(40,20,10,0.5)', [3, 1]) });
  cyl(ship, 0.17, 0.22, 11, '#6b4428', [0.5, 8.2, 0]);
  cyl(ship, 0.08, 0.08, 6.4, '#6b4428', [0.6, 11.4, 0.3], { r: [0, 0, PI / 2] });
  const sail = new T3.Mesh(new T3.CylinderGeometry(4.2, 4.2, 5.2, 24, 1, true, -0.65, 1.3), mat('#efe2c4', { map: canvasTex(256, 256, g => { g.fillStyle = '#efe2c4'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#c94b3a'; g.fillRect(0, 96, 256, 48); }), side: T3.DoubleSide }));
  sail.position.set(0.6, 8.7, -3.5); sail.castShadow = true; ship.add(sail);
  const shipFlag = flag3(ship, [0.5, 13.6, 0], '#c94b3a', 1.6, 0.8, 0.6);
  // gangplank
  box(sc, 5.8, 0.12, 0.95, '#a36c3c', [16.5, 0.95, -2.3], { r: [0, 0, 0.36], map: texPlanks('#a36c3c', 'rgba(40,20,10,0.6)', [3, 1]) });
  // town and hills inland (to the left)
  const r = rng(31);
  for (let i = 0; i < 16; i++) house(sc, -46 + i * 2.9 + r() * 0.6, -15 - r() * 16, 2.4 + r() * 1.6, 2.4 + r() * 3.6, 3, ['#ebc995', '#dcae78', '#f0d4a6', '#e3b984'][i % 4], 40 + i);
  [[-70, -140, 30], [-20, -150, 26], [30, -170, 34]].forEach(([x, z, s]) => sph(sc, s, '#d99a62', [x, -s * 0.72, z], { s: [1.6, 1, 1] }));
  town(sc, { seed: 101, n: 45, x: [-62, 8], z: [-36, -62], h: [2.6, 7.5] });
  const hillTown = new T3.Group(); hillTown.position.y = 2.5; sc.add(hillTown);
  town(hillTown, { seed: 102, n: 40, x: [-70, 20], z: [-70, -105], h: [3, 9] });
  palm(sc, [-30, 0, -34], 6.5, 0.1); palm(sc, [-3, 0, -38], 5.8, -0.12); palm(sc, [-45, 0, -40], 6, 0.15);
  palm(sc, [-12, 0, -6], 5.5, 0.12); palm(sc, [-21, 0, -9], 6, -0.1); palm(sc, [6, 0, -9], 5, 0.18);
  // signposts
  cyl(sc, 0.08, 0.1, 3.4, '#7a4f2c', [-8, 1.7, -1]);
  extrude(sc, [[-1.6, 0], [-1.2, 0.36], [1.2, 0.36], [1.2, -0.36], [-1.2, -0.36]], 0.1, '#a36c3c', [-8.05, 2.9, -0.95], { ol: 0.03 });
  const s1 = new T3.Mesh(new T3.PlaneGeometry(2.3, 0.6), new T3.MeshLambertMaterial({ map: texSign('NINEVEH', '#a36c3c', '#fff4dc', 1024, 256, -1), transparent: true })); s1.position.set(-8.15, 2.9, -0.89); sc.add(s1);
  cyl(sc, 0.06, 0.07, 2.2, '#7a4f2c', [12.4, 1.1, -0.4]);
  extrude(sc, [[1.2, 0], [0.9, 0.26], [-0.9, 0.26], [-0.9, -0.26], [0.9, -0.26]], 0.08, '#a36c3c', [12.5, 1.9, -0.35], { ol: 0.025 });
  const s2 = new T3.Mesh(new T3.PlaneGeometry(1.7, 0.42), new T3.MeshLambertMaterial({ map: texSign('TARSHISH', '#a36c3c', '#fff4dc', 1024, 256, 1), transparent: true })); s2.position.set(12.45, 1.9, -0.3); sc.add(s2);
  // crates and ropes on the quay
  [[3.5, -2.2], [4.3, -2.6], [3.9, -1.5]].forEach(([x, z], i) => box(sc, 0.8, 0.8, 0.8, '#b07a48', [x, 0.4 + (i === 2 ? 0.8 : 0), z], { map: texPlanks('#b07a48', 'rgba(40,20,10,0.6)', [1, 1]) }));
  const coins = [0, 1, 2].map(() => cyl(sc, 0.07, 0.07, 0.02, '#f2c13c', [0, 0, 0], { emissive: '#b8860b', ei: 0.4, ol: 0.008 }));
  const J = LEAD(sc), S = CREW(sc), cam = newCam();
  const fn = function (t) {
    const tJ = wt(2, 'Jonah', 2), tTicket = wt(2, 'ticket'), tOpp = wt(2, 'opposite'), tc = tJ - 0.1;
    sea.userData.update(NOW); shipFlag.userData.update(NOW);
    cam3(cam, t, [[0, { p: [-8.3, 1.8, 6.8], l: [-8.2, 2.3, -1] }], [0.6, { p: [-8.3, 1.8, 6.8], l: [-8.2, 2.3, -1] }], [tc, { p: [-6, 1.75, 6.8], l: [-5.6, 1.9, -1] }],
      [tc, { p: [0.75, 1.45, 5.6], l: [0.75, 1.15, 0] }, 'cut'], [tOpp, { p: [0.95, 1.45, 5.6], l: [0.95, 1.15, 0] }], [6.0, { p: [10, 2.3, 7.4], l: [15.5, 1.4, -1.8] }]]);
    const turned = t >= tJ - 0.1;
    // skid-turn away from the NINEVEH sign (measured skid: lean back, arms flung out, dust), then pay
    const vel2 = tt => [tt > tc - 0.25 && tt < tc + 0.05 ? -2.5 : tt >= tc + 0.05 && tt < tc + 0.35 ? 1.5 : 0, 0];
    const fJ = jonahFrame(t, [[0, 'idle'], [tc + 0.02, 'skid', 0.22], [tc + 0.5, 'idle', 0.45], [tTicket, 'pay', 0.4]], { dir: turned ? 1 : -1, vel: vel2 });
    J.sketch({ ...fJ, face: { brows: turned ? 'raised' : 'worried', mouth: turned ? 'smile' : 'frown' } },
      (g, c) => dustPuff(g, c.ax, c.ay, seg(t, tc, tc + 0.55), 1.4)).at(0, 0, 0, cam);
    S.person({ ...SAILORS[1], dir: -1, eyes: 'dot', mouth: 'smile', arms: t > tTicket - 0.2 ? { l: [62, 70], r: [14, 4] } : DOWN }).at(1.55, 0, -0.1, cam);
    const k = seg(t, tTicket - 0.05, tTicket + 0.45);
    coins.forEach((c, i) => {
      const kk = clamp(k * 1.4 - i * 0.2);
      c.visible = k > 0;
      c.position.set(lerp(0.66, 0.95, kk), lerp(0.95, 0.83, kk) + Math.sin(kk * PI) * 0.5, 0.08 + i * 0.03);
      c.rotation.set(t * 12 + i, 0, t * 9);
    });
    return { scene: sc, camera: cam };
  };
  fn.scene = sc; fn.J = J; fn.S = S; fn.coins = coins; return fn;
}

// ================================================================== the ship in the storm (shots 3, 4) and below deck
function makeShip() {
  const sc = new T3.Scene(); setSky(sc, [[0, '#101826'], [0.5, '#2a3b52'], [1, '#2a3b52']]);
  sc.fog = new T3.Fog(col('#26364a'), 18, 110);
  const L = lights(sc, { sky: '#7088aa', ground: '#3a2a20', hemi: 1.0, sun: '#aac4ff', sunI: 1.3, dir: [10, 16, 12], target: [5, 0, 0], extent: 18 });
  for (let i = 0; i < 7; i++) cloud3(sc, [-30 + i * 14, 16 + (i % 2) * 4, -45 - (i % 3) * 8], 3.2, '#46546b', 10 + i);
  // bright accents measured as missing (night p95 146-213): moon glow behind the clouds and deck lanterns
  sunSprite(sc, [-18, 22, -60], 40, 'rgba(225,235,255,0.95)', 'rgba(150,170,220,0)');
  [[-2, 2.2, -3.2], [9.5, 2.2, -3.2]].forEach(p => { box(sc, 0.25, 0.35, 0.25, '#ffcf73', p, { emissive: '#ffb040', ei: 1.3 }); sunSprite(sc, p, 2.4, 'rgba(255,210,140,0.95)', 'rgba(255,150,60,0)'); });
  const sea = water(sc, 320, 320, '#1d3850', { y: -1.6, amp: 0.55, len: 4.2, sp: 1.7, ei: 0.12 });
  const ship = new T3.Group(); sc.add(ship);
  box(ship, 28, 0.3, 7.4, '#9a6a40', [5, -0.15, 0], { map: texPlanks('#9a6a40', 'rgba(40,20,10,0.55)', [8, 3]), ol: 0.03 });
  extrude(ship, [[-14, 0], [14, 0], [13, -2.4], [-13, -2.4]], 7.8, '#6e4528', [5, 0, 0], { ol: 0.04 });
  for (let x = -8; x <= 18; x += 1.5) box(ship, 0.16, 1.05, 0.16, '#7a4a2a', [x, 0.52, -3.4], { ol: 0.02 });
  box(ship, 28, 0.14, 0.24, '#8d5a33', [5, 1.05, -3.4], { ol: 0.02 });
  cyl(ship, 0.2, 0.26, 14, '#6b4428', [4.4, 7, -1.9]);
  cyl(ship, 0.09, 0.09, 7, '#6b4428', [4.4, 9.4, -1.7], { r: [0, 0, PI / 2] });
  const sail = extrude(ship, [[-3, 0], [3, 0], [2.6, -3.2], [1.6, -2.7], [0.8, -3.6], [-0.4, -2.9], [-1.4, -3.4], [-2.8, -2.6]], 0.06, '#cfc3a6', [4.4, 9.3, -1.55], { ol: 0.03, side: T3.DoubleSide });
  [[-6, 0], [14, 0]].forEach(([x]) => cyl(ship, 0.025, 0.025, 11, '#3a2a20', [(x + 4.4) / 2, 5.4, -2.6], { r: [0, 0, Math.atan2(4.4 - x, 9.5)], ol: false }));
  barrel(ship, [8.6, 0, -2.4]); barrel(ship, [9.5, 0, -2.8]); barrel(ship, [-3.5, 0, -2.6]);
  const lotBarrel = barrel(ship, [3, 0, 0]);
  // hatch with warm light inside
  [[0, -0.6, 1.8, 0.2], [0, 0.6, 1.8, 0.2]].forEach(([x, z, w, d]) => box(ship, w, 0.28, d, '#5a3a22', [11.5 + x, 0.14, 0.8 + z], { ol: 0.02 }));
  [[-0.9, 1.4], [0.9, 1.4]].forEach(([x, d]) => box(ship, 0.2, 0.28, d, '#5a3a22', [11.5 + x, 0.14, 0.8], { ol: 0.02 }));
  box(ship, 1.6, 0.05, 1.0, '#120a06', [11.5, 0.02, 0.8], { basic: true, ol: false });
  const hatchGlow = new T3.PointLight(col('#ffb060'), 6, 4, 2); hatchGlow.position.set(11.5, 0.5, 0.8); ship.add(hatchGlow);
  sunSprite(ship, [11.5, 0.35, 0.8], 2.2, 'rgba(255,190,110,0.8)', 'rgba(255,150,60,0)');
  const stones = [0, 1, 2, 3, 4].map(i => sph(ship, 0.06, '#d8d0c0', [2.8 + i * 0.1, 1.17, (i % 2) * 0.1 - 0.05], { ol: 0.01 }));
  const lot = sph(ship, 0.075, '#fff4dc', [0, 0, 0], { emissive: '#ffe7a8', ei: 0.6, ol: 0.012 });
  const sailors = [0, 1, 2, 3].map(i => CREW(ship, i)), J = LEAD(ship);
  const cam = newCam();
  // ---- below deck
  const bd = new T3.Scene(); bd.background = col('#140b06'); bd.fog = new T3.Fog(col('#2a1a10'), 6, 20);
  bd.add(new T3.HemisphereLight(col('#8a6040'), col('#2a1a10'), 0.55));
  const room = new T3.Mesh(new T3.BoxGeometry(9, 4.4, 9), mat('#5a3a24', { map: texPlanks('#5a3a24', 'rgba(20,10,5,0.6)', [3, 2]), side: T3.BackSide }));
  room.position.set(0, 2.2, -1); room.receiveShadow = true; bd.add(room);
  [-1.7, 1.7].forEach(x => cyl(bd, 0.12, 0.14, 4.4, '#6b4428', [x, 2.2, -0.2]));
  const ham = new T3.Mesh(new T3.CylinderGeometry(1.84, 1.84, 0.95, 32, 1, true, -PI / 4, PI / 2), mat('#d8c7a2', { map: texStripes('#d8c7a2', '#b9a47e', 14), side: T3.DoubleSide }));
  ham.rotation.x = PI / 2; ham.rotation.y = PI / 2; ham.rotation.z = 0; ham.position.set(0, 2.35, -0.2); ham.castShadow = ham.receiveShadow = true; outline(ham, 0.02); bd.add(ham);
  const lantern = box(bd, 0.3, 0.42, 0.3, '#ffcf73', [1.0, 3.0, 0.9], { emissive: '#ffb040', ei: 1.2 });
  const lampL = new T3.PointLight(col('#ffb060'), 14, 12, 1.6); lampL.castShadow = true; lampL.shadow.mapSize.set(512, 512); lampL.position.set(1.0, 2.75, 1.05); bd.add(lampL);
  sunSprite(bd, [1.0, 3.0, 0.95], 2.6, 'rgba(255,210,140,0.9)', 'rgba(255,150,60,0)');
  const Jl = new Card(bd, { w: 1536, h: 1024, ax: 768, ay: 640, pxm: 470, base: 1.9, blob: 0, castShadow: false });
  const bcam = newCam();
  const deckPose = (t, flash) => { ship.rotation.z = 0.028 * Math.sin(NOW * 1.7); ship.rotation.x = 0.018 * Math.sin(NOW * 1.3); sea.userData.update(NOW); L.hemi.intensity = 1.0 + flash * 3.5; L.sun.intensity = 1.3 + flash * 2; };
  const stormPost = (t, flash, seed) => g => { rain(g, NOW, 170, 0.42); if (flash > 0) { bolt(g, seed === 3 ? 760 : 220, -100, 900, seed, flash); g.fillStyle = `rgba(225,235,255,${flash * 0.5})`; g.fillRect(0, 0, W, H); } };
  return {
    shot3(t) {
      const tA = wt(3, 'Jonah'), tB = wt(3, 'asleep');
      if (t < tB + 0.3) {
        const flash = flashAmt(t, [0.35, 2.4]); deckPose(t, flash);
        cam3(cam, t, [[0, { p: [0, 1.65, 4.7], l: [0, 1.35, 0] }], [0.25, { p: [0, 1.65, 4.7], l: [0, 1.35, 0] }], [tA - 0.25, { p: [7.5, 1.65, 4.7], l: [7.5, 1.35, 0] }],
          [tB - 0.05, { p: [11.5, 3.4, 3.4], l: [11.5, 0, 0.8] }], [tB + 0.35, { p: [11.5, 1.0, 1.05], l: [11.5, -1, 0.8] }]], { noPush: t > tA });
        J.hide(); lot.visible = false; stones.forEach(s => (s.visible = false)); lotBarrel.visible = false;
        const pose = [{ arms: { l: [165, 172], r: [165, 172] }, eyes: 'wide', look: 0.3, brows: 'worried', mouth: 'open', dir: 1 },
          { arms: CLASP, eyes: 'closed', brows: 'worried', mouth: 'wobbly', dir: -1 },
          { pose: 'kneel', bow: 0.6, arms: { l: [120, 160], r: [120, 160] }, eyes: 'closed', brows: 'worried', mouth: 'frown', dir: 1 },
          { arms: { l: [80, 150], r: [80, 150] }, eyes: 'wide', brows: 'worried', mouth: 'o', dir: -1 }];
        sailors.forEach((c, i) => c.person({ ...SAILORS[i], ...pose[i] }).at(i * 2.5, 0, 0, cam));
        return { scene: sc, camera: cam, post: g => { stormPost(t, flash, 3)(g); dark(g, seg(t, tB, tB + 0.3)); } };
      }
      const tb = t - tB;
      cam3(bcam, tb, [[0.3, { p: [0, 2.0, 4.3], l: [0, 1.85, -0.2] }], [2.0, { p: [0, 1.95, 3.6], l: [0, 1.85, -0.2] }]]);
      const sw = Math.sin(NOW * 1.6) * 0.04; ham.position.x = sw;
      lantern.position.x = 1.0 + Math.sin(NOW * 1.6) * 0.06;
      Jl.draw(g => sketchman(g, { x: 900, y: 640, s: 1.53 * 1.69, rot: -PI / 2, dir: 1, pose: alive({ ...POSES.idle, air: 1, aF: [20, 30], aB: [-25, -20] }, tb, 0.8), face: { eyes: 'closed', mouth: 'o' } })).at(sw - 0.05, 2.05, -0.2, bcam);
      const head = toScreen([-0.85 + sw, 2.4, -0.2], bcam);
      return { scene: bd, camera: bcam, post: g => {
        for (let i = 0; i < 3; i++) { const p = mod(NOW * 0.7 + i / 3, 1); g.save(); g.globalAlpha = Math.sin(p * PI); g.font = `900 ${50 + p * 50}px Montserrat`; g.textAlign = 'center'; g.lineWidth = 9; g.strokeStyle = INK; g.strokeText('Z', head[0] + 40 + p * 90, head[1] - 60 - p * 280); g.fillStyle = '#fff4dc'; g.fillText('Z', head[0] + 40 + p * 90, head[1] - 60 - p * 280); g.restore(); }
        dark(g, 1 - seg(tb, 0.3, 0.65));
      } };
    },
    shot4(t) {
      const tCast = wt(4, 'cast'), tFell = wt(4, 'fell'), tJ = wt(4, 'Jonah.'), tThrow = wt(4, '“Throw');
      const flash = flashAmt(t, [tJ]); deckPose(t, flash);
      cam3(cam, t, [[0, { p: [3.0, 1.55, 2.6], l: [3, 1.0, 0] }], [tFell - 0.15, { p: [3.25, 1.45, 2.6], l: [3.25, 0.95, 0] }], [tJ, { p: [4.3, 0.75, 2.4], l: [4.3, 0.15, 0.5] }],
        [tJ + 0.35, { p: [4.0, 1.9, 10.5], l: [4.0, 1.1, 0] }], [tThrow - 0.15, { p: [4.75, 1.6, 4.0], l: [4.5, 1.45, 0] }, 'cut']]);
      lotBarrel.visible = true; stones.forEach((s, i) => { s.visible = true; s.position.y = 1.17 + Math.max(0, Math.sin(seg(t, tCast, tCast + 0.4) * PI)) * (0.15 + i * 0.03); });
      const k = sstep(t, tFell - 0.1, tJ - 0.05); lot.visible = true;
      lot.position.set(lerp(3.2, 4.25, k), lerp(1.18, 0.07, k) + Math.sin(k * PI) * 0.35, lerp(0.05, 0.6, k));
      const stare = t > tJ - 0.05, speaking = t > tThrow - 0.15;
      [[1.3, 0.3, 1, 0], [2.1, -0.6, 1, 2], [5.6, -0.4, -1, 1], [6.5, 0.3, -1, 3]].forEach(([x, z, dir, si], i) =>
        sailors[i].person({ ...SAILORS[si], dir, eyes: 'wide', look: stare ? dir : dir * 0.3, brows: stare ? 'raised' : 'worried', mouth: stare ? 'o' : 'line' }).at(x, 0, z, cam));
      J.sketch({ ...jonahFrame(t, [[0, 'idle'], [tThrow + 0.1, 'point', 0.4]], { dir: 1, vel: () => [-1.2, 0] }), face: { eyes: speaking ? 'dot' : 'wide', brows: speaking ? 'flat' : 'raised', mouth: speaking ? 'open' : 'line' } }).at(4.4, 0, 0, cam);
      return { scene: sc, camera: cam, post: stormPost(t, flash, 9) };
    },
  };
}

// ================================================================== underwater (shot 5)
function makeSea() {
  const sc = new T3.Scene(); setSky(sc, [[0, '#9fe2f2'], [0.35, '#3d97c4'], [1, '#0b2c4c']]);
  sc.fog = new T3.FogExp2(col('#1f6f9e'), 0.035);
  sc.add(new T3.HemisphereLight(col('#bff0ff'), col('#0b3050'), 1.6));
  const surf = water(sc, 160, 160, '#c9f4ff', { y: 11.6, amp: 0.18, len: 2, ei: 1.2, side: T3.DoubleSide });
  for (let i = 0; i < 6; i++) shaft(sc, [-8 + i * 3.4, 2, -6 - (i % 3) * 3], 26, 0.5, 2.6, '#dff8ff', 0.16, [0, 0, 0.22]);
  ground(sc, 120, 120, '#c9b48a', { m: mat('#c9b48a', { map: texSpeckle('#c9b48a', [14, 14], 2500, 0.2, 77) }), y: -2.6, z: -10 });
  const r = rng(12), kelp = [];
  for (let i = 0; i < 14; i++) sph(sc, 0.5 + r() * 1.1, '#6c7f86', [-12 + r() * 24, -2.6, -4 - r() * 18], { s: [1.3, 0.6, 1], ol: 0.03 });
  for (let i = 0; i < 18; i++) { const k = box(sc, 0.14, 3 + r() * 3, 0.02, '#3f8a5a', [-12 + r() * 24, -1, -3 - r() * 16], { ol: 0.015 }); k.userData.ph = r() * TAU; kelp.push(k); }
  const bub = [0, 1, 2, 3, 4, 5].map(() => sph(sc, 0.06, '#ffffff', [0, 0, 0], { emissive: '#e0f8ff', ei: 0.8 }));
  const J = LEAD(sc);
  const F = new Card(sc, { w: 2048, h: 1024, ax: 1024, ay: 560, pxm: 110, face: 'cam', blob: 0, castShadow: false });
  const cam = newCam();
  return function (t) {
    const tStill = wt(5, 'still.'), tFish = wt(5, 'fish'), tSw = wt(5, 'swallowed');
    surf.userData.update(NOW, lerp(0.25, 0.04, seg(t, 0.4, tStill + 0.3)));
    kelp.forEach(k => (k.rotation.z = Math.sin(NOW * 1.3 + k.userData.ph) * 0.12));
    cam3(cam, t, [[0, { p: [0, 6.2, 9], l: [0, 6.0, 0] }], [3.5, { p: [0, 3.0, 9], l: [0, 2.6, 0] }]]);
    const jy = lerp(11.2, 2.9, easeOut(seg(t, 0, tSw)));
    const k = sstep(t, tFish - 0.7, tSw), out = sstep(t, tSw + 0.35, 3.5);
    const m = t < tSw + 0.15 ? sstep(t, tFish - 0.2, tFish + 0.35) : 1 - sstep(t, tSw + 0.15, tSw + 0.4);
    const eaten = t > tSw + 0.28;
    if (!eaten) J.sketch({ ...jonahFrame(t, [[0, tt => mixPose(POSES.sink, POSES.fall, 0.5 + 0.5 * Math.sin(tt * 5))]], { dir: 1, life: 2, vel: tt => [0, -2.5 * (1 - seg(tt, 0, tSw))] }), rot: 0.18, face: { eyes: 'wide', brows: 'worried', mouth: 'o' } }).at(0.1, jy, 0, cam); else J.hide();
    bub.forEach((b, i) => { const p = mod(NOW * 0.8 + i / 6, 1); b.visible = !eaten; b.position.set(0.1 + Math.sin(i * 2.1) * 0.3, jy + 1.4 + p * 2.2, 0.2); });
    if (t > tFish - 0.8) {
      const roll = lerp(0.75, -0.35, out);
      const mx = 5.6, my = -0.4, c = Math.cos(roll), s = Math.sin(roll);
      const tx = 0.1 - (mx * c - my * s), ty = (2.9 + 1.0) - (mx * s + my * c);
      F.roll = roll;
      F.draw(g => fish(g, 1024, 560, 1.1, 0, m)).at(lerp(tx - 9, tx, k) + out * 9, lerp(ty - 12, ty, k) - out * 8, -1.2, cam);
    } else F.hide();
    return { scene: sc, camera: cam, post: g => {
      const sp = seg(t, 0, 0.8);
      if (sp < 1) for (let i = 0; i < 16; i++) { const rr = rng(i + 40); circle(g, 540 + (rr() - 0.5) * 360, 140 + rr() * 220 - sp * 140, (10 + rr() * 22) * (1 - sp)); stroke(g, 4, `rgba(255,255,255,${0.8 * (1 - sp)})`); }
      dark(g, seg(t, 2.6, 3.6) * 0.75, '4,14,28');
    } };
  };
}

// ================================================================== the beach at sunrise (shot 7)
function makeBeach() {
  const sc = new T3.Scene(); setSky(sc, [[0, '#8ea4d6'], [0.34, '#f3b0a6'], [0.47, '#ffd68c'], [1, '#ffd68c']]);
  sc.fog = new T3.Fog(col('#f8c9a6'), 40, 230);
  lights(sc, { sky: '#ffd9c8', ground: '#d9b07a', hemi: 1.35, sun: '#ffc79a', sunI: 2.2, dir: [6, 7, -30], target: [0, 0, 0], extent: 16 });
  sunSprite(sc, [0, 4, -240], 80, 'rgba(255,245,215,1)', 'rgba(255,170,120,0)');
  [[-40, 30, -150, 5], [30, 46, -170, 6.5], [70, 26, -140, 4]].forEach(([x, y, z, s], i) => cloud3(sc, [x, y, z], s, '#ffe0d6', 30 + i));
  ground(sc, 200, 110, '#f2dcb4', { m: mat('#f2dcb4', { map: texSpeckle('#f2dcb4', [30, 16], 2500, 0.14, 5) }), z: 52 });
  const sea = water(sc, 400, 300, '#6f9fd0', { y: 0.04, z: -153, amp: 0.05, len: 2.2, ei: 0.35 });
  const foam = new T3.Mesh(new T3.PlaneGeometry(200, 1.2), new T3.MeshBasicMaterial({ color: col('#ffffff'), transparent: true, opacity: 0.85 }));
  foam.rotation.x = -PI / 2; foam.position.set(0, 0.06, -2.9); sc.add(foam);
  palm(sc, [-6.5, 0, -1.5], 5.5, 0.2); palm(sc, [-9, 0, 2.5], 6.2, 0.08);
  [[5.5, -1], [7.2, -2.2], [6.4, 0.6]].forEach(([x, z], i) => sph(sc, 0.5 + i * 0.25, '#8b8c8f', [x, 0.1, z], { s: [1.4, 0.7, 1], ol: 0.03 }));
  const J = LEAD(sc);
  const F = new Card(sc, { w: 2048, h: 1024, ax: 1024, ay: 560, pxm: 110, face: 'cam', blob: 0, castShadow: false });
  const cam = newCam();
  return function (tb) {
    sea.userData.update(NOW); foam.position.z = -2.9 + Math.sin(NOW * 1.3) * 0.35; foam.material.opacity = 0.6 + 0.3 * Math.sin(NOW * 1.3 + 1);
    cam3(cam, tb, [[0, { p: [0.9, 1.6, 7.4], l: [1.1, 0.7, -2] }], [2.8, { p: [0.9, 1.5, 6.8], l: [1.1, 0.6, -2] }]]);
    // spat out: a tumbling ballistic arc (measured gravity 12.8 H/s^2), dust-puff landing, then dazed on his knees
    const tS = wt(7, 'spat') + 0.05, Tf = 0.62, u = tb - tS;
    if (u < 0) J.hide();
    else if (u < Tf) {
      const k = u / Tf, Hm = 1.65, v0 = 0.5 * SK.g * Tf;          // lands exactly at u = Tf
      const air = (v0 * u - 0.5 * SK.g * u * u) * Hm + 0.4 * (1 - k);
      const vyU = uu => (v0 - SK.g * uu) * 1.0;
      J.sketch({ ...jonahFrame(u, [[0, uu => airPose(vyU(uu))]], { dir: -1, vel: uu => [-4, vyU(uu)] }), rot: -smooth5(k) * TAU, seaweed: true, face: { eyes: 'wide', mouth: 'o' } }).at(lerp(3.2, 0.35, k), air, lerp(-0.5, 1.7, k), cam);
    } else {
      const l = u - Tf;
      const p = l < 0.17 ? 'land' : l < 0.3 ? mixPose(POSES.land, POSES.kneel, (l - 0.17) / 0.13) : 'kneel';
      J.sketch({ ...jonahFrame(l, [[-0.05, 'fall'], [0.05, 'land', 0.08], [0.2, 'land', 0.1], [0.7, 'kneel', 0.45]], { dir: 1, vel: ll => [ll < 0.15 ? -2 : 0, 0] }), seaweed: true, face: { eyes: 'wide', brows: 'raised', mouth: 'wobbly' } }, (g, c) => dustPuff(g, c.ax, c.ay, l / 0.6, 1.5, 4)).at(0.35, 0, 1.7, cam);
    }
    const fk = sstep(tb, 0.2, 2.6);
    F.roll = 0; F.draw(g => fish(g, 1024, 560, 1.1, 0, 0)).at(lerp(2.6, 9, fk), lerp(0.8, -0.7, fk), lerp(-7, -12, fk), cam, 0.55);
    return { scene: sc, camera: cam };
  };
}

// ================================================================== Nineveh's gate (shot 8)
function lamassu(parent, p, side) {
  const g = new T3.Group(), st = '#d6c095', st2 = '#c4ab7f';
  box(g, 1.6, 0.4, 3.2, st2, [0, 0.2, 0]);
  [[-0.4, -1.0], [0.4, -1.0], [-0.4, 1.0], [0.4, 1.0]].forEach(([x, z]) => box(g, 0.38, 1.7, 0.38, st, [x, 1.25, z]));
  box(g, 1.2, 1.3, 2.8, st, [0, 2.7, 0], { map: texSpeckle(st, [1, 1], 600, 0.12, 8) });
  const wing = extrude(g, [[-1.3, 0], [1.3, 0], [1.6, 1.6], [0.6, 1.2], [0.2, 1.9], [-0.4, 1.3], [-1.0, 1.6], [-1.6, 0.6]], 0.12, st2, [side * 0.66, 2.9, -0.2], { r: [0, PI / 2, 0], ol: 0.025 });
  for (let i = 0; i < 4; i++) box(g, 0.02, 0.05, 2.4 - i * 0.3, '#8a7a5a', [side * 0.73, 3.2 + i * 0.32, -0.2], { ol: false });
  sph(g, 0.5, '#e2d2ad', [0, 3.75, 1.6], { ol: 0.03 });
  cyl(g, 0.46, 0.42, 0.8, st2, [0, 4.5, 1.6]);
  box(g, 0.62, 1.0, 0.26, '#7b6648', [0, 3.1, 1.9]);
  [-0.17, 0.17].forEach(x => sph(g, 0.06, '#2a1f19', [x, 3.82, 2.07]));
  g.position.set(p[0], p[1], p[2]); parent.add(g); return g;
}
function stall(parent, p, c) {
  const g = new T3.Group();
  [[-1.4, -0.9], [1.4, -0.9], [-1.4, 0.9], [1.4, 0.9]].forEach(([x, z]) => cyl(g, 0.06, 0.06, 2.6, '#7a4f2c', [x, 1.3, z]));
  box(g, 3.3, 0.1, 2.3, c, [0, 2.65, 0], { r: [0.18, 0, 0], m: mat(c, { map: texStripes(c, '#f6ead2', 10) }) });
  box(g, 3.0, 0.9, 1.2, '#a36c3c', [0, 0.45, 0.2], { map: texPlanks('#a36c3c', 'rgba(40,20,10,0.6)', [2, 1]) });
  const r = rng(p[0] * 10 | 0);
  for (let i = 0; i < 9; i++) sph(g, 0.14, ['#f29f3c', '#e0503d', '#8cbf4a'][i % 3], [-1.1 + (i % 5) * 0.55, 1.02, 0.0 + Math.floor(i / 5) * 0.35], { ol: 0.012 });
  g.position.set(p[0], p[1], p[2]); parent.add(g); return g;
}
function makeGate() {
  const sc = new T3.Scene(); setSky(sc, [[0, '#7fc6ec'], [0.48, '#fff2cc'], [1, '#fff2cc']]);
  sc.fog = new T3.Fog(col('#fff0d2'), 45, 170);
  lights(sc, { sky: '#e2f2ff', ground: '#d8b47c', hemi: 1.35, sun: '#fffaf0', sunI: 2.6, dir: [7, 30, 12], target: [0, 0, -4], extent: 24 });
  sunSprite(sc, [40, 95, -130], 70, 'rgba(255,255,255,1)', 'rgba(255,250,220,0)');
  [[-35, 40, -120, 5], [45, 50, -140, 6]].forEach(([x, y, z, s], i) => cloud3(sc, [x, y, z], s, '#ffffff', 50 + i));
  ground(sc, 140, 120, '#ecd2a4', { m: mat('#ecd2a4', { map: texTiles('#ecd2a4', 'rgba(140,100,50,0.3)', [40, 34]) }), z: -20 });
  box(sc, 70, 8, 3, '#dcb67e', [0, 4, -14], { map: texBricks('#dcb67e', 'rgba(120,80,40,0.35)', [14, 2]), ol: 0.05 });
  for (let x = -34; x <= 34; x += 2) box(sc, 1.0, 1.0, 3, '#dcb67e', [x, 8.5, -14], { map: texBricks('#dcb67e', 'rgba(120,80,40,0.35)', [0.2, 0.2]), ol: 0.03 });
  const gateCity = new T3.Group(); gateCity.position.y = 3; sc.add(gateCity);   // city sits on a rise behind the wall
  town(gateCity, { seed: 201, n: 60, x: [-45, 45], z: [-18, -62], h: [8, 14], w: [3, 5.5], avoid: (x, z) => Math.abs(x) < 3 && z > -22 });
  [[-18, -30], [16, -26], [-6, -48], [30, -44], [-34, -40]].forEach(([x, z], i) => { const th = 20 + (i % 3) * 3; box(sc, 2.6, th, 2.6, '#d6ad75', [x, th / 2, z], { map: texBricks('#d6ad75', 'rgba(120,80,40,0.35)', [0.6, 5]), ol: 0.05 }); sph(sc, 1.7, i % 2 ? '#5f9fc0' : '#f3ead8', [x, th, z], { ol: 0.04 }); });
  flag3(sc, [-6, 25, -48], '#c94b3a', 1.6, 0.9, 2.5);
  arch(sc, 5.4, 7.4, 0.5, '#2f5ea8', [0, 0, -12.4], { map: texBricks('#2f5ea8', 'rgba(20,30,70,0.5)', [1.5, 2]) });
  arch(sc, 3.8, 6.3, 0.52, '#2b2018', [0, 0, -12.35], { basic: true });
  for (let i = 0; i < 6; i++) [-2.3, 2.3].forEach(x => sph(sc, 0.14, '#f2c94c', [x, 1.0 + i * 0.95, -12.1], { emissive: '#a07a10', ei: 0.3, ol: 0.012 }));
  lamassu(sc, [-4.7, 0, -11.2], -1); lamassu(sc, [4.7, 0, -11.2], 1);
  const flags = [[-14, '#2f5ea8'], [-6, '#c94b3a'], [6, '#c94b3a'], [14, '#2f5ea8']].map(([x, c]) => flag3(sc, [x, 9, -13.5], c, 1.6, 0.9, 3));
  stall(sc, [-7.5, 0, -4.5], '#c94b3a'); stall(sc, [8.2, 0, -5.5], '#3f8a9a');
  [[-5.2, -2], [6.3, -2.6]].forEach(([x, z]) => { cyl(sc, 0.32, 0.24, 0.7, '#b8673a', [x, 0.35, z]); });
  const robes = ['#c94b3a', '#e1a23c', '#4a8fc4', '#7a5aa8', '#3f9a6a', '#d6795a', '#2f6f8f', '#b8487a', '#9a7a3a'];
  const heads = [{ head: 'veil', headCol: '#e6c46a' }, { head: 'hair', headCol: '#2e2420' }, { beard: 'short' }, { head: 'veil', headCol: '#5aa0c4' }, { head: 'hair', headCol: '#5a3d28', beard: 'short', beardCol: '#5a3d28' }, { head: 'veil', headCol: '#b8487a' }, { beard: 'full', beardCol: '#9a9a9a' }, { head: 'hair', headCol: '#2e2420' }, { head: 'veil', headCol: '#8cbf4a' }];
  const r = rng(21);
  const crowd = robes.map((c, i) => ({ card: CREW(sc), id: 'C' + i, crowd: true, robe: c, ...heads[i], kid: i === 4 || i === 7, x: 0.6 + i * 0.5 + (r() - 0.5) * 0.25, z: -0.6 + (i % 3) * 0.55 + r() * 0.3, dir0: r() < 0.5 ? 1 : -1, mood: ['smile', 'line', 'smile'][i % 3] }));
  const J = LEAD(sc), cam = newCam();
  return function (t) {
    const tSaid = wt(8, 'said'), t40 = wt(8, '“40');
    flags.forEach(f => f.userData.update(NOW));
    cam3(cam, t, [[0, { p: [0, 2.4, 13.5], l: [0, 4.2, -10] }], [0.4, { p: [0, 2.4, 13.5], l: [0, 4.2, -10] }], [tSaid, { p: [-0.5, 1.6, 7.8], l: [-0.2, 1.3, 0] }],
      [t40 - 0.15, { p: [-1.0, 1.55, 6.2], l: [-0.65, 1.35, 0] }, 'cut']]);
    const turned = t > t40 - 0.1;
    crowd.forEach(c => c.card.person({ ...c, dir: turned ? -1 : c.dir0, eyes: turned ? 'wide' : 'dot', look: -1, brows: turned ? 'raised' : null, mouth: turned ? 'o' : c.mood }, c.kid ? 0.66 : 1).at(c.x, 0, c.z, cam));
    const wk = seg(t, 0.5, tSaid), proclaim = t > t40 - 0.15;
    const jxAt = tt => lerp(-7.5, -1.6, seg(tt, 0.5, tSaid));
    const walkK = [[0, tt => walkPose((jxAt(tt) + 7.5) / 2.7 * TAU)], [tSaid + 0.1, 'idle', 0.35], [t40 - 0.05, 'proclaim', 0.4]];
    J.sketch({ ...jonahFrame(t, walkK, { dir: 1, vel: tt => [(jxAt(tt + 0.02) - jxAt(tt - 0.02)) / 0.04 / 1.65, 0] }), face: { brows: proclaim ? 'raised' : 'soft', mouth: proclaim ? 'open' : 'line' } }).at(jxAt(t), 0, 0.7, cam);
    return { scene: sc, camera: cam };
  };
}

// ================================================================== the city repents (shot 9)
function makeSquare() {
  const sc = new T3.Scene();
  const skyCv = document.createElement('canvas'); skyCv.width = 16; skyCv.height = 512;
  const skyT = new T3.CanvasTexture(skyCv); skyT.colorSpace = T3.SRGBColorSpace; sc.background = skyT;
  sc.fog = new T3.Fog(col('#b8b2a8'), 35, 150);
  const L = lights(sc, { sky: '#c9ccd2', ground: '#9a8a70', hemi: 1.1, sun: '#ffe2a8', sunI: 0.4, dir: [6, 30, -6], target: [5, 0, -2], extent: 22 });
  const clouds = [];
  for (let i = 0; i < 5; i++) clouds.push([cloud3(sc, [-4 - i * 7, 20 + (i % 2) * 3, -30 - i * 4], 3.6, '#8f949e', 60 + i), -1]);
  for (let i = 0; i < 5; i++) clouds.push([cloud3(sc, [12 + i * 7, 21 + (i % 2) * 3, -30 - i * 4], 3.6, '#8f949e', 70 + i), 1]);
  clouds.forEach(c => (c[2] = c[0].position.x));
  ground(sc, 140, 120, '#d7bc8c', { m: mat('#d7bc8c', { map: texTiles('#d7bc8c', 'rgba(120,90,50,0.3)', [40, 34]) }), z: -20 });
  const r = rng(33);
  for (let i = 0; i < 18; i++) house(sc, -26 + i * 3.1 + r(), -13 - r() * 8, 2.6 + r() * 1.2, 2.8 + r() * 3.4, 3, ['#e3c28d', '#d6ad75', '#ecd3a5'][i % 3], 80 + i);
  town(sc, { seed: 301, n: 60, x: [-40, 38], z: [-23, -58], h: [3, 9], avoid: (x, z) => Math.abs(x - 7) < 10 && Math.abs(z + 30) < 10 });
  [[-12, -40], [24, -44], [-28, -30]].forEach(([x, z], i) => { box(sc, 2.2, 13 + i * 2, 2.2, '#d6ad75', [x, (13 + i * 2) / 2, z], { map: texBricks('#d6ad75', 'rgba(120,80,40,0.35)', [0.6, 4]), ol: 0.05 }); sph(sc, 1.4, '#5f9fc0', [x, 13 + i * 2, z], { ol: 0.04 }); });
  [[16, '#cfa86e'], [12, '#d9b47c'], [8, '#e2c08c'], [4.5, '#ebcd9c']].forEach(([w, c], i) => box(sc, w, 2.4, w, c, [7, 1.2 + i * 2.4, -30], { map: texBricks(c, 'rgba(120,80,40,0.3)', [w / 3, 0.6]), ol: 0.05 }));
  cyl(sc, 0.3, 1.3, 0.5, '#aaa6a0', [6, 0.25, -2], { map: texSpeckle('#aaa6a0', [3, 1], 2500, 0.25, 9), ol: 0.025, seg: 28 });
  const crown = new T3.Group(); cyl(crown, 0.25, 0.22, 0.55, '#b5302d', [0, 0, 0]); [-0.22, 0.24].forEach(y => cyl(crown, 0.27, 0.27, 0.08, '#e8b63c', [0, y, 0], { ol: 0.01 }));
  crown.position.set(7.7, 0.22, -1.2); crown.rotation.set(0.3, 0.4, 1.25); sc.add(crown);
  sph(sc, 0.6, '#8f1f24', [7.6, 0.12, -2.7], { s: [1.2, 0.28, 0.8], ol: 0.02 });
  cyl(sc, 0.62, 0.7, 0.05, '#e0b03a', [7.6, 0.08, -2.7], { ol: false });
  const rays = [0, 1, 2, 3].map(i => shaft(sc, [3.5 + i * 1.8, 12, -6 + i * 0.6], 30, 0.8, 3.2, '#ffe7a0', 0, [0.08, 0, -0.18 + i * 0.05]));
  const looks = [{ head: 'veil', headCol: '#9c8664' }, { head: 'hair', headCol: '#2e2420' }, { beard: 'short' }, { head: 'veil', headCol: '#7f6d55' }, { head: 'hair', headCol: '#5a3d28' }, { beard: 'full', beardCol: '#8c8c8c' }];
  const rr = rng(77), people = [];
  for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) people.push({ card: CREW(sc), id: 'P' + row + '_' + i, crowd: true, ...looks[Math.floor(rr() * looks.length)], kid: rr() < 0.18, x: -9.5 + i * 1.6 + row * 0.6 + (rr() - 0.5) * 0.4, z: 1.2 - row * 1.4, dir: rr() < 0.7 ? 1 : -1 });
  const K = LEAD(sc), cam = newCam();
  const sg = skyCv.getContext('2d');
  return function (t) {
    const tSpared = wt(9, 'spared'), tEven = wt(9, 'Even') - 0.1;
    const cl = sstep(t, tSpared - 0.6, tSpared + 0.9);
    const grey = [[0, '#6f7480'], [0.5, '#b5b0a8'], [1, '#b5b0a8']], gold = [[0, '#f6b860'], [0.5, '#ffe6a8'], [1, '#ffe6a8']];
    const gr = sg.createLinearGradient(0, 0, 0, 512);
    grey.forEach(([o, c], i) => gr.addColorStop(o, '#' + col(c).lerp(col(gold[i][1]), cl).getHexString()));
    sg.fillStyle = gr; sg.fillRect(0, 0, 16, 512); skyT.needsUpdate = true;
    sc.fog.color.copy(col('#b8b2a8').lerp(col('#ffe2b0'), cl));
    L.sun.intensity = lerp(0.4, 2.8, cl); L.hemi.color.copy(col('#c9ccd2').lerp(col('#fff0d0'), cl));
    clouds.forEach(([c, side, x0]) => (c.position.x = x0 + side * cl * 26));
    rays.forEach(m => (m.material.opacity = cl * 0.3));
    cam3(cam, t, [[0, { p: [-5.6, 1.4, 5.6], l: [-4.6, 0.8, -1] }], [0.3, { p: [-5.6, 1.4, 5.6], l: [-4.6, 0.8, -1] }], [tEven, { p: [-2.8, 1.4, 5.6], l: [-2, 0.8, -1] }],
      [tEven, { p: [6.4, 1.45, 3.7], l: [6, 1.15, -2] }, 'cut'], [tSpared - 0.5, { p: [6.4, 1.45, 3.5], l: [6, 1.15, -2] }], [tSpared + 1.0, { p: [3.6, 3.0, 11.5], l: [4.5, 4.6, -6] }]]);
    people.forEach(p => p.card.person({ ...p, sack: true, pose: 'kneel', bow: 0.55, arms: CLASP, eyes: 'closed', brows: 'worried', mouth: 'line' }, p.kid ? 0.64 : 0.95).at(p.x, 0, p.z, cam));
    K.person({ ...KING_SACK, dir: -1, pose: 'sit', bow: 0.3, arms: { l: [30, 20], r: [30, 20] }, eyes: 'closed', brows: 'worried', mouth: 'frown' }).at(6, 0.42, -2, cam);
    return { scene: sc, camera: cam };
  };
}

// ================================================================== the hill east of the city (shot 10)
function terrain(parent, size, seg, f, c, o = {}) {
  const geo = new T3.PlaneGeometry(size, size, seg, seg); geo.rotateX(-PI / 2);
  const a = geo.attributes.position.array; for (let i = 0; i < a.length; i += 3) a[i + 1] = f(a[i], a[i + 2]);
  geo.computeVertexNormals();
  const m = new T3.Mesh(geo, o.m || mat(c)); m.receiveShadow = true; parent.add(m); return m;
}
function makeHill() {
  const sc = new T3.Scene(); setSky(sc, [[0, '#d9ecf4'], [0.5, '#fffdf2'], [1, '#fffdf2']]);
  sc.fog = new T3.Fog(col('#f6f2e2'), 40, 220);
  lights(sc, { sky: '#f4fbff', ground: '#c9a46a', hemi: 1.35, sun: '#ffffff', sunI: 3.0, dir: [-6, 30, 7], target: [0, 0, 0], extent: 14 });
  sunSprite(sc, [25, 70, -60], 90, 'rgba(255,255,255,1)', 'rgba(255,255,240,0)');
  const hf = (x, z) => 1.1 * Math.exp(-(x * x + z * z) / 90) - 0.015 * Math.max(0, -z);
  terrain(sc, 260, 120, hf, '#dcc394', { m: mat('#dcc394', { map: texSpeckle('#dcc394', [40, 40], 3000, 0.16, 15) }) });
  const r = rng(14);
  for (let i = 0; i < 160; i++) { const x = (r() - 0.5) * 30, z = (r() - 0.5) * 30 - 2; const c = cyl(sc, 0, 0.06, 0.3, '#a4864e', [x, hf(x, z) + 0.12, z], { ol: false, seg: 5 }); c.rotation.z = (r() - 0.5) * 0.6; }
  const city = new T3.Group(); city.position.set(-34, -1.4, -80); sc.add(city);
  town(city, { seed: 401, n: 50, x: [-22, 26], z: [-4, -26], h: [3, 8] });
  [[-8, -12], [10, -18]].forEach(([x, z]) => { box(city, 2, 12, 2, '#d6ad75', [x, 6, z], { ol: 0.06 }); sph(city, 1.3, '#5f9fc0', [x, 12, z], { ol: 0.05 }); });
  box(city, 30, 3, 1, '#dcb67e', [0, 1.5, 0], { ol: 0.06 });
  for (let i = 0; i < 12; i++) box(city, 2 + r() * 2, 2 + r() * 4, 2, '#d6b47e', [-13 + i * 2.4, 1.5, -3], { ol: 0.05 });
  [[8, '#cfa86e'], [5, '#e2c08c']].forEach(([w, c], i) => box(city, w, 2, w, c, [4, 1 + i * 2 + 1, -8], { ol: 0.05 }));
  const J = new Card(sc, { base: 1.53, blob: 0.95, h: 1800, ay: 1700 }), cam = newCam();
  const y0 = hf(0, 0);
  return function (t) {
    const tFur = wt(10, 'furious.'), tHed = wt(10, 'He’d'), stomp = tFur + 0.12;
    const fury = t >= tFur && t < tHed;
    let shake = null;
    if (t > stomp && t < tHed) { const e = Math.exp(-(t - stomp) * 7); shake = [Math.sin(t * 90) * 0.02 * e, Math.cos(t * 77) * 0.016 * e]; }
    cam3(cam, t, [[0, { p: [1.3, y0 + 1.9, 9], l: [0, y0 + 1.4, 0] }], [tFur, { p: [0.06, y0 + 1.36, 2.15], l: [0, y0 + 1.33, 0] }, 'cut'], [tHed, { p: [0.06, y0 + 1.36, 2.15], l: [0, y0 + 1.33, 0] }],
      [tHed + 0.55, { p: [0.35, y0 + 1.4, 4.7], l: [0, y0 + 1.1, 0] }]], { shake });
    // furious: a small stomp-hop on 'furious' (measured gravity), landing squat with dust, steam; then arms folded
    const tJ = tFur - 0.05, v0h = 3.0, Tair = 2 * v0h / SK.g, tLand = tJ + Tair;
    const airAt = tt => tt > tJ && tt < tLand ? v0h * (tt - tJ) - 0.5 * SK.g * (tt - tJ) ** 2 : 0;
    const vyAt = tt => tt > tJ && tt < tLand ? v0h - SK.g * (tt - tJ) : 0;
    const hopK = [[0, 'idle'], [tJ - 0.02, 'crouch', 0.1], [tJ + 0.06, tt => airPose(vyAt(tt)), 0.08], [tLand + 0.03, 'land', 0.06], [tLand + 0.2, 'land', 0.1], [tLand + 0.5, 'fury', 0.3], [tHed + 0.1, 'arms', 0.4]];
    const fJ = jonahFrame(t, hopK, { dir: -1, vel: tt => [0, vyAt(tt)] });
    J.sketch({ ...fJ, air: airAt(t), shake: fury && t > tLand + 0.4 ? 5 : 0,
      face: { red: fury, eyes: fury ? 'angry' : 'dot', brows: t < tFur ? 'soft' : 'angry', mouth: fury ? 'grit' : 'frown', steam: fury } },
      (g, c) => dustPuff(g, c.ax, c.ay, (t - tLand) / 0.6, 1.6, 4)).at(0, y0, 0, cam);
    return { scene: sc, camera: cam };
  };
}

// ================================================================== the whole city at golden hour (shot 11)
function makeCity() {
  const sc = new T3.Scene(); setSky(sc, [[0, '#4b3f7a'], [0.22, '#c9739a'], [0.34, '#f39a5a'], [0.44, '#ffcf7a'], [1, '#ffcf7a']]);
  sc.fog = new T3.Fog(col('#f6b27a'), 30, 230);
  lights(sc, { sky: '#ffd6a8', ground: '#a87543', hemi: 1.3, sun: '#ffb070', sunI: 2.2, dir: [12, 9, -60], target: [0, 0, -40], extent: 45 });
  sunSprite(sc, [25, 10, -240], 95, 'rgba(255,240,200,1)', 'rgba(255,160,90,0)');
  [[-40, 40, -170, 6], [40, 52, -190, 7]].forEach(([x, y, z, s], i) => cloud3(sc, [x, y, z], s, '#ffd2c0', 90 + i));
  ground(sc, 500, 400, '#c99a5c', { m: mat('#c99a5c', { map: texSpeckle('#c99a5c', [60, 50], 3000, 0.14, 19) }), z: -100 });
  water(sc, 500, 9, '#7fb6d6', { y: 0.05, z: -84, amp: 0.03, len: 2, ei: 0.55 });
  const hill = sph(sc, 12, '#a87543', [0, -4, 4], { m: mat('#a87543', { map: texSpeckle('#a87543', [6, 6], 2500, 0.18, 23) }), seg: 48, seg2: 32 });
  // walls
  [[0, -32, 44, 1], [0, -70, 44, 1], [-22, -51, 1, 38], [22, -51, 1, 38]].forEach(([x, z, w, d]) => box(sc, w, 2.6, d, '#e2b77a', [x, 1.3, z], { map: texBricks('#e2b77a', 'rgba(120,80,40,0.35)', [Math.max(w, d) / 4, 0.6]), ol: 0.06 }));
  // houses (instanced) with warm lit windows
  const r = rng(55), n = 190;
  const hGeo = new T3.BoxGeometry(1, 1, 1), hMat = new T3.MeshLambertMaterial({ map: texSpeckle('#ffffff', [1, 1], 600, 0.15, 3) });
  const houses = new T3.InstancedMesh(hGeo, hMat, n); houses.castShadow = houses.receiveShadow = true;
  const win = new T3.InstancedMesh(new T3.PlaneGeometry(0.35, 0.35), new T3.MeshBasicMaterial({ color: col('#ffd36a'), fog: false }), n);
  const dm = new T3.Object3D(), pal = ['#f0cf98', '#e6bd84', '#f6dcae', '#dcae74', '#e9c38c'];
  let k = 0;
  for (let i = 0; i < n * 3 && k < n; i++) {
    const x = -20 + r() * 40, z = -34 - r() * 34;
    if (Math.abs(x) < 9 && z < -47 && z > -63) continue;
    const w = 1.2 + r() * 1.8, h = 1 + r() * 2.2, d = 1.2 + r() * 1.6;
    dm.position.set(x, h / 2, z); dm.scale.set(w, h, d); dm.rotation.set(0, 0, 0); dm.updateMatrix(); houses.setMatrixAt(k, dm.matrix); houses.setColorAt(k, col(pal[k % 5]));
    dm.position.set(x + (r() - 0.5) * w * 0.5, h * 0.6, z + d / 2 + 0.02); dm.scale.set(1, 1, 1); dm.updateMatrix(); win.setMatrixAt(k, dm.matrix);
    k++;
  }
  houses.count = win.count = k; sc.add(houses); sc.add(win);
  [[16, '#c9965c'], [12, '#d4a36a'], [8, '#dfb27a'], [4, '#e9c18a']].forEach(([w, c], i) => box(sc, w, 2.4, w, c, [0, 1.2 + i * 2.4, -55], { map: texBricks(c, 'rgba(120,80,40,0.3)', [w / 3, 0.6]), ol: 0.06 }));
  const zflag = flag3(sc, [0, 9.6, -55], '#c94b3a', 2, 1.1, 3);
  // flocks and herds outside the walls
  const sheep = new T3.InstancedMesh(new T3.SphereGeometry(0.26, 10, 8), new T3.MeshLambertMaterial({ color: col('#fffaf0') }), 70);
  const cows = new T3.InstancedMesh(new T3.BoxGeometry(1.4, 0.8, 0.6), new T3.MeshLambertMaterial({ color: col('#8a5a35') }), 18);
  for (let i = 0; i < 70; i++) { const fx = -40 + r() * 80, fz = -18 - r() * 12; dm.position.set(fx + (i % 2 ? 22 : -22) * (r() < 0.3 ? 1 : 0), 0.4, fz); dm.scale.set(1.3, 0.9, 1); dm.updateMatrix(); sheep.setMatrixAt(i, dm.matrix); }
  for (let i = 0; i < 18; i++) { dm.position.set(-40 + r() * 80, 0.3, -20 - r() * 10); dm.scale.set(0.55, 0.55, 0.55); dm.rotation.y = r() * PI; dm.updateMatrix(); cows.setMatrixAt(i, dm.matrix); }
  sheep.castShadow = cows.castShadow = true; sc.add(sheep); sc.add(cows);
  // tiny people in the streets (2D sprites)
  const ptex = ['#c94b3a', '#4a8fc4', '#e1a23c', '#3f9a6a', '#7a5aa8'].map((c, i) => canvasTex(128, 192, g => person(g, { x: 64, y: 186, s: 0.42, robe: c, head: i % 2 ? 'veil' : null, headCol: '#d9c08f', idle: false, id: 'tiny' + i })));
  for (let i = 0; i < 70; i++) {
    const s = new T3.Sprite(new T3.SpriteMaterial({ map: ptex[i % 5] })); const kid = r() < 0.25 ? 0.65 : 1;
    s.center.set(0.5, 0.03); s.position.set(-19 + r() * 38, 0, -35 - r() * 32); s.scale.set(1.1 * kid, 1.65 * kid, 1); sc.add(s);
  }
  const J = LEAD(sc), cam = newCam();
  const jy = -4 + Math.sqrt(144 - 0.25);
  return function (t) {
    const tAnd = wt(11, 'And') - 0.1;
    zflag.userData.update(NOW);
    cam3(cam, t, [[0, { p: [0.6, jy + 1.35, 6.4], l: [0.1, jy + 1.05, 0] }], [0.35, { p: [0.6, jy + 1.35, 6.4], l: [0.1, jy + 1.05, 0] }], [tAnd, { p: [0, jy + 6, 12], l: [0, 1, -48] }],
      [tAnd, { p: [3.5, jy + 3, 9.5], l: [0, 1, -50] }, 'cut']]);
    J.sketch({ ...jonahFrame(t, [[0, 'sit']], { dir: 1, life: 0.6 }), back: true }).at(0, jy, 3.5, cam);
    return { scene: sc, camera: cam };
  };
}

// ------------------------------------------------------------------ shot table (same order as SHOTS; shots 6 and 7 are one take)
let SETS = null;
function buildSets() {
  const fishSet = makeFish(), ship = makeShip(), beach = makeBeach();
  SETS = {
    1: t => fishSet.shot1(t),
    2: makeHarbor(),
    3: t => ship.shot3(t),
    4: t => ship.shot4(t),
    5: makeSea(),
    6: t => {
      const T7 = SHOTS[6].a - SHOTS[5].a, tSpat = T7 + wt(7, 'spat');
      if (t < tSpat - 0.05) {
        const f = fishSet.pray(t, wt(6, 'days'), wt(6, 'nights,'), wt(6, 'prayed'));
        const flood = seg(t, T7 - 0.1, tSpat - 0.05);
        return { ...f, post: g => { glow(g, W + 100, 1000, 1400 * flood + 1, '255,245,220', flood * 1.2); if (flood > 0.6) { g.fillStyle = `rgba(255,248,232,${(flood - 0.6) / 0.4})`; g.fillRect(0, 0, W, H); } } };
      }
      const f = beach(t - T7), rev = seg(t, tSpat - 0.05, tSpat + 0.45);
      return { ...f, post: g => { if (rev < 1) { g.fillStyle = `rgba(255,248,232,${1 - rev})`; g.fillRect(0, 0, W, H); } } };
    },
    8: makeGate(),
    9: makeSquare(),
    10: makeHill(),
    11: makeCity(),
  };
  SETS[7] = SETS[6];
}
