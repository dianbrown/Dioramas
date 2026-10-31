export const PALETTE_HEX = [
  // 0-9 paper, moonlit whites, night slates
  '#ffffff',
  '#e9edf3',
  '#c6cfdb',
  '#9aa6b8',
  '#6f7c92',
  '#4a556b',
  '#333c50',
  '#252c3d',
  '#1a1f2c',
  '#121520',
  // 10-15 grass, deep to moonlit
  '#1c2a27',
  '#233a30',
  '#2d4a39',
  '#3a5c43',
  '#4a704f',
  '#62885e',
  // 16-20 earth and dirt path
  '#2a221d',
  '#3a2e26',
  '#4f3f32',
  '#66533f',
  '#84705a',
  // 21-25 barn reds
  '#3b1719',
  '#571f1f',
  '#7a2a26',
  '#9c3a2e',
  '#c0533c',
  // 26-29 weathered wood
  '#3f3832',
  '#5a4e43',
  '#786959',
  '#9b8a72',
  // 30-33 hay and straw
  '#5e4c26',
  '#86703a',
  '#b0974d',
  '#d8c06e',
  // 34-38 practical light, amber, pumpkin
  '#ffe7a8',
  '#ffc46e',
  '#e8913f',
  '#b8642a',
  '#dd7a2c',
  // 39-42 saucer metal
  '#5c6880',
  '#8391a8',
  '#adbacb',
  '#d7e0ea',
  // 43-47 tractor beam greens
  '#0f5a3a',
  '#1d8a55',
  '#3fd27f',
  '#8af2b0',
  '#d2ffe0',
  // 48-49 dome glass
  '#23505a',
  '#3c7c84',
  // 50-51 cow pink
  '#c96f78',
  '#e8a2a6',
  // 52-56 skin, Clover's red-brown coat
  '#e2b48e',
  '#b47e5c',
  '#7c5038',
  '#a0603a',
  '#c98552',
  // 57-58 denim
  '#2d4669',
  '#44689a',
  // 59-60 rim-light accents
  '#d0549a',
  '#5fd3e6',
  // 61-62 tank water
  '#2f5f73',
  '#4f8ea2',
  // 63 ear-tag yellow / brass
  '#e6c23a',
];

export const PALETTE_RGB = PALETTE_HEX.map((hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
});

export const C = {
  paper: 0xffffff,
  moon: 0xe9edf3,
  white: 0xc6cfdb,
  whiteShade: 0x9aa6b8,
  grey: 0x6f7c92,
  slate: 0x4a556b,
  nightSlate: 0x333c50,
  nightDark: 0x252c3d,
  deep: 0x1a1f2c,
  ink: 0x121520,
  grass0: 0x1c2a27,
  grass1: 0x233a30,
  grass2: 0x2d4a39,
  grass3: 0x3a5c43,
  grass4: 0x4a704f,
  grass5: 0x62885e,
  earthDark: 0x2a221d,
  earth: 0x3a2e26,
  dirt: 0x4f3f32,
  dirtLit: 0x66533f,
  dirtWarm: 0x84705a,
  red0: 0x3b1719,
  red1: 0x571f1f,
  red2: 0x7a2a26,
  red3: 0x9c3a2e,
  red4: 0xc0533c,
  wood0: 0x3f3832,
  wood1: 0x5a4e43,
  wood2: 0x786959,
  wood3: 0x9b8a72,
  hay0: 0x5e4c26,
  hay1: 0x86703a,
  hay2: 0xb0974d,
  hay3: 0xd8c06e,
  bulb: 0xffe7a8,
  warm: 0xffc46e,
  amber: 0xe8913f,
  pumpkinDark: 0xb8642a,
  pumpkin: 0xdd7a2c,
  metal0: 0x5c6880,
  metal1: 0x8391a8,
  metal2: 0xadbacb,
  metal3: 0xd7e0ea,
  beam0: 0x0f5a3a,
  beam1: 0x1d8a55,
  beam2: 0x3fd27f,
  beam3: 0x8af2b0,
  beam4: 0xd2ffe0,
  glass0: 0x23505a,
  glass1: 0x3c7c84,
  pink: 0xc96f78,
  pinkLit: 0xe8a2a6,
  skin: 0xe2b48e,
  skinMid: 0xb47e5c,
  brownDark: 0x7c5038,
  brown: 0xa0603a,
  brownLit: 0xc98552,
  denim0: 0x2d4669,
  denim1: 0x44689a,
  magenta: 0xd0549a,
  cyan: 0x5fd3e6,
  water0: 0x2f5f73,
  water1: 0x4f8ea2,
  tag: 0xe6c23a,
};

const SET = new Set(PALETTE_HEX.map((h) => parseInt(h.slice(1), 16)));
export function assertPalette(hex, where = '') {
  if (!SET.has(hex))
    throw new Error(
      `colour 0x${hex.toString(16)} is not in the palette ${where}`,
    );
  return hex;
}
for (const [k, v] of Object.entries(C)) assertPalette(v, `C.${k}`);
if (PALETTE_HEX.length !== 64)
  throw new Error(
    `palette has ${PALETTE_HEX.length} entries, shader expects 64`,
  );
