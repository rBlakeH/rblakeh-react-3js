// Split-flap station directory. Ported from the prototype's finale():
// each row settles left to right, rows staggered, after the finale text lands.

import { sstep, hash, TIMING } from './timings.js';

const FLAP = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';

/**
 * Capture the board's cells and return the per-frame tick.
 *
 * The real text is read off the DOM once, before anything scrambles it. React
 * never rewrites these nodes afterwards (the rows are static data), and the
 * scrambled text is hidden from assistive tech — each row carries its real
 * value on the link itself.
 *
 * @param {HTMLElement} board
 * @returns {(p: number) => void}
 */
export function createFlapBoard(board) {
  const cells = [...board.querySelectorAll('[data-flap]')].map((el, i) => ({
    el,
    i,
    row: Number(el.getAttribute('data-row')),
    text: el.textContent,
    last: null,
  }));

  let settled = false;

  return function flap(p) {
    // Once every row has landed there is nothing left to animate; scrolling
    // back up un-settles it.
    const lastRow = TIMING.flap.start + 3 * TIMING.flap.rowStagger + TIMING.flap.span;
    if (p >= lastRow) {
      if (settled) return;
      settled = true;
    } else {
      settled = false;
    }

    const step = Math.floor(performance.now() / TIMING.flap.tickMs);
    for (const f of cells) {
      const a = TIMING.flap.start + f.row * TIMING.flap.rowStagger;
      const k = sstep(a, a + TIMING.flap.span, p);
      const n = Math.round(k * f.text.length);
      let out = f.text.slice(0, n);
      for (let j = n; j < f.text.length; j++) {
        out += f.text[j] === ' ' ? ' ' : FLAP[Math.floor(hash(f.i * 31.7 + j * 7.3 + step) * FLAP.length)];
      }
      if (out !== f.last) {
        f.el.textContent = out;
        f.last = out;
      }
    }
  };
}
