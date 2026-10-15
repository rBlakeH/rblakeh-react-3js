// Scenes are mounted and unmounted as you scroll, so a diorama has to give
// back what it took: here, its geometries and its GL context.
//
// It deliberately does not dispose materials or textures. Four of the six
// scenes build their palette once at module scope (`const M = { steel: mat()
// }`) and share it across every instance and every remount, so those are not
// the scene's to free. three.js r160 does tolerate it — a disposed material
// re-uploads itself on next use, and a remount renders identically either way
// (scripts/check.mjs covers this) — but relying on that is not worth it.
//
// Nothing leaks by skipping them: forceContextLoss() drops the GL context and
// with it everything uploaded to it. Geometries are built per mount, so those
// are ours.

export function disposeScene(scene, renderer) {
  scene?.traverse((o) => o.geometry?.dispose());
  if (!renderer) return;
  renderer.dispose();
  renderer.forceContextLoss();
  renderer.domElement.remove();
}
