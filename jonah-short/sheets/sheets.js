// Character sheets for the Jonah cast, drawn with the measured rig. Open sheets.html?c=<id>.
const SW = 2400, SH = 1500;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const INKC = '#3d2d24', SUB = '#6a6272';
const sceptre = gg => (x, y) => { line(gg, x, y + 40, x + 6, y - 190, 14); line(gg, x, y + 40, x + 6, y - 190, 8, '#e8b63c'); circle(gg, x + 6, y - 200, 16); fs(gg, '#f2c94c', 5); };
const staff = gg => (x, y) => { line(gg, x, y + 120, x + 4, y - 170, 12); line(gg, x, y + 120, x + 4, y - 170, 7, '#8a6440'); };

function text(t, x, y, size, col = INKC, w = 900, align = 'left') { g.font = `${w} ${size}px Montserrat`; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillText(t, x, y); }
function wrap(t, x, y, maxW, size, col = SUB, lh = 1.35) {
  g.font = `800 ${size}px Montserrat`; g.fillStyle = col; g.textAlign = 'left';
  let line_ = '', yy = y;
  for (const w of t.split(' ')) { const tt = line_ ? line_ + ' ' + w : w; if (g.measureText(tt).width > maxW) { g.fillText(line_, x, yy); line_ = w; yy += size * lh; } else line_ = tt; }
  g.fillText(line_, x, yy); return yy;
}
function panel(x, y, w, h, fillc = '#f3f2f8') { rrect(g, x, y, w, h, 28); g.fillStyle = fillc; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(61,45,36,0.12)'; g.stroke(); }
function groundShadow(x, y, w) { const gr = g.createRadialGradient(x, y, 0, x, y, w); gr.addColorStop(0, 'rgba(60,40,70,0.28)'); gr.addColorStop(1, 'rgba(60,40,70,0)'); g.save(); g.scale(1, 0.22); g.fillStyle = gr; g.fillRect(x - w, y / 0.22 - w, 2 * w, 2 * w); g.restore(); }
function label(t, x, y, size = 24) { text(t, x, y, size, SUB, 800, 'center'); }

// Proportion guide in head units next to a standing figure (feet at fy, scale s).
function guide(x, fy, s, units) {
  const D = 140 * s;
  g.save(); g.setLineDash([10, 10]); g.strokeStyle = 'rgba(61,45,36,0.22)'; g.lineWidth = 2;
  units.forEach(([u, name]) => { const y = fy - u * D; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 520, y); g.stroke(); text(name, x - 12, y + 8, 20, 'rgba(61,45,36,0.55)', 800, 'right'); });
  g.restore();
}
function bust(opts, cx, cy, rad, s) {
  g.save(); circle(g, cx, cy, rad); g.clip();
  g.fillStyle = '#f6f5fa'; g.fillRect(cx - rad, cy - rad, 2 * rad, 2 * rad);
  // head centre sits at feet - (legs + body + 59) * s for a standing robe; place it at (cx, cy - rad*0.18)
  const st = opts.tunic ? 0.75 * 140 + 1.6 * 140 : 0.45 * 140 + 2.0 * 140;
  person(g, { ...opts, x: cx, y: cy - rad * 0.15 + (st + 59) * s, s, idle: false });
  g.restore();
  circle(g, cx, cy, rad); g.lineWidth = 4; g.strokeStyle = 'rgba(61,45,36,0.15)'; g.stroke();
}
function headTile(opts, x, y, w, name) {
  g.save(); rrect(g, x, y, w, w, 22); g.fillStyle = '#f6f5fa'; g.fill(); g.clip();
  const s = 1.05, st = opts.tunic ? 0.75 * 140 + 1.6 * 140 : 0.45 * 140 + 2.0 * 140;
  person(g, { ...opts, x: x + w / 2, y: y + w * 0.5 + (st + 59) * s, s, idle: false });
  g.restore(); label(name, x + w / 2, y + w + 32, 22);
}
function swatches(list, x, y, cols = 4) {
  list.forEach(([n, c], i) => {
    const sx = x + (i % cols) * 215, sy = y + Math.floor(i / cols) * 70;
    rrect(g, sx, sy, 52, 52, 12); g.fillStyle = c; g.fill(); g.lineWidth = 3; g.strokeStyle = INKC; g.stroke();
    text(n, sx + 64, sy + 22, 18, INKC, 800); text(c.toUpperCase(), sx + 64, sy + 46, 17, SUB, 800);
  });
}
const LTILE = {
  day: ['Day sun', ['#9fd0ee', '#f4e6c8'], '#e2c18c', 'lit #FDF6F0 · shade ×0.70 · 10% of head · faint rim'],
  golden: ['Golden hour / warm', ['#c9739a', '#ffcf7a'], '#b9824e', 'tint #FFE8C8 · shade #D99A5E · 24% · strong rim'],
  candle: ['Night, candle', ['#251f48', '#5a3f6a'], '#3a2a30', 'tint #EFE0E5 · cool shade #AEA3D4 · 30% · warm rim'],
  fire: ['Forge / fire', ['#6a2a10', '#e88a3a'], '#5a3018', 'tint #FDEEBC · shade #D6BE85 · 16% · orange rim'],
  storm: ['Storm / overcast', ['#121b2b', '#2c3d55'], '#4a3a2a', 'tint #C9D3E6 · shade #7D86A8 · 30% · cold rim'],
};
function lightingStrip(opts, y) {
  text('LIGHTING', 60, y - 18, 30);
  text('measured from the reference: head shade/lit ≈ 0.70, cloth shade ≈ 0.60, rim light outside the ink on the light side, whole figure tinted by the scene light', 260, y - 20, 20, SUB, 800);
  const keys = Object.keys(LTILE), w = (SW - 120 - 4 * 24) / 5;
  keys.forEach((k, i) => {
    const x = 60 + i * (w + 24), [name, sky, gnd, note] = LTILE[k];
    g.save(); rrect(g, x, y, w, 400, 22); g.clip();
    const gr = g.createLinearGradient(0, y, 0, y + 400); gr.addColorStop(0, sky[0]); gr.addColorStop(0.72, sky[1]); gr.addColorStop(0.72, gnd); gr.addColorStop(1, gnd);
    g.fillStyle = gr; g.fillRect(x, y, w, 400);
    const L = LIGHTS[k]; CHAR_LIGHT = L;
    const lx = x + w / 2 + L.x * 140, ly = y + 70 + Math.max(0, L.y) * 60;
    glow(g, x + w / 2 + Math.sign(L.x) * w * 0.42, y + 60, 160, k === 'storm' ? '160,180,255' : '255,220,160', 0.5);
    const s = 0.62, fy = y + 370;
    g.save(); g.fillStyle = 'rgba(0,0,0,0.25)'; ell(g, x + w / 2 - L.x * 40, fy + 4, 70, 12); g.fill(); g.restore();
    charTint(g, SW, SH, L.tint, gg => opts ? person(gg, { ...opts, x: x + w / 2, y: fy, s, idle: false }) : fish(gg, x + w / 2, fy - 120, 0.17, 0, 0));
    g.restore();
    text(name, x + 18, y + 40, 24, k === 'day' ? INKC : '#fff', 900); text(note, x + 18, y + 392, 15, k === 'day' ? INKC : 'rgba(255,255,255,0.92)', 800);
    CHAR_LIGHT = LIGHTS.day;
  });
}
function header(name, sub) { text(name, 60, 92, 64); wrap(sub, 62, 136, 1500, 22); }
function background() { g.fillStyle = '#e6e5ee'; g.fillRect(0, 0, SW, SH); const gr = g.createRadialGradient(SW * 0.45, SH * 0.4, 100, SW * 0.45, SH * 0.4, SW * 0.7); gr.addColorStop(0, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, SW, SH); }
function footer(t) { text(t, 60, SH - 18, 17, SUB, 800); }

// --------------------------------------------------------------- standard sheet: bust, front, turned, expressions, palette, lighting
function standard(c) {
  background(); header(c.name, c.sub);
  panel(40, 170, 700, 830); bust(c.bustOpts || c.base, 390, 585, 330, 2.9); label('CLOSE-UP', 390, 975);
  panel(760, 170, 900, 830);
  const s = 1.3, fy = 945;
  guide(830, fy, s, [[0, '0'], [0.45, '0.45 D'], [1, '1 D'], [2, '2 D'], [2.45, '2.45 D'], [3, '3 D'], [3.53, '3.5 D']]);
  groundShadow(1000, fy, 170); person(g, { ...c.base, ...c.front, x: 1000, y: fy, s, idle: false });
  groundShadow(1400, fy, 170); person(g, { ...c.base, ...(c.turnBase || {}), ...c.turned, x: 1400, y: fy, s, idle: false });
  label(c.frontLabel || 'FRONT · facing right', 1000, 988); label(c.turnedLabel || 'TURNED · facing left', 1400, 988);
  panel(1680, 170, 680, 830);
  text('EXPRESSIONS', 1710, 220, 26);
  c.expr.forEach(([n, o], i) => headTile({ ...c.base, ...o }, 1710 + (i % 3) * 215, 245 + Math.floor(i / 3) * 255, 190, n));
  text('PALETTE', 1710, 768, 26); swatches(c.palette, 1710, 786, 3);
  lightingStrip({ ...c.base, ...c.front }, 1060);
  footer('Rig measured from reference frames · head diameter D: total 3.5 D · robe 2.0 D · legs 0.45 D · shoulders 0.8 D · hem 1.1 D · ink 0.035 D · eyes 0.075 D, 0.27 D apart, at head-centre height · brows 0.19 × 0.06 D · mouth +0.25 D');
}
// --------------------------------------------------------------- lineup sheet for groups
function lineup(c) {
  background(); header(c.name, c.sub);
  panel(40, 170, SW - 80, 830);
  const n = c.people.length, s = c.scale || 1.3, fy = 910, gap = (SW - 280) / n;
  guide(110, fy, s, [[0, '0'], [1, '1 D'], [2, '2 D'], [3, '3 D'], [3.53, '3.5 D']]);
  c.people.forEach(([nm, o], i) => { const x = 210 + gap * (i + 0.5); groundShadow(x, fy, 140 * (o.k || 1)); person(g, { ...o, x, y: fy, s: s * (o.k || 1), idle: false }); label(nm, x, fy + 62, 22); });
  if (c.row2) {
    text(c.row2Title, 60, 1048, 30);
    const m = c.row2.length, w = (SW - 120) / m;
    g.save(); rrect(g, 40, 1070, SW - 80, 410, 28); g.fillStyle = '#f3f2f8'; g.fill(); g.restore();
    c.row2.forEach(([nm, o], i) => { const x = 40 + w * (i + 0.5); groundShadow(x, 1430, 90); person(g, { ...o, x, y: 1430, s: 0.72 * (o.k || 1), idle: false }); label(nm, x, 1470, 18); });
  } else lightingStrip(c.people[0][1], 1060);
  footer(c.foot || 'Same measured rig as the leads · each character is told apart by headwear, hair, beard and robe colour, never by face shape');
}
// --------------------------------------------------------------- the fish
function fishSheet() {
  background(); header('THE GREAT FISH', 'Ship-sized, blue-grey with a pale belly and pale spots, small calm round eyes, huge mouth. Never: teeth, gore or a scary face.');
  panel(40, 170, 1150, 600); fish(g, 640, 470, 0.62, 0, 0); label('SIDE · mouth closed', 615, 745);
  panel(1210, 170, 1150, 600); fish(g, 1800, 470, 0.62, 0, 1); person(g, { ...JONAH, x: 2090, y: 560, s: 0.33, eyes: 'wide', brows: 'worried', mouth: 'o', idle: false, rot: 0.2 }); label('MOUTH OPEN · swallowing', 1785, 745);
  panel(40, 790, 1150, 330);
  fish(g, 720, 955, 0.3, 0, 0); person(g, { ...JONAH, x: 1110, y: 1075, s: 0.115, idle: false });
  g.save(); g.setLineDash([8, 8]); line(g, 474, 1095, 966, 1095, 2, 'rgba(61,45,36,0.4)'); line(g, 1093, 1095, 1127, 1095, 2, 'rgba(61,45,36,0.4)'); g.restore();
  label('≈ 15 m', 720, 1088, 18); label('1.7 m', 1110, 1094, 14);
  text('SCALE', 70, 840, 26); wrap('Ship-sized: about 9 times Jonah’s height. The eye stays small and calm in every shot; the mouth is a soft dark-plum cavity, never teeth.', 70, 880, 380, 20);
  panel(1210, 790, 1150, 330); text('PALETTE', 1240, 840, 26);
  swatches([['Body', '#6f8796'], ['Fins', '#5d7584'], ['Belly', '#dbe4e2'], ['Spots', '#e6f0f0'], ['Mouth', '#2b1420'], ['Tongue', '#7a3346'], ['Ink', '#3d2d24']], 1240, 862, 4);
  lightingStrip(null, 1180);
}

// --------------------------------------------------------------- cast data
const SHEETS = {
  jonah: () => standard({
    name: 'JONAH', sub: 'The prophet. Sand-coloured head wrap tied at the back, short dark beard, long blue-and-tan striped robe, rope belt, leather satchel across the chest, sandals. One feeling per line; the red-faced fury appears once.',
    base: { ...JONAH, idle: false }, front: { dir: 1 }, turned: { dir: -1, arms: { l: [150, 165], r: [14, 4] }, brows: 'flat', mouth: 'open' }, turnedLabel: 'TURNED · proclaiming',
    expr: [['Neutral', {}], ['Worried', { eyes: 'wide', brows: 'worried', mouth: 'wobbly', sweat: true }], ['Proclaiming', { brows: 'flat', mouth: 'open' }],
      ['Praying', { eyes: 'closed', brows: 'flat' }], ['Asleep', { eyes: 'closed', mouth: 'o', brows: 'soft' }], ['Furious', { red: true, eyes: 'angry', brows: 'angry', mouth: 'grit' }]],
    palette: [['Robe blue', '#3f6fa8'], ['Robe tan', '#d9c39a'], ['Head wrap', '#d9c08f'], ['Beard', '#3a2a20'], ['Rope belt', '#c49a5a'], ['Satchel', '#8a5530'], ['Head', '#fdf6f0'], ['Ink', '#3d2d24'], ['Sandals', '#7a4a2a']],
  }),
  king: () => standard({
    name: 'KING OF NINEVEH', sub: 'Tall cylindrical red-and-gold crown, long black beard in tight curls, deep-red robe with gold borders, gold sceptre. In the ashes scene: plain brown sackcloth, crown and robe set aside, never worn.',
    base: { id: 'K', robe: '#8f1f24', trim: '#e0b03a', head: 'crown', beard: 'curly', brows: 'flat', idle: false },
    front: { dir: 1, hold: sceptre(g), arms: { l: [14, 4], r: [30, -20] } }, turnBase: { robe: '#8b6b47', trim: null, sack: true, head: null },
    turned: { dir: -1, bow: 0.3, eyes: 'closed', brows: 'worried', mouth: 'frown', arms: CLASP }, turnedLabel: 'SACKCLOTH · repenting',
    expr: [['Stern', {}], ['Proud', { brows: 'raised', mouth: 'smile' }], ['Shocked', { eyes: 'wide', brows: 'raised', mouth: 'o' }],
      ['Humbled', { eyes: 'closed', brows: 'worried', mouth: 'frown' }], ['Sackcloth', { sack: true, trim: null, robe: '#8b6b47', head: null, eyes: 'closed', brows: 'worried', mouth: 'line' }], ['Relieved', { eyes: 'happy', brows: 'soft', mouth: 'smile' }]],
    palette: [['Robe red', '#8f1f24'], ['Gold', '#e0b03a'], ['Crown red', '#b5302d'], ['Beard', '#1e1a1c'], ['Sackcloth', '#8b6b47'], ['Ash', '#aaa6a0'], ['Head', '#fdf6f0'], ['Ink', '#3d2d24']],
  }),
  sailors: () => lineup({
    name: 'THE SAILORS', sub: 'Four sailors in short tunics, told apart by a red headscarf, a blue cap, a bald head with a full beard, and a green headband. In the storm each prays a different way.',
    people: [['Red headscarf', { ...SAILORS[0], dir: 1 }], ['Blue cap', { ...SAILORS[1], dir: 1, mustache: true, beardCol: '#3a2a20' }], ['Bald, full beard', { ...SAILORS[2], dir: -1 }], ['Green headband', { ...SAILORS[3], dir: -1 }],
      ['…praying: arms up', { ...SAILORS[0], dir: 1, arms: { l: [165, 172], r: [165, 172] }, eyes: 'wide', brows: 'worried', mouth: 'open' }], ['…hands clasped', { ...SAILORS[1], dir: -1, arms: CLASP, eyes: 'closed', brows: 'worried', mouth: 'wobbly', mustache: true, beardCol: '#3a2a20' }],
      ['…kneeling, bowed', { ...SAILORS[2], dir: 1, pose: 'kneel', bow: 0.6, arms: { l: [120, 160], r: [120, 160] }, eyes: 'closed', brows: 'worried' }], ['…palms up', { ...SAILORS[3], dir: -1, arms: { l: [70, 125], r: [70, 125] }, eyes: 'wide', brows: 'worried', mouth: 'o' }]],
    scale: 1.2,
  }),
  townspeople: () => lineup({
    name: 'PEOPLE OF NINEVEH', sub: 'A mix of men, women and children in colourful robes; rough brown sackcloth after the warning. Never identical clones: vary headwear, hair, beards, robe colours and height.',
    people: [['Woman, gold veil', { robe: '#c94b3a', head: 'veil', headCol: '#e6c46a', dir: 1, mouth: 'smile' }], ['Man, dark hair', { robe: '#e1a23c', head: 'hair', headCol: '#2e2420', dir: 1, mustache: true }],
      ['Elder, grey beard', { robe: '#4a8fc4', beard: 'full', beardCol: '#9a9a9a', dir: -1, brows: 'flat' }], ['Woman, blue veil', { robe: '#7a5aa8', head: 'veil', headCol: '#5aa0c4', dir: 1 }],
      ['Child', { robe: '#3f9a6a', head: 'hair', headCol: '#5a3d28', dir: 1, k: 0.66, mouth: 'smile' }], ['Merchant', { robe: '#d6795a', head: 'hair', headCol: '#5a3d28', beard: 'short', beardCol: '#5a3d28', dir: -1 }],
      ['Woman, pink veil', { robe: '#2f6f8f', head: 'veil', headCol: '#b8487a', dir: -1, mouth: 'smile' }], ['Child', { robe: '#b8487a', head: 'veil', headCol: '#8cbf4a', dir: -1, k: 0.62 }]],
    row2Title: 'AFTER THE WARNING: sackcloth, kneeling',
    row2: [['', { sack: true, head: 'veil', headCol: '#9c8664', pose: 'kneel', bow: 0.55, arms: CLASP, eyes: 'closed', brows: 'worried', dir: 1 }], ['', { sack: true, head: 'hair', headCol: '#2e2420', pose: 'kneel', bow: 0.55, arms: CLASP, eyes: 'closed', brows: 'worried', dir: 1, mustache: true }],
      ['', { sack: true, beard: 'full', beardCol: '#8c8c8c', pose: 'kneel', bow: 0.55, arms: CLASP, eyes: 'closed', brows: 'worried', dir: -1 }], ['', { sack: true, head: 'veil', headCol: '#7f6d55', pose: 'kneel', bow: 0.55, arms: CLASP, eyes: 'closed', brows: 'worried', dir: 1 }],
      ['', { sack: true, head: 'hair', headCol: '#5a3d28', pose: 'kneel', bow: 0.55, arms: CLASP, eyes: 'closed', brows: 'worried', dir: -1, k: 0.66 }], ['', { sack: true, head: 'hair', headCol: '#5a3d28', beard: 'short', beardCol: '#5a3d28', pose: 'kneel', bow: 0.55, arms: CLASP, eyes: 'closed', brows: 'worried', dir: -1 }]],
    scale: 1.15,
  }),
  fish: fishSheet,
};
window.READY = document.fonts.load('900 40px Montserrat').then(() => document.fonts.load('800 20px Montserrat')).then(() => {
  NOW = -100; CHAR_LIGHT = LIGHTS.day;   // NOW < 0: no scheduled blinks on the sheets
  const id = new URLSearchParams(location.search).get('c') || 'jonah';
  SHEETS[id](); return true;
});
