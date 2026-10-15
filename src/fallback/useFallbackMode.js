import { useEffect, useState } from 'react';

/**
 * WebGL is checked once: if a probe context cannot be created, no diorama is
 * going to render and the scroll choreography has nothing to choreograph.
 */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    // Hand the probe context straight back rather than holding one of the
    // browser's limited slots for the life of the page.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

const REDUCED = '(prefers-reduced-motion: reduce)';

/**
 * True when the page should drop the pinned, scroll-driven presentation and
 * render the résumé as a plain stacked document instead.
 *
 * Reduced motion is live — flipping the OS setting switches the page without a
 * reload. The WebGL answer cannot change, so it is only read once.
 */
export function useFallbackMode() {
  const [fallback, setFallback] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.(REDUCED).matches || !hasWebGL();
  });

  useEffect(() => {
    const mq = window.matchMedia?.(REDUCED);
    if (!mq) return undefined;
    const onChange = () => setFallback(mq.matches || !hasWebGL());
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return fallback;
}
