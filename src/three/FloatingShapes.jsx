import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { FLOATERS } from '../data/scenes.js';

/** Maps a shape name from the config to its R3F geometry element. */
function Geometry({ shape, size }) {
  if (shape === 'ico') return <icosahedronGeometry args={[size, 0]} />;
  if (shape === 'tetra') return <tetrahedronGeometry args={[size, 0]} />;
  return <octahedronGeometry args={[size, 0]} />;
}

/**
 * FloatingShapes — decorative low-poly solids drifting in the sky. They live
 * outside the island group so they stay put while the island floats in.
 */
export default function FloatingShapes() {
  const refs = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    FLOATERS.forEach((f, i) => {
      const m = refs.current[i];
      if (!m) return;
      m.position.y = f.pos[1] + Math.sin(t * f.speed + i) * 1.1;
      m.rotation.x += f.rx;
      m.rotation.y += f.ry;
    });
  });

  return (
    <group>
      {FLOATERS.map((f, i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={f.pos}
          castShadow
        >
          <Geometry shape={f.shape} size={f.size} />
          <meshStandardMaterial color={f.color} flatShading roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
