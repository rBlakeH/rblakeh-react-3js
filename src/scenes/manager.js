// WebGL context budget.
//
// The README flags six live contexts as a mobile risk, and the fix here is
// memory, not frame rate. Measured in headless Chromium, capping contexts on
// its own changed the frame rate not at all — holding an idle context is
// cheap. What cost frames was drawing a neighbouring stage that was still at
// opacity 0, and that is fixed in the components, not here.
//
// What the budget buys is a bounded number of GL contexts and a much smaller
// first paint: two scenes built instead of six.
//
// A context is expensive to rebuild — mount + first frame measured at 534ms
// for Longs Peak and 305ms for the desert, on a desktop. So the budget must
// not be tight enough to churn during ordinary scrolling, or every section
// boundary would stall. Hence:
//   - build a scene while it is still approaching, in idle time, so the cost
//     lands before anyone is looking at it
//   - never build something the next eviction pass would immediately take
//   - evict the furthest scene, and only once over budget
//
// Distances are in viewport heights, measured by the scroll driver; 0 means
// the section is touching or crossing the viewport.

import { sceneLoaders } from './registry.js';

const MOUNT_WITHIN = 1.0; // start loading and building at this distance

/**
 * How many live contexts this device gets. Two stages are on screen at once
 * during the -100vh overlap, so the floor is 2.
 */
export function contextBudget() {
  if (typeof window === 'undefined') return 3;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const narrow = window.innerWidth < 820;
  const mem = navigator.deviceMemory ?? 8;
  if (coarse || narrow) return mem <= 4 ? 2 : 3;
  return mem <= 4 ? 3 : 4;
}

const idle =
  typeof requestIdleCallback === 'function'
    ? (fn) => requestIdleCallback(fn, { timeout: 500 })
    : (fn) => setTimeout(fn, 1);

class SceneManager {
  constructor() {
    this.slots = new Map();
    this.max = contextBudget();
    this.modules = new Map();
  }

  /**
   * @param {{id: string, host: HTMLElement, getCtx: () => object, onChange: (inst: object|null) => void}} slot
   */
  register(slot) {
    const entry = { ...slot, instance: null, pending: false, distance: Infinity };
    this.slots.set(slot.id, entry);
    return () => {
      this.#teardown(entry);
      this.slots.delete(slot.id);
    };
  }

  /** Called once per frame per section, from the scroll driver. */
  update(id, distance) {
    const slot = this.slots.get(id);
    if (!slot) return;
    slot.distance = distance;

    if (this.#shouldBuild(slot)) this.#build(slot);
    this.#evict();
  }

  // Build only what will survive the next eviction pass, or the budget and the
  // mount threshold fight each other and a scene is built and thrown away on
  // alternating frames.
  #shouldBuild(slot) {
    if (slot.instance || slot.pending || slot.distance > MOUNT_WITHIN) return false;
    const live = [...this.slots.values()].filter((s) => s.instance);
    if (live.length + 1 <= this.max) return true;
    return live.some((s) => s.distance > slot.distance);
  }

  async #build(slot) {
    const load = sceneLoaders[slot.id];
    if (!load) return;
    slot.pending = true;

    try {
      let mod = this.modules.get(slot.id);
      if (!mod) {
        mod = await load();
        this.modules.set(slot.id, mod);
      }
      if (!this.slots.has(slot.id) || slot.instance) return;

      // Building is hundreds of milliseconds of synchronous work. If the stage
      // is already on screen, take the hit now rather than show nothing;
      // otherwise wait for idle time.
      const build = () => {
        if (!this.slots.has(slot.id) || slot.instance) return;
        slot.instance = mod.mount(slot.host, slot.getCtx());
        slot.pending = false;
        slot.onChange(slot.instance);
        this.#evict();
      };
      if (slot.distance === 0) build();
      else idle(build);
    } catch (err) {
      slot.pending = false;
      // A scene failing to load must not take the page down — the card and the
      // scroll shell stand on their own.
      console.error(`scene "${slot.id}" failed to load`, err);
    }
  }

  // The budget is a hard cap. The only thing protected from eviction is a
  // scene that is actually on screen (distance 0), and at most two can be —
  // which is why the budget floor is 2.
  #evict() {
    let live = [...this.slots.values()].filter((s) => s.instance);
    if (live.length <= this.max) return;
    live.sort((a, b) => b.distance - a.distance);
    for (const slot of live) {
      if (live.length <= this.max) break;
      if (slot.distance === 0) continue;
      this.#teardown(slot);
      live = live.filter((s) => s !== slot);
    }
  }

  #teardown(slot) {
    if (!slot.instance) return;
    slot.instance.dispose();
    slot.instance = null;
    slot.onChange(null);
  }

  /** Diagnostics, used by scripts/check.mjs. */
  get stats() {
    return {
      max: this.max,
      live: [...this.slots.values()].filter((s) => s.instance).length,
    };
  }
}

export const sceneManager = new SceneManager();

if (typeof window !== 'undefined') window.__sceneManager = sceneManager;
