// Chapter 4 diorama — current role: a track-measurement consist on the main line.
// Leading stainless cab car, a measurement coach, and a widecab road unit pushing.
// The train never moves; ties, ballast, brush and poles stream past underneath it.
// Scroll velocity drives speed, and rail joints under each truck drive the bounce.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rand = (s) => { const x = Math.sin(s * 99.13) * 43758.5453; return x - Math.floor(x); };

const R = 34;
const TZ = 0, TZ2 = -4.6;       // main track (train), second main
const RAIL_TOP = 0.32;
const J = 11.9;                  // rail joint spacing
const TIE = 0.75;
const halfChord = (z, pad = 0) => Math.sqrt(Math.max(0, (R - pad) ** 2 - z * z));
const wrap = (v) => ((((v + R) % (2 * R)) + 2 * R) % (2 * R)) - R;

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, flatShading: true, ...o });
const M = {
  orange: mat('#df6a2b', { roughness: 0.55, metalness: 0.1 }),
  green: mat('#2e4839', { roughness: 0.62 }),
  cream: mat('#e4dac0', { roughness: 0.7 }),
  black: mat('#26282b', { roughness: 0.8 }),
  truck: mat('#2b2e32', { roughness: 0.85 }),
  wheel: mat('#5a5d61', { roughness: 0.5, metalness: 0.35 }),
  glass: mat('#2c3742', { roughness: 0.22, metalness: 0.3 }),
  grille: mat('#393c40', { roughness: 0.9 }),
  yellow: mat('#d6b03b', { roughness: 0.6 }),
  steel: mat('#d3d7dc', { roughness: 0.5, metalness: 0.12, flatShading: false }),
  under: mat('#4a4d52', { roughness: 0.85 }),
  rail: mat('#7b7772', { roughness: 0.5, metalness: 0.35 }),
  tie: mat('#5f5349', { roughness: 0.95 }),
  sand: mat('#cbb897', { roughness: 0.97, flatShading: false }),
  soil: mat('#b7a488', { roughness: 0.95 }),
  rim: mat('#a18f76', { roughness: 0.9 }),
  bush: mat('#8f9877'),
  bush2: mat('#a6a585'),
  rock: mat('#b19a82'),
  pole: mat('#7a6552', { roughness: 0.95 }),
  lamp: new THREE.MeshStandardMaterial({ color: '#fff6d8', emissive: '#ffe6a8', emissiveIntensity: 0.9 }),
};

const geoCache = {};
const boxGeo = (w, h, d) => { const k = `${w}|${h}|${d}`; return geoCache[k] || (geoCache[k] = new THREE.BoxGeometry(w, h, d)); };
function box(w, h, d, m, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(boxGeo(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
// box by extents — easier to keep the loco's panels lined up
function span(x0, x1, y0, y1, w, m, z = 0) { return box(x1 - x0, y1 - y0, w, m, (x0 + x1) / 2, (y0 + y1) / 2, z); }

/* ---------- running gear ---------- */
function axle(x, r, spin) {
  const a = new THREE.Group();
  a.position.set(x, r, 0);
  for (const z of [-0.72, 0.72]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.14, 16), M.wheel);
    w.rotation.x = Math.PI / 2; w.position.z = z; w.castShadow = true;
    a.add(w, box(r * 1.5, 0.13, 0.17, M.truck, 0, 0, z + Math.sign(z) * 0.01)); // hub bar makes spin legible
  }
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 6), M.truck);
  rod.rotation.x = Math.PI / 2;
  a.add(rod);
  const k = spin.length;
  spin.push({ o: a, r, ph: rand(k * 7.31 + 2) * Math.PI * 2, rate: 0.94 + rand(k * 3.17 + 5) * 0.12, wob: rand(k * 1.93) * 6 });
  return a;
}
function truck(n, sp, r, spin) {
  const g = new THREE.Group();
  const L = (n - 1) * sp + r * 2 + 0.6;
  g.add(box(L, 0.3, 1.1, M.truck, 0, r + 0.28, 0));
  g.add(box(0.9, 0.42, 1.2, M.truck, 0, r + 0.3, 0));
  for (let i = 0; i < n; i++) g.add(axle((i - (n - 1) / 2) * sp, r, spin));
  return g;
}
function vehicle(x, truckX, bodyY, n, sp, r, spin, stiff = 1) {
  const g = new THREE.Group();
  g.position.set(x, RAIL_TOP, TZ);
  const body = new THREE.Group();
  body.position.y = bodyY;
  g.add(body);
  const trucks = truckX.map((tx) => { const t = truck(n, sp, r, spin); t.position.x = tx; g.add(t); return t; });
  return { g, body, trucks, truckX, x, baseY: bodyY, stiff };
}

/* ---------- stainless car sides (canvas-painted) ---------- */
const CAR_L = 15, CAR_HW = 1.36, CAR_H = 3.2, CAR_RF = 0.46;
function sideTexture(kind) {
  const W = 1024, H = Math.round(W * CAR_H / CAR_L);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); };
  const windowAt = (x, y, w, h) => {
    const gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, '#46525e'); gr.addColorStop(0.55, '#27303a'); gr.addColorStop(1, '#343e49');
    g.fillStyle = '#8e939a'; rr(x - 3, y - 3, w + 6, h + 6, 9); g.fill();
    g.fillStyle = gr; rr(x, y, w, h, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + 6, y + 5, w * 0.35, h - 10);
  };
  const door = (x, w) => { g.strokeStyle = 'rgba(60,64,70,0.55)'; g.lineWidth = 2; g.strokeRect(x, H * 0.14, w, H * 0.8); g.fillStyle = 'rgba(40,46,54,0.7)'; g.fillRect(x + w * 0.2, H * 0.2, w * 0.6, H * 0.22); };
  const draw = () => {
    const base = g.createLinearGradient(0, 0, 0, H);
    base.addColorStop(0, '#dcdfe3'); base.addColorStop(0.5, '#cdd1d5'); base.addColorStop(1, '#b5b9bf');
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(70,74,80,0.35)'; g.fillRect(0, H * 0.1, W, 2);
    if (kind === 'cab') {
      // fluted lower sheathing, a long ribbon of small windows
      for (let x = 0; x < W; x += 6) { g.fillStyle = x % 12 ? 'rgba(255,255,255,0.22)' : 'rgba(60,64,70,0.2)'; g.fillRect(x, H * 0.64, 3, H * 0.34); }
      g.fillStyle = 'rgba(60,64,70,0.4)'; g.fillRect(0, H * 0.635, W, 2);
      for (let i = 0; i < 9; i++) windowAt(150 + i * 84, H * 0.24, 62, H * 0.3);
      windowAt(22, H * 0.2, 88, H * 0.36);  // cab-end side window
      door(912, 70);
    } else {
      for (let i = 0; i < 6; i++) windowAt(170 + i * 104, H * 0.18, 80, H * 0.4);
      door(40, 70); door(914, 70);
      g.strokeStyle = 'rgba(60,64,70,0.35)'; g.lineWidth = 2;
      [[210, 0.72, 70, 0.18], [300, 0.74, 38, 0.1], [800, 0.7, 64, 0.2]].forEach(([x, y, w, h]) => g.strokeRect(x, H * y, w, H * h));
      g.fillStyle = '#2a2d32';
      g.font = '600 31px "Space Grotesk", system-ui, sans-serif';
      g.textAlign = 'right'; g.textBaseline = 'alphabetic';
      g.fillText('Track Measurement', 790, H * 0.7);
    }
    for (let x = 0; x < W; x += 34) { g.fillStyle = 'rgba(70,74,80,0.18)'; g.fillRect(x, H * 0.04, 2, 2); } // roofline rivets
  };
  draw();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  document.fonts?.load('600 31px "Space Grotesk"').then(() => { draw(); t.needsUpdate = true; });
  return t;
}
function carShell(kind) {
  const hw = CAR_HW, h = CAR_H, rf = CAR_RF, L = CAR_L;
  const s = new THREE.Shape();
  s.moveTo(-hw, 0); s.lineTo(-hw, h);
  s.quadraticCurveTo(-hw, h + rf, -hw + 0.75, h + rf);
  s.lineTo(hw - 0.75, h + rf);
  s.quadraticCurveTo(hw, h + rf, hw, h);
  s.lineTo(hw, 0); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false, curveSegments: 8 });
  geo.rotateY(Math.PI / 2);
  geo.translate(-L / 2, 0, 0);
  const g = new THREE.Group();
  const shell = new THREE.Mesh(geo, M.steel);
  shell.castShadow = true; shell.receiveShadow = true;
  g.add(shell);
  const sm = new THREE.MeshStandardMaterial({ map: sideTexture(kind), roughness: 0.5, metalness: 0.12 });
  for (const sgn of [1, -1]) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.04, h - 0.02), sm);
    pl.position.set(0, h / 2, sgn * (hw + 0.012));
    if (sgn < 0) pl.rotation.y = Math.PI;
    pl.receiveShadow = true;
    g.add(pl);
  }
  g.add(box(L, 0.14, hw * 2 + 0.06, M.under, 0, 0.02, 0));          // side sill
  g.add(span(-3.4, 3.4, -0.62, 0, 2.2, M.under));                   // underfloor equipment
  g.add(span(3.9, 4.6, -0.5, 0, 1.6, M.truck), span(-4.6, -3.9, -0.4, 0, 1.4, M.truck));
  return g;
}
function diaphragm(x) { return span(x - 0.35, x + 0.35, 0.2, CAR_H - 0.1, 2.1, M.black); }

function cabCar(x, spin) {
  const v = vehicle(x, [-5.3, 5.3], 1.25, 2, 2.5, 0.42, spin);
  const b = v.body;
  b.add(carShell('cab'));
  const fx = -CAR_L / 2;
  b.add(box(0.05, 0.95, 2.2, M.glass, fx - 0.02, 2.5, 0));                          // windscreen
  b.add(box(0.06, 0.1, 2.3, M.under, fx - 0.03, 2.02, 0));
  for (const z of [-0.85, 0.85]) b.add(box(0.06, 0.22, 0.3, M.lamp, fx - 0.03, 1.05, z));
  b.add(box(0.08, 0.28, 0.5, M.lamp, fx - 0.03, CAR_H + 0.1, 0));                   // headlight
  b.add(span(fx - 0.45, fx, -0.7, 0.35, 2.6, M.black));                             // pilot
  b.add(span(fx - 0.62, fx - 0.4, -0.72, -0.2, 2.0, M.yellow));                     // plow edge
  b.add(box(0.6, 0.35, 0.9, M.under, fx + 1.4, CAR_H + CAR_RF + 0.1, 0));          // camera / sensor pod
  b.add(diaphragm(CAR_L / 2 + 0.3));
  return v;
}
function measureCar(x, spin) {
  const v = vehicle(x, [-5.3, 5.3], 1.25, 2, 2.5, 0.42, spin);
  const b = v.body;
  b.add(carShell('measure'));
  b.add(span(1.2, 2.9, -0.98, -0.62, 1.9, M.black));                               // measurement beam
  b.add(span(1.5, 2.6, -1.04, -0.98, 1.6, M.yellow));
  for (const [dx, dz] of [[-3.2, 0.3], [-1.6, -0.4]]) {                              // GNSS domes
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.cream);
    d.position.set(dx, CAR_H + CAR_RF, dz); d.castShadow = true;
    b.add(d);
  }
  b.add(box(1.4, 0.28, 0.9, M.under, 4.2, CAR_H + CAR_RF + 0.1, 0));
  return v;
}

/* ---------- widecab road unit, cab at the +x end ---------- */
function locomotive(x, spin) {
  const v = vehicle(x, [-4.9, 4.9], 1.2, 3, 1.55, 0.5, spin, 0.7);
  const b = v.body;
  const L2 = 7.7, BAND = 1.35;
  b.add(span(-L2, L2, 0, 0.45, 2.56, M.black));                                     // frame + sill
  b.add(span(-L2, L2, 0.3, 0.36, 2.58, M.cream));
  b.add(span(-2.6, 2.6, -0.92, 0, 2.1, M.black));                                   // fuel tank
  b.add(span(-2.4, 2.4, -0.98, -0.9, 1.9, M.truck));
  // long hood
  b.add(span(-7.2, 2.6, 0.45, BAND, 2.0, M.black));
  b.add(span(-7.2, 2.6, BAND, BAND + 0.06, 2.02, M.cream));
  b.add(span(-7.2, 2.6, BAND + 0.06, 2.95, 2.0, M.orange));
  for (let i = 0; i < 6; i++) for (const z of [-1.01, 1.01]) b.add(span(-1.9 + i * 0.72, -1.4 + i * 0.72, 0.62, 2.62, 0.02, M.grille, z)); // hood doors
  b.add(span(-7.2, -3.4, 2.1, 3.25, 2.56, M.orange));                               // flared radiator
  for (const z of [-1.29, 1.29]) b.add(span(-6.9, -3.7, 2.25, 3.1, 0.02, M.grille, z));
  b.add(span(-6.8, -3.8, 3.25, 3.3, 2.2, M.grille));
  b.add(span(-1.8, 0.8, 2.95, 3.22, 1.7, M.orange));                                // dynamic brake
  b.add(span(-1.6, 0.6, 3.22, 3.26, 1.4, M.grille));
  b.add(span(-3.0, -2.4, 2.95, 3.28, 0.5, M.black));                                // exhaust
  b.add(span(1.2, 2.2, 2.95, 3.1, 1.2, M.orange));
  // cab + nose
  b.add(span(2.6, 5.5, 0.45, BAND, 2.62, M.black));
  b.add(span(2.6, 5.5, BAND, BAND + 0.06, 2.64, M.cream));
  b.add(span(2.6, 5.5, BAND + 0.06, 3.5, 2.62, M.orange));
  b.add(span(2.5, 5.62, 3.5, 3.62, 2.7, M.orange));                                 // roof lip
  b.add(span(5.5, 7.35, 0.45, BAND, 2.4, M.black));
  b.add(span(5.5, 7.35, BAND, BAND + 0.06, 2.42, M.cream));
  b.add(span(5.5, 7.35, BAND + 0.06, 2.05, 2.4, M.orange));
  for (const z of [-0.62, 0.62]) b.add(box(0.05, 0.62, 0.95, M.glass, 5.52, 2.95, z)); // windshield
  for (const z of [-1.32, 1.32]) {
    b.add(span(3.0, 3.9, 2.35, 3.15, 0.02, M.glass, z), span(4.1, 5.2, 2.35, 3.15, 0.02, M.glass, z));
  }
  b.add(box(0.05, 0.36, 0.7, M.black, 7.37, 1.62, 0));
  for (const z of [-0.26, 0.26]) b.add(box(0.06, 0.16, 0.2, M.lamp, 7.38, 1.62, z));
  b.add(box(0.5, 0.18, 0.5, M.black, 4.2, 3.72, 0.4));                               // horn
  b.add(box(0.1, 0.4, 0.1, M.black, 3.2, 3.82, -0.6));                               // antenna
  // pilots, plow, ditch lights
  b.add(span(L2 - 0.05, L2 + 0.2, -0.62, 0.45, 2.56, M.black));
  for (const z of [-1.0, 1.0]) b.add(box(0.06, 0.16, 0.16, M.lamp, L2 + 0.22, 0.15, z));
  b.add(span(-L2 - 0.2, -L2 + 0.05, -0.62, 0.45, 2.56, M.black));
  // handrails + posts, yellow
  for (const z of [-1.22, 1.22]) {
    b.add(span(-L2 + 0.2, 2.5, 1.38, 1.43, 0.05, M.yellow, z));
    for (let px = -L2 + 0.25; px < 2.6; px += 1.6) b.add(span(px, px + 0.05, 0.45, 1.4, 0.05, M.yellow, z));
    for (const sx of [-L2 + 0.4, L2 - 0.6, 2.0]) b.add(span(sx, sx + 0.5, -0.5, 0.02, 0.12, M.black, z * 1.03)); // steps
  }
  return v;
}

/* ---------- ground, ballast, streaming scenery ---------- */
function ballastTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#a79f94'; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 1400; i++) {
    const v = 120 + rand(i * 1.7) * 80 | 0;
    g.fillStyle = `rgb(${v},${v - 6},${v - 14})`;
    g.fillRect(rand(i * 3.1) * 256, rand(i * 5.3) * 64, 2 + rand(i) * 3, 2 + rand(i * 7.1) * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function trackBed(z, bTex) {
  const g = new THREE.Group();
  const hw = halfChord(z, 1.2);
  const tex = bTex.clone();
  tex.needsUpdate = true;
  tex.repeat.set((hw * 2) / 4, 1);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, 0.14, 3.8), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  bed.position.set(0, 0.07, z);
  bed.receiveShadow = true;
  g.add(bed);
  const n = Math.ceil((2 * R) / TIE);
  const ties = new THREE.InstancedMesh(boxGeo(0.3, 0.14, 2.9), M.tie, n);
  ties.receiveShadow = true;
  ties.castShadow = true;
  g.add(ties);
  for (const dz of [-0.72, 0.72]) g.add(box(hw * 2, 0.16, 0.13, M.rail, 0, 0.24, z + dz));
  return { g, ties, tex, z, hw, n };
}
function bush(s) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 + rand(s) * 0.55, 0), rand(s * 2.3) > 0.5 ? M.bush : M.bush2);
  m.scale.y = 0.55 + rand(s * 3.7) * 0.25;
  m.castShadow = true;
  return m;
}
function rock(s) {
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + rand(s) * 0.5, 0), M.rock);
  m.scale.y = 0.5;
  m.rotation.y = rand(s * 4.4) * 3;
  m.castShadow = true;
  return m;
}
const WIRE = mat('#3a3633', { roughness: 0.8, flatShading: false });
function pole(S) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 7.4, 6), M.pole);
  p.position.y = 3.7; p.castShadow = true;
  g.add(p, box(0.14, 0.14, 2.0, M.pole, 0, 6.9, 0), box(0.12, 0.12, 1.4, M.pole, 0, 6.3, 0));
  // wires droop to the next pole down the line (+S)
  const wires = new THREE.Group();
  for (const [dz, y] of [[-0.85, 7.02], [0.85, 7.02], [-0.55, 6.42], [0.55, 6.42]]) {
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, y, dz), new THREE.Vector3(S / 2, y - 1.3, dz), new THREE.Vector3(S, y, dz));
    const w = new THREE.Mesh(new THREE.TubeGeometry(c, 20, 0.025, 4, false), WIRE);
    w.castShadow = true;
    wires.add(w);
  }
  g.add(wires);
  g.userData.wires = wires;
  return g;
}

function build(world, spin) {
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.975, 2.2, 96), M.soil);
  soil.position.y = -1.1; soil.receiveShadow = true;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.008, R * 1.008, 0.35, 96), M.rim);
  rim.position.y = -0.18;
  const ground = new THREE.Mesh(new THREE.CircleGeometry(R, 96), M.sand);
  ground.rotation.x = -Math.PI / 2; ground.position.y = 0.02; ground.receiveShadow = true;
  world.add(soil, rim, ground);

  const bTex = ballastTexture();
  const beds = [trackBed(TZ, bTex), trackBed(TZ2, bTex)];
  beds.forEach((b) => world.add(b.g));

  // scenery that streams past: [object, x0, z]
  const movers = [];
  for (let i = 0; i < 70; i++) {
    const z = -R + rand(i * 2.71 + 0.3) * 2 * R;
    if (z > TZ2 - 3.2 && z < TZ + 2.8) continue;
    const o = rand(i * 6.1) > 0.3 ? bush(i + 1) : rock(i + 1);
    o.position.y = 0.1;
    world.add(o);
    movers.push({ o, x0: -R + rand(i * 4.37 + 1.1) * 2 * R, z, s: o.scale.y });
  }
  const PS = (2 * R) / 5, PZ = TZ2 - 4.4;
  for (let i = 0; i < 5; i++) {
    const o = pole(PS);
    world.add(o);
    movers.push({ o, x0: -R + i * PS, z: PZ, s: 1, pole: true, S: PS, hc: halfChord(PZ, 1.2) });
  }

  const cars = [cabCar(-15.5, spin), measureCar(0, spin), locomotive(15.9, spin)];
  cars.forEach((c) => world.add(c.g));
  return { beds, movers, cars };
}

/* ---------- element ---------- */
class InspectionDiorama extends HTMLElement {
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

    scene.add(new THREE.HemisphereLight('#eef0f2', '#9a8f80', 0.9));
    const sun = new THREE.DirectionalLight('#fff1dc', 2.1);
    sun.position.set(18, 40, 28);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 160;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.05;
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#dde0e4', 0.5);
    fill.position.set(-30, 16, 24);
    scene.add(fill);

    const world = new THREE.Group();
    scene.add(world);
    this.spin = [];
    Object.assign(this, build(world, this.spin));
    this._m = new THREE.Matrix4();

    this.d = 0; this.v = 0.05; this.pPrev = null;
    this.az = 1.3; this.el = 0.3; this.fr = 30;
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
    const t = performance.now() / 1000;
    const p = this.progress();

    // speed: an idle crawl, pushed up by scroll velocity; always forward, with inertia.
    // Capped under half a tie spacing per frame so the ties never strobe backwards.
    if (this.pPrev === null) this.pPrev = p;
    const dp = Math.abs(p - this.pPrev);
    this.pPrev = p;
    const vT = 0.05 + Math.min(0.29, dp * 140);
    this.v = lerp(this.v, vT, vT > this.v ? 0.08 : 0.025);
    this.d += this.v;
    const d = this.d, sp = clamp01((this.v - 0.05) / 0.29);

    for (const b of this.beds) {
      b.tex.offset.x = (d / 4) % 1;
      for (let i = 0; i < b.n; i++) {
        const x = wrap(-R + i * TIE - d);
        const vis = Math.abs(x) < b.hw ? 1 : 0;
        this._m.makeScale(vis, vis, vis).setPosition(x, 0.2, b.z);
        b.ties.setMatrixAt(i, this._m);
      }
      b.ties.instanceMatrix.needsUpdate = true;
    }
    for (const m of this.movers) {
      const x = wrap(m.x0 - d);
      if (m.pole) {
        m.o.position.set(x, 0, m.z);
        m.o.visible = Math.abs(x) < m.hc;
        m.o.userData.wires.visible = m.o.visible && x + m.S < m.hc;
        continue;
      }
      const r = Math.hypot(x, m.z);
      const k = smoothstep(R - 1.2, R - 4.5, r);
      m.o.position.x = x; m.o.position.z = m.z;
      m.o.scale.set(m.pole ? 1 : k, (m.pole ? 1 : m.s) * k, m.pole ? 1 : k);
      m.o.visible = k > 0.01;
    }

    // rail joints kick each truck; a long-wave irregularity rocks the bodies
    const bump = (x) => {
      const s = (((x - d) % J) + J) % J;
      const dip = Math.exp(-s * s * 18) + Math.exp(-(J - s) * (J - s) * 18);
      const low = Math.sin((x - d) * 0.37) * 0.6 + Math.sin((x - d) * 0.113 + 1.7) * 0.4;
      return -dip * (0.04 + 0.12 * sp) + low * (0.012 + 0.045 * sp);
    };
    for (const c of this.cars) {
      const [xa, xb] = c.truckX;
      const ya = bump(c.x + xa), yb = bump(c.x + xb);
      c.trucks[0].position.y = ya * 0.6;
      c.trucks[1].position.y = yb * 0.6;
      c.body.position.y = c.baseY + ((ya + yb) / 2) * c.stiff;
      c.body.rotation.z = Math.atan2(yb - ya, xb - xa) * c.stiff;
      c.body.rotation.x = c.stiff * ((0.003 + 0.012 * sp) * Math.sin(t * 2.3 + c.x * 0.3) + 0.006 * sp * Math.sin((c.x - d) * 0.9));
    }
    for (const w of this.spin) w.o.rotation.z = w.ph - (d / w.r) * w.rate + Math.sin(t * 1.7 + w.wob) * 0.06;

    const azT = lerp(1.32, 1.16, smoothstep(0, 1, p));
    const elT = lerp(0.26, 0.36, smoothstep(0.1, 0.95, p));
    // fit the consist into the part of the canvas the card doesn't cover
    const w = this.clientWidth || 800, h = this.clientHeight || 600;
    const card = this.closest('[data-scroll-root]')?.querySelector('article');
    let free = w;
    if (card) { const cr = card.getBoundingClientRect(), mr = this.getBoundingClientRect(); if (cr.left > mr.left + w * 0.3) free = Math.min(w, cr.left - mr.left - 16); }
    this.free = lerp(this.free ?? free, free, 0.1);
    // fit the whole island disc: width 2R, height = disc foreshortened by elevation + base/train
    const frT = Math.max(2 * R * Math.sin(this.el) + 18, (2 * R + 6) * h / this.free) * lerp(1.03, 1.0, smoothstep(0.05, 0.95, p));
    this.az = lerp(this.az, azT, 0.045);
    this.el = lerp(this.el, elT, 0.045);
    this.fr = lerp(this.fr, frT, 0.05);

    const halfH = this.fr / 2, u = this.fr / h;
    const cam = this.cam;
    cam.left = -(this.free / 2) * u; cam.right = (w - this.free / 2) * u; cam.top = halfH; cam.bottom = -halfH;
    cam.updateProjectionMatrix();
    const D = 150;
    cam.position.set(Math.cos(this.az) * Math.cos(this.el) * D, Math.sin(this.el) * D, Math.sin(this.az) * Math.cos(this.el) * D);
    cam.lookAt(0, 2.6, -1.2);
    this.renderer.render(this.scene, cam);
  };
}

if (!customElements.get('inspection-diorama')) customElements.define('inspection-diorama', InspectionDiorama);
