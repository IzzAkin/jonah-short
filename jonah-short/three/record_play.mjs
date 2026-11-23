// node three/record_play.mjs <seconds> <out.mp4> [stills...]  -> deterministic 60 fps recording of the scripted demo
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(fileURLToPath(import.meta.url));
const [secs, out, ...stills] = process.argv.slice(2);
const W = 1920, H = 1080, FPS = 60, N = Math.round(+secs * FPS);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + path.join(dir, 'play.html') + '?demo'); await p.waitForFunction(() => window.READY);
await p.evaluate(([W, H]) => { PLAY.init({ demo: makeDemo(), size: [W, H] }); R3.domElement.style.filter = ''; }, [W, H]);
if (errs.length) { console.log(errs); process.exit(1); }
const fdir = path.join(dir, '..', 'frames_play'); fs.rmSync(fdir, { recursive: true, force: true }); fs.mkdirSync(fdir);
const want = new Set(stills.map(s => Math.round(+s * FPS)));
for (let i = 0; i < N; i++) {
  const d = await p.evaluate(() => { PLAY.advance(1); return R3.domElement.toDataURL('image/jpeg', 0.92); });
  fs.writeFileSync(path.join(fdir, `f${String(i).padStart(5, '0')}.jpg`), Buffer.from(d.split(',')[1], 'base64'));
  if (want.has(i)) fs.copyFileSync(path.join(fdir, `f${String(i).padStart(5, '0')}.jpg`), path.join(fdir, `still_${i}.jpg`));
  if (i % 120 === 0) { const st = await p.evaluate(() => { const R = PLAY.R; return [R.x.toFixed(2), R.y.toFixed(2), R.s.toFixed(2), R.ground, R.skid, R.slide, R.rollT.toFixed(2)].join(' '); }); console.log(i, st); }
}
if (errs.length) console.log(errs);
await b.close();
if (out) execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(fdir, 'f%05d.jpg'), '-vf', 'eq=saturation=1.15:contrast=1.03:brightness=0.03', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: 'inherit' });
