// Orbital Drift — sound: tiny WebAudio synth, no audio files.
// Every effect is an oscillator sweep so the game ships zero assets.
let ctx = null;
let muted = false;

export function setMuted(m) {
  muted = m;
}

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function tone(freq, dur, type = 'sine', vol = 0.12, slideTo = null, delay = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export const sfx = {
  launch() { tone(300, 0.35, 'sawtooth', 0.07, 90); tone(520, 0.18, 'sine', 0.08, 880); },
  collect() { tone(880, 0.12, 'sine', 0.1); tone(1318, 0.18, 'sine', 0.1, null, 0.07); },
  crash() { tone(160, 0.4, 'square', 0.1, 40); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'sine', 0.11, null, i * 0.09)); },
  lose() { tone(220, 0.5, 'triangle', 0.1, 110); tone(110, 0.6, 'triangle', 0.08, 55, 0.15); },
  click() { tone(660, 0.06, 'sine', 0.06); },
  gate() { tone(392, 0.3, 'sine', 0.1, 784); },
};
