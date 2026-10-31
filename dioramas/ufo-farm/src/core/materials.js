import * as THREE from 'three';
import { C, assertPalette } from './palette.js';

const lit = (hex, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color: assertPalette(hex),
    roughness: opts.roughness ?? 0.86,
    metalness: opts.metalness ?? 0.0,
    flatShading: opts.flat ?? false,
    side: opts.side ?? THREE.FrontSide,
  });
const glow = (hex, opts = {}) =>
  new THREE.MeshBasicMaterial({
    color: assertPalette(hex),
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    depthWrite: opts.depthWrite ?? true,
    blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    side: opts.side ?? THREE.FrontSide,
    toneMapped: false,
  });

export function createMaterials() {
  const m = {
    // ground
    grass: lit(C.grass2, { roughness: 0.95 }),
    grassDark: lit(C.grass1, { roughness: 0.95 }),
    grassLit: lit(C.grass3, { roughness: 0.95 }),
    tuft: lit(C.grass4, { roughness: 0.95 }),
    slabSide: lit(C.earth, { roughness: 1 }),
    slabSideDark: lit(C.earthDark, { roughness: 1 }),
    dirt: lit(C.dirt, { roughness: 1 }),
    dirtDark: lit(C.earth, { roughness: 1 }),
    mud: lit(C.earthDark, { roughness: 0.6 }),
    concrete: lit(C.grey, { roughness: 0.95 }),
    concreteDark: lit(C.slate, { roughness: 0.95 }),
    stone: lit(C.whiteShade, { roughness: 0.95 }),
    // barn and wood
    barnRed: lit(C.red2, { roughness: 0.9 }),
    barnRedDark: lit(C.red1, { roughness: 0.9 }),
    barnRedLit: lit(C.red3, { roughness: 0.9 }),
    trim: lit(C.white, { roughness: 0.85 }),
    roof: lit(C.nightSlate, { roughness: 0.9 }),
    roofDark: lit(C.nightDark, { roughness: 0.9 }),
    wood: lit(C.wood1, { roughness: 0.92 }),
    woodDark: lit(C.wood0, { roughness: 0.92 }),
    woodLit: lit(C.wood2, { roughness: 0.92 }),
    woodPale: lit(C.wood3, { roughness: 0.92 }),
    hay: lit(C.hay1, { roughness: 1 }),
    hayLit: lit(C.hay2, { roughness: 1 }),
    hayDark: lit(C.hay0, { roughness: 1 }),
    iron: lit(C.nightDark, { roughness: 0.6, metalness: 0.3 }),
    steel: lit(C.grey, { roughness: 0.5, metalness: 0.4 }),
    galv: lit(C.whiteShade, { roughness: 0.45, metalness: 0.45 }),
    millRed: lit(C.red3, { roughness: 0.7 }),
    rag: lit(C.denim1, { roughness: 1 }),
    // interior and practicals
    interior: glow(C.amber),
    interiorDark: glow(C.pumpkinDark),
    interiorHay: glow(C.hay3),
    bulb: glow(C.bulb),
    warm: glow(C.warm),
    window: glow(C.warm),
    // water
    water: new THREE.MeshStandardMaterial({
      color: C.water1,
      roughness: 0.15,
      metalness: 0.1,
    }),
    waterDark: lit(C.water0, { roughness: 0.2 }),
    stream: glow(C.water1, { transparent: true, opacity: 0.85 }),
    // saucer
    hull: lit(C.metal1, { roughness: 0.35, metalness: 0.6 }),
    hullLit: lit(C.metal2, { roughness: 0.3, metalness: 0.6 }),
    hullDark: lit(C.metal0, { roughness: 0.4, metalness: 0.5 }),
    hullBright: lit(C.metal3, { roughness: 0.3, metalness: 0.5 }),
    scorch: lit(C.nightSlate, { roughness: 0.9 }),
    dome: new THREE.MeshStandardMaterial({
      color: C.glass1,
      roughness: 0.08,
      metalness: 0.2,
      transparent: true,
      opacity: 0.55,
    }),
    glassBack: lit(C.glass0, { roughness: 0.3, side: THREE.BackSide }),
    bore: glow(C.ink),
    alien: glow(C.beam1), // lit by the cockpit glow, so the pilot reads through the glass
    alienEye: glow(C.ink),
    // cast
    cowWhite: lit(C.moon, { roughness: 0.9, flat: true }),
    cowBlack: lit(C.deep, { roughness: 0.9, flat: true }),
    cowPink: lit(C.pink, { roughness: 0.9, flat: true }),
    cowBrown: lit(C.brown, { roughness: 0.9, flat: true }),
    tag: lit(C.tag, { roughness: 0.6 }),
    brass: lit(C.tag, { roughness: 0.35, metalness: 0.5 }),
    leather: lit(C.earth, { roughness: 0.8 }),
    pumpkin: lit(C.pumpkin, { roughness: 0.8 }),
    pumpkinDark: lit(C.pumpkinDark, { roughness: 0.8 }),
    vine: lit(C.grass3, { roughness: 0.9 }),
    burlap: lit(C.hay1, { roughness: 1 }),
    ink: lit(C.ink, { roughness: 0.9 }),
  };
  m.cloth = {
    plaid: lit(C.red3, { roughness: 0.95 }),
    plaidDark: lit(C.red1, { roughness: 0.95 }),
    denim: lit(C.denim0, { roughness: 0.95 }),
    denimLit: lit(C.denim1, { roughness: 0.95 }),
    straw: lit(C.hay2, { roughness: 1 }),
    strawDark: lit(C.hay1, { roughness: 1 }),
  };
  // The hat must read against a dark barn at night: brightest straw plus a
  // little self-light from the same family, so it never sinks into the bales.
  m.hatStraw = lit(C.hay3, { roughness: 0.9 });
  m.hatStraw.emissive.setHex(C.hay1);
  m.hatStraw.emissiveIntensity = 0.55;
  m.skin = lit(C.skin, { roughness: 0.8 });
  m.skinTones = [m.skin];
  m.hair = [lit(C.wood3, { roughness: 0.9 })];
  m.eye = lit(C.ink, { roughness: 0.5 });
  m.mouth = lit(C.brownDark, { roughness: 0.8 });
  m.bone = lit(C.white, { roughness: 0.8 });
  m.steelDark = lit(C.nightDark, { roughness: 0.5, metalness: 0.3 });
  return m;
}

export { lit, glow };
