import { T, group, box, ell, beam, tube, hash, wings } from './kit.js';
export function town(scene) {
  let g = group(scene),
    flags = [],
    rubble = [];
  box(g, 0, -0.32, 0, 24, 0.64, 18, 57);
  box(g, 0, 0.02, 0, 23.95, 0.12, 17.95, 46);
  for (let iz = 0; iz < 34; iz++)
    for (let ix = 0; ix < 45; ix++) {
      let x = -11.65 + ix * 0.52 + (iz % 2) * 0.25,
        z = -8.65 + iz * 0.52;
      if (z < -4.4) continue;
      box(
        g,
        x,
        0.105 + hash(ix + iz * 70) * 0.025,
        z,
        0.48,
        0.14,
        0.47,
        8 + Math.floor(hash(ix * 34 + iz) * 4),
      );
    }
  // Walls: staggered, visibly individual masonry courses. Gate is a true opening.
  for (let row = 0; row < 18; row++)
    for (let col = 0; col < 31; col++) {
      let x = -11.5 + col * 0.77 + (row % 2) * 0.38,
        y = 0.25 + row * 0.47;
      if (x > 11.8) continue;
      let gate =
        Math.abs(x) < 1.45 && y < 3.5 + Math.sqrt(Math.max(0, 2.1 - x * x));
      if (gate) continue;
      let broken = x > 3.1 && x < 7.8 && y > 6.5 + hash(col) * 1.4;
      if (broken) continue;
      box(
        g,
        x,
        y,
        -4.5,
        0.735,
        0.435,
        1.05,
        9 + Math.floor(hash(row * 31 + col) * 3),
      );
    }
  for (let x = -11.5; x < 12; x += 0.78) {
    let h = x > 3 && x < 8 ? 7.1 : 8.8;
    box(g, x, h - 0.4, -4.5, 0.76, 0.24, 1.35, 9);
    if (Math.round(x / 0.78) % 2 === 0) box(g, x, h, -4.5, 0.7, 0.65, 1.25, 8);
  }
  for (let x of [-11.55, -6.7, -2.3, 2.3, 8.8, 11.55]) {
    let h = x === 8.8 ? 8.2 : 9.1;
    for (let y = 0.3; y < h; y += 0.5)
      box(g, x, y, -3.85, 0.7, 0.47, 1.0, 9 + Math.floor(hash(y + x) * 3));
    box(g, x, h, -3.9, 1, 0.35, 1.3, 8);
  }
  // Oak gate, voussoirs, iron straps and handles.
  for (let side of [-1, 1]) {
    box(g, side * 0.71, 1.85, -4.23, 1.4, 3.7, 0.2, 58);
    for (let i = 0; i < 6; i++)
      box(
        g,
        side * 0.71 - 0.57 + i * 0.23,
        1.85,
        -4.08,
        0.035,
        3.65,
        0.045,
        57,
      );
    for (let y of [0.6, 1.7, 2.9]) {
      box(g, side * 0.71, y, -4, 1.3, 0.1, 0.08, 13);
      for (let k = 0; k < 4; k++)
        ell(g, side * 0.71 - 0.45 + k * 0.3, y, -3.94, 0.035, 0.035, 0.025, 6);
    }
    ell(g, side * 0.2, 1.7, -3.91, 0.08, 0.12, 0.05, 13);
  }
  for (let i = 0; i <= 12; i++) {
    let a = (i / 12) * Math.PI;
    let m = box(
      g,
      Math.cos(a) * 1.7,
      3.35 + Math.sin(a) * 1.7,
      -3.82,
      0.43,
      0.62,
      0.5,
      8 + (i % 3),
    );
    m.rotation.z = a - Math.PI / 2;
  }
  for (let x of [-8.6, 0.1, 10.1]) {
    let f = group(g, x, 6.3, -3.88);
    box(f, 0, 0, 0, 1.45, 2.3, 0.07, 50);
    box(f, 0, 1.18, 0, 1.7, 0.1, 0.13, 58);
    wings(f, 0, 0.1, 0.06, 1.35);
    flags.push(f);
  }
  function house(x, z, w = 3.2, d = 2.8, h = 2.6, ruined = false) {
    let a = group(g, x, 0, z);
    box(a, 0, h / 2, 0, w, h, d, 1);
    box(a, 0, 0.23, 0, w + 0.14, 0.35, d + 0.14, 10);
    for (let y of [0.45, 1.55, h - 0.1]) {
      box(a, 0, y, d / 2 + 0.025, w, 0.12, 0.11, 57);
      box(a, w / 2 + 0.025, y, 0, 0.11, 0.12, d, 57);
    }
    for (let xx of [-w / 2, 0, w / 2])
      box(a, xx, h / 2, d / 2 + 0.07, 0.13, h, 0.13, 58);
    for (let zz of [-d / 2, 0, d / 2])
      box(a, w / 2 + 0.05, h / 2, zz, 0.13, h, 0.13, 58);
    for (let xx of [-w * 0.29, w * 0.29])
      for (let y of [0.95, 2.12]) {
        box(a, xx, y, d / 2 + 0.08, 0.61, 0.65, 0.08, 58);
        box(a, xx, y, d / 2 + 0.13, 0.43, 0.48, 0.06, 15);
        box(a, xx, y - 0.31, d / 2 + 0.18, 0.72, 0.1, 0.22, 2);
        box(a, xx, y, d / 2 + 0.17, 0.05, 0.5, 0.03, 3);
        box(a, xx, y, d / 2 + 0.17, 0.44, 0.045, 0.03, 3);
      }
    box(a, 0.1, 0.64, d / 2 + 0.16, 0.55, 1.15, 0.13, 58);
    for (let y of [0.18, 0.75])
      box(a, 0.1, y, d / 2 + 0.24, 0.55, 0.06, 0.04, 14);
    let roofRise = 1.25;
    const sh = new T.Shape();
    sh.moveTo(-w / 2, 0);
    sh.lineTo(w / 2, 0);
    sh.lineTo(0, roofRise);
    sh.closePath();
    const gg = new T.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
    let gm = new T.Mesh(
      gg,
      new T.MeshStandardMaterial({ color: 0xe6d3af, roughness: 1 }),
    );
    gm.position.set(0, h, -d / 2);
    gm.castShadow = true;
    gm.receiveShadow = true;
    if (!ruined) a.add(gm);
    for (let zz of [-d * 0.26, d * 0.26])
      for (let yy of [1, 2.1]) {
        box(a, w / 2 + 0.09, yy, zz, 0.08, 0.56, 0.48, 57);
        box(a, w / 2 + 0.14, yy, zz, 0.05, 0.39, 0.3, 15);
        box(a, w / 2 + 0.2, yy - 0.3, zz, 0.23, 0.09, 0.6, 3);
      }
    if (ruined) {
      box(a, 0.2, h + 0.38, 0, 1.6, 0.16, 1.8, 23);
      for (let j = 0; j < 5; j++) {
        let m = box(
          a,
          0.1 + j * 0.19,
          h + 0.5 + j * 0.08,
          0,
          0.11,
          0.15,
          2,
          56,
        );
        m.rotation.x = 0.15 + j * 0.13;
      }
    }
    for (let side of [-1, 1]) {
      for (let row = 0; row < 7; row++)
        for (let c = 0; c < Math.ceil(d / 0.32) + 1; c++) {
          if (ruined && row < 5 && c > 1 && c < 8) continue;
          let u = (row + 0.5) / 7,
            m = box(
              a,
              side * u * (w / 2 + 0.22),
              h + roofRise * (1 - u),
              -d / 2 + c * 0.32,
              0.36,
              0.12,
              0.39,
              18 + Math.floor(hash(row * 17 + c + x) * 2),
            );
          m.rotation.z = -side * Math.atan2(roofRise, w / 2 + 0.22);
          let edge = box(
            a,
            side * (u * (w / 2 + 0.22) + 0.13),
            h + roofRise * (1 - u) - 0.02,
            -d / 2 + c * 0.32,
            0.055,
            0.13,
            0.39,
            19,
          );
          edge.rotation.z = m.rotation.z;
        }
      for (let k = 0; k < 4; k++)
        beam(
          a,
          [0, h + 1.2, d / 2 + 0.04],
          [side * (w / 2 - 0.1), h + 0.03, d / 2 + 0.04],
          0.065,
          58,
        );
    }
    for (let zz = -d / 2; zz < d / 2; zz += 0.3)
      box(a, 0, h + 1.26, zz, 0.24, 0.18, 0.33, 18);
    box(a, -w * 0.24, h + 0.8, -0.5, 0.5, 1.4, 0.5, 19);
    for (let xx of [-0.28, 0.28])
      box(a, -w * 0.24 + xx, h + 1.54, -0.5, 0.14, 0.18, 0.69, 18);
    for (let zz of [-0.28, 0.28])
      box(a, -w * 0.24, h + 1.54, -0.5 + zz, 0.5, 0.18, 0.14, 18);
    box(a, -w * 0.24, h + 1.45, -0.5, 0.38, 0.03, 0.38, 23);
    return a;
  }
  house(-8.9, -0.8, 3.3, 2.8, 2.8);
  house(-5.1, -0.4, 3.1, 2.9, 3.1);
  house(-9, 3.15, 3.6, 3, 2.9);
  house(-5.1, 5.4, 3.5, 3, 2.7);
  house(-0.8, 6.2, 3.7, 3.1, 3);
  house(3.4, 6.5, 3.5, 3, 2.5, true);
  house(8.8, 3.6, 2.8, 2.7, 2.5);
  house(6.4, 0.1, 3, 2.8, 3.2, true);
  // Bell tower, arched belfry and a tile spire.
  let tower = group(g, -8, -1.9, -1.2);
  box(tower, 0, 4.1, 0, 1.65, 8.2, 1.65, 1);
  for (let y of [3.4, 5.9, 7.7]) box(tower, 0, y, 0, 1.87, 0.2, 1.87, 2);
  for (let side of [-1, 1])
    for (let q of [-0.45, 0.45]) {
      box(tower, q, 6.8, side * 0.84, 0.28, 1.1, 0.07, 15);
      box(tower, side * 0.84, 6.8, q, 0.07, 1.1, 0.28, 15);
    }
  for (let i = 0; i < 9; i++) {
    let size = 2.25 * (1 - i / 10);
    box(tower, 0, 7.9 + i * 0.2, 0, size, 0.22, size, 18 + (i % 3));
  }
  beam(tower, [0, 9.7, 0], [0, 10.3, 0], 0.035, 58);
  function tree(x, z, s) {
    let a = group(g, x, 0, z);
    beam(a, [0, 0, 0], [0.12, 1.7 * s, 0], 0.16 * s, 58);
    for (let j = 0; j < 18; j++) {
      let ang = j * 2.4,
        r = hash(j + x) * 0.85 * s;
      box(
        a,
        Math.cos(ang) * r,
        (1.5 + hash(j + z) * 1.1) * s,
        Math.sin(ang) * r,
        0.7 * s,
        0.6 * s,
        0.65 * s,
        44 + (j % 5),
      );
    }
  }
  for (let p of [
    [-10.7, 1, 1],
    [-10, 6, 1],
    [-7, 6.8, 0.8],
    [-3.3, 8, 0.8],
    [5.3, 8, 0.7],
    [10.4, 0.5, 1],
    [10.5, 6, 1],
    [-6, -3, 1],
  ])
    tree(...p);
  function crate(x, z, s = 0.55) {
    let a = group(g, x, 0.12, z);
    box(a, 0, s / 2, 0, s, s, s, 59);
    for (let u of [-1, 1]) {
      box(a, u * s * 0.43, s / 2, s * 0.52, 0.07, s, 0.06, 57);
      box(a, 0, s * 0.5 + u * s * 0.4, s * 0.53, s, 0.07, 0.06, 60);
    }
    let m = box(a, 0, s / 2, s * 0.56, 0.065, s * 1.2, 0.05, 57);
    m.rotation.z = 0.7;
    return a;
  }
  for (let i = 0; i < 25; i++) {
    let x = 2.6 + hash(i) * 7.2,
      z = -2.5 + hash(i + 50) * 9;
    if (z > 4 && x < 5) continue;
    crate(x, z, 0.4 + hash(i + 8) * 0.3);
  }
  // Market awnings and cart: planks, posts, axles, hoops, loaded produce.
  for (let x of [-3.6, 3.4]) {
    let a = group(g, x, 0, 1.4);
    for (let xx of [-0.8, 0.8])
      for (let z of [-0.45, 0.45]) beam(a, [xx, 0, z], [xx, 2, z], 0.05, 58);
    box(a, 0, 0.72, 0, 1.8, 0.12, 1.05, 59);
    for (let j = 0; j < 7; j++) {
      let m = box(a, -0.78 + j * 0.26, 2, 0, 0.27, 0.08, 1.3, j % 2 ? 28 : 0);
      m.rotation.x = 0.15;
    }
    for (let j = 0; j < 15; j++)
      ell(
        a,
        hash(j) * 1.4 - 0.7,
        0.86,
        hash(j + 4) * 0.7 - 0.35,
        0.1,
        0.1,
        0.1,
        44 + (j % 4),
      );
  }
  for (let i = 0; i < 160; i++) {
    let x = 3.4 + hash(i) * 4.7,
      z = -3.7 + hash(i + 300) * 3.2,
      s = 0.12 + hash(i + 500) * 0.36;
    let m = box(g, x, 0.2 + s * 0.4, z, s, s * 0.7, s, 9 + (i % 5));
    m.rotation.set(hash(i) * 0.4, hash(i + 2) * 6, hash(i + 5) * 0.3);
  }
  for (let i = 0; i < 70; i++) {
    let x = 3.2 + hash(i) * 4.8,
      y = 2 + hash(i + 2) * 5.2;
    let m = box(g, x, y, -3.91, 0.12 + hash(i + 5) * 0.36, 0.06, 0.1, 14);
    m.rotation.z = hash(i + 9) * 1.6;
  }
  for (let i = 0; i < 100; i++) {
    let x = -11.6 + hash(i) * 23.2,
      z = 7.9 + hash(i + 3) * 0.8;
    box(g, x, 0.23, z, 0.07, 0.28, 0.08, 44 + (i % 4));
  }
  for (let x of [-2.4, 4.6, 9.5]) {
    let z = 4;
    beam(g, [x, 0.1, z], [x, 2.1, z], 0.055, 58);
    beam(g, [x, 2.1, z], [x + 0.33, 2.1, z], 0.04, 58);
    box(g, x + 0.3, 1.83, z, 0.22, 0.35, 0.22, 57);
    box(g, x + 0.3, 1.84, z + 0.12, 0.14, 0.23, 0.025, 28);
  }
  return { root: g, flags, rubble };
}
