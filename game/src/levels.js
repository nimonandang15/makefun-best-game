// Orbital Drift — the 12 levels. Each level: a launch pad (ship), planets
// whose gravity bends the probe, star shards to collect, a gate to reach
// once every shard is taken, and hazards (mines, suns, black holes).
// mass is derived from radius so a level reads as one line per body.
// Every level is machine-checked solvable: tests/solve-levels.mjs (kept
// out of the repo) grid-searches launch angles until one wins.
function planet(x, y, r, color, extra = {}) {
  return { x, y, r, mass: r * r * 2.2, color, ...extra };
}
function blackHole(x, y) {
  return { x, y, r: 22, mass: 14000, color: '#000000', hole: true };
}
function sun(x, y, r) {
  return { x, y, r, mass: r * r * 1.4, color: '#ff9d2e', sun: true };
}

export const LEVELS = [
  {
    name: 'First Light',
    ship: { x: 140, y: 600 },
    launches: 3,
    planets: [planet(640, 360, 55, '#c96f3f')],
    shards: [{ x: 555, y: 560 }, { x: 820, y: 450 }],
    gate: { x: 1140, y: 130 },
  },
  {
    name: 'Twin Suns',
    ship: { x: 130, y: 620 },
    launches: 3,
    planets: [planet(450, 250, 46, '#e08a3c'), planet(860, 480, 46, '#4f8fd0')],
    shards: [{ x: 520, y: 600 }, { x: 840, y: 545 }, { x: 1015, y: 385 }],
    gate: { x: 1150, y: 120 },
  },
  {
    name: 'The Ring',
    ship: { x: 130, y: 130 },
    launches: 3,
    planets: [planet(640, 360, 72, '#b45a8e', { ring: true })],
    shards: [{ x: 450, y: 145 }, { x: 810, y: 265 }, { x: 1055, y: 500 }],
    gate: { x: 1150, y: 620 },
  },
  {
    name: 'Crosswind',
    ship: { x: 130, y: 620 },
    launches: 3,
    planets: [planet(400, 210, 42, '#4f8fd0'), planet(880, 520, 52, '#c96f3f')],
    mines: [{ x: 640, y: 360, r: 14 }],
    shards: [{ x: 420, y: 640 }, { x: 700, y: 655 }, { x: 1000, y: 630 }, { x: 880, y: 445 }],
    gate: { x: 1150, y: 620 },
  },
  {
    name: 'Slingshot',
    ship: { x: 130, y: 360 },
    launches: 3,
    planets: [planet(640, 360, 82, '#7a5fd0', { ring: true })],
    shards: [{ x: 400, y: 470 }, { x: 690, y: 515 }, { x: 945, y: 440 }],
    gate: { x: 1150, y: 360 },
  },
  {
    name: 'Minefield',
    ship: { x: 130, y: 620 },
    launches: 3,
    planets: [planet(430, 300, 48, '#4fae7d'), planet(880, 300, 48, '#e08a3c')],
    mines: [{ x: 640, y: 180, r: 14 }, { x: 640, y: 540, r: 14 }, { x: 640, y: 360, r: 14 }],
    shards: [{ x: 454, y: 606 }, { x: 707, y: 544 }, { x: 961, y: 413 }, { x: 1082, y: 260 }],
    gate: { x: 1150, y: 120 },
  },
  {
    name: 'Orbit Dance',
    ship: { x: 130, y: 620 },
    launches: 3,
    planets: [
      planet(640, 360, 40, '#4f8fd0', { orbit: { cx: 640, cy: 360, r: 190, speed: 0.45, phase: 0 } }),
      planet(1000, 180, 42, '#c96f3f'),
    ],
    shards: [{ x: 438, y: 611 }, { x: 742, y: 566 }, { x: 949, y: 464 }, { x: 1060, y: 339 }],
    gate: { x: 1150, y: 120 },
  },
  {
    name: 'The Maw',
    ship: { x: 130, y: 620 },
    launches: 3,
    planets: [blackHole(640, 360), planet(1020, 200, 40, '#4fae7d')],
    shards: [{ x: 400, y: 655 }, { x: 690, y: 665 }, { x: 975, y: 635 }, { x: 640, y: 480 }],
    gate: { x: 1150, y: 620 },
  },
  {
    name: 'Gauntlet',
    ship: { x: 120, y: 360 },
    launches: 3,
    planets: [planet(380, 200, 44, '#e08a3c'), planet(640, 520, 44, '#4f8fd0'), planet(900, 200, 44, '#7a5fd0')],
    mines: [{ x: 520, y: 360, r: 13 }, { x: 780, y: 360, r: 13 }],
    shards: [{ x: 344, y: 349 }, { x: 677, y: 209 }, { x: 967, y: 186 }, { x: 1082, y: 405 }, { x: 1116, y: 529 }],
    gate: { x: 1150, y: 620 },
  },
  {
    name: 'Twin Gates',
    ship: { x: 130, y: 130 },
    launches: 3,
    planets: [
      planet(500, 360, 52, '#b45a8e'),
      planet(900, 360, 52, '#4fae7d', { orbit: { cx: 900, cy: 360, r: 130, speed: -0.4, phase: 1.2 } }),
    ],
    mines: [{ x: 700, y: 130, r: 13 }],
    shards: [{ x: 274, y: 288 }, { x: 549, y: 416 }, { x: 808, y: 264 }, { x: 1030, y: 166 }],
    gate: { x: 1150, y: 120 },
  },
  {
    name: 'Solar Flare',
    ship: { x: 130, y: 620 },
    launches: 3,
    planets: [sun(640, 360, 88), planet(1080, 180, 40, '#4f8fd0')],
    shards: [{ x: 438, y: 609 }, { x: 782, y: 515 }, { x: 977, y: 374 }, { x: 1063, y: 294 }],
    gate: { x: 1150, y: 120 },
  },
  {
    name: 'Grand Tour',
    ship: { x: 130, y: 620 },
    launches: 3,
    planets: [
      planet(420, 240, 48, '#e08a3c'),
      blackHole(760, 480),
      planet(1020, 220, 44, '#7a5fd0', { orbit: { cx: 1020, cy: 220, r: 110, speed: 0.5, phase: 0 } }),
    ],
    mines: [{ x: 600, y: 560, r: 13 }, { x: 980, y: 560, r: 13 }],
    shards: [
      { x: 407, y: 641 }, { x: 703, y: 630 }, { x: 934, y: 470 },
      { x: 1033, y: 247 }, { x: 600, y: 320 }, { x: 1100, y: 300 },
    ],
    gate: { x: 1150, y: 120 },
  },
];
