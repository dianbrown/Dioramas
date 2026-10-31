import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import cowGlb from '../../assets/cow.glb';
import { mesh, contactShadow } from './detail.js';
import { clamp, LOOP } from '../config.js';

export const COW_LEN = 2.1;

export function loadCowSource() {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    const buf = cowGlb.buffer.slice(
      cowGlb.byteOffset,
      cowGlb.byteOffset + cowGlb.byteLength,
    );
    loader.parse(buf, '', (gltf) => resolve(gltf), reject);
  });
}

const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const AX = new THREE.Vector3(1, 0, 0);

export function buildCow(source, mats, opts = {}) {
  const root = new THREE.Group(); // world placement: position, yaw
  root.name = opts.name ?? 'cow';
  const lift = new THREE.Group(); // tumble pivot at mid-body
  root.add(lift);
  const fit = new THREE.Group();
  lift.add(fit);
  const model = SkeletonUtils.clone(source.scene);
  fit.add(model);

  const bones = {};
  model.traverse((o) => {
    if (o.isBone) {
      bones[o.name] = o;
      // Bind pose, restored every frame: the clips do not drive every bone
      // (Idle skips Tail1/Tail2 and the front upper legs, Run skips Neck), and an
      // offset multiplied onto an undriven bone would accumulate frame by frame.
      o.userData.bind = {
        p: o.position.clone(),
        q: o.quaternion.clone(),
        s: o.scale.clone(),
      };
    }
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
      const name = Array.isArray(o.material) ? null : o.material.name;
      const pick = (n) =>
        n === 'Black'
          ? (opts.black ?? mats.cowBlack)
          : n === 'Pink'
            ? mats.cowPink
            : (opts.white ?? mats.cowWhite);
      o.material = Array.isArray(o.material)
        ? o.material.map((m) => pick(m.name))
        : pick(name);
    }
  });

  // Fit: measure bind pose, put the head on +Z, length 2.1, hooves on y 0.
  model.updateMatrixWorld(true);
  const head = bones.Head.getWorldPosition(new THREE.Vector3());
  const hips = bones.Hips.getWorldPosition(new THREE.Vector3());
  const fwd = head.clone().sub(hips);
  fwd.y = 0;
  fit.rotation.y = Math.atan2(-fwd.x, fwd.z) * -1; // rotate so fwd → +Z
  fit.rotation.y = -Math.atan2(fwd.x, fwd.z);
  fit.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(model, true);
  const size = box.getSize(new THREE.Vector3());
  const s = (opts.length ?? COW_LEN) / Math.max(size.x, size.z);
  fit.scale.setScalar(s);
  fit.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(model, true);
  const c = box.getCenter(new THREE.Vector3());
  fit.position.set(-c.x, -box.min.y, -c.z);
  fit.updateMatrixWorld(true);
  const dims = new THREE.Box3()
    .setFromObject(model, true)
    .getSize(new THREE.Vector3());
  const midY = dims.y * 0.55;
  lift.position.y = midY;
  fit.position.y -= midY;

  // Story parts on bones (bone space is scaled by `s`, so divide sizes by it).
  const k = 1 / (s * (model.scale?.x ?? 1));
  const neckBone = bones.Neck;
  const headBone = bones.Head;
  const addToBone = (bone, build) => {
    const g = new THREE.Group();
    bone.add(g);
    // The bone frame is arbitrary; undo its world rotation once so the part is
    // authored in the cow's own frame (+Y up, +Z forward), then scale back.
    model.updateMatrixWorld(true);
    const bw = new THREE.Quaternion();
    bone.getWorldQuaternion(bw);
    const rw = new THREE.Quaternion();
    root.getWorldQuaternion(rw);
    g.quaternion.copy(bw.invert().multiply(rw));
    const bs = new THREE.Vector3();
    bone.getWorldScale(bs);
    g.scale.setScalar(1 / bs.x);
    build(g);
    return g;
  };
  const extras = {};
  if (opts.bell) {
    extras.collar = addToBone(neckBone, (g) => {
      mesh(
        g,
        new THREE.TorusGeometry(0.17, 0.03, 4, 14),
        mats.leather,
        0,
        -0.02,
        0.1,
        { rotation: [Math.PI / 2 + 0.5, 0, 0], scale: [0.85, 1.0, 1] },
      );
      const bell = new THREE.Group();
      bell.position.set(0, -0.15, 0.17); // tucked under the throat, not down at the knees
      g.add(bell);
      mesh(
        bell,
        new THREE.CylinderGeometry(0.04, 0.07, 0.11, 8),
        mats.brass,
        0,
        -0.05,
        0,
      );
      mesh(bell, new THREE.SphereGeometry(0.02, 5, 4), mats.iron, 0, -0.11, 0);
      extras.bell = bell;
    });
  }
  if (opts.tags !== false) {
    extras.tags = addToBone(headBone, (g) => {
      for (const sd of [-1, 1])
        mesh(
          g,
          new THREE.BoxGeometry(0.02, 0.06, 0.05),
          mats.tag,
          sd * 0.2,
          0.05,
          -0.03,
          { castShadow: false },
        ); // on the ears, inside the silhouette
    });
  }

  // Mixer and actions.
  const mixer = new THREE.AnimationMixer(model);
  const clips = {};
  for (const clip of source.animations) {
    const name = clip.name.split('|').pop();
    const action = mixer.clipAction(clip);
    action.play();
    action.setEffectiveWeight(0);
    clips[name] = { action, dur: clip.duration };
  }

  const shadow = contactShadow(new THREE.Group(), 0, 0, 0, 1, 0.62);
  shadow.scale.set(1.3, 2.4, 1);

  // Base (post-clip) rest quaternions are re-read every frame, so overrides
  // are applied as offsets on top of whatever the clip wrote.
  const rot = (bone, x, y, z) => {
    if (!bone || (!x && !y && !z)) return;
    tmpE.set(x, y, z);
    tmpQ.setFromEuler(tmpE);
    bone.quaternion.multiply(tmpQ);
  };

  return {
    root,
    lift,
    model,
    bones,
    extras,
    shadow,
    clips,
    dims,

    animate(weights, phases, over = {}) {
      for (const bone of Object.values(bones)) {
        const b = bone.userData.bind;
        bone.position.copy(b.p);
        bone.quaternion.copy(b.q);
        bone.scale.copy(b.s);
      }
      for (const [n, c] of Object.entries(clips)) {
        const w = weights[n] ?? 0;
        c.action.enabled = w > 0.001;
        c.action.setEffectiveWeight(w);
        const p = phases[n] ?? 0;
        c.action.time = ((p % c.dur) + c.dur) % c.dur;
      }
      mixer.update(0);
      const B = bones;

      // grass, Neck +Z turns it toward the cow's local +X; Tail1 Z swishes.
      rot(B.Neck, over.neckX ?? 0, 0, over.headY ?? 0);
      rot(B.Head, over.headX ?? 0, 0, over.headZ ?? 0);
      if (over.tail) {
        rot(B.Tail1, 0, 0, over.tail * 0.5);
        rot(B.Tail2, 0, 0, over.tail * 0.7);
        rot(B.Tail3, 0, 0, over.tail);
      }
      if (over.legsFront || over.kick) {
        const f = over.legsFront ?? 0;
        const kk = over.kick ?? 0;
        rot(B.FrontUpLegL, f + kk, 0, 0);
        rot(B.FrontUpLegR, f - kk, 0, 0);
        rot(B.FrontLowLegL, -f * 0.6, 0, 0);
        rot(B.FrontLowLegR, -f * 0.6, 0, 0);
      }
      if (over.legsBack || over.kick) {
        const b = over.legsBack ?? 0;
        const kk = over.kick ?? 0;
        rot(B.BackUpLegL, b - kk, 0, 0);
        rot(B.BackUpLegR, b + kk, 0, 0);
        rot(B.BackLowLegL, b * 0.8, 0, 0);
        rot(B.BackLowLegR, b * 0.8, 0, 0);
      }
      if (extras.bell) extras.bell.rotation.x = over.bell ?? 0;
    },
  };
}

export function loopRate(dur, rate = 1) {
  const n = Math.max(1, Math.round((LOOP * rate) / dur));
  return (n * dur) / LOOP;
}
