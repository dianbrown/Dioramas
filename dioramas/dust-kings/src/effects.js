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
  softTexture,
  unlit,
  hash,
  bell,
} from './kit.js';
import { truckState } from './timeline.js';
export function buildEffects(scene, camera, trucks, crew) {
  const root = group(scene, 'event-effects');
  const positions = [
    [-9, 5.6],
    [-5.3, -4.8],
    [-1, -4.8],
    [4.4, -4.8],
    [9.3, -4.6],
    [6.9, 6.1],
    [4, 1.8],
  ];
  const fires = positions.map(([x, z], i) => {
    const g = group(root, i === 6 ? 'small-fire' : 'pyro-jet', x, 0, z);
    cyl(g, 0.15, 0.12, M.black, 0, 0.06, 0);
    box(g, 0.4, 0.08, 0.4, M.black, 0, 0.04, 0);
    const body = group(g, 'flame'),
      layers = [];
    for (let k = 0; k < 3; k++) {
      const geo = new THREE.CylinderGeometry(0.012, 0.38 - k * 0.08, 1, 9, 5),
        pos = geo.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        const y = pos.getY(j) + 0.5;
        pos.setX(j, pos.getX(j) + 0.09 * Math.sin(y * 7 + k) * y);
      }
      geo.computeVertexNormals();
      layers.push(
        mesh(
          body,
          geo,
          unlit(k === 0 ? 'orange' : k === 1 ? 'fire' : 'hot'),
          k * 0.025,
          0,
          k * 0.025,
        ),
      );
    }
    const pool = mesh(
      root,
      new THREE.PlaneGeometry(4, 4),
      new THREE.MeshBasicMaterial({
        color: colors.orange,
        map: softTexture(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
      x,
      0.035,
      z,
    );
    pool.rotation.x = -PI / 2;
    pool.castShadow = false;
    return { body, layers, pool };
  });
  const sparks = Array.from({ length: 72 }, (_, i) => {
    const o = box(root, 0.022, 0.06, 0.022, unlit(i % 2 ? 'gold' : 'hot'));
    o.castShadow = false;
    return o;
  });
  function sprite(color) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: softTexture(),
        color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    root.add(s);
    return s;
  }
  const dust = Array.from({ length: 88 }, () => sprite('#997340')),
    smoke = Array.from({ length: 44 }, () => sprite('#70736c')),
    spray = Array.from({ length: 32 }, () => sprite('#c8d7cd'));
  const glow = new THREE.PointLight(colors.orange, 0, 25, 1.5);
  glow.position.set(1, 3, 1);
  scene.add(glow);
  for (const z of [-0.8, 3.4]) {
    const light = new THREE.SpotLight(colors.orange, 18, 10, 0.5, 0.7, 1.3);
    light.position.set(-9.5, 4.5, z);
    light.target.position.set(-8, 0.1, z + 0.5);
    scene.add(light, light.target);
    const pool = mesh(
      root,
      new THREE.PlaneGeometry(3, 2.8),
      new THREE.MeshBasicMaterial({
        map: softTexture(),
        color: colors.orange,
        transparent: true,
        opacity: 0.17,
        depthWrite: false,
      }),
      -8,
      0.035,
      z,
    );
    pool.rotation.x = -PI / 2;
    pool.castShadow = false;
  }
  const bulbs = [];
  for (let i = 0; i < 34; i++) {
    const b = sphere(
      root,
      0.035,
      unlit(i % 3 ? 'gold' : 'red'),
      -7 + i * 0.53,
      1.65 + Math.sin(i * 0.2) * 0.18,
      -4.63,
    );
    b.castShadow = false;
    bulbs.push(b);
  }
  const washes = [];
  for (let i = 0; i < 4; i++) {
    const w = mesh(
      root,
      new THREE.PlaneGeometry(3.2, 3.5),
      new THREE.MeshBasicMaterial({
        map: softTexture(),
        color: i % 2 ? '#6a357c' : '#295477',
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
      -5 + i * 4.6,
      2.4,
      -6.95,
    );
    w.castShadow = false;
    washes.push(w);
  }
  function update(t) {
    const finale = bell(t, 27.4, 32.8, 0.3);
    glow.intensity = finale * 35;
    fires.forEach((f, i) => {
      const k = i === 6 ? bell(t, 21.7, 24.05, 0.25) : finale,
        h =
          (i === 6 ? 1.1 : 2.8 + 0.55 * hash(i)) *
          (0.9 +
            0.12 * Math.sin(t * 17 + i) +
            0.08 * Math.sin(t * 29 + i * 2)) *
          k;
      f.body.visible = h > 0.01;
      f.layers.forEach((o, j) => {
        const height = h * (1 - j * 0.17);
        o.scale.set(1, height, 1);
        o.position.set(j * 0.17, 0.12 + height / 2, j * 0.17);
        o.rotation.y = t * (j ? 1 : -1) + i;
      });
      f.pool.material.opacity = k * (i === 6 ? 0.25 : 0.35);
    });
    sparks.forEach((s, i) => {
      const a = (t * 1.8 + hash(i)) % 1,
        p = positions[i % 6];
      s.visible = finale > 0.02;
      s.position.set(
        p[0] + (hash(i + 30) - 0.5) * a * 0.9,
        0.3 + a * 3.1,
        p[1] + (hash(i + 90) - 0.5) * a * 0.9,
      );
      s.scale.setScalar((1 - a) * finale);
    });
    dust.forEach((s, i) => {
      const who = i < 44 ? 0 : 1,
        age = (t * 1.1 + (i % 44) / 44) % 1,
        back = t - age * 1.25,
        st = truckState(back, who);
      const on =
        who === 0
          ? bell(back, 6.2, 8.7, 0.2) + bell(back, 12.3, 16.2, 0.25)
          : bell(back, 25.7, 26.6, 0.15) + bell(back, 27.4, 28.4, 0.2);
      const side = i % 2 ? 1 : -1,
        axle = i % 4 < 2 ? -1.3 : 1.2,
        spread = 1.25 + age * 0.9;
      s.position.set(
        st.x + Math.sin(st.yaw) * axle + Math.cos(st.yaw) * side * spread,
        0.3 + age * 1.2,
        st.z + Math.cos(st.yaw) * axle - Math.sin(st.yaw) * side * spread,
      );
      s.position.x += (hash(i + 9) - 0.5) * age * 1.1;
      s.position.z += (hash(i + 19) - 0.5) * age * 1.1;
      s.scale.setScalar(0.5 + age * 2);
      s.material.opacity = Math.min(1, on) * (1 - age) * 0.65;
      s.visible = s.material.opacity > 0.002;
    });
    smoke.forEach((s, i) => {
      const age = (t * 0.55 + hash(i)) % 1,
        pyro = i >= 20;
      const k = pyro
        ? bell(t, 29, 36, 0.5)
        : bell(t, 6, 8.5, 0.2) + bell(t, 25.3, 27.8, 0.2);
      let p;
      if (pyro) {
        const a = positions[(i - 20) % 6];
        p = V(a[0], 0.3, a[1]);
      } else {
        const tr = t < 10 ? trucks[0] : trucks[1];
        tr.root.updateMatrixWorld(true);
        p = tr.exhaust[i % 2].getWorldPosition(V());
      }
      s.position
        .copy(p)
        .add(V(age * 0.55, age * (pyro ? 3.6 : 1.6), age * 0.1));
      s.scale.setScalar((pyro ? 0.25 : 0.15) + age * (pyro ? 1.3 : 0.8));
      s.material.opacity = Math.min(1, k) * (1 - age) * 0.38;
      s.visible = s.material.opacity > 0.002;
    });
    const spraying = bell(t, 23.2, 25.25, 0.2);
    crew.responder.g.updateMatrixWorld(true);
    const start = crew.nozzle.getWorldPosition(V()),
      target = V(4, 0.35, 1.8);
    spray.forEach((s, i) => {
      const a = (t * 2.8 + i / 32) % 1;
      s.position.copy(start).lerp(target, a);
      s.position.x += (hash(i) - 0.5) * a * 0.45;
      s.position.y += 0.5 * Math.sin(a * PI) + (hash(i + 80) - 0.5) * a * 0.5;
      s.scale.setScalar(0.08 + a * 0.65);
      s.material.opacity = spraying * (1 - a) * 0.85;
      s.visible = s.material.opacity > 0.002;
    });
    bulbs.forEach((b, i) => (b.visible = (Math.floor(t * 5) + i) % 5 !== 0));
    washes.forEach((w, i) => {
      w.material.opacity = 0.08 + 0.08 * (0.5 + 0.5 * Math.sin(t * 0.6 + i));
      w.position.x = -5 + i * 4.6 + 0.5 * Math.sin(t * 0.5 + i);
    });
  }
  return { update, root };
}
