import { T } from './kit.js';
const CYCLE = 11.5;
const smooth = (x) => {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
};
const V = (a) => new T.Vector3(...a);
const routes = [
  [
    [-5.1, 4.4, 0],
    [-5.8, 7.5, -1.5],
    [-6.8, 11.2, -3.2],
    [-2.5, 12.1, -2.8],
    [0.2, 8.2, -1.5],
    [-2.5, 5.4, 0.3],
    [-5.1, 4.4, 0],
  ],
  [
    [8.8, 3.85, 3.6],
    [10.3, 7.2, 1],
    [9.6, 11.6, -2.5],
    [6.9, 12.3, -2.9],
    [4.8, 10.4, -1.5],
    [7.4, 6, 2.5],
    [8.8, 3.85, 3.6],
  ],
  [
    [-9, 4.25, 3.15],
    [-9.9, 7.1, 0.7],
    [-8.9, 10.5, -2.1],
    [-5.4, 10.1, -2],
    [-3.9, 7.9, 1],
    [-7.3, 5.7, 3.9],
    [-9, 4.25, 3.15],
  ],
  [
    [-0.8, 4.35, 6.2],
    [1.6, 7.1, 4.3],
    [3.1, 10.2, 0.1],
    [0.8, 11.2, -2.4],
    [-2.1, 9, -1],
    [-3.4, 6, 3.7],
    [-0.8, 4.35, 6.2],
  ],
  null,
  [
    [-8.9, 4.15, -0.8],
    [-10.2, 7.5, -2.4],
    [-9.3, 10.4, -3.1],
    [-6.4, 11.6, -3],
    [-4.3, 8.4, -2],
    [-6.3, 5.9, -0.5],
    [-8.9, 4.15, -0.8],
  ],
];
const anchors = [
  [-6.7, 9.1, -3.8],
  [8.8, 8.2, -3.8],
  [-11.55, 9.1, -3.8],
  [2.3, 9.1, -3.8],
  null,
  [-6.7, 9.1, -3.8],
];
export function choreography(scene, scouts) {
  const paths = routes.map((r) =>
    r ? new T.CatmullRomCurve3(r.map(V), false, 'centripetal') : null,
  );
  const trails = scouts.map(() => {
    const g = new T.BufferGeometry();
    g.setAttribute(
      'position',
      new T.Float32BufferAttribute(new Float32Array(60), 3),
    );
    const m = new T.Line(
      g,
      new T.LineBasicMaterial({
        color: 0xc6d4d1,
        transparent: true,
        opacity: 0.7,
      }),
    );
    scene.add(m);
    return m;
  });
  function clock(t, i) {
    return (((t + i * 1.83) % CYCLE) + CYCLE) % CYCLE;
  }
  function state(t, i) {
    let q = clock(t, i),
      fly = q >= 0.85 && q < 6.25,
      u = smooth((q - 0.85) / 5.4),
      p = paths[i]?.getPoint(u);
    return { q, u, p, fly };
  }
  return function update(t) {
    for (let [i, s] of scouts.entries()) {
      let q = clock(t, i),
        flight = false,
        speed = 0,
        bank = 0,
        slash = 0,
        crouch = 0;
      if (i === 4) {
        // Ground runner: distance-driven stride and a planted braking/turn beat.
        let out = q < 5.75,
          r = out ? q : q - 5.75,
          u = smooth(Math.min(1, r / 4.8)),
          x = -2.2 + 4.4 * (out ? u : 1 - u);
        s.root.position.set(x, 0.15, 2.2);
        let dir = out ? 1 : -1;
        s.root.rotation.set(
          0,
          (dir * Math.PI) / 2 + Math.PI * smooth((r - 4.8) / 0.95),
          0,
        );
        speed = r < 4.8 ? (4.4 * 6 * (r / 4.8) * (1 - r / 4.8)) / 4.8 : 0;
        let phase = (out ? x + 2.2 : 6.6 - x) * 8;
        s.body.rotation.set(speed * 0.18, 0, 0);
        for (let j = 0; j < 2; j++) {
          let swing = Math.sin(phase + j * Math.PI),
            move = speed > 0.1;
          s.legs[j].hip.rotation.set(move ? swing * 0.65 : 0, 0, 0);
          s.legs[j].knee.rotation.x = move
            ? 0.12 + 0.85 * Math.max(0, -swing)
            : 0.08;
          s.arms[j].arm.rotation.set(
            move ? -swing * 0.7 : -0.2,
            0,
            (j ? 1 : -1) * 0.12,
          );
          s.arms[j].elbow.rotation.x = -1.05;
        }
        s.root.position.y +=
          speed > 0.1 ? Math.abs(Math.sin(phase)) * 0.045 : 0;
      } else {
        let st = state(t, i);
        q = st.q;
        flight = st.fly;
        s.root.position.copy(st.p);
        let tangent = paths[i].getTangent(
          Math.min(0.999, Math.max(0.001, st.u)),
        );
        let yaw = Math.atan2(tangent.x, tangent.z);
        if (q > 6.85) {
          let v = paths[i].getTangent(0.001),
            target = Math.atan2(v.x, v.z),
            delta = Math.atan2(Math.sin(target - yaw), Math.cos(target - yaw));
          yaw += delta * smooth((q - 6.85) / 1.3);
        }
        let next = paths[i].getTangent(Math.min(0.999, st.u + 0.025));
        bank =
          T.MathUtils.clamp(
            tangent.x * next.z - tangent.z * next.x,
            -0.16,
            0.16,
          ) * 5;
        // Horizontal spine during fast travel; extend to upright for a planted landing.
        let air = smooth((q - 0.85) / 0.32) * (1 - smooth((q - 5.75) / 0.5));
        let pitch = Math.atan2(tangent.y, Math.hypot(tangent.x, tangent.z));
        s.root.rotation.set(0, yaw, 0);
        s.body.rotation.set(air * (0.95 - pitch * 0.55), 0, bank * air);
        crouch =
          q < 0.85
            ? Math.sin((q / 0.85) * Math.PI) * 0.95
            : q > 6.25 && q < 6.85
              ? Math.sin(((q - 6.25) / 0.6) * Math.PI) * 0.9
              : 0;
        s.root.position.y -= crouch * 0.26;
        s.body.rotation.x += crouch * 0.35;
        slash = Math.sin(Math.PI * smooth((q - 2.75) / 0.65));
        if (q > 3.4) slash = 0;
        for (let j = 0; j < 2; j++) {
          let side = j ? 1 : -1;
          s.legs[j].hip.rotation.set(
            air * (-0.75 + (j ? 0.28 : -0.2)) + crouch * -0.9,
            0,
            side * (0.08 + air * 0.2),
          );
          s.legs[j].knee.rotation.x =
            0.12 + air * (j ? 0.9 : 1.45) + crouch * 1.2;
          s.arms[j].arm.rotation.set(
            -0.25 - air * 0.8 + slash * (j ? 1.8 : -1.4),
            side * slash * 0.6,
            side * (0.12 + air * 0.45 + slash * 0.8),
          );
          s.arms[j].elbow.rotation.x = -0.2 - air * 0.65 - slash * 0.6;
        }
        // Cables exist only after the hook fires and release before the dive. Anchor is masonry.
        let hooked = q > 1.35 && q < 3.55;
        s.cable.visible = hooked;
        s.root.updateMatrixWorld(true);
        let from = s.body.getWorldPosition(new T.Vector3()),
          to = V(anchors[i]),
          arr = s.cable.geometry.attributes.position;
        arr.setXYZ(0, from.x, from.y, from.z);
        arr.setXYZ(1, to.x, to.y, to.z);
        arr.needsUpdate = true;
        s.cable.geometry.computeBoundingSphere();
        let trail = trails[i];
        trail.visible = flight && q < 5.9;
        let a = trail.geometry.attributes.position;
        for (let k = 0; k < 20; k++) {
          let p = state(t - k * 0.012, i).p;
          p.y += 0.7;
          a.setXYZ(k, p.x, p.y, p.z);
        }
        a.needsUpdate = true;
        trail.geometry.computeBoundingSphere();
        speed = flight ? paths[i].getLength() / 5.4 : 0;
      }
      if (i === 4) {
        s.cable.visible = false;
        trails[i].visible = false;
      }
      s.cape.rotation.set(
        0.12 +
          (flight ? 0.85 : 0) +
          Math.sin(t * 18 + i) * (0.03 + speed * 0.008),
        0,
        Math.sin(t * 15 + i) * (0.03 + speed * 0.005),
      );
      s.root.userData.motion = { phase: q, flight, speed, slash, crouch };
    }
  };
}
