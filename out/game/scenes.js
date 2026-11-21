// scenes.js — the three worlds and their 21 differences.
// Every scene is drawn from plain data: a list of SVG element specs plus
// seven difference specs. The left panel draws the base picture; the right
// panel draws the same picture with each difference applied:
//   - an element with only:'left' is missing on the right (missing object)
//   - an element with only:'right' is added on the right (added object)
//   - an element with diff + alt draws its alt form on the right
//     (colour change, moved, resized, flipped, extra pattern)
// A difference is fair because its hit spot (x, y, r) is the same object
// the player can see in both panels; moved objects also carry rx, ry.

function circle(cx, cy, r, fill, extra) {
  return { t: 'circle', a: Object.assign({ cx: cx, cy: cy, r: r, fill: fill }, extra || {}) };
}
function ellipse(cx, cy, rx, ry, fill, extra) {
  return { t: 'ellipse', a: Object.assign({ cx: cx, cy: cy, rx: rx, ry: ry, fill: fill }, extra || {}) };
}
function rect(x, y, w, h, fill, extra) {
  return { t: 'rect', a: Object.assign({ x: x, y: y, width: w, height: h, fill: fill }, extra || {}) };
}
function path(d, fill, extra) {
  return { t: 'path', a: Object.assign({ d: d, fill: fill }, extra || {}) };
}
function line(x1, y1, x2, y2, stroke, width, extra) {
  return { t: 'line', a: Object.assign({ x1: x1, y1: y1, x2: x2, y2: y2, stroke: stroke, 'stroke-width': width }, extra || {}) };
}
function poly(points, fill, extra) {
  return { t: 'polygon', a: Object.assign({ points: points, fill: fill }, extra || {}) };
}
function text(x, y, str, fill, size, extra) {
  return { t: 'text', a: Object.assign({ x: x, y: y, fill: fill, 'font-size': size, 'font-family': 'Verdana, sans-serif', 'font-weight': 'bold' }, extra || {}), text: str };
}
function group(children, extra) {
  return { t: 'g', a: extra || {}, c: children };
}

// One flower: stem, five petals, centre. Petals take the flower's colour.
function flower(x, y, petal) {
  return group([
    line(x, y, x, y + 22, '#2d6a2e', 3),
    circle(x - 8, y - 4, 6, petal), circle(x + 8, y - 4, 6, petal),
    circle(x, y - 11, 6, petal), circle(x - 5, y + 5, 6, petal), circle(x + 5, y + 5, 6, petal),
    circle(x, y, 5, '#ffd93b'),
  ]);
}

// One small fish: body ellipse, tail triangle, eye dot.
function fish(x, y, body, dir) {
  const s = dir < 0 ? -1 : 1;
  return group([
    ellipse(x, y, 14, 8, body),
    poly((x + 14 * s) + ',' + y + ' ' + (x + 24 * s) + ',' + (y - 7) + ' ' + (x + 24 * s) + ',' + (y + 7), body),
    circle(x - 6 * s, y - 2, 2, '#10243e'),
  ]);
}

const SCENES = [
  {
    id: 'garden',
    name: 'Rooftop Garden',
    tag: 'Scene 1 — Easy · sunny morning',
    sky: ['#aee2ff', '#dff3ff'],
    elements: [
      rect(0, 0, 520, 360, 'url(#sky)'),
      // Sun, top left. Diff: colour (yellow -> orange).
      group([circle(70, 64, 26, '#ffd93b', { diff: 'sun', alt: circle(70, 64, 26, '#ff9f1c') }),
        line(70, 28, 70, 20, '#ffd93b', 3), line(70, 100, 70, 108, '#ffd93b', 3),
        line(34, 64, 26, 64, '#ffd93b', 3), line(106, 64, 114, 64, '#ffd93b', 3)]),
      // Cloud A. Diff: missing on the right.
      group([ellipse(190, 56, 30, 14, '#ffffff'), ellipse(208, 48, 22, 12, '#ffffff'), ellipse(172, 50, 18, 10, '#ffffff')],
        { only: 'left', diff: 'cloud' }),
      // Cloud B, static.
      group([ellipse(400, 42, 34, 13, '#ffffff'), ellipse(420, 34, 20, 11, '#ffffff')]),
      // Bird. Diff: moved down-right on the right.
      group([path('M318 92 Q328 82 338 92 Q348 82 358 92', 'none', { stroke: '#33415c', 'stroke-width': 3, fill: 'none' })],
        { diff: 'bird', alt: group([path('M358 118 Q368 108 378 118 Q388 108 398 118', 'none', { stroke: '#33415c', 'stroke-width': 3, fill: 'none' })]) }),
      // Distant rooftops.
      rect(0, 190, 90, 80, '#9db8c9'), rect(90, 205, 80, 65, '#8aa5b8'),
      rect(430, 195, 90, 75, '#9db8c9'), rect(20, 178, 40, 14, '#7c93a6'), rect(450, 183, 40, 14, '#7c93a6'),
      // Laundry line with three shirts.
      line(20, 150, 330, 150, '#6b4f2a', 2),
      line(20, 150, 20, 270, '#6b4f2a', 3), line(330, 150, 330, 270, '#6b4f2a', 3),
      rect(66, 150, 36, 42, '#ffffff', { stroke: '#c9c9c9', 'stroke-width': 1 }),
      // Middle shirt. Diff: extra stripes on the right.
      group([rect(150, 150, 36, 42, '#4cc9f0', { stroke: '#2a9bc2', 'stroke-width': 1 })],
        { diff: 'shirt', alt: group([rect(150, 150, 36, 42, '#4cc9f0', { stroke: '#2a9bc2', 'stroke-width': 1 }),
          line(150, 162, 186, 162, '#ffffff', 3), line(150, 174, 186, 174, '#ffffff', 3), line(150, 186, 186, 186, '#ffffff', 3)]) }),
      rect(238, 150, 36, 42, '#ffd166', { stroke: '#d9a441', 'stroke-width': 1 }),
      // Garden wall and soil bed.
      rect(0, 252, 520, 108, '#c98f5f'),
      rect(0, 252, 520, 8, '#a9713f'),
      rect(18, 296, 484, 44, '#7a5230'),
      ellipse(60, 296, 40, 10, '#5d9b4a'), ellipse(180, 298, 46, 10, '#5d9b4a'),
      ellipse(310, 296, 42, 10, '#5d9b4a'), ellipse(440, 298, 44, 10, '#5d9b4a'),
      // Five flowers; the third changes colour.
      flower(60, 282, '#e63946'), flower(140, 282, '#ff7b9c'),
      group([flower(230, 282, '#e63946')], { diff: 'flower', alt: group([flower(230, 282, '#7b2fbe')]) }),
      flower(320, 282, '#ff7b9c'), flower(410, 282, '#e63946'),
      // Watering can. Diff: bigger on the right.
      group([
        rect(96, 232, 34, 26, '#2a9d8f', { rx: 4 }),
        path('M130 238 L152 226 L152 234 L130 246 Z', '#2a9d8f'),
        path('M96 238 Q84 244 96 252', 'none', { stroke: '#2a9d8f', 'stroke-width': 4, fill: 'none' }),
      ], { diff: 'can', alt: group([
        rect(96, 232, 34, 26, '#2a9d8f', { rx: 4 }),
        path('M130 238 L152 226 L152 234 L130 246 Z', '#2a9d8f'),
        path('M96 238 Q84 244 96 252', 'none', { stroke: '#2a9d8f', 'stroke-width': 4, fill: 'none' }),
      ], { transform: 'translate(113 245) scale(1.35) translate(-113 -245)' }) }),
      // Cat on the wall, static.
      group([
        ellipse(452, 240, 22, 14, '#f4a261'), circle(470, 228, 11, '#f4a261'),
        poly('462,220 464,208 470,217', '#f4a261'), poly('474,219 480,209 481,220', '#f4a261'),
        path('M432 240 Q420 228 428 218', 'none', { stroke: '#f4a261', 'stroke-width': 5, fill: 'none' }),
        circle(473, 226, 1.6, '#222222'),
      ]),
      // Mushroom. Diff: added on the right.
      group([rect(297, 302, 6, 12, '#fff3e0'), ellipse(300, 300, 12, 8, '#e63946'),
        circle(295, 298, 2, '#ffffff'), circle(304, 297, 2, '#ffffff')], { only: 'right', diff: 'mushroom' }),
    ],
    diffs: [
      { id: 'sun', x: 70, y: 64, r: 34, kind: 'colour change', label: 'Sun turned orange' },
      { id: 'cloud', x: 190, y: 54, r: 40, kind: 'missing object', label: 'Cloud vanished' },
      { id: 'bird', x: 338, y: 92, rx: 378, ry: 118, r: 26, kind: 'moved object', label: 'Bird flew lower' },
      { id: 'flower', x: 230, y: 282, r: 26, kind: 'colour change', label: 'Flower turned purple' },
      { id: 'can', x: 113, y: 245, r: 30, kind: 'size change', label: 'Watering can grew' },
      { id: 'shirt', x: 168, y: 171, r: 26, kind: 'extra pattern', label: 'Shirt gained stripes' },
      { id: 'mushroom', x: 300, y: 304, r: 20, kind: 'added object', label: 'Mushroom sprouted' },
    ],
  },
  {
    id: 'reef',
    name: 'Coral Reef Dive',
    tag: 'Scene 2 — Medium · under the waves',
    sky: ['#0b5fa5', '#0a4a86'],
    elements: [
      rect(0, 0, 520, 360, 'url(#sky)'),
      // Light rays from the surface.
      poly('60,0 110,0 70,300 30,300', '#ffffff', { opacity: 0.10 }),
      poly('240,0 275,0 250,300 215,300', '#ffffff', { opacity: 0.08 }),
      poly('420,0 450,0 440,300 410,300', '#ffffff', { opacity: 0.10 }),
      // Sandy floor and rocks.
      path('M0 300 Q130 288 260 300 T520 300 L520 360 L0 360 Z', '#e8c97a'),
      ellipse(200, 322, 46, 14, '#c9a86a'), ellipse(470, 330, 40, 12, '#b8935a'),
      ellipse(30, 332, 34, 12, '#8d99ae'),
      // Pink coral. Diff: taller on the right.
      group([
        path('M60 300 Q54 272 46 258 M60 300 Q60 268 58 250 M60 300 Q68 274 78 262', 'none', { stroke: '#ff70a6', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }),
        circle(46, 256, 5, '#ff70a6'), circle(58, 248, 5, '#ff70a6'), circle(78, 260, 5, '#ff70a6'),
      ], { diff: 'coral', alt: group([
        path('M60 300 Q54 272 46 258 M60 300 Q60 268 58 250 M60 300 Q68 274 78 262', 'none', { stroke: '#ff70a6', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }),
        circle(46, 256, 5, '#ff70a6'), circle(58, 248, 5, '#ff70a6'), circle(78, 260, 5, '#ff70a6'),
      ], { transform: 'translate(60 300) scale(1.32) translate(-60 -300)' }) }),
      // Orange coral, static.
      group([
        path('M452 300 Q446 276 440 264 M452 300 Q454 272 456 254 M452 300 Q460 278 470 266', 'none', { stroke: '#fb8500', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }),
        circle(440, 262, 5, '#fb8500'), circle(456, 252, 5, '#fb8500'), circle(470, 264, 5, '#fb8500'),
      ]),
      // Purple coral, static.
      group([
        path('M300 305 Q296 288 290 278 M300 305 Q304 286 310 276', 'none', { stroke: '#9b5de5', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }),
        circle(290, 276, 4, '#9b5de5'), circle(310, 274, 4, '#9b5de5'),
      ]),
      // Big fish. Diff: extra stripes on the right.
      group([fish(250, 140, '#ff9f1c', 1),
        line(246, 132, 246, 148, '#c96a00', 3), line(256, 132, 256, 148, '#c96a00', 3)],
        { diff: 'bigfish', alt: group([fish(250, 140, '#ff9f1c', 1),
          line(240, 132, 240, 148, '#c96a00', 3), line(246, 132, 246, 148, '#c96a00', 3),
          line(252, 132, 252, 148, '#c96a00', 3), line(258, 132, 258, 148, '#c96a00', 3)]) }),
      // School: one yellow fish changes colour.
      group([fish(150, 110, '#ffd93b', 1)], { diff: 'yellowfish', alt: group([fish(150, 110, '#ff5da2', 1)]) }),
      fish(120, 150, '#4cc9f0', 1), fish(190, 170, '#4cc9f0', -1), fish(90, 90, '#ffd93b', 1),
      // Small blue fish. Diff: moved on the right.
      group([fish(320, 200, '#4361ee', -1)], { diff: 'bluefish', alt: group([fish(356, 172, '#4361ee', -1)]) }),
      // Diver with tank. Diff: one flipper flipped on the right.
      group([
        ellipse(380, 120, 20, 12, '#22223b'), circle(398, 116, 9, '#f4a261'),
        rect(362, 104, 10, 18, '#90be6d', { rx: 3 }),
        poly('362,126 348,140 362,134', '#ffd93b'),
        poly('362,118 348,108 362,114', '#ffd93b'),
        circle(404, 132, 3, '#ffffff', { opacity: 0.7 }), circle(410, 120, 2.5, '#ffffff', { opacity: 0.7 }),
      ], { diff: 'flipper', alt: group([
        ellipse(380, 120, 20, 12, '#22223b'), circle(398, 116, 9, '#f4a261'),
        rect(362, 104, 10, 18, '#90be6d', { rx: 3 }),
        poly('362,126 348,140 362,134', '#ffd93b'),
        poly('362,118 376,108 362,114', '#ffd93b'),
        circle(404, 132, 3, '#ffffff', { opacity: 0.7 }), circle(410, 120, 2.5, '#ffffff', { opacity: 0.7 }),
      ]) }),
      // Treasure chest. Diff: extra coins beside it on the right.
      group([
        rect(80, 288, 44, 22, '#7a4a21'), path('M80 288 Q102 272 124 288 Z', '#9c6644'),
        line(102, 272, 102, 310, '#ffd93b', 3),
        circle(92, 284, 4, '#ffd93b'), circle(108, 284, 4, '#ffd93b'),
      ]),
      group([circle(136, 306, 5, '#ffd93b'), circle(146, 308, 5, '#ffd93b'), circle(141, 300, 5, '#ffd93b')],
        { only: 'right', diff: 'coins' }),
      // Starfish. Diff: missing on the right.
      group([
        poly('400,306 404,316 415,317 406,324 409,335 400,329 391,335 394,324 385,317 396,316', '#ff7b00'),
        circle(400, 320, 3, '#e85d04'),
      ], { only: 'left', diff: 'starfish' }),
      // Bubbles, static.
      circle(430, 90, 5, '#ffffff', { opacity: 0.55 }), circle(442, 70, 4, '#ffffff', { opacity: 0.5 }),
      circle(420, 60, 3, '#ffffff', { opacity: 0.45 }),
    ],
    diffs: [
      { id: 'yellowfish', x: 150, y: 110, r: 24, kind: 'colour change', label: 'Yellow fish turned pink' },
      { id: 'starfish', x: 400, y: 320, r: 22, kind: 'missing object', label: 'Starfish vanished' },
      { id: 'coins', x: 141, y: 304, r: 22, kind: 'added object', label: 'Coins appeared by the chest' },
      { id: 'bluefish', x: 320, y: 200, rx: 356, ry: 172, r: 22, kind: 'moved object', label: 'Blue fish swam away' },
      { id: 'coral', x: 60, y: 272, r: 30, kind: 'size change', label: 'Pink coral grew taller' },
      { id: 'flipper', x: 362, y: 116, r: 24, kind: 'flipped detail', label: 'Diver flipper flipped' },
      { id: 'bigfish', x: 250, y: 140, r: 30, kind: 'extra pattern', label: 'Big fish gained stripes' },
    ],
  },
  {
    id: 'observatory',
    name: 'Starlight Observatory',
    tag: 'Scene 3 — Hard · a night of small details',
    sky: ['#0d1b3e', '#1b2a52'],
    elements: [
      rect(0, 0, 520, 360, 'url(#sky)'),
      // Stars. One of them vanishes on the right.
      circle(40, 30, 2, '#ffffff'), circle(120, 24, 2.5, '#ffe66d'), circle(180, 44, 2, '#ffffff'),
      circle(240, 26, 2, '#ffffff'), circle(340, 30, 2.5, '#ffffff'), circle(420, 24, 2, '#ffe66d'),
      circle(480, 46, 2, '#ffffff'), circle(160, 90, 1.8, '#ffffff'), circle(270, 80, 2, '#ffffff'),
      circle(360, 90, 1.8, '#ffe66d'), circle(500, 90, 2, '#ffffff'), circle(90, 110, 1.8, '#ffffff'),
      circle(300, 60, 2.5, '#ffffff', { only: 'left', diff: 'star' }),
      // Moon. Diff: colour (pale -> gold).
      group([circle(80, 70, 24, '#f4f1de', { diff: 'moon', alt: circle(80, 70, 24, '#ffd166') }),
        circle(72, 64, 5, '#d8d3b8', { opacity: 0.7 }), circle(88, 76, 4, '#d8d3b8', { opacity: 0.7 })]),
      // Comet. Diff: added on the right.
      group([circle(430, 80, 5, '#ffffff'),
        path('M430 80 L470 52 L474 60 L436 88 Z', '#cfe8ff', { opacity: 0.8 })], { only: 'right', diff: 'comet' }),
      // Constellation, top right — a static detail, same on both panels.
      group([
        line(440, 140, 470, 120, '#8ecae6', 1.5), line(470, 120, 500, 140, '#8ecae6', 1.5),
        circle(440, 140, 3, '#ffffff'), circle(470, 120, 3, '#ffffff'), circle(500, 140, 3, '#ffffff'),
      ]),
      // Observatory dome and base.
      rect(300, 250, 140, 70, '#b7b7c9'),
      path('M300 250 A70 62 0 0 1 440 250 Z', '#e8e8f0'),
      rect(358, 196, 24, 54, '#2b2d42'),
      rect(330, 300, 26, 20, '#2b2d42'),
      circle(330, 210, 4, '#ffd166'), circle(410, 215, 4, '#ffd166'),
      // Telescope. Diff: tilted to a new angle on the right.
      group([
        group([rect(188, 216, 54, 12, '#4361ee', { rx: 6 }), circle(242, 222, 8, '#90e0ef')],
          { transform: 'rotate(18 200 222)' }),
        line(200, 232, 188, 280, '#8d99ae', 3), line(200, 232, 212, 280, '#8d99ae', 3), line(200, 232, 200, 282, '#8d99ae', 3),
      ], { diff: 'telescope', alt: group([
        group([rect(188, 216, 54, 12, '#4361ee', { rx: 6 }), circle(242, 222, 8, '#90e0ef')],
          { transform: 'rotate(-14 200 222)' }),
        line(200, 232, 188, 280, '#8d99ae', 3), line(200, 232, 212, 280, '#8d99ae', 3), line(200, 232, 200, 282, '#8d99ae', 3),
      ]) }),
      // Bookshelf with books. One book changes colour.
      rect(40, 252, 120, 88, '#6b4f2a'),
      rect(48, 278, 104, 4, '#4a3520'), rect(48, 306, 104, 4, '#4a3520'),
      rect(52, 256, 10, 22, '#e63946'), rect(64, 256, 10, 22, '#2a9d8f'), rect(76, 256, 10, 22, '#ffd166'),
      group([rect(88, 256, 10, 22, '#e63946')], { diff: 'book', alt: group([rect(88, 256, 10, 22, '#2a9d8f')]) }),
      rect(100, 256, 10, 22, '#9b5de5'), rect(112, 256, 10, 22, '#4cc9f0'),
      rect(52, 284, 10, 22, '#ff7b9c'), rect(64, 284, 10, 22, '#ffd166'), rect(76, 284, 10, 22, '#4361ee'),
      rect(88, 284, 10, 22, '#2a9d8f'), rect(100, 284, 10, 22, '#e63946'),
      // Planet poster. Diff: Saturn's ring grows on the right.
      group([
        rect(250, 252, 90, 68, '#f8f9fa', { stroke: '#8d99ae', 'stroke-width': 2 }),
        circle(295, 282, 12, '#e8a87c'),
        ellipse(295, 282, 22, 6, 'none', { stroke: '#c96a00', 'stroke-width': 2, fill: 'none' }),
        circle(268, 268, 3, '#4361ee'), circle(322, 268, 2.5, '#e63946'),
      ], { diff: 'ring', alt: group([
        rect(250, 252, 90, 68, '#f8f9fa', { stroke: '#8d99ae', 'stroke-width': 2 }),
        circle(295, 282, 12, '#e8a87c'),
        ellipse(295, 282, 32, 9, 'none', { stroke: '#c96a00', 'stroke-width': 2, fill: 'none' }),
        circle(268, 268, 3, '#4361ee'), circle(322, 268, 2.5, '#e63946'),
      ]) }),
      // Owl on a branch. Diff: one eye winks on the right.
      group([
        line(440, 268, 510, 268, '#6b4f2a', 4),
        ellipse(472, 244, 16, 20, '#7b5e3a'),
        circle(466, 238, 4, '#ffffff'), circle(478, 238, 4, '#ffffff'),
        circle(466, 238, 2, '#222222'), circle(478, 238, 2, '#222222'),
        poly('470,244 474,250 466,250', '#fb8500'),
      ], { diff: 'owl', alt: group([
        line(440, 268, 510, 268, '#6b4f2a', 4),
        ellipse(472, 244, 16, 20, '#7b5e3a'),
        circle(466, 238, 4, '#ffffff'), circle(478, 238, 4, '#ffffff'),
        circle(466, 238, 2, '#222222'),
        line(474, 238, 482, 238, '#222222', 2),
        poly('470,244 474,250 466,250', '#fb8500'),
      ]) }),
    ],
    diffs: [
      { id: 'moon', x: 80, y: 70, r: 30, kind: 'colour change', label: 'Moon turned gold' },
      { id: 'star', x: 300, y: 60, r: 16, kind: 'missing object', label: 'A star went out' },
      { id: 'telescope', x: 210, y: 224, r: 34, kind: 'moved object', label: 'Telescope tilted away' },
      { id: 'book', x: 93, y: 267, r: 20, kind: 'colour change', label: 'A book changed colour' },
      { id: 'owl', x: 472, y: 242, r: 24, kind: 'flipped detail', label: 'The owl winked' },
      { id: 'comet', x: 436, y: 76, r: 26, kind: 'added object', label: 'A comet streaked in' },
      { id: 'ring', x: 295, y: 282, r: 30, kind: 'size change', label: "Saturn's ring grew" },
    ],
  },
];
