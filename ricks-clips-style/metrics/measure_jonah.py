import csv, numpy as np, json
R=list(csv.DictReader(open('jonah_frames.csv')))
c=lambda k: np.array([float(r[k]) if r[k] not in ('',None) else np.nan for r in R])
N=len(R); ok=np.ones(N,bool); ok[0]=False
for b in [4.8,11.1,17.5,22.8,26.3,32.1,37.5,43.6,47.8, 8.69,21.08,33.98,39.55,51.69, 16.0,16.4,29.6,45.0]:
    f=int(round(b*30)); ok[max(0,f-6):f+7]=False
ok &= c('track_inlier_ratio')>=0.6
mv,zm,lc,ad=c('cam_move_px'),c('cam_zoom_pct'),c('local_change_pct'),c('raw_absdiff')
still=(mv<0.25)&(np.abs(zm)<0.02)
P=lambda a,q=50: round(float(np.nanpercentile(a,q)),3)
o=dict(cam_move_median=P(mv[ok]),cam_move_p95=P(mv[ok],95),zoom_median=P(zm[ok]),zoom_in_pct=round(float((zm[ok]>0.02).mean()*100),1),
 still_pct=round(float(still[ok].mean()*100),1),dup_frames=int((ad<0.5).sum()),local_change_median=P(lc[ok]),local_change_p95=P(lc[ok],95))
for k in ['luma_mean','luma_p5','luma_p95','shadow_pct_below_40','sat_mean','colorfulness']: o[k+'_mean']=round(float(np.nanmean(c(k))),3); o[k+'_median']=P(c(k))
o['rgb']=[round(float(np.nanmean(c(k))),1) for k in ('mean_r','mean_g','mean_b')]
json.dump(o,open('jonah_compare.json','w'),indent=1); print(json.dumps(o))
