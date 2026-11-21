# Rick's Clips: measured numbers

Both reference films were measured frame by frame:

| | Spear vs Shield | Knight's Loophole |
|---|---|---|
| Format | 1080×1920, 30 fps | 1080×1920, 30 fps |
| Length | 45.0 s (1,350 frames) | 40.6 s (1,219 frames) |

**Units**
- Pixel figures are in pixels of the full 1080×1920 frame, per frame at 30 fps.
- Brightness is BT.709 luma from 0 to 255.
- Saturation is HSV saturation from 0 to 1.
- Colourfulness uses the Hasler–Süsstrunk measure, where about 60 or more reads as "very colourful".
- The caption band (y 1270–1440) is masked out of every measurement.

Raw data is in `metrics/`:
- `*_frames.csv` holds one row per frame.
- `shots.csv` holds one row per shot.
- `summary.json` holds the film-level statistics.
- `transitions.json` lists every verified transition.

The scripts are `analyze.py`, `summarize.py` and `blinks.py`. Run them on any new render to compare it against these targets.

---

## 1. Cuts and transitions (each one checked by eye)

| | Spear | Knight |
|---|---|---|
| Hard cuts | **1** | **2** |
| Dissolves | 5 + 2 time-of-day dissolves (same framing) | 10 |
| Wipes | 1 (character walks into camera) | 3 (1 slide, 2 foreground objects) |
| Shots | 10 | 16 |
| Shot length: median / mean | **2.8 s / 4.2 s** | **1.8 s / 2.3 s** |
| Shortest / longest shot | 0.7 s / 11.8 s | 0.5 s / 5.2 s |
| Dissolve length | 8–13 frames, median 9 (**0.30 s**) | 3–19 frames, median 8 (**0.27 s**) |

**What this means in practice**
- Almost everything is a dissolve of about 0.25–0.45 s (8–13 frames). Hard cuts are rare, at 1–2 per film.
- The opening "shot" of the spear film runs 11.8 s because it travels through three locations on a single camera move: courtyard, then bridge, then valley.
- Wipes use something in the scene: a character walking into the lens, a stack of crates, a tree trunk, or a document sliding off. They run 5–21 frames.
- To show time passing, the film dissolves day to night inside the same framing, over 13 frames (0.43 s).

**Spear transitions**

| Time | Frames | Type | What happens |
|---|---|---|---|
| 11.83 s | 8 | dissolve | aerial valley to top-down armies |
| 18.93 s | 13 | dissolve, same framing | day to night |
| 20.07 s | 13 | dissolve, same framing | night to day |
| 23.77 s | 9 | dissolve | field to war tent |
| 25.43 s | 21 | character wipe + dissolve | messenger walks into camera, then the blacksmith's house appears |
| 28.00 s | 1 | hard cut | exterior to interior |
| 33.03 s | 8 | dissolve | workshop to blueprint |
| 40.67 s | 9 | dissolve | forge to field |
| 43.27 s | 10 | dissolve | field to scoreboard |

**Knight transitions**

| Time | Frames | Type |
|---|---|---|
| 3.70 s | 5 | slide wipe |
| 4.80 s | 12 | tree-trunk wipe |
| 5.73 s | 17 | crate wipe |
| 7.47 s | 8 | dissolve |
| 12.23 s | 6 | dissolve |
| 16.30 s | 6 | dissolve |
| 18.93 s | 11 | dissolve |
| 20.80 s | 10 | dissolve |
| 21.87 s | 9 | dissolve |
| 24.37 s | 19 | dissolve |
| 26.87 s | 2 | hard cut (2-frame blend) |
| 29.70 s | 1 | hard cut |
| 31.30 s | 3 | quick dissolve |
| 33.17 s | 5 | dissolve |
| 38.50 s | 10 | dissolve |

## 2. Camera movement (inside shots, transition frames excluded)

| Per frame | Spear | Knight |
|---|---|---|
| Camera shift: median | **0.76 px** (≈ 23 px/s) | **2.7 px** (≈ 81 px/s) |
| Camera shift: 25th / 75th / 95th percentile | 0.22 / 2.3 / 7.7 px | 0.69 / 4.7 / 20.9 px |
| Fastest move | 24 px | 40 px (whip push-ins) |
| Zoom: median | **+0.17 %** (≈ +5 % per second) | **+0.15 %** (≈ +4.6 % per second) |
| Zoom: 95th percentile | +0.87 % | +3.1 % (fast push-ins) |
| Frames zooming in / out | 65 % / 23 % | 63 % / 31 % |
| Frames where the camera is fully still | **10 %** | **2 %** |
| Rotation | ±0.04° (effectively none) | ±0.05° |

**What this means in practice**
- The camera is moving in 90–98 % of frames.
- The default is a slow push-in of about 0.15–0.2 % scale per frame.
- Reveals are pulled back out.
- There is no camera roll.

The spear film's 10 % of still frames are deliberate dead holds on a gag line: the frame freezes completely for 8–24 frames (0.27–0.8 s). The longest is 0.8 s on "Then nobody moved." It's a comedy beat, not a rest. The knight film uses faster push-ins and snap zooms; a single snap peaks at 5–15 % zoom in one frame.

## 3. Movement inside the frame (camera move removed)

| | Spear | Knight |
|---|---|---|
| Picture changing by more than 25 levels: median | **1.8 %** of the frame | **3.9 %** |
| Picture changing: 95th percentile | 6.8 % | 11 % |
| Duplicate (held) frames | 52, mostly the deliberate holds | 6 |

Something animates in almost every frame: a character, a banner, sparkles or particles. The camera moves on every frame, so the film is effectively animated "on ones" (a new image every frame).

## 4. Brightness and shadows

| | Spear | Knight |
|---|---|---|
| Average brightness: mean (5th–95th percentile across frames) | **127** (60–175) | **138** (109–174) |
| Shadow level (darkest 5 % of pixels): mean | **60** | **56** |
| Highlight level (brightest 5 % of pixels): mean | 207 | 226 |
| Pixels darker than 40: median | **0.8 %** | **1.3 %** |
| Pixels darker than 40: mean | 9.4 % (night and forge scenes) | 2.2 % |
| Pixels brighter than 235 | small | small |

**What this means in practice**
- The shadows are lifted. In daylight scenes, the darkest 5 % of the image sits around 45–100 and almost nothing is near black.
- Only the night forge interior crushes down, to a 5th-percentile level of 13 with 46 % of pixels under 40.
- Highlights stop short of pure white, around 230–245.

## 5. Colour

| | Spear | Knight |
|---|---|---|
| Saturation: mean (5th–95th percentile) | **0.445** (0.33–0.65) | **0.452** (0.29–0.58) |
| Colourfulness: mean (5th–95th percentile) | **70** (55–91) | **78** (41–106) |
| Average R/G/B | 136 / 125 / 121 | 156 / 134 / 119 |

**What this means in practice**
- The palette is very colourful but not neon.
- There is a consistent **warm bias**: red is higher than green, which is higher than blue.
- Night scenes are the only exception: they flip to blue (spear night shot R/G/B = 84 / 84 / 118).

## 6. Blinks (every one checked by eye)

| | Spear | Knight |
|---|---|---|
| Blinks found | **11** | **20** |
| Blinks per minute (whole film) | **15** | **30** |
| Eyes closed for: median (range) | **3 frames** (2–4) = 100 ms | **2 frames** (2–3) = 67 ms |
| Gap between blinks, same character: median | about 2–3 s | 1.1 s (knight), 2.75 s (priest) |

**Blink timing**

- **Spear**, frames where the eyes are closed:
  - 19–22 king
  - 26–28 shield king
  - 53–54 king
  - 124–127 shield king
  - 227–229 old man
  - 587–588 shield king
  - 895–897 blacksmith
  - 905–907 green hood
  - 909–910 blacksmith
  - 956–958 red hood
  - 1315–1317 blacksmith
- **Knight**, the frame each blink starts:
  - 17 knight
  - 84 priest
  - 121 priest
  - 249 priest
  - 268 priest
  - 383 man in hat
  - 497 priest
  - 510 knight
  - 530 knight
  - 635 knight
  - 643 knight
  - 673 priest
  - 675 knight
  - 682 priest
  - 689 knight
  - 704 knight
  - 710 priest
  - 869 priest
  - 977 knight
  - 1057 knight

**How a blink is drawn**
- The eyes **pop** straight from open to a short horizontal line, then back. There is no in-between frame.
- They stay closed for 2–3 frames, occasionally 4.
- **Double blinks** are common, with 8–15 frames between them. Knight frames 635/643 and 675/689/704 are examples.
- Blinks often **mark an expression change**: the character blinks and opens on a new face, such as shocked turning to wide-eyed.
- They cluster in dialogue close-ups, where a face on screen blinks about every 1–3 s.

These counts are a **minimum**. The detector only catches blinks on white heads that are big enough to resolve, so tiny background characters aren't counted.

---

## 7. Our Jonah render compared, before (v1) and after re-rendering to these targets (v2)

v2 was measured with the same `analyze.py`. The blink count comes from a frame-by-frame log of every visible blink in the render.

| Metric | Rick's Clips | Jonah v1 | **Jonah v2** |
|---|---|---|---|
| Frames with a fully still camera | 2–10 % | 38 % | **1.5 %** ✓ (the only still frames are the gag hold) |
| Zoom per frame: median | +0.15–0.17 % | 0 % | **+0.16 %** ✓ |
| Camera shift: median | 0.8–2.7 px | 0.28 px | **1.0 px** ✓ |
| Dead hold on a gag line | 8–24 frames | none | **15 frames** on "the twist." ✓ |
| Dissolve length | 8–13 frames | 18 frames | **9 frames** ✓ |
| In-shot camera cuts | dissolves every 2–3 s | none | **5 added** (shots 2, 4, 8, 9, 11) ✓ |
| Blinks per minute (main characters) | 15–30 | 0 | **25** ✓ |
| Eyes closed for | 2–3 frames | – | **2–3 frames**, popped, with double blinks and blinks on every expression change ✓ |
| Movement inside the frame: median | 1.8–3.9 % | 0.57 % | **1.2 %**, still under target (see note) |
| Saturation: mean / median | 0.45 / 0.40–0.48 | 0.37 | **0.43 / 0.41** ✓ |
| Colourfulness: median | 68–80 | 50 | **71** ✓ |
| Average brightness | 127–138 | 131 | **137** ✓ |
| Shadow level (darkest 5 %): median | 54–57 | 36 | **54** ✓ |
| Pixels darker than 40: median | 0.8–1.3 % | 7.7 % | **0.6 %** ✓ |
| Highlight level (brightest 5 %): median | 209–233 | 205 | **222** ✓ |
| Warm bias (red over blue) | +15 to +37 | +21 | **+32** ✓ |

**Note on movement inside the frame.** This figure counts every pixel that changes once the camera move is taken out. In Rick's Clips, much of it comes from painted texture and multi-layer parallax, which shift slightly against each other as the camera moves. Our flat vector fills produce very little of that. Adding more motes moved the number by only about 0.1 and made the scenes look like snow. Reaching 2 % or more needs textured backgrounds or more character animation, not more particles.

---

## 8. Night film: "Why Samurai Feared The Flying Thunder" (screen recordings, Nov 21)

**Source:** three phone screen recordings, `v3`/`v4`/`v5`, totalling 28.5 s.
- **Resolution:** the 9:16 picture is only 596 px wide, about 55 % of a 1080p source.
- **Overlays:** the app's icons, title, comment bubbles and captions are masked (`metrics/analyze_screenrec.py`).
- **Duplicates:** 17–30 % of frames repeat because of the capture cadence. They're dropped before measuring.
- **Not measured, because unreliable from this source:** camera motion per frame, transition lengths, blinks.
- **Better source:** the original 1080p download would allow these.

| | v3 | v4 | v5 | Day films (spear/knight) |
|---|---|---|---|---|
| Average brightness | 73 | 62 | 91 | 127–138 |
| Shadow level (darkest 5 %) | 25 | 29 | 39 | 56–60 |
| Highlight level (brightest 5 %) | 213 | 146 | 164 | 207–226 |
| Pixels darker than 40 (median) | 26 % | 36 % | 10 % | 0.8–1.3 % |
| Saturation | 0.36 | 0.35 | 0.33 | 0.45 |
| Colourfulness | 44 | 34 | 47 | 70–78 |
| Average R/G/B | 79/71/78 | 64/60/72 | 94/89/95 | warm (R > G > B) |

**What this means in practice**
- **Brightness:** night is about half the brightness of day.
- **Shadows:** genuinely dark shadows; a quarter to a third of the frame sits under 40.
- **Colour:** about 25 % less saturated than day, and cool or neutral (blue at or above red), not warm.
- **Highlights:** bright accents stay in the frame (moon, fires, glints), so the brightest 5 % still reaches 146–213.

**Jonah 3D storm shots (3–4)**

| | Before | Now | Night target |
|---|---|---|---|
| Average brightness | 58–63 | 63 | 62–91 ✓ |
| Highlights | 117 | 161 | 146–213 ✓ |
| Pixels darker than 40 | 27–43 % | 34 % | 10–36 % ✓ |
| Saturation | 0.52 | 0.37 | 0.33–0.36 ✓ |

How we got there:
- a night grade, `GRADE_NIGHT` in `three/main3d.js`
- a moon glow behind the clouds
- two deck lanterns
