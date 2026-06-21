# rBlakeH.com — 3D Portfolio

A scroll-driven 3D portfolio built with **React** + **react-three-fiber**. Each
section is a floating low-poly island: the intro lifts off as the island floats
up from below, with subtle mouse parallax and content cards that settle in.

This repo currently contains the **Boulder, Colorado** scene (college / CU
Boulder). It's structured so the remaining scenes — Albuquerque (iTEAM), the BNSF
logistics yard (current role), and a contact ending — drop in the same way.

## Tech stack

- [Vite](https://vitejs.dev/) — dev server & build
- [React 18](https://react.dev/)
- [react-three-fiber](https://docs.pmnd.rs/react-three-fiber) — declarative Three.js
- [three](https://threejs.org/) — `^0.160`

No `@react-three/drei` and no extra state libraries — the scene is intentionally
minimal and readable.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## How it works

```
index.html
└─ src/
   ├─ main.jsx              # React entry
   ├─ App.jsx              # owns scroll `progress` ref; mounts <Canvas> + overlays
   ├─ styles.css           # page + overlay styling
   ├─ data/
   │  └─ scenes.js         # 🔧 ALL content + scene params live here
   ├─ three/
   │  ├─ Experience.jsx    # scene graph; drives island float-in from scroll
   │  ├─ Lights.jsx        # hemisphere fill + shadow-casting key light
   │  ├─ CameraRig.jsx     # mouse-parallax camera
   │  ├─ BoulderIsland.jsx # island group (disc, underside, ridge, slabs, pines)
   │  ├─ Mountains.jsx     # forest ridge behind the Flatirons
   │  ├─ Flatirons.jsx     # the tilted red-rock slabs
   │  ├─ PineTree.jsx      # one low-poly pine
   │  ├─ FloatingShapes.jsx# drifting sky solids
   │  └─ math.js           # lerp / smoothstep / deterministic rand
   └─ ui/
      └─ Overlays.jsx      # fixed DOM hero + info card, animated from scroll
```

### Scroll model

`App.jsx` keeps a single `progress` **ref** (0 → 1, computed from `window.scrollY`).
It's a ref, not state, so per-frame scroll updates never trigger React re-renders.
Both layers read it directly:

- **3D** — `Experience` reads `progress.current` inside `useFrame` to lerp the
  island's Y position, scale and bob.
- **DOM** — `Overlays` runs a small `requestAnimationFrame` loop that reads the
  same ref and sets `opacity` / `transform` on the hero and card via element refs.

The scrollable height comes from the empty `.scroll-track` div (`240vh`).

### Theming & content

Everything editable lives in [`src/data/scenes.js`](src/data/scenes.js):

- `THEMES` — sky gradient + light/fog colors (Golden Hour / Daytime / Clear Blue)
- `SCENE` — active theme, Flatiron `rockColor`, the intro copy, and the info-card
  content
- `FLATIRONS`, `PINES`, `FLOATERS` — geometry placement data

Change copy or colors there; no need to touch the render code.

## Adding the next scene

1. Add a new entry (theme + content) to `scenes.js`.
2. Create a new island component under `src/three/` (copy `BoulderIsland.jsx`).
3. Render it from `Experience.jsx`, offset on the timeline so it floats in as the
   previous one floats out (extend `.scroll-track` height and gate each island's
   `land`/exit on its own slice of `progress`).
4. Add its overlay copy block in `Overlays.jsx` keyed to the same range.
