"""Light/colour/cut measurements for phone screen recordings of a short (app overlays masked).
Usage: python3 -I analyze_screenrec.py v3 v4 v5  -> screenrec_summary.json
The 9:16 picture sits at x 662..1258 of the 1920x1080 recording. Masked: top bar, right-hand icon column,
bottom channel/title/comment area, caption band. Duplicated frames (screen-capture cadence) are dropped first.
"""
import sys, json
import numpy as np, cv2

X0, WD = 662, 596
mask = np.ones((1080, WD), bool)
mask[:75] = False                 # top bar
mask[:, 500:] = False             # right icon column / side tab
mask[880:] = False                # channel, title, comment bubble
mask[690:790] = False             # caption band
out = {}
for name in sys.argv[1:]:
    cap = cv2.VideoCapture(f'{name}.mp4'); prev = None; rows = []
    while True:
        ok, f = cap.read()
        if not ok: break
        c = f[:, X0:X0 + WD]
        g = cv2.cvtColor(c, cv2.COLOR_BGR2GRAY)
        if prev is not None and cv2.absdiff(g, prev)[mask].mean() < 0.8: continue   # duplicate frame from capture
        b, gg, r = [c[..., k].astype(np.float32)[mask] for k in range(3)]
        Y = 0.2126 * r + 0.7152 * gg + 0.0722 * b
        hsv = cv2.cvtColor(c, cv2.COLOR_BGR2HSV); s = hsv[..., 1][mask] / 255.0
        rg, yb = r - gg, 0.5 * (r + gg) - b
        hist = cv2.calcHist([hsv], [0, 1], mask.astype(np.uint8), [32, 16], [0, 180, 0, 256]); cv2.normalize(hist, hist, 1, 0, cv2.NORM_L1)
        rows.append(dict(luma=float(Y.mean()), p5=float(np.percentile(Y, 5)), p95=float(np.percentile(Y, 95)), sh40=float((Y < 40).mean() * 100),
                         sat=float(s.mean()), colorful=float(np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2)),
                         rgb=[float(r.mean()), float(gg.mean()), float(b.mean())], hist=hist))
        prev = g
    hd = [0] + [float(cv2.compareHist(rows[i - 1]['hist'], rows[i]['hist'], cv2.HISTCMP_BHATTACHARYYA)) for i in range(1, len(rows))]
    for r_ in rows: r_.pop('hist')
    k = lambda key: np.array([x[key] for x in rows])
    base = np.array([np.median(hd[max(1, i - 20):i + 21]) for i in range(len(hd))])
    spikes = [(i, round(hd[i], 3)) for i in range(1, len(hd)) if hd[i] > max(0.15, 3 * base[i])]
    out[name] = dict(unique_frames=len(rows), luma_mean=round(float(k('luma').mean()), 1), luma_p5=round(float(k('p5').mean()), 1), luma_p95=round(float(k('p95').mean()), 1),
                     shadow_pct_below_40_median=round(float(np.median(k('sh40'))), 2), shadow_pct_below_40_mean=round(float(k('sh40').mean()), 2),
                     sat_mean=round(float(k('sat').mean()), 3), colorfulness=round(float(k('colorful').mean()), 1),
                     rgb_mean=[round(float(v), 1) for v in np.array([x['rgb'] for x in rows]).mean(0)], cut_candidates_unique_frame_idx=spikes)
    print(name, json.dumps(out[name]))
json.dump(out, open('screenrec_summary.json', 'w'), indent=1)
