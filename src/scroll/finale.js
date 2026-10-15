// Finale timing. Ported from the prototype's finale(p), with the layout
// measurement lifted out of the RAF loop: the text block's height only changes
// on resize or when fonts land, so measuring it every frame was pure thrash.

import { sstep, TIMING } from './timings.js';

/** @returns {number} the stage's opacity — see applyStation. */
export function applyFinaleStage(p, stage) {
  const inS = sstep(TIMING.finaleStage.in[0], TIMING.finaleStage.in[1], p);
  if (stage) {
    stage.style.opacity = inS;
    stage.style.transform = `translate3d(0, ${(1 - inS) * 10}%, 0) scale(${0.95 + inS * 0.05})`;
  }
  return inS;
}

export function applyFinaleText(p, text) {
  if (!text) return;
  const tIn = sstep(TIMING.finaleText.in[0], TIMING.finaleText.in[1], p);
  text.style.opacity = tIn;
  text.style.transform = `translate3d(0, ${(1 - tIn) * -28}px, 0)`;
  text.style.pointerEvents = tIn > 0.5 ? 'auto' : 'none';
  return tIn;
}

/**
 * The scene takes whatever is left below the text; drop the paragraph if that
 * gets too tight, then park the stage under the text block.
 */
export function measureFinale({ stage, text, para }) {
  if (!text) return;
  const vh = window.innerHeight;

  if (para) {
    para.style.display = '';
    const bottomWith = text.offsetTop + text.offsetHeight;
    const hide = vh - bottomWith < vh * 0.34;
    para.style.display = hide ? 'none' : '';
  }

  if (stage) {
    stage.style.top = Math.min(vh * 0.62, text.offsetTop + text.offsetHeight + 12) + 'px';
  }
}

