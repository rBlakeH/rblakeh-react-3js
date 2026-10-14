import { useEffect, useRef, useState } from 'react';
import { sceneLoaders } from './registry.js';

/**
 * Mount a diorama module into `hostRef` and hand back a ref to its instance.
 * The scroll driver calls `instance.frame(progress)` — this hook never renders
 * per frame; the only state it keeps is "has the module landed", used once to
 * drop the placeholder.
 *
 * @param {string} id station id, keyed into the scene registry
 * @param {React.RefObject<HTMLElement>} hostRef
 * @param {object} [ctx] extra page nodes a scene may need, resolved at mount
 * @param {React.RefObject<HTMLElement>} [ctx.cardRef] the role card — the
 *   inspection scene fits its frustum to the space the card leaves free
 * @returns {{ sceneRef: React.MutableRefObject<object|null>, ready: boolean }}
 */
export function useScene(id, hostRef, { cardRef } = {}) {
  const sceneRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = sceneLoaders[id];
    if (!load) return undefined;

    let live = true;
    load()
      .then((mod) => {
        if (!live || !hostRef.current) return;
        sceneRef.current = mod.mount(hostRef.current, { card: cardRef?.current ?? null });
        setReady(true);
      })
      .catch((err) => {
        // A scene failing to load must not take the page down — the card and
        // the scroll shell stand on their own.
        console.error(`scene "${id}" failed to load`, err);
      });

    return () => {
      live = false;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [id, hostRef, cardRef]);

  return { sceneRef, ready };
}
