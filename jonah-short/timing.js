// Shot list and narration, from "Jonah — Short Film Script" (Nov 19, 2026).
// Word times are estimated from the shot windows (about 3.3 words/s, with pauses at punctuation).
// When a real voice-over exists, put forced-alignment times in words.override.js
// (window.WORD_OVERRIDE = [{w, t0}, ...]) and every caption and word-cued action follows it.
const FPS = 30, W = 1080, H = 1920;
const END = 55.0; // 54 s of narration plus a 1 s hold

const SHOTS = [
  { n: 1,  a: 0.0,  b: 4.8,  text: 'A man spent three days inside a fish, and he got there by running from God.' },
  { n: 2,  a: 4.8,  b: 11.1, text: "God told Jonah to go to Nineveh, the enemy's great city, and warn it. Jonah bought a ticket going the opposite way." },
  { n: 3,  a: 11.1, b: 17.5, text: 'Out at sea, a storm hit so hard the sailors each cried out to their own god. Jonah was asleep below deck.' },
  { n: 4,  a: 17.5, b: 22.8, text: 'They cast lots, and the lot fell on Jonah. “Throw me into the sea,” he said, “and it will calm.”' },
  { n: 5,  a: 22.8, b: 26.3, text: 'They did. The sea went still. And a great fish swallowed him.' },
  { n: 6,  a: 26.3, b: 29.3, text: 'For three days and three nights, Jonah prayed in the dark.' },
  { n: 7,  a: 29.3, b: 32.1, text: 'Then the fish spat him out onto dry land.' },
  { n: 8,  a: 32.1, b: 37.5, text: 'So he walked into Nineveh and said one sentence: “40 days, and Nineveh will be overthrown.”' },
  { n: 9,  a: 37.5, b: 43.6, text: 'The whole city believed. Even the king sat down in ashes. And God spared them. Here’s the twist.' },
  { n: 10, a: 43.6, b: 47.8, text: 'Jonah was furious. He’d run away because he knew God was merciful.' },
  { n: 11, a: 47.8, b: 54.0, text: 'So God asked him, “Shouldn’t I care about a city of 120,000 people?” And the book ends on that question.' },
];

function syllables(w) {
  w = w.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/^\d/.test(w)) return w.length >= 6 ? 6 : 2;       // "120000" ~ one-hundred-twenty-thousand, "40" ~ for-ty
  const m = w.match(/[aeiouy]+/g);
  let n = m ? m.length : 1;
  if (w.length > 3 && w.endsWith('e') && !w.endsWith('le') && n > 1) n--;
  return Math.max(1, n);
}
const pauseAfter = w => /[.?!:]["”’]?$/.test(w) ? 0.28 : /[,;]["”’]?$/.test(w) ? 0.14 : 0;

function buildWords() {
  const out = [];
  for (const s of SHOTS) {
    const ws = s.text.split(/\s+/);
    const lead = 0.12, tail = 0.22;
    let pauses = 0;
    ws.forEach((w, i) => { if (i < ws.length - 1) pauses += pauseAfter(w); });
    const weights = ws.map(w => 0.55 + 0.45 * syllables(w));
    const unit = ((s.b - s.a) - lead - tail - pauses) / weights.reduce((x, y) => x + y, 0);
    let t = s.a + lead;
    ws.forEach((w, i) => {
      out.push({ w, t0: +t.toFixed(3), shot: s.n });
      t += weights[i] * unit + (i < ws.length - 1 ? pauseAfter(w) : 0);
    });
  }
  if (window.WORD_OVERRIDE && window.WORD_OVERRIDE.length === out.length)
    window.WORD_OVERRIDE.forEach((o, i) => { out[i].t0 = o.t0; });
  return out;
}
const WORDS = buildWords();

// Local time (seconds from shot start) of the k-th occurrence of `word` in shot n.
function wt(n, word, k = 1) {
  const s = SHOTS[n - 1];
  const norm = x => x.toLowerCase().replace(/[^a-z0-9’']/g, '');
  let c = 0;
  for (const o of WORDS) if (o.shot === n && norm(o.w) === norm(word) && ++c === k) return o.t0 - s.a;
  throw new Error(`word not found: shot ${n} "${word}" #${k}`);
}
