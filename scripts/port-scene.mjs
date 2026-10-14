// One-shot porting tool: turns a prototype diorama custom element from
// .claude/v2 into a scene module under src/scenes.
//
// Every edit is asserted — if a pattern does not match exactly the expected
// number of times the script throws rather than writing a half-ported file.
// Nothing between the edits is touched, so the geometry and camera numbers in
// src/scenes are the approved ones by construction.
//
//   node scripts/port-scene.mjs <name>        e.g. boulder, longs, yard

import { readFileSync, writeFileSync } from 'fs';

const name = process.argv[2];
if (!name) throw new Error('usage: node scripts/port-scene.mjs <name>');

const src = `.claude/v2/${name}-diorama (4).js`;
const out = `src/scenes/${name}.js`;
let s = readFileSync(src, 'utf8').replace(/\r\n/g, '\n');

const edits = [];
/** @param {string} label @param {RegExp} re @param {string} to @param {number} n */
function sub(label, re, to, n = 1) {
  const hits = s.match(re);
  const got = hits ? (re.global ? hits.length : 1) : 0;
  if (got !== n) throw new Error(`${name}: "${label}" matched ${got}x, expected ${n}x`);
  s = s.replace(re, to);
  edits.push(`${label} (${n})`);
}

// --- module boundary -------------------------------------------------------
sub(
  'three import',
  /^import \* as THREE from 'https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.1\/build\/three\.module\.js';$/m,
  "import * as THREE from 'three';\nimport { disposeScene } from './lib/dispose.js';"
);

const cls = s.match(/^class (\w+) extends HTMLElement \{$/m);
if (!cls) throw new Error(`${name}: no custom element class found`);
const className = cls[1];

sub('class declaration', /^class (\w+) extends HTMLElement \{$/m, 'class $1 {');

// --- constructor -----------------------------------------------------------
sub(
  'connectedCallback -> constructor',
  /^ {2}connectedCallback\(\) \{\n {4}if \(this\._booted\) return;\n {4}this\._booted = true;\n/m,
  [
    '  /**',
    '   * @param {HTMLElement} host element the renderer canvas is appended to',
    '   * @param {{card?: HTMLElement|null}} [ctx] optional page context',
    '   */',
    '  constructor(host, ctx = {}) {',
    '    this.host = host;',
    '    this.card = ctx.card ?? null;',
    '',
  ].join('\n')
);

// the host is sized and positioned by CSS now
s = s.replace(/^ {4}this\.style\.[^\n]*\n/gm, '');

sub('preserveDrawingBuffer', /, preserveDrawingBuffer: true/, '');
sub('canvas append', /^ {4}this\.appendChild\(renderer\.domElement\);$/m, '    this.host.appendChild(renderer.domElement);');
sub('ResizeObserver target', /^ {4}this\._ro\.observe\(this\);$/m, '    this._ro.observe(this.host);');
sub('self-driven loop', /^ {4}this\.loop\(\);\n/m, '');

// --- teardown --------------------------------------------------------------
s = s.replace(/^ {4}window\.removeEventListener\('pointermove', this\._onMove\);\n/gm, '');
sub(
  'disconnectedCallback -> dispose',
  / {2}disconnectedCallback\(\) \{\n {4}cancelAnimationFrame\(this\._raf\);\n(?: {4}this\._ro\?\.disconnect\(\);\n)? {4}this\.renderer\?\.dispose\(\);\n {2}\}/,
  [
    '  dispose() {',
    '    this._ro?.disconnect();',
    '    disposeScene(this.scene, this.renderer);',
    '  }',
  ].join('\n')
);

// Dead code in the prototype: a pointer handler that is built but never
// registered. It calls element methods a plain class does not have, so it goes.
const pointerBlock =
  / {4}this\.pointer = \{ x: 0, y: 0 \};\n {4}this\._onMove = \(e\) => \{\n[\s\S]*?\n {4}\};\n\n/;
if (pointerBlock.test(s)) sub('drop unused pointer handler', pointerBlock, '');

// --- sizing ----------------------------------------------------------------
const clientHits = (s.match(/this\.clientWidth \|\| 800, h = this\.clientHeight \|\| 600/g) || []).length;
sub(
  'host measurement',
  /this\.clientWidth \|\| 800, h = this\.clientHeight \|\| 600/g,
  'this.host.clientWidth || 800, h = this.host.clientHeight || 600',
  clientHits
);

// --- scroll ----------------------------------------------------------------
// The page's single driver owns scroll now, so the scene no longer measures it.
sub(
  'drop progress()',
  / {2}progress\(\) \{\n {4}const root = this\.closest\('\[data-scroll-root\]'\) \|\| document\.querySelector\('\[data-scroll-root\]'\);\n {4}if \(!root\) return 0;\n {4}const r = root\.getBoundingClientRect\(\);\n {4}const span = r\.height - window\.innerHeight;\n {4}return span <= 0 \? 0 : clamp01\(-r\.top \/ span\);\n {2}\}\n\n/,
  ''
);
sub(
  'loop -> frame(p)',
  / {2}loop = \(\) => \{\n {4}this\._raf = requestAnimationFrame\(this\.loop\);\n/,
  '  /** One step of the page loop. @param {number} p this station\'s scroll progress */\n  frame = (p) => {\n'
);
sub('drop self-read progress', /^ {4}const p = this\.progress\(\);\n/m, '');

// the inspection scene fits its frustum around the role card
if (/this\.closest\('\[data-scroll-root\]'\)\?\.querySelector\('article'\)/.test(s)) {
  sub(
    'card lookup -> injected ref',
    /const card = this\.closest\('\[data-scroll-root\]'\)\?\.querySelector\('article'\);/,
    'const card = this.card;'
  );
  sub('host rect', /mr = this\.getBoundingClientRect\(\)/, 'mr = this.host.getBoundingClientRect()');
}

// --- export ----------------------------------------------------------------
sub(
  'customElements.define -> mount',
  /^if \(!customElements\.get\('[\w-]+'\)\) customElements\.define\('[\w-]+', \w+\);$/m,
  [
    '/**',
    ' * @param {HTMLElement} host',
    ' * @param {{card?: HTMLElement|null}} [ctx]',
    ' * @returns {{frame: (p: number) => void, resize: () => void, dispose: () => void}}',
    ' */',
    `export const mount = (host, ctx) => new ${className}(host, ctx);`,
  ].join('\n')
);

if (/\bthis\.closest\(|customElements|connectedCallback|requestAnimationFrame/.test(s)) {
  throw new Error(`${name}: element-era code survived the port`);
}

writeFileSync(out, s);
console.log(`${out}\n  ${edits.join('\n  ')}`);
