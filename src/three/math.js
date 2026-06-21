/** Small math helpers shared across the 3D layer. */

export const lerp = (a, b, t) => a + (b - a) * t;

/** Smooth Hermite interpolation between edges a and b, clamped to 0..1. */
export const smoothstep = (a, b, x) => {
  x = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

/** Deterministic pseudo-random in 0..1 from a numeric seed. */
export const rand = (seed) => {
  const x = Math.sin(seed * 99.13) * 43758.5453;
  return x - Math.floor(x);
};
