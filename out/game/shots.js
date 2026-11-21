// shots.js — deterministic states for the maker's screenshots, the same
// pattern the kit starter uses (?shot=start / ?shot=play / ?shot=end).
// It only sets up a real game state through the game's own functions:
// which scene, how many differences are already found, how much time is
// left, whether a hint is pulsing, or the win screen. The timer is stopped
// so a screenshot never depends on the second it was taken.
//   ?shot=cover  — Coral Reef mid-play, 4 of 7 found, 2:30 left
//   ?shot=scene3 — Observatory mid-play, 2 of 7 found, 1:35 left
//   ?shot=hint   — Rooftop Garden, 1 of 7 found, a hint pulsing
//   ?shot=win    — the win screen after all 21 differences

function applyShot() {
  const shot = new URLSearchParams(window.location.search).get('shot');
  if (!shot) return;
  const G = window.GAME;
  const S = G.state;
  G.stopTimer();
  if (shot === 'cover') {
    S.sceneIdx = 1;
    S.timeLeft = 150;
    S.elapsed = 90;
    S.clicks = 5;
    S.hits = 4;
    ['yellowfish', 'starfish', 'coins', 'bluefish'].forEach(function (id) {
      S.found[1].add(id);
    });
    G.renderScene();
  } else if (shot === 'scene3') {
    S.sceneIdx = 2;
    S.timeLeft = 95;
    S.elapsed = 145;
    S.clicks = 3;
    S.hits = 2;
    ['moon', 'star'].forEach(function (id) {
      S.found[2].add(id);
    });
    G.renderScene();
  } else if (shot === 'hint') {
    S.sceneIdx = 0;
    S.timeLeft = 200;
    S.elapsed = 40;
    S.clicks = 2;
    S.hits = 1;
    S.found[0].add('sun');
    S.hintsLeft = 2;
    S.hintsUsed = 1;
    G.renderScene();
    // Pulse once right away, then re-pulse every two seconds so the
    // shot always catches the hint ring mid-breathe.
    const pulseHint = function () {
      const scene = SCENES[0];
      const remaining = scene.diffs.filter(function (d) { return !S.found[0].has(d.id); });
      if (!remaining.length) return;
      const pick = remaining[0];
      const left = document.querySelector('#panelLeft svg .hints');
      const right = document.querySelector('#panelRight svg .hints');
      if (left) addHintPulse(left, pick.x, pick.y, 1900);
      if (right) addHintPulse(right, pick.rx || pick.x, pick.ry || pick.y, 1900);
    };
    pulseHint();
    setInterval(pulseHint, 2000);
  } else if (shot === 'win') {
    SCENES.forEach(function (scene, i) {
      scene.diffs.forEach(function (d) { S.found[i].add(d.id); });
    });
    S.sceneIdx = 2;
    S.timeLeft = 63;
    S.elapsed = 177;
    S.clicks = 24;
    S.hits = 21;
    S.hintsLeft = 2;
    S.hintsUsed = 1;
    G.renderScene();
    G.showWinScreen();
  }
  // Park the keyboard crosshair out of the frame: the shots show the
  // mouse game, and the ring would read as a stray mark on a still image.
  document.querySelectorAll('#board .cursor').forEach(function (g) { g.innerHTML = ''; });
}

document.addEventListener('DOMContentLoaded', function () {
  // Run after game.js's own DOMContentLoaded handler has built the board.
  setTimeout(applyShot, 0);
});
