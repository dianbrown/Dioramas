import * as THREE from 'three';
import { roundedBoxGeometry } from '../../shared/core/geometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export { THREE };
export const PI = Math.PI,
  TAU = PI * 2,
  V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, u) => a + (b - a) * u;
export const smooth = (u) => {
  u = clamp(u);
  return u * u * (3 - 2 * u);
};
export const win = (t, a, b) => smooth((t - a) / (b - a));
export const bell = (t, a, b, r = 0.5) =>
  win(t, a, a + r) * (1 - win(t, b - r, b));
export const hash = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const colors = {
  soil: '#552b1c',
  soilDark: '#32231b',
  mud: '#64442d',
  sand: '#92724b',
  wood: '#70472d',
  woodLight: '#98613b',
  beam: '#49301f',
  black: '#181b1b',
  tire: '#262522',
  tread: '#39352b',
  rubber: '#161a19',
  hub: '#615c4d',
  metal: '#526274',
  steel: '#86949c',
  chrome: '#c0c1a5',
  cream: '#e7d1a4',
  white: '#f4eed7',
  gold: '#eec127',
  yellow: '#cd9420',
  red: '#a71f20',
  redLight: '#cf3030',
  redDark: '#5d171b',
  blue: '#2c3b55',
  wall: '#30384a',
  purple: '#4a304c',
  teal: '#237b6c',
  green: '#417151',
  skin: '#b58c62',
  skinLight: '#d3ad79',
  skinDark: '#6f5139',
  orange: '#e57717',
  fire: '#ffa615',
  hot: '#ffe97a',
  smoke: '#73766f',
};
export const M = Object.fromEntries(
  Object.entries(colors).map(([k, c]) => [
    k,
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.87 }),
  ]),
);
export const unlit = (c) =>
  new THREE.MeshBasicMaterial({ color: colors[c] || c, toneMapped: false });
export function group(p, name, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, z);
  p.add(g);
  return g;
}
export function mesh(p, geo, mat, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  p.add(o);
  return o;
}
export function box(p, w, h, d, mat, x = 0, y = 0, z = 0, r = 0) {
  return mesh(
    p,
    r
      ? roundedBoxGeometry(w, h, d, Math.min(r, w / 4, h / 4, d / 4), 1)
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
export function sphere(p, r, mat, x = 0, y = 0, z = 0, s = [1, 1, 1]) {
  const o = mesh(p, new THREE.SphereGeometry(r, 10, 8), mat, x, y, z);
  o.scale.set(...s);
  return o;
}
export function bar(p, a, b, r, mat) {
  const v = b.clone().sub(a);
  const o = cyl(
    p,
    r,
    v.length(),
    mat,
    ...a.clone().add(b).multiplyScalar(0.5).toArray(),
    r,
    6,
  );
  o.quaternion.setFromUnitVectors(V(0, 1, 0), v.normalize());
  return o;
}
export function torus(p, r, t, mat, x = 0, y = 0, z = 0) {
  return mesh(p, new THREE.TorusGeometry(r, t, 6, 32), mat, x, y, z);
}
export function text(
  p,
  lines,
  w,
  h,
  x,
  y,
  z,
  {
    bg = colors.black,
    fg = colors.white,
    border = colors.gold,
    font = 50,
  } = {},
) {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = Math.max(128, Math.round((768 * h) / w));
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, c.width - 20, c.height - 20);
    ctx.lineWidth = 2;
    ctx.strokeRect(19, 19, c.width - 38, c.height - 38);
  }
  const a = Array.isArray(lines) ? lines : [lines];
  a.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? fg : colors.gold;
    ctx.font = `900 ${i === 0 ? font : font * 0.46}px Arial Black, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      line,
      384,
      c.height * (a.length === 1 ? 0.5 : i === 0 ? 0.43 : 0.73),
      710,
    );
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  const o = mesh(
    p,
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
    x,
    y,
    z,
  );
  o.castShadow = false;
  return o;
}
let soft;
export function softTexture() {
  if (!soft) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d'),
      g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    soft = new THREE.CanvasTexture(c);
  }
  return soft;
}
export function shadow(p, x, z, w, d, opacity = 0.3) {
  const o = mesh(
    p,
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({
      color: colors.black,
      map: softTexture(),
      transparent: true,
      opacity,
      depthWrite: false,
    }),
    x,
    0.018,
    z,
  );
  o.rotation.x = -PI / 2;
  o.castShadow = false;
  return o;
}
export function crate(p, x, z, w = 0.65) {
  const g = group(p, 'crate', x, 0, z);
  box(g, w, w * 0.7, w, M.sand, 0, w * 0.35, 0);
  for (const xx of [-w * 0.4, w * 0.4])
    box(g, 0.06, w * 0.73, w + 0.02, M.woodLight, xx, w * 0.35, 0);
  for (let i = 0; i < 3; i++)
    box(g, w, 0.015, 0.04, M.wood, 0, w * 0.71, -w * 0.33 + i * w * 0.33);
  return g;
}
export function cone(p, x, z) {
  const g = group(p, 'traffic-cone', x, 0, z);
  box(g, 0.35, 0.05, 0.35, M.gold, 0, 0.025, 0);
  cyl(g, 0.025, 0.48, M.orange, 0, 0.29, 0, 0.14, 8);
  cyl(g, 0.075, 0.07, M.cream, 0, 0.3, 0, 0.095, 8);
  return g;
}
export function barrel(p, x, z, mat = M.blue) {
  const g = group(p, 'drum', x, 0, z);
  cyl(g, 0.26, 0.64, mat, 0, 0.32, 0);
  for (const y of [0.1, 0.5]) {
    const r = torus(g, 0.265, 0.018, M.metal, 0, y, 0);
    r.rotation.x = PI / 2;
  }
  return g;
}
// Merge only static leaf meshes. Named/animated groups remain independently posed.
export function mergeStatic(root) {
  for (const child of [...root.children]) if (child.isGroup) mergeStatic(child);
  const batches = new Map();
  for (const child of root.children) {
    if (
      !child.isMesh ||
      child.isInstancedMesh ||
      child.userData.noMerge ||
      Array.isArray(child.material)
    )
      continue;
    const key =
      child.material.uuid +
      '|' +
      Object.keys(child.geometry.attributes).sort().join(',') +
      '|' +
      child.castShadow +
      '|' +
      child.receiveShadow;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(child);
  }
  for (const meshes of batches.values()) {
    if (meshes.length < 2) continue;
    const copies = meshes.map((m) => {
      m.updateMatrix();
      const g = m.geometry.clone();
      g.applyMatrix4(m.matrix);
      return g.index ? g.toNonIndexed() : g;
    });
    const geo = mergeGeometries(copies);
    copies.forEach((g) => g.dispose());
    if (!geo) continue;
    const merged = new THREE.Mesh(geo, meshes[0].material);
    merged.name = 'static-batch';
    merged.castShadow = meshes[0].castShadow;
    merged.receiveShadow = meshes[0].receiveShadow;
    meshes.forEach((m) => root.remove(m));
    root.add(merged);
  }
}
