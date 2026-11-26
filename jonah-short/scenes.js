// The 11 shots. Each draws a full frame at local time t (seconds from its shot start).
const JONAH = { id: 'J', robe: '#3f6fa8', stripes: ['#3f6fa8', '#d9c39a'], belt: '#c49a5a', satchel: true, head: 'wrap', headCol: '#d9c08f', beard: 'short', beardCol: '#3a2a20' };
const SAILORS = [
  { id: 'S0', head: 'scarf', tunic: true, robe: '#b79f78' },
  { id: 'S1', head: 'cap', tunic: true, robe: '#9b8466' },
  { id: 'S2', beard: 'full', beardCol: '#6b4a2e', tunic: true, robe: '#7f8b69' },
  { id: 'S3', head: 'headband', tunic: true, robe: '#a9845e' },
];
const KING_SACK = { id: 'K', sack: true, beard: 'curly' };
const A = (n, l) => SHOTS[n - 1].a + l;   // shot-local time -> absolute film time

// Camera cuts inside shots (dissolved by main.js) and the one dead hold on a gag line.
function subcuts() {
  return [
    { t: A(1, wt(1, 'fish,') + 0.25), type: 'dissolve' },
  ];
}
function holds() { return [[A(9, wt(9, 'the', 3)), SHOTS[8].b - 0.16]]; }
// Ambient motes per shot index: [rgb, count, size, rise speed]
const MOTES = [
  ['140,240,220', 28, 4, 22], ['255,225,170', 30, 4, 12], null, null, ['220,250,255', 40, 4, 70],
  ['140,240,220', 28, 4, 22], ['255,230,190', 26, 4, 10], ['255,240,200', 26, 4, 8],
  ['255,225,150', 36, 5, 14], ['255,255,230', 20, 4, 6], ['255,210,140', 38, 4, 10],
];
const CLASP = { l: [22, -118], r: [22, -118] };
const DOWN = { l: [14, 4], r: [14, 4] };

// ------------------------------------------------------------ 1. inside the fish (0.0–4.8)
function s1(g, t) {
  const cam = kf(t, [[0, { x: 560, y: 1035, z: 2.7 }], [0.7, { x: 560, y: 1035, z: 2.7 }], [3.9, { x: 540, y: 990, z: 1 }]]);
  withCam(g, cam, 0.7, () => ribs(g, t, 540, 980));
  withCam(g, cam, 1, () => {
    beam(g, 900, -300, 240, 620, 1560, 560, '110,235,215', 0.30);
    drips(g, t, [290, 780, 650, 420], -200, 1500);
    shadow(g, 540, 1452, 120, 0.4);
    person(g, { ...JONAH, x: 540, y: 1450, s: 1.25, dir: 1, eyes: 'wide', look: -0.4, brows: 'worried', mouth: 'wobbly', sweat: true, arms: { l: [24, -30], r: [24, -30] } });
    glow(g, 600, 1030, 300, '110,235,215', 0.18);
  });
}

// ------------------------------------------------------------ 2. Joppa harbor (4.8–11.1)
function harborScene(g, t, cam, s) {
  g.fillStyle = vgrad(g, 0, H, [[0, '#7fa8cf'], [0.42, '#f1c792'], [0.6, '#f6aa66'], [1, '#f6aa66']]); g.fillRect(0, 0, W, H);
  withCam(g, cam, 0.12, () => {
    glow(g, 180, 1010, 700, '255,205,140', 0.9); circle(g, 180, 1010, 105); fill(g, '#fff3d0');
    cloud(g, 760, 560, 0.75, '#fde6cf', '#f1c09e'); cloud(g, 1500, 420, 1, '#fde6cf', '#f1c09e'); cloud(g, 2100, 640, 0.7, '#fde6cf', '#f1c09e');
  });
  withCam(g, cam, 0.35, () => {
    g.beginPath(); g.moveTo(-900, 1300); for (let x = -900; x <= 1250; x += 50) g.lineTo(x, 1090 - Math.sin(x / 260) * 50 - Math.sin(x / 90) * 10); g.lineTo(1250, 1300); fs(g, '#d99a62', 4);
    g.fillStyle = vgrad(g, 1100, 1500, [[0, '#6aa6c4'], [1, '#3f86aa']]); g.fillRect(1150, 1105, 3000, 800);
    for (let i = 0; i < 40; i++) { const r = rng(i + 3); sparkle(g, 1200 + r() * 2200, 1120 + r() * 220, 8 + r() * 10, 0.4 + 0.4 * Math.sin(t * 3 + i)); }
  });
  withCam(g, cam, 0.7, () => {
    const r = rng(11);
    for (let i = 0; i < 9; i++) {
      const x = -500 + i * 150, w = 120 + r() * 60, h = 120 + r() * 140, y = 1360;
      rrect(g, x, y - h, w, h, 6); fs(g, ['#e8c48e', '#dcae78', '#efd2a2'][i % 3], 5);
      rrect(g, x + w * 0.4, y - 60, 30, 60, [14, 14, 0, 0]); fs(g, '#5a3a24', 4);
      rrect(g, x + 18, y - h + 26, 22, 22, 4); fs(g, '#5a3a24', 4);
    }
  });
  withCam(g, cam, 1, () => {
    // water and ship to the right (west)
    g.fillStyle = '#3f86aa'; g.fillRect(1700, 1380, 2000, 900);
    waves(g, t, 1470, '#3a7ea2', 'rgba(255,255,255,0.5)', 10, 160, 1.2, 1700, 3400);
    // ship
    g.beginPath(); g.moveTo(1990, 1320); g.lineTo(2760, 1320); g.quadraticCurveTo(2730, 1480, 2620, 1520); g.lineTo(2110, 1520); g.quadraticCurveTo(2010, 1470, 1990, 1320); fs(g, '#8a5a35', 7);
    for (let i = 1; i < 4; i++) line(g, 2010 + i * 6, 1320 + i * 48, 2740 - i * 20, 1320 + i * 48, 4, 'rgba(42,31,25,0.5)');
    line(g, 2360, 1320, 2360, 640, 14); line(g, 2360, 1320, 2360, 640, 7, '#7a4a2a');
    g.beginPath(); g.moveTo(2190, 720); g.quadraticCurveTo(2380, 760, 2560, 720); g.lineTo(2580, 1180); g.quadraticCurveTo(2380, 1230, 2170, 1180); g.closePath(); fs(g, '#efe2c4', 6);
    g.save(); g.clip(); g.fillStyle = '#c94b3a'; g.fillRect(2100, 880, 600, 60); g.restore();
    flag(g, 2360, 650, '#c94b3a', 110, 0);
    // quay
    g.fillStyle = '#dcb47c'; g.fillRect(-1200, 1480, 2980, 900); line(g, -1200, 1480, 1780, 1480, 6);
    for (let i = 0; i < 30; i++) line(g, -1100 + i * 110, 1480, -1140 + i * 110, 2300, 3, 'rgba(120,80,40,0.25)');
    line(g, -1200, 1700, 1780, 1700, 3, 'rgba(120,80,40,0.25)');
    rrect(g, 1560, 1470, 260, 40, 4); fs(g, '#8a5a35', 5);
    // gangplank
    poly(g, [[1730, 1478], [1760, 1500], [2120, 1336], [2090, 1318]]); fs(g, '#a36c3c', 5);
    for (let i = 1; i < 7; i++) { const k = i / 7; line(g, lerp(1735, 2095, k), lerp(1480, 1320, k), lerp(1765, 2125, k), lerp(1498, 1338, k), 3); }
    // signpost: NINEVEH points inland (left)
    rrect(g, 352, 1080, 26, 480, 4); fs(g, '#7a4f2c', 5);
    poly(g, [[180, 1140], [240, 1090], [560, 1090], [560, 1190], [240, 1190]]); fs(g, '#a36c3c', 6);
    textSign(g, 'NINEVEH', 390, 1142, 54, '#fff4dc', 900);
    rrect(g, 1652, 1290, 20, 200, 4); fs(g, '#7a4f2c', 5);
    poly(g, [[1560, 1300], [1790, 1300], [1830, 1340], [1790, 1380], [1560, 1380]]); fs(g, '#a36c3c', 5);
    textSign(g, 'TARSHISH', 1690, 1341, 34, '#fff4dc', 900);
    s(); // characters
  });
}
function s2(g, t) {
  const tJ = wt(2, 'He'), tTicket = wt(2, 'ticket'), tOpp = wt(2, 'opposite');
  const tc = tJ - 0.1;
  const cam = kf(t, [[0, { x: 420, y: 1200, z: 1.32 }], [0.6, { x: 420, y: 1200, z: 1.32 }], [tc, { x: 620, y: 1220, z: 1.3 }],
    [tc, { x: 1330, y: 1240, z: 1.42 }, 'cut'], [tOpp, { x: 1360, y: 1240, z: 1.42 }], [6.0, { x: 1840, y: 1240, z: 1.25 }]]);
  harborScene(g, t, cam, () => {
    const turned = t >= tJ - 0.1;
    shadow(g, 1180, 1572, 90, 0.28, 180); shadow(g, 1560, 1572, 90, 0.28, 180); shadow(g, 370, 1562, 40, 0.25, 260);
    person(g, { ...JONAH, xb: [A(2, tJ - 0.1)], x: 1180, y: 1570, s: 1.1, dir: turned ? 1 : -1, eyes: 'dot', brows: turned ? 'raised' : 'worried', mouth: turned ? 'smile' : 'frown',
      arms: t > tTicket - 0.35 ? { l: [14, 4], r: [78, 84] } : DOWN });
    person(g, { ...SAILORS[1], x: 1560, y: 1570, s: 1.1, dir: -1, eyes: 'dot', mouth: 'smile', arms: t > tTicket - 0.2 ? { l: [62, 70], r: [14, 4] } : DOWN });
    // coins
    const k = seg(t, tTicket - 0.05, tTicket + 0.45);
    if (k > 0 && k < 1) for (let i = 0; i < 3; i++) {
      const kk = clamp(k * 1.4 - i * 0.2);
      const x = lerp(1362, 1418, kk), y = lerp(1312, 1360, kk) - Math.sin(kk * PI) * 170;
      ell(g, x, y, 15, 15 * Math.abs(Math.cos(t * 14 + i))); fs(g, '#f2c13c', 4);
    }
    if (k >= 1) { circle(g, 1418, 1362, 14); fs(g, '#f2c13c', 4); sparkle(g, 1430, 1340, 26, clamp(1 - (t - tTicket - 0.45) * 2)); }
  });
}

// ------------------------------------------------------------ 3 & 4. the storm deck
function deck(g, t, cam, flash, chars) {
  g.save(); g.translate(W / 2, H * 0.7); g.rotate(0.035 * Math.sin(t * 1.7)); g.translate(-W / 2, -H * 0.7);
  g.fillStyle = vgrad(g, 0, H, [[0, '#121b2b'], [0.5, '#2c3d55'], [1, '#2c3d55']]); g.fillRect(-300, -300, W + 600, H + 600);
  withCam(g, cam, 0.15, () => {
    for (let i = 0; i < 6; i++) cloud(g, -200 + i * 480 + Math.sin(t * 0.5 + i) * 30, 380 + (i % 2) * 160, 1.6, '#3b4a61', '#2b374a', 'rgba(10,10,20,0.4)');
  });
  withCam(g, cam, 0.5, () => {
    waves(g, t, 1160, '#1e3a52', 'rgba(220,235,255,0.6)', 60, 300, 2.2);
    waves(g, t + 1, 1240, '#18324a', 'rgba(220,235,255,0.5)', 45, 220, 2.8);
  });
  withCam(g, cam, 1, () => {
    // mast and torn sail
    line(g, 940, 1460, 940, -400, 26); line(g, 940, 1460, 940, -400, 16, '#6b4428');
    g.beginPath(); g.moveTo(950, 200); g.quadraticCurveTo(1150 + Math.sin(t * 6) * 40, 420, 1260, 360); g.lineTo(1230, 760); g.lineTo(1150, 700); g.lineTo(1100, 820); g.quadraticCurveTo(1020, 700, 950, 760); g.closePath(); fs(g, '#cfc3a6', 6);
    // rail
    for (let x = -600; x < 3000; x += 160) { rrect(g, x, 1300, 22, 170, 4); fs(g, '#7a4a2a', 5); }
    rrect(g, -700, 1290, 3800, 30, 6); fs(g, '#8d5a33', 5);
    // deck planks
    g.fillStyle = '#9a6a40'; g.fillRect(-800, 1460, 3900, 1100); line(g, -800, 1460, 3100, 1460, 7);
    for (let i = 0; i < 9; i++) line(g, -800, 1520 + i * 70 + i * i * 6, 3100, 1520 + i * 70 + i * i * 6, 3, 'rgba(42,31,25,0.4)');
    for (let x = -800; x < 3100; x += 90) ell(g, x, 1460, 0, 0);
    chars();
  });
  rain(g, t, 170, 0.4);
  g.restore();
  if (flash > 0) { g.fillStyle = `rgba(225,235,255,${flash * 0.55})`; g.fillRect(0, 0, W, H); }
}
function s3(g, t) {
  const tA = wt(3, 'He'), tB = wt(3, 'asleep'), tBelow = wt(3, 'below');
  const flash = flashAmt(t, [0.35, 2.4]);
  const cam = kf(t, [[0, { x: 260, y: 1250, z: 1.32 }], [0.25, { x: 260, y: 1250, z: 1.32 }], [tA - 0.25, { x: 1640, y: 1250, z: 1.32 }],
    [tB - 0.05, { x: 2080, y: 1700, z: 1.6 }], [tB + 0.35, { x: 2080, y: 1720, z: 7 }]]);
  const dark = seg(t, tB, tB + 0.3);
  if (dark < 1) {
    deck(g, t, cam, flash, () => {
      // hatch, warm light leaking out
      poly(g, [[1940, 1660], [2220, 1660], [2260, 1760], [1900, 1760]]); fs(g, '#5a3a22', 7);
      poly(g, [[1965, 1675], [2195, 1675], [2225, 1745], [1935, 1745]]); fs(g, '#120a06', 4);
      glow(g, 2080, 1710, 260, '255,170,80', 0.45);
      const sail = (i, o) => { shadow(g, o.x, o.y + 4, 80, 0.3); person(g, { ...SAILORS[i], s: 1.1, y: 1650, ...o }); };
      sail(0, { x: 260, dir: 1, arms: { l: [165, 172], r: [165, 172] }, eyes: 'wide', look: 0.3, brows: 'worried', mouth: 'open' });
      sail(1, { x: 700, dir: -1, arms: CLASP, eyes: 'closed', brows: 'worried', mouth: 'wobbly' });
      sail(2, { x: 1170, dir: 1, pose: 'kneel', bow: 0.6, arms: { l: [120, 160], r: [120, 160] }, eyes: 'closed', brows: 'worried', mouth: 'frown' });
      sail(3, { x: 1620, dir: -1, arms: { l: [80, 150], r: [80, 150] }, eyes: 'wide', look: 0, brows: 'worried', mouth: 'o' });
      bolt(g, 1400, -600, 1000, 3, flash);
    });
    if (dark > 0) { g.fillStyle = `rgba(8,5,3,${dark})`; g.fillRect(0, 0, W, H); }
  } else {
    belowDeck(g, t - tB);
    const k = 1 - seg(t, tB + 0.3, tB + 0.65); if (k > 0) { g.fillStyle = `rgba(8,5,3,${k})`; g.fillRect(0, 0, W, H); }
  }
}
function belowDeck(g, t) {
  const cam = kf(t, [[0.3, { x: 560, y: 1150, z: 1.15 }], [2.0, { x: 560, y: 1120, z: 1.3 }]]);
  withCam(g, cam, 1, () => {
    g.fillStyle = vgrad(g, 0, H, [[0, '#2a1a10'], [0.5, '#4a2e1a'], [1, '#2a1a10']]); g.fillRect(-500, -500, 2200, 3000);
    for (let x = -400; x < 1600; x += 110) line(g, x, -500, x, 2500, 4, 'rgba(15,8,4,0.6)');
    g.fillStyle = '#3a2414'; g.fillRect(-500, 1520, 2200, 1000); line(g, -500, 1520, 1700, 1520, 6);
    // posts and hammock
    rrect(g, 120, 700, 40, 900, 6); fs(g, '#6b4428'); rrect(g, 960, 700, 40, 900, 6); fs(g, '#6b4428');
    line(g, 160, 1080, 240, 1220, 5); line(g, 960, 1080, 880, 1220, 5);
    const sw = Math.sin(t * 1.6) * 6;
    person(g, { ...JONAH, x: 870 + sw, y: 1250, s: 1.02, rot: -PI / 2, dir: 1, eyes: 'closed', mouth: 'o', arms: { l: [10, 0], r: [10, 0] } });
    g.beginPath(); g.moveTo(240, 1220); g.quadraticCurveTo(560 + sw, 1450, 880, 1220); g.lineTo(870, 1260); g.quadraticCurveTo(560 + sw, 1390, 250, 1270); g.closePath();
    fs(g, '#d8c7a2', 6);
    for (let i = 1; i < 8; i++) { const x = lerp(260, 860, i / 8); line(g, x, 1240 + Math.sin(i / 8 * PI) * 110, x, 1270 + Math.sin(i / 8 * PI) * 150, 3, 'rgba(42,31,25,0.4)'); }
    // lantern
    line(g, 640, 600, 640 + Math.sin(t * 1.6) * 20, 780, 4);
    const lx = 640 + Math.sin(t * 1.6) * 22;
    rrect(g, lx - 34, 780, 68, 90, 12); fs(g, '#ffcf73', 6); line(g, lx - 34, 800, lx + 34, 800, 5); line(g, lx - 34, 850, lx + 34, 850, 5);
    glow(g, lx, 825, 650, '255,170,80', 0.55); glow(g, lx, 825, 140, '255,230,170', 0.6);
    // Zzz
    for (let i = 0; i < 3; i++) {
      const p = mod(t * 0.7 + i / 3, 1);
      g.save(); g.globalAlpha = Math.sin(p * PI); g.font = `900 ${40 + p * 40}px Montserrat`; g.textAlign = 'center';
      g.lineWidth = 8; g.strokeStyle = OUT; g.strokeText('Z', 430 + p * 80, 1150 - p * 260); g.fillStyle = '#fff4dc'; g.fillText('Z', 430 + p * 80, 1150 - p * 260); g.restore();
    }
  });
}
function s4(g, t) {
  const tCast = wt(4, 'cast'), tFell = wt(4, 'fell'), tJ = wt(4, 'him.'), tThrow = wt(4, '“Throw');
  const flash = flashAmt(t, [tJ]);
  const cam = kf(t, [[0, { x: 520, y: 1470, z: 1.9 }], [tFell - 0.15, { x: 560, y: 1480, z: 1.9 }], [tJ, { x: 820, y: 1560, z: 1.9 }],
    [tJ + 0.35, { x: 700, y: 1300, z: 1.12 }], [tThrow - 0.15, { x: 900, y: 1210, z: 1.55 }, 'cut']]);
  deck(g, t + 6.4, cam, flash, () => {
    // barrel with lots
    shadow(g, 520, 1662, 110, 0.35);
    g.beginPath(); g.moveTo(430, 1440); g.quadraticCurveTo(410, 1550, 435, 1660); g.lineTo(605, 1660); g.quadraticCurveTo(630, 1550, 610, 1440); g.closePath(); fs(g, '#8d5a33', 7);
    [1475, 1620].forEach(y => line(g, 420, y, 620, y, 10, '#5b5f66'));
    ell(g, 520, 1440, 90, 26); fs(g, '#a87446', 6);
    const r = rng(5);
    for (let i = 0; i < 5; i++) { const jump = Math.max(0, Math.sin(seg(t, tCast, tCast + 0.4) * PI)) * 40 * (0.5 + r()); ell(g, 470 + i * 24, 1432 - jump, 11, 8); fs(g, '#cfc7b8', 4); }
    // the lot that rolls to Jonah's feet
    const k = sstep(t, tFell - 0.1, tJ - 0.05);
    const lx = lerp(560, 800, k), ly = lerp(1430, 1662, k) - Math.sin(k * PI) * 90;
    glow(g, lx, ly, 70, '255,230,150', k * 0.7);
    ell(g, lx, ly, 13, 10); fs(g, '#f3e7c8', 4);
    const stare = t > tJ - 0.05;
    const sail = (i, o) => { shadow(g, o.x, o.y + 4, 80, 0.3); person(g, { ...SAILORS[i], s: 1.08, y: 1660, eyes: 'wide', brows: stare ? 'raised' : 'worried', mouth: stare ? 'o' : 'line', ...o }); };
    sail(0, { x: 120, dir: 1, look: stare ? 1 : 0.3 });
    sail(2, { x: 300, dir: 1, look: stare ? 1 : 0.3 });
    sail(1, { x: 1090, dir: -1, look: stare ? -1 : -0.3 });
    sail(3, { x: 1260, dir: -1, look: stare ? -1 : -0.3 });
    shadow(g, 860, 1664, 85, 0.3);
    const speaking = t > tThrow - 0.15;
    person(g, { ...JONAH, xb: [A(4, tThrow - 0.15)], x: 860, y: 1660, s: 1.1, dir: 1, eyes: speaking ? 'dot' : 'wide', brows: speaking ? 'flat' : 'raised', mouth: speaking ? 'open' : 'line',
      arms: speaking ? { l: [14, 4], r: [128, 120] } : DOWN });
    bolt(g, 200, -700, 900, 9, flash);
  });
}

// ------------------------------------------------------------ 5. underwater (22.8–26.3)
function s5(g, t) {
  const tStill = wt(5, 'still.'), tFish = wt(5, 'fish'), tSw = wt(5, 'swallowed');
  const cam = kf(t, [[0, { x: 540, y: 940, z: 1.05 }], [3.5, { x: 540, y: 1010, z: 1.0 }]]);
  g.fillStyle = vgrad(g, 0, H, [[0, '#8fdaee'], [0.35, '#3d97c4'], [1, '#0c2f4f']]); g.fillRect(0, 0, W, H);
  withCam(g, cam, 0.6, () => {
    for (let i = 0; i < 5; i++) beam(g, 120 + i * 230, -100, 110, 300 + i * 260, 1900, 300, '220,250,255', 0.16 + 0.05 * Math.sin(t * 2 + i));
    const calm = seg(t, 0.4, tStill + 0.3);
    waves(g, t, 70, 'rgba(0,0,0,0)', 'rgba(255,255,255,0.7)', lerp(26, 4, calm), 180, 1.5);
  });
  withCam(g, cam, 1, () => {
    // splash
    const sp = seg(t, 0, 0.8);
    if (sp < 1) for (let i = 0; i < 14; i++) { const r = rng(i + 40); circle(g, 540 + (r() - 0.5) * 300, 160 + r() * 200 - sp * 120, (8 + r() * 18) * (1 - sp)); stroke(g, 4, `rgba(255,255,255,${0.8 * (1 - sp)})`); }
    const jy = lerp(-120, 900, easeOut(seg(t, 0, tSw)));
    const k = sstep(t, tFish - 0.7, tSw);           // fish rises
    const out = sstep(t, tSw + 0.35, 3.5);           // fish glides away
    const m = t < tSw + 0.15 ? sstep(t, tFish - 0.2, tFish + 0.35) : 1 - sstep(t, tSw + 0.15, tSw + 0.4);
    const fx = lerp(-430, 167, k) + out * 700, fy = lerp(1920, 1217, k) + out * 600, fr = lerp(-0.75, 0.35, out);
    if (t > tFish - 0.8) fish(g, fx, fy, 0.9, fr, m);
    const eaten = t > tSw + 0.28;
    if (!eaten) {
      for (let i = 0; i < 6; i++) { const r = rng(i + 70); const p = mod(t * 0.8 + r(), 1); circle(g, 540 + (r() - 0.5) * 120, jy - 380 - p * 360, 6 + r() * 10); stroke(g, 4, `rgba(255,255,255,${0.7 * (1 - p)})`); }
      person(g, { ...JONAH, x: 560, y: jy, s: 1.0, rot: 0.22, dir: 1, eyes: 'wide', look: 0.6, brows: 'worried', mouth: 'o', arms: { l: [160, 172], r: [150, 168] } });
    }
  });
  const dk = seg(t, 2.6, 3.6); if (dk > 0) { g.fillStyle = `rgba(4,14,28,${dk * 0.75})`; g.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------ 6 + 7. one take: prayer, then the beach (26.3–32.1)
function s67(g, t) {
  const T7 = SHOTS[6].a - SHOTS[5].a;           // 3.0
  const tDays = wt(6, 'days'), tNights = wt(6, 'nights,'), tPray = wt(6, 'prayed');
  const tSpat = T7 + wt(7, 'spat');
  const flood = seg(t, T7 - 0.1, tSpat - 0.05), reveal = seg(t, tSpat - 0.05, tSpat + 0.45);
  if (t < tSpat - 0.05) {
    const cam = kf(t, [[0, { x: 540, y: 1150, z: 1.05 }], [T7, { x: 540, y: 1120, z: 1.32 }]]);
    withCam(g, cam, 0.7, () => ribs(g, t, 540, 980));
    withCam(g, cam, 1, () => {
      beam(g, 560, -400, 200, 540, 1560, 460, '110,235,215', 0.30);
      // tally marks scratched into the rib wall
      [tDays, tNights, tPray].forEach((tm, i) => { const a = seg(t, tm - 0.05, tm + 0.15); if (a > 0) { g.save(); g.globalAlpha = a; line(g, 150 + i * 34, 760, 160 + i * 34, 900, 12, '#f2e6cf'); line(g, 150 + i * 34, 760, 160 + i * 34, 900, 4, '#8a7a66'); g.restore(); } });
      drips(g, t, [300, 820], -200, 1500);
      shadow(g, 540, 1500, 130, 0.45);
      person(g, { ...JONAH, x: 540, y: 1500, s: 1.2, dir: 1, pose: 'kneel', arms: CLASP, eyes: 'closed', brows: 'flat', mouth: 'line' });
      glow(g, 560, 1100, 360, '110,235,215', 0.2);
    });
    // light floods in from the opening mouth
    glow(g, W + 100, 1000, 1400 * flood + 1, '255,245,220', flood * 1.2);
    if (flood > 0.6) { g.fillStyle = `rgba(255,248,232,${(flood - 0.6) / 0.4})`; g.fillRect(0, 0, W, H); }
    return;
  }
  const tb = t - T7;
  const cam = kf(tb, [[0, { x: 540, y: 1300, z: 1.0 }], [2.8, { x: 500, y: 1330, z: 1.07 }]]);
  g.fillStyle = vgrad(g, 0, H, [[0, '#8ea4d6'], [0.32, '#f3b0a6'], [0.5, '#ffd68c'], [1, '#ffd68c']]); g.fillRect(0, 0, W, H);
  withCam(g, cam, 0.2, () => { glow(g, 640, 1130, 800, '255,200,140', 0.9); circle(g, 640, 1150, 120); fill(g, '#fff0c2'); cloud(g, 230, 620, 0.7, '#ffe3da', '#f2b9b0'); cloud(g, 900, 420, 0.9, '#ffe3da', '#f2b9b0'); });
  withCam(g, cam, 1, () => {
    g.fillStyle = vgrad(g, 1150, 1520, [[0, '#6a8fc7'], [1, '#86c0db']]); g.fillRect(-600, 1150, 2400, 500);
    for (let i = 0; i < 20; i++) { const r = rng(i + 90); sparkle(g, -100 + r() * 1300, 1170 + r() * 260, 7 + r() * 8, 0.5 + 0.4 * Math.sin(tb * 3 + i)); }
    const fk = sstep(tb, 0.2, 2.6);
    fish(g, lerp(880, 1500, fk), lerp(1330, 1460, fk), 0.5, 0.1, 0, 1);
    waves(g, tb, 1420, '#7cb8d6', 'rgba(255,255,255,0.85)', 14, 200, 1.4);
    g.fillStyle = '#f1d29e'; g.beginPath(); g.moveTo(-600, 1560); for (let x = -600; x <= 1800; x += 40) g.lineTo(x, 1530 + Math.sin(x / 140 + tb * 2) * 10); g.lineTo(1800, 2600); g.lineTo(-600, 2600); g.closePath(); fs(g, '#f1d29e', 6);
    for (let i = 0; i < 18; i++) { const r = rng(i + 150); ell(g, r() * 1100, 1620 + r() * 400, 6, 3); fill(g, 'rgba(160,110,60,0.35)'); }
    shadow(g, 420, 1762, 170, 0.3);
    person(g, { ...JONAH, x: 380, y: 1760, s: 1.4, dir: 1, pose: 'kneel', rot: 0.42, bow: 0.8, arms: { l: [-8, -4], r: [8, 6] }, seaweed: true, eyes: 'wide', look: 0.5, brows: 'raised', mouth: 'wobbly' });
  });
  if (reveal < 1) { g.fillStyle = `rgba(255,248,232,${1 - reveal})`; g.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------ 8. Nineveh's gate (32.1–37.5)
function lamassu(g, x, y, dir) {
  rrect(g, x - 150, y - 40, 300, 40, 4); fs(g, '#b89b6c');
  [-100, -50, 60, 105].forEach(o => { rrect(g, x + o - 20, y - 190, 40, 152, 8); fs(g, '#d6c095'); });
  rrect(g, x - 130, y - 300, 260, 140, 40); fs(g, '#dcc79e');
  g.beginPath(); g.moveTo(x - dir * 80, y - 280); g.quadraticCurveTo(x - dir * 120, y - 470, x + dir * 60, y - 430); g.quadraticCurveTo(x + dir * 40, y - 330, x + dir * 40, y - 280); g.closePath(); fs(g, '#cdb586');
  for (let i = 0; i < 4; i++) line(g, x - dir * (70 - i * 8), y - 300 - i * 34, x + dir * (30 + i * 5), y - 300 - i * 34 - 20, 4, 'rgba(42,31,25,0.6)');
  const hx = x + dir * 150, hy = y - 330;
  rrect(g, hx - 34, hy + 20, 68, 120, [8, 8, 30, 30]); fs(g, '#7b6648');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { g.beginPath(); g.arc(hx - 20 + c * 20, hy + 40 + r * 26, 6, 0.1, PI + 1.2); stroke(g, 3, '#a89272'); }
  circle(g, hx, hy, 46); fs(g, '#e2d2ad');
  rrect(g, hx - 40, hy - 120, 80, 90, 6); fs(g, '#cdb586');
  for (let i = 0; i < 3; i++) line(g, hx - 40, hy - 100 + i * 26, hx + 40, hy - 106 + i * 26, 4);
  circle(g, hx + dir * 8 - 14, hy - 4, 5); fill(g, OUT); circle(g, hx + dir * 8 + 14, hy - 4, 5); fill(g, OUT);
}
function s8(g, t) {
  const tSaid = wt(8, 'said'), t40 = wt(8, '“40');
  const cam = kf(t, [[0, { x: 540, y: 1060, z: 1.0 }], [0.4, { x: 540, y: 1060, z: 1.0 }], [tSaid, { x: 600, y: 1340, z: 1.14 }],
    [t40 - 0.15, { x: 560, y: 1380, z: 1.38 }, 'cut']]);
  g.fillStyle = vgrad(g, 0, H, [[0, '#7fc6ec'], [0.5, '#fff2cc'], [1, '#fff2cc']]); g.fillRect(0, 0, W, H);
  withCam(g, cam, 0.1, () => { glow(g, 900, 250, 700, '255,255,235', 1); circle(g, 900, 250, 110); fill(g, '#ffffff'); });
  withCam(g, cam, 0.75, () => {
    g.fillStyle = '#dcb67e'; g.fillRect(-900, 860, 2900, 700);
    for (let x = -900; x < 2000; x += 90) { rrect(g, x, 800, 54, 70, 4); fs(g, '#dcb67e', 5); }
    line(g, -900, 862, 2000, 862, 6);
    for (let r = 0; r < 9; r++) for (let x = -900 + (r % 2) * 45; x < 2000; x += 90) line(g, x, 900 + r * 60, x, 960 + r * 60, 2, 'rgba(120,80,40,0.3)');
    for (let r = 0; r < 9; r++) line(g, -900, 900 + r * 60, 2000, 900 + r * 60, 2, 'rgba(120,80,40,0.3)');
    // blue glazed gate
    g.beginPath(); g.moveTo(330, 1500); g.lineTo(330, 1080); g.arc(540, 1080, 210, PI, TAU); g.lineTo(750, 1500); g.closePath(); fs(g, '#2f5ea8', 7);
    g.beginPath(); g.moveTo(400, 1500); g.lineTo(400, 1110); g.arc(540, 1110, 140, PI, TAU); g.lineTo(680, 1500); g.closePath(); fs(g, '#3b2a1c', 6);
    for (let i = 0; i < 6; i++) { circle(g, 365, 1130 + i * 60, 12); fs(g, '#f2c94c', 3); circle(g, 715, 1130 + i * 60, 12); fs(g, '#f2c94c', 3); }
    g.fillStyle = '#e7c38c'; g.fillRect(-900, 1500, 2900, 600); line(g, -900, 1500, 2000, 1500, 5);
    lamassu(g, 170, 1500, -1); lamassu(g, 910, 1500, 1);
    [[-260, '#2f5ea8', 0], [60, '#c94b3a', 1.3], [1020, '#c94b3a', 2.1], [1340, '#2f5ea8', 0.7]].forEach(([fx, c, p]) => flag(g, fx, 800, c, 100, p));
  });
  withCam(g, cam, 1, () => {
    g.fillStyle = '#ecd2a4'; g.fillRect(-900, 1640, 3000, 900);
    // market stall awnings
    [[-80, '#c94b3a'], [1180, '#3f8a9a']].forEach(([x, c]) => {
      rrect(g, x - 10, 1380, 16, 300, 3); fs(g, '#7a4f2c', 4); rrect(g, x + 220, 1380, 16, 300, 3); fs(g, '#7a4f2c', 4);
      g.beginPath(); g.moveTo(x - 30, 1400); g.lineTo(x + 256, 1400); g.lineTo(x + 230, 1330); g.lineTo(x, 1330); g.closePath(); fill(g, c);
      g.save(); g.clip(); for (let i = 0; i < 6; i++) { g.fillStyle = '#f6ead2'; g.fillRect(x - 30 + i * 52, 1320, 26, 100); } g.restore();
      g.beginPath(); g.moveTo(x - 30, 1400); g.lineTo(x + 256, 1400); g.lineTo(x + 230, 1330); g.lineTo(x, 1330); g.closePath(); stroke(g);
      rrect(g, x - 20, 1540, 270, 60, 6); fs(g, '#a36c3c');
      for (let i = 0; i < 5; i++) { circle(g, x + 20 + i * 50, 1528, 20); fs(g, ['#f29f3c', '#e0503d', '#8cbf4a'][i % 3], 4); }
    });
    const turned = t > t40 - 0.1;
    const r = rng(21);
    const crowd = [];
    const robes = ['#c94b3a', '#e1a23c', '#4a8fc4', '#7a5aa8', '#3f9a6a', '#d6795a', '#2f6f8f', '#b8487a', '#9a7a3a'];
    const heads = [{ head: 'veil', headCol: '#e6c46a' }, { head: 'hair', headCol: '#2e2420' }, { beard: 'short' }, { head: 'veil', headCol: '#5aa0c4' }, { head: 'hair', headCol: '#5a3d28', beard: 'short', beardCol: '#5a3d28' }, { head: 'veil', headCol: '#b8487a' }, { beard: 'full', beardCol: '#9a9a9a' }, { head: 'hair', headCol: '#2e2420' }, { head: 'veil', headCol: '#8cbf4a' }];
    for (let i = 0; i < 9; i++) {
      const kid = i === 4 || i === 7;
      crowd.push({ id: 'C' + i, crowd: true, x: 610 + i * 70 + (r() - 0.5) * 30, y: 1700 + (i % 3) * 50, s: kid ? 0.66 : 0.9 + r() * 0.12, robe: robes[i], ...heads[i], dir0: r() < 0.5 ? 1 : -1, mood: ['smile', 'line', 'smile'][i % 3] });
    }
    crowd.sort((a, b) => a.y - b.y).forEach(c => {
      shadow(g, c.x, c.y + 3, 60 * c.s, 0.22);
      person(g, { ...c, dir: turned ? -1 : c.dir0, eyes: turned ? 'wide' : 'dot', look: -1, brows: turned ? 'raised' : null, mouth: turned ? 'o' : c.mood });
    });
    const wk = seg(t, 0.5, tSaid);
    const jx = lerp(-160, 380, wk);
    const proclaim = t > t40 - 0.15;
    shadow(g, jx, 1722, 85, 0.25);
    person(g, { ...JONAH, xb: [A(8, t40 - 0.15)], x: jx, y: 1720, s: 1.1, dir: 1, walk: wk < 1 ? t * 9 : null, eyes: 'dot', brows: proclaim ? 'flat' : null, mouth: proclaim ? 'open' : 'line',
      arms: proclaim ? { l: [14, 4], r: [140, 160] } : wk < 1 ? { l: [14 + Math.sin(t * 9) * 18, 4], r: [14 - Math.sin(t * 9) * 18, 4] } : DOWN });
  });
}

// ------------------------------------------------------------ 9. the city repents (37.5–43.6)
function s9(g, t) {
  const tKing = wt(9, 'king'), tSpared = wt(9, 'spared');
  const cl = sstep(t, tSpared - 0.6, tSpared + 0.9);
  const tEven = wt(9, 'Even') - 0.1;
  const cam = kf(t, [[0, { x: 340, y: 1430, z: 1.25 }], [0.3, { x: 340, y: 1430, z: 1.25 }], [tEven, { x: 620, y: 1440, z: 1.28 }],
    [tEven, { x: 1300, y: 1450, z: 1.38 }, 'cut'], [tSpared - 0.5, { x: 1320, y: 1420, z: 1.38 }], [tSpared + 1.0, { x: 1130, y: 1170, z: 1.02 }]]);
  g.fillStyle = vgrad(g, 0, H, [[0, '#6f7480'], [0.55, '#b5b0a8'], [1, '#b5b0a8']]); g.fillRect(0, 0, W, H);
  if (cl > 0) { g.globalAlpha = cl; g.fillStyle = vgrad(g, 0, H, [[0, '#f6b860'], [0.55, '#ffe6a8'], [1, '#ffe6a8']]); g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  withCam(g, cam, 0.25, () => {
    glow(g, 1100, 300, 700 * cl + 1, '255,230,160', cl);
    for (let i = 0; i < 4; i++) cloud(g, 900 - cl * 900 - i * 300, 260 + (i % 2) * 180, 1.7, '#8a8f99', '#6c717c', 'rgba(20,20,30,0.3)');
    for (let i = 0; i < 4; i++) cloud(g, 1300 + cl * 900 + i * 300, 280 + (i % 2) * 160, 1.7, '#8a8f99', '#6c717c', 'rgba(20,20,30,0.3)');
  });
  withCam(g, cam, 0.6, () => {
    // palace ziggurat and houses
    for (let i = 0; i < 4; i++) { rrect(g, 1180 - 260 + i * 60, 1150 - i * 110, 520 - i * 120, 110, 4); fs(g, ['#cfa86e', '#d9b47c', '#e2c08c', '#ebcd9c'][i], 5); }
    const r = rng(33);
    for (let i = 0; i < 16; i++) { const x = -500 + i * 140, h = 120 + r() * 160; rrect(g, x, 1300 - h, 120, h, 4); fs(g, ['#e3c28d', '#d6ad75', '#ecd3a5'][i % 3], 5); rrect(g, x + 44, 1250, 28, 50, [12, 12, 0, 0]); fs(g, '#5a3a24', 4); }
  });
  withCam(g, cam, 1, () => {
    g.fillStyle = '#d7bc8c'; g.fillRect(-900, 1450, 3200, 1000); line(g, -900, 1450, 2300, 1450, 5);
    for (let i = 0; i < 4; i++) beam(g, 1000 + i * 120, -200, 120, 1100 + i * 180, 1900, 340, '255,235,170', cl * 0.32);
    // ash heap, discarded crown and robe
    g.beginPath(); g.moveTo(1120, 1740); g.quadraticCurveTo(1340, 1530, 1560, 1740); g.closePath(); fs(g, '#8f8b86', 6);
    const r = rng(8); for (let i = 0; i < 40; i++) { circle(g, 1170 + r() * 340, 1650 + r() * 85, 3 + r() * 4); fill(g, 'rgba(50,48,46,0.6)'); }
    g.save(); g.translate(1640, 1735); g.rotate(-0.35); g.scale(0.6, 0.6); drawCrown(g, 0, 0); g.restore();
    g.beginPath(); g.moveTo(1520, 1760); g.quadraticCurveTo(1600, 1690, 1700, 1745); g.quadraticCurveTo(1760, 1790, 1680, 1800); g.lineTo(1540, 1800); g.closePath(); fs(g, '#8f1f24');
    line(g, 1540, 1795, 1690, 1790, 8, '#e0b03a');
    person(g, { ...KING_SACK, x: 1340, y: 1700, s: 1.12, dir: -1, pose: 'sit', bow: 0.3, arms: { l: [30, 20], r: [30, 20] }, eyes: 'closed', brows: 'worried', mouth: 'frown' });
    // kneeling crowd in sackcloth
    const rr = rng(77);
    const looks = [{ head: 'veil', headCol: '#9c8664' }, { head: 'hair', headCol: '#2e2420' }, { beard: 'short' }, { head: 'veil', headCol: '#7f6d55' }, { head: 'hair', headCol: '#5a3d28' }, { beard: 'full', beardCol: '#8c8c8c' }];
    const people = [];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) {
      const kid = rr() < 0.18;
      people.push({ id: 'P' + row + '_' + i, crowd: true, x: -260 + i * 190 + row * 70 + (rr() - 0.5) * 50, y: 1640 + row * 120, s: kid ? 0.64 : 0.88 + rr() * 0.14, ...looks[Math.floor(rr() * looks.length)], dir: rr() < 0.7 ? 1 : -1 });
    }
    people.forEach(p => { shadow(g, p.x, p.y + 2, 80 * p.s, 0.2); person(g, { ...p, sack: true, pose: 'kneel', bow: 0.55, arms: CLASP, eyes: 'closed', brows: 'worried', mouth: 'line' }); });
  });
  const warm = cl * 0.12; if (warm > 0) { g.fillStyle = `rgba(255,200,120,${warm})`; g.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------ 10. the hill east of the city (43.6–47.8)
function s10(g, t) {
  const tFur = wt(10, 'furious.'), tHed = wt(10, 'He’d');
  const cam = kf(t, [[0, { x: 560, y: 1260, z: 1.0 }], [tFur, { x: 600, y: 1300, z: 2.3 }, 'cut'], [tHed, { x: 600, y: 1300, z: 2.3 }], [tHed + 0.55, { x: 600, y: 1380, z: 1.55 }]]);
  const stomp = tFur + 0.12;
  if (t > stomp && t < tHed) { const e = Math.exp(-(t - stomp) * 7); cam.x += Math.sin(t * 90) * 18 * e; cam.y += Math.cos(t * 77) * 14 * e; }
  g.fillStyle = vgrad(g, 0, H, [[0, '#dfeef4'], [0.55, '#fffdf2'], [1, '#fffdf2']]); g.fillRect(0, 0, W, H);
  withCam(g, cam, 0.1, () => glow(g, 880, 300, 800, '255,255,240', 1));
  withCam(g, cam, 0.5, () => {
    g.fillStyle = '#e9d3a6'; g.fillRect(-1000, 1150, 3000, 900);
    const r = rng(4);
    for (let i = 0; i < 10; i++) { const h = 30 + r() * 50; rrect(g, -60 + i * 52, 1150 - h, 46, h, 3); fs(g, '#d6b47e', 4); }
    rrect(g, -80, 1100, 560, 50, 3); fs(g, '#cfa86e', 4);
  });
  withCam(g, cam, 1, () => {
    g.beginPath(); g.moveTo(-800, 2400); g.lineTo(-800, 1640); g.quadraticCurveTo(600, 1420, 2000, 1640); g.lineTo(2000, 2400); g.closePath(); fs(g, '#d8b373', 7);
    const r = rng(12); for (let i = 0; i < 26; i++) { const x = -300 + r() * 1700, y = 1640 + r() * 400; line(g, x, y, x - 8, y - 26, 4, '#a4864e'); line(g, x + 8, y, x + 12, y - 22, 4, '#a4864e'); }
    shadow(g, 600, 1612, 95, 0.35);
    const fury = t >= tFur && t < tHed;
    if (fury && t > stomp - 0.05 && t < stomp + 0.5) { const p = seg(t, stomp, stomp + 0.5); for (let i = 0; i < 6; i++) { circle(g, 600 + (i - 2.5) * 40 * (1 + p), 1600 - p * 40, 22 * (1 - p) + 6); fill(g, `rgba(200,170,120,${0.7 * (1 - p)})`); } }
    person(g, { ...JONAH, xb: [A(10, tFur), A(10, tHed)], x: 600, y: 1610, s: 1.2, dir: -1,
      red: fury, eyes: fury ? 'angry' : 'dot', brows: t < tFur ? 'flat' : 'angry', mouth: fury ? 'grit' : 'frown',
      lift: fury && t < stomp ? 30 : 0,
      arms: fury ? { l: [55, -165], r: [55, -165] } : t >= tHed ? { l: [26, -112], r: [26, -112] } : DOWN });
    if (fury) {
      for (let i = 0; i < 6; i++) {
        const p = mod((t - tFur) * 1.6 + i / 6, 1), side = i % 2 ? 1 : -1;
        circle(g, 600 + side * (40 + p * 70), 1180 - p * 260, 24 + p * 46); fill(g, `rgba(255,255,255,${0.9 * (1 - p)})`);
      }
    }
  });
}

// ------------------------------------------------------------ 11. the whole city at golden hour (47.8–55.0)
function s11(g, t) {
  const tAnd = wt(11, 'And') - 0.1;
  const cam = kf(t, [[0, { x: 320, y: 1640, z: 2.1 }], [0.35, { x: 320, y: 1640, z: 2.1 }], [tAnd, { x: 520, y: 1150, z: 1.1 }],
    [tAnd, { x: 560, y: 1080, z: 1.02 }, 'cut']]);
  g.fillStyle = vgrad(g, 0, H, [[0, '#4b3f7a'], [0.3, '#c9739a'], [0.45, '#f39a5a'], [0.56, '#ffcf7a'], [1, '#ffcf7a']]); g.fillRect(0, 0, W, H);
  withCam(g, cam, 0.15, () => { glow(g, 800, 1000, 700, '255,200,120', 1); circle(g, 800, 1010, 90); fill(g, '#fff0c4'); cloud(g, 250, 700, 0.8, '#ffd9c2', '#e9a58e'); cloud(g, 950, 560, 0.6, '#ffd9c2', '#e9a58e'); });
  withCam(g, cam, 0.35, () => { g.beginPath(); g.moveTo(-900, 1200); for (let x = -900; x <= 2000; x += 60) g.lineTo(x, 1040 - Math.sin(x / 300) * 40 - Math.sin(x / 120) * 12); g.lineTo(2000, 1200); fs(g, '#9a6a8a', 4); });
  withCam(g, cam, 0.7, () => {
    g.fillStyle = '#d2a066'; g.fillRect(-900, 1070, 2900, 900);
    g.beginPath(); g.moveTo(-900, 1110); g.quadraticCurveTo(500, 1060, 2000, 1120); g.lineTo(2000, 1160); g.quadraticCurveTo(500, 1100, -900, 1150); g.closePath(); fill(g, '#6fa6c8');
    // city walls
    rrect(g, 60, 1150, 960, 300, 10); fs(g, '#e2b77a', 6);
    // ziggurat
    for (let i = 0; i < 4; i++) { rrect(g, 540 - 150 + i * 30, 1180 - i * 50, 300 - i * 60, 52, 4); fs(g, ['#c9965c', '#d4a36a', '#dfb27a', '#e9c18a'][i], 4); }
    const r = rng(55);
    for (let row = 0; row < 5; row++) for (let i = 0; i < 12; i++) {
      const x = 90 + i * 78 + (row % 2) * 30 + r() * 10, y = 1220 + row * 46;
      if (Math.abs(x - 540) < 140 && row < 1) continue;
      const w = 50 + r() * 20, h = 30 + r() * 26;
      rrect(g, x, y - h, w, h, 3); fs(g, ['#f0cf98', '#e6bd84', '#f6dcae', '#dcae74'][(i + row) % 4], 3);
      if (r() < 0.7) { rrect(g, x + w * 0.35, y - h * 0.6, 10, 10, 2); fill(g, '#ffd36a'); glow(g, x + w * 0.35 + 5, y - h * 0.6 + 5, 22, '255,200,100', 0.5); }
    }
    for (let x = 60; x < 1020; x += 40) { rrect(g, x, 1140, 24, 20, 3); fs(g, '#e2b77a', 3); }
    g.save(); g.translate(540, 1030); g.scale(0.45, 0.45); flag(g, 0, 0, '#c94b3a', 110, 0.5); g.restore();
    // tiny people and children in the streets
    for (let i = 0; i < 46; i++) {
      const x = 90 + r() * 900, y = 1235 + r() * 210, s = r() < 0.25 ? 0.6 : 1;
      line(g, x, y, x, y - 18 * s, 6 * s, ['#c94b3a', '#4a8fc4', '#e1a23c', '#3f9a6a', '#7a5aa8'][i % 5]);
      circle(g, x, y - 26 * s, 7 * s); fs(g, HEAD, 2);
    }
    // animals in the fields outside the walls
    for (let i = 0; i < 26; i++) {
      const x = -300 + r() * 1700, y = 1480 + r() * 160;
      if (x > 40 && x < 1040 && y < 1460) continue;
      if (i % 3) { [-8, 0, 8].forEach(o => { circle(g, x + o, y - 10, 9); fill(g, '#fffaf0'); }); circle(g, x + 14, y - 12, 5); fill(g, OUT); }
      else { rrect(g, x - 14, y - 20, 30, 16, 4); fs(g, '#8a5a35', 2); line(g, x - 10, y - 4, x - 10, y + 4, 3); line(g, x + 12, y - 4, x + 12, y + 4, 3); circle(g, x + 18, y - 18, 6); fs(g, '#8a5a35', 2); }
    }
  });
  withCam(g, cam, 1, () => {
    g.beginPath(); g.moveTo(-700, 2500); g.lineTo(-700, 1840); g.quadraticCurveTo(300, 1700, 1000, 1880); g.lineTo(1300, 2500); g.closePath(); fs(g, '#a87543', 7);
    person(g, { ...JONAH, x: 300, y: 2010, s: 1.55, dir: 1, back: true, pose: 'sit', arms: { l: [20, 30], r: [20, 30] } });
  });
  g.fillStyle = 'rgba(255,170,90,0.08)'; g.fillRect(0, 0, W, H);
}
