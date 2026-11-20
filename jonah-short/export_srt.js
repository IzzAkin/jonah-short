// node export_srt.js -> out/captions.srt (one word per cue, same timing as the burned-in captions)
const fs = require('fs'); const vm = require('vm');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/timing.js', 'utf8') + ';this.WORDS=WORDS;this.SHOTS=SHOTS;', ctx);
const f = s => { const ms = Math.round(s * 1000); const h = String(Math.floor(ms / 3600000)).padStart(2, '0'), m = String(Math.floor(ms / 60000) % 60).padStart(2, '0'), sec = String(Math.floor(ms / 1000) % 60).padStart(2, '0'); return `${h}:${m}:${sec},${String(ms % 1000).padStart(3, '0')}`; };
const W = ctx.WORDS, endAll = ctx.SHOTS[ctx.SHOTS.length - 1].b + 0.4;
fs.writeFileSync(__dirname + '/out/captions.srt', W.map((w, i) => `${i + 1}\n${f(w.t0)} --> ${f(i + 1 < W.length ? W[i + 1].t0 : endAll)}\n${w.w}\n`).join('\n'));
console.log(W.length + ' words');
