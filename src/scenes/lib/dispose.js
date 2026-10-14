// Scenes are mounted and unmounted as you scroll, so a diorama has to give
// back everything it took: geometries, materials, textures and the GL context.

function disposeMaterial(m) {
  if (!m) return;
  for (const key of Object.keys(m)) {
    const v = m[key];
    if (v && v.isTexture) v.dispose();
  }
  m.dispose();
}

export function disposeScene(scene, renderer) {
  scene?.traverse((o) => {
    o.geometry?.dispose();
    const m = o.material;
    if (Array.isArray(m)) m.forEach(disposeMaterial);
    else disposeMaterial(m);
  });
  if (!renderer) return;
  renderer.dispose();
  renderer.forceContextLoss();
  renderer.domElement.remove();
}
