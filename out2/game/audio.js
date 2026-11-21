// audio.js — every sound is synthesised with WebAudio. No audio files,
// no network: a few oscillators and a gain envelope per effect.
let audioCtx = null;
let muted = false;

function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function setMuted(value) {
  muted = value;
}

function isMuted() {
  return muted;
}

// One note: oscillator + gain envelope, start now, fade by duration.
function tone(freq, dur, type, gain, delay) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime + (delay || 0);
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain || 0.12, t0 + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// A found difference: a bright two-note chime, rising.
function playChime() {
  tone(659.25, 0.16, 'sine', 0.14, 0);
  tone(987.77, 0.28, 'sine', 0.12, 0.09);
}

// A wrong click: a low, dull buzz.
function playBuzz() {
  tone(110, 0.22, 'sawtooth', 0.07, 0);
  tone(82.4, 0.22, 'square', 0.04, 0);
}

// A scene cleared: three quick notes up.
function playSceneClear() {
  tone(523.25, 0.14, 'triangle', 0.12, 0);
  tone(659.25, 0.14, 'triangle', 0.12, 0.11);
  tone(783.99, 0.26, 'triangle', 0.12, 0.22);
}

// The whole game won: a short arpeggio.
function playWinFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach(function (freq, i) {
    tone(freq, 0.3, 'triangle', 0.12, i * 0.12);
  });
}

// A soft tick for the last ten seconds.
function playTick() {
  tone(880, 0.05, 'square', 0.03, 0);
}
