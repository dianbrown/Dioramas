import {
  THREE,
  PI,
  V,
  M,
  group,
  mesh,
  box,
  cyl,
  sphere,
  bar,
  torus,
  text,
  shadow,
} from './kit.js';

function tire(p, x, y, z, r = 1, width = 0.63) {
  const g = group(p, 'tire', x, y, z);
  const profile = [
    [0.45, -0.5],
    [0.84, -0.5],
    [0.98, -0.32],
    [1.02, 0],
    [0.98, 0.32],
    [0.84, 0.5],
    [0.45, 0.5],
  ].map(([rr, y]) => new THREE.Vector2(rr * r, y * width));
  const core = mesh(g, new THREE.LatheGeometry(profile, 24), M.rubber);
  core.rotation.z = PI / 2;
  for (const side of [-1, 1]) {
    const sidewall = cyl(
      g,
      r * 0.91,
      0.025,
      M.tire,
      side * (width / 2 + 0.01),
      0,
      0,
      r * 0.91,
      20,
    );
    sidewall.rotation.z = PI / 2;
    const rim = cyl(
      g,
      r * 0.46,
      0.035,
      M.hub,
      side * (width / 2 + 0.035),
      0,
      0,
      r * 0.46,
      16,
    );
    rim.rotation.z = PI / 2;
    const lip = torus(
      g,
      r * 0.47,
      0.025,
      M.chrome,
      side * (width / 2 + 0.06),
      0,
      0,
    );
    lip.rotation.y = PI / 2;
    const hub = cyl(
      g,
      r * 0.19,
      0.07,
      M.metal,
      side * (width / 2 + 0.08),
      0,
      0,
      r * 0.19,
      12,
    );
    hub.rotation.z = PI / 2;
    for (let i = 0; i < 8; i++) {
      const a = (i * PI) / 4;
      const bolt = cyl(
        g,
        0.034,
        0.035,
        M.chrome,
        side * (width / 2 + 0.07),
        Math.sin(a) * r * 0.3,
        Math.cos(a) * r * 0.3,
        0.034,
        6,
      );
      bolt.rotation.z = PI / 2;
    }
  }
  // Alternating chevron tread blocks wrap the full circumference.
  for (let j = 0; j < 24; j++)
    for (const s of [-1, 1]) {
      const a = (j * PI) / 12;
      const b = box(
        g,
        width * 0.56,
        0.13,
        0.22,
        M.tread,
        s * width * 0.23,
        Math.cos(a) * (r - 0.015),
        Math.sin(a) * (r - 0.015),
        0.018,
      );
      b.rotation.set(a, s * 0.42, 0);
    }
  return g;
}
export function buildTruck(scene, name, paint, accent) {
  const root = group(scene, name),
    chassis = group(root, 'chassis'),
    body = group(chassis, 'body');
  root.scale.setScalar(0.86);
  const wheels = [];
  for (const z of [-1.45, 1.35]) {
    bar(chassis, V(-1.38, 1.08, z), V(1.38, 1.08, z), 0.12, M.black);
    sphere(chassis, 0.24, M.black, 0, 1.08, z, [1.4, 1, 1]);
    for (const side of [-1, 1]) {
      wheels.push(tire(root, side * 1.42, 1.08, z, 1.02, 0.7));
      bar(
        chassis,
        V(side * 0.55, 1.38, 0),
        V(side * 1.1, 1.08, z),
        0.055,
        M.chrome,
      );
      const shock = group(chassis, 'coil-over', side * 0.9, 1.35, z);
      bar(shock, V(0, -0.25, 0), V(0, 0.4, 0), 0.035, M.chrome);
      for (let j = 0; j < 7; j++) {
        const r = torus(shock, 0.09, 0.018, accent, 0, -0.16 + j * 0.075, 0);
        r.rotation.x = PI / 2;
      }
    }
  }
  box(chassis, 1.8, 0.18, 4.5, M.black, 0, 1.4, 0);
  for (const side of [-1, 1])
    box(chassis, 0.12, 0.2, 4.4, M.metal, side * 0.65, 1.27, 0);
  // Pickup body: separate bed, cab, front wings, stepped bonnet and open cabin.
  box(body, 2.05, 0.38, 4.4, paint, 0, 1.78, 0, 0.07);
  box(body, 1.85, 0.08, 1.35, M.black, 0, 2.02, -1.42);
  for (const s of [-1, 1]) {
    box(body, 0.16, 0.4, 1.6, paint, s * 0.99, 2.12, -1.35);
    box(body, 0.12, 0.06, 1.65, accent, s * 1.04, 2.35, -1.35);
  }
  box(body, 2.05, 0.4, 0.12, paint, 0, 2.12, -2.12);
  box(body, 1.85, 0.14, 1.5, paint, 0, 2.08, 1.32, 0.06);
  box(body, 1.75, 0.14, 1.32, accent, 0, 2.18, 1.28, 0.04);
  const cab = group(body, 'cab', 0, 0, -0.1);
  box(cab, 2.02, 0.13, 1.65, paint, 0, 3.03, 0, 0.05);
  for (const s of [-1, 1]) {
    box(cab, 0.12, 0.65, 1.6, paint, s * 0.96, 2.13, 0);
    box(cab, 0.13, 0.08, 1.6, accent, s * 1.025, 2.5, 0);
    for (const z of [-0.76, 0.74])
      bar(cab, V(s * 0.96, 2.45, z), V(s * 0.83, 3, z * 0.86), 0.055, paint);
    bar(cab, V(s * 0.95, 2.45, -0.1), V(s * 0.88, 3, -0.1), 0.035, M.black);
    box(cab, 0.045, 0.04, 0.21, M.chrome, s * 1.04, 2.37, -0.4);
    bar(cab, V(s * 0.98, 2.53, 0.48), V(s * 1.25, 2.57, 0.58), 0.035, M.black);
    box(cab, 0.16, 0.22, 0.12, M.chrome, s * 1.26, 2.57, 0.58);
    const badge = cyl(cab, 0.16, 0.02, accent, s * 1.04, 2.16, 0.05, 0.16, 12);
    badge.rotation.z = PI / 2;
    const step = box(body, 0.4, 0.07, 1.2, M.chrome, s * 1.1, 1.5, -0.05);
    for (let i = 0; i < 4; i++)
      box(body, 0.42, 0.01, 0.04, M.black, s * 1.1, 1.54, -0.5 + i * 0.3);
  }
  // Windscreen, chrome divider, dash, bucket seats, driver and steering wheel.
  const glass = new THREE.MeshStandardMaterial({
    color: '#17252a',
    roughness: 0.3,
    metalness: 0.25,
  });
  const windshield = box(cab, 1.72, 0.48, 0.025, glass, 0, 2.75, 0.67);
  windshield.rotation.x = -0.17;
  box(cab, 0.045, 0.5, 0.035, M.chrome, 0, 2.75, 0.7);
  box(cab, 1.7, 0.035, 0.04, M.chrome, 0, 2.5, 0.73);
  box(cab, 1.72, 0.45, 0.025, glass, 0, 2.75, -0.7);
  box(cab, 1.6, 0.12, 0.22, M.black, 0, 2.4, 0.45);
  for (const x of [-0.43, 0.43]) {
    box(cab, 0.55, 0.14, 0.5, M.black, x, 2.06, -0.14, 0.05);
    box(cab, 0.55, 0.56, 0.12, M.black, x, 2.35, -0.36, 0.05);
  }
  sphere(cab, 0.14, M.skin, -0.43, 2.66, -0.05, [0.85, 1.1, 0.9]);
  box(cab, 0.32, 0.38, 0.2, M.blue, -0.43, 2.37, -0.1, 0.07);
  const steering = torus(cab, 0.15, 0.025, M.black, -0.43, 2.43, 0.29);
  steering.rotation.x = 0.65;
  // Roof cage, four crossbars, spotlights and amber cab markers.
  for (const x of [-0.87, 0.87])
    bar(cab, V(x, 3.17, -0.84), V(x, 3.17, 0.81), 0.045, M.black);
  for (let j = 0; j < 4; j++) {
    box(
      cab,
      1.8,
      0.08,
      0.12,
      name === 'redTruck' ? M.cream : accent,
      0,
      3.18,
      -0.7 + j * 0.46,
    );
  }
  for (const x of [-0.65, -0.22, 0.22, 0.65]) {
    const l = cyl(cab, 0.085, 0.075, M.chrome, x, 3.2, 0.87, 0.085, 10);
    l.rotation.x = PI / 2;
    sphere(cab, 0.065, M.cream, x, 3.2, 0.93);
  }
  // Raised blower with real intake and belt, paired vertical stacks with dark bores.
  box(body, 0.72, 0.26, 0.68, M.chrome, 0, 2.38, 1.12, 0.04);
  box(body, 0.65, 0.12, 0.48, M.metal, 0, 2.57, 1.07, 0.025);
  box(body, 0.5, 0.09, 0.035, M.black, 0, 2.6, 1.34);
  for (let i = 0; i < 4; i++)
    box(body, 0.035, 0.1, 0.04, M.chrome, -0.2 + i * 0.13, 2.6, 1.37);
  const exhaust = [];
  for (const x of [-0.87, 0.87]) {
    cyl(body, 0.075, 1.25, M.metal, x, 2.8, -0.98, 0.075, 10);
    const collar = torus(body, 0.077, 0.02, M.chrome, x, 3.43, -0.98);
    collar.rotation.x = PI / 2;
    const bore = cyl(body, 0.055, 0.015, M.black, x, 3.43, -0.98);
    exhaust.push(group(body, 'exhaust-tip', x, 3.45, -0.98));
  }
  // Wheel arches, body seam strips and bolted over-fenders.
  for (const s of [-1, 1])
    for (const z of [-1.45, 1.35]) {
      const arch = mesh(
        body,
        new THREE.TorusGeometry(1.17, 0.065, 5, 16, PI),
        paint,
        s * 1.05,
        1.08,
        z,
      );
      arch.rotation.set(0, PI / 2, 0);
      for (let j = 0; j < 5; j++) {
        const a = (j * PI) / 4;
        sphere(
          body,
          0.028,
          M.chrome,
          s * 1.13,
          1.08 + Math.sin(a) * 1.17,
          z + Math.cos(a) * 1.17,
        );
      }
    }
  // Prominent front grille guard, bumper, winch, tow eyes and rectangular lamps.
  box(body, 1.98, 0.6, 0.08, M.black, 0, 1.86, 2.24);
  for (let i = 0; i < 8; i++)
    box(body, 0.055, 0.48, 0.08, M.chrome, -0.8 + i * 0.23, 1.86, 2.3);
  for (const x of [-0.95, 0.95])
    bar(body, V(x, 1.18, 2.4), V(x, 2.22, 2.4), 0.075, accent);
  for (const y of [1.24, 1.65, 2.19])
    bar(body, V(-1.05, y, 2.42), V(1.05, y, 2.42), 0.07, M.chrome);
  box(body, 0.6, 0.22, 0.2, M.metal, 0, 1.35, 2.5);
  for (const x of [-0.74, 0.74]) {
    box(body, 0.35, 0.2, 0.08, M.cream, x, 2.12, 2.32);
    const tow = torus(body, 0.085, 0.025, M.chrome, x, 1.17, 2.5);
  }
  box(body, 2.2, 0.13, 0.16, M.chrome, 0, 1.45, -2.25);
  for (const x of [-0.8, 0.8])
    box(body, 0.3, 0.13, 0.05, M.redLight, x, 1.93, -2.22);
  const contact = shadow(scene, 0, 0, 3.8, 5.2, 0.6);
  const vehicle = new THREE.Group();
  vehicle.name = name === 'redTruck' ? 'front-axle-pivot' : 'rear-axle-pivot';
  const parts = [...root.children];
  root.add(vehicle);
  parts.forEach((p) => vehicle.add(p));
  const pivot = V(0, 1.08, name === 'redTruck' ? 1.35 : -1.45),
    rotated = V();
  // Tire-envelope samples stay in axle space: wheel spin does not change their
  // phase. Both shoulders are checked against the actual ramp/landing surface.
  const tireSamples = [];
  for (const z of [-1.45, 1.35])
    for (const x of [-1.42, 1.42])
      for (const shoulder of [-0.39, 0, 0.39])
        for (let j = 0; j < 192; j++) {
          const a = (j * PI * 2) / 192;
          tireSamples.push(
            V(x + shoulder, 1.08 + Math.cos(a) * 1.09, z + Math.sin(a) * 1.09),
          );
        }
  const sample = V();
  let lift = 0;
  return {
    root,
    vehicle,
    body,
    chassis,
    wheels,
    exhaust,
    contact,
    tireSamples,
    get supportLift() {
      return lift;
    },
    pose(s, terrain) {
      root.position.set(s.x, s.y || 0, s.z);
      root.rotation.set(0, s.yaw, 0);
      const setPitch = (p) => {
        vehicle.rotation.set(p, 0, 0);
        rotated.copy(pivot).applyEuler(vehicle.rotation);
        vehicle.position.copy(pivot).sub(rotated);
        root.updateMatrix();
        vehicle.updateMatrix();
        vehicle.matrixWorld.multiplyMatrices(root.matrix, vehicle.matrix);
      };
      let pitch = s.pitch || 0;
      if (terrain && s.alignGround) {
        // Solve front/rear contact before applying the authored suspension bounce.
        // This keeps the rear tires on the bonnet while the fronts meet the roof.
        let lo = -0.5,
          hi = 0.5;
        for (let iteration = 0; iteration < 9; iteration++) {
          const mid = (lo + hi) / 2;
          setPitch(mid);
          let front = -Infinity,
            rear = -Infinity;
          for (let i = 0; i < tireSamples.length; i++) {
            sample.copy(tireSamples[i]).applyMatrix4(vehicle.matrixWorld);
            const h = terrain(sample.x, sample.z) - sample.y;
            if (i < tireSamples.length / 2) rear = Math.max(rear, h);
            else front = Math.max(front, h);
          }
          if (front > rear) hi = mid;
          else lo = mid;
        }
        pitch += ((lo + hi) / 2 - pitch) * s.alignGround;
      }
      setPitch(pitch);
      // Body roll belongs to sprung mass. Rolling the axles with it drove a tire
      // through the floor on every donut and lifted the opposite tire into space.
      chassis.rotation.set(0, 0, s.roll || 0);
      body.position.y = s.bounce || 0;
      wheels.forEach((w) => (w.rotation.x = s.distance / 1.09));
      root.updateMatrixWorld(true);
      lift = 0;
      if (terrain)
        for (const p of tireSamples) {
          sample.copy(p).applyMatrix4(vehicle.matrixWorld);
          lift = Math.max(lift, terrain(sample.x, sample.z) - sample.y);
        }
      root.position.y += lift;
      root.updateMatrixWorld(true);
      contact.position.set(s.x, 0.026, s.z);
      contact.rotation.z = -s.yaw;
      contact.material.opacity = 0.55 / (1 + root.position.y);
    },
  };
}

export function wreckCar(p, name, paint) {
  const g = group(p, name);
  box(g, 1.7, 0.2, 3.8, M.black, 0, 0.35, 0);
  box(g, 1.85, 0.38, 3.6, paint, 0, 0.62, 0, 0.05);
  box(g, 1.55, 0.08, 1.7, paint, 0, 1.26, -0.15);
  for (const x of [-0.75, 0.75])
    for (const z of [-0.9, 0.6])
      bar(g, V(x, 0.8, z), V(x * 0.9, 1.23, z * 0.85), 0.035, M.chrome);
  for (const z of [-0.85, 0.6]) box(g, 1.4, 0.35, 0.025, M.blue, 0, 1.03, z);
  box(g, 1.75, 0.09, 0.9, paint, 0, 0.87, 1.3);
  box(g, 1.75, 0.07, 0.65, paint, 0, 0.87, -1.45);
  for (const s of [-1, 1]) {
    box(g, 0.06, 0.12, 3.4, M.chrome, s * 0.94, 0.61, 0);
    for (const z of [-1.16, 1.2]) {
      const w = tire(g, s * 0.85, 0.35, z, 0.35, 0.23);
    }
  }
  for (const z of [-1.85, 1.85]) box(g, 1.9, 0.1, 0.1, M.chrome, 0, 0.43, z);
  for (const x of [-0.63, 0.63]) box(g, 0.3, 0.15, 0.04, M.cream, x, 0.7, 1.82);
  box(g, 1, 0.2, 0.04, M.black, 0, 0.67, 1.84);
  for (let i = 0; i < 6; i++)
    box(g, 0.025, 0.16, 0.05, M.chrome, -0.4 + i * 0.16, 0.67, 1.88);
  if (!name.includes('cream')) shadow(g, 0, 0, 2.3, 4.5, 0.55);
  return g;
}
