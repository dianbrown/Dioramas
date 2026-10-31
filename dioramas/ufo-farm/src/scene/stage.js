import * as THREE from 'three';
import {
  LOOP,
  DT,
  SLAB,
  BARN,
  PASTURE,
  clamp,
  lerp,
  smooth,
  easeOut,
  easeIn,
  win,
  bell,
  spring,
  hash,
  loopSin,
  lerpAngle,
  groundY,
} from '../config.js';
import {
  STAND,
  walkPose,
  runPose,
  mixPose,
} from '../../../shared/scene/poses.js';
import { Track } from './track.js';
import { UFO } from './ufo.js';
import { loopRate } from './cows.js';

export const TL = {
  loop: LOOP,
  ufoIn: [3.5, 6.8],
  interfere: [5.0, 6.2],
  alert: [5.2, 5.6, 5.9], // when each cow looks up
  beams: [
    {
      cow: 0,
      hatch: [7.4, 7.8],
      down: [7.8, 8.25],
      lift: [8.3, 11.0],
      up: [11.2, 11.65],
      close: [11.65, 12.0],
    },
    {
      cow: 1,
      hatch: [13.9, 14.3],
      down: [14.4, 14.85],
      lift: [14.9, 17.6],
      up: [17.8, 18.25],
      close: [18.25, 18.6],
    },
    {
      cow: 2,
      hatch: [20.0, 20.4],
      down: [20.5, 20.95],
      lift: [21.1, 24.0],
      up: [24.2, 24.65],
      close: [24.65, 25.0],
    },
  ],
  moves: [
    [12.0, 13.8],
    [18.6, 20.0],
  ],
  leave: { climb: [25.0, 25.8], out: [25.8, 27.3] },
  ret: {
    in: [35.4, 38.2],
    hatch: [38.2, 38.6],
    down: [38.8, 39.25],
    drops: [
      [39.25, 42.0],
      [39.95, 42.65],
      [40.65, 43.25],
    ],
    up: [43.5, 43.95],
    close: [43.95, 44.3],
    out: [44.2, 45.4], // the beam stays on until the last cow is down
  },
  bolt: [12.6, 15.6], // Bessie runs to the gate
  doors: { open: [9.5, 10.3], shut: [34.5, 35.4] },
  farmer: {
    out: [9.9, 10.6],
    look: [10.6, 11.6],
    jog: [11.6, 13.6],
    point: [14.4, 15.8],
    rage: [18.0, 19.9],
    hat: 20.9,
    hatIn: 23.6,
    grab: [20.95, 22.2],
    scratch: [27.0, 28.4],
    back: [28.6, 33.8],
    turn: [33.8, 34.5],
    hidden: 35.4,
  },
  mill: { brake: [5.0, 6.5], restart: [26.0, 29.0] },
  flicker: [
    [5.0, 6.2],
    [36.8, 37.6],
  ],
};

const PI = Math.PI;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---- places ---------------------------------------------------------------
const COWS = [
  { name: 'daisy', spot: V(1.9, 0, -0.6), yaw: 2.25 },
  { name: 'clover', spot: V(4.6, 0, 1.0), yaw: -0.75 },
  { name: 'bessie', spot: V(3.6, 0, 3.0), yaw: 2.6 },
];
const BESSIE_STOP = V(0.5, 0, -1.6);
const HOVER_Y = 6.3;
const HOVER = [
  V(COWS[0].spot.x, HOVER_Y, COWS[0].spot.z),
  V(COWS[1].spot.x, HOVER_Y, COWS[1].spot.z),
  V(BESSIE_STOP.x, HOVER_Y, BESSIE_STOP.z),
];
const RET_HOVER = V(3.3, 6.45, 0.8);
const ENTRY0 = V(-3.0, 7.6, -12.8);
const ENTRY_C = V(-2.6, 7.4, -4.0);
const EXIT1 = V(9.5, 8.6, -16.5);
const RET0 = V(14.0, 7.2, -11.5);
const RET_C = V(7.5, 7.0, -2.0);
const EXIT2 = V(-9.0, 8.0, -13.5);
const HATCH_DY = -0.58;

const quad = (a, c, b, u) => {
  const v = 1 - u;
  return new THREE.Vector3(
    v * v * a.x + 2 * v * u * c.x + u * u * b.x,
    v * v * a.y + 2 * v * u * c.y + u * u * b.y,
    v * v * a.z + 2 * v * u * c.z + u * u * b.z,
  );
};

export function ufoPath(t) {
  const R = TL.ret;
  if (t < TL.ufoIn[0]) return { p: ENTRY0.clone(), here: false };
  if (t < TL.ufoIn[1])
    return {
      p: quad(
        ENTRY0,
        ENTRY_C,
        HOVER[0],
        easeOut(win(t, TL.ufoIn[0], TL.ufoIn[1] - TL.ufoIn[0])),
      ),
      here: true,
    };
  if (t < TL.moves[0][0]) return { p: HOVER[0].clone(), here: true };
  if (t < TL.moves[0][1])
    return {
      p: HOVER[0].clone().lerp(HOVER[1], smooth(win(t, ...span(TL.moves[0])))),
      here: true,
    };
  if (t < TL.moves[1][0]) return { p: HOVER[1].clone(), here: true };
  if (t < TL.moves[1][1])
    return {
      p: HOVER[1].clone().lerp(HOVER[2], smooth(win(t, ...span(TL.moves[1])))),
      here: true,
    };
  if (t < TL.leave.climb[0]) return { p: HOVER[2].clone(), here: true };
  const CLIMB = HOVER[2].clone().add(V(0.6, 1.0, -0.7));
  if (t < TL.leave.climb[1])
    return {
      p: HOVER[2].clone().lerp(CLIMB, smooth(win(t, ...span(TL.leave.climb)))),
      here: true,
    };
  if (t < TL.leave.out[1] + 0.6) {
    const u = win(t, TL.leave.out[0], TL.leave.out[1] - TL.leave.out[0] + 0.6);
    return {
      p: CLIMB.clone().lerp(EXIT1, easeIn(u) * 0.4 + u * 0.6),
      here: true,
    };
  }
  if (t < R.in[0]) return { p: RET0.clone(), here: false };
  if (t < R.in[1])
    return {
      p: quad(RET0, RET_C, RET_HOVER, smooth(win(t, ...span(R.in)))),
      here: true,
    }; // a sneak, not a swoop
  if (t < R.out[0]) return { p: RET_HOVER.clone(), here: true };
  if (t < R.out[1] + 0.6) {
    const u = win(t, R.out[0], R.out[1] - R.out[0] + 0.6);
    return {
      p: RET_HOVER.clone().lerp(EXIT2, easeIn(u) * 0.4 + u * 0.6),
      here: true,
    };
  }
  return { p: EXIT2.clone(), here: false };
}
function span([a, b]) {
  return [a, b - a];
}

const BEAMS = [
  ...TL.beams.map((b, i) => ({ ...b, kind: 'lift', idx: i, at: HOVER[i] })),
  {
    kind: 'return',
    idx: 3,
    hatch: TL.ret.hatch,
    down: TL.ret.down,
    lift: [TL.ret.drops[0][0], TL.ret.drops[2][1]],
    up: TL.ret.up,
    close: TL.ret.close,
    at: RET_HOVER,
  },
];
const intakes = TL.beams.map((b) => b.lift[1]);

function hatchK(t) {
  for (const b of BEAMS) {
    if (t >= b.hatch[0] - 0.01 && t <= b.close[1] + 0.01) {
      if (t < b.hatch[1]) return smooth(win(t, ...span(b.hatch)));
      if (t < b.close[0]) return 1;
      return 1 - smooth(win(t, ...span(b.close)));
    }
  }
  return 0;
}
function beamFor(t) {
  for (const b of BEAMS) {
    if (t >= b.down[0] && t <= b.up[1]) {
      let extend = 1;
      if (t < b.down[1]) extend = easeOut(win(t, ...span(b.down)));
      else if (t > b.up[0]) extend = 1 - easeIn(win(t, ...span(b.up)));
      const flick =
        t < b.down[0] + 0.12 ? (hash(Math.floor(t * 40)) > 0.4 ? 1 : 0.4) : 1;
      return {
        b,
        extend,
        k: (b.kind === 'return' ? 0.75 : 1) * flick,
        ringK: ((t - b.down[1]) / 0.85) % 1,
      };
    }
  }
  return null;
}

// ---- windmill: bake the angle once, whole turns per loop ------------------
function millFactor(t) {
  const { brake, restart } = TL.mill;
  if (t < brake[0]) return 1;
  if (t < brake[1]) return 1 - smooth(win(t, ...span(brake)));
  if (t < restart[0]) return 0;
  if (t < restart[1]) return smooth(win(t, ...span(restart)));
  return 1;
}
const MILL_W = 2 * PI * 0.55;
const MILL_N = Math.round(LOOP / DT) * 4;
const millTable = new Float32Array(MILL_N + 1);
{
  const h = LOOP / MILL_N;
  let a = 0;
  for (let i = 1; i <= MILL_N; i++) {
    a += MILL_W * millFactor((i - 0.5) * h) * h;
    millTable[i] = a;
  }
  const turns = Math.max(1, Math.round(a / (2 * PI)));
  const k = (turns * 2 * PI) / a;
  for (let i = 0; i <= MILL_N; i++) millTable[i] *= k;
}
export function millAngle(t) {
  const f = (t / LOOP) * MILL_N;
  const i = Math.min(MILL_N - 1, Math.floor(f));
  return lerp(millTable[i], millTable[i + 1], f - i);
}

// ---- farmer poses (absolute, full joint sets) ------------------------------
const P = (o) => ({ ...STAND, ...o });
const LOOK_UP = P({
  torso: [-0.12, 0, 0],
  head: [-0.45, 0, 0],
  shoulderL: [-0.25, 0, -0.18],
  elbowL: [-0.5, 0, 0],
  shoulderR: [0.1, 0, 0.25],
  elbowR: [-0.3, 0, 0],
  hipL: [-0.08, 0, 0.04],
  hipR: [0.12, 0, -0.04],
  kneeL: [0.12, 0, 0],
  kneeR: [0.18, 0, 0],
});
const POINT = P({
  torso: [0.0, 0, 0],
  head: [-0.32, 0, 0],
  shoulderR: [-2.1, 0, 0.12],
  elbowR: [-0.12, 0, 0],
  shoulderL: [-0.2, 0, -0.15],
  elbowL: [-0.45, 0, 0],
});
const RAGE_A = P({
  torso: [-0.06, 0, 0],
  head: [-0.4, 0, 0],
  shoulderL: [-2.3, 0, -0.85],
  elbowL: [-0.15, 0, 0],
  shoulderR: [-2.2, 0, 0.35],
  elbowR: [-1.25, 0, 0],
  hipL: [-0.15, 0, 0.06],
  kneeL: [0.2, 0, 0],
});
const RAGE_B = P({
  ...RAGE_A,
  shoulderR: [-2.45, 0, 0.3],
  elbowR: [-0.75, 0, 0],
});
const GRAB = P({
  torso: [-0.2, 0, 0],
  head: [-0.55, 0, 0],
  shoulderL: [-0.9, 0, -0.75],
  elbowL: [-0.35, 0, 0],
  shoulderR: [-2.75, 0, 0.3],
  elbowR: [-0.25, 0, 0],
  hipL: [-0.25, 0, 0.05],
  hipR: [0.22, 0, -0.05],
  kneeL: [0.3, 0, 0],
  kneeR: [0.08, 0, 0],
  ankleL: [-0.1, 0, 0],
});
const SCRATCH = P({
  head: [0.12, 0, 0.12],
  torso: [0.05, 0, 0],
  shoulderR: [-2.1, 0, 0.7],
  elbowR: [-2.1, 0, 0],
  shoulderL: [-0.1, 0, -0.12],
  elbowL: [-0.3, 0, 0],
});
const SLUMP = P({
  torso: [0.12, 0, 0],
  head: [0.18, 0, 0],
  shoulderL: [0.05, 0, -0.08],
  shoulderR: [0.05, 0, 0.08],
  elbowL: [-0.12, 0, 0],
  elbowR: [-0.12, 0, 0],
});
const REACH_DOOR = P({
  torso: [0.08, 0, 0],
  shoulderR: [-1.35, 0, 0.1],
  elbowR: [-0.35, 0, 0],
  shoulderL: [-0.3, 0, -0.15],
  elbowL: [-0.5, 0, 0],
});
// The lantern arm is always the left; keep it holding the lantern low unless a pose raises it.
const LANTERN_ARM = { shoulderL: [-0.28, 0, -0.16], elbowL: [-0.42, 0, 0] };

export function createStage(world) {
  const { ufo, cows, farmer, barn, windmill, set } = world;
  const makeTrack = (pts, lane = 0) => new Track(pts, lane);

  const farmerTrack = makeTrack([
    [-7.0, -0.5],
    [-5.4, -0.5],
    [-4.8, -0.6],
    [-3.6, -0.85],
    [-2.35, -0.95],
  ]);
  // Arc length at the apron edge (first stop).
  let dStop = 0;
  for (let d = 0; d < farmerTrack.length; d += 0.02) {
    if (farmerTrack.at(d).pos.x > -4.85) {
      dStop = d;
      break;
    }
  }
  const bessieTrack = makeTrack([
    [COWS[2].spot.x, COWS[2].spot.z],
    [2.6, 2.3],
    [1.6, 0.9],
    [0.9, -0.4],
    [BESSIE_STOP.x, BESSIE_STOP.z],
  ]);

  const idleRate = loopRate(cows[0].clips.Idle?.dur ?? 1, 0.9);
  const tmp = V(0, 0, 0);
  const lookYaw = (from, yaw, target) => {
    const a = Math.atan2(target.x - from.x, target.z - from.z);
    return ((a - yaw + PI * 3) % (PI * 2)) - PI;
  };

  // ---- saucer ---------------------------------------------------------------
  function ufoState(t) {
    const { p, here } = ufoPath(t);
    const h = 0.05;
    const a = ufoPath(clamp(t - h, 0, LOOP)).p;
    const b = ufoPath(clamp(t + h, 0, LOOP)).p;
    const v = b.sub(a).multiplyScalar(1 / (2 * h));
    const pos = p.clone();
    pos.y += 0.07 * loopSin(t, 23) + 0.03 * loopSin(t, 37, 1.3);
    let tx = clamp(v.z * 0.028, -0.32, 0.32);
    let tz = clamp(-v.x * 0.028, -0.32, 0.32);
    for (const ti of intakes) {
      pos.y -= 0.2 * spring(t, ti, 8, 4);
      tx += 0.07 * spring(t, ti, 11, 4);
    }
    // excitement before leaving: a quick rock
    tx +=
      0.05 *
      Math.sin(t * 18) *
      bell(t, TL.leave.climb[0], TL.leave.climb[1], 0.2);
    // Shown for the whole run-in and run-out; the slab's clip planes cut it at
    // the edge, so it enters and leaves through the window instead of popping.
    const visible = here;
    const yaw = t * 0.35; // slow spin of the hull
    return { pos, tilt: [tx, tz], yaw, visible };
  }

  // ---- cows -------------------------------------------------------------------
  const RUN_STRIDE = 2.6; // metres per Run cycle at this scale (tuned on a strip)
  function cowState(i, t, us) {
    const c = COWS[i];
    const lift = TL.beams[i].lift;
    const drop = TL.ret.drops[i];
    const st = {
      pos: c.spot.clone(),
      yaw: c.yaw,
      pitch: 0,
      roll: 0,
      visible: true,
      weights: { Idle: 1 },
      phases: {},
      over: {},
      height: 0,
      squash: 1,
      lit: 0,
    };
    const idleT = t * idleRate + hash(i + 2) * 3;
    st.phases.Idle = idleT;
    const graze = {
      neckX: -1.35 + 0.06 * loopSin(t, 20, i),
      headX: 0.55 + 0.1 * Math.max(0, loopSin(t, 46, i * 2)),
      tail: 0.35 * loopSin(t, 14 + i, i * 1.3),
    };
    // alert: look up at the saucer, head turned to it
    const alertK = smooth(win(t, TL.alert[i], 0.5));
    const target = us.pos;
    const hy = 0.9 * Math.sin(lookYaw(st.pos, st.yaw, target)); // continuous: no flip when the saucer passes behind
    const alert = {
      neckX: 0.3,
      headX: 0.25,
      headY: hy * 0.7,
      tail: 0.15 * Math.sin(t * 7 + i),
    };

    // ---- before the lift
    if (t < lift[0] || (i === 2 && t < lift[0])) {
      let over = mix(graze, alert, alertK);
      if (i === 2 && t >= TL.bolt[0]) {
        // Bessie bolts toward the gate along her track, Run clip by distance
        const u = win(t, ...span(TL.bolt));
        const e =
          u < 0.15
            ? (u / 0.15) ** 2 * 0.15
            : u > 0.85
              ? 1 - ((1 - u) / 0.15) ** 2 * 0.15
              : u; // ease in/out
        const d = clamp(e, 0, 1) * bessieTrack.length;
        const at = bessieTrack.at(d);
        st.pos.copy(at.pos);
        const moving = t < TL.bolt[1];
        st.yaw = moving
          ? at.yaw
          : lerpAngle(
              bessieTrack.at(bessieTrack.length).yaw,
              -2.3,
              smooth(win(t, TL.bolt[1], 0.8)),
            );
        const runW = moving
          ? smooth(win(t, TL.bolt[0], 0.3)) *
            (1 - smooth(win(t, TL.bolt[1] - 0.35, 0.35)))
          : 0;
        st.weights = { Idle: 1 - runW, Run: runW };
        st.phases.Run = (d / RUN_STRIDE) * (cows[2].clips.Run?.dur ?? 1);
        over = mix(
          over,
          { neckX: -0.25, headX: 0.0, headY: 0, tail: 0.6 * Math.sin(t * 9) },
          runW,
        );
        if (!moving) {
          const tt = BESSIE_STOP;
          over = mix(
            alert,
            {
              ...alert,
              headY: 0.63 * Math.sin(lookYaw(tt, st.yaw, us.pos)),
              neckX: 0.45,
            },
            1,
          );
          over.tail = 0.5 * Math.sin(t * 6);
        }
      }
      if (i === 1 && t > TL.moves[0][0]) {
        // Clover freezes: legs locked, tail flicking, head up
        over = {
          ...over,
          legsFront: -0.08,
          legsBack: 0.08,
          tail: 0.5 * Math.sin(t * 11),
        };
      }
      st.over = over;
      if (i === 0)
        st.over.bell = 0.35 * Math.sin(t * 9) * alertK + 0.08 * loopSin(t, 20);
      // lit by the beam as it reaches the ground
      const bf = beamFor(t);
      if (bf && bf.b.kind === 'lift' && bf.b.idx === i) st.lit = bf.extend;
      return st;
    }
    // ---- lifted
    if (t < lift[1]) {
      const u = win(t, ...span(lift));
      const from = i === 2 ? BESSIE_STOP : c.spot;
      const top = HOVER[i].clone().add(V(0, HATCH_DY - 0.1, 0));
      const e = smooth(u) * 0.85 + u * 0.15;
      st.pos.set(
        lerp(from.x, top.x, e),
        lerp(0, top.y - 0.85, e),
        lerp(from.z, top.z, e),
      );
      st.yaw = (i === 2 ? -2.3 : c.yaw) + 1.3 * smooth(u);
      st.pitch = 1.15 * smooth(u) + 0.08 * Math.sin(t * 2.6 + i);
      st.roll = 0.22 * Math.sin(t * 1.7 + i);
      st.squash = 1 - 0.18 * smooth(win(u, 0.86, 0.14));
      st.weights = { Idle: 1 };
      const kick =
        i === 2 ? 0.55 * Math.sin(t * 14) : 0.18 * Math.sin(t * 5 + i);
      st.over = {
        neckX: -0.55,
        headX: 0.2,
        headY: 0.4 * Math.sin(t * 3),
        legsFront: -0.35 * smooth(win(u, 0, 0.2)),
        legsBack: 0.35 * smooth(win(u, 0, 0.2)),
        kick,
        tail: 0.7 * Math.sin(t * 6),
      };
      if (i === 0) st.over.bell = 0.7 * Math.sin(t * 10);
      st.lit = 1;
      st.height = st.pos.y;
      return st;
    }
    // ---- inside the saucer until the return
    if (t < drop[0]) {
      // carried inside the hull: hidden, but kept at the saucer, not on the grass
      st.visible = false;
      st.pos.copy(us.pos).add(V(0, HATCH_DY - 0.95, 0)); // where the lift ended
      if (t >= TL.ret.in[1])
        st.pos.add(
          V(c.spot.x - RET_HOVER.x, 0, c.spot.z - RET_HOVER.z)
            .normalize()
            .multiplyScalar(0.75),
        ); // where the drop begins
      return st;
    }

    if (t < drop[1]) {
      const u = win(t, ...span(drop));
      // each cow leaves the hatch from its own side, toward its own spot
      const top = RET_HOVER.clone().add(V(0, HATCH_DY - 0.1, 0));
      const away = V(c.spot.x - top.x, 0, c.spot.z - top.z)
        .normalize()
        .multiplyScalar(0.75);
      top.add(away);
      const e = smooth(u);
      st.pos.set(
        lerp(top.x, c.spot.x, e),
        lerp(top.y - 0.85, 0, e),
        lerp(top.z, c.spot.z, e),
      );
      st.yaw = c.yaw - 1.6 * (1 - smooth(u));
      st.pitch = 0.9 * (1 - smooth(u)) + 0.06 * Math.sin(t * 2.2 + i);
      st.roll = 0.18 * Math.sin(t * 1.5 + i) * (1 - u);
      st.squash = 1 - 0.18 * (1 - smooth(win(u, 0, 0.12)));
      st.over = {
        neckX: -0.4,
        headX: 0.1,
        legsFront: -0.3 * (1 - smooth(win(u, 0.7, 0.3))),
        legsBack: 0.3 * (1 - smooth(win(u, 0.7, 0.3))),
        kick: 0.12 * Math.sin(t * 4 + i) * (1 - u),
        tail: 0.5 * Math.sin(t * 5),
      };
      if (i === 0) st.over.bell = 0.5 * Math.sin(t * 8) * (1 - u);
      st.lit = 0.8;
      st.height = st.pos.y;
      return st;
    }
    // ---- landed: squash, dazed head shake, then back to grazing by the seam
    const a = t - drop[1];
    st.squash = 1 - 0.12 * spring(t, drop[1], 10, 6);
    const daze = {
      neckX: 0.1,
      headX: 0,
      headY: 0.3 * Math.sin(a * 9) * bell(a, 0.4, 1.8, 0.2, 0.4),
      tail: 0.3 * Math.sin(t * 4),
    }; // a dazed head shake
    st.over = mix(daze, graze, smooth(win(a, 1.2, 1.3))); // done by 45.75 for the last cow
    if (i === 0)
      st.over.bell =
        0.4 * Math.sin(a * 9) * bell(a, 0.0, 1.8, 0.1, 0.6) +
        0.08 * loopSin(t, 20);
    return st;
  }
  function mix(a, b, k) {
    const o = {};
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
      o[key] = lerp(a[key] ?? 0, b[key] ?? 0, k);
    return o;
  }

  // ---- farmer -------------------------------------------------------------------
  const F = TL.farmer;
  const gateSpot = () => farmerTrack.at(farmerTrack.length);
  function farmerState(t, us) {
    const st = {
      visible: true,
      pos: null,
      yaw: 0,
      pose: STAND,
      hat: 'head',
      lantern: true,
      swing: 0,
      moving: false,
    };
    if (t < F.out[0] || t >= F.hidden) {
      st.visible = false;
      st.pos = farmerTrack.at(0).pos;
      return st;
    }
    const face = (p) =>
      1.0 * Math.sin(lookYaw(p, st.yaw, us.visible ? us.pos : V(-4, 7, -12)));
    if (t < F.out[1]) {
      const u = win(t, ...span(F.out));
      const d = u * dStop;
      const at = farmerTrack.at(d);
      st.pos = at.pos;
      st.yaw = at.yaw;
      st.pose = { ...walkPose(d * 6.0), ...LANTERN_ARM };
      st.moving = true;
      st.swing = 0.25 * Math.sin(d * 6.0);
    } else if (t < F.look[1]) {
      const at = farmerTrack.at(dStop);
      st.pos = at.pos;
      st.yaw = at.yaw;
      const k = smooth(win(t, F.look[0], 0.35));
      st.pose = mixPose({ ...STAND, ...LANTERN_ARM }, LOOK_UP, k);
      st.pose.head = [st.pose.head[0], face(at.pos) * k, 0];
      st.swing = 0.2 * spring(t, F.look[0], 7, 3);
    } else if (t < F.jog[1]) {
      const u = win(t, ...span(F.jog));
      const e =
        u < 0.2
          ? (u / 0.2) ** 2 * 0.2
          : u > 0.85
            ? 1 - ((1 - u) / 0.15) ** 2 * 0.15
            : u;
      const d = lerp(dStop, farmerTrack.length, clamp(e, 0, 1));
      const at = farmerTrack.at(d);
      st.pos = at.pos;
      st.yaw = at.yaw;
      st.pose = {
        ...runPose(d * 4.6, { amp: 0.42, lean: 0.2 }),
        ...LANTERN_ARM,
        elbowL: [-0.7, 0, 0],
      };
      st.moving = true;
      st.swing = 0.35 * Math.sin(d * 4.6);
    } else if (t < F.back[0]) {
      const at = gateSpot();
      st.pos = at.pos;
      st.yaw = lerpAngle(at.yaw, PI / 2 + 0.1, smooth(win(t, F.jog[1], 0.5)));
      const base = { ...STAND, ...LANTERN_ARM, head: [-0.3, 0, 0] };
      let pose = base;
      if (t < F.point[0])
        pose = mixPose(
          base,
          { ...base, torso: [0.12 + 0.04 * Math.sin(t * 6), 0, 0] },
          bell(t, F.jog[1], F.point[0], 0.3),
        );
      // catch breath
      else if (t < F.point[1])
        pose = mixPose(base, POINT, bell(t, ...F.point, 0.3));
      else if (t < F.rage[0]) pose = base;
      else if (t < F.rage[1])
        pose = mixPose(
          base,
          mixPose(RAGE_A, RAGE_B, 0.5 + 0.5 * Math.sin(t * 13)),
          bell(t, ...F.rage, 0.35),
        );
      else if (t < F.grab[0]) pose = base;
      else if (t < F.grab[1] + 1.2)
        pose = mixPose(
          base,
          GRAB,
          bell(t, F.grab[0], F.grab[1] + 1.2, 0.18, 0.6),
        );
      else if (t < F.scratch[0])
        pose = mixPose(base, SLUMP, smooth(win(t, F.grab[1] + 1.2, 0.8)));
      else if (t < F.scratch[1])
        pose = mixPose(
          SLUMP,
          { ...SCRATCH, ...{ elbowR: [-2.1 + 0.25 * Math.sin(t * 16), 0, 0] } },
          bell(t, ...F.scratch, 0.3),
        );
      else
        pose = mixPose(
          SLUMP,
          { ...SLUMP, head: [0.3, 0, 0] },
          smooth(win(t, F.scratch[1], 0.3)),
        );
      st.pose = { ...pose };
      const hk = t < F.scratch[0] ? 1 : 0.3;
      st.pose.head = [
        st.pose.head[0],
        (st.pose.head[1] ?? 0) + face(at.pos) * hk,
        st.pose.head[2] ?? 0,
      ];
      st.swing =
        0.12 * Math.sin(t * 2.1) * (t > F.rage[0] && t < F.rage[1] ? 3 : 1);
      if (t >= F.hat) st.hat = 'flying';
    } else if (t < F.back[1]) {
      const u = win(t, ...span(F.back));
      const d = lerp(farmerTrack.length, 0.55, u);
      const at = farmerTrack.at(d);
      st.pos = at.pos;
      st.yaw = at.yaw + PI;
      st.pose = {
        ...walkPose(d * 6.4, { amp: 0.26, armAmp: 0.18, lean: 0.12 }),
        ...LANTERN_ARM,
        head: [0.3, 0, 0],
      };
      st.moving = true;
      st.swing = 0.2 * Math.sin(d * 6.4);
      st.hat = 'gone';
    } else {
      const at = farmerTrack.at(0.55);
      st.pos = at.pos;
      const k = smooth(win(t, ...span(F.turn)));
      st.yaw = lerpAngle(at.yaw + PI, at.yaw, k);
      st.pose = mixPose(
        { ...SLUMP, ...LANTERN_ARM },
        { ...REACH_DOOR, ...LANTERN_ARM },
        smooth(win(t, F.turn[1] - 0.2, 0.4)),
      );
      st.hat = 'gone';
    }
    return st;
  }

  // ---- update -------------------------------------------------------------------
  let hatStart = null;

  function update(T) {
    const t = ((T % LOOP) + LOOP) % LOOP;

    // saucer
    const us = ufoState(t);
    ufo.setPose(us.pos, us.yaw, us.tilt, us.visible);
    ufo.setHatch(hatchK(t));
    const bf = beamFor(t);
    if (bf) {
      const top = bf.b.at.clone();
      top.y = us.pos.y + HATCH_DY;
      top.x = us.pos.x;
      top.z = us.pos.z;
      const ret = bf.b.kind === 'return';
      ufo.setBeam(
        {
          top,
          length: top.y,
          rTop: UFO.hatchR * 0.92,
          rBottom: ret ? 3.3 : 1.7,
          k: bf.k,
          extend: bf.extend,
          ringK: bf.ringK,
        },
        t,
      );
    } else ufo.setBeam({ k: 0, extend: 0 }, t);
    for (let i = 0; i < 3; i++) {
      const b = TL.beams[i];
      const heat =
        t < b.down[1] ? 0 : t < b.up[1] ? 1 : Math.exp(-(t - b.up[1]) / 0.8);
      const burnt = win(t, b.down[1], 1.5) * (1 - win(t, b.up[1] + 3, 3));
      ufo.setScorch(i, HOVER[i], heat, burnt);
    }
    ufo.setScorch(3, RET_HOVER, 0, 0);

    // cows
    for (let i = 0; i < cows.length; i++) {
      const c = cows[i];
      const st = cowState(i, t, us);
      c.root.visible = st.visible;
      c.shadow.visible = st.visible;
      c.root.position.copy(st.pos); // placed even when hidden: no stale state
      c.shadow.position.set(st.pos.x, 0.018, st.pos.z);
      c.shadow.rotation.set(-PI / 2, 0, st.yaw);
      c.shadow.scale.set(1.25, 2.35, 1);
      if (!st.visible) continue;
      c.root.rotation.set(0, st.yaw, 0);
      c.lift.rotation.set(st.pitch, 0, st.roll);
      c.lift.scale.set(
        st.squash,
        1 / Math.max(0.7, st.squash) ** 0.5,
        st.squash,
      );
      c.animate(st.weights, st.phases, st.over);
      const hgt = st.height;
      c.shadow.position.set(
        st.pos.x,
        groundY(st.pos.x, st.pos.z) + 0.018,
        st.pos.z,
      );
      c.shadow.rotation.set(-PI / 2, 0, st.yaw);
      const fall = clamp(1 - hgt / 4.5, 0, 1);
      c.shadow.material.opacity = 0.62 * fall;
      c.shadow.scale.set(
        1.25 * (0.6 + 0.4 * fall),
        2.35 * (0.6 + 0.4 * fall),
        1,
      );
    }

    // farmer, hat, lantern
    const fs = farmerState(t, us);
    farmer.group.visible = fs.visible;
    farmer.shadow.visible = fs.visible;
    farmer.group.position.copy(fs.pos); // placed even when hidden: no stale state
    farmer.group.rotation.set(0, fs.yaw, 0);
    farmer.setPose(fs.pose);
    farmer.shadow.position.set(
      fs.pos.x,
      groundY(fs.pos.x, fs.pos.z) + 0.018,
      fs.pos.z,
    );
    farmer.shadow.scale.set(1, 0.82, 1);
    if (fs.visible) {
      farmer.shadow.position.set(
        fs.pos.x,
        groundY(fs.pos.x, fs.pos.z) + 0.018,
        fs.pos.z,
      );
      farmer.shadow.scale.set(1, 0.82, 1);
    }
    farmer.lanternInHand(fs.swing, fs.visible && fs.lantern);
    farmer.pool.position.y =
      groundY(farmer.pool.position.x, farmer.pool.position.z) + 0.02;
    farmer.flame.scale.set(0.8, 1.3 + 0.25 * loopSin(t, 60, 0.3), 0.8);
    farmer.light.intensity = 2.0 + 0.4 * loopSin(t, 53, 1.1);
    // hat: on the head until the gust; pops straight up, flutters, is drawn to
    // the beam's edge and spirals up into the hatch. Placed every frame, even
    // hidden, so no frame depends on the one before it.
    if (t < F.hat) {
      farmer.hatOnHead();
      farmer.hat.scale.setScalar(1.15);
      farmer.hat.visible = fs.visible;
    } else {
      if (!hatStart) {
        // the take-off point: the farmer as posed at the gust (pure)
        const s0 = farmerState(F.hat, ufoState(F.hat));
        farmer.group.position.copy(s0.pos);
        farmer.group.rotation.set(0, s0.yaw, 0);
        farmer.setPose(s0.pose);
        farmer.hatOnHead();
        hatStart = {
          p: farmer.hat.position.clone(),
          q: farmer.hat.quaternion.clone(),
        };
        farmer.group.position.copy(fs.pos);
        farmer.group.rotation.set(0, fs.yaw, 0);
        farmer.setPose(fs.pose);
      }
      // Three readable beats, all in front of the beam (toward the camera):
      // pop high off his head, flutter there while he reaches for it, then get
      // pulled across the beam's face and up into the hull, where the rim hides
      // it before it is switched off.
      const pop = hatStart.p.clone().add(V(0.35, 1.45, 0.45));
      const front = V(
        lerp(pop.x, HOVER[2].x, 0.7) + 0.5,
        3.4,
        lerp(pop.z, HOVER[2].z, 0.7) + 0.9,
      );
      const inside = HOVER[2].clone().add(V(0, -0.15, 0)); // within the hull
      const T0 = F.hat,
        T1 = F.hat + 0.6,
        T2 = F.hat + 1.25,
        T3 = F.hatIn;
      let p;
      let s = 1.15;
      if (t < T1) {
        const u = win(t, T0, T1 - T0);
        p = hatStart.p.clone().lerp(pop, easeOut(u));
      } else if (t < T2) {
        const u = win(t, T1, T2 - T1);
        // Zero at both ends: the flutter joins the pop and pull continuously.
        const envelope = Math.sin(PI * u);
        p = pop
          .clone()
          .add(
            V(
              0.12 * Math.sin(u * 12),
              0.08 * Math.sin(u * 7),
              0.06 * Math.cos(u * 9),
            ).multiplyScalar(envelope),
          );
      } else {
        const u = win(t, T2, T3 - T2);
        p = quad(pop, front, inside, smooth(u) * 0.75 + u * 0.25);
        s = 1.15 * (1 - 0.45 * smooth(win(u, 0.75, 0.25))); // sucked through the hatch
      }
      farmer.hat.position.copy(p);
      farmer.hat.scale.setScalar(s);
      farmer.hat.quaternion.copy(hatStart.q);
      farmer.hat.rotateY((t - T0) * 6);
      farmer.hat.rotateX(0.55 * Math.sin((t - T0) * 5));
      farmer.hat.visible = t < T3;
    }

    // barn
    const D = TL.doors;
    const doorK =
      t < D.open[0]
        ? 0
        : t < D.open[1]
          ? smooth(win(t, ...span(D.open)))
          : t < D.shut[0]
            ? 1
            : t < D.shut[1]
              ? 1 - smooth(win(t, ...span(D.shut)))
              : 0;
    barn.setDoors(doorK);
    barn.setLeak(1 - doorK);
    let lamp = 1;
    for (const [a, b] of TL.flicker)
      if (t >= a && t < b) lamp = hash(Math.floor(t * 14) + a) > 0.42 ? 1 : 0.2;
    barn.setLamp(lamp);
    const vane =
      0.25 * loopSin(t, 5, 0.3) +
      2 * PI * 5 * smooth(win(t, 5.0, 21)) +
      2 * PI * 2 * smooth(win(t, 36.5, 8));
    barn.setVane(vane);

    // windmill
    windmill.set(millAngle(t), millFactor(t), t);

    // set ambient: the wind picks up while any beam is on
    set.update(t, bf ? 0.6 * bf.extend : 0);

    // Watch the beam's ground mark, not the cow's spiral under the cockpit.
    // Authored easing removes target-switch snaps without frame-dependent lerp.
    const gaze = BEAMS.find((b) => t >= b.hatch[0] && t <= b.close[1]);
    const look = gaze ? V(gaze.at.x, 0, gaze.at.z) : null;
    const lookWeight = gaze
      ? bell(t, gaze.hatch[0], gaze.close[1], 0.9, 0.9)
      : 0;
    const excite =
      (bf ? 1 : 0) + bell(t, TL.leave.climb[0], TL.leave.out[1], 0.2);
    ufo.ambient(t, look, excite, lookWeight);
  }

  return {
    update,
    TL,
    ufoState,
    cowState,
    farmerState,
    farmerTrack,
    bessieTrack,
  };
}
