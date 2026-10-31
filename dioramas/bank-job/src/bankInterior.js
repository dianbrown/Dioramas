import { THREE, M, C, group, box, bar, label, V } from './lib/kit.js';

export function buildBankInterior(bank) {
  const shell = group(bank, 'bank-shell');
  box(shell, 4.78, 4.05, 4.9, M.sand, -2.61, 2.025, 0);
  box(shell, 2.98, 4.05, 4.9, M.sand, 3.51, 2.025, 0);
  box(shell, 2.24, 0.95, 4.9, M.sand, 0.9, 3.575, 0);
  const lobby = group(bank, 'bank-lobby');
  const floor = new THREE.MeshStandardMaterial({
    color: C.pale,
    roughness: 1,
    emissive: C.warm,
    emissiveIntensity: 0.16,
  });
  const wall = new THREE.MeshStandardMaterial({
    color: C.sand,
    roughness: 1,
    emissive: C.warm,
    emissiveIntensity: 0.12,
  });
  const slab = box(lobby, 2.24, 0.12, 4.8, floor, 0.9, 0.43, 0.02);
  slab.name = 'lobby-floor';
  box(lobby, 2.24, 2.61, 0.12, wall, 0.9, 1.795, -2.38);
  // Floor joints show the depth through the open leaves.
  for (const z of [-1.7, -0.9, -0.1, 0.7, 1.5, 2.3])
    box(lobby, 2.2, 0.006, 0.025, M.stone, 0.9, 0.494, z, 0);
  for (const x of [0.35, 1.05, 1.75])
    box(lobby, 0.025, 0.006, 4.7, M.stone, x, 0.494, 0, 0);
  const counter = group(lobby, 'teller-counter', 0.45, 0, 1.05);
  box(counter, 1.8, 0.75, 0.55, M.wood, 0, 0.875, 0);
  box(counter, 1.94, 0.1, 0.68, M.plank, 0, 1.3, 0);
  box(counter, 1.62, 0.5, 0.025, M.sand, 0, 0.92, 0.29);
  box(counter, 0.55, 0.025, 0.3, M.green, -0.25, 1.365, 0.02);
  box(counter, 0.25, 0.05, 0.2, M.cream, 0.53, 1.37, 0.1);
  counter.scale.x = 0.65;
  const screen = box(counter, 0.3, 0.25, 0.045, M.navy, -0.6, 1.51, -0.09);
  screen.rotation.x = -0.12;
  box(lobby, 2.15, 1.65, 0.1, wall, 0.9, 2.15, -0.62);
  label(lobby, 'TELLER', 1.3, 0.28, 0.9, 2.44, -0.55, {
    bg: C.navy,
    fg: C.cream,
    size: 64,
  });
  for (const x of [0.02, 1.78]) {
    bar(lobby, V(x, 1.35, 0.08), V(x, 2.8, 0.08), 0.025, M.gold);
  }
  box(lobby, 1.8, 0.055, 0.09, M.gold, 0.9, 2.76, 0.08);
  const light = new THREE.PointLight(0xffdfb3, 5, 5, 2);
  light.position.set(0.9, 2.65, 1.3);
  lobby.add(light);
  const lamp = box(
    lobby,
    0.66,
    0.05,
    0.26,
    new THREE.MeshBasicMaterial({ color: C.warm }),
    0.9,
    2.96,
    0.9,
  );
  lamp.name = 'lobby-ceiling-lamp';
  return { shell, lobby, floor: slab, counter };
}
