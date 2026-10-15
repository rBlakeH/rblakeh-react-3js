# rBlakeH.com — scroll-driven résumé

Six stations, each a pinned 100vh stage with a floating-island diorama and a
role card beside it: Boulder → Longs Peak → Albuquerque → Fort Worth → the main
line → end of track.

Built from the approved design handoff in [`.claude/v2/`](.claude/v2/), which
remains the source of truth for copy, styling, scroll timings and camera
numbers. If this repo and that folder disagree, that folder is right.

## Stack

- [Vite](https://vitejs.dev/) — dev server and build
- [React 18](https://react.dev/) — the DOM shell only
- [three](https://threejs.org/) `0.160` — the dioramas, as plain modules

No react-three-fiber. The scenes are built once and only transformed on scroll,
so a reconciler earns nothing here. No state libraries, no animation libraries.

## Commands

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build to dist/
npm run preview  # serve the build

npm run check    # regression suite (needs the dev server running)
npm run shoot    # screenshot each station: shoot <url> <outdir> [progress...]
```

`check` and `shoot` drive the page with Playwright. They are the reason the port
can be trusted: `shoot` was used to compare every station against the live
prototype frame by frame, and `check` guards the behaviour that is easy to break
silently.

## Layout

```
index.html
└─ src/
   ├─ main.jsx
   ├─ App.jsx                  # six sections; swaps in the fallback document
   ├─ styles.css               # design tokens and every component style
   ├─ data/
   │  └─ stations.js           # 🔧 ALL copy. Verbatim from the résumé.
   ├─ scroll/
   │  ├─ driver.js             # the single RAF loop for the whole page
   │  ├─ useDriver.jsx         # React plumbing for it
   │  ├─ timings.js            # the timing table; hero and station transforms
   │  ├─ finale.js             # finale stage/text timing and layout measurement
   │  └─ flap.js               # split-flap station directory
   ├─ scenes/
   │  ├─ registry.js           # station id → dynamic import
   │  ├─ manager.js            # WebGL context budget: build, keep, evict
   │  ├─ useScene.js           # hands a stage to the manager
   │  ├─ lib/dispose.js        # teardown
   │  └─ {boulder,longs,desert,yard,inspection,terminus}.js
   ├─ components/              # Hero, Station, RoleCard, Finale, StationDirectory
   ├─ fallback/                # reduced-motion / no-WebGL stacked document
   └─ resume/renderResume.js   # the static /resume page
```

### Scroll model

Each station is a `<section data-scroll-root>` of `300vh` (the finale `240vh`)
holding a `position: sticky` 100vh stage. Sections after the first carry
`margin-top: -100vh`, so the next stage pins the moment the previous one
releases — that overlap is deliberate and removes the dead scroll between
scenes. Progress is `clamp01(-rect.top / (rect.height - innerHeight))`.

One RAF loop drives everything. It measures every section in a read pass, then
updates them in a write pass, so a frame costs at most one layout. **No
per-frame React state** — the loop writes transforms and opacity straight to
DOM nodes through refs.

Two rules that are easy to break:

- **Draw on opacity, not visibility.** A section keeps intersecting the viewport
  long after its stage has faded out. Gating scene rendering on `visible` rather
  than the stage's own opacity roughly halves the frame rate, because a fully
  transparent diorama costs exactly as much to draw as a visible one.
- **Seeded hash, never `Math.random()`.** All scatter uses
  `s => { const x = Math.sin(s * 99.13) * 43758.5453; return x - Math.floor(x); }`
  so the scenes are identical on every reload.

### Scenes

Every diorama is a plain module exporting:

```js
mount(host, ctx) -> { frame(progress), resize(), dispose() }
```

It owns no loop and reads no scroll. `src/scenes/manager.js` decides when one is
built and when its GL context goes back, keeping 4 alive on desktop and 2–3 on a
phone. A scene is built one viewport out, inside `requestIdleCallback`, because
mount plus first frame costs 100–530ms depending on the station and doing that
on screen would stall every section boundary.

The scene files were generated from the prototype by
[`scripts/port-scene.mjs`](scripts/port-scene.mjs), which applies a fixed set of
wrapper edits and asserts every pattern matches exactly the expected number of
times. The diff against each prototype file is the wrapper and nothing else — no
geometry, colour, light or camera line differs. **Re-run the tool rather than
hand-editing a scene's build code**, and keep design changes in the handoff.

### Content

All copy lives in [`src/data/stations.js`](src/data/stations.js) and is verbatim
from the résumé. Both the scroll presentation, the fallback document and
`/resume` read from it, so there is one place to change a date or a bullet.

### Accessibility and crawlers

- `prefers-reduced-motion`, or a browser with no WebGL, gets a stacked document
  instead: same copy, same tokens, no pinning, no 3D, no RAF loop.
- `/resume` is static HTML generated at build time with **no script tags**, for
  crawlers and ATS parsers. A skip link at the top of the page points at it.
- The split-flap board scrambles its text as it settles, so those cells are
  `aria-hidden` and each row carries its real value on the link.

## Deploying

The build is fully static and uses relative asset URLs, so the same `dist/`
works at a domain root and under a project subpath without being rebuilt.
`/resume` is emitted as `resume/index.html` — a directory index, which is the
only form GitHub Pages can serve at a clean URL.

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and
publishes on every push to `main`. To turn it on once:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. Merge to `main`. The site lands at
   `https://rblakeh.github.io/rblakeh-react-3js/`.

To use `rBlakeH.com` instead, add it under **Settings → Pages → Custom domain**
and point DNS at GitHub (an `ALIAS`/`ANAME` at the apex to
`rblakeh.github.io`, or four `A` records to GitHub's Pages IPs). Nothing in the
build needs to change.
