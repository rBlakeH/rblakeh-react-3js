import { useMemo } from 'react';
import * as THREE from 'three';
import { FLATIRONS } from '../data/scenes.js';

/** Build a centered, extruded right-triangle slab geometry. */
function makeSlab(w, h, depth = 1.0) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(w, 0);
  shape.lineTo(0, h);
  shape.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.center();
  return geo;
}

/**
 * Flatirons — the iconic tilted red-rock slabs. Each leans back against the
 * ridge; `color` is shared so the whole formation recolors from one prop.
 */
export default function Flatirons({ color }) {
  // Geometries are static — build once.
  const slabs = useMemo(
    () => FLATIRONS.map((f) => ({ ...f, geometry: makeSlab(f.w, f.h) })),
    []
  );

  return (
    <group>
      {slabs.map((f, i) => (
        <mesh
          key={i}
          geometry={f.geometry}
          position={[f.x, f.h * 0.3, f.z]}
          rotation={[-0.32, f.ry, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={color} flatShading roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
