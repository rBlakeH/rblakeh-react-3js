import React, { createRef, useCallback, useMemo, useRef } from 'react';
import { stations } from './data/stations.js';
import { ScrollDriverProvider } from './scroll/useDriver.jsx';
import { applyHero } from './scroll/timings.js';
import { Hero } from './components/Hero.jsx';
import { Station } from './components/Station.jsx';
import { Finale } from './components/Finale.jsx';
import { useFallbackMode } from './fallback/useFallbackMode.js';
import { FallbackDocument } from './fallback/FallbackDocument.jsx';

export default function App() {
  const fallback = useFallbackMode();
  return (
    <>
      <a className="skip-link" href="resume/">
        Skip to the plain-text résumé
      </a>
      {fallback ? (
        <FallbackDocument />
      ) : (
        <ScrollDriverProvider>
          <Page />
        </ScrollDriverProvider>
      )}
    </>
  );
}

function Page() {
  // App owns the section refs: the finale's route strip scrolls to them.
  const trackRefs = useMemo(() => stations.map(() => createRef()), []);
  const finaleRef = useRef(null);
  const heroRef = useRef(null);

  const jump = useCallback(
    (i) => {
      const t = trackRefs[i]?.current;
      if (!t) return;
      const se = document.scrollingElement || document.documentElement;
      const top =
        t.getBoundingClientRect().top + se.scrollTop + (t.offsetHeight - window.innerHeight) * 0.55;
      window.scrollTo({ top, behavior: 'smooth' });
    },
    [trackRefs]
  );

  return (
    <>
      {stations.map((station, i) => (
        <Station
          key={station.id}
          station={station}
          rootRef={trackRefs[i]}
          overlap={i > 0}
          overlay={i === 0 ? <Hero ref={heroRef} /> : null}
          // The hero lives inside station 1's pin and clears out on its progress.
          onFrame={i === 0 ? (frame) => applyHero(frame.progress, heroRef.current) : undefined}
        />
      ))}
      <Finale rootRef={finaleRef} onJump={jump} />
    </>
  );
}
