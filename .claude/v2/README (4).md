# Blake Hampton portfolio — v2 design handoff

Scroll-driven 3D resume. Six stations, each a pinned 100vh stage with a floating-island
diorama and (for 1–5) a role card beside it. This folder is the approved design.

Open `Blake Hampton Portfolio v2.dc.html` in a browser (served over http, e.g.
`npx serve .`) to see the reference. `support.js` is prototype runtime only — do not port it.

## Files

| File | What it is |
| --- | --- |
| `Blake Hampton Portfolio v2.dc.html` | DOM: hero, role cards, finale, scroll/timing logic (class at the bottom). Source of truth for **all copy, styles and timings**. |
| `boulder-diorama.js` | 01 CU Boulder — Flatirons ridge, Chautauqua meadow, ponderosas |
| `longs-diorama.js` | 02 Longs Peak Advisory — the Diamond, Chasm Lake, climbers, Colorado flag |
| `desert-diorama.js` | 03 Albuquerque — Sandia escarpment, high desert |
| `yard-diorama.js` | 04 BNSF Intermodal, Fort Worth — double-stack train, gantry cranes; scroll-keyed container lift |
| `inspection-diorama.js` | 05 Track measurement consist — train stationary, ground streams past; scroll velocity → speed |
| `terminus-diorama.js` | 06 End of track — platform, bumper post, signal red→green, day→dusk |

Each diorama is a self-registering custom element (`<boulder-diorama>` etc.) using
three.js 0.160.1 from a CDN, an **orthographic** camera, its own renderer and RAF loop.
It reads its own scroll progress from the nearest `[data-scroll-root]` ancestor.

## Scroll model

- Each station is a `<section data-scroll-root>` (`min-height: 300vh`, finale `240vh`)
  containing a `position: sticky; top: 0; height: 100vh` stage.
- Sections 2–6 have `margin-top: -100vh`, so the next stage pins the moment the previous
  one releases. **This removes the dead scroll between scenes — keep it.**
- `progress = clamp01(-rect.top / (rect.height - innerHeight))` per section.
- All easing is smoothstep. Camera targets lerp 0.045, frustum 0.05.

### Timings (fractions of that section's progress)

```
station stage   in  [0.00, 0.18]   out [0.86, 1.00]   slide ±34% in / ∓26% out, scale 0.94→1
station card    in  [0.14, 0.30]   out [0.80, 0.94]   (card always lags its scene)
hero (sec 1)    out [0.00, 0.14]
finale stage    in  [0.00, 0.22]   rises 10% + scale 0.95→1
finale text     in  [0.18, 0.36]
split-flap row  settles over [0.30 + row*0.05, +0.14], 65ms flap tick
```

Card side alternates: scene enters from right / card left on 1 and 4; mirrored on 2, 3, 5.
Station length is a prop (`stationLength`, 180–520vh, default 300).

## Design tokens

```
Ink #23262b · Ink80 #43474d · Ink65 #4c5157 · Ink45 #74797f · Mute #8b8f96
Card rgba(252,252,253,0.94), border rgba(35,38,43,0.09), radius 20px,
     shadow 0 26px 62px -22px rgba(30,32,38,0.42), backdrop blur 10px
Page radial-gradient(125% 100% at 62% 12%, #f8f8f9 0%, #efeff1 46%, #e4e4e8 100%) fixed
Accent #b5614a · accent ink #96482f · accent wash rgba(181,97,74,0.11)
Finale board #23262b, text #f1ede4
Type Space Grotesk 400/500/600/700 + Space Mono 400/700
```

## Content

All copy is in the DC file and is **verbatim from Blake's resume — do not paraphrase.**
Hero prompt: "All aboard! Scroll down to start the trip" / "Boulder to BNSF".
Finale is a neutral sign-off ("Thanks for riding the line.", station directory of
contact rows). Blake currently works at BNSF — no job-seeking language anywhere.

## Rules that must not drift

- No per-frame React state. RAF loop reads scroll; write transforms/opacity to refs.
- Scatter uses the seeded hash, never `Math.random()`:
  `const rand = s => { const x = Math.sin(s * 99.13) * 43758.5453; return x - Math.floor(x); };`
- Locomotives/containers unbranded: no reporting marks, road numbers or roadname lettering.
- Inspection scene frustum fits the full island disc at any aspect ratio — keep it.
- Boulder trees are excluded from Flatiron fin footprints (`inFin`); Longs summit has no boulders.

## Production concerns (not handled in the prototype)

- **Six WebGL contexts.** Fine on desktop; risky on mobile. Pause each RAF loop and
  consider releasing the context when its section is off-screen, or move to one shared
  renderer with scissor viewports.
- Lazy-load each diorama module as its section approaches (IntersectionObserver).
- Bundle three.js locally (npm) instead of the CDN import.
- `prefers-reduced-motion` / no-WebGL fallback: render the cards as a stacked document.
- A plain semantic `/resume` page with the same content for crawlers and ATS.
