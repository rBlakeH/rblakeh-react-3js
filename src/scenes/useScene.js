import { useCallback, useEffect, useRef, useState } from 'react';
import { sceneManager } from './manager.js';

/**
 * Hand a station's stage to the scene manager, which decides when the diorama
 * is built and when its WebGL context is handed back.
 *
 * This hook never renders per frame. Its only state is "is a scene live",
 * which flips when one is built or evicted — both off-screen events.
 *
 * @param {string} id station id, keyed into the scene registry
 * @param {React.RefObject<HTMLElement>} hostRef
 * @param {object} [ctx]
 * @param {React.RefObject<HTMLElement>} [ctx.cardRef] the role card — the
 *   inspection scene fits its frustum to the space the card leaves free
 * @returns {{ sceneRef: React.MutableRefObject<object|null>, ready: boolean,
 *   update: (distance: number) => void }}
 */
export function useScene(id, hostRef, { cardRef } = {}) {
  const sceneRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hostRef.current) return undefined;
    return sceneManager.register({
      id,
      host: hostRef.current,
      getCtx: () => ({ card: cardRef?.current ?? null }),
      onChange: (instance) => {
        sceneRef.current = instance;
        setReady(Boolean(instance));
      },
    });
  }, [id, hostRef, cardRef]);

  const update = useCallback((distance) => sceneManager.update(id, distance), [id]);

  return { sceneRef, ready, update };
}
