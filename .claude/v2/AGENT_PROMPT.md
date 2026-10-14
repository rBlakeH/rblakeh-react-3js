# Claude Code prompt

Copy this folder into your `rblakeh-react-3js` clone, open Claude Code in the repo,
and paste the block below.

```
I'm rebuilding my portfolio site from an approved design prototype in
./design_handoff_portfolio_v2/. Read README.md, the six *-diorama.js files and
"Blake Hampton Portfolio v2.dc.html" before writing any code. Ignore support.js.

The prototype is the spec: copy, styles, scroll timings, camera numbers and
geometry are tuned — port them exactly. Copy is verbatim from my resume; never
paraphrase it.

STEP 1 — PLAN, THEN STOP
Look at the current repo (it uses React + react-three-fiber). Recommend a stack.
My preference: Vite + React (or no framework) for the DOM, with each diorama as a
plain three.js module exposing mount(el) / dispose(), driven by one shared scroll
loop. The scenes are built once and only transformed on scroll, so R3F adds little.
Give your recommendation, the target file structure, and anything in the prototype
you think won't survive production. Then wait for my go-ahead.

STEP 2+ — BUILD IN REVIEWABLE STEPS on a branch named v2, stopping after each:
  1. Scaffold + page shell: gradient, fonts, hero, sticky sections with the
     -100vh overlap, scroll progress model. No 3D yet.
  2. Port one scene (Boulder) + its card end to end. Confirm it matches the prototype.
  3. Remaining four stations.
  4. Finale: terminus scene, split-flap directory, route jump links.
  5. Performance: npm three.js, lazy-load each scene, pause off-screen RAF loops,
     handle the six-WebGL-context problem on mobile (README explains).
  6. Reduced-motion / no-WebGL fallback and a semantic /resume page.
  7. Deploy config for Vercel (or Netlify) — static build.

CONSTRAINTS
  - No per-frame React state; RAF loop writes to refs.
  - Seeded hash for all scatter, never Math.random().
  - Trains and containers stay unbranded.
  - Ask before adding any dependency beyond three and the build tool.
  - If something looks wrong on screen, propose a fix instead of silently deviating.
```
