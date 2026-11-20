# Jonah short: Rick's Clips-style animation pipeline

- `ricks-clips-style/`: measured style reference
  - `STYLE_GUIDE.md`: qualitative breakdown
  - `METRICS.md`: frame-by-frame numbers (camera, cuts, light, colour, blinks)
  - `CHARACTERS.md`: character construction and lighting
  - `metrics/` and `characters/`: the measurement scripts and data
  - `characters/sheets/`: character sheets for the Jonah cast
- `jonah-short/`: the film
  - 2D rig: `draw.js`, `timing.js`
  - 2D shots: `scenes.js`
  - 3D sets with 2D character cards: `three/`
  - character sheet generator: `sheets/`
  - renders: `out/`

Render the 3D film (needs Node, Playwright with Chromium, and ffmpeg):

    cd jonah-short && npm install && PAGE=three/index.html OUT=jonah_short_3d.mp4 node render.mjs video 4

Regenerate the character sheets:

    node jonah-short/sheets/render_sheets.mjs ricks-clips-style/characters/sheets
