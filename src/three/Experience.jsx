import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Lights from './Lights.jsx';
import CameraRig from './CameraRig.jsx';
import BoulderIsland from './BoulderIsland.jsx';
import FloatingShapes from './FloatingShapes.jsx';
import { THEMES } from '../data/scenes.js';
import { lerp, smoothstep } from './math.js';

/**
 * Experience
 * ----------
 * The 3D scene graph. Drives the island's float-in/out from the shared scroll
 * `progress` ref each frame:
 *   - lands (rises from below) over the first 55% of scroll
 *   - idle-bobs once landed, sways gently, and reacts to pointer for parallax
 */
export default function Experience({ progress, config }) {
  const island = useRef();
  const theme = THEMES[config.theme];

  useFrame((state) => {
    const p = progress.current;
    const t = state.clock.elapsedTime;
    const land = smoothstep(0, 0.55, p);

    const g = island.current;
    if (g) {
      g.position.x = 3.2;
      g.position.y = lerp(-24, 0, land) + Math.sin(t * 0.7) * 0.25 * land;
      g.rotation.y = state.pointer.x * 0.22 + Math.sin(t * 0.3) * 0.04;
      g.scale.setScalar(lerp(0.72, 1, land));
    }
  });

  return (
    <>
      <fog attach="fog" args={[theme.fog, 60, 140]} />
      <Lights theme={theme} />
      <CameraRig />

      <group ref={island}>
        <BoulderIsland config={config} />
      </group>

      {config.showFloatingShapes && <FloatingShapes />}
    </>
  );
}
