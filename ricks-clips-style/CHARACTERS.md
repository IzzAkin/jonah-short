# Character models: measured, and rebuilt for our cast

**Method**
- **Sources:** 17 reference frames from both films. Every head was marked by hand on gridded full-resolution crops (`characters/g_*.png`).
- **Automated measurements** (`characters/measure.py` → `char_metrics.json`): ink width from radial profiles, lit and shade colours by k-means, feature blobs, and the rim light outside the ink.
- **Units:** all sizes are in **head diameters (D)**.
- **Scope:** the cast is our own (Jonah, the king of Nineveh, sailors, townspeople, the fish). Only the measured *construction and lighting* is reused, not the reference characters.

## 1. Body

| | King (spear) | Priest (knight) | **Rig value** |
|---|---|---|---|
| Total height | 3.3 D | 3.7 D | **3.5 D** |
| Robe / body length | 2.0 D | 2.0 D | **2.0 D** (tunic 1.6 D) |
| Visible legs | 0.25 D (cape) | 0.6 D | **0.45 D** (tunic 0.75 D) |
| Shoulder width | 0.88 D | 0.74 D | **0.8 D** |
| Hem width | 1.27 D (cape) | 0.95 D | **1.1 D** |
| Head over body | chin 0.08 D above robe top | 0.10 D | **overlaps 0.08 D** |
| Limbs | thin ink sticks, ~0.04 D | | **0.045 D**, arms 1.3 D long, hands 0.15 D |

The old rig was 2.9 D tall with a 1.3 D body: the head was too big and the body too short.

## 2. Line and face

| | Measured | Rig |
|---|---|---|
| Ink line | 0.018–0.05 D, median ≈ 0.035 D | **0.035 D** |
| Ink colour | dark brown-plum, tinted by the scene light | `#3D2D24` |
| Eyes | at head-centre height (+0.00 to +0.04 D) | +0.02 D |
| Eye spacing | 0.25–0.27 D | **0.27 D** (old rig 0.37) |
| Dot eye | ≈ 0.07 D | **0.075 D** with a tiny highlight (old rig 0.11) |
| Brows | 0.19 D wide × 0.06 D thick, ≈ 0.17 D above the eyes; always drawn | tapered, thick at the inner end |
| Moustache | +0.15 to +0.2 D | +0.17 D |
| Mouth | ≈ +0.25 D | +0.25 D |
| Face shift toward facing side | 0.05–0.18 D | 0.11 D |
| Cheeks | soft grey-lavender patch under each eye | radial, 0.1 D |

## 3. Lighting on characters (measured per scene)

| Scene (reference) | Head lit RGB | Head shade RGB | Shade/lit luma | Head in shade | Rim light* |
|---|---|---|---|---|---|
| Day, courtyard | 253,246,240 | 186,172,165 | **0.70** | 3–15 % | faint (+13 to +36) |
| Day, market | 255,255,252 | 184,182,182 | 0.72 | ~1 % | strong pale outline (+169) |
| Forge fire | 253,238,188 | 214,190,133 | 0.80 | 3 % | +31 |
| Night interior, candle | 238,224,229 | 174,163,212 (cool) | 0.74 | **26–34 %** | +45 to +79 |
| Tent, candle | 255,251,237 | 226,163,88 (warm) | 0.68 | 10 % | +32 |

\*Rim light is the median luma added just outside the ink line on the lit side.

**Cloth** shade/lit luma has a median of **≈ 0.60** (range 0.43–0.92). Robes carry a clear darker side away from the light.

These five lighting presets, built from the measurements, are in `draw.js` as `LIGHTS`:
- `day`
- `golden` (from the warm tent and candle values)
- `candle`
- `fire`
- `storm`

Each preset sets:
- the key-light direction
- the shade colour and how much of the head it covers
- the rim colour and strength
- the cloth shade
- a **tint** that multiplies the whole character by the scene light

The 3D sets now apply the matching preset per shot, and every character card takes the scene's tint.

### Night (samurai short, screen recording)

| Head | Lit RGB | Shade RGB | Shade/lit luma | Head in shade | Rim light | Cloth shade/lit |
|---|---|---|---|---|---|---|
| Samurai, moon + campfire | 248,230,217 (warm, from the fire) | 216,194,196 | 0.85 | 12 % | (hair covers the edge) | 0.44 |
| Armoured samurai, moon | 239,225,223 | 178,147,144 | **0.67** | **34 %** | **strong: median +56, p90 +165** | **0.26** |

At night the cloth goes much darker (0.26–0.44 against 0.6 by day), and a bright cool rim runs along the moonlit edge.

A new `night` preset in `draw.js` uses these values:
- shade `#B29390`, covering 34 % of the head
- rim `215,228,255` at 0.9
- cloth shade 0.62
- tint `#DCD6E8`

The 3D storm shots (3 and 4) now use it.

## 4. Sheets
In `characters/sheets/`:
- `sheet_jonah.png`
- `sheet_king.png`, which includes the sackcloth variant
- `sheet_sailors.png`
- `sheet_townspeople.png`, which includes the sackcloth row
- `sheet_fish.png`

Each standard sheet has:
- a close-up bust
- front and turned full-body views, with proportion guides in D
- six expressions
- a palette with hex codes
- a lighting strip showing the character under all five measured presets

To regenerate: `node jonah-short/sheets/render_sheets.mjs <outdir>`. The sheets are drawn by the same rig as the film, so they always match what renders.
