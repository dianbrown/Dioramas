import { lerp } from '../config.js';

export const STAND = {
  torso: [0.03, 0, 0],
  head: [0, 0, 0],
  shoulderL: [0.02, 0, -0.1],
  shoulderR: [0.02, 0, 0.1],
  elbowL: [-0.17, 0, 0],
  elbowR: [-0.17, 0, 0],
  wristL: [0, 0, 0],
  wristR: [0, 0, 0],
  hipL: [0, 0, 0.02],
  hipR: [0, 0, -0.02],
  kneeL: [0.05, 0, 0],
  kneeR: [0.05, 0, 0],
  ankleL: [-0.03, 0, 0],
  ankleR: [-0.03, 0, 0],
};

export const SEATED = {
  torso: [0.05, 0, 0],
  head: [0, 0, 0],
  shoulderL: [-0.72, 0, -0.14],
  shoulderR: [-0.72, 0, 0.14],
  elbowL: [-0.52, 0, 0],
  elbowR: [-0.52, 0, 0],
  wristL: [0, 0, 0],
  wristR: [0, 0, 0],
  hipL: [-1.5, 0, 0.05],
  hipR: [-1.5, 0, -0.05],
  kneeL: [0.52, 0, 0],
  kneeR: [0.52, 0, 0],
  ankleL: [0.18, 0, 0],
  ankleR: [0.18, 0, 0],
};

export const LEGS_OUT = {
  torso: [0.2, 0, 0],
  head: [-0.06, 0, 0],
  shoulderL: [-0.62, 0, -0.3],
  shoulderR: [-0.55, 0, 0.34],
  elbowL: [-0.72, 0, 0],
  elbowR: [-0.6, 0, 0],
  wristL: [0, 0, 0],
  wristR: [0, 0, 0],
  hipL: [-0.88, 0, 0.14],
  hipR: [-0.72, 0, -0.1],
  kneeL: [0.62, 0, 0],
  kneeR: [0.48, 0, 0],
  ankleL: [-0.16, 0, 0],
  ankleR: [-0.12, 0, 0],
};

export const REACH = {
  torso: [0.14, 0.04, 0.04],
  head: [-0.1, 0.12, 0],
  shoulderL: [-0.42, 0, -0.26],
  shoulderR: [-1.52, 0, 0.24],
  elbowL: [-0.62, 0, 0],
  elbowR: [-0.48, 0, 0],
  wristL: [0, 0, 0],
  wristR: [-0.25, 0, 0],
  hipL: [-0.22, 0, 0.06],
  hipR: [-0.1, 0, -0.06],
  kneeL: [0.4, 0, 0],
  kneeR: [0.26, 0, 0],
  ankleL: [-0.16, 0, 0],
  ankleR: [-0.12, 0, 0],
};

export const CROUCH_IN = {
  torso: [0.52, 0.1, 0.02],
  head: [-0.34, 0.1, 0],
  shoulderL: [-0.92, 0, -0.26],
  shoulderR: [-1.3, 0, 0.26],
  elbowL: [-1.05, 0, 0],
  elbowR: [-0.72, 0, 0],
  wristL: [0, 0, 0],
  wristR: [0, 0, 0],
  hipL: [-0.72, 0, 0.12],
  hipR: [-0.66, 0, -0.1],
  kneeL: [1.12, 0, 0],
  kneeR: [1.04, 0, 0],
  ankleL: [-0.34, 0, 0],
  ankleR: [-0.3, 0, 0],
};

export const SIT_EDGE = {
  torso: [0.46, 0.12, 0],
  head: [-0.26, 0.1, 0],
  shoulderL: [-0.55, 0, -0.3],
  shoulderR: [-0.95, 0, 0.3],
  elbowL: [-0.95, 0, 0],
  elbowR: [-0.85, 0, 0],
  wristL: [0, 0, 0],
  wristR: [0, 0, 0],
  hipL: [-1.12, 0, 0.11],
  hipR: [-1.04, 0, -0.09],
  kneeL: [1.12, 0, 0],
  kneeR: [1.06, 0, 0],
  ankleL: [-0.02, 0, 0],
  ankleR: [-0.04, 0, 0],
};

export const LEGS_IN = {
  torso: [0.36, 0.16, 0],
  head: [-0.16, 0.1, 0],
  shoulderL: [-0.5, 0, -0.28],
  shoulderR: [-0.62, 0, 0.28],
  elbowL: [-1.1, 0, 0],
  elbowR: [-1.05, 0, 0],
  wristL: [0, 0, 0],
  wristR: [0, 0, 0],
  hipL: [-1.46, 0, 0.1],
  hipR: [-1.4, 0, -0.1],
  kneeL: [1.58, 0, 0],
  kneeR: [1.5, 0, 0],
  ankleL: [0.16, 0, 0],
  ankleR: [0.14, 0, 0],
};

export const DUCK = {
  torso: [0.46, 0, 0],
  head: [-0.26, 0, 0],
  shoulderL: [-0.8, 0, -0.26],
  shoulderR: [-0.3, 0, 0.3],
  elbowL: [-0.95, 0, 0],
  elbowR: [-0.45, 0, 0],
  wristL: [0, 0, 0],
  wristR: [0, 0, 0],
  hipL: [-0.72, 0, 0.16],
  hipR: [-0.58, 0, -0.12],
  kneeL: [1.38, 0, 0],
  kneeR: [1.2, 0, 0],
  ankleL: [-0.42, 0, 0],
  ankleR: [-0.34, 0, 0],
};

export const CROUCH = {
  torso: [0.3, 0, 0],
  head: [-0.16, 0, 0],
  shoulderL: [-0.3, 0, -0.22],
  shoulderR: [-0.26, 0, 0.24],
  elbowL: [-0.7, 0, 0],
  elbowR: [-0.62, 0, 0],
  wristL: [0, 0, 0],
  wristR: [0, 0, 0],
  hipL: [-0.98, 0, 0.14],
  hipR: [-0.86, 0, -0.12],
  kneeL: [1.52, 0, 0],
  kneeR: [1.38, 0, 0],
  ankleL: [-0.46, 0, 0],
  ankleR: [-0.4, 0, 0],
};

export const REACH_FWD = {
  ...STAND,
  torso: [0.08, 0, 0],
  shoulderL: [-1.34, 0, -0.12],
  shoulderR: [-1.3, 0, 0.1],
  elbowL: [-0.3, 0, 0],
  elbowR: [-0.22, 0, 0],
  hipL: [-0.16, 0, 0.06],
  hipR: [0.1, 0, -0.08],
  kneeL: [0.34, 0, 0],
  kneeR: [0.22, 0, 0],
  ankleL: [-0.16, 0, 0],
  ankleR: [-0.06, 0, 0],
};

export const AIM = REACH_FWD;

export const CARRY = {
  shoulderR: [0.14, 0, 0.12],
  elbowR: [-0.12, 0, 0],
  shoulderL: [-0.1, 0, -0.12],
  elbowL: [-0.3, 0, 0],
};

export const THROW_BACK = {
  ...STAND,
  torso: [0.04, -0.26, 0],
  head: [0, -0.2, 0],
  shoulderR: [0.95, 0, 0.22],
  elbowR: [-1.15, 0, 0],
  shoulderL: [-0.45, 0, -0.2],
  elbowL: [-0.55, 0, 0],
  hipL: [-0.12, 0, 0.05],
  hipR: [0.14, 0, -0.05],
};

export const THROW_FWD = {
  ...STAND,
  torso: [0.22, 0.2, 0],
  head: [-0.05, 0.12, 0],
  shoulderR: [-1.55, 0, 0.1],
  elbowR: [-0.18, 0, 0],
  shoulderL: [0.2, 0, -0.28],
  elbowL: [-0.85, 0, 0],
  hipL: [0.1, 0, 0.05],
  hipR: [-0.16, 0, -0.05],
  kneeL: [0.24, 0, 0],
  kneeR: [0.18, 0, 0],
};

export function mixPose(a, b, k) {
  const out = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const av = a[key] ?? [0, 0, 0];
    const bv = b[key] ?? [0, 0, 0];
    out[key] = [
      lerp(av[0] ?? 0, bv[0] ?? 0, k),
      lerp(av[1] ?? 0, bv[1] ?? 0, k),
      lerp(av[2] ?? 0, bv[2] ?? 0, k),
    ];
  }
  return out;
}

export function walkPose(phase, opts = {}) {
  const amp = opts.amp ?? 0.32;
  const armAmp = opts.armAmp ?? 0.44;
  const lean = opts.lean ?? 0.05;
  const kneeBase = opts.kneeBase ?? 0.06;
  const swing = Math.sin(phase);
  const cs = Math.cos(phase);
  const kneeL = kneeBase + 0.46 * Math.max(0, -cs) + 0.22 * Math.max(0, swing);
  const kneeR = kneeBase + 0.46 * Math.max(0, cs) + 0.22 * Math.max(0, -swing);
  const p = {
    torso: [lean, swing * 0.05, 0],
    head: [0, -swing * 0.04, 0],
    shoulderL: [-swing * armAmp, 0, -0.09],
    shoulderR: [swing * armAmp, 0, 0.09],
    elbowL: [-0.16 - Math.max(0, swing) * 0.28, 0, 0],
    elbowR: [-0.16 - Math.max(0, -swing) * 0.28, 0, 0],
    wristL: [0, 0, 0],
    wristR: [0, 0, 0],
    hipL: [swing * amp, 0, 0.03],
    hipR: [-swing * amp, 0, -0.03],
    kneeL: [kneeL, 0, 0],
    kneeR: [kneeR, 0, 0],
    ankleL: [-kneeL * 0.32, 0, 0],
    ankleR: [-kneeR * 0.32, 0, 0],
  };
  if (opts.carry) {
    p.shoulderR = [0.1 + swing * 0.06, 0, 0.12];
    p.elbowR = [-0.14, 0, 0];
    p.shoulderL = [-swing * armAmp * 1.15, 0, -0.1];
  }
  return p;
}

export function runPose(phase, opts = {}) {
  const p = walkPose(phase, {
    amp: 0.52,
    armAmp: 0.72,
    lean: 0.26,
    kneeBase: 0.12,
    ...opts,
  });
  const bob = Math.abs(Math.cos(phase));
  p.torso = [0.26 + bob * 0.03, p.torso[1], 0];
  p.elbowL = [-0.75, 0, 0];
  p.elbowR = opts.carry ? [-0.18, 0, 0] : [-0.75, 0, 0];
  p.shoulderL = [-Math.sin(phase) * 0.8, 0, -0.14];
  p.shoulderR = opts.carry ? [0.16, 0, 0.14] : [Math.sin(phase) * 0.8, 0, 0.14];
  return p;
}
