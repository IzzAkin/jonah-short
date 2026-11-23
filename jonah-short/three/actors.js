// Film actors: every character runs the playable controller (play.js) on a scripted input track,
// simulated deterministically at 60 Hz from the start of its shot, so the film moves exactly like the game:
// momentum, skids, landings, springs, squash & stretch, smears. Acting poses blend in on a spring weight.
class Actor {
  // o: { card, x, y, z, dir, floor, solids, look, k, id, start (local s), init(R,A), script(t,R) -> input, face(t,R), back, seaweed, shake(t) }
  constructor(o) { this.o = o; this.reset(); }
  reset() {
    const o = this.o, R = makeRunner(o.x, o.y ?? (o.floor ?? 0));
    Object.assign(R, { lane: o.z ?? 0, solids: o.solids || [], floor: o.floor ?? 0, noRespawn: true });
    const d = o.dir ?? 1; R.faceT = R.faceVis = R.facing = d;
    this.R = R; this.A = makeAnim(); this.t = 0; this.prevJ = false;
    if (o.init) o.init(R, this.A);
  }
  input(t) {
    const r = this.o.script ? this.o.script(t, this.R) || {} : {};
    const jh = !!r.jump, inp = { left: !!r.left, right: !!r.right, down: !!r.down, jumpHeld: jh, jumpPressed: jh && !this.prevJ,
      cap: r.cap, jumpV: r.jumpV, act: r.act, actRate: r.actRate, actLife: r.actLife, faceTo: r.faceTo, tumble: r.tumble };
    this.prevJ = jh; return inp;
  }
  advance(t) {
    if (t < this.t - 1e-6) this.reset();
    while (this.t + PH.dt <= t + 1e-9) { const inp = this.input(this.t); stepRunner(this.R, inp); stepAnim(this.A, this.R, inp); this.t += PH.dt; }
  }
  draw(tShot, cam, extra) {
    const o = this.o, t = tShot - (o.start || 0);
    if (t < 0) { o.card.hide(); return this; }
    this.advance(t);
    const c = o.card, R = this.R;
    c.mat.color.set(CHAR_LIGHT.tint);
    drawRunner(c.g, c, R, this.A, c.pxm * PH.H / 300, CHAR_LIGHT,
      { look: o.look || LOOKS.jonah, k: o.k, id: o.id, back: o.back, seaweed: o.seaweed, shake: o.shake ? o.shake(t, R) : 0, face: o.face ? o.face(t, R) : {} });
    if (extra) extra(c.g, c, R);
    c.tex.needsUpdate = true;
    c.at(R.x, R.y, o.z ?? 0, cam);
    return this;
  }
}
// steer toward an x: accelerate, then brake so the stop lands on target (sprint = skid stop, walk = coast stop)
function seek(R, target, cap) {
  const s = R.ground ? R.s : R.vx, d = target - R.x;
  if (Math.abs(d) < 0.06 && Math.abs(s) < 0.4) return {};
  const decel = cap ? PH.friction : PH.skidDecel, stop = s * s / (2 * decel);
  if (Math.sign(s) === Math.sign(d) && stop >= Math.abs(d) - 0.04) return cap ? {} : (d > 0 ? { left: true } : { right: true });
  return d > 0 ? { right: true, cap } : { left: true, cap };
}
const within = (t, a, b) => t >= a && t < b;
