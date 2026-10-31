import { PALETTE_RGB as base } from '../../../shared/core/palette.js';

const colors = [
  '#42989c',
  '#489fa3',
  '#50a6aa',
  '#58adb0',
  '#60b4b7',
  '#68bcbe',
  '#73c4c5',
  '#7fcdcd',
  '#7b7c76',
  '#85857d',
  '#8e8e84',
  '#97988c',
];
export const PALETTE_RGB = [
  ...base,
  ...colors.map((h) => {
    const n = parseInt(h.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }),
];
