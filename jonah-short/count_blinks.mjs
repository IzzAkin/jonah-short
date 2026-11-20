import { createRequire } from 'module'; import path from 'path'; import { fileURLToPath } from 'url';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('file://' + path.join(dir, 'index.html')); await p.evaluate(() => window.READY);
const log = await p.evaluate(() => { window.BLINK_LOG = new Set(); for (let i = 0; i < Math.round(END * 30); i++) renderFrame(i / 30); return [...window.BLINK_LOG]; });
await b.close();
// group consecutive closed frames of the same character into blink events
const by = {}; log.forEach(k => { const [id, f] = k.split('@'); (by[id] = by[id] || []).push(+f); });
const ev = [];
for (const [id, fs] of Object.entries(by)) { fs.sort((a, b) => a - b); let s = fs[0], prev = fs[0];
  for (const f of fs.slice(1).concat([1e9])) { if (f - prev > 1) { ev.push({ id, start: s, frames: prev - s + 1 }); s = f; } prev = f; } }
ev.sort((a, b) => a.start - b.start);
const big = ev.filter(e => !/^(C|P)/.test(e.id));
const durs = ev.map(e => e.frames);
console.log('blink events (all on-screen faces):', ev.length, ' per min:', (ev.length / 55 * 60).toFixed(1));
console.log('main characters only (not crowd):', big.length, ' per min:', (big.length / 55 * 60).toFixed(1));
console.log('closed frames histogram:', durs.reduce((h, d) => (h[d] = (h[d] || 0) + 1, h), {}));
console.log(big.map(e => `${e.id}@${e.start}(${e.frames})`).join(' '));
