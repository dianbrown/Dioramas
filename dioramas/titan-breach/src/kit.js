import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HEX } from './core/palette.js';
export { T };
export const hash = (n) => {
  let v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
export const mats = HEX.map(
  (c) =>
    new T.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true }),
);
const cube = new T.BoxGeometry(1, 1, 1),
  ball = new T.SphereGeometry(1, 12, 8);
export function group(p, x = 0, y = 0, z = 0) {
  let g = new T.Group();
  g.position.set(x, y, z);
  p.add(g);
  return g;
}
export function mesh(p, g, c, x = 0, y = 0, z = 0, s = [1, 1, 1]) {
  let m = new T.Mesh(g, mats[c]);
  m.position.set(x, y, z);
  m.scale.set(...s);
  m.castShadow = m.receiveShadow = true;
  p.add(m);
  return m;
}
export const box = (p, x, y, z, w, h, d, c) =>
  mesh(p, cube, c, x, y, z, [w, h, d]);
export const ell = (p, x, y, z, w, h, d, c) =>
  mesh(p, ball, c, x, y, z, [w, h, d]);
export function beam(p, a, b, r, c, r2 = r) {
  let v = new T.Vector3(...b).sub(new T.Vector3(...a));
  let m = mesh(p, new T.CylinderGeometry(r2, r, v.length(), 7), c, ...a);
  m.position.addScaledVector(v, 0.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize());
  return m;
}
export function tube(p, points, r, c) {
  return mesh(
    p,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map((a) => new T.Vector3(...a))),
      Math.max(10, points.length * 5),
      r,
      5,
      false,
    ),
    c,
  );
}
export function batch(root) {
  root.traverse((g) => {
    let sets = new Map();
    for (let m of [...g.children])
      if (m.isMesh && !m.userData.live) {
        let key = m.material.uuid;
        if (!sets.has(key)) sets.set(key, []);
        sets.get(key).push(m);
      }
    for (let arr of sets.values())
      if (arr.length > 1) {
        let geo = arr.map((m) => {
          m.updateMatrix();
          return m.geometry.clone().applyMatrix4(m.matrix);
        });
        let merged = mergeGeometries(geo, false);
        if (merged) {
          let m = new T.Mesh(merged, arr[0].material);
          m.castShadow = m.receiveShadow = true;
          g.add(m);
          arr.forEach((m) => g.remove(m));
        }
        geo.forEach((g) => g.dispose());
      }
  });
}
export function wings(p, x, y, z, s = 1) {
  let g = group(p, x, y, z);
  for (let side of [-1, 1]) {
    beam(g, [0, -0.45 * s, 0], [side * 0.38 * s, 0.55 * s, 0], 0.035 * s, 55);
    for (let i = 0; i < 6; i++) {
      let m = box(
        g,
        side * (0.14 + i * 0.025) * s,
        (0.38 - i * 0.14) * s,
        0.025,
        0.35 * s,
        0.075 * s,
        0.035 * s,
        side < 0 ? 62 : 55,
      );
      m.rotation.z = side * 0.55;
    }
  }
  return g;
}
