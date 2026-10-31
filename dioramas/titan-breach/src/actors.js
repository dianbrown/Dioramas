import { T, group, box, ell, beam, tube, hash, wings, mats } from './kit.js';
export function titan(scene) {
  const ell = (p, x, y, z, w, h, d, c) => {
    let m = new T.Mesh(new T.SphereGeometry(1, 24, 16), mats[c]);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    m.castShadow = m.receiveShadow = true;
    p.add(m);
    return m;
  };
  let root = group(scene, 1.3, 0, -6.5),
    torso = group(root, 0, 7, 0);
  ell(torso, 0, 1.1, 0, 5, 3.3, 1.7, 38);
  ell(torso, -4, 1.3, 0, 2.2, 2.7, 1.7, 37);
  ell(torso, 4.1, 1.2, 0.1, 2.3, 2.7, 1.8, 37);
  for (let side of [-1, 1])
    for (let i = 0; i < 17; i++) {
      let q = i / 16;
      tube(
        torso,
        [
          [side * 0.3, 3.3 - q * 0.6, 1.45],
          [side * (1 + q * 2), 2.6 - q * 0.7, 1.65],
          [side * (3.2 + q * 1.9), 1.4 - q * 2, 1.3],
        ],
        0.09 + (i % 3) * 0.02,
        i % 4 === 0 ? 36 : 39 + (i % 3),
      );
    }
  ell(torso, 0, 4, 0, 1.5, 2.1, 1.25, 39);
  for (let side of [-1, 1])
    for (let i = 0; i < 7; i++)
      tube(
        torso,
        [
          [side * (0.3 + i * 0.18), 2.1, 1.25],
          [side * (0.5 + i * 0.13), 4, 1.1],
          [side * (0.6 + i * 0.14), 5.7, 0.65],
        ],
        0.085,
        i % 2 ? 36 : 43,
      );
  for (let side of [-1, 1])
    for (let j = 0; j < 13; j++) {
      let f = j / 12;
      tube(
        torso,
        [
          [side * (1.5 + f * 2), 3.1 - f * 0.6, 1.6],
          [side * (2.9 + f * 1.4), 2.3 - f * 1.5, 1.95],
          [side * (4.1 + f * 0.8), 1.2 - f * 1.9, 1.75],
        ],
        0.07,
        j % 3 ? 36 : 39,
      );
    }
  for (let side of [-1, 1])
    for (let j = 0; j < 14; j++) {
      let phi = -0.9 + j * 0.135,
        pts = [];
      for (let k = 0; k < 16; k++) {
        let th = 0.35 + k * 0.13;
        pts.push([
          side * (4.05 + 2.3 * Math.sin(th) * Math.sin(phi)),
          1.25 + 2.7 * Math.cos(th),
          0.12 + 1.85 * Math.sin(th) * Math.cos(phi),
        ]);
      }
      tube(torso, pts, 0.065, j % 3 ? 36 : 39);
    }
  let head = group(torso, 0, 6.4, 0.3);
  head.rotation.y = 0.38;
  // Sculpted upper skull only: the previous complete egg occluded the eyes and cheek anatomy.
  const flesh = (p, x, y, z, rx, ry, rz, c) => {
    const m = new T.Mesh(new T.SphereGeometry(1, 24, 18), mats[c]);
    m.position.set(x, y, z);
    m.scale.set(rx, ry, rz);
    m.castShadow = m.receiveShadow = true;
    p.add(m);
    return m;
  };
  const crown = new T.Mesh(
    new T.SphereGeometry(1, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.53),
    mats[2],
  );
  crown.position.set(0, 0.38, -0.12);
  crown.scale.set(2.13, 2.65, 1.66);
  crown.castShadow = true;
  head.add(crown);
  flesh(head, 0, -1.2, -0.12, 1.64, 1.64, 1.18, 40);
  // Forehead's converging plates form a heavy overhang, not white spectacle frames.
  for (let side of [-1, 1]) {
    tube(
      head,
      [
        [side * 0.15, 2.95, 0.17],
        [side * 0.33, 2.5, 0.9],
        [side * 0.39, 1.7, 1.54],
        [side * 0.21, 0.15, 1.67],
      ],
      0.045,
      4,
    );
    tube(
      head,
      [
        [side * 0.97, 2.68, 0.35],
        [side * 1.12, 1.95, 1.18],
        [side * 0.93, 0.7, 1.61],
      ],
      0.055,
      1,
    );
    // Temporal cutout follows the same spherical skull surface, rather than a flat side plate.
    const surface = (u, v) => {
      let polar = 1.12 + v * 0.44,
        az = 0.34 + u * 0.64;
      return [
        side * 2.15 * Math.sin(polar) * Math.cos(az),
        0.38 + 2.675 * Math.cos(polar),
        1.68 * Math.sin(polar) * Math.sin(az) - 0.12,
      ];
    };
    const positions = [],
      indices = [],
      rings = 9,
      segments = 36;
    positions.push(...surface(0, 0));
    for (let r = 1; r <= rings; r++)
      for (let k = 0; k < segments; k++) {
        let theta = (k / segments) * Math.PI * 2;
        positions.push(
          ...surface(
            (Math.cos(theta) * r) / rings,
            (Math.sin(theta) * r) / rings,
          ),
        );
      }
    for (let k = 0; k < segments; k++)
      indices.push(0, 1 + k, 1 + ((k + 1) % segments));
    for (let r = 1; r < rings; r++)
      for (let k = 0; k < segments; k++) {
        let a = 1 + (r - 1) * segments + k,
          b = 1 + (r - 1) * segments + ((k + 1) % segments),
          c = a + segments,
          d = b + segments;
        indices.push(a, c, b, b, c, d);
      }
    const patchGeo = new T.BufferGeometry();
    patchGeo.setAttribute(
      'position',
      new T.Float32BufferAttribute(positions, 3),
    );
    patchGeo.setIndex(indices);
    patchGeo.computeVertexNormals();
    const patchMat = mats[39].clone();
    patchMat.side = T.DoubleSide;
    const patch = new T.Mesh(patchGeo, patchMat);
    patch.castShadow = patch.receiveShadow = true;
    head.add(patch);
    for (let j = 0; j < 13; j++) {
      let v = -0.86 + j * 0.143,
        span = Math.sqrt(1 - v * v) * 0.96,
        pts = [];
      for (let k = 0; k < 15; k++) {
        let u = (-1 + k / 7) * span;
        pts.push(surface(u, v + 0.07 * u));
      }
      tube(head, pts, 0.045, j % 3 ? 37 : 36);
    }
    const rim = [];
    for (let k = 0; k <= 36; k++) {
      let th = (k / 36) * Math.PI * 2;
      rim.push(surface(Math.cos(th) * 1.015, Math.sin(th) * 1.015));
    }
    tube(head, rim, 0.055, 1);
    // Deep sockets remain proud of the skull and visible at the hero camera.
    let socket = flesh(head, side * 0.84, -0.35, 1.49, 0.71, 0.34, 0.25, 23);
    socket.rotation.z = side * 0.18;
    tube(
      head,
      [
        [side * 0.15, -0.13, 1.69],
        [side * 0.72, 0.01, 1.63],
        [side * 1.45, 0.2, 1.38],
      ],
      0.13,
      1,
    );
    flesh(head, side * 0.85, -0.38, 1.735, 0.135, 0.067, 0.045, 17);
    flesh(head, side * 0.85, -0.38, 1.78, 0.047, 0.059, 0.02, 23);
    tube(
      head,
      [
        [side * 0.36, -0.51, 1.72],
        [side * 0.86, -0.68, 1.68],
        [side * 1.5, -0.42, 1.44],
      ],
      0.065,
      4,
    );
    // Cheek mass with vertical fibres, swept zygomatic rim and exposed jaw muscles.
    flesh(head, side * 0.99, -1.02, 1.14, 0.54, 0.63, 0.46, 39);
    for (let j = 0; j < 9; j++) {
      let u = (j - 4) / 4,
        x = 0.99 + u * 0.46,
        z = 1.14 + 0.46 * Math.sqrt(1 - u * u * 0.8);
      tube(
        head,
        [
          [side * x, -0.63, z],
          [side * (x + 0.06), -1.02, z + 0.03],
          [side * (x - 0.06), -1.48, z - 0.11],
        ],
        0.062,
        j % 3 ? 37 : 36,
      );
    }
    tube(
      head,
      [
        [side * 1.69, -0.31, 1.01],
        [side * 1.57, -0.89, 1.39],
        [side * 0.72, -1.67, 1.55],
      ],
      0.135,
      1,
    );
    flesh(head, side * 1.54, -1.4, 0.56, 0.35, 0.84, 0.66, 38);
    for (let j = 0; j < 8; j++)
      tube(
        head,
        [
          [side * (1.51 + j * 0.025), -0.77, 0.65 + j * 0.06],
          [side * (1.64 + j * 0.025), -1.35, 0.73 + j * 0.06],
          [side * 1.38, -2.08, 1.02 + j * 0.035],
        ],
        0.055,
        j % 2 ? 36 : 39,
      );
    flesh(head, side * 2.03, -0.6, 0.03, 0.35, 0.65, 0.3, 37);
    flesh(head, side * 2.1, -0.62, 0.27, 0.19, 0.41, 0.08, 40);
    tube(
      head,
      [
        [side * 2.02, -1.12, 0.29],
        [side * 2.26, -0.65, 0.3],
        [side * 2.13, -0.12, 0.29],
      ],
      0.095,
      36,
    );
  }
  // Long nasal bridge and squared nasal process, with a restrained clenched mouth.
  flesh(head, 0, -0.77, 1.73, 0.18, 0.77, 0.19, 1);
  box(head, 0, -1.37, 1.89, 0.47, 0.21, 0.27, 2);
  for (let side of [-1, 1])
    flesh(head, side * 0.15, -1.43, 2.02, 0.075, 0.05, 0.025, 23);
  flesh(head, 0, -1.98, 1.28, 1.12, 0.33, 0.39, 23);
  for (let row = 0; row < 2; row++)
    for (let j = 0; j < 13; j++) {
      let u = (j - 6) / 6,
        x = u * 1.05,
        z = 1.76 - 0.33 * u * u,
        y = -1.8 - row * 0.21 - 0.12 * u * u;
      let m = box(head, x, y, z, 0.135, 0.175, 0.15, 1);
      m.rotation.y = u * 0.5;
    }
  tube(
    head,
    [
      [-1.24, -2.05, 1.23],
      [-0.83, -2.31, 1.5],
      [0, -2.35, 1.67],
      [0.83, -2.31, 1.5],
      [1.24, -2.05, 1.23],
    ],
    0.145,
    2,
  );
  flesh(head, 0, -2.5, 0.99, 0.73, 0.47, 0.43, 38);
  for (let j = 0; j < 9; j++)
    tube(
      head,
      [
        [(j - 4) * 0.15, -2.28, 1.43],
        [(j - 4) * 0.16, -2.55, 1.41],
        [(j - 4) * 0.13, -2.84, 1.12],
      ],
      0.065,
      j % 2 ? 37 : 36,
    );

  // Scale the complete anatomical assembly so sockets, temples and ears retain contact.
  // Deepen the lower face without narrowing or flattening the rounded upper vault.
  head.traverse((o) => {
    if (!o.isMesh) return;
    o.updateMatrix();
    const g = o.geometry.clone().applyMatrix4(o.matrix),
      a = g.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const y = a.getY(i);
      if (y < 0) a.setY(i, y * 1.18);
    }
    a.needsUpdate = true;
    g.computeVertexNormals();
    o.geometry = g;
    o.position.set(0, 0, 0);
    o.rotation.set(0, 0, 0);
    o.scale.set(1, 1, 1);
  });
  head.scale.set(1.38, 1.16, 1.72);
  // Hand grips over the wall. Wrist connects back to the right shoulder.
  let hand = group(root, 5.2, 8.45, 2.85);
  tube(
    root,
    [
      [5.1, 7.1, 0.3],
      [6.2, 7.8, 0.7],
      [5.7, 8.6, 1.7],
    ],
    0.92,
    37,
  );
  ell(hand, 0, 0.47, -0.15, 1.65, 0.63, 0.86, 37);
  let fingers = [];
  for (let i = 0; i < 4; i++) {
    let f = group(hand, -1.22 + i * 0.8, 0.52, 0.15);
    tube(
      f,
      [
        [0, 0, -0.25],
        [0, 0.12, 0.38],
        [0, -0.25, 0.88],
        [0, -1.05, 1.02],
      ],
      0.32,
      37,
    );
    ell(f, 0, -0.24, 0.83, 0.36, 0.35, 0.32, 36);
    box(f, 0, -1.07, 1.19, 0.4, 0.35, 0.09, 26);
    for (let j = 0; j < 3; j++)
      tube(
        f,
        [
          [(-1 + j) * 0.11, 0.03, 0.14],
          [(-1 + j) * 0.11, -0.2, 0.98],
          [(-1 + j) * 0.11, -0.85, 1.29],
        ],
        0.032,
        39,
      );
    fingers.push(f);
  }
  tube(
    hand,
    [
      [-1.55, 0.1, -0.25],
      [-1.85, -0.35, 0.45],
      [-1.55, -0.9, 0.75],
    ],
    0.38,
    38,
  );
  return { root, torso, head, hand, fingers };
}
export function scout(scene, i) {
  let root = group(scene),
    body = group(root, 0, 0.65, 0);
  box(body, 0, 0.24, 0, 0.38, 0.47, 0.24, 58);
  box(body, 0, 0.02, 0, 0.36, 0.11, 0.28, 56);
  box(body, 0, 0.25, 0.135, 0.09, 0.36, 0.04, 1);
  for (let s of [-1, 1]) {
    let strap = box(body, s * 0.13, 0.25, 0.16, 0.045, 0.43, 0.035, 57);
    strap.rotation.z = s * 0.22;
    box(body, s * 0.3, -0.02, -0.05, 0.17, 0.28, 0.38, 13);
    box(body, s * 0.3, 0.01, 0.17, 0.12, 0.1, 0.08, 63);
  }
  ell(body, 0, 0.64, 0, 0.17, 0.21, 0.16, 26);
  ell(body, 0, 0.76, -0.025, 0.19, 0.14, 0.17, 56);
  box(body, 0, 0.65, 0.145, 0.25, 0.045, 0.025, 23);
  ell(body, 0, 0.61, 0.16, 0.035, 0.045, 0.04, 24);
  let cape = group(body, 0, 0.43, -0.13);
  let geo = new T.BufferGeometry();
  geo.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [
        -0.22, 0, 0, 0.22, 0, 0, -0.39, -0.62, -0.27, 0.22, 0, 0, 0.39, -0.62,
        -0.27, -0.39, -0.62, -0.27,
      ],
      3,
    ),
  );
  geo.computeVertexNormals();
  let m = new T.Mesh(
    geo,
    new T.MeshStandardMaterial({
      color: 0x354d35,
      side: T.DoubleSide,
      roughness: 1,
    }),
  );
  cape.add(m);
  wings(cape, 0, -0.27, -0.15, 0.35);
  let arms = [],
    legs = [];
  for (let s of [-1, 1]) {
    let arm = group(body, s * 0.25, 0.4, 0);
    beam(arm, [0, 0, 0], [0, -0.23, 0], 0.075, 58);
    ell(arm, 0, -0.23, 0, 0.075, 0.08, 0.075, 58);
    let elbow = group(arm, 0, -0.23, 0);
    beam(elbow, [0, 0, 0], [0, -0.22, 0], 0.06, 58);
    ell(elbow, 0, -0.25, 0, 0.065, 0.075, 0.065, 26);
    beam(elbow, [0, -0.24, 0], [0, -0.24, 0.16], 0.03, 56);
    let sword = box(elbow, 0, -0.24, 0.52, 0.035, 0.065, 0.73, 63);
    arms.push({ arm, elbow });
    let hip = group(body, s * 0.12, -0.04, 0);
    beam(hip, [0, 0, 0], [0, -0.27, 0], 0.085, 2);
    let knee = group(hip, 0, -0.27, 0);
    ell(knee, 0, 0, 0, 0.08, 0.085, 0.08, 2);
    beam(knee, [0, 0, 0], [0, -0.23, 0], 0.075, 57);
    box(knee, 0, -0.26, 0.055, 0.15, 0.13, 0.27, 56);
    legs.push({ hip, knee });
  }
  let cableGeo = new T.BufferGeometry().setFromPoints([
    new T.Vector3(),
    new T.Vector3(),
  ]);
  let cable = new T.Line(
    cableGeo,
    new T.LineBasicMaterial({ color: 0xb5c3bc }),
  );
  scene.add(cable);
  return { root, body, cape, arms, legs, cable, i };
}
