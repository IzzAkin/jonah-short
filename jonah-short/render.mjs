// Usage:
//   node render.mjs stills 0.5 3 9 ...          -> stills/t_<sec>.png (quick checks)
//   node render.mjs video [workers]             -> out/jonah_short.mp4
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const PAGE = process.env.PAGE || 'index.html';
const url = 'file://' + path.join(dir, PAGE);
const OUT = process.env.OUT || 'jonah_short.mp4';
const [mode, ...args] = process.argv.slice(2);

async function page(browser) {
  const p = await browser.newPage({ viewport: { width: 540, height: 960 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(url);
  await p.evaluate(() => window.READY);
  await p.waitForTimeout(50);
  if (errs.length) throw new Error(errs.join('\n'));
  return p;
}
const grab = (p, t, type) => p.evaluate(([t, type]) => { renderFrame(t); return document.getElementById('c').toDataURL(type, 0.93); }, [t, type]);
const b64 = s => Buffer.from(s.split(',')[1], 'base64');

const browser = await chromium.launch();
try {
  if (mode === 'stills') {
    mkdirSync(path.join(dir, 'stills'), { recursive: true }); const pre = process.env.PAGE ? '3d_' : '';
    const p = await page(browser);
    for (const a of args) writeFileSync(path.join(dir, 'stills', `${pre}t_${a}.png`), b64(await grab(p, parseFloat(a), 'image/png')));
  } else if (mode === 'video') {
    const workers = parseInt(args[0] || '3');
    const fdir = path.join(dir, 'frames'); rmSync(fdir, { recursive: true, force: true }); mkdirSync(fdir, { recursive: true });
    const END = await (await page(browser)).evaluate(() => END);
    const FPS = 30, N = Math.round(END * FPS);
    let next = 0, done = 0;
    await Promise.all(Array.from({ length: workers }, async () => {
      const p = await page(browser);
      while (next < N) {
        const i = next++;
        writeFileSync(path.join(fdir, `f${String(i).padStart(5, '0')}.jpg`), b64(await grab(p, i / FPS, 'image/jpeg')));
        if (++done % 150 === 0) console.log(`${done}/${N}`);
      }
    }));
    mkdirSync(path.join(dir, 'out'), { recursive: true });
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', '30', '-i', path.join(fdir, 'f%05d.jpg'),
      '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-shortest',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      '-c:a', 'aac', '-b:a', '192k', path.join(dir, 'out', OUT)], { stdio: 'inherit' });
    console.log('wrote out/' + OUT);
  }
} finally { await browser.close(); }
