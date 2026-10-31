import {
  THREE,
  PI,
  V,
  M,
  colors,
  group,
  mesh,
  box,
  cyl,
  sphere,
  bar,
  torus,
  text,
  shadow,
  crate,
  cone,
  barrel,
  hash,
  softTexture,
} from './kit.js';
import { wreckCar } from './trucks.js';
import { LAYOUT } from './layout.js';

function truss(p, x, y, z, h) {
  const g = group(p, 'lighting-truss', x, y, z);
  for (const a of [-0.22, 0.22])
    for (const b of [-0.17, 0.17])
      bar(g, V(a, 0, b), V(a, h, b), 0.045, M.beam);
  for (let i = 0; i < h / 0.5; i++) {
    const yy = i * 0.5;
    for (const b of [-0.17, 0.17])
      bar(
        g,
        V(-0.22, yy, b),
        V(0.22, Math.min(h, yy + 0.5), b),
        0.025,
        M.black,
      );
  }
  return g;
}
function board(p, line, w, h, x, y, z, bg = colors.blue) {
  box(p, w + 0.12, h + 0.12, 0.12, M.cream, x, y, z);
  text(p, [line, 'MOTOR SPORT  /  ARENA'], w, h, x, y, z + 0.07, {
    bg,
    fg: colors.cream,
    border: colors.gold,
    font: 52,
  });
}
function rail(p, x, z, w, y = 0.9) {
  for (const dx of [-w / 2, w / 2]) {
    box(p, 0.13, 1.2, 0.13, M.beam, x + dx, 0.6, z);
    box(p, 0.17, 0.07, 0.17, M.gold, x + dx, 1.22, z);
  }
  for (const yy of [0.3, y])
    bar(p, V(x - w / 2, yy, z), V(x + w / 2, yy, z), 0.035, M.metal);
}
function barrier(p, x, z, length, rot = 0) {
  const g = group(p, 'steel-crowd-barrier', x, 0, z);
  g.rotation.y = rot;
  box(g, length, 0.62, 0.17, M.metal, 0, 0.55, 0);
  for (const y of [0.23, 0.86]) box(g, length, 0.08, 0.26, M.steel, 0, y, 0);
  for (let k = 0; k < length / 0.5; k++) {
    box(g, 0.14, 0.08, 0.02, M.gold, -length / 2 + 0.18 + k * 0.5, 0.74, 0.1);
    box(g, 0.025, 0.36, 0.05, M.steel, -length / 2 + 0.2 + k * 0.5, 0.52, 0.12);
  }
  for (const dx of [-length * 0.43, length * 0.43]) {
    box(g, 0.1, 0.94, 0.12, M.metal, dx, 0.47, 0);
    box(g, 0.5, 0.07, 0.5, M.black, dx, 0.035, 0);
  }
  return g;
}
function umbrella(p, x, z) {
  const g = group(p, 'striped-pit-umbrella', x, 0, z);
  cyl(g, 0.035, 2.8, M.chrome, 0, 1.4, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i * PI) / 4,
      b = a + PI / 4;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [
          0,
          3.05,
          0,
          Math.cos(a) * 1.35,
          2.65,
          Math.sin(a) * 1.35,
          Math.cos(b) * 1.35,
          2.65,
          Math.sin(b) * 1.35,
        ],
        3,
      ),
    );
    geo.computeVertexNormals();
    const mat = (i % 2 ? M.cream : M.redLight).clone();
    mat.side = THREE.DoubleSide;
    mesh(g, geo, mat);
    bar(
      g,
      V(0, 3, 0),
      V(Math.cos(a) * 1.35, 2.65, Math.sin(a) * 1.35),
      0.018,
      M.chrome,
    );
  }
  sphere(g, 0.08, M.gold, 0, 3.07, 0);
  shadow(g, 0, 0, 3.3, 3.3, 0.2);
  return g;
}
function tirePile(p, x, z) {
  const g = group(p, 'spare-tire', x, 0.13, z);
  const o = torus(g, 0.32, 0.12, M.tire);
  o.rotation.x = PI / 2;
  const hub = cyl(g, 0.16, 0.07, M.hub, 0, 0, 0);
  return g;
}

export function buildArena(scene) {
  const root = group(scene, 'arena');
  box(root, 24, 0.28, 16, M.soilDark, 0, -0.16, 0);
  box(root, 23.8, 0.035, 15.8, M.soil, 0, -0.005, 0);
  // Fine, flat fragments and tire ruts: sparse large patches plus dense low-contrast flecks.
  const dirtGeo = new THREE.PlaneGeometry(1, 1);
  dirtGeo.rotateX(-PI / 2);
  const mats = ['#573321', '#4e2d20', '#64432b'].map(
    (color) => new THREE.MeshStandardMaterial({ color, roughness: 1 }),
  );
  for (let k = 0; k < 3; k++) {
    const count = k === 2 ? 450 : 1600;
    const batch = new THREE.InstancedMesh(dirtGeo, mats[k], count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const n = i + k * 2000;
      dummy.position.set(
        (hash(n) - 0.5) * 23.6,
        0.018 + k * 0.001,
        (hash(n + 8000) - 0.5) * 15.6,
      );
      dummy.rotation.y = hash(n + 100) * 6.28;
      const s = 0.025 + hash(n + 11) * 0.13;
      dummy.scale.set(s * (1 + hash(n + 20) * 2), 1, s);
      dummy.updateMatrix();
      batch.setMatrixAt(i, dummy.matrix);
    }
    batch.receiveShadow = true;
    root.add(batch);
  }
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * PI * 2;
    const o = box(
      root,
      0.35,
      0.006,
      0.075,
      M.soilDark,
      0.4 + Math.cos(a) * 3,
      0.023,
      -0.7 + Math.sin(a) * 1.8,
    );
    o.rotation.y = -a;
  }
  for (const z of [-7.9, 7.9]) {
    box(root, 24, 0.12, 0.17, M.woodLight, 0, 0.01, z);
    box(root, 24, 0.08, 0.09, M.beam, 0, -0.1, z);
  }
  for (const x of [-11.9, 11.9]) box(root, 0.16, 0.12, 16, M.beam, x, 0.01, 0);
  // Left entrance is a portal across Z, NOT a garage facing the camera.
  const gate = group(root, 'dust-kings-entry', -10.55, 0, 3);
  gate.rotation.y = PI / 2;
  box(gate, 9.2, 0.62, 1.35, M.wood, 0, 5.05, 0);
  box(gate, 9.65, 0.17, 1.65, M.woodLight, 0, 5.39, 0);
  box(gate, 9.4, 0.14, 1.55, M.beam, 0, 4.68, 0);
  for (const x of [-4.1, 4.1]) {
    box(gate, 0.75, 4.7, 0.8, M.beam, x, 2.35, 0);
    box(gate, 0.9, 0.85, 0.95, M.soilDark, x, 0.425, 0);
    box(gate, 0.17, 3.7, 0.1, M.woodLight, x + 0.21, 2.65, 0.46);
    for (const y of [1.2, 3.8]) box(gate, 0.86, 0.1, 0.88, M.black, x, y, 0);
  }
  box(gate, 7.5, 4.25, 0.15, M.beam, 0, 2.2, -0.5);
  box(gate, 7.5, 0.6, 0.6, M.wood, 0, 0.35, -0.2);
  for (const x of [-2.5, 2.5]) {
    const patch = box(gate, 1.9, 3.9, 0.02, M.wood, x, 2.15, -0.4);
    patch.rotation.z = x > 0 ? -0.12 : 0.12;
  }
  text(gate, ['DUST KINGS', 'MONSTER TRUCK ARENA'], 4.4, 1.03, 0, 5.02, 0.72, {
    font: 62,
  });
  for (let i = 0; i < 8; i++)
    sphere(
      gate,
      0.035,
      new THREE.MeshBasicMaterial({ color: '#ffdf80' }),
      -3.4 + i * 0.97,
      4.5,
      0.28,
    );
  for (const x of [-2.2, 2.2]) {
    const lightPatch = mesh(
      gate,
      new THREE.PlaneGeometry(3.4, 3.8),
      new THREE.MeshBasicMaterial({
        color: '#d89842',
        map: softTexture(),
        transparent: true,
        opacity: 0.17,
        depthWrite: false,
      }),
      x,
      2.4,
      -0.37,
    );
    lightPatch.castShadow = false;
  }
  truss(root, -11.45, 0.1, 6.15, 4.4);
  const entryTower = truss(root, -9, 0.1, -4.9, 7.7);
  entryTower.scale.x = 1.8;
  entryTower.scale.z = 1.4;
  const tower = group(root, 'tower-floodlight', -9, 7.8, -4.9);
  box(tower, 1.2, 0.3, 0.5, M.black);
  for (const x of [-0.44, 0, 0.44]) {
    box(tower, 0.28, 0.16, 0.06, M.cream, x, -0.08, 0.28);
    box(tower, 0.1, 0.2, 0.15, M.black, x, 0.18, 0);
  }
  sphere(tower, 0.045, M.red, 0, 0.37, 0);
  // Blue/purple wall, shallow bleacher risers, separate sponsor railings.
  box(root, 19.4, 4.65, 0.25, M.wall, 0.6, 2.32, -7.1);
  box(root, 19.65, 0.13, 0.42, M.steel, 0.6, 4.7, -7.1);
  for (const x of [-8.3, 10]) box(root, 0.18, 4.5, 1, M.blue, x, 2.25, -6.65);
  for (let i = 0; i < 10; i++)
    box(root, 0.18, 4.3, 0.35, M.metal, -8.3 + i * 2.02, 2.15, -6.88);
  for (const x of [-6.8, 9.5])
    box(root, 1.1, 3.8, 0.025, M.purple, x, 2.05, -6.94);
  box(
    root,
    3.5,
    0.55,
    0.025,
    new THREE.MeshBasicMaterial({ color: '#890b29' }),
    -3.2,
    3.6,
    -6.5,
  );
  box(
    root,
    4,
    0.6,
    0.025,
    new THREE.MeshBasicMaterial({ color: '#345eac' }),
    5.1,
    3.6,
    -6.5,
  );
  box(root, 4, 0.07, 0.035, M.gold, 5.1, 3.89, -6.47);
  for (const [z, y] of [
    [-6.2, 1.18],
    [-5.4, 0.78],
  ]) {
    box(root, 18.2, 0.2, 0.72, M.metal, 1.6, y, z);
    box(root, 18.2, 0.08, 0.55, M.steel, 1.6, y + 0.14, z);
  }
  for (let i = 0; i < 14; i++) {
    const x = -7 + i * 1.3;
    barrier(root, x, -4.65, 1.23);
    if (i % 3 === 0)
      board(
        root,
        ['ARENA 07', 'DUST KINGS', 'FULL THROTTLE'][i % 3],
        1.05,
        0.34,
        x,
        0.59,
        -4.51,
      );
    else {
      box(root, 0.83, 0.23, 0.02, M.cream, x, 0.55, -4.53);
      box(root, 0.7, 0.07, 0.025, i % 2 ? M.redDark : M.yellow, x, 0.55, -4.5);
    }
  }
  const banners = [];
  for (const [i, x] of [-6.8, -3.2, 0.4, 4].entries()) {
    const mast = group(root, 'flag', x, 0.5, -7.1);
    cyl(mast, 0.025, 2.15, M.chrome, 0, 5.35, 0);
    sphere(mast, 0.05, M.gold, 0, 6.45, 0);
    const f = group(mast, 'cloth', 0.04, 5.85, 0);
    box(f, 1, 0.5, 0.012, [M.red, M.teal, M.gold, M.purple][i], 0.5, 0, 0);
    box(f, 1, 0.08, 0.016, M.cream, 0.5, 0.04, 0.012);
    banners.push(f);
  }
  for (const [x, title, color] of [
    [-5.6, 'DUST KINGS', colors.blue],
    [1.1, 'STUNT TEAM', colors.black],
    [8.4, 'PIT STOP', colors.teal],
  ]) {
    for (const dx of [-1, 1]) {
      box(root, 0.08, 2.6, 0.08, M.beam, x + dx, 1.3, -4.8);
      box(root, 0.45, 0.05, 0.15, M.gold, x + dx, 2.65, -4.8);
    }
    board(root, title, 1.9, 0.63, x, 2.25, -4.7, color);
  }
  box(root, 0.18, 2.7, 2.2, M.blue, -8.9, 1.35, -6);
  // Small pit announcer stall and cream-topped crates under the umbrella.
  umbrella(root, -7.6, -3.2);
  const pit = group(root, 'announcer-desk', -7.6, 0, -2.5);
  box(pit, 2.1, 0.55, 0.9, M.blue, 0, 0.28, 0);
  box(pit, 2.2, 0.09, 1, M.cream, 0, 0.6, 0);
  text(pit, ['DUST KINGS', 'PIT CONTROL'], 2.1, 0.72, 0, 1.3, 0.06, {
    font: 68,
  });
  for (const x of [-0.95, 0.95])
    bar(pit, V(x, 0.5, 0), V(x, 1.75, 0), 0.035, M.gold);
  for (let i = 0; i < 3; i++) {
    box(
      pit,
      0.55,
      0.5,
      0.75,
      i % 2 ? M.blue : M.purple,
      -0.8 + i * 0.65,
      0.25,
      1.1,
    );
    box(pit, 0.6, 0.07, 0.79, M.cream, -0.8 + i * 0.65, 0.54, 1.1);
  }
  crate(root, -8.7, -1.2);
  crate(root, -8.2, -1.3, 0.45);
  tirePile(root, -9, -1.9);
  barrel(root, -6.9, -2.9);
  // Wide side-facing takeoff ramp, yellow/black lip, a real supporting wedge.
  const ramp = group(root, 'takeoff-ramp', LAYOUT.ramp.x, 0, LAYOUT.ramp.z);
  const verts = [
    -1.6, 0, -1.6, -1.6, 0, 1.6, 0.65, 1.05, 1.6, -1.6, 0, -1.6, 0.65, 1.05,
    1.6, 0.65, 1.05, -1.6,
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  const rm = M.mud.clone();
  rm.side = THREE.DoubleSide;
  mesh(ramp, geo, rm);
  for (const z of [-1.6, 1.6]) {
    bar(ramp, V(-1.6, 0, z), V(0.65, 1.05, z), 0.06, M.beam);
    bar(ramp, V(0.65, 0, z), V(0.65, 1.05, z), 0.07, M.beam);
  }
  box(ramp, 0.12, 1.05, 3.2, M.mud, 0.65, 0.525, 0);
  for (let i = 0; i < 13; i++)
    box(
      ramp,
      0.18,
      0.08,
      0.25,
      i % 2 ? M.gold : M.black,
      0.62,
      1.08,
      -1.5 + i * 0.25,
    );
  // Crush stack and the service props at the foreground rail.
  const wrecks = group(root, 'crush-stack', LAYOUT.wreck.x, 0, LAYOUT.wreck.z);
  wrecks.scale.setScalar(LAYOUT.wreck.scale);
  const red = wreckCar(wrecks, 'red-scrap-car', M.red);
  red.rotation.y = PI / 2;
  red.position.z = LAYOUT.wreck.redZ;
  const teal = wreckCar(wrecks, 'teal-scrap-car', M.teal);
  teal.rotation.y = PI / 2;
  teal.position.set(0.1, 0, LAYOUT.wreck.tealZ);
  const cream = group(wrecks, 'cream-crush-pivot', 0.1, 0.25, -0.45);
  const creamCar = wreckCar(cream, 'cream-scrap-wagon', M.cream);
  creamCar.rotation.y = PI / 2;
  creamCar.scale.z = 1.18;
  for (let i = 0; i < 4; i++)
    box(creamCar, 1.55, 0.06, 0.055, M.beam, 0, 1.32, -0.8 + i * 0.45);
  // Raised road plate, plywood support and a stack of blocks beside the wreck.
  for (const [x, z] of [
    [-0.9, 7.2],
    [0.8, 7.2],
  ]) {
    crate(root, x, z, 0.65);
    crate(root, x + 0.55, z, 0.5);
  }
  const trolley = group(root, 'service-trolley', -0.3, 0, 6.8);
  box(trolley, 1.45, 0.13, 0.6, M.yellow, 0, 0.2, 0);
  for (let i = 0; i < 5; i++)
    cyl(trolley, 0.07, 0.5, M.gold, -0.5 + i * 0.24, 0.53, 0);
  for (const x of [-0.55, 0.55]) {
    const tire = torus(trolley, 0.13, 0.05, M.black, x, 0.14, 0.23);
  }
  const chest = group(root, 'red-tool-chest', 1.8, 0, 7.6);
  box(chest, 0.9, 0.8, 0.5, M.red, 0, 0.45, 0);
  box(chest, 1, 0.08, 0.6, M.yellow, 0, 0.89, 0);
  for (let i = 0; i < 4; i++) {
    box(chest, 0.78, 0.025, 0.02, M.chrome, 0, 0.2 + i * 0.15, 0.27);
    box(chest, 0.2, 0.025, 0.04, M.cream, 0, 0.25 + i * 0.15, 0.29);
  }
  // Foreground pit fencing is only a short section; leave arena view open.
  for (let i = 0; i < 3; i++) {
    rail(root, -5.4 + i * 1.3, 6.9, 1.2);
    board(
      root,
      i ? 'PIT LANE' : 'DUST KINGS',
      1.05,
      0.48,
      -5.4 + i * 1.3,
      0.65,
      6.97,
      colors.wood,
    );
  }
  for (const x of [-8.6, -4.6]) {
    box(root, 0.16, 1.9, 0.16, M.black, x, 0.95, 6.45);
    box(root, 0.4, 0.2, 0.22, M.metal, x, 1.75, 6.45);
  }
  const rope = new THREE.CatmullRomCurve3([
    V(-8.6, 1.4, 6.45),
    V(-3, 0.75, 6.8),
    V(-1.9, 1.2, 6.9),
  ]);
  mesh(root, new THREE.TubeGeometry(rope, 24, 0.025, 5, false), M.black);
  for (const p of [
    [-5.9, 1.5],
    [3.7, -3.8],
    [5.5, -3.8],
    [11.6, 3.7],
    [-5.2, -3.4],
  ])
    cone(root, ...p);
  for (const p of [
    [-7.2, 7.35],
    [4.1, 7.5],
    [5.2, 7.6],
  ])
    tirePile(root, ...p);
  for (const p of [
    [-6.8, 1.8],
    [3.9, 2.5],
  ]) {
    const o = box(root, 0.65, 0.01, 0.4, M.cream, p[0], 0.03, p[1]);
    o.rotation.y = 0.1;
  }
  for (const [x, z] of [
    [-8.3, 6.2],
    [5.3, 7.25],
    [10.2, 7],
  ]) {
    box(root, 0.1, 0.65, 0.1, M.black, x, 0.32, z);
    for (const y of [0.2, 0.4, 0.6])
      box(root, 0.18, 0.06, 0.13, M.gold, x, y, z);
  }

  const exitBarrier = barrier(root, 10.9, 1.6, 6, PI / 2);
  board(exitBarrier, 'EXIT', 1.1, 0.28, 0, 0.6, 0.13, colors.redDark);
  barrier(root, 9.7, 7.3, 0.65, 0);
  const mast = group(root, 'right-mast', 11.3, 0, -6.9);
  cyl(mast, 0.07, 5.6, M.beam, 0, 2.8, 0);
  for (let i = 0; i < 6; i++)
    box(mast, 0.15, 0.025, 0.2, M.metal, 0, 0.4 + i * 0.6, 0.04);
  box(mast, 0.42, 0.3, 0.24, M.black, 0, 5.6, 0);
  sphere(mast, 0.045, M.red, 0.18, 5.75, 0);
  // Large screen, angled toward the lens, ornate double yellow frame and truss.
  const screen = group(root, 'jumbotron', LAYOUT.screen.x, 0, LAYOUT.screen.z);
  screen.rotation.y = LAYOUT.screen.yaw;

  const screenSupport = truss(screen, LAYOUT.screen.supportX, 0, -0.3, 6);
  box(screen, 0.7, 0.09, 0.7, M.metal, LAYOUT.screen.supportX, 0.04, -0.3);
  bar(screen, V(-2.3, 4.9, -0.3), V(1.7, 4.9, -0.3), 0.075, M.beam);
  bar(screen, V(0.3, 4.9, -0.3), V(1.7, 3.8, -0.3), 0.06, M.beam);
  box(
    screen,
    5,
    3.2,
    0.22,
    new THREE.MeshBasicMaterial({ color: '#f4d331' }),
    0,
    6.2,
    0,
  );
  box(screen, 4.55, 2.75, 0.26, M.black, 0, 6.2, 0.04);
  const displays = ['DUST KINGS', 'LIVE', 'NEW RECORD', 'THANK YOU'].map(
    (s, i) =>
      text(
        screen,
        [
          s,
          i === 0
            ? 'SATURDAY NIGHT  ·  08'
            : i === 2
              ? 'BIG AIR  ·  BIG WHEELS'
              : 'MONSTER TRUCK SHOW',
        ],
        4.35,
        2.55,
        0,
        6.2,
        0.24,
        {
          bg: '#19232f',
          fg: colors.white,
          border: colors.gold,
          font: s.length > 9 ? 92 : 110,
        },
      ),
  );
  for (let i = 0; i < 13; i++)
    box(screen, 0.12, 0.06, 0.05, M.cream, -2.25 + i * 0.375, 7.84, 0.15);

  // Project its four frame corners along the key light onto the dirt plane.
  screen.updateWorldMatrix(true, false);
  const key = V(15, 22, -3),
    shadowPoints = [
      [-2.5, 4.6, 0],
      [2.5, 4.6, 0],
      [2.5, 7.8, 0],
      [-2.5, 7.8, 0],
    ].map((a) => {
      const p = screen.localToWorld(V(...a));
      return key.clone().lerp(p, (key.y - 0.028) / (key.y - p.y));
    });
  const shadowGeo = new THREE.BufferGeometry();
  shadowGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [0, 1, 2, 0, 2, 3].flatMap((i) => shadowPoints[i].toArray()),
      3,
    ),
  );
  shadowGeo.computeVertexNormals();
  const signShadow = mesh(
    root,
    shadowGeo,
    new THREE.MeshBasicMaterial({
      color: '#161b1b',
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  signShadow.castShadow = false;
  return {
    root,
    gate,
    ramp,
    screen,
    screenSupport,
    exitBarrier,
    displays,
    banners,
    wrecks,
    cream,
    teal,
    red,
  };
}
