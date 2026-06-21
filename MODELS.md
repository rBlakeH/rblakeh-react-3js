# 3D Model Management

Store all 3D models in `public/models/` organized by scene.

## Folder structure
```
public/models/
├── boulder/
│  ├── island.glb           # Main island mesh
│  ├── flatirons.glb        # Rock slabs
│  └── trees.glb            # Pine trees (if modeled)
├── albuquerque/
│  ├── island.glb
│  └── landscape.glb
└── logistics/
   ├── island.glb
   └── equipment.glb
```

## Format: GLB vs OBJ

### GLB (binary GLTF) — **Recommended**

| Feature | GLB | OBJ |
|---------|-----|-----|
| File format | Single binary file | Multiple files (.obj + .mtl + textures) |
| File size | Small (especially with Draco) | Larger |
| Animations | ✅ Yes | ❌ No |
| Materials | ✅ Built-in | ⚠️ Separate .mtl file |
| Textures | ✅ Embedded | ⚠️ Separate files |
| Load speed | Fast (binary) | Slower (text parsing) |
| Browser support | Excellent | Good |

**Use GLB** for this portfolio — single file, smaller, animations support, no texture path issues.

**Use OBJ if** you already have OBJ files or need legacy tool compatibility.

### Export from Blender

**GLB (recommended):**
```
File → Export → glTF 2.0 (.glb)
✅ Export as glTF 2.0
✅ Draco compression (cuts 50–80% off size)
✅ Embed textures
✅ Export materials
```

**OBJ (if needed):**
```
File → Export → Wavefront (.obj)
✅ Apply modifiers
✅ Write materials
✅ Export textures (to same folder)
```

## Loading models

### Basic usage

```jsx
import { useModel } from './useModel.js'

function MyComponent() {
  const model = useModel('/models/boulder/island.glb')
  
  return <primitive object={model} />
}
```

### With named meshes

If your model has multiple objects (e.g., Blender collections), extract by name:

```jsx
const flatirons = useModel('/models/boulder/flatirons.glb', 'Flatirons')
```

### Multiple models

```jsx
import { useModels } from './useModel.js'

function MyComponent() {
  const models = useModels([
    '/models/boulder/island.glb',
    '/models/boulder/flatirons.glb'
  ])
  
  return (
    <group>
      <primitive object={models['/models/boulder/island.glb']} />
      <primitive object={models['/models/boulder/flatirons.glb']} />
    </group>
  )
}
```

## Preloading for performance

Preload models **before** they're visible to avoid hitches:

```jsx
import { preloadModel } from './useModel.js'
import { useEffect } from 'react'

function Experience() {
  useEffect(() => {
    // Preload all models for this scene on mount
    preloadModel('/models/boulder/island.glb')
    preloadModel('/models/boulder/flatirons.glb')
  }, [])
  
  return <BoulderScene />
}
```

Or preload at app init in `App.jsx`:

```jsx
import { preloadModel } from './three/useModel.js'

preloadModel('/models/boulder/island.glb')
preloadModel('/models/boulder/flatirons.glb')
preloadModel('/models/albuquerque/island.glb')
// ... preload all scenes up front
```

## Handling loading states

Models load asynchronously. Guard against null in render:

```jsx
const model = useModel('/models/boulder/island.glb')

return (
  <group>
    {model && <primitive object={model} />}
  </group>
)
```

Or preload everything in `Experience.jsx` on mount to avoid checks.

## Performance tips

1. **Keep models under 5MB** — compress in Blender (Draco)
2. **Reuse geometry** — if 10 trees are identical, model once and clone
3. **Bake textures** — embed UVs in GLB instead of separate texture files
4. **LOD (Level of Detail)** — create low-poly versions for distant models
5. **Use instances** — for many copies of the same model:
   ```jsx
   import { Instances, Instance } from '@react-three/drei'
   
   <Instances>
     <meshStandardMaterial />
     {trees.map(pos => <Instance key={pos} position={pos} />)}
   </Instances>
   ```

## CDN (production)

For large model collections, consider hosting on a CDN:
- Vercel: Built-in with zero config
- Cloudflare: Workers + R2 for cheap edge delivery
- AWS S3 + CloudFront

Update model paths:
```jsx
useModel('https://cdn.example.com/models/boulder/island.glb')
```

## Debugging models

If a model doesn't load or looks wrong:

1. Check the network tab (does GLB download?)
2. Inspect in three.js dev tools or [THREE.js Editor](https://threejs.org/editor/)
3. Verify Blender export — ensure materials/meshes are named
4. Check console for `useGLTF` errors

## Example integration

See [BoulderIsland.example.jsx](src/three/BoulderIsland.example.jsx) for a working template.
