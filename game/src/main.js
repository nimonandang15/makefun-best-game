// Orbital Drift — bootstrap, game loop and wiring. A slingshot puzzle:
// drag back from the ship, release to launch; gravity bends the probe;
// collect the shards, slip through the gate. 12 levels, 3 launches each.
import { LEVELS } from './levels.js';
import { freshState, loadLevel, awardLevelComplete } from './state.js';
import { stepProbe, liveBodies, previewPath, SHARD_RADIUS, PROBE_RADIUS, GATE_RADIUS } from './physics.js';
import { draw } from './render.js';
import { attachInput } from './input.js';
import { ensureAudio, setMuted, sfx } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const state = freshState();
try {
  state.best = Number(localStorage.getItem('orbital-drift-best') || 0);
} catch (e) { /* storage unavailable: best stays 0 */ }

let level = LEVELS[0];
let levelTime = 0;
let buttons = [];
let slowTimer = 0;
let launchedAt = 0;

function saveBest() {
  if (state.score > state.best) {
    state.best = state.score;
    try { localStorage.setItem('orbital-drift-best', String(state.best)); } catch (e) { /* ignore */ }
  }
}

function startLevel(i) {
  level = loadLevel(state, i);
  levelTime = 0;
  slowTimer = 0;
}

function endFlight(reason) {
  state.probe = null;
  state.trail = [];
  state.aim = null;
  if (reason === 'win') return;
  sfx.crash();
  if (state.launchesLeft > 0) {
    state.screen = 'aiming';
  } else {
    state.screen = 'gameOver';
    saveBest();
  }
}

function launch(vx, vy) {
  state.probe = { x: level.ship.x, y: level.ship.y, vx, vy };
  state.trail = [];
  state.launchesLeft -= 1;
  state.launchesUsed += 1;
  state.flightTime = 0;
  slowTimer = 0;
  launchedAt = performance.now();
  state.screen = 'flying';
  sfx.launch();
}

function aimVelocity(dragX, dragY) {
  let dx = level.ship.x - dragX;
  let dy = level.ship.y - dragY;
  const len = Math.hypot(dx, dy);
  const max = 260;
  if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
  return { vx: dx * 2.0, vy: dy * 2.0, len };
}

function update(dt) {
  levelTime += dt;
  if (state.screen !== 'flying' || !state.probe) return;
  state.flightTime += dt;
  const bodies = liveBodies(level, levelTime);
  const sub = 2;
  const sdt = dt / sub;
  for (let i = 0; i < sub; i++) {
    const r = stepProbe(state.probe, bodies, level.mines || [], sdt);
    if (r === 'crash' || r === 'lost') { endFlight(r); return; }
  }
  state.trail.push({ x: state.probe.x, y: state.probe.y });
  if (state.trail.length > 46) state.trail.shift();
  // Shards.
  for (let s = 0; s < level.shards.length; s++) {
    const sh = level.shards[s];
    if (!state.collected.has(s) &&
        Math.hypot(state.probe.x - sh.x, state.probe.y - sh.y) < SHARD_RADIUS + PROBE_RADIUS + 4) {
      state.collected.add(s);
      state.score += 100;
      state.levelScore += 100;
      sfx.collect();
    }
  }
  // Gate wins the level (shards are the star chase, not a lock).
  if (Math.hypot(state.probe.x - level.gate.x, state.probe.y - level.gate.y) < GATE_RADIUS) {
    sfx.gate();
    sfx.win();
    const res = awardLevelComplete(state);
    state.lastStars = res.stars;
    state.lastBonus = res.bonus;
    state.probe = null;
    state.trail = [];
    saveBest();
    return;
  }
  // Stalled probe or the 12 s fuel fuse ends the flight.
  const speed = Math.hypot(state.probe.vx, state.probe.vy);
  slowTimer = speed < 6 ? slowTimer + dt : 0;
  if (slowTimer > 3 || state.flightTime > 12) endFlight('fizzle');
}

function primaryAction() {
  ensureAudio();
  if (state.screen === 'title') { sfx.click(); startLevel(0); }
  else if (state.screen === 'levelComplete') {
    sfx.click();
    if (state.levelIndex + 1 < LEVELS.length) startLevel(state.levelIndex + 1);
    else { state.screen = 'victory'; }
  } else if (state.screen === 'gameOver') { sfx.click(); startLevel(state.levelIndex); }
  else if (state.screen === 'victory') { sfx.click(); startLevel(0); }
}

function handleClick(x, y) {
  ensureAudio();
  // Sound toggle in the HUD's top-right corner.
  if (y < 52 && x > 1010 && state.screen !== 'title') {
    state.muted = !state.muted;
    setMuted(state.muted);
    return;
  }
  for (const b of buttons) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      if (b.id === 'start') primaryAction();
      else if (b.id === 'next') primaryAction();
      else if (b.id === 'retry') { sfx.click(); startLevel(state.levelIndex); }
      else if (b.id === 'title') { sfx.click(); state.screen = 'title'; }
      else if (b.id === 'again') { sfx.click(); state.score = 0; state.stars.fill(0); startLevel(0); }
      return;
    }
  }
}

attachInput(canvas, {
  onAimStart(x, y) {
    ensureAudio();
    if (state.screen !== 'aiming') return;
    state.aim = { dragX: x, dragY: y, preview: [] };
  },
  onAimMove(x, y) {
    if (state.screen !== 'aiming' || !state.aim) return;
    state.aim.dragX = x;
    state.aim.dragY = y;
    const v = aimVelocity(x, y);
    state.aim.preview = v.len > 12 ? previewPath(level, v.vx, v.vy) : [];
  },
  onAimEnd(x, y) {
    if (state.screen !== 'aiming' || !state.aim) return;
    const v = aimVelocity(x, y);
    state.aim = null;
    if (v.len > 20) launch(v.vx, v.vy);
  },
  onClick(x, y) { handleClick(x, y); },
  onKey(key) {
    if (key === 'm' || key === 'M') {
      state.muted = !state.muted;
      setMuted(state.muted);
      return;
    }
    if (key === 'r' || key === 'R') {
      if (state.screen === 'aiming' || state.screen === 'flying') { sfx.click(); startLevel(state.levelIndex); }
      return;
    }
    if (key === 'Escape') { state.screen = 'title'; return; }
    if (key === 'Enter' || key === ' ') primaryAction();
  },
});

// Boot: title screen, unless a ?shot= stage was requested.
level = LEVELS[0];
applyShot(state, level);
level = LEVELS[state.levelIndex];

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  update(dt);
  const bodies = liveBodies(level, levelTime);
  buttons = draw(ctx, state, level, bodies, now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
