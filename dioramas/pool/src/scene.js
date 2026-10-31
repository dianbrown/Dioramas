import {
  THREE,
  C,
  M,
  V,
  group,
  mesh,
  box,
  cyl,
  ball,
  bar,
  ring,
  shadow,
  person,
  place,
  STAND,
  walkPose,
  mixPose,
  clamp,
  lerp,
  win,
  hash,
} from '../../shared/kit.js';
const TAU = Math.PI * 2,
  LOOP = 64;
export function buildScene(scene) {
  const set = group(scene, 'pool');
  const deckMat = new THREE.MeshStandardMaterial({
    color: '#87867d',
    roughness: 1,
  });

  for (const z of [-4.5, 4.5]) box(set, 17, 0.15, 2, deckMat, 0, -0.08, z, 0);
  for (const x of [-7.5, 7.5]) box(set, 2, 0.15, 7, deckMat, x, -0.08, 0, 0);
  // Finish the cut-out with a thin edge, not exposed 1.5 m walls.
  for (const z of [-5.45, 5.45])
    box(set, 17, 0.16, 0.1, M.slate, 0, -0.11, z, 0);
  for (const x of [-8.45, 8.45])
    box(set, 0.1, 0.16, 11, M.slate, x, -0.11, 0, 0);

  for (let x = -8; x <= 8; x += 0.8)
    for (let z = -5; z <= 5; z += 0.8) {
      if (Math.abs(x) < 6.85 && Math.abs(z) < 3.85) continue;
      box(set, 0.76, 0.006, 0.018, M.shade, x, 0.003, z, 0);
      box(set, 0.018, 0.006, 0.76, M.shade, x - 0.39, 0.003, z + 0.37, 0);
    }
  const fleckGeo = new THREE.BoxGeometry(0.045, 0.008, 0.045);
  for (let i = 0; i < 1800; i++) {
    const x = (hash(i) * 2 - 1) * 8.4,
      z = (hash(i + 2100) * 2 - 1) * 5.4;
    if (Math.abs(x) < 6.8 && Math.abs(z) < 3.8) continue;
    mesh(set, fleckGeo, [M.cement, M.shade, M.fog][i % 3], x, 0.008, z);
  }
  box(set, 13, 0.12, 7, M.teal, 0, -1.45, 0);
  for (const s of [-1, 1]) {
    box(set, 13, 1.4, 0.1, M.teal, 0, -0.75, s * 3.5);
    box(set, 0.1, 1.4, 7, M.teal, s * 6.5, -0.75, 0);
    box(set, 13.65, 0.1, 0.32, M.cream, 0, 0.02, s * 3.65);
    box(set, 0.32, 0.1, 7.3, M.cream, s * 6.65, 0.02, 0);
  }
  for (let x = -6.4; x <= 6.5; x += 0.3)
    for (const z of [-3.505, 3.505])
      box(set, 0.11, 0.08, 0.02, M.aqua, x, -0.09, z, 0);
  for (let z = -3.3; z < 3.5; z += 0.3)
    for (const x of [-6.505, 6.505])
      box(set, 0.02, 0.08, 0.11, M.aqua, x, -0.09, z, 0);
  const geo = new THREE.PlaneGeometry(12.96, 6.96, 90, 48);
  geo.rotateX(-Math.PI / 2);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  for (let i = 0; i < geo.attributes.position.count; i++) {
    const col = new THREE.Color('#55adb0');
    col.multiplyScalar(0.93 + hash(i) * 0.14);
    col.toArray(colors, i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const water = mesh(
    set,
    geo,
    new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      vertexColors: true,
      roughness: 0.24,
      metalness: 0,
      transparent: true,
      opacity: 0.74,
      depthWrite: false,
      clearcoat: 0.6,
    }),
    0,
    -0.16,
    0,
  );
  water.renderOrder = 5;
  water.castShadow = false;
  // Analytic caustics: a physical surface still receives shadows, while its
  // pigment pattern flows continuously and reproduces exactly after seeking.
  const waterTime = { value: 0 };
  water.material.onBeforeCompile = (shader) => {
    shader.uniforms.uPoolTime = waterTime;
    shader.vertexShader = 'varying vec2 vPoolXZ;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n vPoolXZ=position.xz;',
    );
    shader.fragmentShader =
      'varying vec2 vPoolXZ; uniform float uPoolTime;\n' +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
   vec2 p=vPoolXZ; float phase=uPoolTime*6.28318530718/64.0;
   p += 0.23*vec2(sin(p.y*2.7+phase*2.0),cos(p.x*2.1-phase*2.0));
   float wave=sin(p.x*3.6+p.y*2.1+phase*8.0)+sin(p.x*1.8-p.y*4.2-phase*6.0);
   float fine=sin(p.x*13.0+sin(p.y*6.0+phase*4.0))+sin(p.y*14.0+sin(p.x*5.0-phase*4.0));
   float caustic=pow(max(0.0,1.0-abs(wave)*0.62),5.0);
   diffuseColor.rgb *= 0.87 + 0.23*caustic + 0.045*fine;
  `,
    );
  };
  water.material.customProgramCacheKey = () => 'pool-caustics-v1';

  function ladder(x, z, side) {
    const g = group(set, 'ladder', x, 0, z);
    for (const dx of [-0.28, 0.28]) {
      const pts = [
        V(dx, -0.9, -side * 0.3),
        V(dx, 0.4, -side * 0.3),
        V(dx, 0.62, 0),
        V(dx, 0.4, side * 0.32),
        V(dx, 0.04, side * 0.32),
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      mesh(g, new THREE.TubeGeometry(curve, 24, 0.026, 6, false), M.chrome);
      cyl(g, 0.09, 0.025, M.chrome, dx, 0.06, side * 0.32);
    }
    for (let i = 0; i < 4; i++)
      bar(
        g,
        V(-0.28, -0.8 + i * 0.3, -side * 0.3),
        V(0.28, -0.8 + i * 0.3, -side * 0.3),
        0.03,
        M.chrome,
      );
  }
  ladder(-4.5, -3.55, -1);
  ladder(3.2, 3.55, 1);
  const board = group(set, 'springboard', 7.5, 0, 0.8);
  for (const x of [-0.25, 0.25]) {
    box(board, 0.13, 0.47, 0.68, M.slate, x, 0.24, 0);
    bar(board, V(x, 0.05, -0.3), V(x - 0.45, 0.48, -0.3), 0.045, M.metal);
  }
  const pivot = group(board, 'board-flex', 0.2, 0.52, 0);
  box(pivot, 3.45, 0.1, 0.68, M.cream, -1.65, 0, 0);
  box(pivot, 3.25, 0.012, 0.52, M.metal, -1.65, 0.057, 0, 0);
  for (const z of [-0.28, 0.28])
    box(pivot, 0.4, 0.014, 0.035, M.cream, -3, 0.065, z, 0);
  const towel = group(set, 'towel', 1, 0, 4.5);
  box(towel, 2.4, 0.02, 0.9, M.cream, 0, 0.025, 0, 0);
  for (const x of [-1, -0.8, 0.8, 1])
    box(towel, 0.1, 0.012, 0.9, M.aqua, x, 0.04, 0, 0);
  const sun = person(scene, 'sunbather', {
    swim: true,
    top: M.coral,
    skin: M.skin,
  });
  const guard = person(scene, 'lifeguard', {
    swim: true,
    top: M.teal,
    skin: M.skinDark,
    cap: M.cream,
  });
  // The guard wears a teal singlet; keep bare legs and arms from the aquatic rig.
  guard.joints.torso.children[0].material = M.teal;
  const lap = person(scene, 'lap-swimmer', {
    swim: true,
    top: M.navy,
    skin: M.skin,
  });
  const diver = person(scene, 'diver', {
    swim: true,
    top: M.sky,
    skin: M.skin,
  });
  const wader = person(scene, 'wader', {
    swim: true,
    top: M.coral,
    skin: M.skinDark,
  });
  const buoy = group(scene, 'lifebuoy', -5, -0.06, 1.5);
  ring(buoy, 0.34, 0.095, M.cream);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const m = box(
      buoy,
      0.24,
      0.16,
      0.22,
      M.coral,
      Math.cos(a) * 0.34,
      0,
      Math.sin(a) * 0.34,
    );
    m.rotation.y = -a;
  }
  const beach = group(scene, 'beach-ball', -4.9, 0.04, -0.65);
  ball(beach, 0.13, M.cream);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ball(
      beach,
      0.077,
      i % 2 ? M.gold : M.coral,
      Math.cos(a) * 0.075,
      0,
      Math.sin(a) * 0.075,
    );
  }
  for (const x of [4.8, 5.9]) {
    const drain = cyl(set, 0.15, 0.02, M.slate, x, -1.36, 2.1);
  }
  box(set, 0.35, 0.08, 0.16, M.aqua, -2.7, 0.07, 4.15);
  box(set, 0.2, 0.05, 0.14, M.cream, -2.62, 0.11, 4.15);
  const wakes = Array.from({ length: 36 }, () => {
    const m = ring(
      scene,
      1,
      0.014,
      new THREE.MeshBasicMaterial({
        color: C.foam,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    );
    m.renderOrder = 6;
    m.castShadow = false;
    return m;
  });
  const spray = Array.from({ length: 60 }, (_, i) => {
    const m = ball(
      scene,
      0.022 + hash(i) * 0.024,
      new THREE.MeshBasicMaterial({ color: C.foam }),
    );
    m.renderOrder = 6;
    m.castShadow = false;
    return m;
  });
  const splashRings = Array.from({ length: 4 }, () => {
    const m = ring(
      scene,
      1,
      0.024,
      new THREE.MeshBasicMaterial({
        color: C.foam,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    m.renderOrder = 6;
    m.castShadow = false;
    return m;
  });
  // With the prone root rotated +PI/2, positive shoulder X carries the hand
  // FORWARD above water and BACK underwater. Negative X reverses the crawl.
  // Flex the recovering elbow (sin(phase)>0), then extend into the catch.
  function swimPose(t) {
    const a = (t * TAU * 51) / 64;
    return {
      ...STAND,
      torso: [0, 0.06 * Math.sin(a), 0],
      head: [-0.23, 0.18 * Math.sin(a), 0],
      shoulderL: [a, 0, -0.13],
      shoulderR: [a + Math.PI, 0, 0.13],
      elbowL: [-0.25 - 0.45 * Math.max(0, Math.sin(a)), 0, 0],
      elbowR: [-0.25 - 0.45 * Math.max(0, -Math.sin(a)), 0, 0],
      hipL: [0.16 * Math.sin(a * 2), 0, 0],
      hipR: [-0.16 * Math.sin(a * 2), 0, 0],
      kneeL: [0.16 + 0.1 * Math.sin(a * 2), 0, 0],
      kneeR: [0.16 - 0.1 * Math.sin(a * 2), 0, 0],
    };
  }

  function lapAt(t) {
    const a = TAU * (t / 32 + 0.25);
    return {
      x: 4.35 * Math.cos(a),
      z: 1.6 * Math.sin(a),
      yaw: Math.atan2(-4.35 * Math.sin(a), 1.6 * Math.cos(a)),
    };
  }
  function swim(actor, x, z, yaw, t, y = -0.13) {
    place(
      actor,
      x - Math.sin(yaw) * 0.8,
      y,
      z - Math.cos(yaw) * 0.8,
      yaw,
      swimPose(t),
    );
    actor.group.rotation.set(Math.PI / 2, yaw, 0, 'YXZ');
    actor.shadow.visible = false;
  }
  const swimRoute = new THREE.CatmullRomCurve3([
    V(1.8, 0, 0.8),
    V(-3.8, 0, 1.1),
    V(-4.5, 0, -1.6),
    V(0.2, 0, -1.9),
    V(4.1, 0, -1.2),
    V(1, 0, 1),
    V(-4.5, 0, -2.9),
  ]);
  function diveAt(t) {
    const u = clamp((t - 4.5) / 25.5),
      p = swimRoute.getPoint(u),
      v = swimRoute.getTangent(u);
    return { x: p.x, z: p.z, yaw: Math.atan2(v.x, v.z) };
  }
  function update(t) {
    const a = lapAt(t);
    swim(lap, a.x, a.z, a.yaw, t);
    const g = (TAU * t) / 32,
      gx = -1.5 + 3.6 * Math.sin(g);
    place(
      guard,
      gx,
      0,
      -4.45,
      Math.atan2(Math.cos(g), 0.04),
      walkPose((gx + 5.1) * 6, {
        amp: 0.3 * Math.abs(Math.cos(g)),
        armAmp: 0.22,
      }),
    );
    place(wader, -6, -0.72, 2.45, Math.PI / 2, {
      ...STAND,
      head: [-0.12, 0.13 * Math.sin(g), 0],
      shoulderL: [-0.4, 0, -0.2],
      shoulderR: [-0.45 + 0.12 * Math.sin(g * 2), 0, 0.18],
    });
    wader.shadow.visible = false;
    place(sun, 0.15, 0.16, 4.5, -Math.PI / 2, {
      ...STAND,
      shoulderL: [-2.8, 0, -0.14],
      shoulderR: [-2.8, 0, 0.14],
      kneeL: [0.1, 0, 0],
    });
    sun.group.rotation.set(-Math.PI / 2, -Math.PI / 2, 0, 'YXZ');
    sun.shadow.visible = false;
    const flex =
      t < 2.8
        ? -0.018 * Math.sin(t * 7) * win(t, 1.5, 2)
        : -0.025 * Math.sin((t - 2.8) * 9) * Math.exp(-(t - 2.8) * 3);
    pivot.rotation.z = flex;
    if (t < 2.8) {
      const k = win(t, 2.1, 2.65);
      place(diver, 4.7, 0.57 - 3 * Math.sin(flex), 0.8, -Math.PI / 2, {
        ...STAND,
        torso: [lerp(0.03, -0.15, k), 0, 0],
        kneeL: [0.05 + 0.3 * k, 0, 0],
        kneeR: [0.05 + 0.3 * k, 0, 0],
        shoulderL: [lerp(0.02, -2.9, k), 0, -0.1],
        shoulderR: [lerp(0.02, -2.9, k), 0, 0.1],
      });
    } else if (t < 4.5) {
      const u = clamp((t - 2.8) / 1.05);
      const tilt = lerp(
        lerp(0, 2.8, win(t, 2.8, 3.7)),
        Math.PI / 2,
        win(t, 3.85, 4.5),
      );
      const center = V(
        lerp(4.7, 1.8, u),
        lerp(
          1.37 + 1.2 * Math.sin(Math.PI * u) - 2.0 * u,
          -0.65,
          win(t, 3.85, 4.5),
        ),
        0.8,
      );
      place(
        diver,
        center.x,
        center.y,
        center.z,
        -Math.PI / 2,
        mixPose(
          {
            ...STAND,
            shoulderL: [-3, 0, -0.06],
            shoulderR: [-3, 0, 0.06],
            hipL: [-0.25 * Math.sin(u * Math.PI), 0, 0],
            hipR: [-0.25 * Math.sin(u * Math.PI), 0, 0],
          },
          swimPose(t + 0.5),
          win(t, 3.85, 4.5),
        ),
      );
      const swimYaw = diveAt(4.5).yaw;
      diver.group.rotation.set(
        tilt,
        lerp(-Math.PI / 2, swimYaw, win(t, 3.85, 4.5)),
        0,
        'YXZ',
      );
      diver.group.position.sub(V(0, 0.8, 0).applyEuler(diver.group.rotation));
      diver.shadow.visible = false;
    } else if (t < 30) {
      const p = diveAt(t);
      swim(
        diver,
        p.x,
        p.z,
        p.yaw,
        t + 0.5,
        lerp(-0.65, -0.13, win(t, 4.5, 5.5)),
      );
    } else if (t < 33) {
      const end = diveAt(30),
        approach = win(t, 30, 30.85),
        climb = win(t, 30.85, 32.6),
        over = win(t, 32.3, 33);
      const yaw =
          end.yaw +
          Math.atan2(Math.sin(Math.PI - end.yaw), Math.cos(Math.PI - end.yaw)) *
            approach,
        tilt = ((1 - approach) * Math.PI) / 2;
      const climbPose = {
        ...STAND,
        shoulderL: [-2.5 + 0.25 * Math.sin(t * 7), 0, -0.12],
        shoulderR: [-2.5 - 0.25 * Math.sin(t * 7), 0, 0.12],
        elbowL: [-0.55, 0, 0],
        elbowR: [-0.55, 0, 0],
        hipL: [-0.45 - 0.25 * Math.sin(t * 7), 0, 0],
        hipR: [-0.45 + 0.25 * Math.sin(t * 7), 0, 0],
        kneeL: [0.65 + 0.3 * Math.sin(t * 7), 0, 0],
        kneeR: [0.65 - 0.3 * Math.sin(t * 7), 0, 0],
      };
      const pose = mixPose(
        mixPose(swimPose(t + 0.5), climbPose, approach),
        STAND,
        over,
      );
      const center = V(
        -4.5,
        lerp(-0.13, 0.8, climb),
        lerp(lerp(-2.9, -3.25, approach), -4.1, over),
      );
      place(diver, ...center.toArray(), yaw, pose);
      diver.group.rotation.set(tilt, yaw, 0, 'YXZ');
      diver.group.position.sub(V(0, 0.8, 0).applyEuler(diver.group.rotation));
      diver.shadow.visible = false;
    } else if (t < 44) {
      const d = ((t - 33) / 11) * 19.7;
      let x,
        z,
        y = 0,
        yaw;
      if (d < 12) {
        x = -4.5 + d;
        z = -4.1;
        yaw = Math.PI / 2;
      } else if (d < 16.9) {
        x = 7.5;
        z = -4.1 + d - 12;
        yaw = 0;
      } else {
        x = 7.5 - (d - 16.9);
        z = 0.8;
        yaw = -Math.PI / 2;
        y = 0.57 * win(d, 16.9, 18);
      }
      place(diver, x, y, z, yaw, walkPose(d * 5, { amp: 0.33, armAmp: 0.2 }));
    } else {
      place(diver, 4.7, 0.57, 0.8, -Math.PI / 2, STAND);
    }
    buoy.position.y = -0.08 + 0.018 * Math.sin(g * 4);
    buoy.rotation.z = 0.04 * Math.sin(g * 3);
    beach.position.y = 0.01 + 0.02 * Math.sin(g * 5);
    beach.rotation.y = g;
    waterTime.value = t;
    wakes.forEach((m, i) => {
      const which = i < 18 ? 0 : 1,
        age = (((t * 2 + i / 18) % 1) + 1) % 1,
        then = t - age * 1.5,
        p = which ? diveAt(then) : lapAt(then);
      m.visible = !which || (t > 5.5 && t < 30);
      m.position.set(p.x, -0.14, p.z);
      m.scale.set(0.1 + age * 0.38, 0.06 + age * 0.25, 1);
      m.material.opacity = (1 - age) * 0.34;
    });
    const age = t - 3.85;
    spray.forEach((m, i) => {
      const a = hash(i) * TAU,
        s = 0.25 + hash(i + 3) * 1.1;
      m.position.set(
        1.8 + Math.cos(a) * s * age,
        -0.14 + (1.2 + hash(i + 8) * 1.2) * age - 3.8 * age * age,
        0.8 + Math.sin(a) * s * age,
      );
      m.visible = age >= 0 && age < 0.8 && m.position.y >= -0.16;
    });
    splashRings.forEach((m, i) => {
      const a = age - i * 0.14;
      m.visible = a >= 0 && a < 2;
      m.position.set(1.8, -0.14, 0.8);
      m.scale.setScalar(0.12 + Math.max(0, a) * 0.7);
      m.material.opacity = 0.5 * (1 - clamp(a / 2));
    });
  }
  return {
    update,
    swimmers: { swimmer: lap, diver },
    entities: {
      swimmer: lap.group,
      diver: diver.group,
      lifeguard: guard.group,
      wader: wader.group,
      sunbather: sun.group,
      buoy,
      ball: beach,
    },
  };
}
export { LOOP };
