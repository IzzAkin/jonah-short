"""Find blink candidates: a small change inside a white head that reverts within a few frames.
Usage: python3 -I blinks.py <video> <name>  -> <name>_blink_candidates.json + crop sheets for review
"""
import sys, json
import numpy as np, cv2

path, name = sys.argv[1], sys.argv[2]
S = 0.5
CAP = (int(1270 * S), int(1440 * S))
cap = cv2.VideoCapture(path)
G, C = [], []
while True:
    ok, f = cap.read()
    if not ok: break
    s = cv2.resize(f, None, fx=S, fy=S, interpolation=cv2.INTER_AREA)
    G.append(cv2.cvtColor(s, cv2.COLOR_BGR2GRAY))
N = len(G); h, w = G[0].shape
trans = json.load(open('transitions.json'))[name]
bad = np.zeros(N, bool)
for t in trans: bad[max(0, t['first'] - 2):t['last'] + 3] = True

def best(patch, img, cx, cy, r):
    ph, pw = patch.shape
    x0, y0 = max(0, cx - r), max(0, cy - r)
    x1, y1 = min(w, cx + pw + r), min(h, cy + ph + r)
    reg = img[y0:y1, x0:x1]
    if reg.shape[0] < ph or reg.shape[1] < pw: return -1, (cx, cy)
    res = cv2.matchTemplate(reg, patch, cv2.TM_CCOEFF_NORMED)
    _, mx, _, loc = cv2.minMaxLoc(res)
    return mx, (x0 + loc[0], y0 + loc[1])

cands = []
for i in range(1, N - 1):
    if bad[i]: continue
    a, b = G[i - 1], G[i]
    # coarse stabilisation: phase correlation for the small camera drift between neighbours
    (sx, sy), _ = cv2.phaseCorrelate(a.astype(np.float32), b.astype(np.float32))
    M = np.float32([[1, 0, sx], [0, 1, sy]])
    aw = cv2.warpAffine(a, M, (w, h), borderMode=cv2.BORDER_REPLICATE)
    d = cv2.absdiff(aw, b); d[CAP[0]:CAP[1]] = 0; d[:12] = 0; d[-12:] = 0; d[:, :12] = 0; d[:, -12:] = 0
    bw = (d > 45).astype(np.uint8)
    bw = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(bw)
    for k in range(1, n):
        x, y, ww, hh, area = st[k]
        if not (6 <= area <= 400 and ww <= 45 and hh <= 30): continue
        pad = 10
        X0, Y0 = max(0, x - pad), max(0, y - pad); X1, Y1 = min(w, x + ww + pad), min(h, y + hh + pad)
        p_prev = aw[Y0:Y1, X0:X1]
        # must sit in a white head: lots of near-white, some dark ink
        if (p_prev > 195).mean() < 0.35 or (p_prev < 90).mean() < 0.02: continue
        if p_prev.std() < 10: continue
        c_now, _ = best(p_prev, b, X0, Y0, 6)
        if c_now > 0.85: continue
        for j in range(i + 1, min(N, i + 9)):
            if bad[j]: break
            c_back, loc = best(p_prev, G[j], X0, Y0, 6 + 3 * (j - i))
            if c_back > 0.93:
                cands.append(dict(frame=i, back=j, dur=j - i, x=int((X0 + X1) / 2 / S), y=int((Y0 + Y1) / 2 / S), c_now=round(float(c_now), 2), c_back=round(float(c_back), 2)))
                break

# merge candidates that are the same event (same place, overlapping time)
cands.sort(key=lambda c: (c['frame'], c['x']))
merged = []
for c in cands:
    if merged and c['frame'] - merged[-1]['frame'] <= 3 and abs(c['x'] - merged[-1]['x']) < 120 and abs(c['y'] - merged[-1]['y']) < 120:
        continue
    merged.append(c)
json.dump(merged, open(f'{name}_blink_candidates.json', 'w'), indent=1)
print(name, 'raw', len(cands), 'merged', len(merged))

# review sheet: for each candidate, crops of frames i-2 .. back+1 around the spot (full res)
need = set()
for c in merged: need.update(range(c['frame'] - 2, c['back'] + 2))
del C, G
cap = cv2.VideoCapture(path); F = {}; k = 0
while True:
    ok, f = cap.read()
    if not ok: break
    if k in need: F[k] = f
    k += 1
F_len = k
rows = []
for c in merged:
    cx, cy = c['x'], c['y']; R = 120
    x0, y0 = max(0, cx - R), max(0, cy - R)
    tiles = []
    for j in range(c['frame'] - 2, min(F_len, c['back'] + 2)):
        t = F[j][y0:y0 + 2 * R, x0:x0 + 2 * R].copy()
        t = cv2.copyMakeBorder(t, 0, 2 * R - t.shape[0], 0, 2 * R - t.shape[1], cv2.BORDER_CONSTANT)
        t = cv2.resize(t, (120, 120))
        cv2.putText(t, str(j), (3, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 255), 1)
        tiles.append(t)
    row = np.hstack(tiles + [np.zeros((120, 120 * (12 - len(tiles)), 3), np.uint8)] if len(tiles) < 12 else tiles[:12])
    cv2.putText(row, f"#{len(rows)}", (1330, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2) if row.shape[1] > 1330 else None
    rows.append(row)
for p in range(0, len(rows), 16):
    cv2.imwrite(f'review/{name}_blinks_{p // 16}.png', np.vstack(rows[p:p + 16]))
