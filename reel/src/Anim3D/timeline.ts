// Anim3D timeline helpers: everything is a pure function of time t (seconds) so Remotion can render any frame.
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export type Ease = (x: number) => number;
export const lin: Ease = (x) => x;
export const outCubic: Ease = (x) => 1 - Math.pow(1 - x, 3);
export const inCubic: Ease = (x) => x * x * x;
export const inOutCubic: Ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const inOutSine: Ease = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
export const outBack: Ease = (x) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
export const outExpo: Ease = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
/** progress 0..1 of a motion that starts at `s` and lasts `d` seconds, eased. */
export const prog = (t: number, s: number, d: number, e: Ease = outCubic) => e(clamp01((t - s) / d));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
/** keyframes [[time, value], ...] with eased interpolation between neighbours. */
export const kf = (t: number, pts: [number, number][], e: Ease = inOutCubic) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) { const [t0, v0] = pts[i - 1], [t1, v1] = pts[i]; return mix(v0, v1, e(clamp01((t - t0) / (t1 - t0)))); }
  }
  return pts[pts.length - 1][1];
};
/** deterministic pseudo random 0..1 */
export const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
