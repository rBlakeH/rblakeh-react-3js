// One RAF loop for the whole page.
//
// The prototype gave every section and every diorama its own loop, so a single
// frame did ~12 getBoundingClientRect() calls interleaved with style writes.
// Here each registered section is measured in one read pass, then updated in a
// write pass, so a frame costs one layout at most.
//
// No per-frame React state: registrants get DOM nodes and write to them.
//
// Reduced motion is not this file's problem: App swaps the whole scroll
// presentation for the stacked document, so the driver is never mounted.

import { clamp01 } from './timings.js';

export function createScrollDriver() {
  const entries = new Set();
  let raf = 0;
  let running = false;

  const reads = [];

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const vh = window.innerHeight;
    const list = [...entries];

    // read pass
    reads.length = 0;
    for (const e of list) {
      const root = e.root();
      if (!root) {
        reads.push(null);
        continue;
      }
      const r = root.getBoundingClientRect();
      const span = r.height - vh;
      reads.push({
        progress: span <= 0 ? 0 : clamp01(-r.top / span),
        visible: r.top < vh && r.bottom > 0,
        // distance from the viewport in viewport heights; 0 while on screen
        distance: Math.max(0, r.top - vh, -r.bottom) / vh,
        now,
      });
    }

    // write pass
    for (let i = 0; i < list.length; i++) {
      if (reads[i]) list[i].update(reads[i]);
    }
  };

  function start() {
    if (running || !entries.size || document.hidden) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  // A backgrounded tab still gets rAF in some browsers, and there is nothing
  // to draw for.
  const onVisibility = () => {
    if (document.hidden) stop();
    else start();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    /** @param {{root: () => Element|null, update: (f: object) => void}} entry */
    register(entry) {
      entries.add(entry);
      start();
      return () => {
        entries.delete(entry);
        if (!entries.size) stop();
      };
    },
    destroy() {
      stop();
      entries.clear();
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
