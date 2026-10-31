import { choreography } from './choreography.js';
import { T, group, box, ell, hash, mats } from './kit.js';
export const LOOP = 46;
export const BEATS = [
  { t: 0, name: 'establish' },
  { t: 8, name: 'anticipation' },
  { t: 12, name: 'wall-contact' },
  { t: 20, name: 'counterattack' },
  { t: 32, name: 'steam-recoil' },
];
const smooth = (x) => {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
};
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));
export function stage(scene, titan, town, scouts) {
  let puffs = [],
    flames = [],
    debris = [],
    embers = [];
  for (let i = 0; i < 100; i++) {
    let m = group(scene);
    for (let k = 0; k < 5; k++) {
      let f = ell(
        m,
        (hash(i * 9 + k) - 0.5) * 0.9,
        (hash(i * 7 + k) - 0.5) * 0.9,
        (hash(i * 3 + k) - 0.5) * 0.9,
        0.5,
        0.46,
        0.48,
        0,
      );
      f.material = new T.MeshBasicMaterial({
        color: k % 3 === 0 ? 0xf6e6cb : 0xfffdf5,
      });
      f.castShadow = false;
    }
    puffs.push(m);
  }
  for (let i = 0; i < 36; i++) {
    let g = group(scene);
    ell(g, 0, 0, 0, 0.22, 0.48, 0.22, 32);
    ell(g, 0, -0.05, 0.08, 0.14, 0.3, 0.15, 30);
    ell(g, 0, -0.11, 0.14, 0.075, 0.2, 0.09, 29);
    flames.push(g);
  }
  for (let i = 0; i < 36; i++) {
    let m = box(scene, 0, 0, 0, 0.22 + hash(i) * 0.3, 0.22, 0.3, 9 + (i % 4));
    debris.push(m);
  }
  for (let i = 0; i < 35; i++) {
    let m = box(scene, 0, 0, 0, 0.055, 0.11, 0.055, 30);
    embers.push(m);
  }
  const animateScouts = choreography(scene, scouts);
  function update(raw) {
    let t = ((raw % LOOP) + LOOP) % LOOP,
      a = (t / LOOP) * Math.PI * 2,
      press = pulse(t, 12, 1.1),
      counter = pulse(t, 20, 1.2),
      vent = pulse(t, 32, 3.2);
    titan.torso.position.y = 7 + Math.sin(a) * 0.12 - press * 0.22;
    titan.torso.rotation.x =
      0.015 * Math.sin(a) + press * 0.035 - counter * 0.035;
    titan.head.rotation.y = 0.04 + Math.sin(a) * 0.035;
    titan.head.rotation.x = 0.04 * Math.sin(a) - counter * 0.07;
    titan.hand.position.y = 8.45 + Math.sin(a) * 0.035 - press * 0.17;
    for (let [i, f] of titan.fingers.entries())
      f.rotation.x = 0.02 * Math.sin(a + i) + press * 0.09;
    for (let [i, f] of town.flags.entries()) {
      f.rotation.x = 0.035 * Math.sin(a * 6 + i);
      f.rotation.z = 0.018 * Math.sin(a * 5 + i);
    }
    animateScouts(t);
    for (let [i, m] of puffs.entries()) {
      let side = i % 2 ? 1 : -1,
        phase = (t / 5.75 + hash(i) * 4) % 1;
      let baseX = 1.3 + side * (2.6 + hash(i + 9) * 2.6),
        baseY = 8.5 + hash(i + 23) * 2,
        baseZ = -6.1 + hash(i + 42) * 1.6;
      let size = (0.15 + Math.sin(phase * Math.PI) * 0.57) * (1 + vent * 0.65);
      m.position.set(
        baseX + side * phase * 1.5,
        baseY + phase * (3.4 + hash(i) * 3),
        baseZ + Math.sin(i) * phase * 0.6,
      );
      m.scale.set(size, size * 0.8, size);
      m.visible = phase > 0.015 && phase < 0.985;
    }
    for (let [i, m] of flames.entries()) {
      let x = i < 24 ? 6.1 : 7.5,
        z = i < 24 ? 1.8 : 3.4;
      let phase = (t / 2.875 + hash(i) * 4) % 1;
      m.position.set(
        x + (hash(i + 1) - 0.5) * 1.65,
        (i < 15 ? 2.6 : 0.3) + phase * 1.85,
        z + (hash(i + 5) - 0.5) * 1.5,
      );
      let k = Math.sin(phase * Math.PI) * (0.45 + hash(i) * 0.65);
      m.scale.set(k, k * (1 + 0.2 * Math.sin(a * 24 + i)), k);
      m.rotation.z = Math.sin(a * 16 + i) * 0.3;
    }
    for (let [i, m] of embers.entries()) {
      let ph = (t / 5.75 + hash(i)) % 1;
      m.position.set(
        5 + (hash(i) - 0.5) * 2 + ph,
        0.4 + ph * 4,
        -0.4 + (hash(i + 2) - 0.5) * 2,
      );
      m.scale.setScalar(Math.sin(ph * Math.PI));
    }
    for (let [i, m] of debris.entries()) {
      let dt = t - 12 - i * 0.025;
      let life = 2.3,
        flight = Math.max(0, Math.min(life, dt));
      let x = 4 + hash(i) * 3.4;
      let y = 7.4 + hash(i + 22);
      m.position.set(
        x + (hash(i + 5) - 0.5) * flight,
        Math.max(0.3, y + flight * (1 + hash(i + 3)) - 2.7 * flight * flight),
        -3.8 + flight * (0.9 + hash(i + 6)),
      );
      m.rotation.set(flight * (i % 3), flight * 2, flight);
      m.visible = dt >= 0 && t < 39;
      m.scale.setScalar(t > 37 ? 1 - smooth((t - 37) / 2) : 1);
    }
  }
  return {
    update,
    BEATS,
    events: [
      { t: 12, kind: 'wall-fracture', count: 36 },
      { t: 20, kind: 'scout-evasion', count: 3 },
      { t: 32, kind: 'steam-vent', count: 100 },
    ],
    puffs,
    debris,
  };
}
