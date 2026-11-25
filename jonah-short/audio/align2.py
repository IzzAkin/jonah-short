"""Cut the single-take narration into shots and time every caption word, without a speech recogniser.
1. Detect pauses in the take. 2. Match pauses to punctuation in the script by dynamic programming (the expected
time of each punctuation mark comes from syllable counts scaled to the measured speech time). 3. Words inside each
phrase are spread by syllable weight. 4. Each shot's segment has its long pauses shortened to the script's
~0.25 s and is sped up (atempo) to fit its shot window; it starts 0.1 s into the shot.
Usage: python3 -I audio/align2.py -> audio/vo_mix.wav, words.override.js, audio/vo_timing.json
"""
import json, re, subprocess
import numpy as np

SR = 48000
shots = json.load(open('audio/shots.json'))
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'audio/narration_full.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.float32).copy()

# --- pauses
hop = int(0.01 * SR); env = np.array([np.sqrt((x[i:i + hop] ** 2).mean()) for i in range(0, len(x) - hop, hop)])
db = 20 * np.log10(env + 1e-9); thr = max(db.max() - 38, -60); quiet = db < thr
pauses = []; k = 0
while k < len(quiet):
    if quiet[k]:
        j = k
        while j < len(quiet) and quiet[j]: j += 1
        if (j - k) * 0.01 >= 0.16: pauses.append((k * 0.01, j * 0.01))
        k = j
    else: k += 1
lead = pauses[0][1] if pauses and pauses[0][0] < 0.05 else 0.0
if pauses and pauses[0][0] < 0.05: pauses = pauses[1:]
tail = pauses[-1][0] if pauses and pauses[-1][1] > len(x) / SR - 0.05 else len(x) / SR
if pauses and pauses[-1][1] > len(x) / SR - 0.05: pauses = pauses[:-1]

# --- words, phrases, syllables
def syl(w):
    w = re.sub(r'[^a-z0-9]', '', w.lower())
    if w.isdigit(): return 2 if len(w) <= 2 else 9          # "120,000" read as "a hundred and twenty thousand"
    m = re.findall(r'[aeiouy]+', w); n = len(m) or 1
    if len(w) > 3 and w.endswith('e') and not w.endswith('le') and n > 1: n -= 1
    return max(1, n)
words = []
for s in shots:
    for w in s['text'].split(): words.append({'w': w, 'shot': s['n'], 'syl': syl(w)})
words[-1]['end'] = True
for i, w in enumerate(words):
    w['punct'] = bool(re.search(r'[.,:;?!]["”’]?$', w['w'])) and i < len(words) - 1
    w['shotEnd'] = i < len(words) - 1 and words[i + 1]['shot'] != w['shot']
wt = np.array([0.5 + 0.5 * w['syl'] for w in words])
speech = (tail - lead) - sum(b - a for a, b in pauses)
unit = speech / wt.sum()
# expected (speech-only) end time of each punctuation word
cum = np.cumsum(wt) * unit
P = [i for i, w in enumerate(words) if w['punct']]
# DP: assign pauses (in order) to punctuation marks (in order); each pause -> one mark; marks may have no pause.
# cost = |speech time before pause - expected speech time at mark|; shot ends must take a pause.
pt = []; acc = 0.0
for a, b in pauses: pt.append(a - lead - acc); acc += b - a
INF = 1e9; nP, nQ = len(P), len(pt)
D = np.full((nP + 1, nQ + 1), INF); D[0, 0] = 0; back = {}
for j in range(1, nQ + 1):                     # pauses before the first mark can be skipped too
    D[0, j] = D[0, j - 1] + 0.8; back[(0, j)] = (0, j - 1, 'skip')
for i in range(1, nP + 1):
    for j in range(0, nQ + 1):
        if j > 0 and D[i, j - 1] < INF and D[i, j - 1] + 0.8 < D[i, j]: D[i, j] = D[i, j - 1] + 0.8; back[(i, j)] = (i, j - 1, 'skip')
        must = words[P[i - 1]]['shotEnd']
        if not must and D[i - 1, j] < INF and D[i - 1, j] + 0.0 < D[i, j]: D[i, j] = D[i - 1, j]; back[(i, j)] = (i - 1, j, False)
        if j > 0 and D[i - 1, j - 1] < INF:
            pdur = pauses[j - 1][1] - pauses[j - 1][0]; full = bool(re.search(r'[.?!]["”’]?$', words[P[i - 1]]['w']))
            c = D[i - 1, j - 1] + abs(pt[j - 1] - cum[P[i - 1]]) + (1.2 if full and pdur < 0.35 else 0) + (0.6 if not full and pdur > 0.5 else 0)
            if c < D[i, j]: D[i, j] = c; back[(i, j)] = (i - 1, j - 1, True)
        if j > 0 and D[i, j - 1] + 0.8 < D[i, j]: D[i, j] = D[i, j - 1] + 0.8; back[(i, j)] = (i, j - 1, 'skip')
j = nQ; i = nP
assign = {}
if D[nP, nQ] >= INF: raise SystemExit('alignment failed: pauses %d, marks %d' % (nQ, nP))
while i > 0 or j > 0:
    pi, pj, used = back[(i, j)]
    if used is True: assign[P[i - 1]] = pauses[j - 1]
    i, j = pi, pj
# phrase boundaries in source time
bounds = [lead]; idx = [-1]
for wi in sorted(assign): bounds += [assign[wi][0], assign[wi][1]]; idx.append(wi)
bounds.append(tail); idx.append(len(words) - 1)
src_t0 = [0.0] * len(words)
for p in range(len(idx) - 1):
    a, b = bounds[2 * p], bounds[2 * p + 1]
    ws = list(range(idx[p] + 1, idx[p + 1] + 1)); tw = sum(wt[w] for w in ws); t = a
    for w in ws: src_t0[w] = t; t += (b - a) * wt[w] / tw

# --- per shot: cut, shorten pauses, fit, place
mix = np.zeros(int((shots[-1]['b'] + 3) * SR), np.float32); out_words = []; timing = []
for s in shots:
    ws = [i for i, w in enumerate(words) if w['shot'] == s['n']]
    seg_a = max(0.0, src_t0[ws[0]] - 0.03)
    nxt = ws[-1] + 1
    seg_b = (assign[ws[-1]][0] + 0.06) if ws[-1] in assign else tail + 0.05
    # internal pauses inside this segment, shortened to 0.25 s
    inside = [assign[w] for w in ws[:-1] if w in assign]
    pieces, maps, pos, t = [], [], seg_a, 0.0
    for a, b in inside:
        pieces.append(x[int(pos * SR):int(a * SR)]); maps.append((pos, a, t)); t += a - pos
        keep = min(b - a, 0.25); pieces.append(np.zeros(int(keep * SR), np.float32)); t += keep; pos = b
    pieces.append(x[int(pos * SR):int(seg_b * SR)]); maps.append((pos, seg_b, t)); t += seg_b - pos
    seg = np.concatenate(pieces); dur = len(seg) / SR
    window = s['b'] - s['a'] - 0.22
    speed = max(1.0, dur / window)
    if speed > 1.0:
        p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={speed:.4f}', '-f', 'f32le', '-'], input=seg.tobytes(), capture_output=True, check=True)
        seg = np.frombuffer(p.stdout, np.float32)
    start = s['a'] + 0.1; i0 = int(start * SR); mix[i0:i0 + len(seg)] += seg[: len(mix) - i0]
    def src2out(ts):
        for a, b, off in maps:
            if a - 1e-6 <= ts <= b + 1e-6: return start + (off + ts - a) / speed
        return start
    for w in ws: out_words.append({'w': words[w]['w'], 't0': round(src2out(max(src_t0[w], seg_a)), 3)})
    timing.append({'shot': s['n'], 'start': round(start, 2), 'len': round(len(seg) / SR, 2), 'window': round(s['b'] - s['a'], 2), 'speed': round(speed, 3)})

open('audio/vo_raw.f32', 'wb').write(mix.tobytes())
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'audio/vo_raw.f32',
                '-af', 'highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-14:TP=-1.5:LRA=7', '-ar', str(SR), '-ac', '2', 'audio/vo_mix.wav'], check=True)
open('words.override.js', 'w').write('// caption and action word times aligned to the narration (audio/align2.py)\nwindow.WORD_OVERRIDE = ' + json.dumps(out_words) + ';\n')
json.dump(timing, open('audio/vo_timing.json', 'w'), indent=1)
for t in timing: print(t)
print('pauses', len(pauses), 'marks', len(P), 'assigned', len(assign), 'words', len(out_words))
