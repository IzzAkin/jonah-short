"""Track the orange-trousered stick figure frame by frame. -> track.csv
Per frame: hip centroid (orange blob), blob size/aspect, figure bounding box (dark ink connected to the hips)."""
import csv
import numpy as np, cv2

cap = cv2.VideoCapture('fp.mp4'); fps = cap.get(cv2.CAP_PROP_FPS)
rows = []; i = 0; prev = None
while True:
    ok, f = cap.read()
    if not ok: break
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    m = cv2.inRange(hsv, (8, 120, 140), (28, 255, 255))
    m[:60] = 0                                             # HUD (triangle counter) at the top
    n, lab, st, cen = cv2.connectedComponentsWithStats(m)
    best = None
    for k in range(1, n):
        a = st[k][4]
        if a < 40 or a > 4000: continue
        if prev is not None and np.hypot(cen[k][0] - prev[0], cen[k][1] - prev[1]) > 160: continue
        if best is None or a > st[best][4]: best = k
    row = dict(frame=i, t=round(i / fps, 4))
    if best is not None:
        x, y, w, h, a = st[best]; cx, cy = cen[best]
        # ink figure: dark pixels in a window around the hips, connected after dilation
        X0, Y0 = max(0, int(cx) - 90), max(0, int(cy) - 150)
        win = f[Y0:int(cy) + 60, X0:int(cx) + 90]
        g = cv2.cvtColor(win, cv2.COLOR_BGR2GRAY)
        bg = np.median(g)
        ink = ((g < bg - 60) | (cv2.inRange(cv2.cvtColor(win, cv2.COLOR_BGR2HSV), (8, 120, 140), (28, 255, 255)) > 0)).astype(np.uint8)
        ink = cv2.dilate(ink, np.ones((5, 5), np.uint8))
        n2, l2, s2, c2 = cv2.connectedComponentsWithStats(ink)
        hx, hy = int(cx) - X0, int(cy) - Y0
        k2 = l2[min(hy, l2.shape[0] - 1), min(hx, l2.shape[1] - 1)]
        if k2 == 0:
            d = [np.hypot(c2[j][0] - hx, c2[j][1] - hy) for j in range(1, n2)]; k2 = 1 + int(np.argmin(d)) if d else 0
        bx = by = bw = bh = None
        if k2: bx, by, bw, bh = s2[k2][0] + X0, s2[k2][1] + Y0, s2[k2][2], s2[k2][3]
        row.update(hip_x=round(cx, 2), hip_y=round(cy, 2), pants_w=w, pants_h=h, pants_area=a,
                   fig_x=bx, fig_y=by, fig_w=bw, fig_h=bh)
        prev = (cx, cy)
    rows.append(row); i += 1
keys = ['frame', 't', 'hip_x', 'hip_y', 'pants_w', 'pants_h', 'pants_area', 'fig_x', 'fig_y', 'fig_w', 'fig_h']
with open('track.csv', 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=keys); w.writeheader()
    for r in rows: w.writerow({k: r.get(k) for k in keys})
print(len(rows), 'frames,', sum('hip_x' in r for r in rows), 'tracked')
