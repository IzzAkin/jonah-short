"""Measure drawing and lighting of character heads/bodies from hand-marked head circles.
Every length is reported as a fraction of head diameter d.  Usage: python3 -I measure.py -> char_metrics.json
"""
import json
import numpy as np, cv2

# frame, cx, cy, r (full-res px), who, lighting
HEADS = [
    ('sp_0.3', 192, 872, 88, 'king (crown)', 'day, courtyard'),
    ('sp_0.3', 548, 866, 90, 'blacksmith', 'day, courtyard'),
    ('sp_0.3', 892, 868, 93, 'shield king', 'day, courtyard'),
    ('sp_2.6', 639, 755, 111, 'blacksmith', 'day, courtyard'),
    ('sp_41.5', 149, 912, 156, 'king close-up', 'day, field'),
    ('sp_44.6', 910, 925, 129, 'blacksmith', 'day, courtyard'),
    ('kn_1.0', 873, 928, 96, 'priest', 'day, market'),
    ('sp_38.6', 298, 709, 146, 'blacksmith', 'forge fire'),
    ('sp_29.6', 537, 914, 111, 'blacksmith', 'night interior, candle'),
    ('sp_29.6', 252, 962, 57, 'red hood', 'night interior, candle'),
    ('sp_29.6', 826, 957, 58, 'green hood', 'night interior, candle'),
    ('sp_24.6', 700, 938, 131, 'king', 'tent, candle'),
    ('sp_24.6', 411, 936, 80, 'red hood', 'tent, candle'),
]
LUMA = lambda im: 0.2126 * im[..., 2] + 0.7152 * im[..., 1] + 0.0722 * im[..., 0]

def bilinear(img, x, y):
    return cv2.getRectSubPix(img, (1, 1), (float(x), float(y)))[0, 0].astype(float)

res = []
for frame, cx, cy, r, who, light in HEADS:
    im = cv2.imread(f'frames/{frame}.png').astype(np.float32)
    Y = LUMA(im)
    hh, ww = Y.shape
    yy, xx = np.mgrid[0:hh, 0:ww]
    dist = np.hypot(xx - cx, yy - cy)
    inner = dist < 0.82 * r
    Lin = np.percentile(Y[inner], 75)

    # --- outline: radial profiles on the sides of the head (top has hats, bottom has beards/bodies)
    th, ocol, rim = [], [], []
    for a in list(range(-40, 41, 4)) + list(range(140, 221, 4)):
        ca, sa = np.cos(np.radians(a)), np.sin(np.radians(a))
        rs = np.arange(0.80 * r, 1.30 * r, 0.5)
        prof = np.array([LUMA(bilinear(im, cx + ca * q, cy + sa * q)[None, :])[0] for q in rs])
        dark = prof < 0.5 * Lin
        if not dark.any(): continue
        i0 = np.argmax(dark); i1 = i0
        while i1 + 1 < len(dark) and dark[i1 + 1]: i1 += 1
        t = (i1 - i0 + 1) * 0.5
        if t < 2 or t > 0.2 * r: continue
        th.append(t)
        ocol.append(np.mean([bilinear(im, cx + ca * q, cy + sa * q) for q in rs[i0:i1 + 1]], axis=0))
        after = prof[i1 + 1:i1 + 1 + int(0.03 * r / 0.5) + 2]
        far = prof[min(len(prof) - 1, i1 + int(0.12 * r / 0.5)):]
        if len(after) and len(far): rim.append(float(after.max() - np.median(far)))
    oc = np.median(ocol, axis=0) if ocol else [0, 0, 0]

    # --- fill: lit vs shade (k-means on luma of non-feature pixels)
    feat = inner & (Y < 0.45 * Lin)
    fillm = inner & ~feat & (Y > 0.55 * Lin)
    px = im[fillm]; ly = Y[fillm]
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
    _, labels, cent = cv2.kmeans(ly.reshape(-1, 1).astype(np.float32), 2, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    lit_k = int(np.argmax(cent)); labels = labels.ravel()
    lit, shade = px[labels == lit_k].mean(0), px[labels != lit_k].mean(0)
    sx, sy = xx[fillm][labels != lit_k], yy[fillm][labels != lit_k]
    shade_dir = float(np.degrees(np.arctan2(-(sy.mean() - cy), sx.mean() - cx)))  # 0 = right, 90 = up
    shade_off = float(np.hypot(sx.mean() - cx, sy.mean() - cy) / (2 * r))

    # --- features (eyes etc.): dark blobs inside the face
    n, lab, st, cen = cv2.connectedComponentsWithStats(feat.astype(np.uint8))
    blobs = [dict(x=round((cen[k][0] - cx) / (2 * r), 3), y=round((cen[k][1] - cy) / (2 * r), 3), w=round(st[k][2] / (2 * r), 3), h=round(st[k][3] / (2 * r), 3), area=round(st[k][4] / (4 * r * r), 4))
             for k in range(1, n) if st[k][4] > 0.0006 * 4 * r * r]

    # --- body directly under the head: lit vs shade of the robe
    bx0, bx1, by0, by1 = int(cx - 0.45 * r), int(cx + 0.45 * r), int(cy + 1.2 * r), int(cy + 2.4 * r)
    body = None
    if by1 < hh:
        bp = im[by0:by1, bx0:bx1].reshape(-1, 3); bl = LUMA(bp[None])[0]
        keep = bl > np.percentile(bl, 15)
        _, bl2, bc = cv2.kmeans(bl[keep].reshape(-1, 1).astype(np.float32), 2, None, crit, 3, cv2.KMEANS_PP_CENTERS)
        hi = int(np.argmax(bc)); bl2 = bl2.ravel()
        b_lit, b_sh = bp[keep][bl2 == hi].mean(0), bp[keep][bl2 != hi].mean(0)
        body = dict(lit_rgb=[round(float(v)) for v in b_lit[::-1]], shade_rgb=[round(float(v)) for v in b_sh[::-1]],
                    shade_to_lit_luma=round(float(LUMA(b_sh[None, None])[0, 0] / LUMA(b_lit[None, None])[0, 0]), 3))
    fm = im.reshape(-1, 3).mean(0)
    res.append(dict(frame=frame, who=who, light=light, head_d_px=2 * r,
        outline_px=round(float(np.median(th)), 1) if th else None, outline_over_d=round(float(np.median(th)) / (2 * r), 4) if th else None,
        outline_rgb=[round(float(v)) for v in oc[::-1]],
        head_lit_rgb=[round(float(v)) for v in lit[::-1]], head_shade_rgb=[round(float(v)) for v in shade[::-1]],
        head_shade_to_lit_luma=round(float(LUMA(shade[None, None])[0, 0] / LUMA(lit[None, None])[0, 0]), 3),
        head_shade_fraction=round(float((labels != lit_k).mean()), 3), shade_side_deg=round(shade_dir), shade_offset_over_d=round(shade_off, 3),
        rim_light_luma_median=round(float(np.median(rim)), 1) if rim else None, rim_light_luma_p90=round(float(np.percentile(rim, 90)), 1) if rim else None,
        frame_mean_rgb=[round(float(v)) for v in fm[::-1]], features=blobs, body=body))
json.dump(res, open('char_metrics.json', 'w'), indent=1)
for x in res:
    print(f"{x['frame']:8s} {x['who']:14s} {x['light']:24s} d={x['head_d_px']:4d} line={x['outline_px']}px ({x['outline_over_d']}d) ink={x['outline_rgb']} lit={x['head_lit_rgb']} shade={x['head_shade_rgb']} s/l={x['head_shade_to_lit_luma']} frac={x['head_shade_fraction']} dir={x['shade_side_deg']} rim={x['rim_light_luma_median']}/{x['rim_light_luma_p90']} body={x['body']['shade_to_lit_luma'] if x['body'] else None}")
