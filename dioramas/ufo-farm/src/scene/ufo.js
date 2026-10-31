import * as THREE from 'three';
import { C } from '../core/palette.js';
import { clamp, loopSin, hash, lerp } from '../config.js';
import { mesh, seg, softDiscTexture, haloPlane } from './detail.js';

export const UFO = { R: 2.8, hatchR: 1.0, bottomY: -0.48 };

function lathe(points, segs = 40) {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    segs,
  );
}

function bandTexture() {
  // Pale stripes on a cleared canvas, transparent gaps: never a black backing.
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 64, 256);
  for (let i = 0; i < 8; i++) {
    const y = i * 32;
    const g = ctx.createLinearGradient(0, y, 0, y + 32);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, 64, 32);
  }
  // vertical streaks
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(4 + i * 10, 0, 3, 256);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildUfo(scene, mats) {
  const group = new THREE.Group();
  group.name = 'ufo';
  scene.add(group);
  const body = new THREE.Group(); // tilts and bobs; group carries position
  group.add(body);

  // ---- hull ----------------------------------------------------------------
  mesh(
    body,
    lathe([
      [1.05, -0.48],
      [1.6, -0.42],
      [2.4, -0.22],
      [2.8, -0.02],
      [2.8, 0.04],
    ]),
    mats.hullDark,
    0,
    0,
    0,
  );
  mesh(
    body,
    lathe([
      [2.8, 0.04],
      [2.62, 0.2],
      [2.0, 0.36],
      [1.5, 0.44],
      [1.32, 0.5],
    ]),
    mats.hull,
    0,
    0,
    0,
  );
  mesh(
    body,
    new THREE.TorusGeometry(2.78, 0.09, 6, 48),
    mats.hullBright,
    0,
    0.02,
    0,
    { rotation: [Math.PI / 2, 0, 0] },
  );
  mesh(
    body,
    lathe([
      [1.34, 0.48],
      [1.36, 0.62],
      [1.18, 0.66],
    ]),
    mats.hullLit,
    0,
    0,
    0,
  );
  // panel ribs on the upper hull
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.13;
    const p0 = new THREE.Vector3(Math.cos(a) * 1.45, 0.47, Math.sin(a) * 1.45);
    const p1 = new THREE.Vector3(Math.cos(a) * 2.62, 0.21, Math.sin(a) * 2.62);
    seg(body, p0, p1, 0.035, 0.035, mats.hullBright, {
      segments: 4,
      castShadow: false,
    });
  }
  // rivet ring on the deck
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    mesh(
      body,
      new THREE.SphereGeometry(0.03, 4, 3),
      mats.hullDark,
      Math.cos(a) * 1.9,
      0.39,
      Math.sin(a) * 1.9,
      { castShadow: false },
    );
  }
  // rim chase lights
  const rim = [];
  const rimCols = [C.warm, C.cyan, C.magenta];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const m = new THREE.MeshBasicMaterial({
      color: rimCols[i % 3],
      toneMapped: false,
    });
    const s = mesh(
      body,
      new THREE.SphereGeometry(0.11, 8, 6),
      m,
      Math.cos(a) * 2.86,
      0.02,
      Math.sin(a) * 2.86,
      { castShadow: false },
    );
    rim.push(s);
  }
  // scorched dent + tally of three painted cows, on the camera side (+x+z)
  const story = new THREE.Group();
  story.rotation.y = -Math.PI / 4 - 0.35;
  body.add(story);
  mesh(
    story,
    new THREE.SphereGeometry(0.35, 8, 6),
    mats.scorch,
    2.15,
    0.27,
    0,
    { scale: [0.6, 0.18, 1] },
  );
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group();
    g.position.set(2.3, 0.2, 0.75 + i * 0.32);
    g.rotation.z = -0.38;
    story.add(g);
    mesh(g, new THREE.BoxGeometry(0.04, 0.14, 0.22), mats.cowWhite, 0, 0, 0, {
      castShadow: false,
    });
    mesh(
      g,
      new THREE.BoxGeometry(0.045, 0.08, 0.08),
      mats.cowBlack,
      0,
      0.02,
      0.04,
      { castShadow: false },
    );
  }

  // ---- dome + pilot + antenna ---------------------------------------------
  // cockpit floor: without it the glass looks into the empty hull and the post
  // pass reads the hole as a cut-out (white stipple)
  mesh(body, new THREE.CircleGeometry(1.2, 32), mats.hullDark, 0, 0.6, 0, {
    rotation: [-Math.PI / 2, 0, 0],
    castShadow: false,
  });
  mesh(
    body,
    new THREE.TorusGeometry(0.85, 0.04, 4, 24),
    mats.cyan ?? mats.hullBright,
    0,
    0.62,
    0,
    { rotation: [Math.PI / 2, 0, 0], castShadow: false },
  );
  const pilot = new THREE.Group();
  pilot.position.y = 0.62;
  body.add(pilot);
  mesh(
    pilot,
    new THREE.CylinderGeometry(0.3, 0.36, 0.3, 12),
    mats.hullDark,
    0,
    0.15,
    0,
  ); // seat
  const alienHead = new THREE.Group();
  alienHead.name = 'alien-head';
  alienHead.position.y = 0.55;
  pilot.add(alienHead);
  mesh(
    pilot,
    new THREE.CylinderGeometry(0.1, 0.16, 0.36, 8),
    mats.alien,
    0,
    0.32,
    0,
  );
  mesh(
    alienHead,
    new THREE.SphereGeometry(0.22, 12, 10),
    mats.alien,
    0,
    0.08,
    0,
    { scale: [1.15, 1.0, 1.0] },
  );
  for (const s of [-1, 1]) {
    mesh(
      alienHead,
      new THREE.SphereGeometry(0.075, 8, 6),
      mats.alienEye,
      s * 0.09,
      0.09,
      0.17,
      { scale: [1, 1.35, 0.6], castShadow: false },
    );
    seg(
      alienHead,
      new THREE.Vector3(s * 0.08, 0.25, 0),
      new THREE.Vector3(s * 0.16, 0.42, 0.02),
      0.012,
      0.012,
      mats.alien,
      { segments: 3, castShadow: false },
    );
    mesh(
      alienHead,
      new THREE.SphereGeometry(0.035, 6, 4),
      mats.beam3 ?? mats.alien,
      s * 0.16,
      0.43,
      0.02,
      { castShadow: false },
    );
  }
  // Opaque inner wall (back faces only) so the bubble always writes full alpha,
  // even where it overlaps the paper; the pilot sits between it and the glass.
  const inner = mesh(
    body,
    new THREE.SphereGeometry(1.18, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    mats.glassBack,
    0,
    0.62,
    0,
    { castShadow: false },
  );
  inner.scale.set(1, 0.82, 1);
  const dome = mesh(
    body,
    new THREE.SphereGeometry(1.2, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    mats.dome,
    0,
    0.62,
    0,
    { castShadow: false },
  );
  dome.scale.set(1, 0.82, 1);
  dome.renderOrder = 2;
  // Glass must write full alpha, or the post pass reads it as a cut-out rim and
  // stipples it white (the coverage gather sees alpha < 1).
  dome.material = mats.dome.clone();
  dome.material.blending = THREE.CustomBlending;
  dome.material.blendSrc = THREE.SrcAlphaFactor;
  dome.material.blendDst = THREE.OneMinusSrcAlphaFactor;
  dome.material.blendSrcAlpha = THREE.OneFactor;
  dome.material.blendDstAlpha = THREE.OneFactor;
  // two reflection streaks so the glass reads as glass
  for (const [a, w] of [
    [-0.9, 0.5],
    [-0.55, 0.22],
  ]) {
    const st = mesh(
      body,
      new THREE.BoxGeometry(0.06, w, 0.02),
      mats.hullBright,
      Math.cos(a) * 0.95 + 0.0,
      1.18,
      Math.sin(a) * 0.95 + 0.62,
      { castShadow: false },
    );
    st.lookAt(0, 1.2, 0);
  }
  const antTip = new THREE.MeshBasicMaterial({
    color: C.magenta,
    toneMapped: false,
  });
  seg(
    body,
    new THREE.Vector3(0, 1.5, 0),
    new THREE.Vector3(0, 2.05, 0),
    0.025,
    0.018,
    mats.hullBright,
    { segments: 4 },
  );
  mesh(body, new THREE.SphereGeometry(0.06, 6, 4), mats.hullBright, 0, 1.6, 0);
  const tip = mesh(
    body,
    new THREE.SphereGeometry(0.075, 8, 6),
    antTip,
    0,
    2.08,
    0,
    { castShadow: false },
  );

  // ---- underside: gear pods + hatch collar + iris --------------------------
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const p = new THREE.Group();
    p.position.set(Math.cos(a) * 1.85, -0.36, Math.sin(a) * 1.85);
    body.add(p);
    mesh(
      p,
      new THREE.CylinderGeometry(0.18, 0.13, 0.22, 10),
      mats.hullDark,
      0,
      -0.08,
      0,
    );
    mesh(
      p,
      new THREE.CylinderGeometry(0.2, 0.2, 0.04, 10),
      mats.hullBright,
      0,
      -0.2,
      0,
    );
  }
  // open collar (no front face), dark bore with a back disc, two lip rings
  mesh(
    body,
    new THREE.CylinderGeometry(
      UFO.hatchR + 0.08,
      UFO.hatchR + 0.14,
      0.18,
      32,
      1,
      true,
    ),
    mats.hullBright,
    0,
    -0.52,
    0,
    { side: THREE.DoubleSide },
  );
  const boreMat = mats.bore.clone();
  boreMat.side = THREE.DoubleSide;
  mesh(
    body,
    new THREE.CylinderGeometry(UFO.hatchR, UFO.hatchR, 0.5, 32, 1, true),
    boreMat,
    0,
    -0.32,
    0,
    { castShadow: false },
  );
  const backMat = new THREE.MeshBasicMaterial({
    color: C.ink,
    toneMapped: false,
  });
  const back = mesh(
    body,
    new THREE.CircleGeometry(UFO.hatchR, 32),
    backMat,
    0,
    -0.1,
    0,
    { rotation: [Math.PI / 2, 0, 0], castShadow: false },
  );
  mesh(
    body,
    new THREE.TorusGeometry(UFO.hatchR + 0.12, 0.05, 6, 32),
    mats.hullDark,
    0,
    -0.6,
    0,
    { rotation: [Math.PI / 2, 0, 0] },
  );
  const lipMat = new THREE.MeshBasicMaterial({
    color: C.beam1,
    toneMapped: false,
  });
  mesh(
    body,
    new THREE.TorusGeometry(UFO.hatchR - 0.02, 0.035, 4, 32),
    lipMat,
    0,
    -0.55,
    0,
    { rotation: [Math.PI / 2, 0, 0], castShadow: false },
  );
  const iris = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.set(
      Math.cos(a) * UFO.hatchR,
      -0.6,
      Math.sin(a) * UFO.hatchR,
    );
    pivot.rotation.y = -a;
    body.add(pivot);
    const petal = new THREE.Shape();
    petal.moveTo(0, -0.55);
    petal.lineTo(-UFO.hatchR * 1.02, 0);
    petal.lineTo(0, 0.55);
    petal.closePath();
    const g = new THREE.ShapeGeometry(petal);
    g.rotateX(Math.PI / 2);
    const pm = mesh(pivot, g, mats.hullLit, 0, 0, 0, { castShadow: false });
    pm.material = mats.hullLit.clone();
    pm.material.side = THREE.DoubleSide;
    iris.push(pivot);
  }
  // underside glow ring (thrusters), pulses on its own
  const thrustMat = new THREE.MeshBasicMaterial({
    color: C.cyan,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const thrust = mesh(
    body,
    new THREE.TorusGeometry(1.9, 0.06, 4, 40),
    thrustMat,
    0,
    -0.3,
    0,
    { rotation: [Math.PI / 2, 0, 0], castShadow: false },
  );

  // ---- beam (world space) ----------------------------------------------------
  const beam = new THREE.Group();
  beam.name = 'beam';
  scene.add(beam);
  const tex = bandTexture();
  const coneGeo = new THREE.CylinderGeometry(1, 1, 1, 40, 1, true);
  coneGeo.translate(0, -0.5, 0); // origin at the top: scale.y = length downwards
  const coneMat = new THREE.MeshBasicMaterial({
    color: C.beam2,
    map: tex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  beam.add(cone);
  const coreMat = new THREE.MeshBasicMaterial({
    color: C.beam3,
    map: tex,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const core = new THREE.Mesh(coneGeo, coreMat);
  beam.add(core);
  const shellMat = new THREE.MeshBasicMaterial({
    color: C.beam0,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const shell = new THREE.Mesh(coneGeo, shellMat); // the darker halo edge
  beam.add(shell);
  const poolMat = new THREE.MeshBasicMaterial({
    map: softDiscTexture('63,210,127'),
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), poolMat);
  pool.rotation.x = -Math.PI / 2;
  beam.add(pool);
  const ringMat = new THREE.MeshBasicMaterial({
    color: C.beam3,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 40), ringMat);
  ring.rotation.x = -Math.PI / 2;
  beam.add(ring);
  // rising motes: grass bits and sparks
  const motes = [];
  const moteGeo = new THREE.BoxGeometry(0.07, 0.07, 0.07);
  const moteMat = new THREE.MeshBasicMaterial({
    color: C.beam4,
    toneMapped: false,
  });
  const strawMat = mats.hayLit;
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(moteGeo, i % 3 === 0 ? strawMat : moteMat);
    m.scale.set(i % 3 === 0 ? 1.6 : 1, i % 3 === 0 ? 0.5 : 1, 1);
    beam.add(m);
    motes.push(m);
  }
  const spot = new THREE.SpotLight(C.beam3, 0, 12, 0.32, 0.55, 1.2);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -0.0004;
  spot.shadow.camera.near = 1;
  spot.shadow.camera.far = 12;
  scene.add(spot);
  scene.add(spot.target);

  // A scorched ring left in the grass at each lift spot; cools, then fades.
  const scorchRings = [];
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group();
    scene.add(g);
    const hot = new THREE.Mesh(
      new THREE.RingGeometry(1.25, 1.55, 40),
      new THREE.MeshBasicMaterial({
        color: C.beam1,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    hot.rotation.x = -Math.PI / 2;
    hot.position.y = 0.012;
    g.add(hot);
    const burnt = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.6, 40),
      new THREE.MeshBasicMaterial({
        color: C.earthDark,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    burnt.rotation.x = -Math.PI / 2;
    burnt.position.y = 0.01;
    g.add(burnt);
    scorchRings.push({ g, hot, burnt });
  }

  const tmp = new THREE.Vector3();
  return {
    group,
    body,
    alienHead,
    beam,
    spot,
    scorchRings,

    setPose(pos, yaw, tilt, visible) {
      group.visible = visible;
      group.position.copy(pos);
      group.rotation.set(0, 0, 0);
      body.rotation.set(tilt[0], 0, tilt[1]);
      body.rotateY(yaw);
    },

    setHatch(k) {
      for (const p of iris) {
        p.children[0].position.x = -0.0;
        p.scale.set(1 - 0.85 * k, 1, 1 - 0.85 * k);
        p.visible = k < 0.98;
      }
      back.visible = true;
    },

    setBeam(st, t) {
      const on = st.k > 0.01 && st.extend > 0.01;
      beam.visible = on;
      spot.intensity = on ? 46 * st.k : 0;
      if (!on) {
        // parked, not left wherever the last beam was
        beam.position.set(0, 0, 0);
        for (const m of [cone, core, shell]) m.scale.set(1, 1, 1);
        pool.position.set(0, 0, 0);
        pool.scale.set(1, 1, 1);
        ring.position.set(0, 0, 0);
        ring.scale.set(1, 1, 1);
        for (const m of motes) {
          m.position.set(0, 0, 0);
          m.rotation.set(0, 0, 0);
          m.visible = false;
        }
        spot.position.set(0, 6, 0);
        spot.target.position.set(0, 0, 0);
        spot.target.updateMatrixWorld();
        return;
      }
      const len = st.length * st.extend;
      const r1 = st.rTop + (st.rBottom - st.rTop) * st.extend;
      beam.position.copy(st.top);
      // A cylinder with different top/bottom radii is a cone: scale x/z per end
      // by swapping in a fresh geometry only when radii change much.
      const g = cone.geometry;
      if (
        g.userData.r0 !== st.rTop ||
        Math.abs((g.userData.r1 ?? 0) - r1) > 0.01
      ) {
        const ng = new THREE.CylinderGeometry(st.rTop, r1, 1, 40, 1, true);
        ng.translate(0, -0.5, 0);
        ng.userData = { r0: st.rTop, r1 };
        cone.geometry.dispose();
        cone.geometry = ng;
        shell.geometry = ng;
        const cg = new THREE.CylinderGeometry(
          st.rTop * 0.45,
          r1 * 0.35,
          1,
          24,
          1,
          true,
        );
        cg.translate(0, -0.5, 0);
        core.geometry.dispose();
        core.geometry = cg;
      }
      cone.scale.set(1, len, 1);
      shell.scale.set(1.03, len, 1.03);
      core.scale.set(1, len, 1);
      tex.offset.y = (t * 1.6) % 1; // bands travel upward
      tex.repeat.set(3, Math.max(1, len / 1.4));
      coneMat.opacity = 0.5 * st.k;
      coreMat.opacity = 0.55 * st.k;
      shellMat.opacity = 0.3 * st.k;
      const ground = st.extend > 0.98;
      pool.visible = ground;
      pool.position.set(0, -st.length + 0.02, 0);
      pool.scale.set(st.rBottom * 2.8, st.rBottom * 2.8, 1);
      poolMat.opacity = 0.8 * st.k;
      ring.visible = ground;
      ring.position.set(0, -st.length + 0.03, 0);
      const rk = st.ringK ?? 0;
      ring.scale.setScalar(st.rBottom * (0.9 + rk * 0.7));
      ringMat.opacity = 0.9 * (1 - rk) * st.k;
      for (let i = 0; i < motes.length; i++) {
        const ph = (t * (0.32 + hash(i) * 0.25) + hash(i + 7)) % 1;
        const a = hash(i + 3) * Math.PI * 2 + t * (0.8 + hash(i) * 0.6);
        const y = -st.length * (1 - ph) * st.extend;
        const rr =
          (st.rTop + (st.rBottom - st.rTop) * (1 - ph)) *
          (0.25 + hash(i + 11) * 0.55);
        motes[i].position.set(Math.cos(a) * rr, y, Math.sin(a) * rr);
        motes[i].rotation.set(t * 3 + i, t * 2 + i * 0.7, 0);
        motes[i].visible = ph > 0.04 && ph < 0.94 && st.extend > 0.9;
      }
      spot.position.copy(st.top);
      spot.target.position.set(st.top.x, st.top.y - st.length, st.top.z);
      spot.target.updateMatrixWorld();
      spot.angle = Math.atan2(st.rBottom * 1.1, st.length);
    },
    setScorch(i, center, heat, burnt) {
      const s = scorchRings[i];
      s.g.position.set(center.x, 0, center.z);
      s.g.visible = heat > 0.01 || burnt > 0.01;
      s.hot.material.opacity = 0.75 * heat;
      s.burnt.material.opacity = 0.65 * burnt;
    },

    ambient(t, lookAt, excite = 0, lookWeight = 0) {
      const step = Math.floor(t / (excite > 0.5 ? 0.06 : 0.1));
      for (let i = 0; i < rim.length; i++) {
        const on = (i + step) % 4 === 0 || (i + step) % 4 === 1;
        rim[i].visible = on || excite > 0.9;
      }
      tip.visible = Math.floor(t * 2) % 2 === 0;
      thrustMat.opacity = 0.25 + 0.15 * Math.sin(t * 9);
      const idleYaw = 0.32 * loopSin(t, 3, 0.2);
      let yaw = idleYaw;
      let pitch = 0;
      if (lookAt) {
        group.updateMatrixWorld();
        tmp.copy(lookAt);
        alienHead.parent.worldToLocal(tmp);
        tmp.sub(alienHead.position);
        // A target beneath the cockpit has no meaningful horizontal bearing.
        // A softened lateral glance avoids atan2's rear-axis flip and stays
        // inside a natural neck range, even as the saucer banks and turns.
        const targetYaw = (0.4 * tmp.x) / Math.hypot(tmp.x, tmp.z, 3);
        const targetPitch = clamp(
          Math.atan2(-tmp.y, Math.hypot(tmp.x, tmp.z, 3)),
          -0.2,
          0.42,
        );
        const weight = clamp(lookWeight, 0, 1);
        yaw = lerp(idleYaw, targetYaw, weight);
        pitch = targetPitch * weight;
      }
      alienHead.rotation.set(pitch, yaw, 0, 'YXZ');
    },
  };
}
