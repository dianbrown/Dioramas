import * as THREE from 'three';
import { PixelPost } from './core/post.js';
import {
  createCamera,
  updateCamera,
  FIT_POINTS,
  CAMERA,
} from './scene/camera.js';
import { createLighting } from '../../shared/scene/lighting.js';

export function run({ title, loop, build, night = false }) {
  const canvas = document.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
  });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  FIT_POINTS.splice(
    0,
    FIT_POINTS.length,
    ...[-8.5, 8.5].flatMap((x) =>
      [-5.5, 5.5].map((z) => new THREE.Vector3(x, 0, z)),
    ),
  );
  CAMERA.fillX = 0.86;
  CAMERA.fillY = 0.88;
  const camera = createCamera();
  const post = new PixelPost(renderer, 900, 0.75);
  const lights = createLighting(renderer, scene);
  if (night) {
    lights.sun.intensity = 2;
    lights.hemi.intensity = 0.65;
    lights.fill.intensity = 0.45;
  }
  const clip = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), 8.5),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 8.5),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), 5.5),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 5.5),
  ];
  const content = build(scene);
  const params = new URLSearchParams(location.search);
  if (params.has('grey'))
    scene.overrideMaterial = new THREE.MeshLambertMaterial({ color: 0xb4b4b4 });
  if (params.has('dither'))
    post.uniforms.uDither.value = Number(params.get('dither'));
  let frozen = params.has('t') ? Number(params.get('t')) : null;
  const start = Number(params.get('from') || 0);
  let origin = performance.now() - start * 1000;
  function draw(t) {
    content.update(((t % loop) + loop) % loop);
    post.render(scene, camera, clip);
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    updateCamera(camera, r.width / r.height);
    post.setSize(r.width, r.height);
    draw(frozen ?? start);
  }
  window.addEventListener('resize', resize);
  resize();
  const debug = {
    THREE,
    scene,
    camera,
    renderer,
    post,
    CLIP: clip,
    entities: content.entities,
    stage: content,
    loop,
    freeze(t) {
      frozen = t;
      draw(t);
    },
    play() {
      origin = performance.now() - (frozen ?? 0) * 1000;
      frozen = null;
    },
    view(pos, target) {
      if (!pos) {
        resize();
        return;
      }
      camera.position.set(...pos);
      camera.lookAt(...target);
      camera.updateProjectionMatrix();
    },
    audit: {
      loop,
      slab: {
        x0: -8.5,
        x1: 8.5,
        z0: -5.5,
        z1: 5.5,
        y0: -2,
        y1: 9,
        margin: 0.3,
      },
      movers: content.movers || [],
      emitters: [],
    },
  };
  window.__diorama = debug;
  window.__dioramaReady = true;
  document.title = title;
  function tick(now) {
    if (frozen === null) draw((now - origin) / 1000);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
