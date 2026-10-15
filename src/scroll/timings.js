// Timing numbers are ported exactly from the approved prototype
// (.claude/v2/Blake Hampton Portfolio v2.dc.html, class Component).
// All easing is smoothstep. Do not retune without a design pass.

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const sstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a, b, t) => a + (b - a) * t;

// Seeded hash — every bit of scatter and the split-flap use this, never Math.random().
export const hash = (s) => {
  const x = Math.sin(s * 99.13) * 43758.5453;
  return x - Math.floor(x);
};

export const TIMING = {
  hero: { out: [0.0, 0.14] },
  stage: { in: [0.0, 0.18], out: [0.86, 1.0] },
  card: { in: [0.14, 0.3], out: [0.8, 0.94] },
  finaleStage: { in: [0.0, 0.22] },
  finaleText: { in: [0.18, 0.36] },
  flap: { start: 0.3, rowStagger: 0.05, span: 0.14, tickMs: 65 },
};

// Hero clears out before the first scene lands.
export function applyHero(p, hero) {
  if (!hero) return;
  const o = 1 - sstep(TIMING.hero.out[0], TIMING.hero.out[1], p);
  hero.style.opacity = o;
  hero.style.transform = `translate3d(${-6 * (1 - o)}vw, ${-18 * (1 - o)}px, 0)`;
}

// dir: +1 = scene enters from the right, card sits left; -1 mirrors it.
// Returns the stage's opacity, which is what decides whether its scene is
// worth drawing — a section can intersect the viewport for a long stretch
// while its stage is still fully transparent.
export function applyStation(p, stage, card, dir) {
  const inS = sstep(TIMING.stage.in[0], TIMING.stage.in[1], p);
  const outS = sstep(TIMING.stage.out[0], TIMING.stage.out[1], p);
  const opacity = Math.min(inS, 1 - outS);
  if (stage) {
    stage.style.opacity = opacity;
    stage.style.transform = `translate3d(${
      dir * ((1 - inS) * 34 + outS * -26)
    }%, 0, 0) scale(${0.94 + inS * 0.06 - outS * 0.05})`;
  }
  const cardIn = sstep(TIMING.card.in[0], TIMING.card.in[1], p);
  const cardOut = sstep(TIMING.card.out[0], TIMING.card.out[1], p);
  if (card) {
    card.style.opacity = Math.min(cardIn, 1 - cardOut);
    card.style.transform = `translate3d(${
      dir * ((1 - cardIn) * 46 + cardOut * -34)
    }px, -50%, 0)`;
  }
  return opacity;
}

