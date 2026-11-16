// Orbital Drift — physics: gravity, trajectory prediction, collisions.
// Pure functions, no DOM: the same code runs in the browser and in the
// Node solvability test (tests/solve-levels.mjs, kept out of the repo).
export const GRAVITY = 1200;
export const MAX_SPEED = 560;
export const PROBE_RADIUS = 7;
export const SHARD_RADIUS = 11;
export const GATE_RADIUS = 26;

// A planet's pull: a = G * mass / d^2 toward its centre, capped near the
// surface so a probe skimming a planet does not explode numerically.
export function gravityAt(x, y, bodies) {
  let ax = 0;
  let ay = 0;
  for (const b of bodies) {
    const dx = b.x - x;
    const dy = b.y - y;
    const d2 = dx * dx + dy * dy;
    const minD = Math.max(b.r * 0.9, 12);
    const d = Math.max(Math.sqrt(d2), minD);
    const a = (GRAVITY * b.mass) / (d * d);
    ax += (a * dx) / d;
    ay += (a * dy) / d;
  }
  return { ax, ay };
}

// One fixed step. Returns 'ok', 'crash' (hit a planet, mine or sun) or
// 'lost' (flew far out of the arena).
export function stepProbe(p, bodies, mines, dt) {
  const { ax, ay } = gravityAt(p.x, p.y, bodies);
  p.vx += ax * dt;
  p.vy += ay * dt;
  const speed = Math.hypot(p.vx, p.vy);
  if (speed > MAX_SPEED) {
    p.vx = (p.vx / speed) * MAX_SPEED;
    p.vy = (p.vy / speed) * MAX_SPEED;
  }
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  for (const b of bodies) {
    if (Math.hypot(p.x - b.x, p.y - b.y) < b.r + PROBE_RADIUS - 2) return 'crash';
  }
  for (const m of mines) {
    if (Math.hypot(p.x - m.x, p.y - m.y) < m.r + PROBE_RADIUS) return 'crash';
  }
  if (p.x < -260 || p.x > 1540 || p.y < -260 || p.y > 980) return 'lost';
  return 'ok';
}

// Simulate a launch without touching game state. Returns the path plus
// which shards were collected and whether the gate was reached. The gate
// alone wins the level; shards are the 3-star chase, collected on the
// same flight. A flight fizzles after 12 s (the in-game fuel fuse).
export function simulate(level, vx, vy, maxSteps = 60 * 12) {
  const p = { x: level.ship.x, y: level.ship.y, vx, vy };
  const bodies = liveBodies(level, 0);
  const collected = new Set();
  const path = [];
  const dt = 1 / 120;
  for (let i = 0; i < maxSteps; i++) {
    const r = stepProbe(p, bodies, level.mines || [], dt);
    if (i % 4 === 0) path.push({ x: p.x, y: p.y });
    for (let s = 0; s < level.shards.length; s++) {
      const sh = level.shards[s];
      if (!collected.has(s) && Math.hypot(p.x - sh.x, p.y - sh.y) < SHARD_RADIUS + PROBE_RADIUS + 4) {
        collected.add(s);
      }
    }
    if (Math.hypot(p.x - level.gate.x, p.y - level.gate.y) < GATE_RADIUS) {
      return { won: true, collected: collected.size, steps: i, path };
    }
    if (r !== 'ok') return { won: false, collected: collected.size, steps: i, path, end: r };
    if (Math.hypot(p.vx, p.vy) < 6 && i > 60 * 3) return { won: false, collected: collected.size, steps: i, path, end: 'stalled' };
  }
  return { won: false, collected: collected.size, steps: maxSteps, path, end: 'timeout' };
}

// Bodies with their current positions: static planets sit still, orbiting
// ones move around their centre at a fixed angular speed.
export function liveBodies(level, t) {
  return (level.planets || []).map((pl) => {
    if (!pl.orbit) return { ...pl };
    const a = pl.orbit.phase + t * pl.orbit.speed;
    return {
      ...pl,
      x: pl.orbit.cx + Math.cos(a) * pl.orbit.r,
      y: pl.orbit.cy + Math.sin(a) * pl.orbit.r,
    };
  });
}

// Aim preview: dotted path from the ship at the given launch velocity.
export function previewPath(level, vx, vy, steps = 150) {
  const p = { x: level.ship.x, y: level.ship.y, vx, vy };
  const bodies = liveBodies(level, 0);
  const pts = [];
  const dt = 1 / 60;
  for (let i = 0; i < steps; i++) {
    const r = stepProbe(p, bodies, level.mines || [], dt);
    if (i % 3 === 0) pts.push({ x: p.x, y: p.y });
    if (r !== 'ok') break;
  }
  return pts;
}
