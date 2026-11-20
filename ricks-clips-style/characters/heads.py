"""Detect character heads (round, pale, ink-outlined) in reference frames and draw them for checking.
Usage: python3 -I heads.py frames/*.png  -> heads_detect.json + check/<frame>.png
"""
import sys, json, os
import numpy as np, cv2

os.makedirs('check', exist_ok=True)
out = {}
for path in sys.argv[1:]:
    img = cv2.imread(path); name = os.path.basename(path)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    v, s = hsv[..., 2].astype(int), hsv[..., 1].astype(int)
    # pale = bright and weakly saturated, relative to the frame (heads are tinted by scene light)
    pale = ((v > np.percentile(v, 70)) & (s < 90)).astype(np.uint8)
    pale = cv2.morphologyEx(pale, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(pale)
    found = []
    for k in range(1, n):
        x, y, w, h, a = st[k]
        if a < 1500 or w < 40 or h < 40: continue
        cnt, _ = cv2.findContours((lab[y:y + h, x:x + w] == k).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        c = max(cnt, key=cv2.contourArea) + [x, y]
        (cx, cy), r = cv2.minEnclosingCircle(c)
        fill = a / (PI_R2 := np.pi * r * r)
        # fit a circle to the lower 2/3 of the boundary (hats, crowns and helmets cover the top)
        pts = c[:, 0, :].astype(float)
        low = pts[pts[:, 1] > cy - 0.3 * r]
        if len(low) < 20: continue
        A = np.c_[2 * low[:, 0], 2 * low[:, 1], np.ones(len(low))]
        bvec = low[:, 0] ** 2 + low[:, 1] ** 2
        sol, *_ = np.linalg.lstsq(A, bvec, rcond=None)
        fx, fy = sol[0], sol[1]; fr = np.sqrt(sol[2] + fx * fx + fy * fy)
        resid = np.abs(np.hypot(low[:, 0] - fx, low[:, 1] - fy) - fr).mean() / fr
        if fill < 0.45 or resid > 0.06 or fr < 25 or fr > 700: continue
        found.append(dict(cx=round(fx, 1), cy=round(fy, 1), r=round(fr, 1), fill=round(fill, 2), resid=round(float(resid), 3)))
    out[name] = found
    vis = img.copy()
    for i, f in enumerate(found):
        cv2.circle(vis, (int(f['cx']), int(f['cy'])), int(f['r']), (0, 255, 0), 3)
        cv2.putText(vis, str(i), (int(f['cx']) - 10, int(f['cy'] - f['r'] - 8)), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 3)
    cv2.imwrite(f'check/{name}', cv2.resize(vis, None, fx=0.4, fy=0.4))
json.dump(out, open('heads_detect.json', 'w'), indent=1)
for k, v in out.items(): print(k, [(f['cx'], f['cy'], f['r']) for f in v])
