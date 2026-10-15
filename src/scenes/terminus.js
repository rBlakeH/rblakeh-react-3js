// Finale diorama — end of track. An empty platform, a bumper post, and a searchlight
// signal that clears from red to green as you scroll. Light warms toward dusk; the
// platform lamps come up. Nameboard carries Blake's name — a sign-off, not a destination.
import * as THREE from 'three';
import { disposeScene } from './lib/dispose.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rand = (s) => { const x = Math.sin(s * 99.13) * 43758.5453; return x - Math.floor(x); };

const R = 34;
const TZ = 1.5;            // track centreline
const END_X = 17;          // bumper face
const TIE = 0.75;
const PZ0 = TZ - 6.2, PZ1 = TZ - 1.95, PX0 = -15, PX1 = 8, PH = 1.05; // platform extents

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, flatShading: true, ...o });
const M = {
  soil: mat('#b7a488', { roughness: 0.95 }),
  rim: mat('#a18f76', { roughness: 0.9 }),
  grass: mat('#b3ae92', { roughness: 0.97, flatShading: false }),
  rail: mat('#7b7772', { roughness: 0.5, metalness: 0.35 }),
  tie: mat('#5f5349', { roughness: 0.95 }),
  concrete: mat('#d4d1ca', { roughness: 0.92 }),
  concrete2: mat('#bdb9b1', { roughness: 0.92 }),
  edge: mat('#d6b03b', { roughness: 0.6 }),
  roof: mat('#43474d', { roughness: 0.7 }),
  post: mat('#5a5d61', { roughness: 0.6, metalness: 0.2 }),
  wood: mat('#7a6552', { roughness: 0.9 }),
  black: mat('#26282b', { roughness: 0.8 }),
  yellow: mat('#d6b03b', { roughness: 0.6 }),
  mast: mat('#8e9196', { roughness: 0.55, metalness: 0.25 }),
  bush: mat('#8f9877'),
  bush2: mat('#a6a585'),
  tree: mat('#7f8a6c'),
  tree2: mat('#96987a'),
  trunk: mat('#6f5c4b'),
  rock: mat('#b19a82'),
  lamp: new THREE.MeshStandardMaterial({ color: '#fff6d8', emissive: '#ffe0a0', emissiveIntensity: 0.2 }),
};

const geoCache = {};
const boxGeo = (w, h, d) => { const k = `${w}|${h}|${d}`; return geoCache[k] || (geoCache[k] = new THREE.BoxGeometry(w, h, d)); };
function box(w, h, d, m, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(boxGeo(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
const halfChord = (z, pad = 0) => Math.sqrt(Math.max(0, (R - pad) ** 2 - z * z));

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

function nameboardTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 200;
  const g = c.getContext('2d');
  const draw = () => {
    g.fillStyle = '#23262b'; g.fillRect(0, 0, 1024, 200);
    g.strokeStyle = '#e8e4da'; g.lineWidth = 6; g.strokeRect(14, 14, 996, 172);
    g.fillStyle = '#f1ede4';
    g.font = '700 96px "Space Grotesk", system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('Blake Hampton', 512, 104);
  };
  draw();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  document.fonts?.load('700 96px "Space Grotesk"').then(() => { draw(); t.needsUpdate = true; });
  return t;
}

function track(world) {
  const x0 = -halfChord(TZ, 1.2), x1 = END_X + 1.6, L = x1 - x0;
  const tex = ballastTexture();
  tex.repeat.set(L / 4, 1);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(L, 0.14, 3.8), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  bed.position.set((x0 + x1) / 2, 0.07, TZ); bed.receiveShadow = true;
  world.add(bed);
  const n = Math.floor((END_X + 0.9 - x0) / TIE);
  const ties = new THREE.InstancedMesh(boxGeo(0.3, 0.14, 2.9), M.tie, n);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) ties.setMatrixAt(i, m4.makeTranslation(x0 + 0.4 + i * TIE, 0.2, TZ));
  ties.castShadow = ties.receiveShadow = true;
  world.add(ties);
  const rx1 = END_X + 0.5;
  for (const dz of [-0.72, 0.72]) world.add(box(rx1 - x0, 0.16, 0.13, M.rail, (x0 + rx1) / 2, 0.24, TZ + dz));
}

function bumper() {
  const g = new THREE.Group();
  g.position.set(END_X + 0.3, 0.32, TZ);
  g.add(box(0.5, 0.9, 2.5, M.yellow, 0, 0.95, 0));                                  // head beam
  for (const z of [-0.8, 0, 0.8]) g.add(box(0.52, 0.9, 0.22, M.black, 0, 0.95, z)); // hazard stripes
  for (const z of [-0.72, 0.72]) {
    g.add(box(0.18, 1.5, 0.16, M.black, 0.1, 0.7, z));                              // posts
    const brace = box(0.16, 2.2, 0.16, M.black, 0.85, 0.72, z);                      // raking brace
    brace.rotation.z = 0.78;
    g.add(brace);
  }
  return g;
}

function signal() {
  const g = new THREE.Group();
  g.position.set(END_X - 4.2, 0, TZ + 2.7);
  g.add(box(0.9, 0.35, 0.9, M.concrete2, 0, 0.17, 0));
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 5.4, 10), M.mast);
  mast.position.y = 3.0; mast.castShadow = true;
  g.add(mast);
  for (let y = 0.8; y < 5.0; y += 0.42) g.add(box(0.36, 0.04, 0.05, M.mast, 0, y, 0.2)); // ladder rungs
  const head = new THREE.Group();
  head.position.set(0, 5.45, 0.12);
  head.rotation.y = -0.45;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 28), M.black);
  plate.rotation.x = Math.PI / 2; plate.castShadow = true;
  head.add(plate);
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.34, 20, 1, true, -Math.PI / 2, Math.PI), M.black);
  hood.rotation.x = Math.PI / 2; hood.rotation.y = Math.PI / 2; hood.position.set(0, 0.02, 0.2);
  head.add(hood);
  const lensMat = new THREE.MeshStandardMaterial({ color: '#2a1c1a', emissive: '#e0442e', emissiveIntensity: 1.6, roughness: 0.3 });
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), lensMat);
  lens.position.z = 0.1;
  head.add(lens);
  const haloMat = new THREE.MeshBasicMaterial({ color: '#e0442e', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  const halo = new THREE.Mesh(new THREE.CircleGeometry(0.75, 28), haloMat);
  halo.position.z = 0.16;
  head.add(halo);
  g.add(head);
  return { g, lensMat, haloMat };
}

function platform(world) {
  const cx = (PX0 + PX1) / 2, cz = (PZ0 + PZ1) / 2, L = PX1 - PX0, D = PZ1 - PZ0;
  world.add(box(L, PH, D, M.concrete, cx, PH / 2, cz));
  world.add(box(L, 0.03, 0.38, M.edge, cx, PH + 0.01, PZ1 - 0.35));
  world.add(box(L, 0.08, 0.2, M.concrete2, cx, PH - 0.04, PZ1 + 0.02));             // coping
  // ramp down at the far end
  const ramp = box(3.2, 0.14, D, M.concrete2, PX0 - 1.4, PH / 2, cz);
  ramp.rotation.z = 0.32;
  world.add(ramp);
  // canopy
  const RZ = PZ0 + 1.7;
  for (let x = PX0 + 2.5; x < PX1 - 1; x += 4.6) {
    world.add(box(0.16, 3.1, 0.16, M.post, x, PH + 1.55, RZ));
    world.add(box(0.12, 0.12, 2.8, M.post, x, PH + 3.05, RZ + 0.5));
    world.add(box(0.5, 0.1, 0.18, M.lamp, x, PH + 2.92, RZ + 1.4));
  }
  const roof = box(L - 2.4, 0.16, 3.6, M.roof, cx, PH + 3.25, RZ + 0.5);
  roof.rotation.x = -0.06;
  world.add(roof);
  // benches
  for (const x of [-9.4, 0.8]) {
    world.add(box(1.8, 0.08, 0.5, M.wood, x, PH + 0.48, RZ - 0.6));
    world.add(box(1.8, 0.4, 0.07, M.wood, x, PH + 0.75, RZ - 0.86));
    for (const dx of [-0.75, 0.75]) world.add(box(0.07, 0.46, 0.46, M.black, x + dx, PH + 0.23, RZ - 0.6));
  }
  // nameboard
  const bx = -4.3, bz = PZ1 - 1.15;
  for (const dx of [-2.05, 2.05]) world.add(box(0.14, 2.6, 0.14, M.black, bx + dx, PH + 1.3, bz));
  world.add(box(4.4, 0.9, 0.1, M.black, bx, PH + 2.2, bz));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 0.84), new THREE.MeshStandardMaterial({ map: nameboardTexture(), roughness: 0.6 }));
  face.position.set(bx, PH + 2.2, bz + 0.056);
  world.add(face);
  // lamp standard at the platform tip
  world.add(box(0.12, 4.2, 0.12, M.post, PX1 - 0.6, PH + 2.1, PZ1 - 1.0));
  world.add(box(0.7, 0.12, 0.12, M.post, PX1 - 0.9, PH + 4.2, PZ1 - 1.0));
  world.add(box(0.34, 0.14, 0.3, M.lamp, PX1 - 1.2, PH + 4.08, PZ1 - 1.0));
}

function tree(s) {
  const g = new THREE.Group();
  const h = 2.6 + rand(s) * 2.2;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, h * 0.4, 6), M.trunk);
  trunk.position.y = h * 0.2; trunk.castShadow = true;
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(h * 0.36, 0), rand(s * 1.9) > 0.5 ? M.tree : M.tree2);
  crown.position.y = h * 0.62; crown.scale.y = 1.15; crown.castShadow = true;
  g.add(trunk, crown);
  return g;
}
function bush(s) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 + rand(s) * 0.55, 0), rand(s * 2.3) > 0.5 ? M.bush : M.bush2);
  m.scale.y = 0.55 + rand(s * 3.7) * 0.25; m.castShadow = true;
  return m;
}
function rock(s) {
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + rand(s) * 0.5, 0), M.rock);
  m.scale.y = 0.5; m.rotation.y = rand(s * 4.4) * 3; m.castShadow = true;
  return m;
}

function build(world) {
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.975, 2.2, 96), M.soil);
  soil.position.y = -1.1; soil.receiveShadow = true;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.008, R * 1.008, 0.35, 96), M.rim);
  rim.position.y = -0.18;
  const ground = new THREE.Mesh(new THREE.CircleGeometry(R, 96), M.grass);
  ground.rotation.x = -Math.PI / 2; ground.position.y = 0.02; ground.receiveShadow = true;
  world.add(soil, rim, ground);

  track(world);
  world.add(bumper());
  platform(world);
  const sig = signal();
  world.add(sig.g);

  const clear = (x, z) => {
    if (z > TZ - 2.6 && z < TZ + 2.4) return false;                                  // track
    if (x > PX0 - 3.2 && x < PX1 + 0.6 && z > PZ0 - 0.6 && z < PZ1 + 0.4) return false; // platform
    if (Math.abs(x - (END_X - 4.2)) < 1.4 && Math.abs(z - (TZ + 2.7)) < 1.4) return false;
    return Math.hypot(x, z) < R - 2.4;
  };
  for (let i = 0; i < 110; i++) {
    const x = -R + rand(i * 4.37 + 1.1) * 2 * R, z = -R + rand(i * 2.71 + 0.3) * 2 * R;
    if (!clear(x, z)) continue;
    const far = z < PZ0 - 1 || x > END_X + 2.5;
    const r = rand(i * 6.1);
    const o = far && r > 0.45 ? tree(i + 1) : r > 0.3 ? bush(i + 1) : rock(i + 1);
    o.position.set(x, 0.05, z);
    world.add(o);
  }
  return { sig };
}

const RED = new THREE.Color('#e0442e'), GREEN = new THREE.Color('#3fcf78');
const SUN_DAY = new THREE.Color('#fff1dc'), SUN_DUSK = new THREE.Color('#ffc99a');

class TerminusDiorama {
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
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);

    this.hemi = new THREE.HemisphereLight('#eef0f2', '#9a8f80', 0.9);
    scene.add(this.hemi);
    const sun = new THREE.DirectionalLight('#fff1dc', 2.1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 180;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.05;
    scene.add(sun);
    this.sun = sun;
    const fill = new THREE.DirectionalLight('#dde0e4', 0.5);
    fill.position.set(-30, 16, 24);
    scene.add(fill);

    const world = new THREE.Group();
    scene.add(world);
    Object.assign(this, build(world));

    this.az = 1.8; this.el = 0.32; this.fr = 30; this.sp = 0;
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

    // signal: red → dark → green, eased so the change reads as a searchlight swap
    this.sp = lerp(this.sp, smoothstep(0.4, 0.52, p), 0.08);
    const s = this.sp, dip = 1 - Math.sin(s * Math.PI) * 0.92;
    const col = s < 0.5 ? RED : GREEN;
    this.sig.lensMat.emissive.copy(col);
    this.sig.lensMat.emissiveIntensity = 1.7 * dip;
    this.sig.haloMat.color.copy(col);
    this.sig.haloMat.opacity = 0.38 * dip;

    // day → dusk
    const dusk = smoothstep(0.15, 0.95, p);
    this.sun.color.copy(SUN_DAY).lerp(SUN_DUSK, dusk);
    this.sun.intensity = lerp(2.1, 1.55, dusk);
    this.sun.position.set(lerp(18, 34, dusk), lerp(40, 22, dusk), lerp(28, 18, dusk));
    this.hemi.intensity = lerp(0.9, 0.72, dusk);
    M.lamp.emissiveIntensity = lerp(0.2, 1.3, smoothstep(0.35, 0.8, p));

    const azT = lerp(1.84, 1.7, smoothstep(0, 1, p));
    const elT = lerp(0.36, 0.27, smoothstep(0.05, 0.9, p));
    const w = this.host.clientWidth || 800, h = this.host.clientHeight || 600;
    const frT = Math.max(22, (2 * R * 0.94) / (w / h)) * lerp(1.06, 0.97, smoothstep(0.05, 0.9, p));
    this.az = lerp(this.az, azT, 0.035);
    this.el = lerp(this.el, elT, 0.035);
    this.fr = lerp(this.fr, frT, 0.05);

    const halfH = this.fr / 2, halfW = halfH * (w / h);
    const cam = this.cam;
    cam.left = -halfW; cam.right = halfW; cam.top = halfH; cam.bottom = -halfH;
    cam.updateProjectionMatrix();
    const D = 150;
    cam.position.set(Math.cos(this.az) * Math.cos(this.el) * D, Math.sin(this.el) * D, Math.sin(this.az) * Math.cos(this.el) * D);
    cam.lookAt(1, 1.4, -1.6);
    this.renderer.render(this.scene, cam);
  };
}

/**
 * @param {HTMLElement} host
 * @param {{card?: HTMLElement|null}} [ctx]
 * @returns {{frame: (p: number) => void, resize: () => void, dispose: () => void}}
 */
export const mount = (host, ctx) => new TerminusDiorama(host, ctx);
