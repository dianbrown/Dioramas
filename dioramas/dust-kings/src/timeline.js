import { THREE, PI, V, lerp, win, bell, clamp } from './kit.js';
export const LOOP = 38.2666666667;
export const EVENTS = {
  redStart: 6.2,
  redWheelie: [9.35, 11.7],
  donuts: [12, 16.3],
  redPark: 18,
  smallFire: [21.7, 24.2],
  spray: [23.25, 25.25],
  yellowStart: 25.6,
  jump: [26.6, 27.8],
  impact: 27.35,
  pyro: [27.4, 32.8],
  redExit: [29, 32.5],
  yellowExit: [32.1, 36.4],
};
function travel(t, a, b, points, timing = 'smooth') {
  const linear = clamp((t - a) / (b - a)),
    u = timing === 'out' ? 1 - (1 - linear) ** 2 : win(t, a, b),
    curve = new THREE.CatmullRomCurve3(points.map((p) => V(...p)));
  const p = curve.getPoint(u),
    d = curve.getTangent(u);
  return { x: p.x, z: p.z, y: Math.max(0, p.y), yaw: Math.atan2(d.x, d.z) };
}
const redStart = { x: -8.5, z: 1.2, y: 0, yaw: PI / 2 };
const goldStart = { x: -8.5, z: 4.8, y: 0, yaw: PI / 2 };
function rawTruckState(t, i) {
  let s = {
    ...(i ? goldStart : redStart),
    pitch: 0,
    roll: 0,
    distance: 0,
    bounce: 0.012 * Math.sin(t * 6 + i),
  };
  if (!i) {
    if (t >= 6.2 && t < 9.3)
      s = {
        ...s,
        ...travel(t, 6.2, 9.3, [
          [-8.5, 0, 1.2],
          [-5.5, 0, 1.2],
          [-3, 0, 0.3],
          [-0.5, 0, -1.3],
        ]),
      };
    else if (t >= 9.3 && t < 12) {
      s.x = -0.5;
      s.z = -1.3;
      s.yaw = PI / 4;
      s.pitch = 0.95 * bell(t, 9.35, 11.7, 0.55);
    } else if (t >= 12 && t < 16.3) {
      const a = -Math.min(1, Math.max(0, (t - 12.3) / 3)) * PI * 4,
        r = bell(t, 12.3, 15.8, 0.4);
      s.x = -0.5 + Math.sin(a) * r - 0.5 * r;
      s.z = -1.3 + (1 - Math.cos(a)) * r * 0.3;
      s.yaw = PI / 4 + a;
      s.roll = 0.055 * Math.sin(a);
    } else if (t >= 16.3 && t < 18)
      s = {
        ...s,
        ...travel(
          t,
          16.3,
          18,
          [
            [-0.5, 0, -1.3],
            [3.8, 0, -1.1],
            [7.6, 0, -0.1],
            [7.8, 0, 0.8],
          ],
          'out',
        ),
      };
    else if (t >= 18 && t < 29) {
      s.x = 7.8;
      s.z = 0.8;
      s.yaw = -0.3;
    } else if (t >= 29)
      s = {
        ...s,
        ...travel(t, 29, 32.5, [
          [7.8, 0, 0.8],
          [8.3, 0, 3.6],
          [9.1, 0, 6.3],
          [12.5, 0, 6.3],
          [17, 0, 6.3],
        ]),
      };
    s.distance =
      t < 6.2
        ? 0
        : t < 9.3
          ? 8 * win(t, 6.2, 9.3)
          : t < 12
            ? 8
            : t < 16.3
              ? 8 + (t - 12) * 4.5
              : t < 18
                ? 27 + 8 * (1 - (1 - clamp((t - 16.3) / 1.7)) ** 2)
                : t < 29
                  ? 35
                  : 35 + 12 * win(t, 29, 32.5);
  } else {
    if (t >= 18.4 && t < 25.6) {
      s.pitch = -0.3 * bell(t, 18.4, 25.5, 0.7) * (1 + 0.16 * Math.sin(t * 7));
    }
    if (t >= 25.6 && t < 26.6) {
      s = {
        ...s,
        ...travel(t, 25.6, 26.6, [
          [-8.5, 0, 4.8],
          [-5.6, 0, 3.6],
          [-2, 0.62, 3.6],
        ]),
      };
      s.pitch = -0.36 * win(t, 26.05, 26.6);
    } else if (t >= 26.6 && t < 27.8) {
      const u = clamp((t - 26.6) / 1.2);
      s.x = lerp(-2, 3.1, u);
      s.z = lerp(3.6, 5.25, u);
      s.y = 0.62 - 0.08 * u + 1.7 * Math.sin(PI * u);
      s.pitch = lerp(-0.36, 0.06, u);
      s.yaw = Math.atan2(5.1, 1.65);
      s.alignGround = win(t, 27.6, 27.8);
    } else if (t >= 27.8 && t < 32.1) {
      s.x = 3.1;
      s.z = 5.25;
      s.y = 0;
      s.yaw = PI / 2;
      s.alignGround = 1;
      s.pitch = 0.035 * Math.sin((t - 27.8) * 14) * Math.exp(-(t - 27.8) * 3);
    } else if (t >= 32.1) {
      s = {
        ...s,
        ...travel(t, 32.1, 36.4, [
          [3.1, 0, 5.25],
          [4, 0, 3.8],
          [7.4, 0, 4],
          [8.4, 0, 6.2],
          [12.5, 0, 6.3],
          [17, 0, 6.3],
        ]),
      };
      s.yaw = lerp(PI / 2, s.yaw, win(t, 32.1, 32.65));
      s.pitch = 0;
      s.alignGround = 1;
    }
    s.distance =
      t < 25.6
        ? 0
        : t < 26.6
          ? 6.7 * win(t, 25.6, 26.6)
          : t < 27.8
            ? 6.7 + (5.36 * (t - 26.6)) / 1.2
            : t < 32.1
              ? 12.06
              : 12.06 + 17 * win(t, 32.1, 36.4);
  }
  return s;
}

// Bake continuous orientation once. Rendering/seek order never feeds back into
// motion, and the truck can turn into a beat without a one-frame yaw cut.
const RATE = 120,
  N = Math.ceil(LOOP * RATE),
  angles = [[], []];
for (let who = 0; who < 2; who++) {
  const raw = [];
  let previous = 0;
  for (let i = 0; i <= N; i++) {
    const s = rawTruckState(i / RATE, who);
    if (i === 0) previous = s.yaw;
    else
      previous += Math.atan2(
        Math.sin(s.yaw - previous),
        Math.cos(s.yaw - previous),
      );
    raw.push([previous, s.pitch]);
  }
  for (let i = 0; i <= N; i++) {
    let yaw = 0,
      pitch = 0,
      sum = 0;
    for (let k = -48; k <= 48; k++) {
      const w = Math.exp((-k * k) / 700),
        a = raw[Math.max(0, Math.min(N, i + k))];
      yaw += a[0] * w;
      pitch += a[1] * w;
      sum += w;
    }
    angles[who].push([yaw / sum, pitch / sum]);
  }
}
export function truckState(t, who) {
  const s = rawTruckState(t, who),
    f = clamp(t * RATE, 0, N),
    i = Math.min(N - 1, Math.floor(f)),
    u = f - i;
  s.yaw = lerp(angles[who][i][0], angles[who][i + 1][0], u);
  s.pitch = lerp(angles[who][i][1], angles[who][i + 1][1], u);
  return s;
}
