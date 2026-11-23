// Scripted input that exercises every state; reads the runner's position so it is robust to tuning.
function makeDemo() {
  let phase = 0, t0 = 0, jumped = {};
  const P = () => PLAY.R;
  return t => {
    const R = P(), o = { left: false, right: false, down: false, jumpHeld: false, jumpPressed: false };
    const press = key => { if (!jumped[key]) { jumped[key] = true; o.jumpPressed = true; } o.jumpHeld = true; };
    if (phase === 0) { if (t > 0.9) { phase = 1; } }
    else if (phase === 1) { o.right = true; if (R.x > 2.3 && R.x < 4.6) press('crate'); if (R.x > 9) { phase = 2; t0 = t; } }
    else if (phase === 2) { o.left = true; if (t - t0 > 0.75) { phase = 3; t0 = t; } }                 // skid, turn, run back
    else if (phase === 3) { if (t - t0 > 0.6) { phase = 4; t0 = t; } }                                // coast to a stop
    else if (phase === 4) { o.right = true; if (R.x > 9.5) o.down = true; if (R.x > 12.8) { phase = 5; } } // sprint then slide
    else if (phase === 5) { o.right = true; if (R.x > 19.4 && R.y > 1.5) { press('deck'); phase = 6; t0 = t; } } // up the gangplank slope, jump onto the deck
    else if (phase === 6) { o.right = t - t0 < 0.12; o.left = t - t0 > 0.35; o.jumpHeld = t - t0 < 0.3; if (!R.ground && R.vy < -1) o.down = true; if (R.ground && t - t0 > 0.3) { o.down = true; phase = 7; t0 = t; } }
    else if (phase === 7) { o.down = R.rollT > 0; if (R.rollT <= 0) { phase = 8; t0 = t; } }      // roll out of the landing
    else if (phase === 8) { o.left = t - t0 < 0.35; }                                          // brake, settle, idle
    return o;
  };
}
