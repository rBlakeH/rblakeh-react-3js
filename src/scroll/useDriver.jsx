import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { createScrollDriver } from './driver.js';

const DriverContext = createContext(null);

export function ScrollDriverProvider({ children }) {
  const driver = useMemo(() => createScrollDriver(), []);
  useEffect(() => () => driver.destroy(), [driver]);
  return <DriverContext.Provider value={driver}>{children}</DriverContext.Provider>;
}

export function useDriver() {
  const d = useContext(DriverContext);
  if (!d) throw new Error('useDriver must be used inside <ScrollDriverProvider>');
  return d;
}

/**
 * Register a section with the shared loop.
 * `update` and `settle` are read from refs, so the effect never re-subscribes
 * and the callbacks can close over fresh DOM without re-running the loop setup.
 *
 * @param {React.RefObject<Element>} rootRef the [data-scroll-root] section
 * @param {(frame: {progress: number, visible: boolean, distance: number, now: number}) => void} update
 * @param {() => void} [settle] reduced-motion resting state
 */
export function useSection(rootRef, update, settle) {
  const driver = useDriver();
  const updateRef = useRef(update);
  const settleRef = useRef(settle);
  updateRef.current = update;
  settleRef.current = settle;

  useEffect(
    () =>
      driver.register({
        root: () => rootRef.current,
        update: (frame) => updateRef.current?.(frame),
        settle: () => settleRef.current?.(),
      }),
    [driver, rootRef]
  );
}
