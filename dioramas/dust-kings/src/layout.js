// same dimensions so changing a prop cannot leave the choreography behind.
export const LAYOUT = {
  ramp: {
    x: -2.5,
    z: 3.6,
    start: -1.6,
    end: 0.65,
    height: 1.05,
    halfWidth: 1.6,
  },
  wreck: { x: 3.1, z: 5.2, scale: 0.9, tealZ: -1.2, redZ: 1.3 },
  screen: { x: 9.3, z: 1.9, yaw: 0.28, supportX: 1.7 },
};

export function surfaceHeight(x, z, t) {
  let h = 0.025;
  const r = LAYOUT.ramp,
    localX = x - r.x;
  if (Math.abs(z - r.z) <= r.halfWidth && localX >= r.start && localX <= r.end)
    h = Math.max(
      h,
      ((localX - r.start) / (r.end - r.start)) * r.height + 0.045,
    );
  // The two sacrificial cars form the landing surface. Their roofs compress
  // on contact; the cream wagon is ejected forward, outside the tire lanes.
  const w = LAYOUT.wreck;
  for (const lane of [w.tealZ, w.redZ]) {
    const px = (x - w.x) / w.scale - (lane === w.tealZ ? 0.1 : 0),
      pz = (z - w.z) / w.scale - lane;
    if (Math.abs(px) <= 1.9 && Math.abs(pz) <= 0.95) {
      const u = Math.min(1, Math.max(0, (t - 27.35) / 0.4));
      const scaleY = 1 - 0.277 * u * u * (3 - 2 * u);
      let top = 0.81;
      if (px > 0.85 && px < 1.75 && Math.abs(pz) < 0.875) top = 0.915;
      if (px < -1.125 && px > -1.775 && Math.abs(pz) < 0.875) top = 0.905;
      if (px >= -1 && px <= 0.7 && Math.abs(pz) <= 0.8) top = 1.3;
      h = Math.max(h, top * scaleY * w.scale + 0.012);
    }
  }
  return h;
}
