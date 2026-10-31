import { T, mats, batch } from './kit.js';
import { town } from './town.js';
import { titan, scout } from './actors.js';
import { stage, LOOP } from './stage.js';
import { PixelPost } from './core/post.js';
import { CAMERA, createCamera, updateCamera } from './core/camera.js';
const renderer = new T.WebGLRenderer({
  canvas: document.querySelector('#stage'),
  antialias: false,
  alpha: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFShadowMap;
renderer.outputColorSpace = T.LinearSRGBColorSpace;
const scene = new T.Scene();
CAMERA.target.set(0, 5, 0);
CAMERA.fillX = 0.91;
CAMERA.fillY = 0.91;
const fit = [];
for (let x of [-12, 12])
  for (let z of [-9, 9])
    for (let y of [-0.6, 0]) fit.push(new T.Vector3(x, y, z));
for (let x of [-1.3, 3.8]) fit.push(new T.Vector3(x, 17.5, -6));
const camera = createCamera(innerWidth / innerHeight, fit),
  post = new PixelPost(renderer, 1600, 1);
post.uniforms.uDither.value = 0.3;
scene.add(new T.HemisphereLight(0xfff3dd, 0x88939b, 1.1));
const sun = new T.DirectionalLight(0xffedd0, 3.3);
sun.position.set(-8, 24, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {
  left: -19,
  right: 19,
  top: 22,
  bottom: -18,
  near: 1,
  far: 70,
});
sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias = -0.00025;
sun.shadow.normalBias = 0.03;
scene.add(sun);
const fill = new T.DirectionalLight(0xa9bdcf, 0.7);
fill.position.set(10, 14, -10);
scene.add(fill);
const set = town(scene),
  boss = titan(scene),
  cast = Array.from({ length: 6 }, (_, i) => scout(scene, i));
batch(set.root);
batch(boss.root);
cast.forEach((s) => batch(s.root));
const director = stage(scene, boss, set, cast);
const q = new URLSearchParams(location.search);
let frozen = q.has('t') ? Number(q.get('t')) : null,
  start = performance.now(),
  offset = Number(q.get('from') || 0);
if (q.has('grey')) {
  scene.overrideMaterial = new T.MeshStandardMaterial({
    color: 0xb0b0b0,
    roughness: 1,
  });
}
function draw(t) {
  director.update(t);
  scene.updateMatrixWorld(true);
  post.render(scene, camera);
}
function resize() {
  post.setSize(innerWidth, innerHeight);
  updateCamera(camera, innerWidth / innerHeight, fit);
  draw(frozen ?? offset);
}
addEventListener('resize', resize);
resize();
window.__diorama = {
  THREE: T,
  scene,
  camera,
  renderer,
  post,
  loop: LOOP,
  cast,
  boss,
  stage: director,
  entities: {
    titan: boss.root,
    ...Object.fromEntries(cast.map((s, i) => ['scout' + i, s.root])),
  },
  freeze(t) {
    frozen = t;
    draw(t);
  },
  play() {
    offset = frozen ?? 0;
    frozen = null;
    start = performance.now();
  },
};
window.__dioramaReady = true;
function frame() {
  requestAnimationFrame(frame);
  if (frozen === null) draw((performance.now() - start) / 1000 + offset);
}
frame();
