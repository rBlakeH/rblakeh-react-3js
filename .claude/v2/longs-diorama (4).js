// Chapter 1b diorama — Longs Peak: the Diamond's east face stretched across the
// back of the island, Chasm Lake at its foot in the middle, tundra shrubs and
// boulders around the shore, two climbers on the face and a Colorado flag on top.
// Same contract as the other dioramas: orthographic, seeded, scroll-driven.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

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
// Mountain frame: u = depth away from the mid-scroll camera, v = screen-right.
const AZ0 = -0.6;
const EU = [-Math.cos(AZ0), -Math.sin(AZ0)];   // (x,z) of +u
const EV = [Math.sin(AZ0), -Math.cos(AZ0)];    // (x,z) of +v (screen right)
const toUV = (x, z) => [x * EU[0] + z * EU[1], x * EV[0] + z * EV[1]];
const toXZ = (u, v) => [u * EU[0] + v * EV[0], u * EU[1] + v * EV[1]];

/* ---------- Longs Peak ---------- */
// Lateral silhouette (v → fraction of summit height): the jagged Keyboard of
// the Winds ridge on the left, a notch, the flat-topped summit block, and the
// long shoulder falling away right.
const LAT = [[-17, 0], [-14, 0.28], [-11, 0.44], [-8, 0.53], [-5.6, 0.6], [-4.2, 0.66], [-3.3, 0.58],
  [-2.3, 0.9], [-1.2, 1.0], [2.6, 0.97], [6.5, 0.8], [10.5, 0.52], [14, 0.24], [17.5, 0]];
function lat(v) {
  if (v <= LAT[0][0] || v >= LAT[LAT.length - 1][0]) return 0;
  let s = 0;
  for (let i = 0; i < LAT.length - 1; i++) {
    const [a, sa] = LAT[i], [b, sb] = LAT[i + 1];
    if (v >= a && v <= b) { s = lerp(sa, sb, smoothstep(0, 1, (v - a) / (b - a))); break; }
  }
  if (v < -3.8 && v > -14) s += 0.11 * Math.pow(Math.abs(Math.sin(v * 1.35 + 0.4)), 7);   // spires
  return s;
}
// WIDEN stretches the silhouette across the island so the peak reads as a backdrop.
const FACE_U = 7, PEAK = 22, WIDEN = 1.75;
const faceU = (v) => FACE_U + 0.7 * fbm(v * 0.35, 1.3, 3) + 0.35 * Math.sin(v * 2.2 + fbm(v * 0.5, 4.1, 2) * 2);
// ridged noise: thin sharp creases where fbm crosses zero — reads as cracks
const crackN = (u, vr) => Math.pow(1 - Math.abs(fbm(u * 0.42 + 9, vr * 0.3 - 2, 3)), 12);
function mtn(u, vr) {
  const v = vr / WIDEN;
  const S = lat(v);
  if (S <= 0) return 0;
  // the face line wanders in depth as well as across, so buttresses kink and
  // step instead of running as straight vertical columns
  const fu = faceU(v) + 1.1 * fbm(vr * 0.28 + 3, u * 0.5, 3) + 0.4 * fbm(vr * 0.9, u * 0.9 + 5, 2);
  const apron = smoothstep(fu - 11, fu - 1.4, u);
  const cliff = smoothstep(fu - 1.6, fu + 0.7, u);
  const back = 1 - 0.92 * smoothstep(fu + 4, fu + 15, u);
  let h = PEAK * S * (0.3 * apron + 0.7 * cliff) * back;
  const face = cliff * (1 - cliff) * 4;                              // 1 mid-cliff, 0 top & bottom
  // tilted strata ledges: soft terraces on a diagonal, like the banding in the ref
  const tilt = vr * 0.22 + fbm(vr * 0.15, u * 0.2 + 1, 2) * 1.6;
  const st = 1.7, t = (h + tilt) / st, fr = t - Math.floor(t);
  const terr = (Math.floor(t) + smoothstep(0.3, 1, fr)) * st - tilt;
  h = lerp(h, terr, 0.5 * face);
  h -= 1.3 * crackN(u, vr) * S * (0.4 + face);                       // cracks + gullies
  h += (0.35 + 0.9 * cliff * S) * fbm(u * 0.35 + 2, vr * 0.2, 3) * smoothstep(0, 2, h);
  h += 0.45 * S * fbm(u * 1.1 + 4, vr * 0.9, 2) * smoothstep(0, 3, h); // blocky surface grain
  return Math.max(0, h);
}

// alpine pasture: long low swells plus small hummocks, never dead flat
const base = (x, z) => 0.7 + 0.8 * fbm(x * 0.05, z * 0.05) + 0.45 * fbm(x * 0.13 + 7, z * 0.13, 3) + 0.14 * fbm(x * 0.55, z * 0.55, 2);
// Chasm Lake, centred on the island at the foot of the face
const LAKE = { u: -5, v: 1, au: 4.4, av: 8, y: 0.45 };
function lakeD(u, v) {
  const du = (u - LAKE.u) / LAKE.au, dv = (v - LAKE.v) / LAKE.av;
  const a = Math.atan2(dv, du);
  return Math.hypot(du, dv) * (1 + 0.16 * fbm(Math.cos(a) * 1.4 + 2, Math.sin(a) * 1.4 + 5, 3));
}
function H(x, z) {
  const [u, v] = toUV(x, z);
  let h = base(x, z) + mtn(u, v);
  const d = lakeD(u, v);
  if (d < 1) h = LAKE.y - 1.1 * (1 - d * d);
  else if (d < 1.9) h = Math.max(LAKE.y + 0.1, lerp(LAKE.y + 0.12 + (d - 1) * 0.9, h, smoothstep(1, 1.9, d)));
  const r = Math.hypot(x, z);
  h *= 1 - smoothstep(R * 0.74, R, r);
  return Math.max(0.04, h);
}

const col = (h) => new THREE.Color(h);
const C = {
  gTan: col('#b9a591'), gPink: col('#c7ad98'), gDark: col('#7f7672'), talus: col('#9c968e'), talus2: col('#878079'),
  tundra: col('#8f8d62'), grass: col('#8f9a5a'), grass2: col('#a7a262'), grass3: col('#76854c'),
  band: col('#d3bca7'), lichen: col('#8e9278'), crack: col('#5f5854'), rust: col('#94603f'), shore: col('#a29a90'),
};

function terrain() {
  const seg = 200, size = R * 2.1;
  const g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), z = p.getZ(i);
    const r = Math.hypot(x, z);
    if (r > R) { const k = R / r; x *= k; z *= k; p.setX(i, x); p.setZ(i, z); }
    p.setY(i, H(x, z));
  }
  g.computeVertexNormals();
  const n = g.attributes.normal, cols = [];
  const c = new THREE.Color(), rock = new THREE.Color(), ground = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const [u, v] = toUV(x, z);
    const m = mtn(u, v);
    const ny = n.getY(i);
    const steep = 1 - smoothstep(0.42, 0.8, ny);
    const rocky = smoothstep(1.4, 4.2, m);
    // granite: warm tan-pink, with the Diamond's dark water streaks on the steep face
    rock.copy(C.gTan).lerp(C.gPink, clamp01(0.5 + fbm(x * 0.3, y * 0.2, 2)));
    const vs = v / WIDEN;
    const streak = Math.pow(Math.abs(Math.sin(vs * 3.1 + fbm(vs * 0.8, y * 0.08, 2) * 2.2)), 9) * steep;
    rock.lerp(C.gDark, streak * 0.45 + (1 - ny) * 0.12);
    const strata = 0.5 + 0.5 * Math.sin((y + v * 0.22) * 1.9 + fbm(x * 0.2, y * 0.25, 3) * 3.2);
    rock.lerp(C.band, smoothstep(0.7, 1, strata) * 0.55);
    rock.lerp(C.gDark, smoothstep(0.25, 0, strata) * 0.3);
    rock.lerp(C.lichen, smoothstep(0.2, 0.6, fbm(x * 0.5 + 3, y * 0.5, 2)) * 0.35);
    rock.multiplyScalar(0.92 + 0.16 * (0.5 + 0.5 * noise2(x * 1.7, y * 1.7 + z)));
    rock.lerp(C.crack, crackN(u, v) * 0.8);
    c.copy(C.talus).lerp(C.talus2, clamp01(0.5 + fbm(x * 0.4 + 5, z * 0.4, 2)));
    c.lerp(C.tundra, (1 - smoothstep(3, 7, m)) * (1 - steep) * 0.55);
    c.lerp(rock, steep);
    // pasture: patchy greens and dry-grass gold, broken up at two scales
    ground.copy(C.grass).lerp(C.grass2, clamp01(0.5 + fbm(x * 0.08 + 3, z * 0.08) * 1.4));
    ground.lerp(C.grass3, clamp01(fbm(x * 0.22 - 5, z * 0.22 + 2, 2) * 1.6) * 0.7);
    ground.lerp(C.talus, smoothstep(0.35, 0.6, fbm(x * 0.3 + 9, z * 0.3, 2)) * 0.35);
    const ld = lakeD(u, v);
    ground.lerp(C.rust, (1 - smoothstep(1.2, 3.0, ld)) * clamp01(0.45 + fbm(x * 0.35, z * 0.35 + 4, 2) * 1.2));
    ground.lerp(C.shore, 1 - smoothstep(1.0, 1.25, ld));
    c.copy(ground.lerp(c, rocky));
    cols.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

function plinth() {
  const g = new THREE.Group();
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R * 0.975, 2.2, 96),
    new THREE.MeshStandardMaterial({ color: '#8f8270', flatShading: true, roughness: 0.95 })
  );
  soil.position.y = -1.1;
  soil.receiveShadow = true;
  g.add(soil);
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 1.008, R * 1.008, 0.35, 96),
    new THREE.MeshStandardMaterial({ color: '#736756', roughness: 0.9 })
  );
  rim.position.y = -0.18;
  g.add(rim);
  return g;
}

function water() {
  const g = new THREE.CircleGeometry(1.08, 64);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, cols = [];
  const deep = new THREE.Color('#2f4d5a'), warm = new THREE.Color('#9a6d5c'), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const lu = p.getX(i) * LAKE.au, lv = -p.getZ(i) * LAKE.av;
    p.setX(i, lu); p.setZ(i, -lv);
    // the far half picks up the lit face's colour, like the reflection in the ref
    c.copy(deep).lerp(warm, smoothstep(-0.2, 1, p.getX(i) / LAKE.au) * 0.55);
    cols.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.14, metalness: 0.1 }));
  const [x, z] = toXZ(LAKE.u, LAKE.v);
  m.position.set(x, LAKE.y, z);
  m.rotation.y = Math.atan2(-EU[1], EU[0]);   // local x → +u
  m.receiveShadow = true;
  return m;
}

function instanced(geo, list, rough = 0.9) {
  const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: rough }), list.length);
  const o = new THREE.Object3D();
  list.forEach((t, i) => {
    o.position.set(t.x, t.y, t.z);
    o.rotation.set(t.rx || 0, t.ry, t.rz || 0);
    o.scale.set(t.sx, t.sy, t.sz ?? t.sx);
    o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
    m.setColorAt(i, t.c);
  });
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function lumpy(r, detail, amt, seed) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + amt * fbm(x * 2 + seed, y * 2 + z * 1.3, 2);
    p.setXYZ(i, x * k, y * k, z * k);
  }
  g.computeVertexNormals();
  return g;
}

// shrubs + boulders, densest in a ring around the shore
function shore(world) {
  const willow = [], tuss = [], krum = [], rocks = [];
  const WIL = ['#6b7a45', '#77834a', '#5f6e40'], TUS = ['#9a5a38', '#8a5034', '#a8683f', '#7e5a3a'], KRU = ['#3d5436', '#344a30'];
  const ROC = ['#a39c92', '#8d877f', '#b3aca2', '#9a968a'];
  const STEP = 1.25;
  let i = 0;
  for (let gx = -R; gx <= R; gx += STEP) {
    for (let gz = -R; gz <= R; gz += STEP) {
      i++;
      const x = gx + (rand(i * 1.73) - 0.5) * STEP * 0.9;
      const z = gz + (rand(i * 2.91) - 0.5) * STEP * 0.9;
      if (Math.hypot(x, z) > R - 1.4) continue;
      const [u, v] = toUV(x, z);
      const d = lakeD(u, v);
      if (d < 1.12) continue;
      const m = mtn(u, v);
      const y = H(x, z);
      const ring = 1 - smoothstep(1.2, 3.2, d);
      const pick = rand(i * 7.3), roll = rand(i * 4.37);
      // boulders: shoreline, scree at the foot of the face, a few in the pasture
      const rockP = 0.05 * (1 - smoothstep(4, 7, m)) + ring * 0.16 + smoothstep(1.5, 4, m) * (1 - smoothstep(7, 10, m)) * 0.3;
      const sl = Math.hypot(H(x + 0.5, z) - H(x - 0.5, z), H(x, z + 0.5) - H(x, z - 0.5));
      if (roll < rockP && sl < 0.9) {
        const s = 0.35 + Math.pow(rand(i * 3.1), 2) * 1.1;
        rocks.push({ x, y: y + s * 0.2, z, rx: rand(i) * 3, ry: rand(i * 5) * 6, rz: rand(i * 6) * 3, sx: s, sy: s * (0.55 + rand(i * 8) * 0.35), sz: s * (0.8 + rand(i * 9) * 0.4), c: new THREE.Color(ROC[Math.floor(rand(i * 9.7) * ROC.length)]) });
        continue;
      }
      if (roll < rockP || m > 2.4) continue;
      const shrubP = 0.12 + ring * 0.7;
      if (roll > rockP + shrubP) continue;
      const ry = rand(i * 6) * 6, c = (arr) => new THREE.Color(arr[Math.floor(rand(i * 9.7) * arr.length)]);
      if (pick < 0.45) tuss.push({ x, y: y + 0.05, z, ry, sx: 0.5 + rand(i * 2.2) * 0.4, sy: 0.3 + rand(i * 3.3) * 0.15, c: c(TUS) });
      else if (pick < 0.85) willow.push({ x, y: y + 0.15, z, ry, sx: 0.6 + rand(i * 2.2) * 0.5, sy: 0.55 + rand(i * 3.3) * 0.35, c: c(WIL) });
      else krum.push({ x, y: y - 0.05, z, ry, sx: 0.6 + rand(i * 2.2) * 0.3, sy: 0.7 + rand(i * 3.3) * 0.5, c: c(KRU) });
    }
  }
  world.add(instanced(lumpy(1, 1, 0.3, 3), rocks, 0.95));
  world.add(instanced(lumpy(0.7, 1, 0.35, 7), willow));
  world.add(instanced(lumpy(0.55, 1, 0.3, 11).translate(0, 0.2, 0), tuss));
  world.add(instanced(new THREE.ConeGeometry(0.7, 1.9, 7).translate(0, 0.95, 0), krum));
}

/* ---------- Colorado flag ---------- */
function coloradoFlag() {
  const cv = document.createElement('canvas');
  cv.width = 600; cv.height = 400;
  const x = cv.getContext('2d'), Hh = 400;
  x.fillStyle = '#002868'; x.fillRect(0, 0, 600, 400);
  x.fillStyle = '#ffffff'; x.fillRect(0, Hh / 3, 600, Hh / 3);
  const cx = 600 * 0.375, cy = Hh / 2;
  x.strokeStyle = '#bf0a30'; x.lineWidth = Hh / 6;
  x.beginPath(); x.arc(cx, cy, Hh / 4, 0.23 * Math.PI, 1.77 * Math.PI); x.stroke();
  x.fillStyle = '#ffd700'; x.beginPath(); x.arc(cx, cy, Hh / 6 * 0.96, 0, Math.PI * 2); x.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  const W = 3.6, FH = 2.4, POLE = 5.2;
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, POLE, 8).translate(0, POLE / 2, 0), new THREE.MeshStandardMaterial({ color: '#8c8f93', roughness: 0.5, metalness: 0.3 }));
  pole.castShadow = true;
  g.add(pole);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshStandardMaterial({ color: '#c9a33a', roughness: 0.4, metalness: 0.4 }));
  ball.position.y = POLE + 0.08;
  g.add(ball);
  const geo = new THREE.PlaneGeometry(W, FH, 28, 14).translate(W / 2, POLE - FH / 2 - 0.1, 0);
  const cloth = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.85 }));
  cloth.castShadow = true;
  g.add(cloth);
  g.userData = { geo, base: Float32Array.from(geo.attributes.position.array), W, top: POLE - 0.1 };
  return g;
}
function waveFlag(f, t) {
  const { geo, base, W, top } = f.userData;
  const p = geo.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) {
    const x = base[i], y = base[i + 1], k = x / W;
    p[i + 2] = (Math.sin(x * 1.8 - t * 5.2) * 0.32 + Math.sin(x * 3.4 - t * 8.3 + y * 1.2) * 0.07) * k;
    p[i + 1] = y - k * k * 0.18 + Math.sin(x * 2.1 - t * 5.2) * 0.05 * k;
    p[i] = x - Math.abs(p[i + 2]) * 0.25;
  }
  geo.attributes.position.needsUpdate = true;
  geo.computeVertexNormals();
  void top;
}

/* ---------- climbers ---------- */
function climber(jacket) {
  const M = (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.8 });
  const jm = M(jacket), pants = M('#3a3f47'), skin = M('#d6a888'), helm = M('#f1efe8'), pack = M('#2d3238');
  const box = (w, h, d, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.castShadow = true; return b; };
  const g = new THREE.Group();
  const torso = box(0.42, 0.55, 0.28, jm); torso.position.y = 0.95; g.add(torso);
  const bag = box(0.34, 0.42, 0.16, pack); bag.position.set(0, 1.0, -0.2); g.add(bag);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), skin); head.position.y = 1.36; g.add(head);
  const hat = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), helm); hat.position.y = 1.38; g.add(hat);
  const limbs = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(s * 0.27, 1.18, 0);
    const a = box(0.12, 0.55, 0.12, jm); a.position.y = 0.26; arm.add(a);
    g.add(arm);
    const leg = new THREE.Group(); leg.position.set(s * 0.12, 0.68, 0);
    const l = box(0.15, 0.62, 0.15, pants); l.position.y = -0.3; leg.add(l);
    g.add(leg);
    limbs.push({ arm, leg, s });
  }
  g.userData.limbs = limbs;
  return g;
}

/* ---------- element ---------- */
class LongsDiorama extends HTMLElement {
  connectedCallback() {
    if (this._booted) return;
    this._booted = true;
    this.style.cssText = 'display:block;position:absolute;inset:0;width:100%;height:100%';

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
    this.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#e9e9ec', 152, 272);
    this.scene = scene;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);

    scene.add(new THREE.HemisphereLight('#e8ecf2', '#7d7a66', 0.85));
    // morning sun from the front-right, raking across the face so the ribs read
    const sun = new THREE.DirectionalLight('#fff3e0', 2.2);
    const [sx, sz] = toXZ(-26, 20);
    sun.position.set(sx, 44, sz);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 170;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.05;
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#d8dde6', 0.4);
    const [fx, fz] = toXZ(-10, -30);
    fill.position.set(fx, 16, fz);
    scene.add(fill);

    const world = new THREE.Group();
    scene.add(world);
    world.add(plinth());
    world.add(terrain());

    world.add(water());
    shore(world);

    // flag on the highest point of the summit block
    let best = { h: -1 };
    for (let u = FACE_U + 0.5; u <= FACE_U + 4; u += 0.25) for (let v = -1.5 * WIDEN; v <= 3 * WIDEN; v += 0.3) {
      const [x, z] = toXZ(u, v), h = H(x, z);
      if (h > best.h) best = { h, x, z };
    }
    this.flag = coloradoFlag();
    this.flag.position.set(best.x, best.h - 0.15, best.z);
    this.flag.rotation.y = Math.atan2(-EU[0], -EU[1]);   // cloth faces the camera
    world.add(this.flag);

    // two climbers on the face; for each, a table of face depth by height so
    // they hug the rock as they go up
    const wallRY = Math.atan2(EU[0], EU[1]);
    this.climbers = [{ v: 1.2 * WIDEN, c: '#d8552f', lag: 0 }, { v: 1.2 * WIDEN - 0.7, c: '#2f6fb0', lag: 2.6 }].map((k) => {
      const table = [];
      for (let y = 0; y <= PEAK + 2; y += 0.25) {
        const hit = (u) => { const [x, z] = toXZ(u, k.v); return H(x, z) >= y; };
        let lo = -8, hi = FACE_U + 6;
        for (let u = lo; u <= hi; u += 0.4) { if (hit(u)) { hi = u; break; } lo = u; }
        for (let n = 0; n < 5; n++) { const mid = (lo + hi) / 2; if (hit(mid)) hi = mid; else lo = mid; }
        table.push(hi);
      }
      const g = climber(k.c);
      g.scale.setScalar(1.25);
      g.rotation.y = wallRY;
      world.add(g);
      return { ...k, g, table, y: 8 };
    });
    this.rope = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 14 }, () => new THREE.Vector3())), new THREE.LineBasicMaterial({ color: '#e8c33a' }));
    this.rope.frustumCulled = false;
    world.add(this.rope);

    this.az = -0.9; this.el = 0.46; this.fr = 72;
    this.clock = new THREE.Clock();
    this.resize();
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(this);
    this.loop();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this._raf);
    this._ro?.disconnect();
    this.renderer?.dispose();
  }

  resize() {
    const w = this.clientWidth || 800, h = this.clientHeight || 600;
    this.renderer.setSize(w, h, false);
    this.aspect = w / h;
  }

  progress() {
    const root = this.closest('[data-scroll-root]') || document.querySelector('[data-scroll-root]');
    if (!root) return 0;
    const r = root.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    return span <= 0 ? 0 : clamp01(-r.top / span);
  }

  loop = () => {
    this._raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    const p = this.progress();

    waveFlag(this.flag, t);

    // climbers: scroll-keyed ascent, follower a rope-length below the leader
    const lead = lerp(8, 18.5, smoothstep(0.12, 0.9, p));
    const harness = [];
    for (const k of this.climbers) {
      const yT = lead - k.lag;
      const moving = Math.abs(yT - k.y) > 0.01;
      k.y = lerp(k.y, yT, 0.06);
      const yi = clamp01(k.y / (PEAK + 2)) * (k.table.length - 1);
      const i0 = Math.floor(yi), fu = lerp(k.table[i0], k.table[Math.min(k.table.length - 1, i0 + 1)], yi - i0);
      const [x, z] = toXZ(fu - 0.35, k.v);
      k.g.position.set(x, k.y - 0.2, z);
      const ph = t * (moving ? 5 : 1.2) + k.lag;
      for (const l of k.g.userData.limbs) {
        const sw = Math.sin(ph + (l.s > 0 ? 0 : Math.PI));
        l.arm.rotation.set(-0.35 + sw * 0.25, 0, l.s * (0.25 + sw * 0.1));
        l.leg.rotation.set(-0.2 - Math.max(0, -sw) * 0.6, 0, l.s * 0.12);
      }
      harness.push(k.g.position.clone().add(new THREE.Vector3(0, 0.95 * 1.25, 0)));
    }
    const rp = this.rope.geometry.attributes.position;
    const out = new THREE.Vector3(-EU[0], 0, -EU[1]);
    for (let i = 0; i < rp.count; i++) {
      const s = i / (rp.count - 1);
      const q = harness[1].clone().lerp(harness[0], s).addScaledVector(out, Math.sin(Math.PI * s) * 0.25);
      q.y -= Math.sin(Math.PI * s) * 0.35;
      rp.setXYZ(i, q.x, q.y, q.z);
    }
    rp.needsUpdate = true;

    const azT = lerp(-0.92, -0.32, smoothstep(0, 1, p));
    const elT = lerp(0.46, 0.3, smoothstep(0.1, 0.95, p));
    const frT = lerp(72, 60, smoothstep(0.05, 0.95, p));
    this.az = lerp(this.az, azT, 0.045);
    this.el = lerp(this.el, elT, 0.045);
    this.fr = lerp(this.fr, frT, 0.05);

    const halfH = this.fr / 2, halfW = halfH * (this.aspect || 1.4);
    const c = this.cam;
    c.left = -halfW; c.right = halfW; c.top = halfH; c.bottom = -halfH;
    c.updateProjectionMatrix();
    const d = 150;
    c.position.set(Math.cos(this.az) * Math.cos(this.el) * d, Math.sin(this.el) * d, Math.sin(this.az) * Math.cos(this.el) * d);
    c.lookAt(0, lerp(6.5, 7.5, p), 0);
    this.renderer.render(this.scene, c);
  };
}

if (!customElements.get('longs-diorama')) customElements.define('longs-diorama', LongsDiorama);
