// Scene modules keyed by station id. Each is a dynamic import so the station's
// geometry code is a separate chunk — step 5 turns these into on-approach
// loads; today they resolve as soon as the station mounts.
//
// Every module exports mount(host) -> { frame(progress), resize(), dispose() }.

export const sceneLoaders = {
  boulder: () => import('./boulder.js'),
};

export const hasScene = (id) => Boolean(sceneLoaders[id]);
