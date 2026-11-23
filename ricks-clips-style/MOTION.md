# Stick-figure motion: measured from a platformer reference

**Source:** a 34 s screen recording at 1462×844 and 30 fps, mostly gameplay from a hand-drawn stick-figure platformer.
- The figure was tracked frame by frame by its orange trousers: 897 of 1,029 frames.
- Camera scroll was removed with phase correlation.
- Scripts: `motion/track.py`. Numbers: `motion/motion_metrics.json`.
- **Unit:** H = the figure's standing height, which is 147 px in the recording.

**Scope:** only the construction and movement are reused, on our own Jonah. The reference character's design (hair, trousers, name) is not.

## Construction
| | Measured | Our sketch rig (`jonah-short/sketch.js`) |
|---|---|---|
| Hip height | 0.40 H | 0.40 H |
| Head | open circle, white fill, ~0.21 H across, no fixed face | 0.21 H, dot eyes, beard |
| Torso and limbs | single ink lines, ≈ 0.027 H thick | 8 / 300 = 0.027 H |
| Hands and feet | line ends; small foot strokes | same |
| Lower body | flared garment around the thighs, following each leg | striped tunic flaring to the knees |
| Line quality | hand-drawn wobble; every frame is a fresh drawing (animated on ones) | jitter re-seeded every frame |
| Secondary motion | hair drags behind the motion, with speed streaks above ~3 H/s | head-wrap tails trail opposite the velocity and streak above 3 H/s |

## Motion
| | Measured |
|---|---|
| Run speed | median 2.2–2.4 H/s while moving; p90 5.3 H/s; max ~7–10 H/s |
| Acceleration | p90 ≈ 30 H/s², reaching full speed in about 0.2 s |
| Run cycle | one step every 0.25 s, so a full cycle every 0.5 s |
| Stride vs speed | garment width/height grows from 0.97 standing to 1.26 at 4–8 H/s, as the legs open up |
| Jump gravity | 12.8 H/s² (four clean jumps: 11.1, 12.8, 12.8, 13.6) |
| Jump take-off speed | 5.4–6.1 H/s |
| Airtime | 0.87–0.93 s |
| Peak height | 1.32–1.55 H |
| Anticipation | crouches to 0.73–0.75 H for 2 frames, then stretches to 1.16–1.43 H at take-off |
| Landing | hips dip 0.08 H, held about 5 frames, recovered over about 3 (≈ 0.27 s); dust puffs on both sides |
| Skid | leans back, arms flung wide, a trail of dust |
| Airborne poses | rising: legs tucked, arms up; falling: arms up, legs dangling, hair streaming upward; somersaults rotate the whole figure |

## Used in Jonah 3D
- **Harbour:** a skid-turn away from the NINEVEH sign, with dust.
- **Underwater:** sinking with the tails streaming up.
- **Beach:** spat out on a ballistic arc at the measured gravity with a full spin, then the landing dip with dust, then dazed on his knees.
- **Nineveh gate:** a bouncing walk cycle.
- **Hill:** a stomp-hop on "furious", with gravity, landing dust and steam.

## Fluidity check (Nov 23)
The first version of the sketch rig looked busy rather than fluid. Measured at the reference's scale (147 px figure, 180×210 crop, ink pixels changing per frame):

| | Reference | Sketch v1 | Sketch v2 (now) |
|---|---|---|---|
| Line jitter at rest | none; the 1.4 % idle figure equals the static-scenery noise floor (1.43 %) | random re-drawn every frame | none: fixed hand-drawn irregularity |
| Idle motion | near-still | jitter only | gentle continuous sway, 0.12 %/frame |
| Pose change | ~4.5 %/frame over ~14 frames | snapped in 1–5 frames | 4–5 %/frame over ~14 frames |
| Biggest step / typical step | 1.6–3.9× | 5.4–10× | 2.4× |
| Frozen frames while moving | 0–2 | n/a | 0 |

**What makes v2 fluid** (`sketch.js`: `poseTrack`, `alive`, `jonahPose`, `tailSpring`)
- **Every pose change is a timeline key.** It blends with a quintic ease that has continuous speed: about 0.4 s by default, 0.08–0.25 s for skids and landings.
- **Airborne vs grounded is a number, not a switch,** so the hips never jump.
- **Overlapping action:** the arms trail the body by 2 frames and the head by 1.
- **Head-wrap tails** run on a damped spring (ω = 13 rad/s, ζ = 0.35), so they lag, overshoot and settle.
- **The walk phase comes from distance travelled,** so the feet don't slide.
