import Mountains from './Mountains.jsx';
import Flatirons from './Flatirons.jsx';
import PineTree from './PineTree.jsx';
import { PINES } from '../data/scenes.js';

/**
 * BoulderIsland — the floating chunk of land: a faceted grass disc with a tapered
 * rock underside, the forest ridge, the Flatirons, and scattered pines.
 */
export default function BoulderIsland({ config }) {
  return (
    <group>
      {/* Grass top */}
      <mesh position={[0, -0.7, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[12, 12, 1.4, 9]} />
        <meshStandardMaterial color="#86c46a" flatShading roughness={0.9} />
      </mesh>

      {/* Rocky underside (cone pointing down) */}
      <mesh position={[0, -7.1, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[11.4, 13, 7]} />
        <meshStandardMaterial color="#8a6048" flatShading roughness={0.9} />
      </mesh>

      <Mountains />
      <Flatirons color={config.rockColor} />

      {PINES.map((p, i) => (
        <PineTree key={i} position={[p[0], 0, p[1]]} seed={i} />
      ))}
    </group>
  );
}
