import * as THREE from 'three';
import { C } from './core/palette.js';
import { roundedBoxGeometry } from './core/geometry.js';
import { buildPerson as clothed, setPose } from './scene/person.js';
import { buildPerson as swimsuit } from './scene/swimmer.js';
import { STAND, SEATED, walkPose, runPose, mixPose } from './scene/poses.js';
import { clamp, lerp, smooth, win, bell, hash } from './config.js';
export {
  THREE,
  C,
  STAND,
  SEATED,
  walkPose,
  runPose,
  mixPose,
  setPose,
  clamp,
  lerp,
  smooth,
  win,
  bell,
  hash,
};
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const M = Object.fromEntries(
  Object.entries(C).map(([k, c]) => [
    k,
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }),
  ]),
);
M.skinTones = [M.skinLight, M.skin, M.skinDark];
M.hairColors = [M.hair];
export function group(parent, name, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
export function mesh(p, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  p.add(m);
  return m;
}
export function box(p, w, h, d, mat, x = 0, y = 0, z = 0, round = 0.025) {
  return mesh(
    p,
    round
      ? roundedBoxGeometry(w, h, d, Math.min(round, w / 4, h / 4, d / 4), 1)
      : new THREE.BoxGeometry(w, h, d),
    mat,
    x,
    y,
    z,
  );
}
export function cyl(p, r, h, mat, x = 0, y = 0, z = 0, r2 = r, n = 12) {
  return mesh(p, new THREE.CylinderGeometry(r, r2, h, n), mat, x, y, z);
}
export function ball(p, r, mat, x = 0, y = 0, z = 0) {
  return mesh(p, new THREE.SphereGeometry(r, 10, 8), mat, x, y, z);
}
export function bar(p, a, b, r, mat) {
  const v = b.clone().sub(a);
  const m = mesh(
    p,
    new THREE.CylinderGeometry(r, r, v.length(), 8),
    mat,
    ...a.clone().add(b).multiplyScalar(0.5).toArray(),
  );
  m.quaternion.setFromUnitVectors(V(0, 1, 0), v.normalize());
  return m;
}
export function ring(p, r, t, mat, x = 0, y = 0, z = 0) {
  const m = mesh(p, new THREE.TorusGeometry(r, t, 6, 32), mat, x, y, z);
  m.rotation.x = -Math.PI / 2;
  return m;
}
let shadowMap;
export function shadow(p, x, z, w, d, opacity = 0.22, y = 0.012) {
  if (!shadowMap) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(20,25,30,.9)');
    g.addColorStop(1, 'rgba(20,25,30,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    shadowMap = new THREE.CanvasTexture(c);
  }
  const m = mesh(
    p,
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({
      map: shadowMap,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
    x,
    y,
    z,
  );
  m.rotation.x = -Math.PI / 2;
  m.castShadow = false;
  return m;
}
export function label(
  p,
  text,
  w,
  h,
  x,
  y,
  z,
  { bg = C.ink, fg = C.cream, size = 64 } = {},
) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = fg;
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 67, 480);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  return mesh(
    p,
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex }),
    x,
    y,
    z,
  );
}
export function person(
  p,
  name,
  {
    swim = false,
    top = M.navy,
    bottom = M.slate,
    skin = M.skin,
    cap = null,
  } = {},
) {
  const mats = {
    skinTones: M.skinTones,
    hair: [M.hair],
    suits: { coral: M.coral, navy: M.navy },
    skin,
    eye: M.ink,
    mouth: M.darkRed,
    goggle: M.sky,
    goggleStrap: M.ink,
    leather: M.leather,
    chrome: M.chrome,
    bone: M.cream,
    cloth: { navy: M.navy, charcoal: M.ink },
  };
  const model = swim
    ? swimsuit(mats, {
        skin,
        suit: top,
        suitStyle: 'trunks',
        cap,
        goggles: !!cap,
      })
    : clothed(mats, {
        skin,
        top,
        bottom,
        shoe: M.ink,
        sleeve: 'long',
        topStyle: 'jacket',
        hat: cap ? 'cap' : undefined,
        hatMat: cap,
      });
  model.group.name = name;
  p.add(model.group);
  const s = shadow(p, 0, 0, 0.85, 0.7, 0.32);
  return { ...model, shadow: s };
}
export function place(a, x, y, z, yaw = 0, pose = STAND) {
  a.group.position.set(x, y, z);
  a.group.rotation.set(0, yaw, 0);
  a.group.scale.setScalar(1);
  setPose(a, pose);
  a.shadow.position.set(x, 0.015, z);
  a.shadow.visible = a.group.visible && Math.abs(y) < 0.3;
}
export function path(points, u) {
  const k = clamp(u) * (points.length - 1),
    i = Math.min(points.length - 2, Math.floor(k));
  return V(...points[i]).lerp(V(...points[i + 1]), k - i);
}
export function bench(p, x, z, mat = M.wood) {
  const g = group(p, 'bench', x, 0, z);
  for (const a of [-0.75, 0.75])
    for (const b of [-0.23, 0.23]) box(g, 0.09, 0.5, 0.09, M.metal, a, 0.25, b);
  for (let i = 0; i < 4; i++)
    box(g, 1.9, 0.08, 0.12, mat, 0, 0.52, -0.21 + i * 0.14);
  for (let i = 0; i < 3; i++)
    box(g, 1.9, 0.12, 0.08, mat, 0, 0.78 + i * 0.16, -0.28);
  shadow(g, 0, 0, 2.2, 1);
  return g;
}
export function bin(p, x, z) {
  const g = group(p, 'bin', x, 0, z);
  cyl(g, 0.26, 0.72, M.green, 0, 0.36, 0);
  cyl(g, 0.29, 0.08, M.darkLeaf, 0, 0.76, 0);
  box(g, 0.32, 0.13, 0.02, M.ink, 0, 0.64, 0.26);
  shadow(g, 0, 0, 0.8, 0.8);
  return g;
}
export function lamp(p, x, z) {
  const g = group(p, 'street-lamp', x, 0, z);
  cyl(g, 0.14, 0.2, M.slate, 0, 0.1, 0);
  cyl(g, 0.055, 3.8, M.slate, 0, 1.9, 0);
  bar(g, V(0, 3.8, 0), V(0, 3.8, 0.55), 0.045, M.slate);
  box(g, 0.4, 0.09, 0.6, M.ink, 0, 3.8, 0.55);
  box(g, 0.32, 0.03, 0.45, M.warm, 0, 3.73, 0.55);
  return g;
}
export function wheel(p, x, y, z, r = 0.4, width = 0.24) {
  const g = group(p, 'wheel', x, y, z);
  const tire = cyl(g, r, width, M.ink, 0, 0, 0, r, 16);
  tire.rotation.z = Math.PI / 2;
  const hub = cyl(g, r * 0.54, width + 0.025, M.metal, 0, 0, 0, r * 0.54, 12);
  hub.rotation.z = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const lug = box(
      g,
      width + 0.04,
      0.07,
      r * 0.5,
      M.slate,
      0,
      Math.sin(a) * r * 0.68,
      Math.cos(a) * r * 0.68,
    );
    lug.rotation.x = -a;
  }
  return g;
}

export function car(p, name, paint = M.cream, police = false) {
  const root = group(p, name),
    body = group(root, 'body');
  const wheels = [];
  box(body, 1.65, 0.16, 4.1, M.ink, 0, 0.35, 0);
  box(body, 1.82, 0.38, 0.95, paint, 0, 0.67, 1.48);
  box(body, 1.82, 0.4, 0.7, paint, 0, 0.67, -1.62);
  box(body, 1.8, 0.06, 0.9, M.chrome, 0, 0.89, 1.48);
  box(body, 1.8, 0.06, 0.7, paint, 0, 0.9, -1.6);
  box(body, 1.88, 0.14, 0.1, M.chrome, 0, 0.45, 2.06);
  box(body, 1.88, 0.14, 0.1, M.chrome, 0, 0.45, -2.04);
  box(body, 1.0, 0.17, 0.03, M.ink, 0, 0.69, 1.97);
  for (let i = 0; i < 6; i++)
    box(body, 0.025, 0.13, 0.04, M.metal, -0.4 + i * 0.16, 0.69, 2);
  for (const x of [-0.65, 0.65]) {
    box(body, 0.32, 0.15, 0.05, M.warm, x, 0.73, 1.98);
    box(body, 0.26, 0.12, 0.05, M.red, x, 0.73, -2.01);
  }
  box(body, 1.54, 0.09, 1.8, police ? M.ink : paint, 0, 1.48, -0.05);
  for (const x of [-0.77, 0.77])
    for (const z of [-0.93, 0.84])
      bar(body, V(x, 0.85, z), V(x * 0.88, 1.45, z * 0.78), 0.045, paint);
  const glass = new THREE.MeshStandardMaterial({
    color: C.sky,
    transparent: true,
    opacity: 0.38,
    roughness: 0.2,
  });
  const wind = box(body, 1.42, 0.53, 0.025, glass, 0, 1.16, 0.78);
  wind.rotation.x = -0.25;
  const rear = box(body, 1.42, 0.51, 0.025, glass, 0, 1.15, -0.88);
  rear.rotation.x = 0.25;
  box(body, 1.45, 0.13, 0.23, M.ink, 0, 0.95, 0.65);
  const doors = [];
  for (const side of [-1, 1]) {
    for (const z of [0.32, -0.6]) {
      box(body, 0.48, 0.12, 0.48, M.navy, side * 0.4, 0.53, z);
      box(body, 0.48, 0.48, 0.12, M.navy, side * 0.4, 0.79, z - 0.2);
    }
    const door = group(body, 'door', side * 0.88, 0.65, 0.95);
    box(door, 0.07, 0.52, 1.74, paint, 0, 0, -0.87);
    box(door, 0.1, 0.04, 1.74, M.chrome, 0, 0.28, -0.87);
    box(door, 0.1, 0.05, 0.18, M.chrome, side * 0.05, 0.13, -1.47);
    if (police) box(door, 0.085, 0.24, 0.75, M.navy, side * 0.005, 0, -0.8);
    doors.push(door);
    for (const z of [-1.35, 1.3])
      wheels.push(wheel(root, side * 0.87, 0.39, z));
  }
  let sirens = [];
  if (police) {
    box(body, 1.15, 0.08, 0.32, M.slate, 0, 1.58, -0.05);
    sirens = [
      box(
        body,
        0.42,
        0.14,
        0.28,
        new THREE.MeshBasicMaterial({ color: C.red }),
        -0.3,
        1.69,
        -0.05,
      ),
      box(
        body,
        0.42,
        0.14,
        0.28,
        new THREE.MeshBasicMaterial({ color: C.blue }),
        0.3,
        1.69,
        -0.05,
      ),
    ];
  }
  shadow(root, 0, 0, 2.4, 4.8, 0.35);
  return {
    root,
    body,
    doors,
    wheels,
    sirens,
    update(x, z, yaw, t, open = 0) {
      root.position.set(x, 0, z);
      root.rotation.y = yaw;
      for (let i = 0; i < 2; i++)
        doors[i].rotation.y = (i ? -1 : 1) * open * 1.35;
      wheels.forEach((w) => (w.rotation.x = x / 0.4));
      sirens.forEach((s, i) => (s.visible = Math.floor(t * 7 + i) % 2 === 0));
    },
  };
}
