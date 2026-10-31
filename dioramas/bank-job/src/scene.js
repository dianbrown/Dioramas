import { transfer, toWorld, SEAT_ROOT_Y } from './lib/scene/transfer.js';
import {
  V,
  M,
  C,
  THREE,
  group,
  box,
  ball,
  bar,
  person,
  place,
  STAND,
  SEATED,
  walkPose,
  mixPose,
  lerp,
  win,
  bell,
  clamp,
} from './lib/kit.js';
import { buildSet } from './set.js';
import { vehicle } from './car.js';
import { STOPS, sedanX, policeX } from './motion.js';
import { exhaust } from './effects.js';
import {
  CREW_STANDS,
  CREW_LOADS,
  CREW_OUT,
  CREW_IN,
  APPROACH,
  RETURN,
  approaches,
  returns,
  follow,
  buildTrack,
} from './choreography.js';
export const BEATS = {
  arrival: [0, 3],
  crewOut: [3.3, 5.9],
  entry: [7.7, 10.6],
  alarm: [11.6, 36.8],
  return: [16.6, 20.2],
  load: [20.2, 22.1],
  crewIn: [22.2, 25.2],
  escape: [25.5, 28.3],
  police: [26, 28.6],
  investigate: [30, 37],
  returnPolice: [37, 42],
  depart: [42.5, 46.1],
};
export function buildScene(scene) {
  const fx = exhaust(scene),
    set = buildSet(scene),
    sedan = vehicle(scene, 'getaway-sedan'),
    patrols = [
      vehicle(scene, 'cruiser-one', true),
      vehicle(scene, 'cruiser-two', true),
    ];
  const robbers = Array.from({ length: 3 }, (_, i) =>
    person(scene, 'crew-' + i, { top: M.ink, bottom: M.ink, skin: M.ink }),
  );
  const officers = Array.from({ length: 4 }, (_, i) =>
    person(scene, 'officer-' + i, { top: M.navy, bottom: M.navy, cap: M.navy }),
  );
  const driver = person(scene, 'driver', { top: M.ink, bottom: M.ink });
  robbers.forEach((a) => {
    ball(a.joints.head, 0.134, M.ink, 0, 0.105, 0);
    box(a.joints.head, 0.13, 0.035, 0.035, M.skin, 0, 0.13, 0.12);
  });
  officers.forEach((a) =>
    box(a.joints.torso, 0.055, 0.07, 0.02, M.gold, -0.09, 0.33, 0.15),
  );
  const bags = robbers.map((a, i) => {
    const g = group(scene, 'loot-' + i);
    const sack = ball(g, 0.18, M.plank, 0, 0.19, 0);
    sack.scale.set(1, 1.25, 0.85);
    const neck = ball(g, 0.07, M.plank, 0, 0.39, 0);
    neck.scale.set(0.8, 1.1, 0.8);
    bar(g, V(-0.065, 0.34, 0), V(0.065, 0.34, 0), 0.025, M.leather);
    return g;
  });
  const bases = [
    { x: -3.25, z: 2.55, yaw: Math.PI / 2 },
    { x: STOPS.rear, z: 2.55, yaw: Math.PI / 2 },
    { x: STOPS.lead, z: 2.55, yaw: Math.PI / 2 },
  ];
  const seats = [
    { x: -0.4, z: 0.3, y: SEAT_ROOT_Y },
    { x: -0.4, z: -0.65, y: SEAT_ROOT_Y },
    { x: 0.4, z: -0.65, y: SEAT_ROOT_Y },
  ];
  const stands = CREW_STANDS.map((p) => V(...p));
  const policeMoves = officers.map((a, i) => {
    const j = Math.floor(i / 2),
      rank = [2, 3, 0, 1][i],
      base = bases[j + 1],
      seat = { x: -0.4, z: i % 2 ? -0.65 : 0.3, y: SEAT_ROOT_Y },
      stand = toWorld(base, -2, seat.z - (i % 2 ? 0.7 : 0.3));
    const out = (j === 1 ? 28.4 : 29.2) + (i % 2) * 0.3,
      back = [40.6, 41, 39.5, 39.9][i],
      doorAt = 32 + rank * 0.9;
    const door = V(1.04 + rank * 0.13, 0.688, -1.28),
      inside = V(1.04 + rank * 0.13, 0.688, -2.4);
    const approach = buildTrack([
      [out + 1.15, ...stand.toArray()],
      [doorAt - 1.3, 0.65 + rank * 0.15, 0, 3.6],
      [doorAt - 0.55, 1 + rank * 0.15, 0.16, 0.65],
      [doorAt, ...door.toArray()],
      [doorAt + 0.65, ...inside.toArray()],
    ]);
    const retreat = buildTrack([
      [36.8 + rank * 0.18, ...inside.toArray()],
      [37.2 + rank * 0.18, ...door.toArray()],
      [38 + rank * 0.1, 0.2 + rank * 0.45, 0, 3.7 + rank * 0.25],
      [back - 0.25, ...stand.toArray()],
    ]);
    return { base, seat, stand, out, back, approach, retreat, rank };
  });
  function seat(a, b, s) {
    const p = toWorld(b, s.x, s.z);
    place(a, p.x, s.y, p.z, b.yaw, SEATED);
    a.shadow.visible = false;
  }
  function move(a, from, to, t, start, end, carry = false) {
    const u = win(t, start, end);
    let points = [from, to];
    // Walk round parked bodywork, never diagonally through the cabin.
    for (const b of t < 26 ? [bases[0]] : bases.slice(1)) {
      const next = [points[0]];
      for (let k = 1; k < points.length; k++) {
        const a = points[k - 1],
          z = points[k];
        let hit = false;
        for (let j = 1; j < 20; j++) {
          const q = a.clone().lerp(z, j / 20);
          if (Math.abs(q.x - b.x) < 2.45 && Math.abs(q.z - b.z) < 1.12)
            hit = true;
        }
        if (hit) {
          const edge = (a.x + z.x) / 2 < b.x ? b.x - 2.65 : b.x + 2.65;
          next.push(V(edge, a.y, a.z), V(edge, z.y, z.z));
        }
        next.push(z);
      }
      points = next;
    }
    const lengths = points.slice(1).map((p, i) => p.distanceTo(points[i])),
      total = lengths.reduce((a, b) => a + b, 0);
    let distance = u * total,
      idx = 0;
    while (idx < lengths.length - 1 && distance > lengths[idx])
      distance -= lengths[idx++];
    const a0 = points[idx],
      b0 = points[idx + 1],
      p = a0.clone().lerp(b0, lengths[idx] ? distance / lengths[idx] : 0),
      yaw = Math.atan2(b0.x - a0.x, b0.z - a0.z);
    const pose = walkPose(u * total * 5.8, { amp: 0.33, armAmp: 0.3 });
    if (carry) {
      pose.shoulderR = [0, 0, 0.1];
      pose.elbowR = [-0.2, 0, 0];
    }
    place(a, p.x, p.y, p.z, yaw, pose);
  }
  function climb(a, t, start, base, s, stand, inward, side = Math.sign(s.x)) {
    const q = transfer(t, start, 1.15, base, side, s, stand, 0, inward);
    place(a, ...q.pos.toArray(), q.yaw, q.pose);
  }
  function update(t) {
    fx.update(t);
    const sx = sedanX(t),
      sb = { ...bases[0], x: sx };
    sedan.update(
      sx,
      2.55,
      t,
      [
        bell(t, 3, 5.35, 0.25) + bell(t, 22.85, 24.45, 0.25),
        bell(t, 3.1, 5.65, 0.25) + bell(t, 23.3, 25.4, 0.25),
        0,
        0,
      ],
      bell(t, 19.6, 22.5, 0.4),
    );
    seat(driver, sb, { x: 0.4, z: 0.3, y: SEAT_ROOT_Y });
    robbers.forEach((a, i) => {
      const s = seats[i],
        stand = stands[i],
        out = CREW_OUT[i],
        entry = CREW_IN[i],
        load = V(...CREW_LOADS[i]);
      const loadPose = (at) => {
        const k = bell(at, 20.25 + i * 0.25, 21 + i * 0.25, 0.25);
        return {
          ...STAND,
          torso: [0.1 * k, 0, 0],
          shoulderR: [-1.2 * k, 0, 0.1],
          elbowR: [-0.6 * k, 0, 0],
        };
      };
      if (t < out || t >= entry + 1.15) seat(a, sb, s);
      else if (t < out + 1.15) climb(a, t, out, bases[0], s, stand, false, -1);
      else if (t < APPROACH[i][0][0])
        place(a, ...stand.toArray(), Math.PI / 2, STAND);
      else if (t < 17.1 + i * 0.18) follow(a, approaches[i], t);
      else if (t < RETURN[i].at(-1)[0]) follow(a, returns[i], t, true);
      else if (t < 22.2 + i * 0.12)
        place(a, ...load.toArray(), Math.PI / 2, loadPose(t));
      else if (t < entry) move(a, load, stand, t, 22.2 + i * 0.12, entry);
      else climb(a, t, entry, bases[0], s, stand, true, -1);
      a.group.updateMatrixWorld(true);
      const bag = bags[i],
        release = 20.65 + i * 0.25,
        land = release + 0.5;
      bag.visible = t >= 17.1 + i * 0.18 && t < 29;
      const slot = toWorld(sb, (i - 1) * 0.42, -1.73);
      if (t < release) {
        const p = a.joints.wristR.getWorldPosition(V());
        bag.position.copy(p).add(V(0, -0.42, 0));
        bag.rotation.set(0, a.group.rotation.y, 0);
      } else if (t < land) {
        const u = win(t, release, land);
        place(a, ...load.toArray(), Math.PI / 2, loadPose(release));
        a.group.updateMatrixWorld(true);
        const launch = a.joints.wristR
          .getWorldPosition(V())
          .add(V(0, -0.42, 0));
        place(a, ...load.toArray(), Math.PI / 2, loadPose(t));
        a.group.updateMatrixWorld(true);
        bag.position.copy(launch).lerp(V(slot.x, 0.52, slot.z), u);
        bag.position.y += Math.sin(u * Math.PI) * 0.5;
        bag.rotation.set(u * 2, 0, u);
      } else {
        bag.position.set(slot.x, 0.52, slot.z);
        bag.rotation.set(0, Math.PI / 2, 0);
      }
    });
    patrols.forEach((c, j) => {
      const near = policeMoves
        .slice(j * 2, j * 2 + 2)
        .map((m) =>
          Math.min(
            1,
            bell(t, m.out - 0.2, m.out + 1.65, 0.25) +
              bell(t, m.back - 0.2, m.back + 1.4, 0.25),
          ),
        );
      c.update(policeX(t, j), 2.55, t, [...near, 0, 0]);
    });
    officers.forEach((a, i) => {
      const m = policeMoves[i],
        live = { ...m.base, x: patrols[Math.floor(i / 2)].root.position.x };
      if (t < m.out || t >= m.back + 1.15) seat(a, live, m.seat);
      else if (t < m.out + 1.15)
        climb(a, t, m.out, m.base, m.seat, m.stand, false);
      else if (t < 36.8 + m.rank * 0.18) follow(a, m.approach, t);
      else if (t < m.back - 0.25) follow(a, m.retreat, t);
      else if (t < m.back) place(a, ...m.stand.toArray(), Math.PI / 2, STAND);
      else climb(a, t, m.back, m.base, m.seat, m.stand, true);
    });
    const doorOpen = Math.min(
      1,
      bell(t, 8.6, 10.6, 0.25) +
        bell(t, 15.9, 21.2, 0.25) +
        bell(t, 31.6, 38, 0.25),
    );
    set.doors.forEach(
      (d, i) => (d.rotation.y = (i === 0 ? -1 : 1) * doorOpen * 2.6),
    );
    const alarm = t >= 11.6 && t < 36.8;
    set.alarmWindows.forEach((w, i) => {
      w.material.color.set(alarm ? C.coral : C.teal);
      w.material.emissive.set(alarm ? C.red : C.black);
      w.material.emissiveIntensity = alarm
        ? 0.25 + 0.2 * Math.sin(t * 8 + i)
        : 0;
    });
  }
  return {
    update,
    effects: fx,
    entrance: set,
    beats: BEATS,
    entities: Object.fromEntries([
      ['sedan', sedan.root],
      ...patrols.map((a, i) => ['cruiser' + i, a.root]),
      ...robbers.map((a, i) => ['robber' + i, a.group]),
      ...officers.map((a, i) => ['officer' + i, a.group]),
    ]),
    movers: [sedan, ...patrols].map((a) => ({
      name: a.root.name,
      group: a.root,
    })),
  };
}
