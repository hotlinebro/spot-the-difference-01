// game.js — the hunt itself: state, clicks, keyboard play, timer, hints,
// scene flow, the magnifier lens and the win screen. It wires the pictures
// render.js builds to the rules in scenes.js and the sounds in audio.js.

const TOTAL_TIME = 240; // seconds for the whole hunt, all three scenes
const WRONG_PENALTY = 5; // seconds lost on a wrong click
const SCENE_BONUS = 10; // seconds earned for clearing a scene
const HINTS_PER_GAME = 3;

const state = {
  sceneIdx: 0,
  found: [new Set(), new Set(), new Set()],
  clicks: 0,
  hits: 0,
  hintsLeft: HINTS_PER_GAME,
  hintsUsed: 0,
  timeLeft: TOTAL_TIME,
  elapsed: 0,
  running: false,
  won: false,
  over: false,
  cursor: { panel: 'left', x: 260, y: 180 },
  magnifier: false,
};

let timerId = null;
let leftPanel = null;
let rightPanel = null;
let advanceTimer = null;

function $(id) {
  return document.getElementById(id);
}

function currentScene() {
  return SCENES[state.sceneIdx];
}

function foundCount(sceneIdx) {
  return state.found[sceneIdx].size;
}

function totalFound() {
  return state.found[0].size + state.found[1].size + state.found[2].size;
}

function sceneComplete(sceneIdx) {
  return state.found[sceneIdx].size >= currentSceneCount(sceneIdx);
}

function currentSceneCount(sceneIdx) {
  return SCENES[sceneIdx].diffs.length;
}

// ---- HUD ----

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function updateHUD() {
  const scene = currentScene();
  $('sceneName').textContent = scene.name;
  $('sceneTag').textContent = scene.tag;
  $('counter').textContent = foundCount(state.sceneIdx) + '/' + scene.diffs.length + ' found';
  $('totalCounter').textContent = 'Total ' + totalFound() + '/21';
  $('timerText').textContent = fmtTime(Math.max(0, state.timeLeft));
  const fill = $('timerFill');
  fill.style.width = Math.max(0, (state.timeLeft / TOTAL_TIME) * 100) + '%';
  const wrap = $('timerWrap');
  wrap.classList.toggle('low', state.timeLeft <= 60);
  wrap.classList.toggle('critical', state.timeLeft <= 30);
  $('hintsCount').textContent = state.hintsLeft;
  $('hintsBtn').disabled = state.hintsLeft <= 0;
  document.querySelectorAll('.scene-tab').forEach(function (btn, i) {
    btn.classList.toggle('active', i === state.sceneIdx);
    btn.classList.toggle('done', sceneComplete(i));
  });
}

// ---- Rendering a scene ----

function renderScene() {
  const scene = currentScene();
  const left = buildPanel(scene, 'left');
  const right = buildPanel(scene, 'right');
  leftPanel = left;
  rightPanel = right;
  const pl = $('panelLeft');
  const pr = $('panelRight');
  pl.innerHTML = '';
  pr.innerHTML = '';
  pl.appendChild(left.svg);
  pr.appendChild(right.svg);
  // Re-draw the marks already earned in this scene.
  let n = 0;
  scene.diffs.forEach(function (diff) {
    if (state.found[state.sceneIdx].has(diff.id)) {
      n += 1;
      addFoundMark(left.markers, diff.x, diff.y, n);
      addFoundMark(right.markers, diff.rx || diff.x, diff.ry || diff.y, n);
    }
  });
  drawCursorOnActivePanel();
  updateHUD();
  refreshLensArt();
}

function drawCursorOnActivePanel() {
  if (!leftPanel || !rightPanel) return;
  leftPanel.cursor.innerHTML = '';
  rightPanel.cursor.innerHTML = '';
  const target = state.cursor.panel === 'left' ? leftPanel.cursor : rightPanel.cursor;
  drawCursor(target, state.cursor.x, state.cursor.y);
}

// ---- Clicking ----

function findDiffAt(x, y) {
  const scene = currentScene();
  for (const diff of scene.diffs) {
    if (state.found[state.sceneIdx].has(diff.id)) continue;
    const dLeft = Math.hypot(x - diff.x, y - diff.y);
    const rx = diff.rx || diff.x;
    const ry = diff.ry || diff.y;
    const dRight = Math.hypot(x - rx, y - ry);
    if (dLeft <= diff.r + 12 || dRight <= diff.r + 12) return diff;
  }
  return null;
}

function tryClick(panel, x, y) {
  if (!state.running || state.won || state.over) return;
  ensureAudio();
  state.clicks += 1;
  const diff = findDiffAt(x, y);
  if (diff) {
    state.hits += 1;
    state.found[state.sceneIdx].add(diff.id);
    const n = foundCount(state.sceneIdx);
    addFoundMark(leftPanel.markers, diff.x, diff.y, n);
    addFoundMark(rightPanel.markers, diff.rx || diff.x, diff.ry || diff.y, n);
    playChime();
    updateHUD();
    if (sceneComplete(state.sceneIdx)) {
      onSceneCleared();
    }
  } else {
    const markers = panel === 'left' ? leftPanel.markers : rightPanel.markers;
    addMissMark(markers, x, y);
    playBuzz();
    state.timeLeft = Math.max(0, state.timeLeft - WRONG_PENALTY);
    $('timerWrap').classList.add('penalty');
    setTimeout(function () { $('timerWrap').classList.remove('penalty'); }, 500);
    updateHUD();
    if (state.timeLeft <= 0) onTimeUp();
  }
}

function onSceneCleared() {
  playSceneClear();
  state.timeLeft = Math.min(TOTAL_TIME, state.timeLeft + SCENE_BONUS);
  showToast(currentScene().name + ' complete! +' + SCENE_BONUS + 's bonus');
  updateHUD();
  if (totalFound() >= 21) {
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(showWinScreen, 900);
    return;
  }
  const next = SCENES.findIndex(function (s, i) { return !sceneComplete(i); });
  if (next >= 0 && next !== state.sceneIdx) {
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(function () { switchScene(next); }, 1500);
  }
}

function switchScene(i) {
  if (i < 0 || i > 2 || i === state.sceneIdx) return;
  state.sceneIdx = i;
  state.cursor.panel = 'left';
  renderScene();
}

// ---- Hints ----

function useHint() {
  if (!state.running || state.won || state.over) return false;
  if (state.hintsLeft <= 0) {
    $('hintsBtn').classList.add('shake');
    setTimeout(function () { $('hintsBtn').classList.remove('shake'); }, 400);
    return false;
  }
  const scene = currentScene();
  const remaining = scene.diffs.filter(function (d) { return !state.found[state.sceneIdx].has(d.id); });
  if (remaining.length === 0) return false;
  const pick = remaining[Math.floor(Math.random() * remaining.length)];
  addHintPulse(leftPanel.hints, pick.x, pick.y, 2200);
  addHintPulse(rightPanel.hints, pick.rx || pick.x, pick.ry || pick.y, 2200);
  state.hintsLeft -= 1;
  state.hintsUsed += 1;
  updateHUD();
  return true;
}

// ---- Timer ----

function startTimer() {
  stopTimer();
  state.running = true;
  timerId = setInterval(function () {
    if (!state.running) return;
    state.timeLeft -= 1;
    state.elapsed += 1;
    if (state.timeLeft > 0 && state.timeLeft <= 10) playTick();
    updateHUD();
    if (state.timeLeft <= 0) onTimeUp();
  }, 1000);
}

function stopTimer() {
  state.running = false;
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function onTimeUp() {
  stopTimer();
  state.over = true;
  showGameOver();
}

// ---- Overlays ----

function showToast(msg) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function () { toast.classList.remove('show'); }, 1800);
}

function starCount() {
  const acc = state.hits / Math.max(1, state.clicks);
  if (acc >= 0.9 && state.hintsUsed <= 1) return 3;
  if (acc >= 0.75) return 2;
  return 1;
}

function showWinScreen() {
  stopTimer();
  state.won = true;
  playWinFanfare();
  const acc = Math.round((state.hits / Math.max(1, state.clicks)) * 100);
  $('overlayTitle').textContent = 'You found all 21 differences!';
  $('overlayStats').innerHTML =
    '<div>Time: ' + fmtTime(state.elapsed) + ' &nbsp;·&nbsp; Accuracy: ' + acc + '% (' + state.hits + '/' + state.clicks + ' clicks)</div>' +
    '<div>Hints used: ' + state.hintsUsed + ' &nbsp;·&nbsp; Time left: ' + fmtTime(state.timeLeft) + '</div>' +
    '<div class="stars">' + '★'.repeat(starCount()) + '☆'.repeat(3 - starCount()) + '</div>' +
    '<div class="sub">Three worlds, twenty-one differences, one sharp eye.</div>';
  $('overlay').classList.remove('hidden');
}

function showGameOver() {
  $('overlayTitle').textContent = "Time's up — " + totalFound() + '/21 found';
  $('overlayStats').innerHTML =
    '<div>You found ' + totalFound() + ' of 21 differences across the three scenes.</div>' +
    '<div class="sub">Wrong clicks cost 5 seconds. Play again and beat it.</div>';
  $('overlay').classList.remove('hidden');
}

function resetGame() {
  clearTimeout(advanceTimer);
  state.sceneIdx = 0;
  state.found = [new Set(), new Set(), new Set()];
  state.clicks = 0;
  state.hits = 0;
  state.hintsLeft = HINTS_PER_GAME;
  state.hintsUsed = 0;
  state.timeLeft = TOTAL_TIME;
  state.elapsed = 0;
  state.won = false;
  state.over = false;
  state.cursor = { panel: 'left', x: 260, y: 180 };
  $('overlay').classList.add('hidden');
  renderScene();
  startTimer();
}

// ---- Magnifier lens ----

let lensArt = { left: null, right: null };

function refreshLensArt() {
  const scene = currentScene();
  lensArt.left = buildBaseSVG(scene, 'left');
  lensArt.right = buildBaseSVG(scene, 'right');
}

function moveLens(clientX, clientY, panel, svg) {
  const lens = $('lens');
  const inner = $('lensInner');
  if (!state.magnifier) {
    lens.classList.add('hidden');
    return;
  }
  const pt = svgPoint(svg, clientX, clientY);
  const art = panel === 'left' ? lensArt.left : lensArt.right;
  inner.innerHTML = '';
  const clone = art.cloneNode(true);
  clone.setAttribute('width', '1040');
  clone.setAttribute('height', '720');
  inner.appendChild(clone);
  inner.style.transform = 'translate(' + (-(pt.x * 2 - 90)) + 'px,' + (-(pt.y * 2 - 90)) + 'px)';
  lens.style.left = Math.min(window.innerWidth - 200, clientX + 24) + 'px';
  lens.style.top = Math.max(8, clientY - 100) + 'px';
  lens.classList.remove('hidden');
}

function hideLens() {
  $('lens').classList.add('hidden');
}

// ---- Input wiring ----

function bindPanel(panelEl, panelName) {
  panelEl.addEventListener('click', function (ev) {
    const svg = panelEl.querySelector('svg');
    const pt = svgPoint(svg, ev.clientX, ev.clientY);
    state.cursor = { panel: panelName, x: pt.x, y: pt.y };
    drawCursorOnActivePanel();
    tryClick(panelName, pt.x, pt.y);
  });
  panelEl.addEventListener('mousemove', function (ev) {
    const svg = panelEl.querySelector('svg');
    moveLens(ev.clientX, ev.clientY, panelName, svg);
  });
  panelEl.addEventListener('mouseleave', hideLens);
}

function bindKeys() {
  document.addEventListener('keydown', function (ev) {
    if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA')) return;
    const step = ev.shiftKey ? 42 : 14;
    let handled = true;
    if (ev.key === 'ArrowLeft') state.cursor.x = Math.max(10, state.cursor.x - step);
    else if (ev.key === 'ArrowRight') state.cursor.x = Math.min(VIEW_W - 10, state.cursor.x + step);
    else if (ev.key === 'ArrowUp') state.cursor.y = Math.max(10, state.cursor.y - step);
    else if (ev.key === 'ArrowDown') state.cursor.y = Math.min(VIEW_H - 10, state.cursor.y + step);
    else if (ev.key === 'Tab') { state.cursor.panel = state.cursor.panel === 'left' ? 'right' : 'left'; ev.preventDefault(); }
    else if (ev.key === 'Enter' || ev.key === ' ') { tryClick(state.cursor.panel, state.cursor.x, state.cursor.y); }
    else if (ev.key === '1') switchScene(0);
    else if (ev.key === '2') switchScene(1);
    else if (ev.key === '3') switchScene(2);
    else if (ev.key === 'h' || ev.key === 'H') useHint();
    else if (ev.key === 'l' || ev.key === 'L') toggleMagnifier();
    else if (ev.key === 'm' || ev.key === 'M') toggleSound();
    else if ((ev.key === 'r' || ev.key === 'R') && (state.won || state.over)) resetGame();
    else handled = false;
    if (handled) {
      drawCursorOnActivePanel();
      if (ev.key === ' ' || ev.key === 'Enter') ev.preventDefault();
    }
  });
}

function toggleMagnifier() {
  state.magnifier = !state.magnifier;
  $('magBtn').classList.toggle('on', state.magnifier);
  $('magBtn').textContent = state.magnifier ? 'Magnifier: ON (L)' : 'Magnifier: OFF (L)';
  if (!state.magnifier) hideLens();
}

function toggleSound() {
  setMuted(!isMuted());
  $('soundBtn').textContent = isMuted() ? 'Sound: OFF (M)' : 'Sound: ON (M)';
}

function init() {
  document.querySelectorAll('.scene-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchScene(Number(btn.dataset.scene));
    });
  });
  $('hintsBtn').addEventListener('click', useHint);
  $('magBtn').addEventListener('click', toggleMagnifier);
  $('soundBtn').addEventListener('click', toggleSound);
  $('replayBtn').addEventListener('click', resetGame);
  bindPanel($('panelLeft'), 'left');
  bindPanel($('panelRight'), 'right');
  bindKeys();
  renderScene();
  startTimer();
  drawCursorOnActivePanel();
}

document.addEventListener('DOMContentLoaded', init);

// Shots and tests drive the game through this handle.
window.GAME = {
  state: state,
  renderScene: renderScene,
  switchScene: switchScene,
  useHint: useHint,
  stopTimer: stopTimer,
  startTimer: startTimer,
  showWinScreen: showWinScreen,
  showGameOver: showGameOver,
  resetGame: resetGame,
  tryClick: tryClick,
};
