import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Experience from './three/Experience.jsx';
import Overlays from './ui/Overlays.jsx';
import { SCENE, THEMES } from './data/scenes.js';

/**
 * App
 * ---
 * Owns the single source of scroll state (`progress`, a ref in 0..1) and shares
 * it with both the 3D layer (<Experience>) and the DOM overlays (<Overlays>).
 * A ref — not React state — so per-frame scroll updates never re-render React;
 * the 3D loop and the overlay loop read `progress.current` directly.
 *
 * Layout: a fixed full-screen <Canvas> behind fixed DOM overlays, with a tall
 * `.scroll-track` element creating the scrollable height that drives `progress`.
 */
export default function App() {
  const progress = useRef(0);

  useEffect(() => {
    // Paint the page background to match the active sky theme.
    document.body.style.background = THEMES[SCENE.theme].bg;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current = max > 0 ? window.scrollY / max : 0;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <Canvas
        className="scene-canvas"
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1 }}
        shadows
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        camera={{ fov: 46, near: 0.1, far: 220, position: [0, 4.6, 26] }}
      >
        <Experience progress={progress} config={SCENE} />
      </Canvas>

      <Overlays progress={progress} config={SCENE} />

      {/* Empty element whose height generates the scroll range. */}
      <div className="scroll-track" />
    </>
  );
}
