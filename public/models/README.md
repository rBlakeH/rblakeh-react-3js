# 3D Models

Place exported GLB files here organized by scene:

```
models/
├── boulder/        → Island models for Boulder scene
├── albuquerque/    → Island models for Albuquerque scene
└── logistics/      → Island models for Logistics scene
```

**Export from Blender:**
1. File → Export → glTF 2.0 (.glb)
2. Check: "Draco compression" (50–80% smaller)
3. Check: "Embed textures"
4. Save to the appropriate scene folder

**Loading in React:**
```jsx
import { useModel, preloadModel } from '../src/three/useModel.js'

// Preload
preloadModel('/models/boulder/island.glb')

// Load
const model = useModel('/models/boulder/island.glb')

return <primitive object={model} />
```

See [../MODELS.md](../MODELS.md) for full documentation.
