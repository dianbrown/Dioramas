import { THREE, C, V, clamp } from './lib/kit.js';
import { preserveProjection } from './calibration.js';
import { sedanX } from './motion.js';
export function exhaust(scene) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d'),
    radial = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  radial.addColorStop(0, 'rgba(255,255,255,1)');
  radial.addColorStop(0.4, 'rgba(255,255,255,.75)');
  radial.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = radial;
  g.fillRect(0, 0, 64, 64);
  const map = new THREE.CanvasTexture(c);
  const puffs = Array.from({ length: 5 }, (_, i) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map,
        color: C.white,
        transparent: true,
        depthWrite: false,
      }),
    );
    sprite.name = 'exhaust-' + i;
    scene.add(sprite);
    return { sprite, birth: 25.7 + i * 0.13 };
  });
  const lightCanvas = document.createElement('canvas');
  lightCanvas.width = lightCanvas.height = 64;
  const lc = lightCanvas.getContext('2d'),
    lg = lc.createRadialGradient(32, 32, 0, 32, 32, 32);
  lg.addColorStop(0, 'rgba(255,255,255,1)');
  lg.addColorStop(0.7, 'rgba(255,255,255,.85)');
  lg.addColorStop(1, 'rgba(255,255,255,0)');
  lc.fillStyle = lg;
  lc.fillRect(0, 0, 64, 64);
  const lightMap = new THREE.CanvasTexture(lightCanvas);
  const spill = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.65),
    new THREE.MeshBasicMaterial({
      map: lightMap,
      color: C.rose,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  spill.name = 'alarm-pavement-spill';
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(...preserveProjection([0.727, 0.172, 0.228]));
  scene.add(spill);
  const targets = [
    [-0.48, 0.025, 2.268],
    [0.397, 0.025, 2.277],
    [1.402, 0.025, 2.068],
  ];
  const notes = targets.map((target, i) => {
    const group = new THREE.Group();
    group.name = 'loose-note-' + i;
    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.19),
      new THREE.MeshBasicMaterial({ color: C.chrome, side: THREE.DoubleSide }),
    );
    paper.rotation.x = -Math.PI / 2;
    group.add(paper);
    const ink = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.07),
      new THREE.MeshBasicMaterial({ color: C.green, side: THREE.DoubleSide }),
    );
    ink.rotation.x = -Math.PI / 2;
    ink.position.y = 0.002;
    group.add(ink);
    scene.add(group);
    return {
      group,
      birth: 26.3 + i * 0.15,
      flight: 0.7 + i * 0.1,
      target: V(...preserveProjection(target)),
    };
  });
  const fx = {
    enabled: true,
    puffs,
    spill,
    notes,
    update(t) {
      for (const { sprite, birth } of puffs) {
        const raw = (t - birth) / 0.85,
          u = clamp(raw);
        sprite.visible = fx.enabled && raw >= 0 && raw < 1;
        sprite.position.set(
          sedanX(birth) -
            2.12 -
            u * 0.65 +
            (2.002124 + 3.37313 * (birth - 25.5)) * (u * 0.85) * 0.85,
          0.25 + u * 0.25,
          2.55 + 0.65,
        );
        sprite.scale.setScalar(0.35 + 1.5 * u);
        sprite.material.opacity = 0.8 * (1 - u);
      }
      spill.visible = fx.enabled && t >= 11.6 && t < 36.8;
      spill.material.opacity = 0.95 + 0.05 * Math.sin(t * 8);
      notes.forEach(({ group, birth, flight, target }, i) => {
        group.visible = fx.enabled && t >= birth;
        const u = clamp((t - birth) / flight),
          start = V(sedanX(birth) - 1.8, 0.9, 2.55);
        group.position.copy(start).lerp(target, u);
        group.position.y += Math.sin(u * Math.PI) * 0.65;
        group.rotation.set(
          (1 - u) * Math.sin(u * 8 + i) * 1.2,
          u * 2.1 + i * 0.6,
          (1 - u) * Math.cos(u * 11 + i) * 0.9,
        );
      });
    },
  };
  return fx;
}
