import * as THREE from 'three';
import { BARN, APRON, loopSin, hash, clamp } from '../config.js';
import {
  mesh,
  seg,
  haloPlane,
  softDiscTexture,
  contactShadow,
} from './detail.js';
import { chamferBoxGeometry } from '../../../shared/core/geometry.js';

const W = BARN.w;
const D = BARN.d;
const EAVE = 3.0;
const KNEE = { x: 1.55, y: 4.7 };
const RIDGE = 5.95;
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

function gableShape(inset = 0) {
  const s = new THREE.Shape();
  const hw = W / 2 - inset;
  s.moveTo(-hw, 0);
  s.lineTo(hw, 0);
  s.lineTo(hw, EAVE);
  s.lineTo(KNEE.x - inset * 0.5, KNEE.y - inset * 0.3);
  s.lineTo(0, RIDGE - inset);
  s.lineTo(-KNEE.x + inset * 0.5, KNEE.y - inset * 0.3);
  s.lineTo(-hw, EAVE);
  s.closePath();
  return s;
}

export function buildBarn(scene, mats) {
  const root = new THREE.Group();
  root.name = 'barn';
  root.position.set(BARN.x, 0, BARN.z);
  root.rotation.y = BARN.rot; // gable to +X; local -X (the dressed side) faces +Z
  scene.add(root);
  const zf = D / 2; // local front face (world z = BARN.front)

  // ---- plinth --------------------------------------------------------------
  box(root, W + 0.16, 0.32, D + 0.16, mats.stone, 0, 0.16, 0, {
    chamfer: 0.04,
  });
  for (let i = 0; i < 9; i++) {
    box(
      root,
      0.5,
      0.12,
      0.02,
      mats.concreteDark,
      -W / 2 + 0.35 + i * 0.55,
      0.12 + (i % 2) * 0.12,
      zf + 0.085,
      { castShadow: false },
    );
  }

  // ---- walls: front and back gables, two sides ----------------------------
  const DOOR = { w: 2.7, h: 2.85 };
  const front = new THREE.Shape();
  front.moveTo(-W / 2, 0.32);
  front.lineTo(W / 2, 0.32);
  front.lineTo(W / 2, EAVE);
  front.lineTo(KNEE.x, KNEE.y);
  front.lineTo(0, RIDGE);
  front.lineTo(-KNEE.x, KNEE.y);
  front.lineTo(-W / 2, EAVE);
  front.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-DOOR.w / 2, 0.32);
  hole.lineTo(-DOOR.w / 2, DOOR.h);
  hole.lineTo(DOOR.w / 2, DOOR.h);
  hole.lineTo(DOOR.w / 2, 0.32);
  hole.closePath();
  front.holes.push(hole);
  const loft = new THREE.Path();
  loft.moveTo(-0.55, 3.45);
  loft.lineTo(0.55, 3.45);
  loft.lineTo(0.55, 4.45);
  loft.lineTo(-0.55, 4.45);
  loft.closePath();
  front.holes.push(loft);
  const frontGeo = new THREE.ExtrudeGeometry(front, {
    depth: 0.12,
    bevelEnabled: false,
  });
  mesh(root, frontGeo, mats.barnRed, 0, 0, zf - 0.12);
  const backGeo = new THREE.ExtrudeGeometry(gableShape(), {
    depth: 0.12,
    bevelEnabled: false,
  });
  mesh(root, backGeo, mats.barnRedDark, 0, 0, -zf);
  for (const s of [-1, 1])
    box(
      root,
      0.12,
      EAVE - 0.32,
      D,
      s < 0 ? mats.barnRed : mats.barnRedDark,
      s * (W / 2 - 0.06),
      0.32 + (EAVE - 0.32) / 2,
      0,
    );

  // Board-and-batten: vertical battens on the front and the east side.
  for (let i = 0; i <= 14; i++) {
    const x = -W / 2 + 0.12 + i * ((W - 0.24) / 14);
    if (Math.abs(x) < DOOR.w / 2 + 0.05) {
      // only above the door and around the loft
      const yTop =
        Math.abs(x) < KNEE.x
          ? KNEE.y + (RIDGE - KNEE.y) * (1 - Math.abs(x) / KNEE.x)
          : EAVE + (KNEE.y - EAVE) * ((W / 2 - Math.abs(x)) / (W / 2 - KNEE.x));
      if (Math.abs(x) > 0.6)
        box(
          root,
          0.05,
          yTop - DOOR.h - 0.3,
          0.03,
          mats.barnRedDark,
          x,
          (DOOR.h + 0.3 + yTop) / 2,
          zf + 0.012,
          { castShadow: false },
        );
      continue;
    }
    const yTop =
      Math.abs(x) < KNEE.x
        ? KNEE.y
        : EAVE + (KNEE.y - EAVE) * ((W / 2 - Math.abs(x)) / (W / 2 - KNEE.x));
    box(
      root,
      0.05,
      yTop - 0.4,
      0.03,
      i === 3 ? mats.barnRedLit : mats.barnRedDark,
      x,
      0.36 + (yTop - 0.4) / 2,
      zf + 0.012,
      { castShadow: false },
    );
  }
  for (let i = 0; i <= 12; i++) {
    const z = -D / 2 + 0.15 + i * ((D - 0.3) / 12);
    box(
      root,
      0.03,
      EAVE - 0.4,
      0.05,
      mats.barnRedDark,
      -(W / 2 + 0.012),
      0.36 + (EAVE - 0.4) / 2,
      z,
      { castShadow: false },
    );
  }
  // The patched board: a paler plank nailed across two battens, east side.
  box(root, 0.035, 0.16, 0.9, mats.woodPale, -(W / 2 + 0.03), 1.2, 0.85, {
    rotation: [0.12, 0, 0],
  });
  for (const z of [0.5, 1.2])
    box(
      root,
      0.04,
      0.03,
      0.03,
      mats.iron,
      -(W / 2 + 0.05),
      1.2 + (z - 0.85) * 0.12,
      z,
      { castShadow: false },
    );

  // White trim: corner boards, door frame, gable fascia.
  for (const s of [-1, 1]) {
    box(
      root,
      0.16,
      EAVE - 0.32,
      0.06,
      mats.trim,
      s * (W / 2 - 0.02),
      0.32 + (EAVE - 0.32) / 2,
      zf + 0.02,
    );
    box(
      root,
      0.06,
      EAVE - 0.32,
      0.16,
      mats.trim,
      -(W / 2 + 0.02),
      0.32 + (EAVE - 0.32) / 2,
      s * (D / 2 - 0.02),
    );
    box(
      root,
      0.14,
      DOOR.h - 0.32,
      0.07,
      mats.trim,
      s * (DOOR.w / 2 + 0.07),
      0.32 + (DOOR.h - 0.32) / 2,
      zf + 0.03,
    );
  }
  box(root, DOOR.w + 0.42, 0.16, 0.08, mats.trim, 0, DOOR.h + 0.08, zf + 0.03);
  // Hayloft frame and the hay inside it (lit warm from within).
  for (const s of [-1, 1])
    box(root, 0.1, 1.1, 0.06, mats.trim, s * 0.6, 3.95, zf + 0.03);
  box(root, 1.3, 0.1, 0.06, mats.trim, 0, 4.5, zf + 0.03);
  box(root, 1.3, 0.1, 0.06, mats.trim, 0, 3.42, zf + 0.03);
  box(root, 1.1, 1.0, 0.05, mats.interiorDark, 0, 3.95, zf - 0.4);
  for (let i = 0; i < 4; i++)
    box(
      root,
      0.48,
      0.3,
      0.4,
      i % 2 ? mats.interiorHay : mats.hayLit,
      -0.27 + (i % 2) * 0.5,
      3.6 + Math.floor(i / 2) * 0.3,
      zf - 0.25,
      { rotation: [0, (i - 1.5) * 0.08, 0] },
    );
  // Hay hood: a beam out over the loft with a pulley, rope and hook.
  box(root, 0.16, 0.16, 1.0, mats.wood, 0, 5.05, zf + 0.35);
  mesh(
    root,
    new THREE.TorusGeometry(0.1, 0.03, 4, 10),
    mats.iron,
    0,
    4.88,
    zf + 0.72,
    { rotation: [0, Math.PI / 2, 0] },
  );
  seg(
    root,
    new THREE.Vector3(0.02, 4.82, zf + 0.72),
    new THREE.Vector3(0.02, 3.65, zf + 0.75),
    0.012,
    0.012,
    mats.hayLit,
    { segments: 3, castShadow: false },
  );
  mesh(
    root,
    new THREE.TorusGeometry(0.05, 0.012, 3, 8, Math.PI * 1.4),
    mats.iron,
    0.02,
    3.6,
    zf + 0.75,
    { rotation: [0, Math.PI / 2, 0], castShadow: false },
  );

  // ---- gambrel roof: lower + upper pitch each side, shingle courses -------
  const roofLen = D + 0.5;
  const plane = (x0, y0, x1, y1, mat, courses) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const g = new THREE.Group();
    g.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
    g.rotation.z = ang;
    root.add(g);
    box(g, len + 0.08, 0.1, roofLen, mat, 0, 0.05, 0);
    for (let i = 0; i < courses; i++) {
      const u = -len / 2 + (i + 0.6) * (len / courses);
      box(g, 0.05, 0.035, roofLen, mats.roofDark, u, 0.115, 0, {
        castShadow: false,
      });
    }
    return g;
  };
  for (const s of [-1, 1]) {
    plane(
      s * (W / 2 + 0.25),
      EAVE - 0.16,
      s * KNEE.x,
      KNEE.y + 0.05,
      mats.roof,
      4,
    );
    plane(s * KNEE.x, KNEE.y + 0.05, 0, RIDGE + 0.08, mats.roof, 3);
  }
  box(root, 0.22, 0.12, roofLen + 0.02, mats.roofDark, 0, RIDGE + 0.12, 0); // ridge cap
  // Front fascia following the gambrel line.
  const fasc = [
    [-(W / 2 + 0.25), EAVE - 0.16],
    [-KNEE.x, KNEE.y + 0.05],
    [0, RIDGE + 0.08],
    [KNEE.x, KNEE.y + 0.05],
    [W / 2 + 0.25, EAVE - 0.16],
  ];
  for (let i = 1; i < fasc.length; i++) {
    seg(
      root,
      new THREE.Vector3(fasc[i - 1][0], fasc[i - 1][1] + 0.02, zf + 0.27),
      new THREE.Vector3(fasc[i][0], fasc[i][1] + 0.02, zf + 0.27),
      0.065,
      0.065,
      mats.trim,
      { segments: 4 },
    );
  }

  // ---- cupola + weather vane on the ridge ---------------------------------
  const cup = new THREE.Group();
  cup.position.set(0, RIDGE + 0.1, -0.3);
  root.add(cup);
  box(cup, 0.7, 0.62, 0.7, mats.trim, 0, 0.31, 0);
  for (const s of [-1, 1])
    for (let k = 0; k < 4; k++)
      box(cup, 0.5, 0.035, 0.03, mats.roofDark, 0, 0.16 + k * 0.1, s * 0.36, {
        rotation: [0.4, 0, 0],
        castShadow: false,
      });
  mesh(cup, new THREE.ConeGeometry(0.62, 0.42, 4), mats.roof, 0, 0.83, 0, {
    rotation: [0, Math.PI / 4, 0],
  });
  const vane = new THREE.Group();
  vane.position.y = 1.05;
  cup.add(vane);
  mesh(
    vane,
    new THREE.CylinderGeometry(0.02, 0.02, 0.7, 5),
    mats.iron,
    0,
    0.2,
    0,
  );
  for (const [x, z] of [
    [0.28, 0],
    [-0.28, 0],
    [0, 0.28],
    [0, -0.28],
  ])
    mesh(
      vane,
      new THREE.BoxGeometry(Math.abs(x) + 0.02, 0.02, Math.abs(z) + 0.02),
      mats.iron,
      x / 2,
      0.15,
      z / 2,
      { castShadow: false },
    );
  const arrow = new THREE.Group();
  arrow.position.y = 0.48;
  vane.add(arrow);
  mesh(arrow, new THREE.BoxGeometry(0.03, 0.025, 0.8), mats.iron, 0, 0, 0);
  mesh(arrow, new THREE.ConeGeometry(0.06, 0.14, 4), mats.iron, 0, 0, 0.44, {
    rotation: [Math.PI / 2, 0, 0],
  });
  mesh(arrow, new THREE.BoxGeometry(0.02, 0.16, 0.16), mats.iron, 0, 0, -0.38, {
    rotation: [Math.PI / 4, 0, 0],
  });
  // rooster: body, tail fan, head, comb
  mesh(
    arrow,
    new THREE.BoxGeometry(0.035, 0.18, 0.26),
    mats.iron,
    0,
    0.13,
    0.02,
  );
  mesh(
    arrow,
    new THREE.BoxGeometry(0.03, 0.24, 0.12),
    mats.iron,
    0,
    0.2,
    -0.14,
    { rotation: [-0.5, 0, 0] },
  );
  mesh(arrow, new THREE.BoxGeometry(0.035, 0.1, 0.1), mats.iron, 0, 0.27, 0.12);
  mesh(
    arrow,
    new THREE.BoxGeometry(0.03, 0.05, 0.07),
    mats.barnRedLit,
    0,
    0.33,
    0.12,
  );

  // ---- sliding doors on a track -------------------------------------------
  box(
    root,
    DOOR.w * 2 + 0.6,
    0.08,
    0.08,
    mats.iron,
    0,
    DOOR.h + 0.22,
    zf + 0.12,
  );
  const leaves = [];
  for (const s of [-1, 1]) {
    const leaf = new THREE.Group();
    root.add(leaf);
    const lw = DOOR.w / 2 + 0.06;
    const lh = DOOR.h - 0.3;
    box(leaf, lw, lh, 0.06, mats.barnRed, 0, lh / 2, 0);
    for (let k = 0; k < 4; k++)
      box(
        leaf,
        0.04,
        lh - 0.1,
        0.02,
        mats.barnRedDark,
        -lw / 2 + 0.17 + k * 0.33,
        lh / 2,
        0.035,
        { castShadow: false },
      );
    // white Z-frame: stiles, rails, diagonal
    for (const sx of [-1, 1])
      box(
        leaf,
        0.11,
        lh,
        0.05,
        mats.trim,
        sx * (lw / 2 - 0.055),
        lh / 2,
        0.045,
      );
    for (const y of [0.06, lh / 2, lh - 0.06])
      box(leaf, lw, 0.11, 0.05, mats.trim, 0, y, 0.045);
    for (const [y0, y1] of [
      [0.06, lh / 2],
      [lh / 2, lh - 0.06],
    ]) {
      const a = new THREE.Vector3(-s * (lw / 2 - 0.06), y0, 0.05);
      const b = new THREE.Vector3(s * (lw / 2 - 0.06), y1, 0.05);
      seg(leaf, a, b, 0.045, 0.045, mats.trim, { segments: 4 });
    }
    // rollers + hangers, handle
    for (const sx of [-1, 1]) {
      mesh(
        leaf,
        new THREE.CylinderGeometry(0.06, 0.06, 0.05, 8),
        mats.iron,
        sx * (lw / 2 - 0.2),
        lh + 0.17,
        0.07,
        { rotation: [Math.PI / 2, 0, 0] },
      );
      box(
        leaf,
        0.04,
        0.2,
        0.03,
        mats.iron,
        sx * (lw / 2 - 0.2),
        lh + 0.06,
        0.06,
        { castShadow: false },
      );
    }
    box(leaf, 0.04, 0.3, 0.05, mats.iron, s * -(lw / 2 - 0.2), 1.1, 0.09);
    leaf.userData = {
      s,
      lw,
      closedX: s * (lw / 2 - 0.03),
      openX: s * (lw / 2 - 0.03 + lw - 0.02),
    };
    leaf.position.set(leaf.userData.closedX, 0.32, zf + 0.09);
    leaves.push(leaf);
  }
  // Horseshoe over the door, ends up.
  mesh(
    root,
    new THREE.TorusGeometry(0.11, 0.025, 4, 10, Math.PI * 1.25),
    mats.iron,
    0,
    DOOR.h + 0.42,
    zf + 0.06,
    { rotation: [0, 0, -Math.PI * 0.125 + Math.PI] },
  );

  // ---- interior, seen when the doors open ---------------------------------
  const inside = new THREE.Group();
  root.add(inside);
  box(inside, DOOR.w + 0.4, 0.04, 2.2, mats.interiorHay, 0, 0.34, zf - 1.15, {
    castShadow: false,
  });
  box(
    inside,
    DOOR.w + 0.4,
    DOOR.h,
    0.05,
    mats.interior,
    0,
    0.32 + DOOR.h / 2,
    zf - 2.3,
    { castShadow: false },
  );
  for (const s of [-1, 1])
    box(
      inside,
      0.05,
      DOOR.h,
      2.2,
      mats.interiorDark,
      s * (DOOR.w / 2 + 0.2),
      0.32 + DOOR.h / 2,
      zf - 1.15,
      { castShadow: false },
    );
  box(inside, 0.9, 1.2, 0.08, mats.interiorDark, -0.75, 0.92, zf - 1.3, {
    castShadow: false,
  }); // stall partition
  box(inside, 0.08, 1.35, 0.08, mats.interiorDark, -0.3, 1.0, zf - 1.3, {
    castShadow: false,
  });
  for (let i = 0; i < 3; i++)
    box(
      inside,
      0.6,
      0.32,
      0.45,
      mats.interiorHay,
      0.7 + (i % 2) * 0.2,
      0.52 + i * 0.3,
      zf - 1.9 + i * 0.05,
      { castShadow: false },
    );
  mesh(
    inside,
    new THREE.SphereGeometry(0.09, 8, 6),
    mats.bulb,
    0.2,
    2.6,
    zf - 1.2,
    { castShadow: false },
  );

  // Light leaking under the closed doors.
  const leakMat = new THREE.MeshBasicMaterial({
    map: softDiscTexture('255,196,110'),
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const leak = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR.w + 0.6, 0.9),
    leakMat,
  );
  leak.rotation.x = -Math.PI / 2;
  leak.position.set(0, APRON.y + 0.012, zf + 0.35);
  root.add(leak);
  // Spill pool in front of the open doors.
  const spillMat = new THREE.MeshBasicMaterial({
    map: softDiscTexture('255,196,110'),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.2), spillMat);
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(0, APRON.y + 0.014, zf + 1.3);
  root.add(spill);

  // ---- east-side windows, warm -------------------------------------------
  for (const z of [-1.1, 0.9]) {
    const wx = -(W / 2 + 0.01);
    box(root, 0.04, 0.85, 0.75, mats.window, wx, 1.85, z, {
      castShadow: false,
    });
    box(root, 0.06, 0.08, 0.75, mats.trim, wx - 0.03, 1.85, z, {
      castShadow: false,
    });
    box(root, 0.06, 0.85, 0.06, mats.trim, wx - 0.03, 1.85, z, {
      castShadow: false,
    });
    for (const y of [1.39, 2.31])
      box(root, 0.08, 0.08, 0.9, mats.trim, wx - 0.03, y, z);
    for (const dz of [-0.4, 0.4])
      box(root, 0.08, 0.95, 0.08, mats.trim, wx - 0.03, 1.85, z + dz);
  }

  // ---- gooseneck lamp over the doors --------------------------------------
  const lamp = new THREE.Group();
  lamp.position.set(0, DOOR.h + 0.75, zf + 0.06);
  root.add(lamp);
  box(lamp, 0.16, 0.2, 0.04, mats.iron, 0, 0, 0);
  seg(
    lamp,
    new THREE.Vector3(0, 0, 0.03),
    new THREE.Vector3(0, 0.25, 0.3),
    0.025,
    0.025,
    mats.iron,
    { segments: 5 },
  );
  seg(
    lamp,
    new THREE.Vector3(0, 0.25, 0.3),
    new THREE.Vector3(0, 0.15, 0.55),
    0.025,
    0.025,
    mats.iron,
    { segments: 5 },
  );
  mesh(
    lamp,
    new THREE.ConeGeometry(0.26, 0.2, 14, 1, true),
    mats.iron,
    0,
    0.05,
    0.6,
    { side: THREE.DoubleSide },
  );
  const bulbMat = mats.bulb.clone();
  const bulb = mesh(
    lamp,
    new THREE.SphereGeometry(0.075, 10, 8),
    bulbMat,
    0,
    -0.02,
    0.6,
    { castShadow: false },
  );
  const lampHalo = haloPlane(
    lamp,
    0.7,
    0.7,
    '255,214,140',
    0.42,
    0,
    -0.04,
    0.62,
    { rotation: [-Math.PI / 2, 0, 0] },
  );
  // The hero practical gets the one real point light: it lights the door face.
  const lampLight = new THREE.PointLight(0xffc46e, 3.2, 7.5, 1.5);
  lampLight.position.set(0, -0.12, 0.75);
  lamp.add(lampLight);
  const poolMat = new THREE.MeshBasicMaterial({
    map: softDiscTexture('255,196,110'),
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, APRON.y + 0.016, zf + 0.85);
  root.add(pool);

  contactShadow(root, 0, 0, 0, Math.max(W, D) * 1.35, 0.5);

  const BULB_ON = mats.bulb.color.clone();
  const BULB_OFF = mats.roof.color.clone();
  return {
    root,
    leaves,
    lampWorld: () => bulb.getWorldPosition(new THREE.Vector3()),
    doorWorldZ: BARN.z + zf,
    setDoors(k) {
      for (const leaf of leaves)
        leaf.position.x = THREE.MathUtils.lerp(
          leaf.userData.closedX,
          leaf.userData.openX,
          k,
        );
      inside.visible = k > 0.01;
      spillMat.opacity = 0.55 * k;
      spill.scale.set(0.6 + 0.4 * k, 0.4 + 0.6 * k, 1);
      spill.position.z = zf + 0.7 + 0.6 * k;
    },
    setLeak(k) {
      leakMat.opacity = 0.32 * k;
    },
    setLamp(level) {
      bulbMat.color.copy(level > 0.5 ? BULB_ON : BULB_OFF);
      lampHalo.material.opacity = 0.42 * level;
      lampLight.intensity = 3.2 * (0.35 + 0.65 * level); // a flicker dims the door, never blacks it out
      poolMat.opacity = 0.5 * level;
    },
    setVane(angle) {
      vane.rotation.y = angle;
    },
  };
}
