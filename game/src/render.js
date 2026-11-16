// Orbital Drift — rendering: everything on one canvas, procedural art only.
// No images, no fonts, no network: gradients, starfields and shapes.
import { LEVELS } from './levels.js';
import { GATE_RADIUS, SHARD_RADIUS } from './physics.js';

const W = 1280;
const H = 720;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const starCache = new Map();
function starsFor(levelIndex) {
  if (!starCache.has(levelIndex)) {
    const rnd = mulberry32(1234 + levelIndex * 97);
    const stars = [];
    for (let i = 0; i < 220; i++) {
      stars.push({ x: rnd() * W, y: rnd() * H, r: 0.4 + rnd() * 1.6, tw: rnd() * Math.PI * 2, sp: 0.4 + rnd() * 1.2 });
    }
    starCache.set(levelIndex, stars);
  }
  return starCache.get(levelIndex);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function button(ctx, id, x, y, w, h, label, accent = '#6ee7ff') {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 18, 40, 0.85)';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#eaf6ff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.restore();
  return { id, x, y, w, h };
}

function drawBackground(ctx, t, levelIndex) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#070a1d');
  g.addColorStop(0.55, '#0d1030');
  g.addColorStop(1, '#1c0b33');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Nebula blobs.
  const neb = (x, y, r, color) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, color);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  neb(200, 140, 260, 'rgba(122, 95, 208, 0.16)');
  neb(1080, 560, 300, 'rgba(79, 143, 208, 0.12)');
  neb(640, 640, 240, 'rgba(255, 110, 199, 0.07)');
  // Stars.
  for (const s of starsFor(levelIndex)) {
    const a = 0.35 + 0.65 * Math.abs(Math.sin(t * s.sp + s.tw));
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlanet(ctx, b, t) {
  ctx.save();
  ctx.translate(b.x, b.y);
  if (b.hole) {
    // Black hole: accretion disc + dark core.
    ctx.rotate(Math.sin(t * 0.4) * 0.08);
    const disc = ctx.createLinearGradient(-b.r * 3.2, 0, b.r * 3.2, 0);
    disc.addColorStop(0, 'rgba(255, 170, 80, 0)');
    disc.addColorStop(0.5, 'rgba(255, 170, 80, 0.9)');
    disc.addColorStop(1, 'rgba(255, 170, 80, 0)');
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.ellipse(0, 0, b.r * 3.2, b.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 190, 120, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, b.r + 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const g = ctx.createRadialGradient(-b.r * 0.35, -b.r * 0.35, b.r * 0.1, 0, 0, b.r);
  g.addColorStop(0, lighten(b.color));
  g.addColorStop(0.55, b.color);
  g.addColorStop(1, '#0a0618');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, b.r, 0, Math.PI * 2);
  ctx.fill();
  if (b.sun) {
    ctx.strokeStyle = 'rgba(255, 157, 46, 0.5)';
    ctx.lineWidth = 10 + Math.sin(t * 2) * 3;
    ctx.beginPath();
    ctx.arc(0, 0, b.r + 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (b.ring) {
    ctx.strokeStyle = 'rgba(234, 246, 255, 0.55)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, 0, b.r * 1.7, b.r * 0.45, -0.35, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function lighten(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + 90);
  const g = Math.min(255, ((n >> 8) & 255) + 90);
  const b = Math.min(255, (n & 255) + 90);
  return `rgb(${r},${g},${b})`;
}

function drawMine(ctx, m, t) {
  ctx.save();
  ctx.translate(m.x, m.y);
  const pulse = 1 + Math.sin(t * 3 + m.x) * 0.15;
  ctx.scale(pulse, pulse);
  // Spikes.
  ctx.strokeStyle = '#ff5d5d';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + t * 0.3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * m.r * 0.7, Math.sin(a) * m.r * 0.7);
    ctx.lineTo(Math.cos(a) * (m.r + 7), Math.sin(a) * (m.r + 7));
    ctx.stroke();
  }
  ctx.fillStyle = '#2a0d12';
  ctx.shadowColor = '#ff2e2e';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(0, 0, m.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ff5d5d';
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawShard(ctx, s, t, taken) {
  if (taken) return;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(t * 1.2);
  const pulse = 1 + Math.sin(t * 3 + s.x) * 0.12;
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#ffd76b';
  ctx.shadowColor = '#ffb52e';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(0, -SHARD_RADIUS);
  ctx.lineTo(SHARD_RADIUS * 0.55, 0);
  ctx.lineTo(0, SHARD_RADIUS);
  ctx.lineTo(-SHARD_RADIUS * 0.55, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGate(ctx, gate, t, open) {
  ctx.save();
  ctx.translate(gate.x, gate.y);
  const pulse = 1 + Math.sin(t * 2.4) * 0.08;
  ctx.scale(pulse, pulse);
  ctx.strokeStyle = open ? '#7dffa8' : 'rgba(125, 255, 168, 0.45)';
  ctx.lineWidth = 5;
  ctx.shadowColor = '#3dff8e';
  ctx.shadowBlur = open ? 22 : 8;
  ctx.beginPath();
  ctx.arc(0, 0, GATE_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(t * 0.8);
  ctx.strokeStyle = open ? '#d8ffe6' : 'rgba(216, 255, 230, 0.5)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, GATE_RADIUS - 9, (i * Math.PI * 2) / 3, (i * Math.PI * 2) / 3 + 1.1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawShip(ctx, ship, t) {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(Math.sin(t * 1.5) * 0.05);
  ctx.fillStyle = '#eaf6ff';
  ctx.strokeStyle = '#6ee7ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#6ee7ff';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-12, -11);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-12, 11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Launch pad ring.
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(110, 231, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(0, 0, 26 + Math.sin(t * 2) * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawProbe(ctx, probe, trail) {
  ctx.save();
  for (let i = 0; i < trail.length; i++) {
    const p = trail[i];
    const a = (i / trail.length) * 0.55;
    ctx.fillStyle = `rgba(110, 231, 255, ${a.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2 + (i / trail.length) * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.translate(probe.x, probe.y);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#6ee7ff';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAim(ctx, state, level) {
  const a = state.aim;
  if (!a || !a.preview) return;
  ctx.save();
  // Slingshot band from the ship to the drag point.
  ctx.strokeStyle = 'rgba(234, 246, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(level.ship.x, level.ship.y);
  ctx.lineTo(a.dragX, a.dragY);
  ctx.stroke();
  // Dotted predicted path.
  ctx.fillStyle = '#6ee7ff';
  for (let i = 0; i < a.preview.length; i++) {
    const p = a.preview[i];
    ctx.globalAlpha = Math.max(0.15, 0.9 - i / a.preview.length);
    ctx.beginPath();
    ctx.arc(p.x, p.y, i % 4 === 0 ? 3.5 : 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHUD(ctx, state, level) {
  ctx.save();
  ctx.fillStyle = 'rgba(6, 10, 28, 0.72)';
  roundRect(ctx, 0, 0, W, 52, 0);
  ctx.fill();
  ctx.fillStyle = '#eaf6ff';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`LEVEL ${state.levelIndex + 1} · ${level.name}`, 18, 27);
  // Launches as rockets.
  for (let i = 0; i < level.launches; i++) {
    ctx.fillStyle = i < state.launchesLeft ? '#6ee7ff' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(430 + i * 30, 26, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd76b';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(`◆ ${state.collected.size}/${level.shards.length}`, 540, 27);
  ctx.fillStyle = '#eaf6ff';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE ${state.score}`, 1010, 27);
  ctx.fillStyle = state.muted ? 'rgba(255,255,255,0.45)' : '#eaf6ff';
  ctx.fillText(state.muted ? 'SOUND OFF [M]' : 'SOUND ON [M]', 1262, 27);
  ctx.textAlign = 'left';
  if (state.screen === 'aiming') {
    ctx.fillStyle = 'rgba(234, 246, 255, 0.85)';
    ctx.font = '18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Drag back from the ship to aim — release to launch  ·  R restarts the level', W / 2, 690);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

function panel(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(6, 10, 28, 0.88)';
  ctx.strokeStyle = 'rgba(110, 231, 255, 0.6)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawStars(ctx, cx, y, stars) {
  ctx.save();
  ctx.font = '44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < stars ? '#ffd76b' : 'rgba(255,255,255,0.18)';
    ctx.fillText('★', cx + (i - 1) * 56, y);
  }
  ctx.restore();
}

export function draw(ctx, state, level, bodies, t) {
  const buttons = [];
  drawBackground(ctx, t, state.levelIndex);
  if (state.screen === 'title') {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#eaf6ff';
    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.shadowColor = '#6ee7ff';
    ctx.shadowBlur = 30;
    ctx.fillText('ORBITAL DRIFT', W / 2, 170);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#6ee7ff';
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText('a slingshot puzzle in deep space', W / 2, 220);
    ctx.fillStyle = 'rgba(234, 246, 255, 0.9)';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Drag to aim, release to launch. Gravity bends your probe —', W / 2, 300);
    ctx.fillText('collect every shard, then slip through the gate. 3 launches per level.', W / 2, 330);
    ctx.fillText('12 levels · mines, suns and black holes wait between you and the gate', W / 2, 360);
    // Level dots with earned stars.
    for (let i = 0; i < LEVELS.length; i++) {
      const x = W / 2 - 11 * 34 + i * 34;
      ctx.fillStyle = state.stars[i] > 0 ? '#ffd76b' : 'rgba(255,255,255,0.25)';
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText(state.stars[i] > 0 ? '★' : '○', x, 430);
      ctx.fillStyle = 'rgba(234,246,255,0.6)';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(String(i + 1), x, 458);
    }
    ctx.restore();
    buttons.push(button(ctx, 'start', W / 2 - 110, 500, 220, 56, '▶  START', '#7dffa8'));
    ctx.save();
    ctx.fillStyle = 'rgba(234, 246, 255, 0.6)';
    ctx.font = '16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.best > 0 ? `Best score: ${state.best}` : 'No flights logged yet — good luck, pilot', W / 2, 600);
    ctx.restore();
    return buttons;
  }

  for (const b of bodies) drawPlanet(ctx, b, t);
  for (const m of level.mines || []) drawMine(ctx, m, t);
  const gateOpen = state.collected.size === level.shards.length;
  drawGate(ctx, level.gate, t, gateOpen);
  level.shards.forEach((s, i) => drawShard(ctx, s, t, state.collected.has(i)));
  drawShip(ctx, level.ship, t);
  if (state.probe) drawProbe(ctx, state.probe, state.trail);
  if (state.screen === 'aiming') drawAim(ctx, state, level);
  drawHUD(ctx, state, level);

  if (state.screen === 'levelComplete') {
    panel(ctx, 390, 180, 500, 330);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7dffa8';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText('LEVEL CLEAR', W / 2, 240);
    drawStars(ctx, W / 2, 300, state.lastStars || 1);
    ctx.fillStyle = '#eaf6ff';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(`Launch bonus  +${state.lastBonus || 0}`, W / 2, 360);
    ctx.fillText(`Score  ${state.score}`, W / 2, 392);
    ctx.restore();
    buttons.push(button(ctx, 'next', W / 2 - 110, 430, 220, 52, 'NEXT LEVEL ▶', '#7dffa8'));
  } else if (state.screen === 'gameOver') {
    panel(ctx, 390, 180, 500, 330);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff7d7d';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText('OUT OF LAUNCHES', W / 2, 240);
    ctx.fillStyle = '#eaf6ff';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(`${level.name} keeps its secrets — for now.`, W / 2, 300);
    ctx.fillText(`Score  ${state.score}`, W / 2, 340);
    ctx.restore();
    buttons.push(button(ctx, 'retry', W / 2 - 230, 430, 200, 52, '↻  RETRY', '#ffd76b'));
    buttons.push(button(ctx, 'title', W / 2 + 30, 430, 200, 52, 'TITLE', '#6ee7ff'));
  } else if (state.screen === 'victory') {
    panel(ctx, 340, 150, 600, 380);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd76b';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.shadowColor = '#ffd76b';
    ctx.shadowBlur = 24;
    ctx.fillText('GRAND TOUR COMPLETE', W / 2, 220);
    ctx.shadowBlur = 0;
    const totalStars = state.stars.reduce((a, b) => a + b, 0);
    drawStars(ctx, W / 2, 290, 3);
    ctx.fillStyle = '#eaf6ff';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(`${totalStars} / 36 stars  ·  Final score  ${state.score}`, W / 2, 350);
    ctx.fillText('Every gate reached. The drift is yours, pilot.', W / 2, 385);
    ctx.restore();
    buttons.push(button(ctx, 'again', W / 2 - 110, 440, 220, 52, '↻  PLAY AGAIN', '#7dffa8'));
  }
  return buttons;
}
