export const LOOP = 46.0;
export const DT = 1 / 40;

export const SLAB = { hx: 10.5, hz: 7.0, thick: 0.42 };

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};
export const easeOut = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
export const easeIn = (u) => Math.pow(clamp(u, 0, 1), 3);

export const win = (t, t0, dur) => clamp((t - t0) / dur, 0, 1);

export const bell = (t, t0, t1, a = 0.25, b = a) =>
  smooth((t - t0) / a) * (1 - smooth((t - (t1 - b)) / b));
export const pulse = (t, t0, tau) => (t < t0 ? 0 : Math.exp(-(t - t0) / tau));
export const spring = (t, t0, freq = 9, damp = 5) => {
  const a = t - t0;
  return a < 0 ? 0 : Math.exp(-damp * a) * Math.sin(freq * a);
};
export function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

export const loopSin = (t, k, phase = 0) =>
  Math.sin((2 * Math.PI * k * t) / LOOP + phase);
export const lerpAngle = (a, b, k) => {
  let d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return a + d * k;
};

export const BARN = {
  x: -8.0,
  z: -0.5,
  w: 5.0,
  d: 4.6,
  front: -5.7,
  rot: Math.PI / 2,
};
export const APRON = { x0: -5.7, x1: -4.85, z0: -2.3, z1: 1.3, y: 0.06 };

export function groundY(x, z) {
  if (x > APRON.x0 && x < APRON.x1 && z > APRON.z0 && z < APRON.z1)
    return APRON.y;
  if (
    x > BARN.x - BARN.d / 2 &&
    x <= BARN.front &&
    z > BARN.z - BARN.w / 2 + 0.15 &&
    z < BARN.z + BARN.w / 2 - 0.15
  )
    return 0.08;
  return 0;
}

export const PASTURE = {
  x0: -1.5,
  x1: 6.5,
  z0: -2.5,
  z1: 4.0,
  gateZ0: -1.9,
  gateZ1: -0.5,
};
export const WINDMILL = { x: 7.2, z: -5.0 };
export const TANK = { x: 5.3, z: -3.65, r: 0.95, h: 0.62 };
