// render.js — turns scene data (scenes.js) into the two side-by-side
// SVG pictures, and draws the marks the player earns on them.
// The left panel draws the base picture; the right panel draws the same
// picture with every difference applied. No images, no network: every
// pixel is an SVG element built here.

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEW_W = 520;
const VIEW_H = 360;

// Build one SVG element from a spec, for one side ('left' | 'right').
// A spec whose attrs carry only:'left'/'right' draws on that side alone.
// A spec whose attrs carry diff + alt draws its alt form on the right.
function svgEl(spec, side) {
  const a = spec.a || {};
  if (a.only && a.only !== side) return null;
  if (side === 'right' && a.diff && a.alt) {
    return svgEl(a.alt, side);
  }
  const el = document.createElementNS(SVG_NS, spec.t);
  for (const key of Object.keys(a)) {
    if (key === 'diff' || key === 'alt' || key === 'only') continue;
    el.setAttribute(key, a[key]);
  }
  if (spec.text !== undefined) el.textContent = spec.text;
  for (const child of spec.c || []) {
    const built = svgEl(child, side);
    if (built) el.appendChild(built);
  }
  return el;
}

// The base picture only (no markers): reused by the magnifier lens.
function buildBaseSVG(scene, side) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + VIEW_W + ' ' + VIEW_H);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', scene.name + ' picture, ' + side + ' side');
  const defs = document.createElementNS(SVG_NS, 'defs');
  const grad = document.createElementNS(SVG_NS, 'linearGradient');
  grad.setAttribute('id', 'sky');
  grad.setAttribute('x1', '0');
  grad.setAttribute('y1', '0');
  grad.setAttribute('x2', '0');
  grad.setAttribute('y2', '1');
  const stop1 = document.createElementNS(SVG_NS, 'stop');
  stop1.setAttribute('offset', '0');
  stop1.setAttribute('stop-color', scene.sky[0]);
  const stop2 = document.createElementNS(SVG_NS, 'stop');
  stop2.setAttribute('offset', '1');
  stop2.setAttribute('stop-color', scene.sky[1]);
  grad.appendChild(stop1);
  grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);
  for (const spec of scene.elements) {
    const built = svgEl(spec, side);
    if (built) svg.appendChild(built);
  }
  return svg;
}

// A full panel: base picture plus overlay groups the game draws into.
function buildPanel(scene, side) {
  const svg = buildBaseSVG(scene, side);
  const markers = document.createElementNS(SVG_NS, 'g');
  markers.setAttribute('class', 'markers');
  const hints = document.createElementNS(SVG_NS, 'g');
  hints.setAttribute('class', 'hints');
  const cursor = document.createElementNS(SVG_NS, 'g');
  cursor.setAttribute('class', 'cursor');
  svg.appendChild(hints);
  svg.appendChild(markers);
  svg.appendChild(cursor);
  return { svg: svg, markers: markers, hints: hints, cursor: cursor };
}

// A satisfying found mark: a green ring that pulses once, plus the find's number.
function addFoundMark(markers, x, y, n) {
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'found-mark');
  const ring = document.createElementNS(SVG_NS, 'circle');
  ring.setAttribute('cx', x);
  ring.setAttribute('cy', y);
  ring.setAttribute('r', 20);
  ring.setAttribute('class', 'found-ring');
  const badge = document.createElementNS(SVG_NS, 'circle');
  badge.setAttribute('cx', x + 16);
  badge.setAttribute('cy', y - 16);
  badge.setAttribute('r', 10);
  badge.setAttribute('class', 'found-badge');
  const label = document.createElementNS(SVG_NS, 'text');
  label.setAttribute('x', x + 16);
  label.setAttribute('y', y - 12.5);
  label.setAttribute('class', 'found-label');
  label.textContent = String(n);
  g.appendChild(ring);
  g.appendChild(badge);
  g.appendChild(label);
  markers.appendChild(g);
}

// A wrong click: a red X that fades away.
function addMissMark(markers, x, y) {
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'miss-mark');
  const l1 = document.createElementNS(SVG_NS, 'line');
  l1.setAttribute('x1', x - 9); l1.setAttribute('y1', y - 9);
  l1.setAttribute('x2', x + 9); l1.setAttribute('y2', y + 9);
  const l2 = document.createElementNS(SVG_NS, 'line');
  l2.setAttribute('x1', x - 9); l2.setAttribute('y1', y + 9);
  l2.setAttribute('x2', x + 9); l2.setAttribute('y2', y - 9);
  g.appendChild(l1);
  g.appendChild(l2);
  markers.appendChild(g);
  setTimeout(function () { g.remove(); }, 900);
}

// A hint: an amber ring that breathes around the spot for a while.
function addHintPulse(hints, x, y, ms) {
  const ring = document.createElementNS(SVG_NS, 'circle');
  ring.setAttribute('cx', x);
  ring.setAttribute('cy', y);
  ring.setAttribute('r', 24);
  ring.setAttribute('class', 'hint-ring');
  hints.appendChild(ring);
  setTimeout(function () { ring.remove(); }, ms || 2200);
  return ring;
}

// The keyboard crosshair: a small ring with ticks, drawn on the active panel.
function drawCursor(cursorG, x, y) {
  cursorG.innerHTML = '';
  const ring = document.createElementNS(SVG_NS, 'circle');
  ring.setAttribute('cx', x);
  ring.setAttribute('cy', y);
  ring.setAttribute('r', 12);
  ring.setAttribute('class', 'cursor-ring');
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', x);
  dot.setAttribute('cy', y);
  dot.setAttribute('r', 2);
  dot.setAttribute('class', 'cursor-dot');
  cursorG.appendChild(ring);
  cursorG.appendChild(dot);
}

// Convert a mouse position over an svg to viewBox coordinates.
function svgPoint(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (VIEW_W / rect.width),
    y: (clientY - rect.top) * (VIEW_H / rect.height),
  };
}
