export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
export const win = (t, a, b) => smooth((t - a) / (b - a));
export const bell = (t, a, b, r = 0.6) =>
  win(t, a, a + r) * (1 - win(t, b - r, b));
export const hash = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
