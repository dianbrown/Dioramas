import {
  group,
  box,
  cyl,
  ball,
  bar,
  shadow,
  label,
  lamp,
  bench,
  V,
  M,
  C,
  THREE,
} from './lib/kit.js';
import { buildBankInterior } from './bankInterior.js';
export function buildSet(scene) {
  const set = group(scene, 'city-block');
  box(set, 21, 0.24, 14, M.ink, 0, -0.14, 0);
  box(set, 21, 0.025, 14, M.road, 0, -0.008, 0);
  box(set, 21, 0.16, 8.5, M.pale, 0, 0.07, -2.75);
  for (let x = -10.5; x <= 10.5; x += 2.6)
    box(set, 0.045, 0.008, 8.5, M.stone, x, 0.154, -2.75, 0);
  for (const z of [-5, -2.4, 0.2])
    box(set, 21, 0.008, 0.045, M.stone, 0, 0.154, z, 0);
  box(set, 21, 0.2, 0.16, M.stone, 0, 0.04, 1.5);
  for (let x = -9.6; x < 11; x += 2.5)
    box(set, 1.12, 0.008, 0.075, M.cream, x - 0.3, 0.012, 4.45, 0);
  for (const x of [-8.3, 6.45])
    box(set, 2.25, 0.008, 1.65, M.roof, x, 0.014, 5.4, 0);
  cyl(set, 0.35, 0.015, M.slate, -9.2, 0.02, 4.75, 0.35, 24);
  cyl(set, 0.29, 0.017, M.cement, -9.2, 0.025, 4.75, 0.29, 24);
  function roof(b, w, d, h) {
    box(b, w + 0.2, 0.17, d + 0.16, M.cream, 0, h, 0);
    box(b, w, 0.07, d, M.roof, 0, h + 0.12, 0);
    for (const x of [-w / 2, w / 2])
      box(b, 0.14, 0.28, d, M.sand, x, h + 0.24, 0);
    for (const z of [-d / 2, d / 2])
      box(b, w, 0.28, 0.14, M.sand, 0, h + 0.24, z);
  }
  function window(b, x, y, w, h, z, alarm = false) {
    box(b, w + 0.22, h + 0.2, 0.12, M.stone, x, y, z);
    const glass = box(
      b,
      w,
      h,
      0.05,
      alarm ? M.teal.clone() : M.teal,
      x,
      y,
      z + 0.08,
    );
    box(b, 0.065, h, 0.08, M.sand, x, y, z + 0.12);
    box(b, w, 0.065, 0.08, M.sand, x, y + 0.23 * h, z + 0.12);
    box(b, w + 0.32, 0.12, 0.25, M.cream, x, y - h / 2 - 0.12, z + 0.08);
    return glass;
  }
  function hut(b, x, z, h) {
    box(b, 1, 1.05, 0.9, M.sand, x, h + 0.63, z);
    box(b, 1.15, 0.12, 1.05, M.cream, x, h + 1.19, z);
    box(b, 0.37, 0.75, 0.02, M.ink, x + 0.15, h + 0.45, z + 0.46);
  }
  function vent(b, x, z, h) {
    box(b, 0.85, 0.32, 0.7, M.cement, x, h + 0.3, z);
    box(b, 0.7, 0.025, 0.55, M.slate, x, h + 0.475, z);
    for (let i = 0; i < 4; i++)
      box(b, 0.04, 0.03, 0.55, M.roof, x - 0.25 + i * 0.16, h + 0.49, z, 0);
  }
  const bank = group(set, 'bank', 0.2, 0.16, -4.45);
  const interior = buildBankInterior(bank);
  roof(bank, 10, 4.9, 4.13);
  box(bank, 10.15, 0.2, 0.27, M.cream, 0, 3.8, 2.5);
  box(bank, 4.78, 0.32, 0.16, M.stone, -2.61, 0.2, 2.5);
  box(bank, 2.98, 0.32, 0.16, M.stone, 3.51, 0.2, 2.5);
  for (const x of [-4.75, -0.45, 2.25, 4.75]) {
    box(bank, 0.28, 3.5, 0.25, M.cream, x, 1.95, 2.52);
    box(bank, 0.45, 0.14, 0.36, M.stone, x, 0.26, 2.54);
  }
  const alarmWindows = [
    window(bank, -2.7, 2.05, 1.2, 1.1, 2.5, true),
    window(bank, 4, 2.12, 1.2, 1.1, 2.5, true),
  ];
  const entrance = group(bank, 'entrance', 0.9, 0.1, 0);
  // Jambs sit outside the aperture and never share a pivot with a door.
  for (const x of [-1.16, 1.16]) {
    const jamb = box(entrance, 0.12, 2.7, 0.22, M.stone, x, 1.69, 2.5);
    jamb.name = 'bank-door-jamb';
  }
  box(entrance, 2.44, 0.12, 0.22, M.stone, 0, 3.1, 2.5);
  const threshold = box(entrance, 2.2, 0.08, 0.42, M.cream, 0, 0.362, 2.5);
  threshold.name = 'bank-threshold';
  const doors = [];
  for (const side of [-1, 1]) {
    const door = group(
      entrance,
      side < 0 ? 'bank-door-left' : 'bank-door-right',
      side * 1.05,
      0.415,
      2.72,
    );
    box(door, 1.04, 2.55, 0.09, M.navy, -side * 0.52, 1.27, 0);
    box(door, 0.75, 1.65, 0.025, M.teal, -side * 0.52, 1.55, 0.06);
    box(door, 0.08, 0.32, 0.06, M.gold, -side * 0.88, 1.2, 0.09);
    box(door, 0.9, 0.3, 0.035, M.metal, -side * 0.52, 0.17, 0.065);
    box(door, 0.75, 1.65, 0.025, M.teal, -side * 0.52, 1.55, -0.06);
    box(door, 0.08, 0.32, 0.06, M.gold, -side * 0.88, 1.2, -0.09);
    box(door, 0.9, 0.3, 0.035, M.metal, -side * 0.52, 0.17, -0.065);
    doors.push(door);
  }
  box(entrance, 2.55, 0.52, 0.15, M.gold, 0, 3.28, 2.57);
  label(entrance, 'BANK', 2.43, 0.42, 0, 3.28, 2.66, {
    bg: C.navy,
    fg: C.cream,
    size: 78,
  });
  for (const x of [-1.22, 1.22]) ball(entrance, 0.09, M.red, x, 2.75, 2.68);
  for (let i = 0; i < 3; i++)
    box(
      set,
      3.6,
      0.176,
      1.4 - i * 0.33,
      M.cream,
      1.14,
      0.248 + i * 0.176,
      -0.79 - i * 0.165,
    );
  for (const x of [-0.8, 3.08]) {
    bar(set, V(x, 0.16, -0.05), V(x, 0.72, -0.05), 0.045, M.leather);
  }
  hut(bank, -3.5, -1.6, 4.13);
  vent(bank, 2, -0.7, 4.13);
  cyl(bank, 0.065, 0.48, M.metal, 3.1, 4.57, 1.1);
  cyl(bank, 0.12, 0.08, M.metal, 3.1, 4.83, 1.1);
  box(bank, 0.85, 0.12, 0.65, M.cream, 0.3, 4.3, -0.3);
  box(bank, 0.72, 0.025, 0.52, M.sky, 0.3, 4.38, -0.3);
  const sign = group(bank, 'dollar-sign', -0.25, 5.25, 1.15);
  for (const x of [-0.8, 0.8]) {
    bar(sign, V(x, -1, 0), V(x, -0.25, 0), 0.055, M.metal);
    box(sign, 0.34, 0.07, 0.35, M.metal, x, -1, 0);
  }
  box(sign, 2.3, 1.55, 0.14, M.metal);
  box(sign, 2.18, 1.43, 0.17, M.navy);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = C.greenDark;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = C.darkLeaf;
  ctx.beginPath();
  ctx.arc(128, 128, 103, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = C.lime;
  ctx.shadowBlur = 14;
  ctx.fillStyle = C.lime;
  ctx.font = 'bold 220px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 128, 137);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(2.04, 1.32),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  face.position.z = 0.1;
  sign.add(face);

  bank.position.set(0.252533, 0.16, -4.16091);
  bank.scale.set(0.984663, 1.075178, 1.132538);
  sign.position.set(
    (0.05 - 0.252533) / 0.984663,
    5.5 / 1.075178,
    (-3.38 + 4.16091) / 1.132538,
  );
  sign.scale.set(1.37 / 0.984663, 1.1 / 1.075178, 1 / 1.132538);
  const left = group(set, 'left-shop', -8.4, 0.16, -4.35);
  box(left, 4, 5.25, 4.9, M.stone, 0, 2.625, 0);
  const leftRoof = group(left, 'left-roof', 0, 0, 0);
  roof(leftRoof, 4, 4.9, 5.28);
  for (const x of [-1.78, 1.78])
    for (let y = 0.3; y < 5; y += 0.38)
      box(left, 0.3, 0.19, 0.18, M.sand, x, y, 2.54);
  for (const x of [-1.15, 0, 1.15]) window(left, x, 4.17, 0.86, 1.45, 2.5);
  box(left, 3.4, 0.23, 0.24, M.cream, 0, 3.21, 2.57);
  label(left, 'L A N E', 3.2, 0.34, 0, 2.96, 2.61, {
    bg: C.ink,
    fg: C.cream,
    size: 60,
  });
  box(left, 3.2, 2.25, 0.07, M.ink, 0, 1.4, 2.52);
  box(left, 1.95, 1.6, 0.03, M.teal, -0.5, 1.65, 2.57);
  box(left, 0.05, 1.6, 0.05, M.metal, -0.5, 1.65, 2.6);
  box(left, 0.7, 2.12, 0.06, M.ink, 1.1, 1.25, 2.6);
  hut(left, -0.3, -0.8, 5.65);
  box(left, 0.48, 0.8, 0.45, M.brick, 1.3, 5.75, -0.9);
  for (const x of [1.15, 1.4]) cyl(left, 0.035, 0.3, M.metal, x, 6.28, -0.9);
  box(left, 0.8, 0.12, 0.65, M.cream, 0.8, 5.45, 1.4);
  box(left, 0.7, 0.02, 0.55, M.sky, 0.8, 5.53, 1.4);
  cyl(left, 0.065, 0.35, M.metal, 0.1, 5.63, 1.5);
  cyl(left, 0.1, 0.07, M.metal, 0.1, 5.83, 1.5);
  for (const z of [-0.7, 1.15]) {
    box(left, 0.1, 1.4, 0.95, M.sand, 2.04, 4.17, z);
    box(left, 0.04, 1.23, 0.8, M.teal, 2.11, 4.17, z);
    box(left, 0.05, 1.23, 0.045, M.cream, 2.14, 4.17, z);
    box(left, 0.05, 0.045, 0.8, M.cream, 2.14, 4.38, z);
  }
  box(left, 0.06, 2.1, 1.28, M.ink, 2.04, 1.32, 1.45);
  // Source crop fit; keep independent of the bank/actor entrance anchors.
  left.position.z += 0.15;
  left.scale.set(1, 0.91 * 0.95, 0.95);
  const cafe = group(set, 'cafe', 7.55, 0.16, -4.65);
  box(cafe, 4.6, 2.85, 4.9, M.brick, 0, 1.425, 0);
  roof(cafe, 4.65, 4.95, 2.88);
  vent(cafe, -0.6, -0.6, 2.88);
  cyl(cafe, 0.1, 0.08, M.metal, 1.35, 3.06, -1);
  box(cafe, 2.9, 1.65, 0.08, M.cream, -0.55, 1.1, 2.5);
  box(cafe, 2.7, 1.48, 0.05, M.teal, -0.55, 1.1, 2.56);
  box(cafe, 0.06, 1.5, 0.1, M.sand, -0.55, 1.1, 2.61);
  box(cafe, 0.85, 2.1, 0.08, M.navy, 1.45, 1.05, 2.55);
  box(cafe, 0.66, 1.1, 0.025, M.teal, 1.45, 1.45, 2.6);
  const aw = group(cafe, 'awning', -0.5, 2.2, 2.8);
  const awning = box(aw, 3.3, 0.08, 1.1, M.red, 0, 0, 0);
  awning.rotation.x = 0.4;
  for (const x of [-1.65, 1.65])
    bar(aw, V(x, 0.24, -0.5), V(x, -0.24, 0.5), 0.045, M.cream);
  box(aw, 3.4, 0.13, 0.08, M.cream, 0, -0.2, 0.5);
  label(cafe, 'CAFE', 3.3, 0.38, -0.5, 2.52, 2.56, {
    bg: C.cream,
    fg: C.sand,
    size: 48,
  });
  for (const z of [-1.25, 0.65]) {
    box(cafe, 0.08, 1.05, 1.15, M.cream, 2.33, 1.7, z);
    box(cafe, 0.04, 0.86, 0.94, M.teal, 2.39, 1.7, z);
  }
  const streetLamp = lamp(set, -8.7, 0.25);
  streetLamp.scale.y = 1.12;
  const seat = bench(set, -7, -0.25, M.white);
  seat.position.y = 0.16;
  for (const x of [-8.25, 6]) {
    cyl(set, 0.14, 0.4, M.ink, x, 0.36, 0.5);
    shadow(set, x, 0.5, 0.5, 0.5, 0.2, 0.17);
  }
  const bin = group(set, 'blue-bin', 3.85, 0.16, 0.3);
  box(bin, 0.4, 0.5, 0.38, M.blue, 0, 0.25, 0);
  box(bin, 0.44, 0.08, 0.42, M.navy, 0, 0.53, 0);
  box(bin, 0.15, 0.25, 0.02, M.green, 0.1, 0.3, 0.2);
  const hyd = group(set, 'hydrant', 6.7, 0.16, 0.75);
  cyl(hyd, 0.12, 0.44, M.red, 0, 0.22, 0);
  ball(hyd, 0.14, M.red, 0, 0.45, 0);
  bar(hyd, V(-0.22, 0.3, 0), V(0.22, 0.3, 0), 0.07, M.red);

  cafe.position.x -= 0.1;
  cafe.position.z += 0.15;
  cafe.scale.set(0.9, 1.14, 0.965);
  // Stone trim has its own material; keep the white awning, steps and bench separate.
  for (const building of [bank, left, cafe])
    building.traverse((o) => {
      if (o.isMesh && o.material === M.cream && o.parent.name !== 'awning')
        o.material = M.stone;
    });
  return { doors, alarmWindows, interior };
}
