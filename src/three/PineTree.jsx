import { rand } from './math.js';

/**
 * PineTree — a low-poly pine: a trunk plus three stacked cones. Height and scale
 * vary deterministically from `seed` so the forest looks natural but stays stable
 * across renders.
 */
export default function PineTree({ position, seed = 0 }) {
  const h = 1.6 + rand(seed) * 0.9;
  const scale = 0.8 + rand(seed + 1) * 0.5;

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 0.9, 5]} />
        <meshStandardMaterial color="#7a4f3a" flatShading roughness={1} />
      </mesh>

      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 1.0 + i * h * 0.34, 0]} castShadow>
          <coneGeometry args={[0.95 - i * 0.22, h * 0.6, 5]} />
          <meshStandardMaterial color="#3f8f5c" flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
