"""Turn <name>_frames.csv + transitions.json into per-film and per-shot statistics.
Usage: python3 -I summarize.py   -> summary.json, shots.csv
"""
import csv, json
import numpy as np

T = json.load(open('transitions.json'))
out = {}
shot_rows = []

def stats(a, ps=(5, 25, 50, 75, 95)):
    a = np.asarray(a, float); a = a[~np.isnan(a)]
    if not len(a): return None
    d = dict(mean=round(float(a.mean()), 3), sd=round(float(a.std()), 3))
    for p in ps: d[f'p{p}'] = round(float(np.percentile(a, p)), 3)
    d['max'] = round(float(a.max()), 3)
    return d

for name in ['spear', 'knight']:
    R = list(csv.DictReader(open(f'{name}_frames.csv')))
    col = lambda k: np.array([float(r[k]) if r[k] not in ('', None) else np.nan for r in R])
    N = len(R); fps = 30.0
    trans = T[name]
    in_trans = np.zeros(N, bool)
    for tr in trans: in_trans[tr['first']:tr['last'] + 1] = True
    ok = ~in_trans; ok[0] = False                 # frame-to-frame motion only inside clean shots
    ok &= col('track_inlier_ratio') >= 0.6       # trust only well-tracked frames

    mv, dx, dy, zm, rot = col('cam_move_px'), col('cam_dx_px'), col('cam_dy_px'), col('cam_zoom_pct'), col('cam_rot_deg')
    lc, ad = col('local_change_pct'), col('raw_absdiff')
    still = (mv < 0.25) & (np.abs(zm) < 0.02)

    # shots = spans between transitions
    bounds = [0] + [t['last'] + 1 for t in trans] + [N]
    starts = [0] + [t['last'] + 1 for t in trans]
    ends = [t['first'] for t in trans] + [N]
    shots = []
    for k, (a, b) in enumerate(zip(starts, ends)):
        sl = slice(a, b); m = ok[sl]
        row = dict(film=name, shot=k + 1, first_frame=a, last_frame=b - 1, start_s=round(a / fps, 2), dur_s=round((b - a) / fps, 2),
                   entered_by='start' if k == 0 else trans[k - 1]['type'],
                   luma_mean=round(float(np.nanmean(col('luma_mean')[sl])), 1),
                   luma_p5=round(float(np.nanmean(col('luma_p5')[sl])), 1),
                   luma_p95=round(float(np.nanmean(col('luma_p95')[sl])), 1),
                   shadow_pct_below_40=round(float(np.nanmean(col('shadow_pct_below_40')[sl])), 2),
                   sat_mean=round(float(np.nanmean(col('sat_mean')[sl])), 3),
                   colorfulness=round(float(np.nanmean(col('colorfulness')[sl])), 1),
                   rgb_mean='/'.join(str(round(float(np.nanmean(col(c)[sl])))) for c in ('mean_r', 'mean_g', 'mean_b')),
                   cam_move_px_median=round(float(np.nanmedian(mv[sl][m])), 2) if m.any() else None,
                   cam_move_px_p90=round(float(np.nanpercentile(mv[sl][m], 90)), 2) if m.any() else None,
                   cam_zoom_pct_per_frame_median=round(float(np.nanmedian(zm[sl][m])), 3) if m.any() else None,
                   total_zoom_pct=round(float((np.prod(1 + np.nan_to_num(zm[sl][m]) / 100) - 1) * 100), 1) if m.any() else None,
                   pct_frames_camera_still=round(float(still[sl][m].mean() * 100), 1) if m.any() else None,
                   local_change_pct_median=round(float(np.nanmedian(lc[sl][m])), 2) if m.any() else None)
        shots.append(row); shot_rows.append(row)

    durs = np.array([s['dur_s'] for s in shots])
    trans_len = np.array([t['last'] - t['first'] + 1 for t in trans])
    out[name] = dict(
        frames=N, duration_s=round(N / fps, 2), fps=fps,
        cuts=dict(hard_cuts=sum('hard cut' in t['type'] for t in trans),
                  dissolves=sum('dissolve' in t['type'] for t in trans),
                  wipes=sum('wipe' in t['type'] for t in trans),
                  total_transitions=len(trans),
                  shots=len(shots), avg_shot_s=round(float(durs.mean()), 2), median_shot_s=round(float(np.median(durs)), 2),
                  shortest_shot_s=round(float(durs.min()), 2), longest_shot_s=round(float(durs.max()), 2),
                  transition_frames_median=float(np.median(trans_len)), transition_frames_range=[int(trans_len.min()), int(trans_len.max())],
                  list=[dict(t=round(t['first'] / fps, 2), frames=t['last'] - t['first'] + 1, **t) for t in trans]),
        camera=dict(
            note='px = pixels of the 1080x1920 frame, per frame at 30 fps; measured inside shots only',
            move_px_per_frame=stats(mv[ok]), dx_px=stats(dx[ok]), dy_px=stats(dy[ok]),
            zoom_pct_per_frame=stats(zm[ok]), abs_zoom_pct_per_frame=stats(np.abs(zm[ok])), rotation_deg_per_frame=stats(rot[ok]),
            pct_frames_camera_still=round(float(still[ok].mean() * 100), 1),
            pct_frames_moving_over_1px=round(float((mv[ok] > 1).mean() * 100), 1),
            pct_frames_zooming_in=round(float((zm[ok] > 0.02).mean() * 100), 1),
            pct_frames_zooming_out=round(float((zm[ok] < -0.02).mean() * 100), 1)),
        animation=dict(
            note='local_change = % of picture changing by >25 luma after removing camera motion (characters, FX)',
            local_change_pct=stats(lc[ok]), raw_absdiff=stats(ad[ok]),
            duplicate_frames=int((ad < 0.5).sum())),
        light=dict(luma_mean=stats(col('luma_mean')), luma_p1=stats(col('luma_p1')), luma_p5=stats(col('luma_p5')),
                   luma_median=stats(col('luma_median')), luma_p95=stats(col('luma_p95')), luma_p99=stats(col('luma_p99')),
                   shadow_pct_below_40=stats(col('shadow_pct_below_40')), highlight_pct_above_235=stats(col('highlight_pct_above_235'))),
        colour=dict(sat_mean=stats(col('sat_mean')), sat_median=stats(col('sat_median')), sat_p90=stats(col('sat_p90')),
                    colorfulness=stats(col('colorfulness')),
                    rgb_mean=[round(float(np.nanmean(col(c))), 1) for c in ('mean_r', 'mean_g', 'mean_b')]),
    )

json.dump(out, open('summary.json', 'w'), indent=1)
with open('shots.csv', 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(shot_rows[0].keys())); w.writeheader(); w.writerows(shot_rows)
for n, o in out.items():
    c, cam, an, l, co = o['cuts'], o['camera'], o['animation'], o['light'], o['colour']
    print(f"\n=== {n}  {o['duration_s']}s  shots={c['shots']} avg={c['avg_shot_s']}s median={c['median_shot_s']}s  hard={c['hard_cuts']} dissolves={c['dissolves']} wipes={c['wipes']}  trans frames median={c['transition_frames_median']} range={c['transition_frames_range']}")
    print(' camera px/frame', cam['move_px_per_frame'])
    print(' zoom %/frame', cam['zoom_pct_per_frame'], '| still%', cam['pct_frames_camera_still'], 'in%', cam['pct_frames_zooming_in'], 'out%', cam['pct_frames_zooming_out'])
    print(' rot', cam['rotation_deg_per_frame'])
    print(' local change %', an['local_change_pct'], 'dups', an['duplicate_frames'])
    print(' luma mean', l['luma_mean']); print(' luma p5', l['luma_p5']); print(' luma p95', l['luma_p95']); print(' shadow<40 %', l['shadow_pct_below_40'])
    print(' sat', co['sat_mean']); print(' colorfulness', co['colorfulness'], 'rgb', co['rgb_mean'])
