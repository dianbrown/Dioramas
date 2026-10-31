import {
  PI,
  V,
  M,
  group,
  box,
  cyl,
  sphere,
  bar,
  shadow,
  hash,
  win,
  bell,
  lerp,
} from './kit.js';

// Each spectator has a head, neck, shirt, two articulated arms, bent knees,
// shoes, hair/cap and (for some) a drink or pennant. Never rows of identical dolls.
function figure(parent, name, color, skin, scale = 1) {
  const g = group(parent, name);
  g.scale.set(scale * 1.15, scale, scale * 1.1);
  const pelvis = group(g, 'hips', 0, 0.68, 0);
  box(pelvis, 0.23, 0.2, 0.17, M.blue, 0, 0, 0, 0.035);
  const torso = group(pelvis, 'torso', 0, 0.07, 0);
  box(torso, 0.31, 0.4, 0.2, color, 0, 0.21, 0, 0.055);
  cyl(torso, 0.055, 0.11, skin, 0, 0.47, 0);
  const head = group(torso, 'head', 0, 0.54, 0);
  sphere(head, 0.115, skin, 0, 0.04, 0, [0.85, 1.12, 0.9]);
  sphere(head, 0.07, skin, 0, -0.025, 0.03, [0.8, 0.8, 1]);
  for (const s of [-1, 1]) {
    sphere(head, 0.023, skin, s * 0.105, 0.03, 0);
    sphere(head, 0.012, M.black, s * 0.038, 0.05, 0.093);
  }
  box(head, 0.025, 0.04, 0.035, skin, 0, 0.015, 0.107);
  box(head, 0.035, 0.008, 0.01, M.beam, 0, -0.025, 0.105);
  const hair = sphere(head, 0.118, M.beam, 0, 0.075, -0.01, [0.89, 0.75, 0.88]);
  const arms = [];
  for (const s of [-1, 1]) {
    const shoulder = group(torso, 'shoulder', s * 0.19, 0.35, 0);
    sphere(shoulder, 0.065, color);
    bar(shoulder, V(), V(0, -0.2, 0), 0.052, color);
    const elbow = group(shoulder, 'elbow', 0, -0.2, 0);
    sphere(elbow, 0.048, skin);
    bar(elbow, V(), V(0, -0.18, 0), 0.04, skin);
    box(elbow, 0.06, 0.075, 0.05, skin, 0, -0.2, 0, 0.01);
    arms.push({ shoulder, elbow });
  }
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = group(pelvis, 'hip', s * 0.075, -0.07, 0);
    bar(hip, V(), V(0, -0.3, 0), 0.065, M.blue);
    const knee = group(hip, 'knee', 0, -0.3, 0);
    sphere(knee, 0.06, M.blue);
    bar(knee, V(), V(0, -0.27, 0), 0.047, M.blue);
    box(knee, 0.11, 0.08, 0.2, M.black, 0, -0.29, 0.045, 0.018);
    legs.push({ hip, knee });
  }
  return { g, pelvis, torso, head, arms, legs };
}
export function buildCrowd(scene) {
  const crowd = group(scene, 'spectators');
  const spectators = [];
  const shirts = [
    M.yellow,
    M.cream,
    M.teal,
    M.red,
    M.blue,
    M.green,
    M.woodLight,
  ];
  for (let row = 0; row < 2; row++)
    for (let i = 0; i < 14; i++) {
      // Empty places and uneven spacing reproduce a sparse, natural audience.
      if ((row === 1 && [1, 4, 8, 11].includes(i)) || (row === 0 && i === 5))
        continue;
      const id = i + row * 15,
        a = figure(
          crowd,
          `spectator-${id}`,
          shirts[id % 7],
          [M.skin, M.skinLight, M.skinDark][id % 3],
          0.95 + hash(id) * 0.12,
        );
      a.g.position.set(-6.2 + i * 1.18, 0.36 + row * 0.44, -5.25 - row * 0.75);
      a.g.rotation.y = (hash(id + 90) - 0.5) * 0.2;
      for (const l of a.legs) {
        l.hip.rotation.x = -PI / 2;
        l.knee.rotation.x = PI / 2;
      }
      if (id % 3 === 0) {
        cyl(a.head, 0.12, 0.06, shirts[(id + 2) % 7], 0, 0.17, 0, 0.12, 10);
        box(a.head, 0.18, 0.025, 0.13, shirts[(id + 2) % 7], 0, 0.14, 0.08);
      }
      if (id % 5 === 0) {
        const hand = a.arms[1].elbow;
        bar(hand, V(0, -0.18, 0), V(0, -0.55, 0), 0.012, M.cream);
        box(hand, 0.28, 0.18, 0.012, M.gold, 0.14, -0.46, 0);
      }
      if (id % 4 === 0)
        cyl(a.arms[0].elbow, 0.035, 0.09, M.red, 0, -0.21, 0.035);
      spectators.push(a);
    }
  const crew = [];
  for (const [i, x, z, mat] of [
    [0, -8.8, 7.15, M.yellow],
    [1, -6.1, 6.6, M.teal],
    [2, -1.3, 6.65, M.metal],
    [3, -5.6, -3.4, M.red],
    [4, 3.3, -3.3, M.orange],
  ]) {
    const a = figure(scene, `crew-${i}`, mat, M.skin, 1.05);
    a.g.position.set(x, 0, z);
    a.g.rotation.y = PI / 2;
    crew.push(a);
    shadow(scene, x, z, 0.7, 0.65, 0.35);
    if (i === 0) {
      cyl(a.head, 0.13, 0.08, M.gold, 0, 0.15, 0, 0.13, 12);
      box(a.head, 0.23, 0.02, 0.23, M.gold, 0, 0.13, 0);
    }
  }
  const responder = crew[4];
  const extinguisher = group(responder.arms[0].elbow, 'extinguisher');
  cyl(extinguisher, 0.085, 0.32, M.red, 0, -0.3, 0);
  box(extinguisher, 0.12, 0.04, 0.08, M.black, 0, -0.12, 0);
  bar(extinguisher, V(0, -0.13, 0), V(0.13, -0.25, 0.08), 0.015, M.black);
  const nozzle = group(responder.arms[1].elbow, 'nozzle', 0, -0.23, 0.09);
  cyl(nozzle, 0.025, 0.15, M.black, 0, 0, 0);
  function update(t) {
    spectators.forEach((a, i) => {
      const cheer = bell(t, 9.5, 16.7, 0.7) + bell(t, 27.3, 32.8, 0.5);
      a.torso.rotation.z = 0.025 * Math.sin(t * (1 + (i % 3)) + i);
      a.head.rotation.y = 0.15 * Math.sin(t * 0.7 + i);
      a.arms.forEach((arm, k) => {
        const phase = t * (2.7 + hash(i) * 1.2) + i * 2 + k;
        const n = cheer * (i % 3 === 0 ? 0.9 : 0.5);
        arm.shoulder.rotation.set(
          -0.3 - n * (1 + 0.35 * Math.sin(phase)),
          0,
          (k ? 1 : -1) * (0.12 + n * 0.6),
        );
        arm.elbow.rotation.x = -0.6 - n * 0.6;
      });
    });
    crew.forEach((a, i) => {
      a.head.rotation.y = 0.18 * Math.sin(t * 0.7 + i);
      a.arms[0].shoulder.rotation.x = -0.15;
      a.arms[1].shoulder.rotation.x = -0.4 - 0.1 * Math.sin(t * 2 + i);
    });
    const go = win(t, 21.8, 23),
      back = win(t, 25.1, 26.2);
    responder.g.position.set(
      lerp(3.3, 3, go - back),
      0,
      lerp(-3.3, 1.35, go - back),
    );
    responder.g.rotation.y = 0;
    const moving = (t > 21.8 && t < 23) || (t > 25.1 && t < 26.2);
    responder.legs.forEach((l, i) => {
      const phase = t * 9 + i * PI;
      l.hip.rotation.x = moving ? 0.3 * Math.sin(phase) : 0;
      l.knee.rotation.x = moving
        ? 0.15 + 0.3 * Math.max(0, -Math.sin(phase))
        : 0.05;
    });
    const spray = bell(t, 23.2, 25.1, 0.2);
    responder.arms[1].shoulder.rotation.x = -0.4 - spray * 1;
    responder.arms[1].elbow.rotation.x = -0.8;
    responder.arms[0].shoulder.rotation.x = -0.5;
    responder.arms[0].elbow.rotation.x = -0.3;
  }
  return { update, crowd, crew, responder, nozzle };
}
