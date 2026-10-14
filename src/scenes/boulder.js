// Chapter 1 diorama — Chautauqua Park & the Flatirons, Boulder CO.
// Orthographic isometric framing; scroll drives a slow turntable + push-in.
// Terrain and rock are value-noise displaced (seeded, reload-stable) rather
// than primitive stacks — the point is a hand-built diorama read, not boxes.
import * as THREE from 'three';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rand = (s) => { const x = Math.sin(s * 99.13) * 43758.5453; return x - Math.floor(x); };

/* ---------- value noise ---------- */
const h2 = (x, y) => { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); };
function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1;
}
function fbm(x, y, oct = 4) {
  let s = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += amp * noise2(x * f, y * f); amp *= 0.5; f *= 2.05; }
  return s;
}

/* ---------- terrain ---------- */
const R = 31;                              // diorama radius
const RIDGE_X = -9;                       // where the Flatirons ridge sits

function H(x, z) {
  const west = clamp01((7 - x) / 26);
  let h = 0.8 + 11.5 * Math.pow(west, 1.55);        // foothill rise to the west
  h += 1.15 * smoothstep(0.35, 1, west) * Math.sin(z * 0.16 + 1.1);  // gully / drainage
  h += 2.1 * fbm(x * 0.052, z * 0.052);
  h += 0.5 * fbm(x * 0.2, z * 0.2, 3);
  const r = Math.hypot(x * 0.94, z);
  h *= 1 - smoothstep(R * 0.74, R * 1.0, r);
  return Math.max(0.05, h);
}

const C_MEADOW = new THREE.Color('#87994f');
const C_DRY = new THREE.Color('#b0a463');
const C_SCRUB = new THREE.Color('#6d7f4a');
const C_ROCK = new THREE.Color('#a4866c');

function terrain() {
  const seg = 136, size = R * 2.1;
  const g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = [];
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), z = p.getZ(i);
    const r = Math.hypot(x, z);
    if (r > R) { const k = R / r; x *= k; z *= k; p.setX(i, x); p.setZ(i, z); }
    const y = H(x, z);
    p.setY(i, y);
    const t = clamp01((y - 1.2) / 7.5);
    const n = fbm(x * 0.13, z * 0.13, 2);
    c.copy(C_MEADOW).lerp(C_DRY, clamp01(0.35 + n * 0.8));
    c.lerp(C_SCRUB, clamp01(t * 1.5 - 0.15 + n * 0.25));
    c.lerp(C_ROCK, clamp01((t - 0.62) * 2.6));
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 });
  const mesh = new THREE.Mesh(g, m);
  mesh.receiveShadow = true;
  return mesh;
}

function plinth() {
  const g = new THREE.Group();
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R * 0.975, 2.2, 96, 1, false),
    new THREE.MeshStandardMaterial({ color: '#b6a899', flatShading: true, roughness: 0.95 })
  );
  soil.position.y = -1.1;
  soil.receiveShadow = true;
  g.add(soil);
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 1.008, R * 1.008, 0.35, 96),
    new THREE.MeshStandardMaterial({ color: '#9a8c7d', roughness: 0.9 })
  );
  rim.position.y = -0.18;
  g.add(rim);
  return g;
}

/* ---------- rock: the Flatirons ---------- */
function jitter(geo, amt, seed) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    p.setX(i, x + fbm(x * 0.5 + seed, z * 0.5, 3) * amt);
    p.setY(i, y + fbm(y * 0.45 + seed * 1.7, x * 0.45, 3) * amt * 0.8);
    p.setZ(i, z + fbm(z * 0.5 + seed * 2.3, y * 0.5, 3) * amt);
  }
  geo.computeVertexNormals();
  return geo;
}

// One tilted sandstone fin: long dipping east face, steep west back.
function finGeo(len, height, thick, seed) {
  const pts = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push(new THREE.Vector2(t * len, (rand(seed + i) - 0.5) * 0.55));
  }
  const m = 7;
  for (let i = 1; i <= m; i++) {
    const t = i / m;
    const x = lerp(len, len * 0.14, t);
    const y = lerp(0, height, Math.pow(t, 0.88));
    pts.push(new THREE.Vector2(x + (rand(seed + 41 + i) - 0.5) * 0.9, y));
  }
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    pts.push(new THREE.Vector2(lerp(len * 0.14, 0, t) - rand(seed + 71 + i) * 0.7, lerp(height, 0, t * t)));
  }
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {
    depth: thick, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.3, bevelSegments: 1, curveSegments: 1,
  });
  geo.translate(-len * 0.5, 0, -thick / 2);
  return jitter(geo, 0.38, seed);
}

const SANDSTONE = ['#b0765a', '#a96c50', '#bc8464', '#a4664c', '#b57e60'];

const FINS = [
  { z: -11.5, len: 12.0, h: 10.5, t: 2.6, seed: 3 },
  { z: -5.0, len: 15.0, h: 14.0, t: 3.2, seed: 11 },
  { z: 1.5, len: 13.5, h: 12.2, t: 2.9, seed: 19 },
  { z: 8.0, len: 10.5, h: 9.2, t: 2.4, seed: 27 },
  { z: 14.0, len: 8.2, h: 7.0, t: 2.0, seed: 35 },
];
// true if a tree at (x,z) would poke through a Flatiron fin (incl. its lean + talus skirt)
const inFin = (x, z) => FINS.some((f) => {
  const fx = RIDGE_X - 3.5 - rand(f.seed) * 3.2;
  return Math.abs(z - f.z) < f.t * 1.1 + 1.6 && x > fx - f.len / 2 - 2 && x < fx + f.len / 2 + 6;
});
function flatirons() {
  const g = new THREE.Group();
  // five fins, south to north, receding westward like the real ridge line
  const fins = FINS;
  const _unused = [
    { z: -11.5, len: 12.0, h: 10.5, t: 2.6, seed: 3 },
    { z: -5.0, len: 15.0, h: 14.0, t: 3.2, seed: 11 },
    { z: 1.5, len: 13.5, h: 12.2, t: 2.9, seed: 19 },
    { z: 8.0, len: 10.5, h: 9.2, t: 2.4, seed: 27 },
    { z: 14.0, len: 8.2, h: 7.0, t: 2.0, seed: 35 },
  ];
  fins.forEach((f, i) => {
    const mesh = new THREE.Mesh(
      finGeo(f.len, f.h, f.t, f.seed),
      new THREE.MeshStandardMaterial({ color: SANDSTONE[i % SANDSTONE.length], flatShading: true, roughness: 0.9 })
    );
    const x = RIDGE_X - 3.5 - rand(f.seed) * 3.2;
    mesh.position.set(x, H(x, f.z) - 2.2, f.z);
    mesh.rotation.y = (rand(f.seed + 5) - 0.5) * 0.3;
    mesh.rotation.z = -0.26 - rand(f.seed + 9) * 0.1;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    // talus skirt at the base
    for (let k = 0; k < 7; k++) {
      const s = 0.5 + rand(f.seed * 3 + k) * 1.1;
      const bx = x + 2.5 + rand(f.seed + k * 7) * 5.5;
      const bz = f.z + (rand(f.seed + k * 11) - 0.5) * f.t * 1.7;
      const r = new THREE.Mesh(
        jitter(new THREE.IcosahedronGeometry(s, 0), 0.22, f.seed + k),
        new THREE.MeshStandardMaterial({ color: SANDSTONE[(i + k) % SANDSTONE.length], flatShading: true, roughness: 0.95 })
      );
      r.position.set(bx, H(bx, bz) - s * 0.35, bz);
      r.rotation.set(rand(k) * 3, rand(k + 1) * 3, rand(k + 2) * 3);
      r.castShadow = true;
      g.add(r);
    }
  });
  return g;
}

/* ---------- vegetation ---------- */
const NEEDLE = ['#3f5a3e', '#456349', '#37503a', '#4c6a4a'];
const TRUNK = new THREE.MeshStandardMaterial({ color: '#5d4736', flatShading: true, roughness: 0.95 });

function ponderosa(x, z, seed) {
  const g = new THREE.Group();
  const s = 0.75 + rand(seed) * 0.75;
  const th = 1.5 * s;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.17 * s, th, 6), TRUNK);
  trunk.position.y = th / 2;
  trunk.castShadow = true;
  g.add(trunk);
  const m = new THREE.MeshStandardMaterial({ color: NEEDLE[Math.floor(rand(seed + 3) * NEEDLE.length)], flatShading: true, roughness: 0.93 });
  const tiers = 3 + Math.floor(rand(seed + 1) * 2);
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const r = (1.25 - t * 0.72) * s;
    const hh = (2.3 - t * 0.5) * s;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, hh, 7), m);
    cone.position.set((rand(seed + i * 5) - 0.5) * 0.24 * s, th * 0.7 + i * 1.15 * s + hh * 0.4, (rand(seed + i * 9) - 0.5) * 0.24 * s);
    cone.rotation.y = rand(seed + i) * 3;
    cone.castShadow = true;
    g.add(cone);
  }
  g.position.set(x, H(x, z) - 0.15, z);
  g.rotation.z = (rand(seed + 7) - 0.5) * 0.1;
  return g;
}

function aspenClump(x, z, seed) {
  const g = new THREE.Group();
  const bark = new THREE.MeshStandardMaterial({ color: '#d6d3c4', flatShading: true, roughness: 0.85 });
  const leaf = new THREE.MeshStandardMaterial({ color: rand(seed) > 0.55 ? '#c8b44e' : '#9fb055', flatShading: true, roughness: 0.9 });
  for (let i = 0; i < 4 + Math.floor(rand(seed) * 3); i++) {
    const s = 0.7 + rand(seed + i * 3) * 0.5;
    const hh = 3.0 * s;
    const ox = (rand(seed + i) - 0.5) * 2.6, oz = (rand(seed + i * 7) - 0.5) * 2.6;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.075 * s, 0.1 * s, hh, 5), bark);
    t.position.set(ox, hh / 2, oz);
    t.castShadow = true;
    g.add(t);
    const crown = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(0.85 * s, 1), 0.12, seed + i), leaf);
    crown.position.set(ox, hh * 0.95, oz);
    crown.scale.y = 1.25;
    crown.castShadow = true;
    g.add(crown);
  }
  g.position.set(x, H(x, z) - 0.1, z);
  return g;
}

function shrub(x, z, seed) {
  const s = 0.35 + rand(seed) * 0.5;
  const m = new THREE.Mesh(
    jitter(new THREE.IcosahedronGeometry(s, 1), 0.14, seed),
    new THREE.MeshStandardMaterial({ color: rand(seed + 2) > 0.5 ? '#6f8248' : '#7d8c56', flatShading: true, roughness: 0.95 })
  );
  m.position.set(x, H(x, z) + s * 0.25, z);
  m.scale.y = 0.6;
  m.castShadow = true;
  return m;
}

/* ---------- Chautauqua: auditorium + cottages ---------- */
const CREAM = new THREE.MeshStandardMaterial({ color: '#e6ded0', flatShading: true, roughness: 0.85 });
const ROOF_G = new THREE.MeshStandardMaterial({ color: '#3f5245', flatShading: true, roughness: 0.8 });
const ROOF_R = new THREE.MeshStandardMaterial({ color: '#7c4a3c', flatShading: true, roughness: 0.85 });

function gableRoof(w, d, rise, matl) {
  const s = new THREE.Shape([
    new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, rise),
  ]);
  const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 1 });
  geo.translate(0, 0, -d / 2);
  const m = new THREE.Mesh(geo, matl);
  m.castShadow = true;
  return m;
}

function auditorium(x, z, ry) {
  const g = new THREE.Group();
  const w = 7.2, d = 5.2, wall = 2.5;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, wall, d), CREAM);
  body.position.y = wall / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  const roof = gableRoof(w * 1.06, d * 1.08, 2.3, ROOF_G);
  roof.position.y = wall;
  g.add(roof);
  // porch
  const porch = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.16, 1.5), CREAM);
  porch.position.set(w / 2 + 0.6, 0.5, 0);
  porch.rotation.y = Math.PI / 2;
  g.add(porch);
  const canopy = gableRoof(1.9, 3.2, 0.6, ROOF_G);
  canopy.position.set(w / 2 + 0.55, 1.8, 0);
  g.add(canopy);
  for (const pz of [-1.1, 1.1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.7, 6), CREAM);
    p.position.set(w / 2 + 1.25, 0.85, pz);
    g.add(p);
  }
  g.position.set(x, H(x, z) - 0.1, z);
  g.rotation.y = ry;
  return g;
}

function cottage(x, z, seed) {
  const g = new THREE.Group();
  const w = 2.4 + rand(seed) * 0.9, d = 2.1 + rand(seed + 1) * 0.7, wall = 1.25;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, wall, d), CREAM);
  body.position.y = wall / 2;
  body.castShadow = true;
  g.add(body);
  const roof = gableRoof(w * 1.1, d * 1.12, 1.0, rand(seed + 4) > 0.45 ? ROOF_G : ROOF_R);
  roof.position.y = wall;
  g.add(roof);
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.28), new THREE.MeshStandardMaterial({ color: '#8b6a5c', flatShading: true }));
  chimney.position.set(w * 0.28, wall + 0.6, 0);
  chimney.castShadow = true;
  g.add(chimney);
  g.position.set(x, H(x, z) - 0.08, z);
  g.rotation.y = rand(seed + 2) * Math.PI * 2;
  return g;
}

/* ---------- trail ---------- */
function trail(points, width = 1.15) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const N = 90;
  const pos = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPoint(t);
    const tan = curve.getTangent(t);
    const nx = -tan.z, nz = tan.x;
    const w = width * (0.75 + 0.35 * Math.sin(t * 9));
    for (const s of [-1, 1]) {
      const x = p.x + nx * w * 0.5 * s, z = p.z + nz * w * 0.5 * s;
      pos.push(x, H(x, z) + 0.07, z);
    }
    if (i < N) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#c0ab8b', flatShading: true, roughness: 0.98, side: THREE.DoubleSide }));
}

/* ---------- scatter ---------- */
function scatter(group) {
  // conifers hold the slopes and the ridge base; meadow stays open
  let n = 0;
  for (let i = 0; i < 300 && n < 95; i++) {
    const a = rand(i * 1.7) * Math.PI * 2;
    const rr = Math.sqrt(rand(i * 2.3)) * (R - 2.5);
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    const y = H(x, z);
    if (Math.hypot(x * 0.94, z) > R - 1.5) continue;
    const near = x < RIDGE_X + 7;
    const p = near ? 0.5 : clamp01((y - 1.4) / 4) * 0.55;
    if (rand(i * 5.1) > p) continue;
    if (x > 1 && x < 16 && Math.abs(z) < 7) continue;   // keep meadow + buildings clear
    if (inFin(x, z)) continue;
    group.add(ponderosa(x, z, i * 13 + 1));
    n++;
  }
  for (let i = 0; i < 7; i++) {
    const a = 1.7 + rand(i * 3.3) * 3.4;
    const rr = 12 + rand(i * 4.1) * 13;
    if (inFin(Math.cos(a) * rr, Math.sin(a) * rr)) continue;
    group.add(aspenClump(Math.cos(a) * rr, Math.sin(a) * rr, i * 17 + 5));
  }
  for (let i = 0; i < 110; i++) {
    const a = rand(i * 6.7) * Math.PI * 2;
    const rr = Math.sqrt(rand(i * 8.9)) * (R - 2);
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (Math.hypot(x * 0.94, z) > R - 1.2) continue;
    group.add(shrub(x, z, i * 3 + 2));
  }
}


/* ---------- scene module ---------- */
// Ported from the prototype's <boulder-diorama> custom element. What changed:
//   - three.js comes from the npm package, not the CDN.
//   - no RAF loop and no scroll reading of its own; the page's single driver
//     calls frame(progress) only while the section is on screen.
//   - preserveDrawingBuffer is off. That was prototype thumbnailing; it costs
//     fill rate and blocks driver-side optimisations.
//   - dispose() actually frees the GPU resources, since scenes are mounted and
//     unmounted as you scroll.
// Geometry, colours, lights and camera numbers are unchanged.

export function mount(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#e9e9ec', 152, 272);

  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);

  scene.add(new THREE.HemisphereLight('#dfe7f0', '#8d8470', 0.72));
  const sun = new THREE.DirectionalLight('#fff3e2', 2.0);
  sun.position.set(-34, 46, 26);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 160;
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.05;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#cfd8e6', 0.5);
  fill.position.set(30, 18, -24);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);
  world.add(plinth());
  world.add(terrain());
  world.add(flatirons());
  world.add(trail([[14, -13], [9, -8.5], [6.5, -2], [2.5, 3], [-3, 5.5], [-8, 3.5], [-11.5, -1]]));
  world.add(auditorium(8.5, 1.5, -0.42));
  [[13.5, -4.5, 2], [4.8, 7.2, 9], [12.5, 6.5, 15], [2.2, -5.5, 23]].forEach(([x, z, s]) => world.add(cottage(x, z, s)));
  scatter(world);

  // camera state, lerped toward its scroll target every frame
  let az = -0.72, elev = 0.58, fr = 84;
  let aspect = 1.4;

  function resize() {
    const w = host.clientWidth || 800, h = host.clientHeight || 600;
    renderer.setSize(w, h, false);
    aspect = w / h;
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  return {
    // scroll: slow turntable from south-east toward east, easing down to a
    // flatter elevation and pushing in on the ridge
    frame(p) {
      const azT = lerp(-0.86, -0.18, smoothstep(0, 1, p));
      const elT = lerp(0.62, 0.40, smoothstep(0.1, 0.95, p));
      const frT = lerp(84, 70, smoothstep(0.05, 0.95, p));
      az = lerp(az, azT, 0.045);
      elev = lerp(elev, elT, 0.045);
      fr = lerp(fr, frT, 0.05);

      const halfH = fr / 2, halfW = halfH * (aspect || 1.4);
      cam.left = -halfW; cam.right = halfW; cam.top = halfH; cam.bottom = -halfH;
      cam.updateProjectionMatrix();

      const d = 150;
      cam.position.set(
        Math.cos(az) * Math.cos(elev) * d,
        Math.sin(elev) * d,
        Math.sin(az) * Math.cos(elev) * d + 4
      );
      const focus = lerp(1.0, -3.0, smoothstep(0.2, 1, p));
      cam.lookAt(focus, 4.4, lerp(3, -1, p));

      renderer.render(scene, cam);
    },

    resize,

    dispose() {
      ro.disconnect();
      scene.traverse((o) => {
        if (!o.isMesh) return;
        o.geometry?.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
