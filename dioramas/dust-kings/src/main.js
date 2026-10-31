import { run } from './engine.js';
import { M, win, mergeStatic } from './kit.js';
import { buildArena } from './arena.js';
import { buildTruck } from './trucks.js';
import { buildCrowd } from './crowd.js';
import { buildEffects } from './effects.js';
import { truckState } from './timeline.js';
import { surfaceHeight, LAYOUT } from './layout.js';
run((scene, camera) => {
  const arena = buildArena(scene);
  const trucks = [
    buildTruck(scene, 'redTruck', M.red, M.redLight),
    buildTruck(scene, 'goldTruck', M.yellow, M.gold),
  ];
  const crowd = buildCrowd(scene),
    effects = buildEffects(scene, camera, trucks, crowd);
  arena.displays.forEach((d) => (d.userData.noMerge = true));
  mergeStatic(arena.root);
  trucks.forEach((t) => mergeStatic(t.root));
  mergeStatic(crowd.crowd);
  crowd.crew.forEach((a) => mergeStatic(a.g));
  function update(t) {
    trucks.forEach((truck, i) =>
      truck.pose(truckState(t, i), (x, z) => surfaceHeight(x, z, t)),
    );
    arena.displays.forEach(
      (d, i) =>
        (d.visible = i === (t < 6 ? 0 : t < 27.4 ? 1 : t < 32.8 ? 2 : 3)),
    );
    arena.banners.forEach((f, i) => {
      f.rotation.y = 0.15 * Math.sin(t * 2 + i);
      f.rotation.z = 0.035 * Math.sin(t * 3 + i);
    });
    const impact = win(t, 27.3, 27.65),
      eject = win(t, 27.3, 27.6),
      settle = win(t, 32.1, 33);
    const tilt = 1.5 * impact + 0.6 * settle,
      sx = 1 - 0.35 * impact - 0.2 * settle,
      sy = 1 - 0.6 * impact;
    arena.cream.rotation.z = tilt;
    arena.cream.scale.set(sx, sy, 1);
    // Squash the struck cabin, then let the flattened wagon settle after the
    // truck rolls away. It remains in the aftermath, as it does in the video.
    const floorY =
      2.3 * sx * Math.sin(tilt) +
      Math.max(0, -1.35 * sy * Math.cos(tilt)) +
      0.04;
    const y =
      1.3 * (1 - impact) + floorY * impact + 0.25 * Math.sin(Math.PI * impact);
    arena.cream.position.set(
      0.1 + 3.3 * eject - 0.8 * settle,
      y,
      LAYOUT.wreck.tealZ + 3.2 * eject,
    );
    const crush = win(t, 27.35, 27.75);
    arena.red.scale.y = arena.teal.scale.y = 1 - 0.277 * crush;
    crowd.update(t);
    effects.update(t);
  }
  return {
    update,
    trucks,
    arena,
    surfaceHeight,
    crew: crowd.crew,
    entities: {
      redTruck: trucks[0].root,
      goldTruck: trucks[1].root,
      crew: crowd.responder.g,
      crowd: crowd.crowd,
      crushCar: arena.cream,
    },
    movers: trucks.map((tr, i) => ({
      name: i ? 'goldTruck' : 'redTruck',
      group: tr.root,
      allowSpawn: true,
    })),
  };
});
