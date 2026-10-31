import * as THREE from 'three';
import { PixelPost } from './core/post.js';
import {
  createCamera,
  updateCamera,
  CAMERA,
  FIT_POINTS,
} from '../../shared/scene/camera.js';
import { createLighting } from '../../shared/scene/lighting.js';
import { LOOP } from './timeline.js';

export function run(build) {
  const canvas = document.querySelector('canvas'),
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
    });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  FIT_POINTS.splice(
    0,
    FIT_POINTS.length,
    ...[-12, 12].flatMap((x) => [-8, 8].map((z) => new THREE.Vector3(x, 0, z))),
    new THREE.Vector3(-7.6, 8, -6.9),
    new THREE.Vector3(-10.5, 5.5, 6),
    new THREE.Vector3(10.5, 5, -7),
  );
  CAMERA.target.set(0.15, 1.9, -0.15);
  CAMERA.fillX = 0.9;
  CAMERA.fillY = 0.9;
  CAMERA.subjectScale = 0.82;
  const camera = createCamera(),
    post = new PixelPost(renderer, 2400, 1.25);
  const lights = createLighting(renderer, scene);
  lights.sun.position.set(12, 22, -8);
  lights.sun.intensity = 3.1;
  lights.hemi.intensity = 0.24;
  lights.fill.intensity = 0.46;
  scene.environmentIntensity = 0.12;
  lights.sun.shadow.camera.left = -18;
  lights.sun.shadow.camera.right = 18;
  lights.sun.shadow.camera.top = 18;
  lights.sun.shadow.camera.bottom = -18;
  lights.sun.shadow.camera.updateProjectionMatrix();
  const clip = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), 12.04),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 12.04),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), 8.04),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 8.04),
  ];
  const stage = build(scene, camera, lights);
  const params = new URLSearchParams(location.search);
  let frozen = params.has('t') ? Number(params.get('t')) : null;
  let origin = performance.now() - Number(params.get('from') || 0) * 1000;
  if (params.has('grey'))
    scene.overrideMaterial = new THREE.MeshLambertMaterial({ color: 0xb4b4b4 });
  function draw(t) {
    stage.update(((t % LOOP) + LOOP) % LOOP);
    post.render(scene, camera, clip);
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    updateCamera(camera, r.width / r.height);
    post.setSize(r.width, r.height);
    draw(frozen ?? 0);
  }
  resize();
  window.addEventListener('resize', resize);
  window.__diorama = {
    THREE,
    scene,
    camera,
    renderer,
    post,
    CLIP: clip,
    stage,
    loop: LOOP,
    entities: stage.entities,
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
      loop: LOOP,
      slab: { x0: -12, x1: 12, z0: -8, z1: 8, y0: -1, y1: 10, margin: 0.3 },
      movers: stage.movers,
      emitters: [],
    },
  };
  window.__dioramaReady = true;
  function tick(now) {
    if (frozen === null) draw((now - origin) / 1000);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
