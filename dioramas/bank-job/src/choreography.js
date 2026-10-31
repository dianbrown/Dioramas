import { preserveProjection } from './calibration.js';
import { V, walkPose, runPose, STAND, place, clamp } from './lib/kit.js';

export const CREW_STANDS = [
  [-2.652, 0, 5.113],
  [-3.286, 0, 5.183],
  [-3.692, 0, 5.589],
].map(preserveProjection);
export const CREW_LOADS = [
  [-6.35, 0, 3.9],
  [-6.7, 0, 4.6],
  [-7.15, 0, 4.2],
];
export const CREW_OUT = [3.15, 3.35, 3.55];
export const CREW_IN = [23.0, 23.55, 24.05];
export const APPROACH = CREW_STANDS.map((p, i) => [
  [5.25 + i * 0.15, ...p],
  [
    6,
    ...[
      [-1.528, 0, 5.026],
      [-2.787, 0, 5.248],
      [-3.451, 0, 5.59],
    ][i],
  ],
  [
    7,
    ...[
      [0.636, 0, 3.65],
      [-0.633, 0, 4.525],
      [-1.599, 0, 5.175],
    ][i],
  ],
  [
    8,
    ...[
      [1.532, 0.16, 0.541],
      [1.341, 0, 1.918],
      [0.8, 0, 2.934],
    ][i],
  ],
  [8.85 + i * 0.2, 1.14 + i * 0.15, 0.688, -1.28],
  [9.5 + i * 0.2, 1.14 + i * 0.15, 0.688, -2.4],
]);
for (const track of APPROACH)
  for (const row of track)
    if ([6, 7, 8].includes(row[0]))
      row.splice(1, 3, ...preserveProjection(row.slice(1)));
export const RETURN = CREW_LOADS.map((p, i) => [
  [17.1 + i * 0.18, 1.14 + i * 0.15, 0.688, -2.4],
  [17.45 + i * 0.18, 1.14 + i * 0.15, 0.688, -1.28],
  [
    18,
    ...[
      [0.6, 0, 3.1],
      [1.3, 0.16, 1],
      [0.9, 0.35, -0.8],
    ][i],
  ],
  [
    19,
    ...[
      [-4, 0, 4.8],
      [-3.1, 0, 5.1],
      [-2.3, 0, 5.5],
    ][i],
  ],
  [19.65 + i * 0.15, ...p],
]);
function point(keys, i) {
  return V(...keys[Math.max(0, Math.min(i, keys.length - 1))].slice(1));
}
function evalSegment(keys, i, u) {
  const a = point(keys, i),
    b = point(keys, i + 1),
    dt = keys[i + 1][0] - keys[i][0];
  const m0 =
    i === 0
      ? V()
      : point(keys, i + 1)
          .sub(point(keys, i - 1))
          .multiplyScalar(dt / (keys[i + 1][0] - keys[i - 1][0]));
  const m1 =
    i === keys.length - 2
      ? V()
      : point(keys, i + 2)
          .sub(point(keys, i))
          .multiplyScalar(dt / (keys[i + 2][0] - keys[i][0]));
  return a
    .multiplyScalar(2 * u * u * u - 3 * u * u + 1)
    .addScaledVector(m0, u * u * u - 2 * u * u + u)
    .addScaledVector(b, -2 * u * u * u + 3 * u * u)
    .addScaledVector(m1, u * u * u - u * u);
}
export function buildTrack(keys) {
  const lengths = [];
  let length = 0;
  for (let i = 0; i < keys.length - 1; i++) {
    const samples = [length];
    let last = evalSegment(keys, i, 0);
    for (let j = 1; j <= 32; j++) {
      const p = evalSegment(keys, i, j / 32);
      length += p.distanceTo(last);
      samples.push(length);
      last = p;
    }
    lengths.push(samples);
  }
  return { keys, lengths };
}
export const approaches = APPROACH.map(buildTrack),
  returns = RETURN.map(buildTrack);
export function follow(actor, track, t, carry = false) {
  const { keys, lengths } = track;
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const u = clamp((t - keys[i][0]) / (keys[i + 1][0] - keys[i][0])),
    p = evalSegment(keys, i, u),
    v = evalSegment(keys, i, Math.min(1, u + 0.001)).sub(
      evalSegment(keys, i, Math.max(0, u - 0.001)),
    );
  const yaw = Math.atan2(v.x, v.z),
    k = u * 32,
    j = Math.min(31, Math.floor(k)),
    distance = lengths[i][j] + (lengths[i][j + 1] - lengths[i][j]) * (k - j);
  const pose = carry
    ? runPose(distance * 5.1, { armAmp: 0.35 })
    : walkPose(distance * 5.8, { amp: 0.34, armAmp: 0.3 });
  if (carry) {
    pose.shoulderR = [0.05, 0, 0.1];
    pose.elbowR = [-0.18, 0, 0];
  }
  place(actor, p.x, p.y, p.z, yaw, pose);
}
