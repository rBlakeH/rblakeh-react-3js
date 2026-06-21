/**
 * scenes.js — single source of truth for content + scene parameters.
 *
 * To add the next scene (Albuquerque / iTEAM, BNSF yard, contact), add a new
 * entry here and a matching island component under src/three/, then render it
 * from <Experience> keyed to a scroll range. Nothing in the render code hard-codes
 * Boulder-specific copy — it all flows from this file.
 */

/** Sky themes — drives the page background gradient, lights and fog tint. */
export const THEMES = {
  'Golden Hour': {
    bg: 'linear-gradient(180deg,#ffd9a0 0%,#ffb988 45%,#ffe6cf 100%)',
    light: '#ffe2b0',
    hemiSky: '#ffe2c0',
    hemiGround: '#9bbf7a',
    fog: '#ffe6cf',
  },
  Daytime: {
    bg: 'linear-gradient(180deg,#aee1ff 0%,#cdeeff 50%,#eaf7d8 100%)',
    light: '#fff4e0',
    hemiSky: '#cdeeff',
    hemiGround: '#9bbf7a',
    fog: '#eaf7e0',
  },
  'Clear Blue': {
    bg: 'linear-gradient(180deg,#5fa8ff 0%,#9fccff 55%,#dcefff 100%)',
    light: '#ffffff',
    hemiSky: '#9fccff',
    hemiGround: '#88b06a',
    fog: '#dcefff',
  },
};

/** The Boulder scene: theme + copy + toggles. */
export const SCENE = {
  theme: 'Golden Hour',
  rockColor: '#cf6a4a', // Flatirons sandstone
  showFloatingShapes: true,
  intro: {
    eyebrow: 'rBlakeH.com · 2026',
    name: 'Blake Hampton',
    role: 'Software Engineer',
  },
  content: {
    label: 'Boulder, Colorado · Education',
    title: 'University of Colorado Boulder',
    subtitle: 'B.S. Computer Science · College of Engineering',
    dates: '2017 — 2021',
    body: 'Studied algorithms, AI, data science and computer graphics — with electives in virtual reality and game development. Graduated with a 3.6 GPA.',
    tags: ['Algorithms', 'OpenGL', 'VR', 'AI'],
  },
};

/**
 * The five Flatiron slabs. Each is an extruded right-triangle leaning back
 * against the ridge. x/z place it on the island top, w/h size the triangle,
 * ry adds a little fan-out rotation.
 */
export const FLATIRONS = [
  { x: -3.8, z: -0.2, w: 3.4, h: 7.5, ry: 0.24 },
  { x: -1.2, z: 0.2, w: 3.9, h: 10.0, ry: 0.08 },
  { x: 1.7, z: 0.0, w: 3.9, h: 11.0, ry: -0.08 },
  { x: 4.4, z: -0.4, w: 3.4, h: 8.5, ry: -0.24 },
];

/** Pine tree positions on the island top, as [x, z]. */
export const PINES = [
  [-7.5, 5],
  [7.5, 5.5],
  [9.2, 1.5],
  [-9.2, 1.5],
  [6, 7.5],
];

/** Decorative low-poly solids drifting in the sky. */
export const FLOATERS = [
  { shape: 'ico', size: 1.2, color: '#ff7a5c', pos: [-13, 7, 4], speed: 0.7, rx: 0.004, ry: 0.006 },
  { shape: 'tetra', size: 1.4, color: '#ffd23f', pos: [12, 9, -2], speed: 0.6, rx: -0.003, ry: 0.005 },
  { shape: 'octa', size: 1.3, color: '#4ec9b0', pos: [9.5, 3.5, 7], speed: 0.8, rx: 0.005, ry: -0.004 },
  { shape: 'ico', size: 1.0, color: '#a78bfa', pos: [-10.5, 11, -3], speed: 0.55, rx: 0.003, ry: 0.004 },
  { shape: 'tetra', size: 1.1, color: '#ff9ec4', pos: [0, 14, -6], speed: 0.65, rx: -0.004, ry: 0.005 },
  { shape: 'octa', size: 1.1, color: '#6fb7ff', pos: [13, 2.5, 5], speed: 0.75, rx: 0.004, ry: -0.005 },
];
