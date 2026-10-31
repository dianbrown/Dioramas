import * as THREE from 'three';
import { WINDMILL, TANK, loopSin, clamp } from '../config.js';
import { mesh, seg, contactShadow } from './detail.js';

const H = 7.7; // top of the tower
const B = 0.85; // half base
const T = 0.24; // half top

export function buildWindmill(scene, mats) {
  const root = new THREE.Group();
  root.name = 'windmill';
  root.position.set(WINDMILL.x, 0, WINDMILL.z);
  scene.add(root);

  const legAt = (sx, sz, y) => {
    const k = y / H;
    return new THREE.Vector3(sx * (B + (T - B) * k), y, sz * (B + (T - B) * k));
  };
  const corners = [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
  ];
  for (const [sx, sz] of corners) {
    mesh(
      root,
      new THREE.CylinderGeometry(0.16, 0.2, 0.22, 6),
      mats.concrete,
      sx * B,
      0.1,
      sz * B,
    );
    seg(root, legAt(sx, sz, 0.1), legAt(sx, sz, H), 0.045, 0.045, mats.galv, {
      segments: 4,
    });
  }
  const levels = [1.3, 2.9, 4.4, 5.8, 7.0];
  for (let li = 0; li < levels.length; li++) {
    const y = levels[li];
    for (let i = 0; i < 4; i++) {
      const [ax, az] = corners[i];
      const [bx, bz] = corners[(i + 1) % 4];
      seg(root, legAt(ax, az, y), legAt(bx, bz, y), 0.022, 0.022, mats.galv, {
        segments: 4,
      });
      // X braces on every face; the two camera faces get both diagonals.
      const y0 = li === 0 ? 0.15 : levels[li - 1];
      seg(root, legAt(ax, az, y0), legAt(bx, bz, y), 0.012, 0.012, mats.steel, {
        segments: 3,
        castShadow: false,
      });
      if (
        (ax === 1 && bx === 1) ||
        (az === 1 && bz === 1) ||
        (ax === -1 && az === 1) ||
        (ax === 1 && az === 1)
      ) {
        seg(
          root,
          legAt(bx, bz, y0),
          legAt(ax, az, y),
          0.012,
          0.012,
          mats.steel,
          { segments: 3, castShadow: false },
        );
      }
    }
  }
  // Ladder up the +Z face, offset to the front-right leg.
  const lad = new THREE.Group();
  root.add(lad);
  const l0 = legAt(1, 1, 0.1);
  const l1 = legAt(1, 1, H - 0.2);
  for (const s of [-0.16, 0.16]) {
    seg(
      lad,
      new THREE.Vector3(l0.x - 0.35 + s, 0.1, l0.z + 0.06),
      new THREE.Vector3(l1.x - 0.12 + s * 0.6, H - 0.2, l1.z + 0.06),
      0.014,
      0.014,
      mats.steel,
      { segments: 3 },
    );
  }
  for (let y = 0.4; y < H - 0.3; y += 0.38) {
    const k = y / H;
    const cx = THREE.MathUtils.lerp(l0.x - 0.35, l1.x - 0.12, k);
    const cz = THREE.MathUtils.lerp(l0.z, l1.z, k) + 0.06;
    mesh(
      lad,
      new THREE.BoxGeometry(0.32 * (1 - k * 0.4), 0.02, 0.02),
      mats.steel,
      cx,
      y,
      cz,
      { castShadow: false },
    );
  }
  // The rag tied at mid height.
  const rag = new THREE.Group();
  rag.position.set(
    THREE.MathUtils.lerp(l0.x - 0.35, l1.x - 0.12, 0.42) + 0.16,
    H * 0.42,
    THREE.MathUtils.lerp(l0.z, l1.z, 0.42) + 0.08,
  );
  lad.add(rag);
  mesh(rag, new THREE.BoxGeometry(0.06, 0.06, 0.06), mats.rag, 0, 0, 0);
  const ragTail = mesh(
    rag,
    new THREE.BoxGeometry(0.1, 0.32, 0.015),
    mats.rag,
    0.04,
    -0.16,
    0,
  );

  // Platform.
  mesh(
    root,
    new THREE.BoxGeometry(1.25, 0.05, 1.25),
    mats.woodDark,
    0,
    H - 0.05,
    0,
  );
  for (const [sx, sz] of corners)
    mesh(
      root,
      new THREE.CylinderGeometry(0.018, 0.018, 0.5, 4),
      mats.galv,
      sx * 0.6,
      H + 0.2,
      sz * 0.6,
    );
  for (let i = 0; i < 4; i++) {
    const [ax, az] = corners[i];
    const [bx, bz] = corners[(i + 1) % 4];
    seg(
      root,
      new THREE.Vector3(ax * 0.6, H + 0.42, az * 0.6),
      new THREE.Vector3(bx * 0.6, H + 0.42, bz * 0.6),
      0.015,
      0.015,
      mats.galv,
      { segments: 3, castShadow: false },
    );
  }

  // ---- head: turntable, gearbox, fan, tail ---------------------------------
  const head = new THREE.Group();
  head.position.set(0, H + 0.25, 0);
  head.rotation.y = 0.62; // fan faces the camera three-quarter, into the wind
  root.add(head);
  mesh(
    head,
    new THREE.CylinderGeometry(0.26, 0.3, 0.14, 12),
    mats.iron,
    0,
    0,
    0,
  );
  mesh(
    head,
    new THREE.BoxGeometry(0.42, 0.36, 0.72),
    mats.millRed,
    0,
    0.3,
    0.08,
  );
  mesh(
    head,
    new THREE.CylinderGeometry(0.21, 0.21, 0.44, 12),
    mats.millRed,
    0,
    0.32,
    0.12,
    { rotation: [0, 0, Math.PI / 2] },
  );
  mesh(
    head,
    new THREE.BoxGeometry(0.46, 0.06, 0.76),
    mats.barnRedDark,
    0,
    0.5,
    0.08,
  );
  mesh(
    head,
    new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8),
    mats.iron,
    0,
    0.36,
    0.6,
    { rotation: [Math.PI / 2, 0, 0] },
  );
  // tail boom and vane with a name plate
  seg(
    head,
    new THREE.Vector3(0, 0.36, -0.2),
    new THREE.Vector3(0, 0.62, -2.1),
    0.035,
    0.03,
    mats.galv,
    { segments: 4 },
  );
  seg(
    head,
    new THREE.Vector3(0, 0.2, -0.2),
    new THREE.Vector3(0, 0.5, -1.7),
    0.02,
    0.02,
    mats.galv,
    { segments: 3, castShadow: false },
  );
  const vane = mesh(
    head,
    new THREE.BoxGeometry(0.03, 0.9, 1.1),
    mats.galv,
    0,
    0.62,
    -2.45,
  );
  mesh(
    head,
    new THREE.BoxGeometry(0.04, 0.32, 0.62),
    mats.millRed,
    0.005,
    0.66,
    -2.45,
    { castShadow: false },
  );
  mesh(
    head,
    new THREE.BoxGeometry(0.045, 0.06, 0.44),
    mats.trim,
    0.006,
    0.66,
    -2.45,
    { castShadow: false },
  );

  const fan = new THREE.Group();
  fan.position.set(0, 0.36, 0.86);
  head.add(fan);
  mesh(
    fan,
    new THREE.CylinderGeometry(0.12, 0.14, 0.18, 10),
    mats.millRed,
    0,
    0,
    0,
    { rotation: [Math.PI / 2, 0, 0] },
  );
  mesh(fan, new THREE.TorusGeometry(0.62, 0.025, 4, 28), mats.galv, 0, 0, 0.02);
  mesh(
    fan,
    new THREE.TorusGeometry(1.45, 0.025, 4, 36),
    mats.galv,
    0,
    0,
    -0.02,
  );
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    seg(
      fan,
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.cos(a) * 1.45, Math.sin(a) * 1.45, -0.02),
      0.018,
      0.018,
      mats.galv,
      { segments: 3, castShadow: false },
    );
  }
  const sailGeo = new THREE.BoxGeometry(0.2, 0.9, 0.015);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const r = 1.03;
    const s = mesh(
      fan,
      sailGeo,
      i === 4 ? mats.woodPale : mats.galv,
      Math.cos(a) * r,
      Math.sin(a) * r,
      0,
      {},
    );
    s.rotation.set(0, 0, a - Math.PI / 2);
    s.rotateY(0.42); // the sail pitch, so the fan reads as a fan, not a disc
    s.scale.x = 1 + 0.4 * 0; // flat
  }

  // ---- pump rod, pump stand, spout, tank -----------------------------------
  const rod = mesh(
    root,
    new THREE.CylinderGeometry(0.022, 0.022, H - 1.0, 5),
    mats.steel,
    0,
    1.05 + (H - 1.0) / 2,
    0,
    { castShadow: false },
  );
  const rodY = rod.position.y;
  const pump = new THREE.Group();
  root.add(pump);
  mesh(pump, new THREE.BoxGeometry(0.5, 0.12, 0.5), mats.concrete, 0, 0.06, 0);
  mesh(
    pump,
    new THREE.CylinderGeometry(0.09, 0.12, 0.9, 10),
    mats.iron,
    0,
    0.55,
    0,
  );
  mesh(
    pump,
    new THREE.CylinderGeometry(0.13, 0.11, 0.18, 10),
    mats.millRed,
    0,
    1.0,
    0,
  );
  // spout toward the tank
  const dx = TANK.x - WINDMILL.x;
  const dz = TANK.z - WINDMILL.z;
  const dl = Math.hypot(dx, dz);
  const ux = dx / dl;
  const uz = dz / dl;
  const spoutEnd = new THREE.Vector3(
    ux * (dl - TANK.r * 0.55),
    0.95,
    uz * (dl - TANK.r * 0.55),
  );
  seg(pump, new THREE.Vector3(0, 0.95, 0), spoutEnd, 0.05, 0.05, mats.iron, {
    segments: 6,
  });
  mesh(
    pump,
    new THREE.CylinderGeometry(0.065, 0.065, 0.12, 8),
    mats.iron,
    spoutEnd.x,
    0.9,
    spoutEnd.z,
  );
  for (const k of [0.35, 0.7])
    mesh(
      pump,
      new THREE.CylinderGeometry(0.02, 0.02, 0.95, 4),
      mats.iron,
      ux * dl * k,
      0.47,
      uz * dl * k,
    );

  const tank = new THREE.Group();
  tank.name = 'stockTank';
  tank.position.set(TANK.x - WINDMILL.x, 0, TANK.z - WINDMILL.z);
  root.add(tank);
  mesh(
    tank,
    new THREE.CylinderGeometry(TANK.r, TANK.r, TANK.h, 24, 1, true),
    mats.galv,
    0,
    TANK.h / 2,
    0,
  );
  mesh(
    tank,
    new THREE.CylinderGeometry(
      TANK.r - 0.03,
      TANK.r - 0.03,
      TANK.h,
      24,
      1,
      true,
    ),
    mats.steel,
    0,
    TANK.h / 2,
    0,
    { castShadow: false },
  );
  for (const y of [0.1, 0.3, 0.5])
    mesh(
      tank,
      new THREE.TorusGeometry(TANK.r + 0.01, 0.018, 4, 28),
      mats.steel,
      0,
      y,
      0,
      { rotation: [Math.PI / 2, 0, 0], castShadow: false },
    );
  mesh(
    tank,
    new THREE.TorusGeometry(TANK.r, 0.035, 4, 28),
    mats.galv,
    0,
    TANK.h,
    0,
    { rotation: [Math.PI / 2, 0, 0] },
  );
  const water = mesh(
    tank,
    new THREE.CircleGeometry(TANK.r - 0.03, 24),
    mats.water,
    0,
    TANK.h - 0.09,
    0,
    { rotation: [-Math.PI / 2, 0, 0], castShadow: false },
  );
  mesh(
    tank,
    new THREE.CircleGeometry(TANK.r - 0.03, 24),
    mats.waterDark,
    0,
    0.05,
    0,
    { rotation: [-Math.PI / 2, 0, 0], castShadow: false },
  );
  contactShadow(root, tank.position.x, 0, tank.position.z, TANK.r * 2.8, 0.55);

  // water stream and ripples
  const streamTop = new THREE.Vector3(spoutEnd.x, 0.86, spoutEnd.z);
  const streamMat = mats.stream.clone();
  const stream = mesh(
    root,
    new THREE.CylinderGeometry(0.035, 0.05, 0.3, 6),
    streamMat,
    streamTop.x,
    0.86 - 0.15,
    streamTop.z,
    { castShadow: false },
  );
  const ripples = [];
  const ripMat = new THREE.MeshBasicMaterial({
    color: mats.trim.color,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.12, 16),
      ripMat.clone(),
    );
    r.rotation.x = -Math.PI / 2;
    r.position.set(spoutEnd.x, TANK.h - 0.085, spoutEnd.z);
    root.add(r);
    ripples.push(r);
  }

  contactShadow(root, 0, 0, 0, 2.6, 0.5);

  return {
    root,
    fan,
    set(angle, flow, t) {
      fan.rotation.z = -angle;
      const stroke = Math.sin(angle);
      rod.position.y = rodY + stroke * 0.09;
      // water comes on the up-stroke only while the rod is moving
      const f = clamp(flow, 0, 1) * (0.55 + 0.45 * Math.max(0, stroke));
      stream.visible = f > 0.05;
      stream.scale.set(0.5 + f * 0.7, 1, 0.5 + f * 0.7);
      for (let i = 0; i < ripples.length; i++) {
        const ph = ((angle / (Math.PI * 2)) * 1.5 + i / ripples.length) % 1;
        const r = ripples[i];
        r.visible = flow > 0.1;
        r.scale.setScalar(1 + ph * 4.5);
        r.material.opacity = 0.55 * (1 - ph) * clamp(flow, 0, 1);
      }
      ragTail.rotation.z =
        0.25 * loopSin(t, 18, 0.5) * (0.4 + clamp(flow, 0, 1));
      vane.rotation.y = 0.02 * loopSin(t, 6, 0.1);
      water.position.y = TANK.h - 0.09;
    },
  };
}
