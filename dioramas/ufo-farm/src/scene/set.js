import * as THREE from 'three';
import {
  SLAB,
  PASTURE,
  BARN,
  APRON,
  TANK,
  WINDMILL,
  hash,
  loopSin,
  clamp,
} from '../config.js';
import { mesh, seg, bale, contactShadow } from './detail.js';
import { chamferBoxGeometry } from '../../../shared/core/geometry.js';

const box = (p, w, h, d, mat, x, y, z, opts = {}) =>
  mesh(
    p,
    opts.chamfer
      ? chamferBoxGeometry(w, h, d, { top: opts.chamfer })
      : new THREE.BoxGeometry(w, h, d),
    mat,
    x,
    y,
    z,
    opts,
  );
const cyl = (p, r0, r1, h, mat, x, y, z, opts = {}) =>
  mesh(
    p,
    new THREE.CylinderGeometry(
      r0,
      r1,
      h,
      opts.seg ?? 10,
      1,
      opts.open ?? false,
    ),
    mat,
    x,
    y,
    z,
    opts,
  );

export function buildSet(scene, mats) {
  const root = new THREE.Group();
  root.name = 'set';
  scene.add(root);
  const ambient = [];

  // ---- slab ---------------------------------------------------------------
  const { hx, hz, thick } = SLAB;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(hx * 2, thick, hz * 2), [
    mats.slabSide,
    mats.slabSideDark,
    mats.grass,
    mats.slabSideDark,
    mats.slabSide,
    mats.slabSideDark,
  ]);
  slab.position.y = -thick / 2;
  slab.receiveShadow = true;
  slab.name = 'slab';
  root.add(slab);
  // A thin topsoil band on the two camera-facing sides so the cut reads as turf.
  box(root, hx * 2 + 0.01, 0.08, 0.02, mats.grassDark, 0, -0.04, hz + 0.005, {
    castShadow: false,
  });
  box(root, 0.02, 0.08, hz * 2 + 0.01, mats.grassDark, hx + 0.005, -0.04, 0, {
    castShadow: false,
  });

  // ---- ground story: worn patches, the path, the mud ----------------------
  const decal = (w, d, mat, x, z, rot = 0, y = 0.004) => {
    const m = mesh(root, new THREE.PlaneGeometry(w, d), mat, x, y, z, {
      rotation: [-Math.PI / 2, 0, rot],
      castShadow: false,
    });
    return m;
  };
  // Darker grass patches give the field a grain without speckle.
  for (let i = 0; i < 14; i++) {
    const x = -9 + hash(i * 3.1) * 18;
    const z = -6 + hash(i * 7.7) * 12;
    const m = mesh(
      root,
      new THREE.CircleGeometry(1, 9),
      i % 3 ? mats.grassDark : mats.grassLit,
      x,
      0.002,
      z,
      { rotation: [-Math.PI / 2, 0, hash(i + 4) * 3], castShadow: false },
    );
    m.scale.set(0.7 + hash(i) * 1.1, 0.5 + hash(i + 9) * 0.8, 1);
  }
  // Path from the barn apron to the pasture gate: two ruts and a worn middle.
  const pathPts = [
    [APRON.x1 - 0.1, -0.55],
    [-3.6, -0.85],
    [-2.3, -1.0],
    [-1.5, -1.15],
    [-0.6, -1.2],
  ];
  const curve = new THREE.CatmullRomCurve3(
    pathPts.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  );
  const N = 24;
  for (let i = 0; i < N; i++) {
    const a = curve.getPoint(i / N);
    const b = curve.getPoint((i + 1) / N);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const len = a.distanceTo(b) + 0.06;
    const yaw = Math.atan2(b.x - a.x, b.z - a.z);
    const g = new THREE.Group();
    g.position.set(mid.x, 0, mid.z);
    g.rotation.y = yaw;
    root.add(g);
    mesh(g, new THREE.PlaneGeometry(1.25, len), mats.dirt, 0, 0.006, 0, {
      rotation: [-Math.PI / 2, 0, 0],
      castShadow: false,
    });
    for (const s of [-1, 1]) {
      mesh(
        g,
        new THREE.PlaneGeometry(0.16, len),
        mats.dirtDark,
        s * 0.33,
        0.008,
        0,
        { rotation: [-Math.PI / 2, 0, 0], castShadow: false },
      );
    }
  }
  // Hoof-churned mud at the trough and inside the gate.
  decal(3.4, 2.2, mats.dirt, TANK.x + 0.2, TANK.z + 1.0, 0.3, 0.005);
  decal(2.2, 1.4, mats.mud, TANK.x + 0.1, TANK.z + 1.05, 0.2, 0.007);
  decal(2.0, 1.6, mats.dirt, PASTURE.x0 + 1.0, -1.2, 0.0, 0.005);
  // Apron in front of the barn doors: concrete with a crack line.
  box(
    root,
    APRON.x1 - APRON.x0,
    APRON.y,
    APRON.z1 - APRON.z0,
    mats.concrete,
    (APRON.x0 + APRON.x1) / 2,
    APRON.y / 2,
    (APRON.z0 + APRON.z1) / 2,
    { castShadow: false },
  );
  box(
    root,
    0.035,
    0.004,
    1.4,
    mats.concreteDark,
    APRON.x0 + 0.45,
    APRON.y + 0.002,
    0.6,
    { rotation: [0, 0.35, 0], castShadow: false },
  );

  // Grass tufts: small, three blades each, swaying on loop-safe sines.
  const tuftGeo = new THREE.ConeGeometry(0.035, 0.22, 4);
  const tufts = new THREE.Group();
  root.add(tufts);
  for (let i = 0; i < 90; i++) {
    const x = -10.1 + hash(i * 1.37) * 20.2;
    const z = -6.7 + hash(i * 2.91) * 13.4;
    if (x > BARN.x - 2.6 && x < -4.6 && z > -3.2 && z < 2.2) continue;
    if (x > -5.0 && x < -1.0 && z > -1.6 && z < -0.2) continue;
    if (x < -5.8 && z > 2.6) continue; // the corn patch
    if (x > 3.6 && z > 4.6) continue; // the pumpkin patch
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    tufts.add(g);
    for (let k = 0; k < 3; k++) {
      mesh(
        g,
        tuftGeo,
        k === 1 ? mats.tuft : mats.grassLit,
        (k - 1) * 0.045,
        0.1,
        0,
        { rotation: [0, 0, (k - 1) * 0.35], castShadow: false },
      );
    }
    ambient.push((t) => {
      g.rotation.z = 0.06 * loopSin(t, 12, i * 1.7);
    });
  }

  // ---- pasture fence + gate --------------------------------------------------
  const fence = new THREE.Group();
  fence.name = 'fence';
  root.add(fence);
  const P = PASTURE;
  const post = (x, z) => {
    box(fence, 0.13, 1.18, 0.13, mats.woodDark, x, 0.59, z, { chamfer: 0.03 });
    box(fence, 0.15, 0.04, 0.15, mats.wood, x, 1.19, z, { castShadow: false });
  };
  const rails = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az);
    const yaw = Math.atan2(bx - ax, bz - az);
    for (const y of [0.42, 0.78, 1.08]) {
      box(
        fence,
        0.05,
        0.11,
        len,
        y === 0.78 ? mats.wood : mats.woodLit,
        (ax + bx) / 2,
        y,
        (az + bz) / 2,
        { rotation: [0, yaw, 0] },
      );
    }
  };
  const side = (ax, az, bx, bz, skip) => {
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(len / 1.6));
    let prev = [ax, az];
    post(ax, az);
    for (let i = 1; i <= n; i++) {
      const x = ax + ((bx - ax) * i) / n;
      const z = az + ((bz - az) * i) / n;
      post(x, z);
      rails(prev[0], prev[1], x, z);
      prev = [x, z];
    }
  };
  side(P.x0, P.z1, P.x1, P.z1); // front
  side(P.x1, P.z1, P.x1, P.z0); // east
  side(P.x1, P.z0, P.x0, P.z0); // back
  side(P.x0, P.z0, P.x0, P.gateZ0); // west, behind the gate
  side(P.x0, P.gateZ1, P.x0, P.z1); // west, in front of the gate
  // The gate: frame, three boards, a diagonal brace, two strap hinges, a latch.
  const gate = new THREE.Group();
  gate.position.set(P.x0, 0, P.gateZ0);
  fence.add(gate);
  const gw = P.gateZ1 - P.gateZ0 - 0.1;
  for (const y of [0.32, 0.66, 1.0])
    box(gate, 0.05, 0.1, gw, mats.woodPale, 0, y, gw / 2 + 0.05);
  box(gate, 0.06, 1.0, 0.09, mats.woodPale, 0, 0.62, 0.08);
  box(gate, 0.06, 1.0, 0.09, mats.woodPale, 0, 0.62, gw + 0.02);
  seg(
    gate,
    new THREE.Vector3(0, 0.32, 0.12),
    new THREE.Vector3(0, 1.0, gw - 0.02),
    0.03,
    0.03,
    mats.woodPale,
    { segments: 4 },
  );
  for (const y of [0.4, 0.9])
    box(gate, 0.07, 0.04, 0.2, mats.iron, 0.01, y, 0.14);
  box(gate, 0.09, 0.06, 0.08, mats.iron, 0.02, 0.86, gw + 0.07);

  // ---- hay feeder in the pasture (mid-ground prop) --------------------------
  const feeder = new THREE.Group();
  feeder.name = 'hayFeeder';
  feeder.position.set(0.5, 0, 2.5);
  root.add(feeder);
  mesh(
    feeder,
    new THREE.CylinderGeometry(0.62, 0.66, 0.78, 14),
    mats.hay,
    0,
    0.39,
    0,
  ); // the bale
  mesh(
    feeder,
    new THREE.CylinderGeometry(0.5, 0.62, 0.16, 14),
    mats.hayLit,
    0,
    0.86,
    0,
  ); // eaten-down top
  for (const y of [0.12, 0.92]) {
    mesh(
      feeder,
      new THREE.TorusGeometry(0.76, 0.05, 4, 18),
      mats.galv,
      0,
      y,
      0,
      { rotation: [Math.PI / 2, 0, 0] },
    );
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    seg(
      feeder,
      new THREE.Vector3(Math.sin(a) * 0.76, 0.12, Math.cos(a) * 0.76),
      new THREE.Vector3(
        Math.sin(a + 0.25) * 0.76,
        0.92,
        Math.cos(a + 0.25) * 0.76,
      ),
      0.04,
      0.04,
      mats.galv,
      { segments: 4 },
    );
  }
  for (let i = 0; i < 7; i++) {
    const a = 0.5 + i * 0.37;
    mesh(
      feeder,
      new THREE.BoxGeometry(0.03, 0.03, 0.34),
      mats.hayLit,
      Math.sin(a) * 0.95,
      0.02,
      Math.cos(a) * 0.95,
      { rotation: [0, a, 0], castShadow: false },
    );
  }
  contactShadow(root, feeder.position.x, 0, feeder.position.z, 2.1, 0.55);

  // ---- bales stacked by the barn, a loose one with a pitchfork --------------
  const bales = new THREE.Group();
  bales.name = 'bales';
  bales.position.set(-4.5, 0, -4.4);
  root.add(bales);
  const b = { w: 1.0, h: 0.42, d: 0.5 };
  bale(bales, mats.hay, mats.hayDark, 0, 0.21, 0, { ...b, rotation: 0.02 });
  bale(bales, mats.hay, mats.hayDark, 0, 0.21, 0.56, { ...b, rotation: -0.03 });
  bale(bales, mats.hayLit, mats.hayDark, 0.05, 0.63, 0.28, {
    ...b,
    rotation: 0.08,
  });
  bale(bales, mats.hay, mats.hayDark, 0.9, 0.21, 0.9, { ...b, rotation: 0.9 });
  const fork = new THREE.Group();
  fork.position.set(0.55, 0, 0.75);
  fork.rotation.set(0.0, 0.4, -0.38);
  bales.add(fork);
  mesh(
    fork,
    new THREE.CylinderGeometry(0.022, 0.022, 1.45, 5),
    mats.woodPale,
    0,
    0.75,
    0,
  );
  for (let i = -1; i <= 1; i++)
    mesh(
      fork,
      new THREE.BoxGeometry(0.018, 0.3, 0.018),
      mats.steel,
      i * 0.06,
      1.58,
      0,
    );
  mesh(fork, new THREE.BoxGeometry(0.16, 0.025, 0.025), mats.steel, 0, 1.45, 0);
  contactShadow(root, -4.2, 0, -3.9, 2.4, 0.6);

  // ---- milk cans + bucket by the barn door (left of the threshold) ---------
  const cans = new THREE.Group();
  cans.name = 'milkCans';
  cans.position.set(-5.25, 0, 1.85);
  root.add(cans);
  for (const [x, z, r] of [
    [0, 0, 0],
    [0.42, 0.12, 0.6],
  ]) {
    const c = new THREE.Group();
    c.position.set(x, 0, z);
    c.rotation.y = r;
    cans.add(c);
    mesh(
      c,
      new THREE.CylinderGeometry(0.17, 0.19, 0.52, 12),
      mats.galv,
      0,
      0.26,
      0,
    );
    mesh(
      c,
      new THREE.CylinderGeometry(0.1, 0.17, 0.14, 12),
      mats.galv,
      0,
      0.59,
      0,
    );
    mesh(
      c,
      new THREE.CylinderGeometry(0.1, 0.1, 0.07, 12),
      mats.steel,
      0,
      0.69,
      0,
    );
    mesh(
      c,
      new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12),
      mats.steel,
      0,
      0.745,
      0,
    );
    mesh(
      c,
      new THREE.TorusGeometry(0.19, 0.015, 4, 14),
      mats.steel,
      0,
      0.06,
      0,
      { rotation: [Math.PI / 2, 0, 0] },
    );
    for (const s of [-1, 1])
      mesh(
        c,
        new THREE.TorusGeometry(0.06, 0.014, 4, 8, Math.PI),
        mats.steel,
        s * 0.15,
        0.6,
        0,
        { rotation: [0, Math.PI / 2, 0] },
      );
  }
  const bucket = new THREE.Group();
  bucket.position.set(0.25, 0, 0.5);
  bucket.rotation.z = Math.PI / 2 - 0.1; // tipped over: the story detail
  cans.add(bucket);
  mesh(
    bucket,
    new THREE.CylinderGeometry(0.15, 0.12, 0.28, 12, 1, true),
    mats.galv,
    0.15,
    0,
    0,
    { side: THREE.DoubleSide },
  );
  mesh(
    bucket,
    new THREE.CylinderGeometry(0.12, 0.12, 0.01, 12),
    mats.ink,
    0.15,
    -0.14,
    0,
  );
  contactShadow(root, -5.0, 0, 1.95, 1.3, 0.55);

  // ---- wheelbarrow with a shovel, right of the threshold -------------------
  const wb = new THREE.Group();
  wb.name = 'wheelbarrow';
  wb.position.set(-4.3, 0, -2.75);
  wb.rotation.y = 0.9;
  root.add(wb);
  mesh(wb, new THREE.TorusGeometry(0.17, 0.05, 6, 14), mats.ink, 0, 0.2, 0.62, {
    rotation: [0, Math.PI / 2, 0],
  });
  mesh(
    wb,
    new THREE.CylinderGeometry(0.05, 0.05, 0.14, 8),
    mats.steel,
    0,
    0.2,
    0.62,
    { rotation: [0, 0, Math.PI / 2] },
  );
  mesh(
    wb,
    new THREE.CylinderGeometry(0.34, 0.24, 0.3, 4, 1, false),
    mats.millRed,
    0,
    0.47,
    0.18,
    { rotation: [0, Math.PI / 4, 0], scale: [1, 1, 1.35] },
  );
  mesh(
    wb,
    new THREE.BoxGeometry(0.48, 0.03, 0.55),
    mats.dirtLit ?? mats.dirt,
    0,
    0.62,
    0.18,
    { castShadow: false },
  );
  for (const s of [-1, 1]) {
    seg(
      wb,
      new THREE.Vector3(s * 0.2, 0.2, 0.6),
      new THREE.Vector3(s * 0.27, 0.55, -0.62),
      0.022,
      0.022,
      mats.woodDark,
      { segments: 4 },
    );
    seg(
      wb,
      new THREE.Vector3(s * 0.2, 0.38, -0.1),
      new THREE.Vector3(s * 0.22, 0.0, -0.22),
      0.02,
      0.02,
      mats.iron,
      { segments: 4 },
    );
  }
  seg(
    wb,
    new THREE.Vector3(0.05, 0.6, 0.2),
    new THREE.Vector3(-0.1, 1.15, -0.45),
    0.018,
    0.018,
    mats.woodPale,
    { segments: 4 },
  );
  mesh(wb, new THREE.BoxGeometry(0.2, 0.03, 0.26), mats.steel, 0.1, 0.6, 0.42, {
    rotation: [0.4, 0, 0],
  });
  contactShadow(root, -4.3, 0, -2.7, 1.5, 0.55);

  // ---- pumpkin patch + scarecrow (foreground, near-left) -------------------
  const patch = new THREE.Group();
  patch.name = 'pumpkinPatch';
  root.add(patch);
  decal(5.6, 2.2, mats.dirt, 6.8, 5.75, 0.0, 0.005);
  for (let r = 0; r < 3; r++)
    decal(5.2, 0.12, mats.dirtDark, 6.8, 5.05 + r * 0.7, 0.0, 0.007);
  const pumpkins = [
    [4.5, 5.1, 0.36],
    [5.4, 5.9, 0.28],
    [6.2, 5.0, 0.42],
    [8.6, 5.2, 0.3],
    [5.0, 6.45, 0.4],
    [7.9, 6.3, 0.26],
    [9.3, 5.9, 0.33],
    [6.7, 6.5, 0.24],
    [9.6, 4.9, 0.36],
  ];
  pumpkins.forEach(([x, z, r], i) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = hash(i) * 3;
    patch.add(g);
    const lobes = 6;
    for (let k = 0; k < lobes; k++) {
      const a = (k / lobes) * Math.PI * 2;
      mesh(
        g,
        new THREE.SphereGeometry(r * 0.55, 8, 6),
        k % 2 ? mats.pumpkin : mats.pumpkinDark,
        Math.sin(a) * r * 0.45,
        r * 0.62,
        Math.cos(a) * r * 0.45,
        { scale: [0.8, 1.05, 0.8] },
      );
    }
    mesh(
      g,
      new THREE.CylinderGeometry(0.03, 0.045, 0.12, 5),
      mats.vine,
      0,
      r * 1.2,
      0,
      { rotation: [0.2, 0, 0.3] },
    );
    seg(
      g,
      new THREE.Vector3(0, r * 1.15, 0),
      new THREE.Vector3(r * 1.8, 0.03, r * 0.8),
      0.015,
      0.012,
      mats.vine,
      { segments: 3, castShadow: false },
    );
    mesh(
      g,
      new THREE.SphereGeometry(0.11, 5, 3),
      mats.vine,
      r * 1.5,
      0.06,
      r * 0.9,
      { scale: [1.4, 0.35, 1], castShadow: false },
    );
    contactShadow(patch, x, 0, z, r * 3.0, 0.5);
  });
  // The scarecrow: pole, crossbar, sack head with a stitched face, straw hat,
  // plaid shirt, straw at the cuffs. Sleeves and straw sway on loop-safe sines.
  const crow = new THREE.Group();
  crow.name = 'scarecrow';
  crow.position.set(7.4, 0, 5.55);
  crow.rotation.y = 0.75;
  patch.add(crow);
  mesh(
    crow,
    new THREE.CylinderGeometry(0.045, 0.055, 2.2, 6),
    mats.woodDark,
    0,
    1.1,
    0,
  );
  mesh(
    crow,
    new THREE.CylinderGeometry(0.1, 0.12, 0.08, 6),
    mats.dirtDark,
    0,
    0.03,
    0,
    { castShadow: false },
  );
  const torso = new THREE.Group();
  torso.position.y = 1.35;
  crow.add(torso);
  mesh(
    torso,
    new THREE.CylinderGeometry(0.2, 0.25, 0.62, 8),
    mats.cloth.plaid,
    0,
    0,
    0,
    { scale: [1, 1, 0.7] },
  );
  mesh(
    torso,
    new THREE.CylinderGeometry(0.255, 0.27, 0.08, 8),
    mats.cloth.denim,
    0,
    -0.3,
    0,
    { scale: [1, 1, 0.72] },
  );
  for (let i = 0; i < 6; i++)
    mesh(
      torso,
      new THREE.ConeGeometry(0.035, 0.2, 4),
      mats.hayLit,
      -0.18 + i * 0.07,
      -0.42,
      0.02,
      { rotation: [Math.PI, 0, (i - 2.5) * 0.12] },
    );
  const arms = new THREE.Group();
  arms.position.y = 0.2;
  torso.add(arms);
  mesh(
    arms,
    new THREE.CylinderGeometry(0.03, 0.03, 1.5, 5),
    mats.woodDark,
    0,
    0,
    0,
    { rotation: [0, 0, Math.PI / 2] },
  );
  const sleeves = [];
  for (const s of [-1, 1]) {
    const sl = new THREE.Group();
    sl.position.set(s * 0.18, 0, 0);
    arms.add(sl);
    mesh(
      sl,
      new THREE.CylinderGeometry(0.075, 0.095, 0.52, 7),
      mats.cloth.plaidDark,
      s * 0.26,
      0,
      0,
      { rotation: [0, 0, Math.PI / 2] },
    );
    for (let k = 0; k < 4; k++)
      mesh(
        sl,
        new THREE.ConeGeometry(0.03, 0.2, 4),
        mats.hayLit,
        s * 0.6,
        -0.04 + (k - 1.5) * 0.04,
        0,
        { rotation: [0, 0, -s * (Math.PI / 2 + (k - 1.5) * 0.3)] },
      );
    sleeves.push([sl, s]);
  }
  const head = new THREE.Group();
  head.position.y = 0.55;
  torso.add(head);
  mesh(head, new THREE.SphereGeometry(0.19, 9, 7), mats.burlap, 0, 0, 0, {
    scale: [1, 1.1, 0.95],
  });
  mesh(
    head,
    new THREE.CylinderGeometry(0.06, 0.1, 0.1, 7),
    mats.burlap,
    0,
    -0.2,
    0,
  ); // tied neck
  mesh(
    head,
    new THREE.TorusGeometry(0.085, 0.018, 4, 8),
    mats.hayDark,
    0,
    -0.17,
    0,
    { rotation: [Math.PI / 2, 0, 0] },
  );
  for (const s of [-1, 1])
    mesh(
      head,
      new THREE.BoxGeometry(0.05, 0.05, 0.02),
      mats.ink,
      s * 0.07,
      0.04,
      0.17,
      { castShadow: false },
    ); // button eyes
  for (let k = -2; k <= 2; k++)
    mesh(
      head,
      new THREE.BoxGeometry(0.018, 0.04, 0.02),
      mats.ink,
      k * 0.035,
      -0.07,
      0.165,
      { castShadow: false },
    ); // stitched mouth
  box(head, 0.12, 0.015, 0.02, mats.ink, 0, -0.07, 0.17, { castShadow: false });
  mesh(
    head,
    new THREE.CylinderGeometry(0.4, 0.42, 0.03, 12),
    mats.cloth.straw,
    0,
    0.16,
    0,
    { rotation: [-0.15, 0, 0.1] },
  );
  mesh(
    head,
    new THREE.CylinderGeometry(0.15, 0.18, 0.17, 10),
    mats.cloth.straw,
    0,
    0.25,
    -0.02,
    { rotation: [-0.15, 0, 0.1] },
  );
  mesh(
    head,
    new THREE.CylinderGeometry(0.185, 0.185, 0.04, 10),
    mats.barnRed,
    0,
    0.19,
    -0.01,
    { rotation: [-0.15, 0, 0.1] },
  );
  // a crow on the crossbar: the scarecrow is not doing its job
  const bird = new THREE.Group();
  bird.position.set(0.66, 0.08, 0);
  arms.add(bird);
  mesh(bird, new THREE.SphereGeometry(0.07, 6, 5), mats.ink, 0, 0.06, 0, {
    scale: [0.8, 0.9, 1.4],
  });
  mesh(bird, new THREE.SphereGeometry(0.045, 6, 5), mats.ink, 0, 0.13, 0.07);
  mesh(
    bird,
    new THREE.ConeGeometry(0.018, 0.06, 4),
    mats.hay2 ?? mats.hayLit,
    0,
    0.13,
    0.13,
    { rotation: [Math.PI / 2, 0, 0] },
  );
  mesh(bird, new THREE.BoxGeometry(0.06, 0.02, 0.1), mats.ink, 0, 0.05, -0.12, {
    rotation: [0.4, 0, 0],
  });
  contactShadow(patch, 7.4, 0, 5.55, 1.2, 0.55);
  ambient.push((t, wind = 0) => {
    const w = 1 + wind * 4;
    torso.rotation.z = 0.025 * loopSin(t, 9, 0.4) * w;
    for (const [sl, s] of sleeves) sl.rotation.x = 0.08 * loopSin(t, 17, s) * w;
    head.rotation.z = 0.04 * loopSin(t, 7, 1.1) * w;
    bird.rotation.y = 0.5 * Math.sign(loopSin(t, 5, 0.2)) * 0.6;
  });

  // ---- corn patch in the near-left corner: rows of stalks, tassels, ears ----
  const corn = new THREE.Group();
  corn.name = 'corn';
  root.add(corn);
  decal(4.4, 3.8, mats.dirt, -8.1, 4.75, 0.0, 0.005);
  const stalks = [];
  const leafGeo = new THREE.BoxGeometry(0.11, 0.5, 0.015);
  for (let r = 0; r < 5; r++) {
    for (let k = 0; k < 8; k++) {
      const x = -9.95 + k * 0.5 + (r % 2) * 0.22;
      const z = 3.15 + r * 0.8;
      if (x > -6.0) continue;
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = hash(r * 9 + k) * 6;
      corn.add(g);
      const h = 1.45 + hash(r * 3 + k * 7) * 0.45;
      mesh(
        g,
        new THREE.CylinderGeometry(0.035, 0.05, h, 5),
        mats.hay,
        0,
        h / 2,
        0,
      );
      for (let l = 0; l < 4; l++) {
        const leaf = mesh(
          g,
          leafGeo,
          l % 2 ? mats.hayLit : mats.hayDark,
          0,
          0.4 + l * 0.3,
          0,
          { castShadow: false },
        );
        leaf.rotation.set(0, l * 2.1, 0.9 - (l % 2) * 1.8);
        leaf.translateY(0.18);
      }
      mesh(
        g,
        new THREE.ConeGeometry(0.05, 0.22, 4),
        mats.hayLit,
        0,
        h + 0.08,
        0,
        { castShadow: false },
      );
      if ((r + k) % 2 === 0)
        mesh(
          g,
          new THREE.CylinderGeometry(0.035, 0.045, 0.2, 5),
          mats.hay,
          0.05,
          h * 0.55,
          0,
          { rotation: [0, 0, -0.4], castShadow: false },
        );
      stalks.push([g, hash(r + k * 3) * 6]);
    }
  }
  contactShadow(root, -8.1, 0, 4.75, 4.6, 0.35);
  ambient.push((t, wind = 0) => {
    for (const [g, ph] of stalks)
      g.rotation.z = (0.03 + wind * 0.08) * loopSin(t, 11, ph);
  });

  // ---- the oak between the barn and the mill, and a hedge on the east edge --
  const oak = new THREE.Group();
  oak.name = 'oak';
  oak.position.set(-9.2, 0, -5.6);
  root.add(oak);
  mesh(
    oak,
    new THREE.CylinderGeometry(0.22, 0.34, 2.6, 8),
    mats.woodDark,
    0,
    1.3,
    0,
  );
  seg(
    oak,
    new THREE.Vector3(0, 2.2, 0),
    new THREE.Vector3(-0.9, 3.4, 0.2),
    0.16,
    0.1,
    mats.woodDark,
    { segments: 6 },
  );
  seg(
    oak,
    new THREE.Vector3(0, 2.4, 0),
    new THREE.Vector3(0.8, 3.6, -0.1),
    0.15,
    0.09,
    mats.woodDark,
    { segments: 6 },
  );
  for (const [x, y, z, r] of [
    [0, 4.2, 0, 1.35],
    [-1.0, 3.7, 0.3, 1.05],
    [0.95, 3.8, -0.1, 1.05],
    [0.2, 3.4, 0.7, 0.9],
    [-0.3, 4.8, -0.2, 0.9],
  ]) {
    mesh(
      oak,
      new THREE.IcosahedronGeometry(r, 1),
      x < 0 ? mats.grassDark : mats.grass,
      x,
      y,
      z,
      { scale: [1, 0.86, 1] },
    );
  }
  mesh(
    oak,
    new THREE.IcosahedronGeometry(0.75, 1),
    mats.grassLit,
    -0.6,
    4.6,
    0.55,
    { scale: [1, 0.8, 1] },
  );
  // a tyre swing: someone lives here
  seg(
    oak,
    new THREE.Vector3(0.75, 3.45, -0.05),
    new THREE.Vector3(0.75, 1.0, 0.05),
    0.012,
    0.012,
    mats.woodPale,
    { segments: 3, castShadow: false },
  );
  const tyre = mesh(
    oak,
    new THREE.TorusGeometry(0.26, 0.08, 6, 12),
    mats.ink,
    0.75,
    0.82,
    0.05,
    { rotation: [0, 0.6, 0] },
  );
  contactShadow(root, -9.2, 0, -5.45, 3.4, 0.6);
  ambient.push((t) => {
    tyre.rotation.x = 0.06 * loopSin(t, 10, 0.3);
  });
  const hedge = new THREE.Group();
  hedge.name = 'hedge';
  root.add(hedge);
  for (let i = 0; i < 6; i++) {
    const z = -6.3 + i * 0.95;
    mesh(
      hedge,
      new THREE.IcosahedronGeometry(0.62 + hash(i + 3) * 0.2, 1),
      i % 2 ? mats.grassDark : mats.grass,
      9.8,
      0.55,
      z,
      { scale: [0.9, 0.8, 1] },
    );
  }
  contactShadow(root, 9.8, 0, -4.0, 2.6, 0.5);

  return {
    root,
    gate,
    update(t, wind = 0) {
      for (const f of ambient) f(t, wind);
    },
  };
}
