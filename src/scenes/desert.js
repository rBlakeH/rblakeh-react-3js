// Chapter 2 diorama — Albuquerque: the Sandia escarpment, high-desert floor,
// and a very tired RV parked out where nobody is looking.
// Same contract as boulder-diorama: orthographic, seeded, scroll-driven.
import * as THREE from 'three';
import { disposeScene } from './lib/dispose.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rand = (s) => { const x = Math.sin(s * 99.13) * 43758.5453; return x - Math.floor(x); };
const h2 = (x, y) => { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); };
function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(h2(xi, yi), h2(xi + 1, yi), u), lerp(h2(xi, yi + 1), h2(xi + 1, yi + 1), u), v) * 2 - 1;
}
function fbm(x, y, oct = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * noise2(x * f, y * f); a *= 0.5; f *= 2.05; }
  return s;
}

const R = 31;
const RANGE_X = -17;

/* ---------- desert floor ---------- */
function H(x, z) {
  const west = clamp01((6 - x) / 30);
  let h = 0.5 + 4.6 * Math.pow(west, 2.1);                 // apron running up to the range
  h += 1.0 * fbm(x * 0.045, z * 0.045);
  h += 0.34 * fbm(x * 0.17, z * 0.17, 3);
  // two arroyos cut across the flat
  const cut = (zc, w) => -1.5 * Math.exp(-Math.pow((z - zc - Math.sin(x * 0.12) * 3.2) / w, 2));
  h += cut(-8, 3.0) + cut(11, 2.4);
  // sand banks up against the range so its foot is buried, never exposed
  const ca = Math.cos(-GROUP_RY), sa = Math.sin(-GROUP_RY);
  const dx = x - GROUP_POS[0], dz = z - GROUP_POS[2];
  const lx = dx * ca - dz * sa, lz = dx * sa + dz * ca;
  const along = clamp01(1 - Math.abs(lz) / 32);
  const bank = 5.4 * along * (1 - smoothstep(-2, 21, lx)) * (0.8 + 0.4 * fbm(lz * 0.14, lx * 0.14, 2));
  h = Math.max(h, bank);
  const r = Math.hypot(x * 0.94, z);
  h *= 1 - smoothstep(R * 0.74, R, r);
  return Math.max(0.04, h);
}

const C_SAND = new THREE.Color('#d2b98f');
const C_PALE = new THREE.Color('#ddc9a3');
const C_RED = new THREE.Color('#bf9a75');
const C_SCRUB = new THREE.Color('#9da072');

function floor() {
  const seg = 140, size = R * 2.1;
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
    const n = fbm(x * 0.11, z * 0.11, 2);
    c.copy(C_SAND).lerp(C_PALE, clamp01(0.4 + n));
    c.lerp(C_RED, clamp01((y - 1.4) / 3.2));
    c.lerp(C_SCRUB, clamp01(0.22 + n * 0.5) * 0.45);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.96 }));
  m.receiveShadow = true;
  return m;
}

function plinth() {
  const g = new THREE.Group();
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R * 0.975, 2.2, 96),
    new THREE.MeshStandardMaterial({ color: '#c0aa8c', flatShading: true, roughness: 0.95 })
  );
  soil.position.y = -1.1;
  soil.receiveShadow = true;
  g.add(soil);
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 1.008, R * 1.008, 0.35, 96),
    new THREE.MeshStandardMaterial({ color: '#a8916f', roughness: 0.9 })
  );
  rim.position.y = -0.18;
  g.add(rim);
  return g;
}

/* ---------- the Sandia escarpment: steep west face, long east dip ---------- */
// Cross-section profile, west foot to east base. Height scaled per slice by a
// ridge envelope + noise, so the crest line wanders and throws spurs.
const PROFILE = [
  [-5.0, 0.00], [-3.6, 0.26], [-2.4, 0.58], [-1.4, 0.82],
  [-0.6, 0.94], [0.0, 1.00], [1.2, 0.96], [3.0, 0.82],
  [5.8, 0.60], [9.0, 0.38], [12.4, 0.17], [15.5, 0.00],
];

const GROUP_POS = [-19.5, -2.4, 13.5];
const GROUP_RY = 0.60;

const Z_LEN = 52;

// Approximate height of the massif at a world point — used to keep plants out
// of the rock without hand-tuned exclusion wedges.
function rockHeight(x, z) {
  const ca = Math.cos(-GROUP_RY), sa = Math.sin(-GROUP_RY);
  const dx = x - GROUP_POS[0], dz = z - GROUP_POS[2];
  const lx = dx * ca - dz * sa, lz = dx * sa + dz * ca;
  const tz = (lz + Z_LEN / 2) / Z_LEN;
  if (tz <= 0 || tz >= 1) return 0;
  if (lx <= PROFILE[0][0] || lx >= PROFILE[PROFILE.length - 1][0]) return 0;
  let ph = 0;
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const [ax, ah] = PROFILE[i], [bx, bh] = PROFILE[i + 1];
    if (lx >= ax && lx <= bx) { ph = lerp(ah, bh, (lx - ax) / (bx - ax)); break; }
  }
  const env = Math.pow(Math.sin(Math.PI * tz), 0.28);
  return ph * 14.0 * env + GROUP_POS[1];
}

function sandias() {
  // A closed solid: the crest profile swept along z, then a return path at
  // depth so the mass has a back and a floor — no hollow shell to see through
  // while the scene is flying in.
  const zLen = Z_LEN, slices = 108;
  const FLOOR = 0.2;    // buried by the sand bank in H()
  const cols = PROFILE.length;
  const ring = cols * 2;                     // top path + return path
  const pos = [], col = [], idx = [];
  // Sandia palette: watermelon rose on the sunlit crest, mauve mid, cool
  // gray-violet in the shadowed west face and the foothill skirt.
  const cRose = new THREE.Color('#c2544a');
  const cRoseHot = new THREE.Color('#d4715c');
  const cMauve = new THREE.Color('#9a6a6a');
  const cViolet = new THREE.Color('#6f5f6d');
  const cFoot = new THREE.Color('#7a6a62');
  const c = new THREE.Color();

  const crest = [];
  for (let j = 0; j <= slices; j++) {
    const tz = j / slices;
    const z = -zLen / 2 + tz * zLen;
    // rounded ends: the mass falls away smoothly instead of being cut off
    const env = Math.pow(Math.sin(Math.PI * tz), 0.28);
    // watermelon: a long flat summit plateau with a few notches, not peaks
    const notch = 1 - 0.16 * Math.pow(Math.abs(Math.sin(z * 0.42 + 0.7)), 6)
                    - 0.1 * Math.pow(Math.abs(Math.sin(z * 0.19 - 1.1)), 4);
    const hScale = (14.0 + 1.4 * fbm(z * 0.07, 3.1, 2)) * env * notch;
    crest.push({ z, hScale, env });
  }

  for (let j = 0; j <= slices; j++) {
    const { z: z0, hScale, env } = crest[j];
    for (let k = 0; k < ring; k++) {
      let z = z0;
      const top = k < cols;
      const i = top ? k : ring - 1 - k;
      const [px, ph] = PROFILE[i];
      const edge = i === 0 || i === cols - 1;
      let x, y;
      if (top) {
        // angular ribs: vertical buttresses down the west face, softer east dip
        const rib = Math.sin(z * 0.85 + fbm(z * 0.3, px * 0.2, 2) * 2.2);
        const ribAmt = (px < 1 ? 1.5 : 0.5) * Math.pow(ph, 1.2);
        const wob = edge ? 0 : fbm(px * 0.34 + 7, z * 0.3, 4);
        x = px * (0.9 + 0.2 * env) + (edge ? 0 : wob * 1.5 + rib * ribAmt * 0.45);
        y = ph * hScale + (edge ? 0 : rib * ribAmt + wob * (0.8 + ph * 2.0));
        // plateau: flatten anything near the summit onto the tabletop
        if (ph > 0.9) y = hScale * (0.955 + 0.045 * ph) + rib * 0.5;
        y = Math.max(0.2, y);

      } else {
        x = px * (0.9 + 0.2 * env);
        y = FLOOR;
      }
      // clamp every vertex inside the island, and sink the crest as it nears
      // the edge, so no rock hangs over empty space
      {
        const ca = Math.cos(GROUP_RY), sa = Math.sin(GROUP_RY);
        let wx = x * ca + z * sa + GROUP_POS[0];
        let wz = -x * sa + z * ca + GROUP_POS[2];
        const wr = Math.hypot(wx * 0.94, wz);
        const LIM = R - 2.5;
        if (top) y = Math.max(0.2, y * (1 - smoothstep(LIM - 7, LIM, wr)));
        if (wr > LIM) {
          const k = LIM / wr;
          wx *= k; wz *= k;
          const lx = wx - GROUP_POS[0], lz = wz - GROUP_POS[2];
          x = lx * ca - lz * sa;
          z = lx * sa + lz * ca;
        }
      }
      pos.push(x, y, z);
      const t = clamp01(y / 16);
      const band = 0.5 + 0.5 * Math.sin(y * 2.3 + fbm(z * 0.32, y * 0.3, 2) * 2.6);
      c.copy(cFoot).lerp(cViolet, clamp01(t * 2.2));
      c.lerp(cMauve, clamp01((t - 0.3) * 2.0));
      c.lerp(cRose, clamp01((t - 0.38) * 2.2));
      c.lerp(cRoseHot, clamp01((t - 0.62) * 2.6));
      c.lerp(cViolet, band * 0.14 + (px < -2 ? 0.16 : 0));
      if (!top) c.lerp(cFoot, 0.8);
      col.push(c.r, c.g, c.b);
    }
    if (j < slices) {
      for (let k = 0; k < ring; k++) {
        const k2 = (k + 1) % ring;
        const a = j * ring + k, b = j * ring + k2;
        const d = a + ring, e = b + ring;
        idx.push(a, d, b, b, d, e);
      }
    }
  }
  // cap both z ends so the solid is closed
  const capCenter = [];
  for (const j of [0, slices]) {
    const base = pos.length / 3;
    let cx = 0, cy = 0, cz = 0;
    for (let k = 0; k < ring; k++) {
      cx += pos[(j * ring + k) * 3];
      cy += pos[(j * ring + k) * 3 + 1];
      cz += pos[(j * ring + k) * 3 + 2];
    }
    pos.push(cx / ring, cy / ring, cz / ring);
    col.push(cFoot.r, cFoot.g, cFoot.b);
    for (let k = 0; k < ring; k++) {
      const k2 = (k + 1) % ring;
      const a = j * ring + k, b = j * ring + k2;
      if (j === 0) idx.push(base, b, a); else idx.push(base, a, b);
    }
    capCenter.push(base);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.94 }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const group = new THREE.Group();
  group.add(mesh);


  group.position.set(GROUP_POS[0], GROUP_POS[1], GROUP_POS[2]);
  group.rotation.y = GROUP_RY;
  return group;
}

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

/* ---------- desert vegetation ---------- */
const CACTUS_G = ['#5c7250', '#688059', '#546a4b'];

function columnarCactus(x, z, seed) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: CACTUS_G[Math.floor(rand(seed) * 3)], flatShading: true, roughness: 0.85 });
  const h = 2.6 + rand(seed + 1) * 2.2;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, h, 9), m);
  trunk.position.y = h / 2;
  trunk.castShadow = true;
  g.add(trunk);
  const arms = rand(seed + 2) > 0.45 ? 1 + Math.floor(rand(seed + 3) * 2) : 0;
  for (let i = 0; i < arms; i++) {
    const side = rand(seed + i * 5) > 0.5 ? 1 : -1;
    const at = 0.4 + rand(seed + i * 7) * 0.25;
    const al = 0.9 + rand(seed + i * 9) * 0.8;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, al, 8), m);
    arm.position.set(side * 0.5, h * at, 0);
    arm.rotation.z = -side * 1.1;
    arm.castShadow = true;
    g.add(arm);
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.2, al * 1.2, 8), m);
    up.position.set(side * (0.5 + al * 0.45), h * at + al * 0.75, 0);
    up.castShadow = true;
    g.add(up);
  }
  g.position.set(x, H(x, z) - 0.1, z);
  g.rotation.y = rand(seed + 11) * 3;
  return g;
}

function cholla(x, z, seed) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: '#7d8f60', flatShading: true, roughness: 0.9 });
  const n = 5 + Math.floor(rand(seed) * 5);
  for (let i = 0; i < n; i++) {
    const l = 0.5 + rand(seed + i * 3) * 0.7;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, l, 6), m);
    const a = rand(seed + i) * Math.PI * 2;
    const tilt = 0.25 + rand(seed + i * 5) * 0.8;
    seg.position.set(Math.cos(a) * 0.32 * i * 0.25, 0.35 + i * 0.18, Math.sin(a) * 0.32 * i * 0.25);
    seg.rotation.set(Math.sin(a) * tilt, a, Math.cos(a) * tilt);
    seg.castShadow = true;
    g.add(seg);
  }
  g.position.set(x, H(x, z), z);
  g.scale.setScalar(0.85 + rand(seed + 2) * 0.6);
  return g;
}

function pricklyPear(x, z, seed) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: '#6c8455', flatShading: true, roughness: 0.88 });
  const n = 3 + Math.floor(rand(seed) * 4);
  for (let i = 0; i < n; i++) {
    const s = 0.4 + rand(seed + i * 3) * 0.35;
    const pad = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), m);
    pad.scale.set(1, 1.25, 0.28);
    const a = rand(seed + i * 7) * Math.PI * 2;
    pad.position.set(Math.cos(a) * 0.3, s * 0.9 + rand(seed + i) * 0.3, Math.sin(a) * 0.3);
    pad.rotation.set(0, a, (rand(seed + i * 11) - 0.5) * 0.5);
    pad.castShadow = true;
    g.add(pad);
  }
  g.position.set(x, H(x, z), z);
  return g;
}

function yucca(x, z, seed) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: '#79895c', flatShading: true, roughness: 0.9 });
  const n = 9 + Math.floor(rand(seed) * 6);
  for (let i = 0; i < n; i++) {
    const l = 0.9 + rand(seed + i * 3) * 0.7;
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.075, l, 4), m);
    const a = (i / n) * Math.PI * 2 + rand(seed) * 2;
    const tilt = 0.5 + rand(seed + i) * 0.55;
    blade.position.set(Math.cos(a) * l * 0.3, l * 0.45, Math.sin(a) * l * 0.3);
    blade.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
    blade.castShadow = true;
    g.add(blade);
  }
  if (rand(seed + 5) > 0.45) {
    const spike = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.2, 6), new THREE.MeshStandardMaterial({ color: '#d8cfae', flatShading: true }));
    spike.position.y = 1.5;
    spike.castShadow = true;
    g.add(spike);
  }
  g.position.set(x, H(x, z), z);
  g.scale.setScalar(0.8 + rand(seed + 1) * 0.6);
  return g;
}

function creosote(x, z, seed) {
  const m = new THREE.Mesh(
    jitter(new THREE.IcosahedronGeometry(0.34 + rand(seed) * 0.4, 1), 0.16, seed),
    new THREE.MeshStandardMaterial({ color: rand(seed + 2) > 0.5 ? '#8a9464' : '#7b8659', flatShading: true, roughness: 0.95 })
  );
  m.position.set(x, H(x, z) + 0.12, z);
  m.scale.y = 0.75;
  m.castShadow = true;
  return m;
}

function cottonwood(x, z, seed) {
  const g = new THREE.Group();
  const h = 3.4 + rand(seed) * 1.4;
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, h, 7), new THREE.MeshStandardMaterial({ color: '#6b5a48', flatShading: true, roughness: 0.95 }));
  t.position.y = h / 2;
  t.castShadow = true;
  g.add(t);
  const leafM = new THREE.MeshStandardMaterial({ color: rand(seed + 1) > 0.5 ? '#94a35c' : '#a5ac63', flatShading: true, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const s = 1.5 + rand(seed + i * 3) * 0.7;
    const crown = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(s, 1), 0.2, seed + i), leafM);
    crown.position.set((rand(seed + i) - 0.5) * 1.5, h * 0.92 + i * 0.5, (rand(seed + i * 5) - 0.5) * 1.5);
    crown.scale.y = 0.8;
    crown.castShadow = true;
    g.add(crown);
  }
  g.position.set(x, H(x, z) - 0.1, z);
  return g;
}

/* ---------- the RV ---------- */
function rv() {
  const g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: '#ddd3bd', flatShading: true, roughness: 0.82 });
  const stripeA = new THREE.MeshStandardMaterial({ color: '#c8873a', flatShading: true, roughness: 0.85 });
  const stripeB = new THREE.MeshStandardMaterial({ color: '#9d4a2f', flatShading: true, roughness: 0.85 });
  const stripe = stripeB;
  const glass = new THREE.MeshStandardMaterial({ color: '#4a5560', roughness: 0.35, metalness: 0.2, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: '#33363a', flatShading: true, roughness: 0.9 });

  const L = 8.4, W = 2.9, Hh = 2.6;
  const body = new THREE.Mesh(new THREE.BoxGeometry(L, Hh, W), shell);
  body.position.y = 1.55 + Hh / 2 - 0.55;
  body.castShadow = true;
  g.add(body);

  // cab: lower, set forward
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.55, W * 0.94), shell);
  cab.position.set(L / 2 + 0.75, 1.75, 0);
  cab.castShadow = true;
  g.add(cab);
  const wind = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.9, W * 0.78), glass);
  wind.position.set(L / 2 + 1.78, 2.05, 0);
  g.add(wind);

  // roof cap + stovepipe
  const cap = new THREE.Mesh(new THREE.BoxGeometry(L * 0.94, 0.22, W * 0.96), shell);
  cap.position.y = 1.55 + Hh - 0.42;
  cap.castShadow = true;
  g.add(cap);
  const vent = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.7), new THREE.MeshStandardMaterial({ color: '#e8e4d8', flatShading: true }));
  vent.position.set(-1.2, 1.55 + Hh - 0.2, 0.4);
  g.add(vent);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.9, 8), dark);
  pipe.position.set(1.6, 1.55 + Hh + 0.1, -0.5);
  pipe.castShadow = true;
  g.add(pipe);

  // stripes + windows
  [[1.52, 0.26, stripeA], [1.80, 0.16, stripeB], [2.00, 0.10, stripeA]].forEach(([y, th, m]) => {
    const st = new THREE.Mesh(new THREE.BoxGeometry(L * 1.002, th, W * 1.006), m);
    st.position.y = y;
    g.add(st);
  });
  [[-2.6, 1.3], [0.2, 1.1], [2.6, 1.0]].forEach(([x, w]) => {
    for (const zz of [W / 2, -W / 2]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(w, 0.85, 0.08), glass);
      win.position.set(x, 3.0, zz);
      g.add(win);
    }
  });
  // skirt + wheels
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(L * 0.98, 0.5, W * 0.9), dark);
  skirt.position.y = 1.1;
  g.add(skirt);
  [[3.3, W / 2 - 0.15], [3.3, -W / 2 + 0.15], [-2.1, W / 2 - 0.15], [-2.1, -W / 2 + 0.15], [-3.2, W / 2 - 0.15], [-3.2, -W / 2 + 0.15]].forEach(([x, z]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.42, 14), dark);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.72, z);
    w.castShadow = true;
    g.add(w);
  });

  // camp clutter: two chairs and a cooler
  const chairM = new THREE.MeshStandardMaterial({ color: '#7e5e52', flatShading: true, roughness: 0.9 });
  [[-1.4, 3.75, 0.14], [0.5, 3.9, -0.12]].forEach(([x, z, ry]) => {
    const ch = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), chairM);
    seat.position.y = 0.55;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 0.1), chairM);
    back.position.set(0, 0.92, -0.32);
    ch.add(seat, back);
    for (const [ox, oz] of [[0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 5), chairM);
      leg.position.set(ox, 0.28, oz);
      ch.add(leg);
    }
    ch.position.set(x, 0, z);
    ch.rotation.y = ry;
    ch.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.add(ch);
  });
  // two figures in yellow hazmat suits, sat in camp chairs against the coach
  const suit = new THREE.MeshStandardMaterial({ color: '#f2c323', flatShading: true, roughness: 0.78 });
  const mask = new THREE.MeshStandardMaterial({ color: '#2b2f33', flatShading: true, roughness: 0.6 });
  const shoe = new THREE.MeshStandardMaterial({ color: '#e8e6e0', flatShading: true, roughness: 0.9 });
  function hazmat(x, z, ry) {
    const p = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.6, 0.34), suit);
    torso.position.y = 0.88;
    p.add(torso);
    const hood = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 1), suit);
    hood.position.y = 1.34;
    p.add(hood);
    const resp = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.12), mask);
    resp.position.set(0, 1.3, 0.22);
    p.add(resp);
    for (const sx of [-0.31, 0.31]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.16), suit);
      arm.position.set(sx, 0.9, 0.06);
      arm.rotation.x = -0.5;
      p.add(arm);
    }
    for (const sx of [-0.14, 0.14]) {
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.17, 0.52), suit);
      thigh.position.set(sx, 0.6, 0.24);
      p.add(thigh);
      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.52, 0.17), suit);
      shin.position.set(sx, 0.32, 0.48);
      p.add(shin);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.11, 0.3), shoe);
      foot.position.set(sx, 0.06, 0.58);
      p.add(foot);
    }
    p.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    p.position.set(x, 0, z);
    p.rotation.y = ry;
    return p;
  }
  g.add(hazmat(-1.4, W / 2 + 2.3, 0.14));
  g.add(hazmat(0.5, W / 2 + 2.45, -0.12));

  return g;
}

function smoke() {
  const g = new THREE.Group();
  g.userData.puffs = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.MeshStandardMaterial({ color: '#e8e6e2', transparent: true, opacity: 0.5, roughness: 1, flatShading: true });
    const puff = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(0.42, 1), 0.12, i * 3 + 1), m);
    puff.userData.phase = i / 9;
    g.add(puff);
    g.userData.puffs.push(puff);
  }
  return g;
}

/* ---------- scatter ---------- */
function scatter(group, range) {
  // Low shrubs only, on a jittered grid so cover is even across the whole
  // island — including behind the RV. No tall cacti, no trees.
  // Test against the real rock mesh: drop a ray and see if rock stands above
  // the sand there. The analytic profile over-reports the buried east dip.
  range.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const down = new THREE.Vector3(0, -1, 0);
  const o = new THREE.Vector3();
  const exposed = (x, z) => {
    o.set(x, 60, z);
    ray.set(o, down);
    const hit = ray.intersectObject(range, true)[0];
    return !!hit && hit.point.y > H(x, z) - 0.1;
  };
  const offRange = (x, z) => {
    if (exposed(x, z)) return false;
    for (const [ox, oz] of [[2.5, 0], [-2.5, 0], [0, 2.5], [0, -2.5], [1.8, 1.8], [-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8]]) {
      if (exposed(x + ox, z + oz)) return false;
    }
    return true;
  };
  // RV footprint + the figures out front, tested in the coach's local frame
  const RV_X = 7.5, RV_Z = 1, RV_RY = 2.08, RV_S = 1.35;
  const offRV = (x, z) => {
    const dx = x - RV_X, dz = z - RV_Z;
    const c = Math.cos(RV_RY), s = Math.sin(RV_RY);
    const lx = (dx * c - dz * s) / RV_S, lz = (dx * s + dz * c) / RV_S;
    return !(lx > -5.6 && lx < 7.0 && lz > -2.6 && lz < 5.8);
  };
  const STEP = 3.6;
  let i = 0;
  for (let gx = -R; gx <= R; gx += STEP) {
    for (let gz = -R; gz <= R; gz += STEP) {
      i++;
      const x = gx + (rand(i * 1.73) - 0.5) * STEP * 0.9;
      const z = gz + (rand(i * 2.91) - 0.5) * STEP * 0.9;
      if (Math.hypot(x * 0.94, z) > R - 2.2) continue;
      if (!offRV(x, z) || !offRange(x, z)) continue;
      if (rand(i * 4.37) > 0.82) continue;          // a few gaps so it isn't a lattice
      const pick = rand(i * 7.3);
      if (pick < 0.64) group.add(creosote(x, z, i * 3 + 2));
      else if (pick < 0.76) group.add(pricklyPear(x, z, i * 17 + 7));
      else if (pick < 0.88) group.add(cholla(x, z, i * 13 + 5));
      else group.add(yucca(x, z, i * 19 + 9));
    }
  }
}

/* ---------- element ---------- */
class DesertDiorama {
  /**
   * @param {HTMLElement} host element the renderer canvas is appended to
   * @param {{card?: HTMLElement|null}} [ctx] optional page context
   */
  constructor(host, ctx = {}) {
    this.host = host;
    this.card = ctx.card ?? null;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
    this.host.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#e9e9ec', 152, 272);
    this.scene = scene;

    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
    this.cam = cam;

    scene.add(new THREE.HemisphereLight('#efe6d8', '#9c8a70', 0.8));
    const sun = new THREE.DirectionalLight('#fff0d8', 2.1);
    sun.position.set(-30, 44, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 160;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.05;
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#dcd7cc', 0.45);
    fill.position.set(30, 16, -26);
    scene.add(fill);

    const world = new THREE.Group();
    this.world = world;
    scene.add(world);
    world.add(plinth());
    world.add(floor());
    const range = sandias();
    world.add(range);
    const camper = rv();
    camper.scale.setScalar(1.35);
    camper.position.set(7.5, H(7.5, 1), 1);
    camper.rotation.y = 2.08;
    world.add(camper);
    this.smoke = smoke();
    this.smoke.position.set(7.5, 0, 1);
    this.smoke.rotation.y = 2.08;
    camper.parent.add(this.smoke);
    this.smokeBase = new THREE.Vector3(2.2, H(7.5, 1) + 6.4, -0.8);
    scatter(world, range);

    this.az = -0.86; this.el = 0.60; this.fr = 74;
    this.clock = new THREE.Clock();
    this.resize();
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(this.host);
  }

  dispose() {
    this._ro?.disconnect();
    disposeScene(this.scene, this.renderer);
  }

  resize() {
    const w = this.host.clientWidth || 800, h = this.host.clientHeight || 600;
    this.renderer.setSize(w, h, false);
    this.aspect = w / h;
  }

  /** One step of the page loop. @param {number} p this station's scroll progress */
  frame = (p) => {
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;

    const azT = lerp(-0.92, -0.26, smoothstep(0, 1, p));
    const elT = lerp(0.60, 0.40, smoothstep(0.1, 0.95, p));
    const frT = lerp(74, 62, smoothstep(0.05, 0.95, p));
    this.az = lerp(this.az, azT, 0.045);
    this.el = lerp(this.el, elT, 0.045);
    this.fr = lerp(this.fr, frT, 0.05);

    // stovepipe smoke drifts up and downwind
    for (const puff of this.smoke.userData.puffs) {
      const life = ((t * 0.16 + puff.userData.phase) % 1);
      puff.position.set(
        this.smokeBase.x + life * 1.9 + Math.sin(life * 6 + puff.userData.phase * 9) * 0.35,
        this.smokeBase.y + life * 5.4,
        this.smokeBase.z - life * 1.1
      );
      const s = 0.55 + life * 1.9;
      puff.scale.setScalar(s);
      puff.material.opacity = 0.44 * (1 - life) * Math.min(1, life * 6);
    }

    const halfH = this.fr / 2, halfW = halfH * (this.aspect || 1.4);
    const c = this.cam;
    c.left = -halfW; c.right = halfW; c.top = halfH; c.bottom = -halfH;
    c.updateProjectionMatrix();
    const d = 150;
    c.position.set(
      Math.cos(this.az) * Math.cos(this.el) * d,
      Math.sin(this.el) * d,
      Math.sin(this.az) * Math.cos(this.el) * d + 4
    );
    c.lookAt(lerp(2.0, -2.0, smoothstep(0.2, 1, p)), 5.0, lerp(2, -2, p));
    this.renderer.render(this.scene, c);
  };
}

/**
 * @param {HTMLElement} host
 * @param {{card?: HTMLElement|null}} [ctx]
 * @returns {{frame: (p: number) => void, resize: () => void, dispose: () => void}}
 */
export const mount = (host, ctx) => new DesertDiorama(host, ctx);
