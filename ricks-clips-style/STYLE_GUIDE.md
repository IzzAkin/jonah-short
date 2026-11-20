# Style breakdown: "An Unstoppable Spear vs an Unbreakable Shield" (Rick's Clips)

Source: 1080×1920 vertical, 30 fps, 45.07 s, about -15 LUFS integrated.
Reference frames are in `refs/`.

---

## 1. The format in one sentence
A **45-second illustrated parable** told by a fast narrator. **One word of caption on screen at a time.** The camera **never stops moving** and **never hard-cuts**: every scene flows into the next through a camera move, a match dissolve or a character walking through it.

---

## 2. Script structure (reconstructed from captions)

| Time | Beat | Narration |
|---|---|---|
| 0–6 s | **Hook / paradox** | "A blacksmith sold a spear that could pierce anything to one king, and a shield that nothing could pierce to his worst enemy." |
| 6–11 s | **Stakes** | "The two kingdoms had been at war for 100 years, and now each king finally had the weapon to end it." |
| 11–17 s | **Setup** | "So both armies marched to the same field. The spear at the front of one, the shield at the front of the other." |
| 17–23 s | **Stalemate / absurd escalation** | "Then nobody moved. A whole week went by with 10,000 soldiers just staring at two pieces of metal." |
| 23–28 s | **Twist begins** | "One night, each king secretly sent a messenger to the blacksmith with the same question:" |
| 28–32 s | **The question** | "Which one is real? And to both of them, he gave the same answer: Attack and find out." |
| 32–38 s | **Logic reveal** | "You see, a spear that pierces anything and a shield nothing can pierce can't both exist." |
| 38–42 s | **Punchline** | "So the blacksmith made both out of plain old iron, knowing neither king would dare be first to find out." |
| 42–45 s | **Button (moral)** | "And that's how he ended the war." |

**Script rules to copy**
- About **115 words in 45 s, roughly 155 wpm**. Delivery is brisk and conversational with almost no pauses.
- Open with the **paradox itself** in the first sentence. Don't use a "did you know" or any preamble.
- The story beats go: **paradox → stakes (a number) → escalation with a funny concrete image → secret twist → the clever character explains the logic → a one-line button.**
- Use concrete, visual numbers: "100 years", "10,000 soldiers", "a whole week".
- The last line calls back to the stakes ("ended the war"). The visual calls back too: the scoreboard flips from YEARS AT WAR 100 to **DAYS OF PEACE 001**.

---

## 3. Camera language (the most important part)

- **Continuous slow push-in** on every held shot, about 3–8 % scale over 2–3 s with ease-in-out. A frame is never fully static.
- **No hard cuts.** Scene-change detection found effectively one cut in 45 s. Transitions are:
  - **Pull-back reveals:** the courtyard pulls back and tilts down to show it sits on a bridge, then the camera rises into an aerial view of the river valley with both armies (8.5–11 s).
  - **Top-down to perspective:** the aerial view of the army formations (arrow-shaped blocks of soldiers) tilts down to ground level on the field.
  - **Match dissolves on shape or colour:** the warm field at dusk dissolves into a warm candlelit war tent, where a map of "THE BORDER" mirrors the field.
  - **Character-led wipes:** the hooded messenger walks into the camera and through the tent curtain, and comes out at the blacksmith's house at night (25–26 s).
  - **Push through a frame:** the camera pushes into the house, then into the forge interior.
- **Time passing** is shown in the same framing with a lighting change: day becomes a moonlit night, the king gets a bird's nest on his crown and a cobweb on his spear, then it's day again. This is a classic gag cycle.
- **Depth:** characters are 2D cut-outs placed in a 2.5D environment with parallax. The foreground is out of focus (blurred props at the frame edges), there's a mid-ground plane and a painted background.

Practical build: assemble the layers in **After Effects with a 3D camera**, or in Blender with image planes. Animate a single camera path through all the sets and keyframe it to the voice-over.

---

## 4. Visual style

**Characters**
- Simple stick-limb bodies with **large round white heads** and thick dark outlines, about 4–5 px at 1080 width.
- Faces are minimal: dot or small round eyes, expressive eyebrows, mustaches and goatees as identity markers. Accessories do all the identity work: a gold crown, a silver helmet-crown, a nightcap.
- Clothing is flat colour with **one cel-shade tone** and a subtle paper or grain texture.
- Reaction "emotes" sell the beats: sweat drops, sparkles, closed happy eyes, sweat-drop worry.
- Note: design **your own** character set. Keep the qualities (round heads, thick outlines, tiny faces, prop-driven identity) without copying Rick's Clips' characters.

**Colour coding**
- Each side gets one saturated colour and **one emblem**. Here that's Red with an ↑ arrow (spear) against Teal with a ◎ circle (shield).
- The emblems repeat everywhere: banners, army formations, scoreboard halves, a split ground medallion, a split crest at the forge, and "SPEARS / SHIELDS" signs. The viewer always knows whose side something is on.

**Environments**
- Painterly and saturated, like a storybook or casual mobile game. Soft gradients, puffy cumulus clouds, toy-like castles, low-poly-ish hills.
- Every scene has **one strong lighting mood**:

| Scene | Palette / light |
|---|---|
| Courtyard / field | bright daylight, blue sky, green grass |
| Field at dusk | desaturated amber haze with god-rays |
| War tent | warm red curtains, candle glow, orange bloom |
| Blacksmith exterior | cool indigo night, full moon, warm windows |
| Forge / blueprint | deep orange fire against blue blueprint paper |

- **Bloom and glow** on all light sources (candles, forge, metal glints). Floating dust or sparkle particles. A light vignette.

**Props as storytelling devices**
- A flip-number **scoreboard** (099 → 100 years at war, ending at 001 days of peace).
- **Blueprint** documents ("PIERCES ANYTHING" / "PIERCED BY NOTHING") that tear in half and get stamped "IMPOSSIBLE".
- **Price tags** ("PLAIN OLD IRON $1") on the spear and the shield.
- Little gags in the background: soldiers' helmets with flowers growing out of them at the end, tally marks on the wall.

---

## 5. Motion and animation
- Character animation is **limited and pose-to-pose**. There are 2–4 key poses per line, with eyes and brows swapping on key words and small idle bobs between them.
- **Hit-on-the-word:** actions land exactly on the stressed word. On "pierce" the spear stabs the anvil and an impact flash plus speed lines appear. On "metal" two glints sparkle. On "exist" the blueprint tears.
- Sparkle and glint FX fire every few seconds to keep the eye busy.
- Secondary motion: banners waving, flames flickering, particles drifting.

---

## 6. Captions
- **One word per screen** most of the time. Short phrases of 2–3 words appear for quick function-word groups ("sold a", "and now", "both of them,").
- Each caption changes on its word's onset, so one stays on screen for about 0.2–0.6 s.
- Font: heavy rounded geometric sans, e.g. **Montserrat ExtraBold/Black** or **Poppins Bold**. Sentence case, with the narration's punctuation kept ("enemy.", "years,").
- Style: **white fill, black stroke about 6 px, soft drop shadow**, roughly 64–72 px tall at 1080 wide. Centred horizontally.
- Placement: **y ≈ 1350 of 1920** (about 70 % down). This keeps it clear of the Shorts/TikTok UI and puts it over the lower-middle of the subject.
- No pop or bounce animation; it's a hard swap. Use the same style for the whole video.

---

## 7. Audio
- Voice-over is dry, close and compressed, and sits on top. Overall level is about **-15 LUFS** (fine for Shorts; normalise to -14).
- There's a **continuous light music bed** under the whole piece (whimsical, orchestral or pizzicato) with no silent gaps.
- **Dense SFX** sync to on-screen actions: clangs, whooshes on camera moves, sparkle chimes, page tears, a stamp thud, coins.
- The spectrogram shows near-continuous energy. Dead air gets cut out of the VO edit.

---

## 8. Production pipeline to replicate
1. **Script** about 110–120 words using the beat structure in §2. Read it aloud at about 155 wpm and aim for 42–48 s.
2. **Record or generate the VO.** Tighten breaths and gaps, then compress.
3. **Force-align word timestamps** (WhisperX or `faster-whisper` with `word_timestamps=True`). These drive the captions, the camera keyframes and the "hit-on-the-word" actions.
4. **Storyboard as one camera path.** For each beat, write down the set, the hero prop, the gag, and how it transitions into the next set (pull-back, match dissolve or walk-through).
5. **Assets:** a character rig (round head, swappable eyes/brows/mouths and accessories), backgrounds as layered PSD or PNG (sky, far, mid, near, foreground blur), and props.
6. **Animate in AE (or Blender):** 3D camera with constant easing, parallax layers, then a glow/bloom pass, particles and a vignette.
7. **Captions:** auto-generate one word per block from the timestamps, using the style in §6.
8. **Sound:** a music bed at about -24 dB under the VO, with SFX on every visual hit.
9. **Export** 1080×1920, 30 fps, H.264 at roughly 12–16 Mbps, AAC 320 kbps.

---

## 9. Checklist for each new video
- [ ] The first sentence states the paradox or hook
- [ ] There's a concrete number for the stakes, plus an absurd escalation image
- [ ] Two colour-coded sides, each with an emblem repeated everywhere
- [ ] The camera is always moving, with zero hard cuts
- [ ] At least one time-passing gag in the same framing
- [ ] An action lands on each stressed word
- [ ] The ending visually calls back to the opening prop
- [ ] Captions are one word at a time, white with a black stroke, at about 70 % of frame height
- [ ] A music bed throughout, with SFX on every hit
