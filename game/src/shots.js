// Orbital Drift — screenshot staging, the same trick the kit's starter
// uses: ?shot=start|play|win|over puts the game in a real state so the
// screenshots show the whole loop (title, mid-flight, level clear,
// out of launches). Every staged state is reachable by playing.
import { stepProbe, liveBodies, SHARD_RADIUS, PROBE_RADIUS, GATE_RADIUS } from './physics.js';
import { loadLevel, awardLevelComplete } from './state.js';

export function applyShot(state, level) {
  const q = new URLSearchParams(window.location.search).get('shot');
  if (!q) return level;
  if (q === 'start') {
    state.screen = 'title';
    state.stars = [3, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    state.best = 12450;
    return level;
  }
  if (q === 'play') {
    const lvl = loadLevel(state, 3); // Crosswind, mid-flight.
    state.screen = 'flying';
    const a = (6 * Math.PI) / 180;
    state.probe = { x: lvl.ship.x, y: lvl.ship.y, vx: Math.cos(a) * 525, vy: Math.sin(a) * 525 };
    state.trail = [];
    const bodies = liveBodies(lvl, 0);
    const dt = 1 / 120;
    for (let i = 0; i < 60 * 3.2; i++) {
      const r = stepProbe(state.probe, bodies, lvl.mines || [], dt);
      if (i % 2 === 0) state.trail.push({ x: state.probe.x, y: state.probe.y });
      if (state.trail.length > 46) state.trail.shift();
      for (let s = 0; s < lvl.shards.length; s++) {
        const sh = lvl.shards[s];
        if (Math.hypot(state.probe.x - sh.x, state.probe.y - sh.y) < SHARD_RADIUS + PROBE_RADIUS + 4) {
          state.collected.add(s);
        }
      }
      if (r !== 'ok') break;
    }
    return lvl;
  }
  if (q === 'win') {
    const lvl = loadLevel(state, 2); // The Ring, just cleared.
    lvl.shards.forEach((_, i) => state.collected.add(i));
    state.launchesUsed = 1;
    state.launchesLeft = 2;
    state.score = 4850;
    state.levelScore = 1250;
    const res = awardLevelComplete(state);
    state.lastStars = res.stars;
    state.lastBonus = res.bonus;
    return lvl;
  }
  if (q === 'over') {
    const lvl = loadLevel(state, 4); // Slingshot, out of launches.
    state.launchesLeft = 0;
    state.launchesUsed = 3;
    state.score = 3120;
    state.screen = 'gameOver';
    return lvl;
  }
  return level;
}
