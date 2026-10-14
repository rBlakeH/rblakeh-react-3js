// Chapter 3 diorama — Fort Worth intermodal ramp: a double-stack train under a
// wide-span gantry crane, the container stacks beside it, and the chassis lot beyond.
// Same contract as desert-diorama: orthographic, seeded, scroll-driven.
// The crane lift is keyed to scroll progress, so it plays forward and back.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rand = (s) => { const x = Math.sin(s * 99.13) * 43758.5453; return x - Math.floor(x); };

const R = 38;
// layout, front (+z) to back
const DZ = 6.5;
const CR_F = 16.4 + DZ, TA = 13.2 + DZ, TB = 8.8 + DZ, LANE = 4.9 + DZ, S1 = 1.4 + DZ, S2 = -1.0 + DZ, S3 = -3.4 + DZ, CR_B = -5.9 + DZ, ROAD = -8.0 + DZ;
const LOT1 = -15.6 + DZ, LOT2 = -29.0 + DZ;
const CH = 2.0, CW = 1.9, L40 = 9.4, L53 = 11.0;
const DECK = 0.62;              // well floor top
const SLOT = 12.4;

/* ---------- shared materials ---------- */
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, flatShading: true, ...o });
const M = {
  orange: mat('#e4722a', { roughness: 0.62, metalness: 0.08 }),
  orangeDk: mat('#c85f20', { roughness: 0.66 }),
  steel: mat('#3b3f44', { roughness: 0.7, metalness: 0.2 }),
  rail: mat('#7b7772', { roughness: 0.5, metalness: 0.35 }),
  tie: mat('#6a5d50', { roughness: 0.95 }),
  car: mat('#4a423b', { roughness: 0.9 }),
  truck: mat('#2c2f33', { roughness: 0.85 }),
  cab: mat('#e6e2da'),
  glass: mat('#46525e', { roughness: 0.3, metalness: 0.25 }),
  stripe: mat('#eeede8', { roughness: 0.9 }),
  pole: mat('#9a9da2', { roughness: 0.6, metalness: 0.3 }),
  spreader: mat('#34383d', { roughness: 0.75 }),
  tractor: mat('#b44a3a'),
};

function ribTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 4;
  const g = c.getContext('2d');
  for (let i = 0; i < 64; i++) {
    const v = 0.84 + 0.16 * (0.5 + 0.5 * Math.cos((i / 64) * Math.PI * 2 * 4));
    g.fillStyle = `rgb(${v * 255 | 0},${v * 255 | 0},${v * 255 | 0})`;
    g.fillRect(i, 0, 1, 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let RIB;
const BOX_COLORS = ['#a9493b', '#3f5f86', '#4d7a57', '#dcd9d2', '#8e9196', '#c7a04c', '#b3683d', '#6d4a40', '#4b8585', '#dcd9d2', '#dcd9d2'];
const boxMats = {};
function boxMat(color) {
  if (!boxMats[color]) boxMats[color] = new THREE.MeshStandardMaterial({ color, map: RIB, roughness: 0.78, flatShading: true });
  return boxMats[color];
}
const geoCache = {};
const boxGeo = (w, h, d) => {
  const k = `${w}|${h}|${d}`;
  return geoCache[k] || (geoCache[k] = new THREE.BoxGeometry(w, h, d));
};
function box(w, h, d, m, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(boxGeo(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
const pickColor = (s) => BOX_COLORS[Math.floor(rand(s) * BOX_COLORS.length)];
function container(len, color) { return box(len, CH, CW, boxMat(color)); }

const _up = new THREE.Vector3(0, 1, 0);
function beam(a, b, t, m) {
  const v = new THREE.Vector3().subVectors(b, a);
  const mesh = box(t, v.length(), t, m);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(_up, v.normalize());
  return mesh;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const halfChord = (z, pad = 0) => Math.sqrt(Math.max(0, (R - pad) ** 2 - z * z));

/* ---------- ground ---------- */
const G = {
  grass: new THREE.Color('#aeb392'), concrete: new THREE.Color('#cfccc5'),
  ballast: new THREE.Color('#b0aaa0'), asphalt: new THREE.Color('#9a9ca0'), lot: new THREE.Color('#8f9296'),
};
function zone(x, z) {
  if (Math.hypot(x, z) > R - 1.4) return G.grass;
  if (z > CR_F + 3.2) return G.grass;
  if (z > TA + 2.1) return G.concrete;
  if (z > TB - 2.1) return G.ballast;
  if (z > LANE - 1.9) return G.asphalt;
  if (z > ROAD + 1.4) return G.concrete;
  if (z > ROAD - 1.5) return G.asphalt;
  return G.lot;
}
function floor() {
  const seg = 200, size = R * 2.1;
  const g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = [];
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), z = p.getZ(i);
    const r = Math.hypot(x, z);
    if (r > R) { const k = R / r; x *= k; z *= k; p.setX(i, x); p.setZ(i, z); }
    const c = zone(x, z).clone();
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96 }));
  m.position.y = 0.04;
  m.receiveShadow = true;
  return m;
}
function plinth() {
  const g = new THREE.Group();
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.975, 2.2, 96), mat('#b9b3a8', { roughness: 0.95 }));
  soil.position.y = -1.1;
  soil.receiveShadow = true;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.008, R * 1.008, 0.35, 96), mat('#9f998f', { roughness: 0.9 }));
  rim.position.y = -0.18;
  g.add(soil, rim);
  return g;
}

/* ---------- track + well cars ---------- */
function track(z) {
  const g = new THREE.Group();
  const hw = halfChord(z, 1.4);
  const n = Math.floor((hw * 2) / 0.75);
  const ties = new THREE.InstancedMesh(boxGeo(0.34, 0.16, 3.0), M.tie, n);
  const mx = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { mx.makeTranslation(-hw + 0.375 + i * 0.75, 0.08, z); ties.setMatrixAt(i, mx); }
  ties.receiveShadow = true;
  g.add(ties);
  for (const dz of [-0.72, 0.72]) g.add(box(hw * 2, 0.16, 0.14, M.rail, 0, 0.24, z + dz));
  return g;
}
function wellCar(x, z, loads, seed) {
  const g = new THREE.Group();
  const Lc = SLOT - 0.4;
  g.add(box(10.2, 0.16, 2.2, M.car, 0, DECK - 0.08, 0));                    // well floor
  for (const dz of [-1.12, 1.12]) g.add(box(10.2, 0.75, 0.16, M.car, 0, DECK + 0.2, dz));   // side sills
  for (const dx of [-1, 1]) {
    g.add(box(0.9, 1.25, 2.5, M.car, dx * (Lc / 2 - 0.45), 0.95, 0));       // bulkhead over truck
    g.add(box(2.2, 0.42, 1.7, M.truck, dx * (Lc / 2 - 0.9), 0.5, 0));       // truck frame
    for (const w of [-0.6, 0.6]) for (const dz of [-0.72, 0.72]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.14, 10), M.truck);
      wh.rotation.x = Math.PI / 2;
      wh.position.set(dx * (Lc / 2 - 0.9) + w, 0.38, dz);
      g.add(wh);
    }
  }
  if (loads) {
    if (loads[0]) { const c = container(L40, loads[0]); c.position.set(0, DECK + CH / 2, 0); g.add(c); }
    if (loads[1]) { const c = container(L53, loads[1]); c.position.set(0, DECK + CH * 1.5 + 0.02, 0); g.add(c); }
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.position.set(x, 0, z);
  return g;
}

/* ---------- wide-span gantry crane ---------- */
function crane() {
  const g = new THREE.Group();
  const XL = 6.2, zF = CR_F, zB = CR_B, legTop = 11.8, gY = 12.4, zEndF = CR_F + 3.2, zEndB = CR_B - 2.7;
  for (const z of [zF, zB]) {
    g.add(box(XL * 2 + 3, 0.6, 0.9, M.orange, 0, 0.7, z));                          // sill beam
    for (const x of [-XL, XL]) {
      g.add(box(2.3, 0.6, 1.25, M.steel, x, 0.3, z));                        // wheel bogie
      g.add(box(0.72, legTop - 1.0, 0.72, M.orange, x, (legTop + 1.0) / 2, z)); // leg
    }
    g.add(box(XL * 2 + 0.9, 0.8, 0.8, M.orange, 0, legTop - 0.2, z));        // portal beam
  }
  for (const x of [-XL, XL]) {
    g.add(box(0.8, 1.2, zEndF - zEndB, M.orange, x, gY + 0.1, (zEndF + zEndB) / 2)); // main girder
    g.add(box(0.12, 0.9, zEndF - zEndB, M.orangeDk, x + Math.sign(x) * 0.75, gY + 1.1, (zEndF + zEndB) / 2)); // handrail
    // knee braces inside the span and under the cantilevers
    g.add(beam(V(x, 7.6, zF), V(x, gY - 0.7, zF - 3.4), 0.42, M.orange));
    g.add(beam(V(x, 7.6, zB), V(x, gY - 0.7, zB + 3.4), 0.42, M.orange));
    g.add(beam(V(x, 8.8, zF), V(x, gY - 0.7, zF + 2.4), 0.38, M.orange));
    g.add(beam(V(x, 8.8, zB), V(x, gY - 0.7, zB - 2.2), 0.38, M.orange));
    // top A-frame: posts over each leg, tie rods out to the girder ends
    const pF = V(x, 16.4, zF - 1.2), pB = V(x, 16.4, zB + 1.2);
    g.add(beam(V(x, gY + 0.7, zF), pF, 0.42, M.orange));
    g.add(beam(V(x, gY + 0.7, zB), pB, 0.42, M.orange));
    g.add(beam(pF, V(x, gY + 0.7, zEndF - 0.3), 0.2, M.orangeDk));
    g.add(beam(pB, V(x, gY + 0.7, zEndB + 0.3), 0.2, M.orangeDk));
    g.add(beam(pF, pB, 0.24, M.orangeDk));
    g.add(beam(pF, V(x, gY + 0.7, (zF + zB) / 2 + 3.5), 0.2, M.orangeDk));
    g.add(beam(pB, V(x, gY + 0.7, (zF + zB) / 2 - 3.5), 0.2, M.orangeDk));
  }
  for (const z of [zEndF - 0.35, zEndB + 0.35]) g.add(box(XL * 2 + 0.95, 0.6, 0.6, M.orange, 0, gY, z));
  for (const z of [zF - 1.2, zB + 1.2]) g.add(box(XL * 2, 0.34, 0.34, M.orangeDk, 0, 16.4, z));

  // trolley rides on the girder tops
  const trolley = new THREE.Group();
  for (const x of [-XL, XL]) trolley.add(box(1.3, 0.7, 3.6, M.orangeDk, x, gY + 1.08, 0));
  for (const z of [-1.3, 1.3]) trolley.add(box(XL * 2 - 1.36, 0.5, 0.55, M.orange, 0, gY + 1.12, z));
  trolley.add(box(4.6, 1.5, 2.9, M.orange, 0, gY + 2.0, 0));                  // machinery house
  trolley.add(box(0.3, 2.2, 0.3, M.steel, 3.6, gY - 0.3, 1.2));                // cab hanger
  const cab = box(1.8, 1.8, 1.8, M.cab, 3.6, gY - 1.9, 1.2);
  trolley.add(cab, box(1.6, 0.9, 0.08, M.glass, 3.6, gY - 1.7, 2.12));
  g.add(trolley);

  // spreader + headblock, hung on four ropes
  const spreader = new THREE.Group();
  spreader.add(box(9.8, 0.32, 2.1, M.spreader, 0, 0.16, 0));
  for (const dx of [-4.75, 4.75]) spreader.add(box(0.5, 0.5, 2.3, M.orange, dx, 0.2, 0));
  spreader.add(box(2.4, 0.55, 1.5, M.orange, 0, 0.6, 0));
  g.add(spreader);
  const ropes = [];
  for (const [dx, dz] of [[-0.8, -0.45], [0.8, -0.45], [-0.8, 0.45], [0.8, 0.45]]) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 5), M.steel);
    r.userData.off = [dx, dz];
    g.add(r);
    ropes.push(r);
  }
  const ropeTop = gY + 0.8;
  const set = (z, y) => {
    trolley.position.z = z;
    spreader.position.set(0, y, z);
    for (const r of ropes) {
      const top = ropeTop, bot = y + 0.88;
      r.scale.y = Math.max(0.01, top - bot);
      r.position.set(r.userData.off[0], (top + bot) / 2, z + r.userData.off[1]);
    }
  };
  return { group: g, set };
}

/* ---------- road vehicles ---------- */
function chassis(len, withBox, color) {
  const g = new THREE.Group();
  for (const dx of [-0.5, 0.5]) g.add(box(0.16, 0.28, len, M.truck, dx, 0.88, 0));
  for (const dz of [-len / 2 + 0.4, len / 2 - 0.6]) g.add(box(1.9, 0.14, 0.16, M.truck, 0, 0.98, dz));
  for (const az of [-len / 2 + 1.1, -len / 2 + 2.3]) for (const dx of [-0.8, 0.8]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.34, 10), M.truck);
    w.rotation.z = Math.PI / 2;
    w.position.set(dx, 0.44, az);
    g.add(w);
  }
  for (const dx of [-0.6, 0.6]) g.add(box(0.1, 0.7, 0.1, M.truck, dx, 0.42, len / 2 - 2.6));
  if (withBox) {
    const c = container(len - 0.4, color);
    c.rotation.y = Math.PI / 2;
    c.position.y = 1.05 + CH / 2;
    g.add(c);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
function hostler() {
  const g = chassis(L53 + 0.4, false);
  const t = new THREE.Group();
  t.add(box(2.1, 1.2, 2.6, M.tractor, 0, 1.0, 0), box(1.9, 1.3, 1.5, M.tractor, 0, 2.2, -0.4), box(1.7, 0.6, 0.08, M.glass, 0, 2.35, 0.36));
  for (const dz of [-0.8, 0.8]) for (const dx of [-0.95, 0.95]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.34, 10), M.truck);
    w.rotation.z = Math.PI / 2;
    w.position.set(dx, 0.46, dz);
    t.add(w);
  }
  t.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  t.position.z = (L53 + 0.4) / 2 + 1.6;
  g.add(t);
  return g;
}
function mast(x, z) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 17, 8), M.pole);
  p.position.y = 8.5;
  p.castShadow = true;
  g.add(p, box(2.0, 0.3, 0.8, M.pole, 0, 17.1, 0));
  g.position.set(x, 0, z);
  return g;
}

/* ---------- yard layout ---------- */
function build(world) {
  world.add(plinth(), floor());
  // crane runway rails
  for (const z of [CR_F, CR_B]) world.add(box(halfChord(z, 1.6) * 2, 0.14, 0.3, M.steel, 0, 0.1, z));
  world.add(track(TA), track(TB));

  // train A: fully loaded double-stack; the car at x=0 loses its top box to the crane
  [-2, -1, 0, 1, 2].forEach((k, i) => {
    const top = k === 0 ? null : pickColor(i * 5.1 + 2);
    world.add(wellCar(k * SLOT, TA, [pickColor(i * 3.7 + 1), top]));
  });
  // train B: partly worked — some wells empty, some single-stacked
  [-1.5, -0.5, 0.5, 1.5].forEach((k, i) => {
    const r = rand(i * 9.3 + 4);
    const loads = r < 0.3 ? null : r < 0.6 ? [pickColor(i * 2.9 + 7), null] : [pickColor(i * 2.9 + 7), pickColor(i * 4.1 + 3)];
    world.add(wellCar(k * SLOT, TB, loads));
  });

  // stacks beside the tracks. [row z, slot] → height
  const stackH = {};
  for (const [row, zr] of [[0, S1], [1, S2], [2, S3]]) {
    for (let k = -2; k <= 2; k++) {
      let h = 1 + Math.floor(rand(k * 7.7 + row * 3.1 + 11) * 3);
      if (row === 0 && k === 0) h = 1;           // the crane's landing spot
      if (row === 1 && k === 0) h = 2;
      stackH[`${row}${k}`] = h;
      for (let lv = 0; lv < h; lv++) {
        const len = rand(k * 3.3 + lv * 1.9 + row) > 0.5 ? L53 : L40;
        const c = container(len, pickColor(k * 13.1 + lv * 5.7 + row * 17.3));
        c.position.set(k * SLOT, CH / 2 + lv * (CH + 0.02) + 0.02, zr);
        world.add(c);
      }
    }
  }

  // chassis lot: two rows, nose-in, 53' boxes mostly
  let s = 0;
  for (const zc of [LOT1, LOT2]) {
    const len = L53 + 0.4;
    for (let x = -30; x <= 30; x += 2.75) {
      s++;
      const zFar = zc - len / 2, zNear = zc + len / 2;
      if (Math.max(Math.hypot(x + 1.2, zFar), Math.hypot(x - 1.2, zFar), Math.hypot(x + 1.2, zNear)) > R - 2.6) continue;
      world.add(box(0.1, 0.02, len + 0.6, M.stripe, x - 1.375, 0.06, zc));
      const r = rand(s * 4.13 + zc);
      if (r < 0.1) continue;
      const u = chassis(len, r > 0.24, rand(s * 2.7) < 0.55 ? '#dcd9d2' : pickColor(s * 6.1));
      u.position.set(x, 0, zc);
      u.rotation.y = zc === LOT1 ? 0 : Math.PI;
      world.add(u);
    }
  }

  const h = hostler();
  h.rotation.y = Math.PI / 2;
  h.position.set(13, 0, LANE);
  world.add(h);

  [[-17, ROAD - 1.4], [17, ROAD - 1.4], [-20, CR_F + 2.4], [20, CR_F + 2.4]].forEach(([x, z]) => world.add(mast(x, z)));

  // an idle second crane down the ramp, trolley parked over track B

  const main = crane();
  world.add(main.group);

  const lifted = container(L53, pickColor(77.7));
  world.add(lifted);
  return { main, lifted };
}

/* ---------- lift choreography, keyed to station progress ---------- */
const Y_REST = 9.6, Y_TRAVEL = 8.6;
const Y_GRAB = DECK + CH * 2 + 0.04;          // spreader underside on the top box, on the train
const Y_SET = CH * 2 + 0.06;                   // spreader underside on the stack
function lift(p) {
  const down = smoothstep(0.28, 0.38, p);
  const up = smoothstep(0.42, 0.51, p);
  const move = smoothstep(0.52, 0.66, p);
  const lower = smoothstep(0.67, 0.76, p);
  const clear = smoothstep(0.79, 0.87, p);
  const z = lerp(TA, S1, move);
  let y;
  if (p < 0.42) y = lerp(Y_REST, Y_GRAB, down);
  else if (p < 0.67) y = lerp(Y_GRAB, Y_TRAVEL, up);
  else if (p < 0.79) y = lerp(Y_TRAVEL, Y_SET, lower);
  else y = lerp(Y_SET, Y_REST, clear);
  const attached = p >= 0.4 && p < 0.775;
  const onStack = p >= 0.775;
  return { z, y, attached, onStack };
}

/* ---------- element ---------- */
class YardDiorama extends HTMLElement {
  connectedCallback() {
    if (this._booted) return;
    this._booted = true;
    this.style.cssText = 'display:block;position:absolute;inset:0;width:100%;height:100%';
    RIB = RIB || ribTexture();

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

    scene.add(new THREE.HemisphereLight('#eef0f2', '#9a958c', 0.85));
    const sun = new THREE.DirectionalLight('#fff3e0', 2.0);
    sun.position.set(26, 46, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -44; sc.right = 44; sc.top = 44; sc.bottom = -44; sc.near = 1; sc.far = 170;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.05;
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#dde0e4', 0.45);
    fill.position.set(-30, 18, -24);
    scene.add(fill);

    const world = new THREE.Group();
    scene.add(world);
    Object.assign(this, build(world));

    this.pointer = { x: 0, y: 0 };
    this._onMove = (e) => {
      const r = this.getBoundingClientRect();
      this.pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      this.pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };

    this.az = 1.36; this.el = 0.70; this.fr = 82; this.lp = 0;
    this.resize();
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(this);
    this.loop();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('pointermove', this._onMove);
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
    const p = this.progress();

    const azT = lerp(1.36, 1.18, smoothstep(0, 1, p));
    const elT = lerp(0.70, 0.58, smoothstep(0.1, 0.95, p));
    const frT = lerp(82, 70, smoothstep(0.05, 0.95, p));
    this.az = lerp(this.az, azT, 0.045);
    this.el = lerp(this.el, elT, 0.045);
    this.fr = lerp(this.fr, frT, 0.05);

    // ease the lift clock a little so fast scrolls don't teleport the box
    this.lp = lerp(this.lp, p, 0.12);
    const L = lift(this.lp);
    this.main.set(L.z, L.y);
    const b = this.lifted;
    if (L.attached) b.position.set(0, L.y - CH / 2 - 0.02, L.z);
    else if (L.onStack) b.position.set(0, CH * 1.5 + 0.04, S1);
    else b.position.set(0, DECK + CH * 1.5 + 0.02, TA);

    const halfH = this.fr / 2, halfW = halfH * (this.aspect || 1.4);
    const c = this.cam;
    c.left = -halfW; c.right = halfW; c.top = halfH; c.bottom = -halfH;
    c.updateProjectionMatrix();
    const d = 150;
    c.position.set(
      Math.cos(this.az) * Math.cos(this.el) * d,
      Math.sin(this.el) * d,
      Math.sin(this.az) * Math.cos(this.el) * d
    );
    c.lookAt(lerp(1, 2, p), 5.0, lerp(1, 2.5, p));
    this.renderer.render(this.scene, c);
  };
}

if (!customElements.get('yard-diorama')) customElements.define('yard-diorama', YardDiorama);
