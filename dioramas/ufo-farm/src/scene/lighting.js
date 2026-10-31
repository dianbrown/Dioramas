import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createLighting(renderer, scene) {
  const hemi = new THREE.HemisphereLight(0x1b2740, 0x090b12, 1.25);
  scene.add(hemi);

  const moon = new THREE.DirectionalLight(0x93a7c4, 1.25);
  moon.position.set(-16, 21, 9);
  moon.target.position.set(0, -0.4, 0);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = -14;
  moon.shadow.camera.right = 14;
  moon.shadow.camera.top = 14;
  moon.shadow.camera.bottom = -14;
  moon.shadow.camera.near = 4;
  moon.shadow.camera.far = 70;
  moon.shadow.bias = -0.00022;
  moon.shadow.normalBias = 0.025;
  moon.shadow.radius = 2.0;
  moon.shadow.camera.updateProjectionMatrix();
  scene.add(moon);
  scene.add(moon.target);

  const fill = new THREE.DirectionalLight(0x6d7f9e, 0.16);
  fill.position.set(18, 10, 14);
  fill.target.position.set(0, -0.5, 0);
  scene.add(fill);
  scene.add(fill.target);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new RoomEnvironment();
  const env = pmrem.fromScene(envScene, 0.035).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.06;
  pmrem.dispose();
  envScene.dispose?.();

  return { moon, hemi, fill, env };
}
