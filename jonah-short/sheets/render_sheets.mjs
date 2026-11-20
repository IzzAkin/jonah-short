import { createRequire } from 'module'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(fileURLToPath(import.meta.url)), out = process.argv[2] || path.join(dir, 'out');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
for (const id of ['jonah', 'king', 'sailors', 'townspeople', 'fish']) {
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(dir, 'sheets.html') + '?c=' + id); await p.evaluate(() => window.READY);
  if (errs.length) { console.log(id, errs); continue; }
  const d = await p.evaluate(() => document.getElementById('c').toDataURL('image/png'));
  fs.writeFileSync(path.join(out, `sheet_${id}.png`), Buffer.from(d.split(',')[1], 'base64')); console.log('wrote', id); await p.close();
}
await b.close();
