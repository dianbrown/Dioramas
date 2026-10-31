import { group, box, bar, cyl, shadow, V, M, THREE, C } from './lib/kit.js';
function wheel(parent, x, y, z) {
  const g = group(parent, 'tire', x, y, z);
  const tire = cyl(
    g,
    0.36,
    0.19,
    new THREE.MeshBasicMaterial({ color: C.black }),
    0,
    0,
    0,
    0.36,
    20,
  );
  tire.rotation.z = Math.PI / 2;
  const hub = cyl(g, 0.185, 0.195, M.cement, 0, 0, 0, 0.185, 16);
  hub.rotation.z = Math.PI / 2;
  return g;
}
export function vehicle(scene, name, police = false) {
  const root = group(scene, name),
    paint = police ? M.white : new THREE.MeshBasicMaterial({ color: C.cement }),
    doors = [];
  box(root, 1.7, 0.12, 4.25, M.ink, 0, 0.34, 0);
  for (const side of [-1, 1]) {
    box(root, 0.12, 0.16, 4.02, paint, side * 0.86, 0.44, 0);
    for (const z of [-1.7, 1.65])
      box(root, 0.12, 0.5, 0.85, paint, side * 0.86, 0.68, z);
    for (const [j, z] of [1.15, -0.15].entries()) {
      const d = group(root, 'door-' + side + '-' + j, side * 0.88, 0.7, z);
      box(d, 0.075, 0.52, 1.27, paint, 0, 0, -0.64);
      box(d, 0.1, 0.035, 1.27, paint, 0, 0.28, -0.64);
      box(d, 0.11, 0.04, 0.22, M.chrome, side * 0.03, 0.16, -1.05);
      if (police) box(d, 0.08, 0.3, 1.23, M.violet, side * 0.05, -0.09, -0.64);
      doors.push(d);
    }
    for (const z of [1.42, -1.42])
      wheel(root, side * (z < 0 ? 0.8 : 0.88), 0.36, z);
    for (const z of [0.3, -0.65]) {
      box(root, 0.48, 0.1, 0.5, M.ink, side * 0.4, 0.54, z);
      box(root, 0.48, 0.43, 0.12, M.ink, side * 0.4, 0.78, z - 0.25);
    }
    for (const z of [1.05, -0.96])
      bar(
        root,
        V(side * 0.8, 0.94, z),
        V(side * 0.7, 1.43, z * 0.7),
        0.042,
        paint,
      );
    bar(
      root,
      V(side * 0.83, 0.96, -0.12),
      V(side * 0.72, 1.43, -0.12),
      0.04,
      M.ink,
    );
  }
  box(root, 1.83, 0.32, 0.95, paint, 0, 0.73, 1.65);
  box(
    root,
    1.8,
    0.07,
    1.05,
    police ? paint : new THREE.MeshBasicMaterial({ color: C.stone }),
    0,
    0.94,
    1.62,
  );
  box(root, 1.48, 0.08, 1.8, paint, 0, 1.46, -0.08);
  box(root, 1.78, 0.46, 0.07, paint, 0, 0.67, -2.1);
  box(root, 1.72, 0.07, 0.63, M.ink, 0, 0.48, -1.72);
  box(root, 1.7, 0.36, 0.06, M.ink, 0, 0.65, -1.37);
  const boot = group(root, 'boot', 0, 0.94, -1.4);
  box(boot, 1.8, 0.07, 0.74, paint, 0, 0, -0.37);
  for (const z of [-2.15, 2.15])
    box(root, 1.88, 0.075, 0.08, paint, 0, 0.48, z);
  box(root, 1.05, 0.18, 0.04, M.ink, 0, 0.72, 2.13);
  for (const x of [-0.7, 0.7]) {
    box(
      root,
      0.36,
      0.18,
      0.04,
      new THREE.MeshBasicMaterial({ color: C.cream }),
      x,
      0.75,
      2.14,
    );
    box(root, 0.28, 0.13, 0.04, M.red, x, 0.75, -2.15);
  }
  const glass = new THREE.MeshBasicMaterial({ color: C.cyan });
  const wind = box(root, 1.4, 0.59, 0.025, glass, 0, 1.19, 0.85);
  wind.rotation.x = -0.56;
  box(root, 1.4, 0.065, 0.04, M.ink, 0, 0.975, 1.01);
  const back = box(root, 1.4, 0.5, 0.025, glass, 0, 1.18, -0.86);
  back.rotation.x = 0.4;
  box(root, 1.45, 0.14, 0.25, M.ink, 0, 0.97, 0.57);
  shadow(root, 0, 0, 2.5, 4.8, 0.35);
  const lights = [];
  if (police) {
    box(root, 1.15, 0.07, 0.3, M.ink, 0, 1.55, 0);
    for (const [x, color] of [
      [-0.34, C.red],
      [0.34, C.blue],
    ])
      lights.push(
        box(
          root,
          0.4,
          0.13,
          0.26,
          new THREE.MeshBasicMaterial({ color }),
          x,
          1.65,
          0,
        ),
      );
    for (const side of [-1, 1])
      for (const z of [-1.7, 1.65])
        box(root, 0.13, 0.3, 0.76, M.violet, side * 0.89, 0.58, z);
  }
  return {
    root,
    doors,
    boot,
    update(x, z, t, open = 0, trunk = 0) {
      root.position.set(x, 0, z);
      root.rotation.y = Math.PI / 2;
      doors.forEach(
        (d, i) =>
          (d.rotation.y =
            (i < 2 ? 1 : -1) * (Array.isArray(open) ? open[i] : open) * 1.35),
      );
      boot.rotation.x = trunk * 0.95;
      lights.forEach((l, i) =>
        l.material.color.set(
          i ? (Math.floor(t * 8) % 2 ? C.violet : C.purple) : C.pink,
        ),
      );
    },
  };
}
