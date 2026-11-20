"""Frame-by-frame measurement of a 1080x1920 Rick's Clips short.

Usage: python3 -I analyze.py <video> <name>
Writes <name>_frames.csv (one row per frame) and <name>_summary.json.

All pixel distances are reported in pixels of the full 1080x1920 frame.
The caption band (y 1270-1440 of 1920) is masked out of every measurement.
"""
import sys, json, csv
import numpy as np, cv2

path, name = sys.argv[1], sys.argv[2]
S = 0.5                                    # analyse at 540x960, report at 1080x1920
CAP = (int(1270 * S), int(1440 * S))       # caption band rows at analysis scale

cap = cv2.VideoCapture(path)
fps = cap.get(cv2.CAP_PROP_FPS)
mask = None
rows = []
prev = prev_gray = prev_hist = None
i = 0
while True:
    ok, frame = cap.read()
    if not ok:
        break
    small = cv2.resize(frame, None, fx=S, fy=S, interpolation=cv2.INTER_AREA)
    h, w = small.shape[:2]
    if mask is None:
        mask = np.ones((h, w), np.uint8); mask[CAP[0]:CAP[1], :] = 0
    m = mask.astype(bool)

    # --- light and colour (BT.709 luma on 0-255; HSV saturation on 0-1)
    b, g, r = [small[..., k].astype(np.float32) for k in range(3)]
    Y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    y = Y[m]
    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
    sat = hsv[..., 1][m].astype(np.float32) / 255.0
    rg, yb = r - g, 0.5 * (r + g) - b
    colorfulness = np.sqrt(rg[m].std() ** 2 + yb[m].std() ** 2) + 0.3 * np.sqrt(rg[m].mean() ** 2 + yb[m].mean() ** 2)
    p1, p5, p25, p50, p75, p95, p99 = np.percentile(y, [1, 5, 25, 50, 75, 95, 99])
    row = dict(frame=i, t=round(i / fps, 3),
               luma_mean=round(float(y.mean()), 2), luma_p1=round(float(p1), 1), luma_p5=round(float(p5), 1),
               luma_p25=round(float(p25), 1), luma_median=round(float(p50), 1), luma_p75=round(float(p75), 1),
               luma_p95=round(float(p95), 1), luma_p99=round(float(p99), 1),
               shadow_pct_below_40=round(float((y < 40).mean() * 100), 2),
               highlight_pct_above_235=round(float((y > 235).mean() * 100), 2),
               sat_mean=round(float(sat.mean()), 4), sat_median=round(float(np.median(sat)), 4),
               sat_p90=round(float(np.percentile(sat, 90)), 4), colorfulness=round(float(colorfulness), 2),
               mean_r=round(float(r[m].mean()), 1), mean_g=round(float(g[m].mean()), 1), mean_b=round(float(b[m].mean()), 1))

    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    hist = cv2.calcHist([hsv], [0, 1], mask, [32, 16], [0, 180, 0, 256]); cv2.normalize(hist, hist, 1, 0, cv2.NORM_L1)
    if prev is not None:
        # --- raw change and histogram distance (cut detection)
        row['raw_absdiff'] = round(float(cv2.absdiff(gray, prev_gray)[m].mean()), 3)
        row['hist_dist'] = round(float(cv2.compareHist(prev_hist, hist, cv2.HISTCMP_BHATTACHARYYA)), 4)
        # --- global camera motion: track corners, fit translation + uniform scale + rotation
        pts = cv2.goodFeaturesToTrack(prev_gray, 600, 0.01, 8, mask=mask)
        dx = dy = zoom = rot = np.nan; inl = 0.0; local = np.nan; n_pts = 0
        if pts is not None and len(pts) >= 12:
            nxt, st, _ = cv2.calcOpticalFlowPyrLK(prev_gray, gray, pts, None, winSize=(21, 21), maxLevel=4)
            good = st.ravel() == 1
            n_pts = int(good.sum())
            if n_pts >= 12:
                A, inliers = cv2.estimateAffinePartial2D(pts[good], nxt[good], method=cv2.RANSAC, ransacReprojThreshold=1.5)
                if A is not None:
                    sc = float(np.hypot(A[0, 0], A[1, 0]))
                    # translation of the frame centre, in full-res pixels
                    c = np.array([w / 2, h / 2])
                    moved = A[:, :2] @ c + A[:, 2]
                    dx, dy = (moved - c) / S
                    zoom = (sc - 1) * 100
                    rot = float(np.degrees(np.arctan2(A[1, 0], A[0, 0])))
                    inl = float(inliers.mean())
                    # what still changes after removing the camera move = animation inside the frame
                    warped = cv2.warpAffine(prev_gray, A, (w, h), borderMode=cv2.BORDER_REPLICATE)
                    d = cv2.absdiff(warped, gray)
                    inner = np.zeros_like(m); inner[20:-20, 20:-20] = True
                    local = float(((d > 25) & m & inner).sum() / (m & inner).sum() * 100)
        row.update(cam_dx_px=None if np.isnan(dx) else round(float(dx), 3), cam_dy_px=None if np.isnan(dy) else round(float(dy), 3),
                   cam_move_px=None if np.isnan(dx) else round(float(np.hypot(dx, dy)), 3),
                   cam_zoom_pct=None if np.isnan(zoom) else round(zoom, 4), cam_rot_deg=None if np.isnan(rot) else round(rot, 4),
                   track_inlier_ratio=round(inl, 3), tracked_points=n_pts,
                   local_change_pct=None if np.isnan(local) else round(local, 3))
    rows.append(row)
    prev, prev_gray, prev_hist = small, gray, hist
    i += 1

keys = list(rows[1].keys())
with open(f'{name}_frames.csv', 'w', newline='') as f:
    wr = csv.DictWriter(f, fieldnames=keys); wr.writeheader()
    for r_ in rows: wr.writerow({k: r_.get(k) for k in keys})
json.dump(dict(video=path, fps=fps, frames=len(rows), duration=len(rows) / fps), open(f'{name}_summary.json', 'w'), indent=1)
print(name, len(rows), 'frames')
