// Frame compositor: picks the shot, blends dissolves, draws captions.
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const offC = document.createElement('canvas'); offC.width = W; offC.height = H;
const off = offC.getContext('2d');

const FN = [s1, s2, s3, s4, s5, s67, s67, s8, s9, s10, s11];
// How each shot is entered. Shots 6 and 7 are one take; shot 10 has its own hard cut on "furious".
const ENTER = { 2: 'dissolve', 3: 'dissolve', 4: 'dissolve', 5: 'dissolve', 6: 'dissolve', 7: 'none', 8: 'dissolve', 9: 'dissolve', 10: 'dissolve', 11: 'dissolve' };
const HALF = 0.15; // half-length of a dissolve: 9 frames total, the Rick's Clips median
const SUBCUTS = subcuts(), HOLDS = holds();
// Colour grade applied to the picture (not the captions): measured target saturation ~0.45, colourfulness 70+.
const GRADE = 'saturate(1.42) contrast(1.03) brightness(0.99)';
const gradeC = document.createElement('canvas'); gradeC.width = W; gradeC.height = H;
const gradeG = gradeC.getContext('2d');

function localT(i, t) { return t - (i === 6 ? SHOTS[5].a : SHOTS[i].a); }
function drawShot(g, i, t) {
  let lt = localT(i, t), at = t;
  for (const [h0, h1] of HOLDS) if (t >= h0 && t < h1) { lt -= t - h0; at = h0; }   // dead hold: everything freezes
  NOW = at; SHOT_N = SHOTS[i].n;
  g.save(); g.clearRect(0, 0, W, H); FN[i](g, lt); motes(g, at, MOTES[i]); g.restore();
}

function caption(g, t) {
  if (t > SHOTS[SHOTS.length - 1].b + 0.4) return;
  let cur = null;
  for (const w of WORDS) { if (w.t0 <= t) cur = w; else break; }
  if (!cur) return;
  const txt = cur.w;
  g.save();
  let size = 84;
  g.font = `900 ${size}px Montserrat`;
  const mw = g.measureText(txt).width;
  if (mw > 940) { size = Math.floor(size * 940 / mw); g.font = `900 ${size}px Montserrat`; }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
  const x = W / 2, y = 1180;
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 16; g.shadowOffsetY = 7;
  g.lineWidth = 17; g.strokeStyle = '#000'; g.strokeText(txt, x, y);
  g.shadowColor = 'transparent';
  g.fillStyle = '#fff'; g.fillText(txt, x, y);
  g.restore();
}

function renderFrame(t) {
  let i = SHOTS.findIndex(s => t >= s.a && t < s.b);
  if (i < 0) i = SHOTS.length - 1;
  let blended = false;
  for (let j = 1; j < SHOTS.length; j++) {
    const b = SHOTS[j].a;
    if (ENTER[j + 1] === 'dissolve' && t >= b - HALF && t < b + HALF) {
      drawShot(ctx, j - 1, t);
      drawShot(off, j, t);
      ctx.globalAlpha = ease((t - (b - HALF)) / (2 * HALF));
      ctx.drawImage(offC, 0, 0);
      ctx.globalAlpha = 1;
      blended = true; break;
    }
  }
  if (!blended) {
    const sc = SUBCUTS.find(c => c.type === 'dissolve' && Math.abs(t - c.t) < HALF);
    if (sc) {
      CUT_T = sc.t - (i === 6 ? SHOTS[5].a : SHOTS[i].a);
      CAM_SIDE = 'before'; drawShot(ctx, i, t);
      CAM_SIDE = 'after'; drawShot(off, i, t);
      CUT_T = CAM_SIDE = null;
      ctx.globalAlpha = ease((t - (sc.t - HALF)) / (2 * HALF)); ctx.drawImage(offC, 0, 0); ctx.globalAlpha = 1;
    } else drawShot(ctx, i, t);
  }
  vignette(ctx, 0.28);
  gradeG.clearRect(0, 0, W, H); gradeG.drawImage(canvas, 0, 0);
  ctx.save(); ctx.filter = GRADE; ctx.clearRect(0, 0, W, H); ctx.drawImage(gradeC, 0, 0); ctx.restore();
  // lift the blacks the way the reference does (darkest 5 % sits around luma 50-60, almost nothing under 40)
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgb(20,15,12)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  caption(ctx, t);
}

window.renderFrame = renderFrame;
window.READY = Promise.all([document.fonts.load('900 84px Montserrat'), document.fonts.load('800 40px Montserrat')]).then(() => true);
// Live preview when opened in a browser: index.html?play
if (location.search.includes('play')) {
  window.READY.then(() => { const t0 = performance.now(); (function loop() { renderFrame(((performance.now() - t0) / 1000) % END); requestAnimationFrame(loop); })(); });
} else if (location.search.includes('t=')) {
  window.READY.then(() => renderFrame(parseFloat(location.search.split('t=')[1])));
}
