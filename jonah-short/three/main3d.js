// Compositor for the 3D version: renders each shot's 3D set, then the same 2D finishing as v2
// (dissolves, in-shot camera dissolves, gag hold, motes, vignette, colour grade, captions).
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const offC = document.createElement('canvas'); offC.width = W; offC.height = H;
const off = offC.getContext('2d');
const ENTER = { 2: 'dissolve', 3: 'dissolve', 4: 'dissolve', 5: 'dissolve', 6: 'dissolve', 7: 'none', 8: 'dissolve', 9: 'dissolve', 10: 'dissolve', 11: 'dissolve' };
const HALF = 0.15;
const SUBCUTS = subcuts(), HOLDS = holds();
const GRADE = 'saturate(1.2) contrast(1.04) brightness(1.17)';
const gradeC = document.createElement('canvas'); gradeC.width = W; gradeC.height = H;
const gradeG = gradeC.getContext('2d');

function localT(i, t) { return t - (i === 6 ? SHOTS[5].a : SHOTS[i].a); }
function drawShot(g, i, t) {
  let lt = localT(i, t), at = t;
  for (const [h0, h1] of HOLDS) if (t >= h0 && t < h1) { lt -= t - h0; at = h0; }
  NOW = at; SHOT_N = SHOTS[i].n;
  // measured character lighting per set (direction is where the key light sits on screen)
  const SL = { 1: ['storm', 0.3, -0.9], 2: ['golden', -0.9, -0.3], 3: ['storm', 0.4, -0.9], 4: ['storm', 0.4, -0.9], 5: ['storm', 0.1, -1], 6: ['storm', 0.3, -0.9], 7: ['golden', 0.3, -0.5], 8: ['day', 0.3, -0.95], 9: ['day', 0.2, -0.95], 10: ['day', -0.2, -0.98], 11: ['golden', 0.5, -0.4] }[SHOTS[i].n];
  CHAR_LIGHT = { ...LIGHTS[SL[0]], x: SL[1], y: SL[2] };
  if (SHOTS[i].n === 3 && lt > wt(3, 'asleep')) CHAR_LIGHT = { ...LIGHTS.candle, x: 0.8, y: -0.4 };
  if (SHOTS[i].n === 1 || SHOTS[i].n === 6) CHAR_LIGHT = { ...CHAR_LIGHT, tint: '#cfe9e6', shade: '#7aa3a8', rim: '140,240,220' };
  const f = SETS[SHOTS[i].n](lt);
  R3.render(f.scene, f.camera);
  g.save(); g.clearRect(0, 0, W, H); g.drawImage(R3.domElement, 0, 0);
  if (f.post) f.post(g);
  motes(g, at, MOTES[i]);
  g.restore();
}
function caption(g, t) {
  if (t > SHOTS[SHOTS.length - 1].b + 0.4) return;
  let cur = null;
  for (const w of WORDS) { if (w.t0 <= t) cur = w; else break; }
  if (!cur) return;
  const txt = cur.w;
  g.save();
  let size = 84; g.font = `900 ${size}px Montserrat`;
  const mw = g.measureText(txt).width; if (mw > 940) { size = Math.floor(size * 940 / mw); g.font = `900 ${size}px Montserrat`; }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 16; g.shadowOffsetY = 7;
  g.lineWidth = 17; g.strokeStyle = '#000'; g.strokeText(txt, W / 2, 1180);
  g.shadowColor = 'transparent'; g.fillStyle = '#fff'; g.fillText(txt, W / 2, 1180);
  g.restore();
}
function renderFrame(t) {
  let i = SHOTS.findIndex(s => t >= s.a && t < s.b); if (i < 0) i = SHOTS.length - 1;
  let blended = false;
  for (let j = 1; j < SHOTS.length; j++) {
    const b = SHOTS[j].a;
    if (ENTER[j + 1] === 'dissolve' && t >= b - HALF && t < b + HALF) {
      drawShot(ctx, j - 1, t); drawShot(off, j, t);
      ctx.globalAlpha = ease((t - (b - HALF)) / (2 * HALF)); ctx.drawImage(offC, 0, 0); ctx.globalAlpha = 1;
      blended = true; break;
    }
  }
  if (!blended) {
    const sc = SUBCUTS.find(c => c.type === 'dissolve' && Math.abs(t - c.t) < HALF);
    if (sc) {
      CUT_T = sc.t - (i === 6 ? SHOTS[5].a : SHOTS[i].a);
      CAM_SIDE = 'before'; drawShot(ctx, i, t); CAM_SIDE = 'after'; drawShot(off, i, t); CUT_T = CAM_SIDE = null;
      ctx.globalAlpha = ease((t - (sc.t - HALF)) / (2 * HALF)); ctx.drawImage(offC, 0, 0); ctx.globalAlpha = 1;
    } else drawShot(ctx, i, t);
  }
  vignette(ctx, 0.26);
  gradeG.clearRect(0, 0, W, H); gradeG.drawImage(canvas, 0, 0);
  ctx.save(); ctx.filter = GRADE; ctx.clearRect(0, 0, W, H); ctx.drawImage(gradeC, 0, 0); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgb(16,12,10)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  caption(ctx, t);
}
window.renderFrame = renderFrame;
window.READY = Promise.all([document.fonts.load('900 84px Montserrat'), document.fonts.load('800 40px Montserrat')]).then(() => { buildSets(); return true; });
