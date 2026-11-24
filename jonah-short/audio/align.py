"""Place the per-shot narration lines on the film timeline and time every caption word to the audio.
No speech recogniser is reachable here, so words are aligned from the audio itself: voiced stretches are found
from the energy envelope, each phrase (split at the script's punctuation) is matched to a voiced stretch, and the
words inside it are spread by syllable weight.
Usage: python3 -I audio/align.py  -> audio/vo_mix.wav, words.override.js, audio/vo_timing.json
"""
import json, re, subprocess, wave
import numpy as np

SR = 48000
shots = json.load(open('audio/shots.json'))          # [{n, a, b, text}] from timing.js
lines = {}
for s in shots:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'audio/line_{s["n"]:02d}.mp3', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    lines[s['n']] = np.frombuffer(raw, np.int16).astype(np.float32) / 32768

def trim(x):
    env = np.convolve(np.abs(x), np.ones(480) / 480, 'same'); th = max(env.max() * 0.04, 1e-4)
    idx = np.where(env > th)[0]; return x[max(0, idx[0] - 960): idx[-1] + 1920]

def syl(w):
    w = re.sub(r'[^a-z0-9]', '', w.lower())
    if w.isdigit(): return 2 if len(w) <= 2 else 6
    m = re.findall(r'[aeiouy]+', w); n = len(m) or 1
    if len(w) > 3 and w.endswith('e') and not w.endswith('le') and n > 1: n -= 1
    return max(1, n)

total = shots[-1]['b'] + 1.0
mix = np.zeros(int((total + 3) * SR), np.float32)
words_out, timing = [], []
cursor = 0.0
for s in shots:
    x = trim(lines[s['n']]); dur = len(x) / SR
    window = s['b'] - s['a'] - 0.2
    speed = 1.0
    if dur > window:                                   # gently speed up a line that overruns its shot (max 12 %)
        speed = min(1.12, dur / window)
        p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={speed:.4f}', '-f', 'f32le', '-'], input=x.tobytes(), capture_output=True, check=True)
        x = np.frombuffer(p.stdout, np.float32); dur = len(x) / SR
    start = max(s['a'] + 0.1, cursor + 0.15)
    i0 = int(start * SR); mix[i0:i0 + len(x)] += x
    cursor = start + dur
    # voiced stretches inside the line
    env = np.convolve(np.abs(x), np.ones(int(0.02 * SR)) / int(0.02 * SR), 'same')
    voiced = env > env.max() * 0.06
    gaps = []                                          # silences >= 110 ms: candidate phrase breaks
    k = 0
    while k < len(voiced):
        if not voiced[k]:
            j = k
            while j < len(voiced) and not voiced[j]: j += 1
            if (j - k) / SR >= 0.11 and k > 0 and j < len(voiced): gaps.append(((k + j) / 2 / SR, (j - k) / SR))
            k = j
        else: k += 1
    ws = s['text'].split()
    phrases, cur = [], []
    for w in ws:
        cur.append(w)
        if re.search(r'[.,:;?!]["”’]?$', w): phrases.append(cur); cur = []
    if cur: phrases.append(cur)
    # pick the longest gaps as phrase breaks, in time order
    nb = len(phrases) - 1
    breaks = sorted(sorted(gaps, key=lambda g: -g[1])[:nb])
    # if too few silences, fall back to syllable-proportional breaks
    weights = [sum(0.55 + 0.45 * syl(w) for w in p) for p in phrases]
    if len(breaks) < nb:
        acc = np.cumsum(weights)[:-1] / sum(weights) * dur; breaks = [(b, 0.0) for b in acc]
    bounds = [0.0] + [b[0] for b in breaks] + [dur]
    for pi, p in enumerate(phrases):
        a, b = bounds[pi], bounds[pi + 1]
        if pi > 0: a += breaks[pi - 1][1] / 2
        if pi < len(phrases) - 1: b -= breaks[pi][1] / 2
        wts = [0.55 + 0.45 * syl(w) for w in p]; t = a
        for w, wt in zip(p, wts):
            words_out.append({'w': w, 't0': round(start + t, 3)}); t += (b - a) * wt / sum(wts)
    timing.append({'shot': s['n'], 'start': round(start, 3), 'dur': round(dur, 3), 'speed': round(speed, 3), 'shot_window': [s['a'], s['b']]})

# loudness: narration to -14 LUFS (two-pass loudnorm), stereo 48 kHz
raw = mix[: int((total + 0.5) * SR)]
open('audio/vo_raw.f32', 'wb').write(raw.tobytes())
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'audio/vo_raw.f32',
                '-af', 'highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-14:TP=-1.5:LRA=7', '-ar', str(SR), '-ac', '2', 'audio/vo_mix.wav'], check=True)
open('words.override.js', 'w').write('// caption/word timings aligned to the narration (audio/align.py)\nwindow.WORD_OVERRIDE = ' + json.dumps(words_out) + ';\n')
json.dump(timing, open('audio/vo_timing.json', 'w'), indent=1)
for t in timing: print(t)
print(len(words_out), 'words')
