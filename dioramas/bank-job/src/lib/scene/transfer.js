import * as THREE from 'three';
import { clamp, lerp, smooth } from '../../../../shared/config.js';
import {
  STAND,
  SEATED,
  REACH,
  CROUCH_IN,
  SIT_EDGE,
  LEGS_IN,
  mixPose,
} from '../../../../shared/scene/poses.js';

const PI = Math.PI;

export const SEAT_ROOT_Y = -0.38;

export const DOOR_STAND_X = 2.0;

export const DOOR_STAND_DZ = -0.06;

export const DOOR_NEAR_X = 1.34;

export const STEP_SHARE = 0.26;

export function toWorld(base, x, z) {
  const c = Math.cos(base.yaw);
  const s = Math.sin(base.yaw);
  return new THREE.Vector3(base.x + x * c + z * s, 0, base.z - x * s + z * c);
}

export function clampAngle(a) {
  let x = a;
  while (x > PI) x -= PI * 2;
  while (x < -PI) x += PI * 2;
  return x;
}

export const lerpAngle = (a, b, k) => a + clampAngle(b - a) * k;

export const CLIMB = [
  { u: 0.0, k: 0.0, dy: 0.38, pose: STAND },
  { u: 0.16, k: 0.03, dy: 0.33, pose: REACH }, // hand to the roof edge
  { u: 0.36, k: 0.16, dy: 0.12, pose: CROUCH_IN }, // knees deep, hips dropping
  { u: 0.56, k: 0.38, dy: 0.01, pose: SIT_EDGE }, // perched, feet still down
  { u: 0.76, k: 0.66, dy: 0.0, pose: LEGS_IN }, // knees up, feet over the sill
  { u: 0.9, k: 0.88, dy: 0.0, pose: mixPose(LEGS_IN, SEATED, 0.55) },
  { u: 1.0, k: 1.0, dy: 0.0, pose: SEATED },
];

export function climbAt(u) {
  let a = CLIMB[0];
  let b = CLIMB[CLIMB.length - 1];
  for (let i = 1; i < CLIMB.length; i++) {
    if (u <= CLIMB[i].u) {
      a = CLIMB[i - 1];
      b = CLIMB[i];
      break;
    }
  }
  const f = smooth(clamp((u - a.u) / Math.max(0.0001, b.u - a.u), 0, 1));
  return {
    k: lerp(a.k, b.k, f),
    dy: lerp(a.dy, b.dy, f),
    pose: mixPose(a.pose, b.pose, f),
  };
}

export function stepPose(f) {
  const lift = Math.sin(PI * clamp(f, 0, 1));
  return {
    ...STAND,
    torso: [0.06 + 0.08 * f, 0, 0],
    head: [-0.02, 0, 0],
    hipL: [-0.36 * lift, 0, 0.04],
    hipR: [0.22 * lift, 0, -0.04],
    kneeL: [0.1 + 0.55 * lift, 0, 0],
    kneeR: [0.16, 0, 0],
    ankleL: [-0.1 - 0.16 * lift, 0, 0],
    ankleR: [-0.1, 0, 0],
  };
}

export function transfer(
  t,
  t0,
  dur,
  state,
  side,
  seat,
  standPos,
  standYaw,
  inward,
) {
  const u = clamp((t - t0) / Math.max(0.1, dur), 0, 1);
  const A = STEP_SHARE;
  const faceYaw = state.yaw - side * (PI / 2); // square to the open door
  const door = toWorld(state, side * DOOR_NEAR_X, seat.z + DOOR_STAND_DZ);
  door.y = 0;

  const climbPos = (v) => {
    const c = climbAt(clamp(v, 0, 1));
    const p = toWorld(
      state,
      lerp(side * DOOR_NEAR_X, seat.x, c.k),
      lerp(seat.z + DOOR_STAND_DZ, seat.z, c.k),
    );
    p.y = seat.y + c.dy + (state.y ?? 0);
    return { c, p };
  };

  if (inward) {
    // One stride up to the door, facing the car the whole way.
    if (u < A) {
      const f = smooth(u / A);
      const pos = new THREE.Vector3().lerpVectors(standPos, door, f);
      return { pos, yaw: lerpAngle(standYaw, faceYaw, f), pose: stepPose(f) };
    }
    const v = (u - A) / (1 - A);
    const { c, p } = climbPos(v);
    // Turn to face the windscreen only once the hips are on the cushion, so the
    // shoulders never sweep through the door frame or the roof.
    const turn = smooth(clamp((v - 0.62) / 0.3, 0, 1));
    return { pos: p, yaw: lerpAngle(faceYaw, state.yaw, turn), pose: c.pose };
  }

  if (u < 1 - A) {
    const v = u / (1 - A);
    const { c, p } = climbPos(1 - v);
    const turn = smooth(clamp(v / 0.34, 0, 1));
    return { pos: p, yaw: lerpAngle(state.yaw, faceYaw, turn), pose: c.pose };
  }
  const f = smooth((u - (1 - A)) / A);
  const pos = new THREE.Vector3().lerpVectors(door, standPos, f);
  return { pos, yaw: lerpAngle(faceYaw, standYaw, f), pose: stepPose(f) };
}

export function standSpot(state, side, seatZ) {
  return toWorld(
    state,
    side * DOOR_STAND_X,
    seatZ + DOOR_STAND_DZ - (seatZ > 0 ? 0.24 : 0.49),
  );
}
