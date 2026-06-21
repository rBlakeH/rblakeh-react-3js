import { useEffect } from 'react'
import Mountains from './Mountains.jsx'
import Flatirons from './Flatirons.jsx'
import PineTree from './PineTree.jsx'
import { PINES } from '../data/scenes.js'
import { useModel, preloadModel } from './useModel.js'

/**
 * Example: BoulderIsland with external GLB models
 *
 * To use:
 * 1. Export your island/trees/rocks from Blender as GLB
 * 2. Place in public/models/boulder/
 * 3. Uncomment model loading below
 * 4. Replace procedural geometry with loaded models
 */

export default function BoulderIsland({ config }) {
  // Preload models on mount (happens before render)
  useEffect(() => {
    preloadModel('/models/boulder/island.glb')
    preloadModel('/models/boulder/flatirons.glb')
  }, [])

  // Load external models
  // const islandModel = useModel('/models/boulder/island.glb')
  // const flatironsModel = useModel('/models/boulder/flatirons.glb', 'Flatirons')

  return (
    <group>
      {/* Option A: Use loaded model */}
      {/* {islandModel && <primitive object={islandModel} />} */}

      {/* Option B: Keep procedural (current) */}
      <mesh position={[0, -0.7, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[12, 12, 1.4, 9]} />
        <meshStandardMaterial color="#86c46a" flatShading roughness={0.9} />
      </mesh>

      {/* Rocky underside */}
      <mesh position={[0, -7.1, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[11.4, 13, 7]} />
        <meshStandardMaterial color="#8a6048" flatShading roughness={0.9} />
      </mesh>

      {/* Loaded model example */}
      {/* {flatironsModel && <primitive object={flatironsModel} />} */}

      {/* Keep procedural components */}
      <Mountains />
      <Flatirons color={config.rockColor} />

      {PINES.map((p, i) => (
        <PineTree key={i} position={[p[0], 0, p[1]]} seed={i} />
      ))}
    </group>
  )
}
