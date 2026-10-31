import * as THREE from 'three';
import { PixelPost } from './core/post.js';
import { createMaterials } from './core/materials.js';
import { createCamera, updateCamera, CAMERA } from './scene/camera.js';
import { createLighting } from './scene/lighting.js';
import { buildSet } from './scene/set.js';
import { buildBarn } from './scene/barn.js';
import { buildWindmill } from './scene/windmill.js';
import { buildUfo } from './scene/ufo.js';
import { loadCowSource, buildCow } from './scene/cows.js';
import { buildFarmer } from './scene/farmer.js';
import { createStage, TL } from './scene/stage.js';
import { LOOP, SLAB } from './config.js';

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.localClippingEnabled = false;

const scene = new THREE.Scene();
scene.background = null;
const camera = createCamera();
const post = new PixelPost(renderer, 1600, Number(params.get('scale') || 1));
if (params.has('dither'))
  post.uniforms.uDither.value = Number(params.get('dither'));
const CLIP = [
  new THREE.Plane(new THREE.Vector3(1, 0, 0), SLAB.hx + 0.05),
  new THREE.Plane(new THREE.Vector3(-1, 0, 0), SLAB.hx + 0.05),
  new THREE.Plane(new THREE.Vector3(0, 0, 1), SLAB.hz + 0.05),
  new THREE.Plane(new THREE.Vector3(0, 0, -1), SLAB.hz + 0.05),
];

const lights = createLighting(renderer, scene);
const mats = createMaterials();

const grey = params.has('grey');

async function init() {
  const set = buildSet(scene, mats);
  const barn = buildBarn(scene, mats);
  const windmill = buildWindmill(scene, mats);
  const ufo = buildUfo(scene, mats);
  const source = await loadCowSource();
  const cows = [
    buildCow(source, mats, { name: 'daisy', bell: true }),
    buildCow(source, mats, { name: 'clover', black: mats.cowBrown }),
    buildCow(source, mats, { name: 'bessie' }),
  ];
  for (const c of cows) {
    scene.add(c.root);
    scene.add(c.shadow);
  }
  const farmer = buildFarmer(scene, mats);
  const stage = createStage({ ufo, cows, farmer, barn, windmill, set });

  if (grey) {
    const g = new THREE.MeshLambertMaterial({ color: 0xb4b4b4 });
    scene.traverse((o) => {
      if (o.isMesh && !o.material?.transparent) o.material = g;
      if (
        o.isMesh &&
        o.material?.transparent &&
        o.material.blending === THREE.AdditiveBlending
      )
        o.material = new THREE.MeshBasicMaterial({
          color: 0xdddddd,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        });
    });
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    updateCamera(camera, Math.max(0.3, rect.width / rect.height));
    post.setSize(rect.width, rect.height);
  }

  function draw(T) {
    stage.update(T);
    if (grey) {
      renderer.setRenderTarget(null);
      renderer.setClearColor(0xffffff, 1);
      renderer.clippingPlanes = CLIP;
      renderer.render(scene, camera);
      renderer.clippingPlanes = [];
    } else post.render(scene, camera, CLIP);
  }

  resize();
  window.addEventListener('resize', resize);
  let resizeTimer = 0;
  window.addEventListener('orientationchange', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });

  let frozen = params.has('t') ? parseFloat(params.get('t')) : null;
  const startAt = params.has('from') ? parseFloat(params.get('from')) : 0;
  let origin = performance.now() - startAt * 1000;
  function tick(now) {
    if (frozen == null) draw((now - origin) / 1000);
    requestAnimationFrame(tick);
  }
  draw(frozen ?? startAt);
  requestAnimationFrame(tick);

  const entities = {
    ufo: ufo.group,
    alienHead: ufo.alienHead,
    daisy: cows[0].root,
    clover: cows[1].root,
    bessie: cows[2].root,
    farmer: farmer.group,
    hat: farmer.hat,
    windmill: windmill.fan,
    barnDoor: barn.leaves[1],
  };
  window.__diorama = {
    THREE,
    scene,
    camera,
    renderer,
    post,
    stage,
    TL,
    CLIP,
    mats,
    lights,
    entities,
    cast: [
      { group: cows[0].root },
      { group: cows[1].root },
      { group: cows[2].root },
      { group: farmer.group },
    ],
    freeze(t) {
      frozen = t;
      draw(t);
    },
    play() {
      origin = performance.now() - (frozen ?? 0) * 1000;
      frozen = null;
    },
    view(pos, tgt) {
      if (!pos) {
        resize();
        return;
      }
      camera.position.set(pos[0], pos[1], pos[2]);
      camera.lookAt(tgt[0], tgt[1], tgt[2]);
      camera.updateProjectionMatrix();
    },
    audit: {
      loop: LOOP,
      slab: {
        x0: -SLAB.hx,
        x1: SLAB.hx,
        z0: -SLAB.hz,
        z1: SLAB.hz,
        y0: -0.6,
        y1: 10.2,
        margin: 0.5,
      },
      movers: [
        { name: 'ufo', group: ufo.group, required: true, allowSpawn: false },
      ],
      emitters: [],
    },
  };
  window.__dioramaReady = true;
}

init().catch((e) => {
  console.error(e);
  const fb = document.getElementById('fallback');
  if (fb) fb.hidden = false;
});
