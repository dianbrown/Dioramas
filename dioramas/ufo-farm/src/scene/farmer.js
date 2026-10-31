import * as THREE from 'three';
import { buildPerson, setPose } from '../../../shared/scene/person.js';
import {
  mesh,
  seg,
  softDiscTexture,
  haloPlane,
  contactShadow,
} from './detail.js';
import { C } from '../core/palette.js';

export function buildFarmer(scene, mats) {
  const person = buildPerson(mats, {
    skin: mats.skin,
    hair: mats.hair[0],
    top: mats.cloth.plaid,
    bottom: mats.cloth.denim,
    shoe: mats.leather,
    sleeve: 'long',
    hairStyle: 'short',
  });
  const { group, joints: J } = person;
  group.name = 'farmer';
  scene.add(group);

  // Overalls: bib, pocket, two straps over the shoulders, brass buttons.
  const bib = new THREE.Group();
  bib.position.set(0, 0.0, 0.0);
  J.torso.add(bib);
  mesh(
    bib,
    new THREE.BoxGeometry(0.26, 0.3, 0.03),
    mats.cloth.denim,
    0,
    0.2,
    0.152,
  );
  mesh(
    bib,
    new THREE.BoxGeometry(0.13, 0.09, 0.012),
    mats.cloth.denimLit,
    0,
    0.24,
    0.17,
  );
  for (const s of [-1, 1]) {
    mesh(
      bib,
      new THREE.BoxGeometry(0.045, 0.42, 0.02),
      mats.cloth.denim,
      s * 0.1,
      0.33,
      0.12,
      { rotation: [-0.25, 0, -s * 0.12] },
    );
    mesh(
      bib,
      new THREE.BoxGeometry(0.045, 0.36, 0.02),
      mats.cloth.denim,
      s * 0.08,
      0.32,
      -0.15,
      { rotation: [0.25, 0, s * 0.2] },
    );
    mesh(
      bib,
      new THREE.SphereGeometry(0.018, 5, 4),
      mats.brass,
      s * 0.1,
      0.34,
      0.166,
      { castShadow: false },
    );
  }
  // A rag hanging from the back pocket.
  mesh(
    J.pelvis,
    new THREE.BoxGeometry(0.1, 0.18, 0.015),
    mats.barnRedLit,
    0.08,
    -0.12,
    -0.165,
    { rotation: [0.1, 0, 0.1] },
  );

  // ---- straw hat (world space) ---------------------------------------------
  const hat = new THREE.Group();
  hat.name = 'hat';
  scene.add(hat);
  mesh(
    hat,
    new THREE.CylinderGeometry(0.25, 0.26, 0.025, 16),
    mats.hatStraw,
    0,
    0,
    0,
  );
  mesh(
    hat,
    new THREE.CylinderGeometry(0.115, 0.13, 0.13, 12),
    mats.hatStraw,
    0,
    0.07,
    0,
  );
  mesh(
    hat,
    new THREE.CylinderGeometry(0.132, 0.132, 0.035, 12),
    mats.barnRed,
    0,
    0.03,
    0,
  );
  mesh(
    hat,
    new THREE.BoxGeometry(0.1, 0.02, 0.2),
    mats.cloth.strawDark,
    0,
    0.14,
    0,
    { castShadow: false },
  ); // crown pinch
  hat.scale.setScalar(1.15); // a cartoon farmer's hat: big enough to follow in flight
  // Where the hat sits on the head, in head-joint space.
  const hatSeat = new THREE.Object3D();
  hatSeat.position.set(0, 0.2, -0.005);
  hatSeat.rotation.x = -0.06;
  J.head.add(hatSeat);

  // ---- lantern (world space, held by the bail) ------------------------------
  const lantern = new THREE.Group();
  lantern.name = 'lantern';
  scene.add(lantern);
  // origin at the top of the bail, so the hold is a single offset from the palm
  const body = new THREE.Group();
  body.position.y = -0.3;
  lantern.add(body);
  mesh(
    body,
    new THREE.CylinderGeometry(0.075, 0.085, 0.05, 10),
    mats.millRed,
    0,
    0.0,
    0,
  );
  mesh(
    body,
    new THREE.CylinderGeometry(0.05, 0.05, 0.13, 10),
    mats.warm,
    0,
    0.09,
    0,
    { castShadow: false },
  ); // globe
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    mesh(
      body,
      new THREE.BoxGeometry(0.01, 0.15, 0.01),
      mats.iron,
      Math.cos(a) * 0.065,
      0.09,
      Math.sin(a) * 0.065,
      { castShadow: false },
    );
  }
  mesh(body, new THREE.ConeGeometry(0.08, 0.06, 10), mats.millRed, 0, 0.19, 0);
  mesh(
    body,
    new THREE.TorusGeometry(0.11, 0.008, 3, 12, Math.PI),
    mats.iron,
    0,
    0.22,
    0,
    { castShadow: false },
  );
  const flame = mesh(
    body,
    new THREE.SphereGeometry(0.03, 6, 5),
    mats.bulb,
    0,
    0.09,
    0,
    { castShadow: false, scale: [0.8, 1.4, 0.8] },
  );
  const halo = haloPlane(body, 0.7, 0.7, '255,196,110', 0.38, 0, 0.09, 0, {});
  const light = new THREE.PointLight(C.warm, 2.2, 4.5, 1.6);
  light.position.set(0, 0.09, 0);
  body.add(light);
  const poolMat = new THREE.MeshBasicMaterial({
    map: softDiscTexture('255,196,110'),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), poolMat);
  pool.rotation.x = -Math.PI / 2;
  scene.add(pool);

  const shadow = contactShadow(scene, 0, 0, 0, 0.75, 0.62);

  const tq = new THREE.Quaternion();
  const tv = new THREE.Vector3();
  return {
    group,
    joints: J,
    hat,
    hatSeat,
    lantern,
    pool,
    shadow,
    flame,
    halo,
    light,
    setPose: (p) => setPose(person, p),

    hatOnHead() {
      group.updateMatrixWorld(true);
      hatSeat.getWorldPosition(hat.position);
      hatSeat.getWorldQuaternion(hat.quaternion);
    },

    lanternInHand(swing = 0, visible = true) {
      lantern.visible = visible;
      pool.visible = visible;
      light.visible = visible;
      group.updateMatrixWorld(true); // placed even when hidden: no stale state
      J.wristL.localToWorld(tv.set(0, -0.09, 0.01));
      lantern.position.copy(tv);
      lantern.rotation.set(swing, 0, swing * 0.4);
      pool.position.set(tv.x, 0.02, tv.z);
    },
  };
}
