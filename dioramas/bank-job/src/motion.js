import { clamp } from '../../shared/config.js';
// Quadratic departures fit to roof/windscreen tracking in the source MP4.

export const STOPS = { sedan: -3.25, lead: -2.9, rear: -7.65 };
export function arrive(t, start, end, stop, power = 3) {
  const u = clamp((t - start) / (end - start));
  return -15 + (stop + 15) * (1 - Math.pow(1 - u, power));
}
export function depart(t, start, stop, v, a) {
  const u = Math.max(0, t - start);
  return Math.min(15, stop + v * u + a * u * u);
}
export function sedanX(t) {
  return t < 3
    ? arrive(t, 0, 3, STOPS.sedan)
    : depart(t, 25.5, STOPS.sedan, 2.002124, 1.686565);
}
export function policeX(t, index) {
  return index === 1
    ? t < 28.15
      ? arrive(t, 26, 28.15, STOPS.lead, 2)
      : depart(t, 42.5, STOPS.lead, 2.131017, 2.245547)
    : t < 28.6
      ? arrive(t, 26.65, 28.6, STOPS.rear, 2)
      : depart(t, 43.6, STOPS.rear, 2.102791, 2.988395);
}
